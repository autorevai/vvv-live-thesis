import type { ReactNode } from "react";
import type { Grade, Signal } from "@/lib/thesis";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border bg-[var(--bg-raised)] ${className}`}>{children}</section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
      <div>
        {eyebrow && (
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
            {eyebrow}
          </div>
        )}
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {sub && (
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-[var(--text-faint)]">
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const GRADE_STYLE: Record<Grade, { fg: string; bg: string; label: string }> = {
  strengthening: { fg: "var(--pos)", bg: "color-mix(in srgb, var(--pos) 12%, transparent)", label: "Strengthening" },
  neutral: { fg: "var(--text-dim)", bg: "color-mix(in srgb, var(--text-dim) 12%, transparent)", label: "Neutral" },
  weakening: { fg: "var(--neg)", bg: "color-mix(in srgb, var(--neg) 12%, transparent)", label: "Weakening" },
};

export function GradePill({
  grade,
  children,
  size = "sm",
}: {
  grade: Grade;
  children?: ReactNode;
  size?: "sm" | "lg";
}) {
  const s = GRADE_STYLE[grade];
  return (
    <span
      className={
        size === "lg"
          ? "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[14px] font-semibold"
          : "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold"
      }
      style={{ color: s.fg, background: s.bg }}
    >
      <span
        className="rounded-full"
        style={{
          background: s.fg,
          width: size === "lg" ? 7 : 5,
          height: size === "lg" ? 7 : 5,
        }}
        aria-hidden
      />
      {children ?? s.label}
    </span>
  );
}

export function SignalDot({ signal }: { signal: Signal }) {
  const color =
    signal === "positive" ? "var(--pos)" : signal === "negative" ? "var(--neg)" : "var(--text-faint)";
  const label = signal === "positive" ? "Positive" : signal === "negative" ? "Negative" : "Neutral";
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}

/** Every wide table goes through here so columns can never be clipped away. */
export function TableScroll({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[640px]">{children}</div>
    </div>
  );
}

export function Delta({ value, invert = false }: { value: number; invert?: boolean }) {
  const good = invert ? value < 0 : value > 0;
  const flat = Math.abs(value) < 0.05;
  const color = flat ? "var(--text-faint)" : good ? "var(--pos)" : "var(--neg)";
  return (
    <span className="tnum font-medium" style={{ color }}>
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}
