/**
 * The underwriting case, written at launch. Targets are stated as free-float
 * capitalization first, because that is the number being compared against the
 * comparators. The VVV price is whatever that capitalization divided by the
 * live free float works out to.
 */

export type Target = {
  key: string;
  price: number;
  label: string;
  thesis: string;
  anchor: string;
};

export const TARGETS: Target[] = [
  {
    key: "base",
    price: 100,
    label: "Base case",
    thesis: "The first major re-rating.",
    anchor:
      "About $1.4B of free-float capitalization. It does not require Venice to win the category, only to keep compounding from a business already past $100M annualized while the float stays tight.",
  },
  {
    key: "bull",
    price: 500,
    label: "Bull case",
    thesis: "VVV's free float reaches what Stripe paid for OpenRouter.",
    anchor:
      "About $6.95B, effectively the $7B OpenRouter acquisition already plotted on the chart. This is the level at which VVV is priced like a serious piece of AI inference infrastructure.",
  },
  {
    key: "extreme",
    price: 1000,
    label: "Extreme bull",
    thesis: "Priced with Baseten, still under Fireworks.",
    anchor:
      "About $13.9B, around Baseten's reported private valuation and still below the $17.5B Fireworks AI round. Not a fantasy number, a peer number.",
  },
];

export const FLYWHEEL = [
  {
    step: "Revenue grows",
    detail:
      "Venice was already profitable with over $70M annualized at its July 2026 Series A, and disclosed $100M+ by the time this thesis was frozen.",
    source: {
      name: "TechCrunch, July 1, 2026",
      url: "https://techcrunch.com/2026/07/01/venice-ai-becomes-a-unicorn-with-65m-series-a-as-its-privacy-first-ai-platform-takes-off/",
    },
  },
  {
    step: "Revenue buys VVV",
    detail:
      "Every new subscription triggers an automatic open-market buy and burn, scaled by tier: $2 Pro, $5 Pro+, $10 Max. Discretionary buybacks run in parallel. This is a mechanical link from business activity to token demand, not a promise.",
    source: {
      name: "Venice, Programmatic VVV Buy & Burns",
      url: "https://venice.ai/blog/programmatic-vvv-buy-and-burn",
    },
  },
  {
    step: "Burned VVV never comes back",
    detail:
      "Purchased VVV goes to the burn address permanently. Venice has burned over 33.8M VVV, roughly 42% of the original 100M supply, including the airdrop burn.",
    source: {
      name: "Venice token dashboard",
      url: "https://venice.ai/token/burns",
    },
  },
  {
    step: "Usage locks more VVV away",
    detail:
      "Staked VVV can be locked to mint DIEM, where one staked DIEM yields $1 per day of inference credit in perpetuity. Buying compute means locking the capital asset, and the sVVV stays locked until the DIEM is burned.",
    source: {
      name: "Venice, VVV & DIEM",
      url: "https://docs.venice.ai/overview/vvv-diem",
    },
  },
  {
    step: "The sellable float stays small",
    detail:
      "Burns, staking and DIEM locking together leave a free float near 13.9M VVV against a circulating supply above 48M. Every dollar of demand meets a thin book.",
    source: {
      name: "Live on this page",
      url: "https://venice.ai/token",
    },
  },
];

export const THESIS_STATEMENT = `Venice is a profitable, fast-growing AI business whose token has an unusually small immediately sellable float. Revenue mechanically buys and burns VVV, staking and DIEM locking hold supply off the market, and emissions are scheduled to fall. If that keeps compounding, the free-float valuation should converge toward the AI infrastructure companies it is already competing with.`;

export const THESIS_RISK = `The same mechanics run in reverse. If growth stalls, if burns slow, or if staked positions unwind and the float widens, the thesis weakens and this page will say so.`;
