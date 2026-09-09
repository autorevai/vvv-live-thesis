"use client";

import { DAY_ZERO, DAY_ZERO_LABEL } from "@/lib/constants";
import { FLYWHEEL, TARGETS, THESIS_RISK, THESIS_STATEMENT } from "@/lib/thesis-case";
import { compactNumber, usd } from "@/lib/format";
import type { ThesisModel } from "@/lib/thesis";
import { Card, SectionHead, TableScroll } from "./ui";

export default function TheThesis({ m }: { m: ThesisModel }) {
  const rows = [
    {
      key: "day0",
      label: "Day 0",
      sub: DAY_ZERO_LABEL,
      price: DAY_ZERO.vvvPrice,
      cap: DAY_ZERO.vvvFreeFloatCap,
      upside: null as number | null,
      tone: "past" as const,
    },
    {
      key: "now",
      label: "Today",
      sub: `day ${m.daysLive}`,
      price: m.price,
      cap: m.freeFloatCap,
      upside: m.price / DAY_ZERO.vvvPrice,
      tone: "now" as const,
    },
    ...TARGETS.map((t) => ({
      key: t.key,
      label: t.label,
      sub: t.thesis,
      price: t.price,
      cap: t.price * m.freeFloat,
      upside: t.price / m.price,
      tone: "target" as const,
    })),
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
      <Card>
        <SectionHead
          eyebrow="The case"
          title="Where these targets come from"
          sub="Each target is a company-sized valuation, turned back into a VVV price."
        />

        <div className="border-b p-4 sm:p-5">
          <p className="text-[14px] leading-relaxed text-[var(--text-dim)]">{THESIS_STATEMENT}</p>
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-faint)]">{THESIS_RISK}</p>
        </div>

        <TableScroll>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
                <th className="px-4 py-2.5 text-left font-medium sm:px-5">Scenario</th>
                <th className="px-4 py-2.5 text-right font-medium">VVV</th>
                <th className="px-4 py-2.5 text-right font-medium">Free-float cap</th>
                <th className="px-4 py-2.5 text-right font-medium sm:px-5">From here</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.key}
                  className="border-b last:border-0"
                  style={
                    r.tone === "now"
                      ? { background: "color-mix(in srgb, var(--vvv) 9%, transparent)" }
                      : undefined
                  }
                >
                  <td className="px-4 py-3 sm:px-5">
                    <div
                      className="font-semibold"
                      style={r.tone === "target" ? { color: "var(--text)" } : undefined}
                    >
                      {r.label}
                    </div>
                    <div className="mt-0.5 max-w-[22rem] text-[11px] leading-snug text-[var(--text-faint)]">
                      {r.sub}
                    </div>
                  </td>
                  <td className="tnum px-4 py-3 text-right font-semibold">
                    {r.price >= 100 ? "$" + r.price.toLocaleString() : usd(r.price)}
                  </td>
                  <td className="tnum px-4 py-3 text-right">${compactNumber(r.cap, 2)}</td>
                  <td className="tnum px-4 py-3 text-right sm:px-5">
                    {r.upside === null ? (
                      <span className="text-[var(--text-faint)]">baseline</span>
                    ) : (
                      <span
                        className="font-semibold"
                        style={{ color: r.tone === "now" ? "var(--pos)" : "var(--accent)" }}
                      >
                        {r.upside.toFixed(1)}x
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>

        <div className="space-y-3 border-t p-4 sm:p-5">
          {TARGETS.map((t) => (
            <div key={t.key} className="flex gap-3">
              <span className="tnum mt-0.5 w-[52px] shrink-0 text-[13px] font-semibold text-[var(--accent)]">
                ${t.price.toLocaleString()}
              </span>
              <p className="text-[12px] leading-relaxed text-[var(--text-faint)]">{t.anchor}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHead
          eyebrow="How it works"
          title="What has to happen, step by step"
          sub="Every step is something Venice already built."
        />
        <ol className="divide-y">
          {FLYWHEEL.map((f, i) => (
            <li key={f.step} className="flex gap-3.5 p-4 sm:px-5">
              <div className="flex flex-col items-center">
                <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold text-[var(--text-dim)]">
                  {i + 1}
                </span>
                {i < FLYWHEEL.length - 1 && (
                  <span className="mt-1 w-px flex-1 bg-[var(--border)]" aria-hidden />
                )}
              </div>
              <div className="pb-0.5">
                <div className="text-[13px] font-semibold">{f.step}</div>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-faint)]">
                  {f.detail}
                </p>
                <a
                  href={f.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block text-[11px] text-[var(--text-faint)] underline decoration-dotted underline-offset-2 hover:text-[var(--text-dim)]"
                >
                  {f.source.name}
                </a>
              </div>
            </li>
          ))}
        </ol>
        <p className="border-t p-4 text-[11px] leading-relaxed text-[var(--text-faint)] sm:px-5">
          The rest of the page answers one question: is it happening?
        </p>
      </Card>
    </div>
  );
}
