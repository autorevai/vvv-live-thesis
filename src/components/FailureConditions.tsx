"use client";

import type { ThesisModel } from "@/lib/thesis";
import { Card, SectionHead } from "./ui";

export default function FailureConditions({ m }: { m: ThesisModel }) {
  const conditions: { text: string; status: "watch" | "tripped" | "clear" }[] = [
    {
      text: "Venice ARR growth materially slows, or the company stops publishing figures at all",
      status: "watch",
    },
    {
      text: "Buy-and-burn activity declines against the 53.7K VVV per 30 days set at Day 0",
      status: m.burnPacePct < -10 ? "tripped" : "clear",
    },
    {
      text: "Free circulating VVV rises materially as staked positions unwind",
      status: m.floatChange > 5 ? "tripped" : m.floatChange > 1 ? "watch" : "clear",
    },
    {
      text: "Staking and DIEM locking fall, releasing supply back into the float",
      status: m.stakedPct < -5 ? "tripped" : m.stakedPct < 0 ? "watch" : "clear",
    },
    {
      text: "Emissions to stakers overwhelm the pace of burns",
      status: "watch",
    },
    {
      text: "VVV persistently underperforms TAO, ZEC and NEAR from the Day 0 baseline",
      status: m.vvvReturn < 0 ? "tripped" : "clear",
    },
    {
      text: "Private, uncensored AI stays a niche category rather than becoming infrastructure",
      status: "watch",
    },
    {
      text: "Venice loses product momentum to the larger inference providers it is priced against",
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
        eyebrow="Falsifiability"
        title="How this thesis fails"
        sub="A thesis that cannot fail is marketing. These are the conditions that would break it, published at launch and checked against live data where a live source exists."
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
      <p className="border-t p-4 text-[11px] leading-relaxed text-[var(--text-faint)] sm:p-5">
        Conditions marked Watch have no live feed and are judged by hand when new information is
        published. They are never inferred from price.
      </p>
    </Card>
  );
}
