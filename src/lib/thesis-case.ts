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
    thesis: "The first big step up.",
    anchor:
      "A $1.4B valuation. Venice only has to keep growing from a business already past $100M a year while supply stays tight.",
  },
  {
    key: "bull",
    price: 500,
    label: "Bull case",
    thesis: "Valued like Stripe valued OpenRouter.",
    anchor:
      "A $6.95B valuation. Roughly the $7B Stripe paid for OpenRouter.",
  },
  {
    key: "extreme",
    price: 1000,
    label: "Extreme bull",
    thesis: "Worth about what Baseten is worth.",
    anchor:
      "A $13.9B valuation. About what Baseten is worth, under the $17.5B Fireworks raised at.",
  },
];

export const FLYWHEEL = [
  {
    step: "Revenue grows",
    detail:
      "Profitable at $70M+ a year by the July 2026 Series A. Past $100M by Day 0.",
    source: {
      name: "TechCrunch, July 1, 2026",
      url: "https://techcrunch.com/2026/07/01/venice-ai-becomes-a-unicorn-with-65m-series-a-as-its-privacy-first-ai-platform-takes-off/",
    },
  },
  {
    step: "Revenue buys VVV",
    detail:
      "Every new subscription buys VVV on the open market and burns it. $2 Pro, $5 Pro+, $10 Max, automatic. Venice buys back on top of that.",
    source: {
      name: "Venice, Programmatic VVV Buy & Burns",
      url: "https://venice.ai/blog/programmatic-vvv-buy-and-burn",
    },
  },
  {
    step: "Burned VVV never comes back",
    detail:
      "Burned VVV is gone for good. Over 33.8M so far, about 42% of the original supply.",
    source: {
      name: "Venice token dashboard",
      url: "https://venice.ai/token/burns",
    },
  },
  {
    step: "Usage locks more VVV away",
    detail:
      "Lock staked VVV to create DIEM. Each DIEM pays $1 a day of Venice credit for as long as you hold it. Buying compute locks VVV away.",
    source: {
      name: "Venice, VVV & DIEM",
      url: "https://docs.venice.ai/overview/vvv-diem",
    },
  },
  {
    step: "The sellable float stays small",
    detail:
      "About 13.9M VVV is actually buyable, out of 48M in circulation.",
    source: {
      name: "Live on this page",
      url: "https://venice.ai/token",
    },
  },
];

export const THESIS_STATEMENT = `Venice is profitable and growing fast, and barely any of its token is for sale. Revenue buys VVV and burns it. Staking locks more away. New supply is being cut. VVV should end up valued closer to the AI companies it competes with.`;

export const THESIS_RISK = `It runs backwards too. Growth stalls, buybacks slow, people unstake, and this page will say so.`;
