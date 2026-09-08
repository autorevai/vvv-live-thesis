import { NextResponse } from "next/server";
import { getAllRanges } from "@/lib/sources/coingecko";
import { getChainState } from "@/lib/sources/chain";
import { getVeniceStats } from "@/lib/sources/venice";
import { DAY_ZERO } from "@/lib/constants";

export const revalidate = 900;

export type HistoryPoint = {
  t: number;
  vvvPrice: number | null;
  vvvCap: number | null;
  taoCap: number | null;
  nearCap: number | null;
  zecCap: number | null;
  vvvIndex: number | null;
  taoIndex: number | null;
  nearIndex: number | null;
  zecIndex: number | null;
};

export type HistoryPayload = {
  points: HistoryPoint[];
  freeFloat: number;
  dayZeroMs: number;
  generatedAt: number;
};

export async function GET() {
  try {
    const [ranges, chain, venice] = await Promise.all([
      getAllRanges(900),
      getChainState(300),
      getVeniceStats(60),
    ]);

    // Free float moves slowly (13.60M at Day 0, and it is read live below).
    // The historical cap series holds it constant at today's value so the line
    // is a clean price series scaled by one disclosed number, never a guess at
    // what the float was on a past day. Methodology says so on the page.
    const freeFloat = venice.circulating - chain.sVvvSupply;

    const tao = new Map(ranges.tao.map((p) => [p.t, p]));
    const near = new Map(ranges.near.map((p) => [p.t, p]));
    const zec = new Map(ranges.zec.map((p) => [p.t, p]));

    const dayZeroMs = Date.parse(DAY_ZERO.date + "T00:00:00Z");
    const base = {
      vvv: nearestPrice(ranges.vvv, dayZeroMs) ?? DAY_ZERO.vvvPrice,
      tao: nearestPrice(ranges.tao, dayZeroMs),
      near: nearestPrice(ranges.near, dayZeroMs),
      zec: nearestPrice(ranges.zec, dayZeroMs),
    };

    const points: HistoryPoint[] = ranges.vvv.map((p) => {
      const t = tao.get(p.t);
      const n = near.get(p.t);
      const z = zec.get(p.t);
      return {
        t: p.t,
        vvvPrice: p.price,
        vvvCap: p.price * freeFloat,
        taoCap: t?.marketCap ?? null,
        nearCap: n?.marketCap ?? null,
        zecCap: z?.marketCap ?? null,
        vvvIndex: p.t >= dayZeroMs ? p.price / base.vvv : null,
        taoIndex: p.t >= dayZeroMs && t && base.tao ? t.price / base.tao : null,
        nearIndex: p.t >= dayZeroMs && n && base.near ? n.price / base.near : null,
        zecIndex: p.t >= dayZeroMs && z && base.zec ? z.price / base.zec : null,
      };
    });

    const payload: HistoryPayload = {
      points,
      freeFloat,
      dayZeroMs,
      generatedAt: Date.now(),
    };

    return NextResponse.json(payload, {
      headers: { "cache-control": "public, s-maxage=900, stale-while-revalidate=3600" },
    });
  } catch (err) {
    console.error("history route failed", err);
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 503 });
  }
}

function nearestPrice(series: { t: number; price: number }[], target: number) {
  let best: { t: number; price: number } | null = null;
  for (const p of series) {
    if (!best || Math.abs(p.t - target) < Math.abs(best.t - target)) best = p;
  }
  return best?.price ?? null;
}
