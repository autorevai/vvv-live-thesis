"use client";

import type { ThesisModel } from "@/lib/thesis";
import { Card, SectionHead } from "./ui";

export default function FailureConditions({ m }: { m: ThesisModel }) {
  const conditions: { text: string; status: "watch" | "tripped" | "clear" }[] = [
    {
      text: "Venice revenue growth slows down, or they just stop publishing the numbers",
      status: "watch",
    },
    {
      text: "Venice buys back less VVV than the 53.7K per 30 days it was doing at Day 0",
      status: m.burnPacePct < -10 ? "tripped" : "clear",
    },
    {
      text: "People unstake, and more VVV becomes available to sell",
      status: m.floatChange > 5 ? "tripped" : m.floatChange > 1 ? "watch" : "clear",
    },
    {
      text: "Staking and DIEM locking drop, putting supply back on the market",
      status: m.stakedPct < -5 ? "tripped" : m.stakedPct < 0 ? "watch" : "clear",
    },
    {
      text: "New VVV paid out to stakers outpaces what gets burned",
      status: "watch",
    },
    {
      text: "VVV keeps losing to TAO, ZEC and NEAR from where it started",
      status: m.vvvReturn < 0 ? "tripped" : "clear",
    },
    {
      text: "Private AI stays a niche thing instead of something companies pay for",
      status: "watch",
    },
    {
      text: "Venice falls behind the bigger AI companies it is being compared to",
      status: "watch",
    },
  ];

  const style = {
    tripped: { color: "var(--neg)", label: "Tripped" },
    watch: { color: "var(--warn)", label: "Watch" },
    clear: { color: "var(--pos)", label: "Clear" },
  } as const;

  return (
    <Card>
      <SectionHead
        eyebrow="Risks"
        title="What would prove this wrong"
        sub="Written at launch. Live where there is a source for it."
      />
      <ul className="grid grid-cols-1 gap-px bg-[var(--border)] md:grid-cols-2">
        {conditions.map((c) => {
          const s = style[c.status];
          return (
            <li key={c.text} className="flex items-start gap-3 bg-[var(--bg-raised)] p-4">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: s.color }}
                aria-hidden
              />
              <span className="flex-1 text-[13px] leading-relaxed text-[var(--text-dim)]">
                {c.text}
              </span>
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: s.color, background: `color-mix(in srgb, ${s.color} 12%, transparent)` }}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
