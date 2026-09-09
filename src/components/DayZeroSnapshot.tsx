"use client";

import { useEffect } from "react";
import { DAY_ZERO, DAY_ZERO_LABEL, DAY_ZERO_ONCHAIN } from "@/lib/constants";
import { compactNumber, usd } from "@/lib/format";
import type { ThesisModel } from "@/lib/thesis";

export default function DayZeroSnapshot({
  m,
  open,
  onClose,
}: {
  m: ThesisModel;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const rows: [string, string, string][] = [
    ["VVV price", usd(DAY_ZERO.vvvPrice), usd(m.price)],
    ["Free circulating VVV", "13.60M", compactNumber(m.freeFloat, 2)],
    ["Free-float cap", "$225.8M", "$" + compactNumber(m.freeFloatCap, 1)],
    ["Staked VVV", "25.70M", "—"],
    ["DIEM-locked VVV", "8.60M", compactNumber(m.diemLocked.value, 2)],
    ["Staked + locked (sVVV)", "34.32M", compactNumber(m.sVvvSupply, 2)],
    ["Total VVV burned", "33.84M", compactNumber(m.burnedTotal, 2)],
    ["Venice ARR", "$100M+", "$100M+"],
    ["July buy + burn", "$445K / 38.1K VVV", "—"],
    ["August buy + burn", "$672.6K / 53.7K VVV", "—"],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Day 0 snapshot"
    >
      <div
        className="fade-up max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border bg-[var(--bg-raised)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
              The starting line
            </div>
            <h2 className="mt-1.5 text-[19px] font-semibold tracking-tight">
              Day 0 snapshot · {DAY_ZERO_LABEL}
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-faint)]">
              What the numbers looked like the day the call was made.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border px-2.5 py-1 text-[12px] text-[var(--text-dim)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
          >
            Close
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[420px] text-[13px]">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
                <th className="px-5 py-2.5 text-left font-medium">Metric</th>
                <th className="px-5 py-2.5 text-right font-medium">Day 0</th>
                <th className="px-5 py-2.5 text-right font-medium">Now</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([k, a, b]) => (
                <tr key={k} className="border-b last:border-0">
                  <td className="px-5 py-2.5 text-[var(--text-dim)]">{k}</td>
                  <td className="tnum px-5 py-2.5 text-right font-medium">{a}</td>
                  <td className="tnum px-5 py-2.5 text-right text-[var(--text-dim)]">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t p-5 text-[12px] leading-relaxed text-[var(--text-faint)]">
          <p className="mb-3 font-medium text-[var(--text-dim)]">Verifiable on Base</p>
          <p>
            The Day 0 chain state was read at block{" "}
            <span className="tnum text-[var(--text-dim)]">
              {DAY_ZERO_ONCHAIN.block.toLocaleString()}
            </span>
            , the first block at or after {DAY_ZERO_LABEL} 00:00 UTC. Burned VVV was{" "}
            <span className="tnum text-[var(--text-dim)]">
              {DAY_ZERO_ONCHAIN.vvvBurned.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </span>{" "}
            and sVVV supply was{" "}
            <span className="tnum text-[var(--text-dim)]">
              {DAY_ZERO_ONCHAIN.sVvvSupply.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </span>
            . Anyone can check both against the blockchain, and together they match the staked and
            locked figures above.
          </p>
          <p className="mt-3">
            The baseline lives in one source file with a public commit history, so any revision
            shows up in the log.
          </p>
        </div>
      </div>
    </div>
  );
}
