import { fetchJson } from "./fetchers";

/** Keyless fallback for comparator market caps when CoinGecko is unavailable. */
const BASE = "https://api.coinpaprika.com/v1/tickers";

export const PAPRIKA_IDS = {
  tao: "tao-bittensor",
  near: "near-near-protocol",
  zec: "zec-zcash",
} as const;

type Ticker = {
  symbol: string;
  quotes: { USD: { price: number; market_cap: number; percent_change_24h: number } };
  last_updated: string;
};

export type ComparatorQuote = {
  price: number;
  marketCap: number;
  change24h: number;
  updatedAt: number;
  source: "coingecko" | "coinpaprika";
};

export async function getPaprikaQuote(id: string, revalidate = 60): Promise<ComparatorQuote> {
  const t = await fetchJson<Ticker>("coinpaprika", `${BASE}/${id}`, { next: { revalidate } });
  const q = t.quotes?.USD;
  if (!q || typeof q.market_cap !== "number") throw new Error(`coinpaprika: bad ${id}`);
  return {
    price: q.price,
    marketCap: q.market_cap,
    change24h: q.percent_change_24h,
    updatedAt: Date.parse(t.last_updated) || Date.now(),
    source: "coinpaprika",
  };
}
