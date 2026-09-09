/**
 * Sourced coverage. Every entry carries a publisher, a date and a link, and
 * claims made by other parties stay attributed to them.
 */

export type PressItem = {
  date: string;
  publisher: string;
  title: string;
  url: string;
  note: string;
  kind: "venice" | "category" | "comparator";
};

export const PRESS: PressItem[] = [
  {
    date: "2026-09-08",
    publisher: "TechCrunch",
    title: "OpenAI fought dirty on career-making math problem, says NYU mathematician",
    url: "https://techcrunch.com/2026/09/08/openai-fought-dirty-on-career-making-math-problem-says-nyu-mathematician/",
    note: "Tristan Buckmaster says a rival effort built on his work after it reached OpenAI. He had used Codex heavily while assembling the project.",
    kind: "category",
  },
  {
    date: "2026-09-08",
    publisher: "VentureBeat",
    title:
      "OpenAI solves longstanding math problem, but can't rule out benefitting from a researcher's private Codex data",
    url: "https://venturebeat.com/technology/openai-solves-longstanding-math-problem-with-10-000-agent-swarm-but-cant-rule-out-benefitting-from-a-researchers-private-codex-data",
    note: "OpenAI denies accessing the work and says the proofs differ, while stating it cannot rule out that de-identified usage data improved its models.",
    kind: "category",
  },
  {
    date: "2026-09-08",
    publisher: "OpenAI",
    title: "A solution to the Navier-Stokes existence and smoothness problem",
    url: "https://openai.com/index/navier-stokes-solution/",
    note: "The company's own account, published the same day. Worth reading next to the statement it responds to.",
    kind: "category",
  },
  {
    date: "2026-09-08",
    publisher: "Tristan Buckmaster, NYU",
    title: "Statement accompanying three proofs",
    url: "https://cims.nyu.edu/~tristanb/statement.pdf",
    note: "The original document. Worth reading before the coverage above.",
    kind: "category",
  },
  {
    date: "2026-08-18",
    publisher: "OpenAI Help Center",
    title: "How your data is used to improve model performance",
    url: "https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance",
    note: "OpenAI's own policy. Personal ChatGPT and Codex accounts are trained on unless you opt out, and the usual opt-out does not cover Codex full environments.",
    kind: "category",
  },
  {
    date: "2026-07-01",
    publisher: "TechCrunch",
    title: "Venice AI becomes a unicorn with $65M Series A as its privacy-first platform takes off",
    url: "https://techcrunch.com/2026/07/01/venice-ai-becomes-a-unicorn-with-65m-series-a-as-its-privacy-first-ai-platform-takes-off/",
    note: "Profitable, with annualized run-rate revenue over $70M at the time, per CEO Erik Voorhees.",
    kind: "venice",
  },
  {
    date: "2026-04-15",
    publisher: "Venice",
    title: "Introducing Programmatic VVV Buy & Burns",
    url: "https://venice.ai/blog/programmatic-vvv-buy-and-burn",
    note: "Every new subscription automatically buys VVV on the open market and burns it. This is what the whole bet rests on.",
    kind: "venice",
  },
  {
    date: "2026-08-17",
    publisher: "Wall Street Journal, via Sacra",
    title: "Stripe acquires OpenRouter for more than $7B",
    url: "https://sacra.com/c/openrouter/",
    note: "The comparator behind the $500 VVV level on this page.",
    kind: "comparator",
  },
  {
    date: "2026-07-16",
    publisher: "CNBC",
    title: "Fireworks AI raises $1.5B Series D at a $17.5B valuation",
    url: "https://www.cnbc.com/2026/07/16/fireworks-nvidia-cloud-ai-startup-value.html",
    note: "The top comparator on the chart, and the ceiling the $1,000 level still sits below.",
    kind: "comparator",
  },
];

/** Venice's documented privacy modes, from venice.ai/privacy. */
export const PRIVACY_MODES = [
  {
    name: "Anonymous",
    tier: "All users",
    detail:
      "Venice proxies the request to a frontier provider. Identity is obscured, but Venice tells you to assume the provider stores the content.",
  },
  {
    name: "Private",
    tier: "Default",
    detail:
      "Inference runs on Venice-controlled GPUs or zero-retention partner infrastructure. No prompt or response is stored. Enforced by contract.",
  },
  {
    name: "TEE",
    tier: "Pro",
    detail:
      "Hardware-isolated enclave run by NEAR AI Cloud and Phala Network. The GPU operator cannot read prompts. Verified by remote attestation.",
  },
  {
    name: "E2EE",
    tier: "Pro",
    detail:
      "Encrypted on device, decrypted only inside a verified enclave. Venice cannot read it either.",
  },
];

export const OPENAI_QUOTE = `While unlikely, we cannot rule out that de-identified data derived from their usage of our products helped improve our models.`;

/** Straight from OpenAI's help centre, updated August 2026. */
export const OPENAI_POLICY = {
  training: `When you use our services for individuals such as ChatGPT and Codex, we may use your content to train our models.`,
  optOutGap: `Codex has separate controls for allowing training on full environments... Note that adjusting your settings in the ChatGPT interface or privacy portal will not affect these full-environment Codex settings.`,
  url: "https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance",
};
