import Dashboard from "@/components/Dashboard";
import type { HistoryPayload } from "@/app/api/history/route";
import { getAllRanges, getQuotes } from "@/lib/sources/coingecko";
import { getChainState } from "@/lib/sources/chain";
import { getVeniceStats } from "@/lib/sources/venice";
import { soft } from "@/lib/sources/fetchers";
import { buildThesis } from "@/lib/thesis";
import { DAY_ZERO } from "@/lib/constants";
import { dailyDeltas } from "@/lib/snapshots";
import { flowWindow } from "@/lib/flows";
import { latestCustody } from "@/lib/custody";

export const revalidate = 60;

export default async function Page() {
  const [chain, venice] = await Promise.all([soft(getChainState(300)), soft(getVeniceStats(60))]);
  const quotes = venice ? await soft(getQuotes(venice, 60)) : null;

  const live = quotes && chain && venice ? buildThesis(quotes, chain, venice) : null;
  const history = live ? await soft(buildHistory(live.freeFloat)) : null;

  return (
    <Dashboard
      initialLive={live}
      initialHistory={history}
      daily={dailyDeltas()}
      flows={flowWindow(7)}
      custody={latestCustody()}
    />
  );
}

async function buildHistory(freeFloat: number): Promise<HistoryPayload> {
  const ranges = await getAllRanges();
  const tao = new Map(ranges.tao.map((p) => [p.t, p]));
  const near = new Map(ranges.near.map((p) => [p.t, p]));
  const zec = new Map(ranges.zec.map((p) => [p.t, p]));
  const dayZeroMs = Date.parse(DAY_ZERO.date + "T00:00:00Z");

  const nearest = (s: { t: number; price: number }[]) =>
    s.reduce<{ t: number; price: number } | null>(
      (best, p) => (!best || Math.abs(p.t - dayZeroMs) < Math.abs(best.t - dayZeroMs) ? p : best),
      null,
    )?.price ?? null;

  const base = {
    vvv: nearest(ranges.vvv) ?? DAY_ZERO.vvvPrice,
    tao: nearest(ranges.tao),
    near: nearest(ranges.near),
    zec: nearest(ranges.zec),
  };

  return {
    points: ranges.vvv.map((p) => {
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
    }),
    freeFloat,
    dayZeroMs,
    generatedAt: Date.now(),
  };
}
