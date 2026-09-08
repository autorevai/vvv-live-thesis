import { COINGECKO_IDS, HISTORY_START_ISO } from "@/lib/constants";
import { cached } from "@/lib/cache";
import { fetchJson, sleep } from "./fetchers";

const BASE = "https://api.coingecko.com/api/v3";
const KEY = process.env.COINGECKO_API_KEY;

function withKey(url: string) {
  return KEY ? `${url}${url.includes("?") ? "&" : "?"}x_cg_demo_api_key=${KEY}` : url;
}

export type MarketQuote = {
  price: number;
  marketCap: number;
  change24h: number;
  updatedAt: number;
};

export type MarketQuotes = {
  vvv: MarketQuote;
  tao: MarketQuote;
  near: MarketQuote;
  zec: MarketQuote;
};

type SimplePriceRow = {
  usd: number;
  usd_market_cap: number;
  usd_24h_change: number;
  last_updated_at: number;
};

export async function getQuotes(revalidate = 60): Promise<MarketQuotes> {
  const { value } = await cached("cg:quotes", revalidate * 1000, () => loadQuotes(revalidate));
  return value;
}

async function loadQuotes(revalidate: number): Promise<MarketQuotes> {
  const ids = Object.values(COINGECKO_IDS).join(",");
  const data = await fetchJson<Record<string, SimplePriceRow>>(
    "coingecko/simple",
    withKey(
      `${BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true&include_last_updated_at=true`,
    ),
    { next: { revalidate } },
  );
  const row = (id: string): MarketQuote => {
    const r = data[id];
    if (!r || typeof r.usd !== "number") throw new Error(`coingecko: missing ${id}`);
    return {
      price: r.usd,
      marketCap: r.usd_market_cap,
      change24h: r.usd_24h_change,
      updatedAt: r.last_updated_at * 1000,
    };
  };
  return {
    vvv: row(COINGECKO_IDS.vvv),
    tao: row(COINGECKO_IDS.tao),
    near: row(COINGECKO_IDS.near),
    zec: row(COINGECKO_IDS.zec),
  };
}

export type DailyPoint = { t: number; price: number; marketCap: number };

type RangeResponse = {
  prices: [number, number][];
  market_caps: [number, number][];
};

/** Daily close series. CoinGecko returns daily granularity for ranges over 90 days. */
export async function getRange(
  id: string,
  fromSec: number,
  toSec: number,
  revalidate = 900,
): Promise<DailyPoint[]> {
  const data = await fetchJson<RangeResponse>(
    "coingecko/range",
    withKey(
      `${BASE}/coins/${id}/market_chart/range?vs_currency=usd&from=${fromSec}&to=${toSec}`,
    ),
    { next: { revalidate } },
  );
  const caps = new Map(data.market_caps.map(([t, v]) => [dayKey(t), v]));
  const byDay = new Map<number, DailyPoint>();
  for (const [t, price] of data.prices) {
    const k = dayKey(t);
    byDay.set(k, { t: k, price, marketCap: caps.get(k) ?? 0 });
  }
  return [...byDay.values()].sort((a, b) => a.t - b.t);
}

function dayKey(ms: number) {
  return Math.floor(ms / 86_400_000) * 86_400_000;
}

export async function getAllRanges(revalidate = 900) {
  const { value } = await cached("cg:ranges", revalidate * 1000, () => loadAllRanges(revalidate));
  return value;
}

async function loadAllRanges(revalidate: number) {
  const from = Math.floor(Date.parse(HISTORY_START_ISO + "T00:00:00Z") / 1000);
  const to = Math.floor(Date.now() / 1000);
  // Serial, not parallel. Four concurrent range calls trip the public tier's
  // burst limit, and these are cached for 15 minutes so the extra second costs
  // nothing.
  const out: Record<string, DailyPoint[]> = {};
  const ids: [string, string][] = [
    ["vvv", COINGECKO_IDS.vvv],
    ["tao", COINGECKO_IDS.tao],
    ["near", COINGECKO_IDS.near],
    ["zec", COINGECKO_IDS.zec],
  ];
  for (const [key, id] of ids) {
    out[key] = await getRange(id, from, to, revalidate);
    if (!KEY) await sleep(250);
  }
  return {
    vvv: out.vvv,
    tao: out.tao,
    near: out.near,
    zec: out.zec,
  };
}
