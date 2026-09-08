"use client";

import { DAY_ZERO_LABEL } from "@/lib/constants";
import { relativeTime, usd } from "@/lib/format";
import type { ThesisModel } from "@/lib/thesis";
import { GradePill } from "./ui";

export default function TopBar({
  m,
  stale,
  pulse,
  onOpenSnapshot,
}: {
  m: ThesisModel;
  stale: boolean;
  pulse: number;
  onOpenSnapshot: () => void;
}) {
  return (
    <div className="sticky top-0 z-40 border-b bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-4 py-2.5 sm:px-6">
        <span className="text-[13px] font-semibold tracking-tight">VVV Live Thesis</span>
        <span className="hidden text-[11px] text-[var(--text-faint)] sm:inline">
          Day 0 {DAY_ZERO_LABEL}
        </span>

        <div className="ml-auto flex items-center gap-3">
          {/* Remounting on each refresh restarts the highlight animation, so no
              timer or state is needed to flash the new price. */}
          <span key={pulse} className="tnum flash text-[13px] font-semibold">
            {usd(m.price)}
          </span>
          <span
            className="tnum hidden text-[12px] sm:inline"
            style={{ color: m.priceChange24h >= 0 ? "var(--pos)" : "var(--neg)" }}
          >
            {m.priceChange24h >= 0 ? "+" : ""}
            {m.priceChange24h.toFixed(1)}%
          </span>
          <span className="hidden md:inline">
            <GradePill grade={m.overall.grade}>{m.overall.label}</GradePill>
          </span>
          <button
            onClick={onOpenSnapshot}
            className="hidden rounded-md border px-2 py-1 text-[11px] text-[var(--text-dim)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)] lg:inline-block"
          >
            Day 0
          </button>
          <ThemeToggle />
        </div>
      </div>
      {stale && (
        <div className="border-t bg-[color-mix(in_srgb,var(--warn)_12%,transparent)] px-4 py-1.5 text-center text-[11px] text-[var(--warn)] sm:px-6">
          Live refresh failed. Showing the last good read from {relativeTime(m.asOf)}.
        </div>
      )}
    </div>
  );
}

/**
 * Stateless on purpose. The theme lives on <html data-theme>, applied by the
 * inline script before paint, so there is nothing to hydrate and no mismatch.
 * CSS picks which icon to show.
 */
function ThemeToggle() {
  const flip = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try {
      localStorage.setItem("vvv-theme", next);
    } catch {
      /* private browsing */
    }
  };

  return (
    <button
      onClick={flip}
      aria-label="Toggle dark and light mode"
      className="rounded-md border p-1.5 text-[var(--text-dim)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path className="icon-moon" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        <g className="icon-sun">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </g>
      </svg>
    </button>
  );
}
