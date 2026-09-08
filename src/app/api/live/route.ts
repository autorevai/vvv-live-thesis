import { NextResponse } from "next/server";
import { getQuotes } from "@/lib/sources/coingecko";
import { getChainState } from "@/lib/sources/chain";
import { getVeniceStats } from "@/lib/sources/venice";
import { buildThesis } from "@/lib/thesis";

export const revalidate = 60;

export async function GET() {
  try {
    const [quotes, chain, venice] = await Promise.all([
      getQuotes(60),
      getChainState(300),
      getVeniceStats(60),
    ]);
    const model = buildThesis(quotes, chain, venice);
    return NextResponse.json(model, {
      headers: {
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("live route failed", err);
    return NextResponse.json(
      { error: "upstream_unavailable", message: String(err) },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
