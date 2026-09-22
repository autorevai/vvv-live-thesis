import raw from "@/data/custody.json";

export type CustodyEntity = {
  entity: string;
  kind: string;
  vvv: number;
  addresses: number;
};

export type CustodyAddress = {
  address: string;
  entity: string;
  label: string;
  kind: string;
  vvv: number | null;
};

/** One day's VVV balance reading for every labelled address. */
export type CustodyDay = {
  date: string;
  recorded_at: string;
  vvv_price_usd: number | null;
  label_source: string;
  labels_retrieved_at: string;
  addresses_checked: number;
  addresses_unread: number;
  exchange_vvv: number;
  exchange_usd: number | null;
  market_maker_vvv: number;
  issuer_vvv: number;
  vesting_vvv: number;
  pool_vvv: number;
  entities: CustodyEntity[];
  addresses: CustodyAddress[];
};

export const CUSTODY_DAYS = (raw as CustodyDay[])
  .slice()
  .sort((a, b) => a.date.localeCompare(b.date));

export function latestCustody(): CustodyDay | null {
  return CUSTODY_DAYS.at(-1) ?? null;
}

/**
 * Change in exchange-held VVV against the oldest reading we hold. Null until
 * there are two days on record: one reading is a level, not a trend.
 */
export function exchangeTrend(): { days: number; from: number; change: number } | null {
  if (CUSTODY_DAYS.length < 2) return null;
  const first = CUSTODY_DAYS[0];
  const last = CUSTODY_DAYS.at(-1)!;
  return {
    days: CUSTODY_DAYS.length,
    from: first.exchange_vvv,
    change: last.exchange_vvv - first.exchange_vvv,
  };
}

const KIND_LABEL: Record<string, string> = {
  exchange: "Exchange",
  "market-maker": "Market maker",
  issuer: "Venice",
  vesting: "Vesting lockup",
  pool: "DEX pool",
  lending: "Lending market",
  bridge: "Bridge",
  fund: "Fund",
  "block-builder": "Block builder",
  other: "Other",
};

export const kindLabel = (k: string) => KIND_LABEL[k] ?? "Other";

const ENTITY_NAME: Record<string, string> = {
  "gate-io": "Gate.io",
  okx: "OKX",
  mexc: "MEXC",
  kucoin: "KuCoin",
  b2c2: "B2C2",
  "venice-ai": "Venice AI",
  "aerodrome-finance": "Aerodrome",
  "near-intents": "Near Intents",
};

export const entityName = (e: string) =>
  ENTITY_NAME[e] ?? e.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
