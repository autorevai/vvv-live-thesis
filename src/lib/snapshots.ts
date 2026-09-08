import raw from "@/data/snapshots.json";

export type Snapshot = {
  date: string;
  recorded_at: string;
  note?: string;
  source_block?: number;
  vvv_price: number | null;
  vvv_circulating: number | null;
  vvv_total_supply: number | null;
  vvv_free_float: number | null;
  vvv_free_float_cap: number | null;
  vvv_staked_plus_locked: number | null;
  vvv_burned: number | null;
  vvv_total_supply_onchain: number | null;
  diem_supply: number | null;
  vvv_market_cap: number | null;
  tao_market_cap: number | null;
  near_market_cap: number | null;
  zec_market_cap: number | null;
  venice_arr: number | null;
  venice_users: number | null;
  api_calls_day: number | null;
  tokens_processed_month: number | null;
};

export const SNAPSHOTS = (raw as Snapshot[]).slice().sort((a, b) => a.date.localeCompare(b.date));

export type DailyDelta = {
  date: string;
  freeFloat: number | null;
  freeFloatChange: number | null;
  staked: number | null;
  stakedChange: number | null;
  burned: number | null;
  burnedChange: number | null;
  price: number | null;
  isDayZero: boolean;
  note?: string;
  sourceBlock?: number;
};

/** Day-over-day movement in the numbers the thesis actually turns on. */
export function dailyDeltas(): DailyDelta[] {
  return SNAPSHOTS.map((s, i) => {
    const prev = i > 0 ? SNAPSHOTS[i - 1] : null;
    const diff = (a: number | null, b: number | null | undefined) =>
      a !== null && b !== null && b !== undefined ? a - b : null;
    return {
      date: s.date,
      freeFloat: s.vvv_free_float,
      freeFloatChange: diff(s.vvv_free_float, prev?.vvv_free_float ?? null),
      staked: s.vvv_staked_plus_locked,
      stakedChange: diff(s.vvv_staked_plus_locked, prev?.vvv_staked_plus_locked ?? null),
      burned: s.vvv_burned,
      burnedChange: diff(s.vvv_burned, prev?.vvv_burned ?? null),
      price: s.vvv_price,
      isDayZero: i === 0,
      note: s.note,
      sourceBlock: s.source_block,
    };
  });
}
