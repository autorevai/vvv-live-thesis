"use client";

import { DAY_ZERO, DAY_ZERO_LABEL } from "@/lib/constants";
import { compactNumber, pct, relativeTime, usd } from "@/lib/format";
import type { ThesisModel } from "@/lib/thesis";
import { GradePill } from "./ui";

export default function Hero({ m, onOpenSnapshot }: { m: ThesisModel; onOpenSnapshot: () => void }) {
  const tiles = [
    { label: "VVV price", value: usd(m.price), sub: pct(m.priceChange24h) + " 24h", tone: m.priceChange24h },
    {
      label: "Free float",
      value: compactNumber(m.freeFloat, 2) + " VVV",
      sub: pct(m.floatChange) + " since Day 0",
      tone: -m.floatChange,
    },
    {
      label: "Free-float cap",
      value: "$" + compactNumber(m.freeFloatCap, 1),
      sub: pct(m.capReturn) + " since Day 0",
      tone: m.capReturn,
    },
    {
      label: "Burned since Day 0",
      value: compactNumber(m.burnedSinceDayZero, 1) + " VVV",
      sub: "$" + compactNumber(m.burnedSinceDayZero * m.price, 0) + " at spot",
      tone: 1,
    },
    {
      label: "To TAO parity",
      value: m.taoMultiple.toFixed(1) + "x",
      sub: "$" + compactNumber(m.tao.marketCap, 2) + " TAO cap",
      tone: 0,
    },
    {
      label: "Venice ARR",
      value: "$100M+",
      sub: "Verified Aug 29, 2026",
      tone: 0,
      stale: true,
    },
  ];

  return (
    <header className="relative overflow-hidden border-b">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-[1180px] px-4 pb-6 pt-10 sm:px-6 sm:pb-8 sm:pt-16">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium text-[var(--text-dim)]">
            <span className="pulse h-1.5 w-1.5 rounded-full bg-[var(--pos)]" aria-hidden />
            Live
          </span>
          <span className="text-[11px] text-[var(--text-faint)]">
            Day 0: {DAY_ZERO_LABEL} · day {m.daysLive} · market data{" "}
            {relativeTime(m.freshness.market)}
          </span>
        </div>

        <h1 className="mt-5 text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[52px]">
          Is the VVV thesis
          <br className="hidden sm:block" /> working?
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <GradePill grade={m.overall.grade} size="lg">
            {m.overall.label}
          </GradePill>
          <span className="text-[13px] text-[var(--text-dim)]">
            {m.overall.strengthening} of {m.overall.scored} measurable pillars strengthening
          </span>
          <button
            onClick={onOpenSnapshot}
            className="rounded-md border px-2.5 py-1 text-[12px] text-[var(--text-dim)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
          >
            View Day 0 snapshot
          </button>
        </div>

        <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-[var(--text-dim)]">
          A falsifiable, public bet on one question: can Venice&apos;s growth, its programmatic
          buy-and-burn, and staking that locks supply away carry a{" "}
          <span className="text-[var(--text)]">{compactNumber(m.freeFloat, 2)} VVV</span> free float
          toward the valuations of TAO, ZEC, NEAR and the private AI infrastructure companies. The
          baseline below was frozen on {DAY_ZERO_LABEL} at {usd(DAY_ZERO.vvvPrice)} and cannot be
          edited.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-[var(--border)] sm:grid-cols-3 lg:grid-cols-6">
          {tiles.map((t) => (
            <div key={t.label} className="bg-[var(--bg-raised)] p-3.5">
              <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--text-faint)]">
                {t.label}
              </div>
              <div className="tnum mt-1.5 text-[19px] font-semibold tracking-tight">{t.value}</div>
              <div
                className="tnum mt-0.5 text-[11px]"
                style={{
                  color: t.stale
                    ? "var(--warn)"
                    : t.tone > 0
                      ? "var(--pos)"
                      : t.tone < 0
                        ? "var(--neg)"
                        : "var(--text-faint)",
                }}
              >
                {t.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
