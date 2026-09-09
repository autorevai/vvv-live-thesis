"use client";

import { DAY_ZERO } from "@/lib/constants";
import { TARGETS } from "@/lib/thesis-case";
import { compactNumber, usd } from "@/lib/format";
import type { ThesisModel } from "@/lib/thesis";

export default function Targets({ m }: { m: ThesisModel }) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
          Price targets
        </h2>
        <p className="text-[11px] text-[var(--text-faint)]">
          Called {DAY_ZERO.date === "2026-08-29" ? "Aug 29, 2026" : DAY_ZERO.date} at{" "}
          {usd(DAY_ZERO.vvvPrice)}. Now {usd(m.price)}, a free-float cap of $
          {compactNumber(m.freeFloatCap, 0)}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border bg-[var(--border)] sm:grid-cols-3">
        {TARGETS.map((t) => {
          const cap = t.price * m.freeFloat;
          const from = t.price / m.price;
          const progress = Math.max(
            0,
            Math.min(100, ((m.freeFloatCap - DAY_ZERO.vvvFreeFloatCap) / (cap - DAY_ZERO.vvvFreeFloatCap)) * 100),
          );
          return (
            <article key={t.key} className="bg-[var(--bg-raised)] p-4 sm:p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">
                {t.label}
              </div>

              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="tnum text-[38px] font-semibold leading-none tracking-[-0.03em]">
                  ${t.price.toLocaleString()}
                </span>
                <span className="tnum text-[16px] font-semibold text-[var(--accent)]">
                  {from.toFixed(1)}x
                </span>
              </div>

              <div className="tnum mt-2 text-[12px] text-[var(--text-dim)]">
                ${compactNumber(cap, 2)} free-float cap
              </div>

              <p className="mt-2.5 text-[12px] leading-snug text-[var(--text-faint)]">{t.thesis}</p>

              <div className="mt-3.5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--bg-hover)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${Math.max(1.5, progress)}%` }}
                  />
                </div>
                <span className="tnum text-[11px] text-[var(--text-faint)]">
                  {progress.toFixed(0)}%
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
