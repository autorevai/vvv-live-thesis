"use client";

import type { ThesisModel } from "@/lib/thesis";
import { Card, SectionHead, SignalDot, TableScroll } from "./ui";

export default function Scorecard({ m }: { m: ThesisModel }) {
  return (
    <Card>
      <SectionHead
        eyebrow="Thesis scorecard"
        title="Day 0 versus now, metric by metric"
        sub="Every rule was written at launch, before the data moved."
      />
      <TableScroll>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
              <th className="px-4 py-2.5 text-left font-medium sm:px-5">Metric</th>
              <th className="px-4 py-2.5 text-right font-medium">Day 0</th>
              <th className="px-4 py-2.5 text-right font-medium">Current</th>
              <th className="px-4 py-2.5 text-right font-medium">Change</th>
              <th className="px-4 py-2.5 text-left font-medium sm:px-5">Signal</th>
            </tr>
          </thead>
          <tbody>
            {m.scorecard.map((r) => (
              <tr
                key={r.metric}
                className="border-b transition-colors last:border-0 hover:bg-[var(--bg-hover)]"
              >
                <td className="px-4 py-3 sm:px-5">
                  <div className="font-medium">{r.metric}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-[var(--text-faint)]">
                    {r.rule}
                    {r.stale && (
                      <span className="ml-1.5 text-[var(--warn)]">· {r.stale}</span>
                    )}
                  </div>
                </td>
                <td className="tnum px-4 py-3 text-right text-[var(--text-dim)]">{r.dayZero}</td>
                <td className="tnum px-4 py-3 text-right font-medium">{r.current}</td>
                <td
                  className="tnum px-4 py-3 text-right font-medium"
                  style={{
                    color:
                      r.signal === "positive"
                        ? "var(--pos)"
                        : r.signal === "negative"
                          ? "var(--neg)"
                          : "var(--text-faint)",
                  }}
                >
                  {r.change}
                </td>
                <td className="px-4 py-3 sm:px-5">
                  <SignalDot signal={r.signal} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </Card>
  );
}
