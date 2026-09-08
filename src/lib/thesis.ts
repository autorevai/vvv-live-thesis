import {
  BUSINESS_METRICS,
  DAY_ZERO,
  DAY_ZERO_ONCHAIN,
  DIEM_LOCKED,
  PRICE_MILESTONES,
  PRIVATE_BENCHMARKS,
} from "@/lib/constants";
import type { ChainState } from "@/lib/sources/chain";
import type { MarketQuotes } from "@/lib/sources/coingecko";
import type { VeniceStats } from "@/lib/sources/venice";

export type Signal = "positive" | "negative" | "neutral";
export type Grade = "strengthening" | "neutral" | "weakening";

export type BenchmarkRow = {
  key: string;
  label: string;
  kind: "milestone" | "crypto" | "private";
  valuation: number;
  impliedVvvPrice: number;
  multipleFromCurrent: number;
  /** How much of the distance from the Day 0 cap to this level has been closed. */
  gapClosed: number;
  sourceName?: string;
  sourceUrl?: string;
  effectiveDate?: string;
  valuationType?: string;
  note?: string;
};

export type Pillar = {
  key: string;
  name: string;
  grade: Grade;
  headline: string;
  detail: string;
  inputs: { label: string; value: string }[];
  pending?: boolean;
};

export type ScorecardRow = {
  metric: string;
  dayZero: string;
  current: string;
  change: string;
  signal: Signal;
  rule: string;
  stale?: string;
};

export type ThesisModel = ReturnType<typeof buildThesis>;

const DAY_MS = 86_400_000;

export function buildThesis(quotes: MarketQuotes, chain: ChainState, venice: VeniceStats) {
  const price = quotes.vvv.price;
  const veniceCirculating = venice.circulating;

  // Free float is what an ordinary buyer can actually take off the market:
  // Venice-reported circulating supply less every VVV committed to the
  // staking contract (which covers both plain staking and DIEM locking).
  const freeFloat = veniceCirculating - chain.sVvvSupply;
  const freeFloatCap = price * freeFloat;

  const daysLive = Math.max(
    1,
    Math.floor((Date.now() - Date.parse(DAY_ZERO.date + "T00:00:00Z")) / DAY_MS),
  );

  const burnedSinceDayZero = chain.vvvBurned - DAY_ZERO_ONCHAIN.vvvBurned;
  const burnPace30d = (burnedSinceDayZero / daysLive) * 30;
  const burnPaceUsd30d = burnPace30d * price;

  const stakedChange = chain.sVvvSupply - DAY_ZERO_ONCHAIN.sVvvSupply;

  const vvvReturn = pctChange(price, DAY_ZERO.vvvPrice);
  const capReturn = pctChange(freeFloatCap, DAY_ZERO.vvvFreeFloatCap);
  const floatChange = pctChange(freeFloat, DAY_ZERO.vvvFreeFloat);
  const stakedPct = pctChange(chain.sVvvSupply, DAY_ZERO_ONCHAIN.sVvvSupply);
  const burnPacePct = pctChange(burnPace30d, DAY_ZERO.burn30dVvv);

  const vvvToTao = freeFloatCap / quotes.tao.marketCap;
  const vvvToNear = freeFloatCap / quotes.near.marketCap;
  const vvvToZec = freeFloatCap / quotes.zec.marketCap;
  const taoMultiple = quotes.tao.marketCap / freeFloatCap;
  const nearMultiple = quotes.near.marketCap / freeFloatCap;
  const zecMultiple = quotes.zec.marketCap / freeFloatCap;

  const benchmarks = buildBenchmarks(freeFloat, freeFloatCap, quotes);

  const pillars = gradePillars({
    vvvReturn,
    taoReturn: quotes.tao.change24h,
    nearReturn: quotes.near.change24h,
    quotes,
    burnedSinceDayZero,
    burnPace30d,
    burnPacePct,
    daysLive,
    freeFloat,
    floatChange,
    stakedChange,
    stakedPct,
    taoMultiple,
    nearMultiple,
    zecMultiple,
    burnedTotal: chain.vvvBurned,
    diemSupply: chain.diemSupply,
  });

  const overall = overallGrade(pillars);

  const scorecard = buildScorecard({
    price,
    freeFloat,
    freeFloatCap,
    chain,
    vvvReturn,
    capReturn,
    floatChange,
    stakedPct,
    burnPace30d,
    burnPaceUsd30d,
    burnPacePct,
    taoMultiple,
  });

  return {
    asOf: Date.now(),
    price,
    priceChange24h: quotes.vvv.change24h,
    conventionalMarketCap: quotes.vvv.marketCap,
    veniceCirculating,
    veniceTotalSupply: venice.total,
    veniceTotalStaked: venice.totalStaked,
    diemLocked: DIEM_LOCKED,
    freeFloat,
    freeFloatCap,
    daysLive,
    burnedTotal: chain.vvvBurned,
    burnedSinceDayZero,
    burnPace30d,
    burnPaceUsd30d,
    sVvvSupply: chain.sVvvSupply,
    vvvInStaking: chain.vvvInStaking,
    diemSupply: chain.diemSupply,
    vvvTotalSupplyOnChain: chain.vvvTotalSupplyOnChain,
    vvvReturn,
    capReturn,
    floatChange,
    stakedPct,
    burnPacePct,
    vvvToTao,
    vvvToNear,
    vvvToZec,
    taoMultiple,
    nearMultiple,
    zecMultiple,
    tao: quotes.tao,
    near: quotes.near,
    zec: quotes.zec,
    benchmarks,
    pillars,
    overall,
    scorecard,
    business: BUSINESS_METRICS,
    freshness: {
      market: quotes.vvv.updatedAt,
      chain: chain.fetchedAt,
      venice: venice.fetchedAt,
    },
  };
}

function pctChange(now: number, then: number) {
  if (!then) return 0;
  return ((now - then) / then) * 100;
}

function buildBenchmarks(
  freeFloat: number,
  freeFloatCap: number,
  quotes: MarketQuotes,
): BenchmarkRow[] {
  const dayZeroCap = DAY_ZERO.vvvFreeFloatCap;

  const row = (
    key: string,
    label: string,
    kind: BenchmarkRow["kind"],
    valuation: number,
    extra: Partial<BenchmarkRow> = {},
  ): BenchmarkRow => ({
    key,
    label,
    kind,
    valuation,
    impliedVvvPrice: valuation / freeFloat,
    multipleFromCurrent: valuation / freeFloatCap,
    gapClosed:
      valuation > dayZeroCap
        ? clamp01((freeFloatCap - dayZeroCap) / (valuation - dayZeroCap)) * 100
        : 100,
    ...extra,
  });

  const rows: BenchmarkRow[] = [
    ...PRICE_MILESTONES.map((p) =>
      row(`vvv-${p}`, `$${p.toLocaleString()} VVV`, "milestone", p * freeFloat),
    ),
    row("tao", "TAO market cap", "crypto", quotes.tao.marketCap, {
      sourceName: "CoinGecko",
      sourceUrl: "https://www.coingecko.com/en/coins/bittensor",
      valuationType: "Live market capitalization",
    }),
    row("near", "NEAR market cap", "crypto", quotes.near.marketCap, {
      sourceName: "CoinGecko",
      sourceUrl: "https://www.coingecko.com/en/coins/near",
      valuationType: "Live market capitalization",
    }),
    row("zec", "ZEC market cap", "crypto", quotes.zec.marketCap, {
      sourceName: "CoinGecko",
      sourceUrl: "https://www.coingecko.com/en/coins/zcash",
      valuationType: "Live market capitalization",
    }),
    ...PRIVATE_BENCHMARKS.map((b) =>
      row(b.key, b.company, "private", b.valuation, {
        sourceName: b.sourceName,
        sourceUrl: b.sourceUrl,
        effectiveDate: b.effectiveDate,
        valuationType: b.valuationType,
        note: b.note,
      }),
    ),
  ];

  return rows.sort((a, b) => a.valuation - b.valuation);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

type PillarInputs = {
  vvvReturn: number;
  taoReturn: number;
  nearReturn: number;
  quotes: MarketQuotes;
  burnedSinceDayZero: number;
  burnPace30d: number;
  burnPacePct: number;
  daysLive: number;
  freeFloat: number;
  floatChange: number;
  stakedChange: number;
  stakedPct: number;
  taoMultiple: number;
  nearMultiple: number;
  zecMultiple: number;
  burnedTotal: number;
  diemSupply: number;
};

function gradePillars(i: PillarInputs): Pillar[] {
  const m = (n: number, dp = 1) => n.toFixed(dp);
  const signed = (n: number, dp = 1) => (n > 0 ? "+" : "") + n.toFixed(dp);

  const buyPressure: Grade =
    i.burnPacePct > 10 ? "strengthening" : i.burnPacePct < -10 ? "weakening" : "neutral";

  const compression: Grade =
    i.floatChange < -1 && i.stakedPct > 0
      ? "strengthening"
      : i.floatChange > 1 || i.stakedPct < -1
        ? "weakening"
        : "neutral";

  const dayZeroTaoMultiple = 2_300_000_000 / DAY_ZERO.vvvFreeFloatCap;
  const relative: Grade =
    i.taoMultiple < dayZeroTaoMultiple * 0.95
      ? "strengthening"
      : i.taoMultiple > dayZeroTaoMultiple * 1.05
        ? "weakening"
        : "neutral";

  const beatsBoth = i.vvvReturn > i.taoReturn && i.vvvReturn > i.nearReturn;
  const market: Grade =
    i.vvvReturn > 0 && beatsBoth ? "strengthening" : i.vvvReturn < 0 ? "weakening" : "neutral";

  return [
    {
      key: "growth",
      name: "Business growth",
      grade: "neutral",
      pending: true,
      headline: "Awaiting the next disclosure",
      detail:
        "Venice publishes ARR, users, API calls and tokens processed as point-in-time updates, not as a live feed. This pillar stays neutral until a new figure is published and verified. It is never interpolated.",
      inputs: [
        { label: "Venice ARR", value: "$100M+ (verified Aug 29, 2026)" },
        { label: "Registered users", value: "Not disclosed" },
        { label: "API calls / day", value: "Not disclosed" },
        { label: "Tokens / month", value: "Not disclosed" },
      ],
    },
    {
      key: "buy-pressure",
      name: "Structural buy pressure",
      grade: buyPressure,
      headline:
        buyPressure === "strengthening"
          ? `Burn pace running ${signed(i.burnPacePct, 0)}% vs Day 0`
          : buyPressure === "weakening"
            ? `Burn pace running ${signed(i.burnPacePct, 0)}% vs Day 0`
            : "Burn pace roughly flat vs Day 0",
      detail:
        "Measured on-chain. Venice routes programmatic buy-and-burn VVV to the zero address, so the balance there only ever rises. Pace is tokens burned since Day 0, annualised to a 30-day window, compared against the 53.7K VVV burned in the 30 days before launch.",
      inputs: [
        { label: "Burned since Day 0", value: `${fmtTok(i.burnedSinceDayZero)} VVV` },
        { label: "Implied 30D pace", value: `${fmtTok(i.burnPace30d)} VVV` },
        { label: "Day 0 30D burn", value: "53.7K VVV" },
        { label: "Total burned", value: `${fmtTok(i.burnedTotal)} VVV` },
      ],
    },
    {
      key: "compression",
      name: "Supply compression",
      grade: compression,
      headline:
        i.floatChange < 0
          ? `Free float down ${m(Math.abs(i.floatChange))}% since Day 0`
          : `Free float up ${m(i.floatChange)}% since Day 0`,
      detail:
        "The thesis needs the immediately sellable float to shrink. Free float is Venice-reported circulating supply less every VVV committed to the staking contract, which covers plain staking and DIEM locking together.",
      inputs: [
        { label: "Free float", value: `${fmtTok(i.freeFloat)} VVV (${signed(i.floatChange)}%)` },
        { label: "Staked + DIEM-locked", value: `${signed(i.stakedPct)}% vs Day 0` },
        { label: "DIEM supply", value: `${fmtTok(i.diemSupply)} DIEM` },
        { label: "Total burned", value: `${fmtTok(i.burnedTotal)} VVV` },
      ],
    },
    {
      key: "relative",
      name: "Relative valuation",
      grade: relative,
      headline: `${m(i.taoMultiple)}x to TAO parity`,
      detail:
        "How far the free-float cap sits below the comparators. The gap closing is the thesis working. This is a valuation equivalence exercise, not a claim of equivalent rights.",
      inputs: [
        { label: "Multiple to TAO", value: `${m(i.taoMultiple)}x` },
        { label: "Multiple to ZEC", value: `${m(i.zecMultiple)}x` },
        { label: "Multiple to NEAR", value: `${m(i.nearMultiple)}x` },
        { label: "Day 0 multiple to TAO", value: `${m(dayZeroTaoMultiple)}x` },
      ],
    },
    {
      key: "market",
      name: "Market performance",
      grade: market,
      headline: `VVV ${signed(i.vvvReturn, 0)}% since Day 0`,
      detail:
        "Price return since Day 0 against the two liquid comparators. Comparator returns shown here are 24-hour moves; the Since Day 0 chart mode carries the full indexed series.",
      inputs: [
        { label: "VVV since Day 0", value: `${signed(i.vvvReturn)}%` },
        { label: "TAO 24h", value: `${signed(i.taoReturn)}%` },
        { label: "ZEC 24h", value: `${signed(i.quotes.zec.change24h)}%` },
        { label: "NEAR 24h", value: `${signed(i.nearReturn)}%` },
      ],
    },
  ];
}

function fmtTok(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(0);
}

export function overallGrade(pillars: Pillar[]) {
  const scored = pillars.filter((p) => !p.pending);
  const strong = scored.filter((p) => p.grade === "strengthening").length;
  const weak = scored.filter((p) => p.grade === "weakening").length;
  let label: string;
  let grade: Grade;
  if (strong >= 4) {
    label = "Strongly strengthening";
    grade = "strengthening";
  } else if (strong >= 3) {
    label = "Strengthening";
    grade = "strengthening";
  } else if (weak >= 3) {
    label = "Weakening";
    grade = "weakening";
  } else {
    label = "Neutral";
    grade = "neutral";
  }
  return { label, grade, strengthening: strong, weakening: weak, scored: scored.length };
}

function buildScorecard(a: {
  price: number;
  freeFloat: number;
  freeFloatCap: number;
  chain: ChainState;
  vvvReturn: number;
  capReturn: number;
  floatChange: number;
  stakedPct: number;
  burnPace30d: number;
  burnPaceUsd30d: number;
  burnPacePct: number;
  taoMultiple: number;
}): ScorecardRow[] {
  const sign = (n: number, dp = 1) => (n > 0 ? "+" : "") + n.toFixed(dp) + "%";
  const up = (n: number): Signal => (n > 0.5 ? "positive" : n < -0.5 ? "negative" : "neutral");
  const down = (n: number): Signal => (n < -0.5 ? "positive" : n > 0.5 ? "negative" : "neutral");
  const dayZeroTaoMultiple = 2_300_000_000 / DAY_ZERO.vvvFreeFloatCap;

  return [
    {
      metric: "VVV price",
      dayZero: "$16.60",
      current: "$" + a.price.toFixed(2),
      change: sign(a.vvvReturn),
      signal: up(a.vvvReturn),
      rule: "Positive if higher",
    },
    {
      metric: "Free-float cap",
      dayZero: "$225.8M",
      current: "$" + (a.freeFloatCap / 1e6).toFixed(1) + "M",
      change: sign(a.capReturn),
      signal: up(a.capReturn),
      rule: "Positive if higher",
    },
    {
      metric: "Free circulating VVV",
      dayZero: "13.60M",
      current: fmtTok(a.freeFloat),
      change: sign(a.floatChange),
      signal: down(a.floatChange),
      rule: "Positive if lower",
    },
    {
      metric: "Staked + DIEM-locked VVV",
      dayZero: "34.32M",
      current: fmtTok(a.chain.sVvvSupply),
      change: sign(a.stakedPct),
      signal: up(a.stakedPct),
      rule: "Positive if higher",
    },
    {
      metric: "Total VVV burned",
      dayZero: "33.84M",
      current: fmtTok(a.chain.vvvBurned),
      change: sign(
        ((a.chain.vvvBurned - DAY_ZERO_ONCHAIN.vvvBurned) / DAY_ZERO_ONCHAIN.vvvBurned) * 100,
        2,
      ),
      signal: "positive",
      rule: "Positive if higher",
    },
    {
      metric: "30D buy + burn (VVV)",
      dayZero: "53.7K",
      current: fmtTok(a.burnPace30d),
      change: sign(a.burnPacePct, 0),
      signal: up(a.burnPacePct),
      rule: "Positive if higher",
    },
    {
      metric: "30D buy + burn (USD)",
      dayZero: "$672.6K",
      current: "$" + fmtTok(a.burnPaceUsd30d),
      change: sign(((a.burnPaceUsd30d - 672_570) / 672_570) * 100, 0),
      signal: up((a.burnPaceUsd30d - 672_570) / 672_570),
      rule: "Positive if higher. Valued at the current VVV price.",
    },
    {
      metric: "DIEM supply",
      dayZero: "Not recorded",
      current: fmtTok(a.chain.diemSupply) + " DIEM",
      change: "—",
      signal: "neutral",
      rule: "Positive if higher. Baseline starts today.",
    },
    {
      metric: "Multiple to TAO parity",
      dayZero: dayZeroTaoMultiple.toFixed(1) + "x",
      current: a.taoMultiple.toFixed(1) + "x",
      change: sign(((a.taoMultiple - dayZeroTaoMultiple) / dayZeroTaoMultiple) * 100, 0),
      signal: down(((a.taoMultiple - dayZeroTaoMultiple) / dayZeroTaoMultiple) * 100),
      rule: "Positive if lower",
    },
    {
      metric: "Venice ARR",
      dayZero: "$100M+",
      current: "$100M+",
      change: "No new disclosure",
      signal: "neutral",
      rule: "Positive if higher",
      stale: "Last verified Aug 29, 2026",
    },
  ];
}
