/**
 * IMMUTABLE THESIS BASELINE.
 *
 * These values were published at thesis launch and must never be edited.
 * Every "since Day 0" number on the site is measured against this file.
 * Its history is the proof: `git log --follow src/lib/constants.ts`.
 */

export const DAY_ZERO_ISO = "2026-08-29";
export const DAY_ZERO_LABEL = "Aug 29, 2026";
export const HISTORY_START_ISO = "2026-07-01";

export const DAY_ZERO = {
  date: DAY_ZERO_ISO,
  vvvPrice: 16.6,
  vvvFreeFloat: 13_600_000,
  vvvFreeFloatCap: 225_760_000,
  vvvStaked: 25_700_000,
  vvvLocked: 8_600_000,
  vvvBurned: 33_800_000,
  veniceArr: 100_000_000,
  burn30dUsd: 672_570,
  burn30dVvv: 53_700,
  burnJulyUsd: 445_000,
  burnJulyVvv: 38_100,
} as const;

/**
 * Day 0 state read directly from Base at the first block on or after
 * 2026-08-29T00:00:00Z. Anyone can reproduce these with an archive node:
 *   eth_call(VVV, balanceOf(0x0), 0x3037B4F)
 * They corroborate the published Day 0 figures above.
 */
export const DAY_ZERO_ONCHAIN = {
  block: 50_586_127,
  timestamp: 1_787_961_601,
  vvvBurned: 33_844_575.616,
  /** Staked plus DIEM-locked VVV, matching the published 25.7M + 8.6M. */
  sVvvSupply: 34_322_288.09,
  vvvTotalSupplyOnChain: 114_731_841.436,
} as const;

/** Base mainnet contracts, from docs.venice.ai/overview/vvv-diem */
export const CONTRACTS = {
  vvv: "0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf",
  diem: "0xF4d97F2da56e8c3098f3a8D538DB630A2606a024",
  /** Staking vault. Its ERC-20 supply is sVVV, the receipt for staked VVV. */
  staking: "0x321b7ff75154472B18EDb199033fF4D116F340Ff",
  /** Venice routes buy-and-burn VVV here. It is not a supply-reducing burn. */
  burnSink: "0x0000000000000000000000000000000000000000",
} as const;

export const COINGECKO_IDS = {
  vvv: "venice-token",
  tao: "bittensor",
  near: "near",
  zec: "zcash",
} as const;

/** Liquid comparators charted alongside VVV. */
export const CRYPTO_COMPARATORS = [
  {
    key: "tao" as const,
    label: "TAO",
    name: "Bittensor",
    color: "var(--tao)",
    why: "The reference decentralised-AI network. The closest listed analogue for an AI token with real usage.",
    coingeckoUrl: "https://www.coingecko.com/en/coins/bittensor",
  },
  {
    key: "zec" as const,
    label: "ZEC",
    name: "Zcash",
    color: "var(--zec)",
    why: "The benchmark privacy asset. Venice sells private, uncensored inference, so ZEC prices what the market pays for privacy at scale.",
    coingeckoUrl: "https://www.coingecko.com/en/coins/zcash",
  },
  {
    key: "near" as const,
    label: "NEAR",
    name: "NEAR Protocol",
    color: "var(--near)",
    why: "A large L1 that repositioned around AI. A liquidity and attention comparator rather than a business one.",
    coingeckoUrl: "https://www.coingecko.com/en/coins/near",
  },
];

export type ComparatorKey = "tao" | "near" | "zec" | "openrouter" | "baseten" | "fireworks";

export type PrivateBenchmark = {
  key: ComparatorKey;
  company: string;
  valuation: number;
  valuationType: string;
  effectiveDate: string;
  sourceName: string;
  sourceUrl: string;
  verifiedAt: string;
  note?: string;
};

/**
 * Private-company comparators. These move only when a real financing,
 * acquisition or valuation event is reported, never on a schedule.
 */
export const PRIVATE_BENCHMARKS: PrivateBenchmark[] = [
  {
    key: "openrouter",
    company: "OpenRouter",
    valuation: 7_000_000_000,
    valuationType: "Acquisition value",
    effectiveDate: "2026-08-17",
    sourceName: "Wall Street Journal, via Sacra",
    sourceUrl: "https://sacra.com/c/openrouter/",
    verifiedAt: "2026-09-08",
    note: "Stripe agreed to acquire OpenRouter for more than $7B, months after a reported $1.3B round.",
  },
  {
    key: "baseten",
    company: "Baseten",
    valuation: 13_000_000_000,
    valuationType: "Private financing valuation (reported, dual-tier $11B / $13B)",
    effectiveDate: "2026-06-22",
    sourceName: "TechCrunch / The Information, via Forbes",
    sourceUrl:
      "https://www.forbes.com/sites/janakirammsv/2026/07/18/open-weight-models-are-turning-inference-into-a-control-point/",
    verifiedAt: "2026-09-08",
    note: "Roughly $1.5B raised. Investors participated at $11B and at $13B. The headline number is the top of the band.",
  },
  {
    key: "fireworks",
    company: "Fireworks AI",
    valuation: 17_500_000_000,
    valuationType: "Post-money valuation",
    effectiveDate: "2026-07-15",
    sourceName: "Businesswire (company announcement), via CNBC",
    sourceUrl: "https://www.cnbc.com/2026/07/16/fireworks-nvidia-cloud-ai-startup-value.html",
    verifiedAt: "2026-09-08",
    note: "$1.505B Series D announced July 15, 2026.",
  },
];

export type BusinessMetric = {
  key: string;
  label: string;
  value: number | null;
  display: string;
  unit: string;
  effectiveDate: string;
  sourceName: string;
  sourceUrl: string;
  verifiedAt: string;
};

/**
 * Point-in-time business disclosures. Venice publishes no live API for these,
 * so they are step functions, never interpolated.
 */
export const BUSINESS_METRICS: BusinessMetric[] = [
  {
    key: "arr",
    label: "Venice ARR",
    value: 100_000_000,
    display: "$100M+",
    unit: "USD annualized",
    effectiveDate: "2026-08-29",
    sourceName: "Venice public disclosure, recorded at thesis launch",
    sourceUrl: "https://venice.ai/token",
    verifiedAt: "2026-08-29",
  },
  {
    key: "series-a",
    label: "Venice valuation and profitability",
    value: 1_000_000_000,
    display: "$1B+, profitable",
    unit: "USD post-money",
    effectiveDate: "2026-07-01",
    sourceName: "TechCrunch, $65M Series A, profitable at $70M+ run-rate",
    sourceUrl:
      "https://techcrunch.com/2026/07/01/venice-ai-becomes-a-unicorn-with-65m-series-a-as-its-privacy-first-ai-platform-takes-off/",
    verifiedAt: "2026-09-08",
  },
  {
    key: "users",
    label: "Registered users",
    value: 3_500_000,
    display: "3.5M",
    unit: "registered accounts",
    effectiveDate: "2026-08-01",
    sourceName: "Venice official blog, as reported by third-party trackers",
    sourceUrl: "https://venice.ai/blog",
    verifiedAt: "2026-09-08",
  },
  {
    key: "api-calls",
    label: "API calls per day",
    value: 2_000_000,
    display: "2M / day",
    unit: "requests",
    effectiveDate: "2026-08-01",
    sourceName: "Venice official blog, as reported by third-party trackers",
    sourceUrl: "https://venice.ai/blog",
    verifiedAt: "2026-09-08",
  },
  {
    key: "tokens",
    label: "Tokens processed per month",
    value: 1_300_000_000_000,
    display: "1.3T / month",
    unit: "tokens",
    effectiveDate: "2026-08-01",
    sourceName: "Venice official blog, as reported by third-party trackers",
    sourceUrl: "https://venice.ai/blog",
    verifiedAt: "2026-09-08",
  },
];

/**
 * DIEM-locked sVVV. Venice shows this on venice.ai/token but exposes no
 * endpoint for it, and it cannot be derived from DIEM supply because the mint
 * rate rises over time. It is a subset of the live staked figure, so the
 * supply-compression pillar grades on the combined number instead.
 */
export const DIEM_LOCKED = {
  value: 8_560_000,
  sourceName: "Venice token dashboard",
  sourceUrl: "https://venice.ai/token",
  verifiedAt: "2026-09-08",
} as const;

export const PRICE_MILESTONES = [100, 250, 500, 1000] as const;
