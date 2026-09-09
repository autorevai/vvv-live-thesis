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
      "A $1.4B valuation. Venice does not have to win the category to get there. It just has to keep growing from a business already past $100M a year while supply stays tight.",
  },
  {
    key: "bull",
    price: 500,
    label: "Bull case",
    thesis: "Valued like Stripe valued OpenRouter.",
    anchor:
      "A $6.95B valuation, which is roughly the $7B Stripe paid for OpenRouter. This is where VVV gets priced like real AI infrastructure.",
  },
  {
    key: "extreme",
    price: 1000,
    label: "Extreme bull",
    thesis: "Worth about what Baseten is worth.",
    anchor:
      "A $13.9B valuation. That is about what Baseten is worth, and still less than the $17.5B Fireworks raised at.",
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
      "Every new subscription automatically buys VVV on the open market and burns it: $2 for Pro, $5 for Pro+, $10 for Max. Venice also buys back on its own on top of that. This happens automatically, it is not a promise.",
    source: {
      name: "Venice, Programmatic VVV Buy & Burns",
      url: "https://venice.ai/blog/programmatic-vvv-buy-and-burn",
    },
  },
  {
    step: "Burned VVV never comes back",
    detail:
      "The VVV Venice buys is gone for good. Over 33.8M has been burned, about 42% of the original 100M supply.",
    source: {
      name: "Venice token dashboard",
      url: "https://venice.ai/token/burns",
    },
  },
  {
    step: "Usage locks more VVV away",
    detail:
      "Staked VVV can be locked up to create DIEM, and each DIEM gives you $1 a day of Venice credit for as long as you hold it. So buying compute means locking away VVV, and it stays locked until you give the DIEM back.",
    source: {
      name: "Venice, VVV & DIEM",
      url: "https://docs.venice.ai/overview/vvv-diem",
    },
  },
  {
    step: "The sellable float stays small",
    detail:
      "After burns and staking, only about 13.9M VVV can actually be bought, out of more than 48M in circulation. There is not much for sale.",
    source: {
      name: "Live on this page",
      url: "https://venice.ai/token",
    },
  },
];

export const THESIS_STATEMENT = `Venice is a profitable, fast-growing AI business, and very little of its token is actually available to buy. Revenue automatically buys VVV and burns it. Staking holds more of it off the market. New supply is being cut. If that keeps up, VVV should be valued closer to the AI companies it competes with.`;

export const THESIS_RISK = `All of it can run backwards. If growth stalls, if the buying slows, or if people unstake and more VVV hits the market, this gets worse, and the page will say so.`;
