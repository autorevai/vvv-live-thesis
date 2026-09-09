"use client";

import { compactNumber, longDate, usd } from "@/lib/format";
import type { ThesisModel } from "@/lib/thesis";
import { Card, SectionHead, TableScroll } from "./ui";

export default function Scoreboard({ m }: { m: ThesisModel }) {
  return (
    <Card>
      <SectionHead
        eyebrow="Valuation scoreboard"
        title="How far is VVV from each level?"
        sub="Implied VVV is the price if VVV were valued like that company today."
      />
      <TableScroll>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
              <th className="px-4 py-2.5 text-left font-medium sm:px-5">Benchmark</th>
              <th className="px-4 py-2.5 text-right font-medium">Valuation</th>
              <th className="px-4 py-2.5 text-right font-medium">Implied VVV</th>
              <th className="px-4 py-2.5 text-right font-medium">Multiple</th>
              <th className="px-4 py-2.5 text-right font-medium sm:px-5">Gap closed</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b bg-[color-mix(in_srgb,var(--vvv)_9%,transparent)]">
              <td className="px-4 py-3 font-semibold sm:px-5">
                VVV today
                <span className="ml-2 rounded border px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-dim)]">
                  Free-float cap
                </span>
              </td>
              <td className="tnum px-4 py-3 text-right font-semibold">
                ${compactNumber(m.freeFloatCap, 1)}
              </td>
              <td className="tnum px-4 py-3 text-right font-semibold">{usd(m.price)}</td>
              <td className="tnum px-4 py-3 text-right text-[var(--text-faint)]">1.0x</td>
              <td className="tnum px-4 py-3 text-right sm:px-5">—</td>
            </tr>
            {m.benchmarks.map((b) => {
              const isCrypto = b.kind === "crypto";
              return (
                <tr
                  key={b.key}
                  className="border-b transition-colors last:border-0 hover:bg-[var(--bg-hover)]"
                >
                  <td className="px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          background:
                            b.kind === "milestone"
                              ? "var(--border-strong)"
                              : isCrypto
                                ? "var(--accent)"
                                : "var(--warn)",
                        }}
                        aria-hidden
                      />
                      <span className="font-medium">{b.label}</span>
                    </div>
                    {b.valuationType && (
                      <div className="mt-0.5 pl-3.5 text-[11px] leading-snug text-[var(--text-faint)]">
                        {b.valuationType}
                        {b.effectiveDate && ` · ${longDate(b.effectiveDate)}`}
                        {b.sourceUrl && (
                          <>
                            {" · "}
                            <a
                              href={b.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline decoration-dotted underline-offset-2 hover:text-[var(--text-dim)]"
                            >
                              {b.sourceName}
                            </a>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="tnum px-4 py-3 text-right">${compactNumber(b.valuation, 2)}</td>
                  <td className="tnum px-4 py-3 text-right font-medium">
                    {usd(b.impliedVvvPrice, { dp: b.impliedVvvPrice < 10 ? 2 : 0 })}
                  </td>
                  <td className="tnum px-4 py-3 text-right font-medium">
                    {b.multipleFromCurrent.toFixed(1)}x
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1 w-14 overflow-hidden rounded-full bg-[var(--bg-hover)]">
                        <div
                          className="h-full rounded-full bg-[var(--accent)]"
                          style={{ width: `${Math.max(1, Math.min(100, b.gapClosed))}%` }}
                        />
                      </div>
                      <span className="tnum w-9 text-right text-[12px] text-[var(--text-dim)]">
                        {b.gapClosed.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>
    </Card>
  );
}
