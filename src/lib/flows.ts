import raw from "@/data/flows.json";

export type FlowPool = {
  address: string;
  pair: string;
  net: number;
  volume: number;
};

/** One finished UTC day of VVV movement, read straight from Base. */
export type FlowDay = {
  date: string;
  recorded_at: string;
  first_block: number;
  last_block: number;
  vvv_price_usd: number | null;
  transfer_count: number;
  addresses_touched: number;
  addresses_labelled: number;
  pool_absorption_vvv: number;
  pool_absorption_usd: number | null;
  pool_volume_vvv: number;
  staking_in_vvv: number;
  staking_out_vvv: number;
  staking_net_vvv: number;
  staking_net_usd: number | null;
  burned_vvv: number;
  burned_usd: number | null;
  pools: FlowPool[];
};

export const FLOW_DAYS = (raw as FlowDay[]).slice().sort((a, b) => a.date.localeCompare(b.date));

export type FlowWindow = {
  days: number;
  from: string;
  to: string;
  /** Net VVV bought out of the DEX pools. Negative means sold into them. */
  poolAbsorptionVvv: number;
  poolAbsorptionUsd: number | null;
  stakingNetVvv: number;
  stakingNetUsd: number | null;
  burnedVvv: number;
  burnedUsd: number | null;
  transferCount: number;
  latest: FlowDay;
};

const sum = (rows: FlowDay[], pick: (d: FlowDay) => number) => rows.reduce((s, d) => s + pick(d), 0);

function sumUsd(rows: FlowDay[], pick: (d: FlowDay) => number | null): number | null {
  // One day without a price makes the window's USD total wrong rather than
  // small, so the whole column drops out instead of being quietly understated.
  let total = 0;
  for (const d of rows) {
    const v = pick(d);
    if (v == null) return null;
    total += v;
  }
  return total;
}

/** Rolls the last `days` daily records into one window. */
export function flowWindow(days = 7): FlowWindow | null {
  const rows = FLOW_DAYS.slice(-days);
  if (rows.length === 0) return null;

  return {
    days: rows.length,
    from: rows[0].date,
    to: rows[rows.length - 1].date,
    poolAbsorptionVvv: sum(rows, (d) => d.pool_absorption_vvv),
    poolAbsorptionUsd: sumUsd(rows, (d) => d.pool_absorption_usd),
    stakingNetVvv: sum(rows, (d) => d.staking_net_vvv),
    stakingNetUsd: sumUsd(rows, (d) => d.staking_net_usd),
    burnedVvv: sum(rows, (d) => d.burned_vvv),
    burnedUsd: sumUsd(rows, (d) => d.burned_usd),
    transferCount: sum(rows, (d) => d.transfer_count),
    latest: rows[rows.length - 1],
  };
}

export const basescanAddress = (a: string) => `https://basescan.org/address/${a}`;
