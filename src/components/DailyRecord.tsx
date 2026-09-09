"use client";

import type { DailyDelta } from "@/lib/snapshots";
import { compactNumber, longDate, usd } from "@/lib/format";
import { Card, SectionHead, TableScroll } from "./ui";

export default function DailyRecord({ rows }: { rows: DailyDelta[] }) {
  const ordered = rows.slice().reverse();

  return (
    <Card>
      <SectionHead
        eyebrow="Daily record"
        title="One row per day since Day 0"
        sub="Saved once a day to a public repository. Old rows are never edited, so anyone can check the history. Missing numbers stay blank."
        right={
          <span className="tnum shrink-0 rounded-md border px-2 py-1 text-[11px] text-[var(--text-dim)]">
            {rows.length} {rows.length === 1 ? "day" : "days"} on record
          </span>
        }
      />
      <TableScroll>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
              <th className="px-4 py-2.5 text-left font-medium sm:px-5">Date</th>
              <th className="px-4 py-2.5 text-right font-medium">VVV close</th>
              <th className="px-4 py-2.5 text-right font-medium">Free float</th>
              <th className="px-4 py-2.5 text-right font-medium">Staked + locked</th>
              <th className="px-4 py-2.5 text-right font-medium sm:px-5">Burned</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((r) => (
              <tr key={r.date} className="border-b transition-colors last:border-0 hover:bg-[var(--bg-hover)]">
                <td className="px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{longDate(r.date)}</span>
                    {r.isDayZero && (
                      <span className="rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                        Day 0
                      </span>
                    )}
                  </div>
                  {r.sourceBlock && (
                    <div className="mt-0.5 text-[11px] text-[var(--text-faint)]">
                      Base block {r.sourceBlock.toLocaleString()}
                    </div>
                  )}
                </td>
                <Cell value={r.price === null ? null : usd(r.price)} />
                <Cell
                  value={r.freeFloat === null ? null : compactNumber(r.freeFloat, 2)}
                  delta={r.freeFloatChange}
                  invert
                />
                <Cell
                  value={r.staked === null ? null : compactNumber(r.staked, 2)}
                  delta={r.stakedChange}
                />
                <Cell
                  value={r.burned === null ? null : compactNumber(r.burned, 2)}
                  delta={r.burnedChange}
                  last
                />
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </Card>
  );
}

function Cell({
  value,
  delta,
  invert = false,
  last = false,
}: {
  value: string | null;
  delta?: number | null;
  invert?: boolean;
  last?: boolean;
}) {
  const good = delta === null || delta === undefined ? null : invert ? delta < 0 : delta > 0;
  return (
    <td className={`px-4 py-3 text-right ${last ? "sm:px-5" : ""}`}>
      <div className="tnum font-medium">{value ?? <span className="text-[var(--text-faint)]">—</span>}</div>
      {delta !== null && delta !== undefined && Math.abs(delta) > 0.5 && (
        <div
          className="tnum mt-0.5 text-[11px]"
          style={{ color: good ? "var(--pos)" : "var(--neg)" }}
        >
          {delta > 0 ? "+" : "-"}
          {compactNumber(Math.abs(delta), 1)}
        </div>
      )}
    </td>
  );
}
