import { cached } from "@/lib/cache";
import { fetchJson } from "./fetchers";

const BASE = "https://api.venice.ai/api/v1/vvv";

/** The payload behind the public token dashboard at venice.ai/token. No key required. */
type StatsResponse = {
  circulatingSupply: string;
  totalSupply: string;
  totalStaked: string;
  marketCap: string;
  fdv: number;
  price: string;
  priceDelta24H: string;
};

export type VeniceStats = {
  circulating: number;
  total: number;
  /** Every VVV committed to the staking contract, DIEM-locked VVV included. */
  totalStaked: number;
  price: number;
  marketCap: number;
  fdv: number;
  priceChange24h: number;
  fetchedAt: number;
};

export async function getVeniceStats(revalidate = 60): Promise<VeniceStats> {
  const { value, at, stale } = await cached("venice:stats", revalidate * 1000, () =>
    loadVeniceStats(revalidate),
  );
  return stale ? { ...value, fetchedAt: at } : value;
}

async function loadVeniceStats(revalidate: number): Promise<VeniceStats> {
  const r = await fetchJson<StatsResponse>("venice/stats", `${BASE}/stats`, {
    next: { revalidate },
  });
  const stats: VeniceStats = {
    circulating: Number(r.circulatingSupply),
    total: Number(r.totalSupply),
    totalStaked: Number(r.totalStaked),
    price: Number(r.price),
    marketCap: Number(r.marketCap),
    fdv: Number(r.fdv),
    priceChange24h: Number(r.priceDelta24H),
    fetchedAt: Date.now(),
  };
  for (const [k, v] of Object.entries(stats)) {
    if (!Number.isFinite(v)) throw new Error(`venice/stats: non-numeric ${k}`);
  }
  return stats;
}
