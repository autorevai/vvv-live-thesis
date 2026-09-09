"use client";

import { useMemo, useState } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryPayload } from "@/app/api/history/route";
import { DAY_ZERO_LABEL, PRICE_MILESTONES, PRIVATE_BENCHMARKS } from "@/lib/constants";
import { compactNumber, longDate, usd } from "@/lib/format";

type Mode = "valuation" | "indexed" | "gap";
type RangeKey = "1M" | "3M" | "THESIS" | "ALL";
type SeriesKey = "vvv" | "tao" | "zec" | "near";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "1M", label: "1M" },
  { key: "3M", label: "3M" },
  { key: "THESIS", label: "Since thesis" },
  { key: "ALL", label: "All" },
];

const MODES: { key: Mode; label: string }[] = [
  { key: "valuation", label: "Valuation" },
  { key: "indexed", label: "Since Day 0" },
  { key: "gap", label: "Gap to parity" },
];

const SERIES: { key: SeriesKey; label: string; short: string; color: string; width: number }[] = [
  { key: "vvv", label: "VVV free-float cap", short: "VVV", color: "var(--vvv)", width: 2.25 },
  { key: "tao", label: "TAO market cap", short: "TAO", color: "var(--tao)", width: 1.4 },
  { key: "zec", label: "ZEC market cap", short: "ZEC", color: "var(--zec)", width: 1.4 },
  { key: "near", label: "NEAR market cap", short: "NEAR", color: "var(--near)", width: 1.4 },
];

/** VVV against itself is always 1.0x, so it has no place in the gap view. */
const COMPARATORS = SERIES.filter((s) => s.key !== "vvv");

type ChartRow = {
  t: number;
  vvv: number | null;
  tao: number | null;
  zec: number | null;
  near: number | null;
  vvvPrice: number | null;
  vvvCap: number | null;
  taoCap: number | null;
  zecCap: number | null;
  nearCap: number | null;
};

const COPY: Record<Mode, { title: string; sub: string }> = {
  valuation: {
    title: "Free-float valuation vs comparators",
    sub: "Logarithmic. VVV plotted as free-float cap, comparators as full market cap.",
  },
  indexed: {
    title: "Performance since Day 0",
    sub: `Every asset set to 1.00x on ${DAY_ZERO_LABEL}. Price return only.`,
  },
  gap: {
    title: "How far VVV still has to go",
    sub: "How many times the free-float cap has to multiply to reach each comparator. Down is the thesis working.",
  },
};

export default function ThesisChart({
  history,
  freeFloat,
}: {
  history: HistoryPayload | null;
  freeFloat: number;
}) {
  const [mode, setMode] = useState<Mode>("valuation");
  const [range, setRange] = useState<RangeKey>("THESIS");
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());
  const [showBenchmarks, setShowBenchmarks] = useState(true);

  const dayZeroMs = history?.dayZeroMs ?? 0;
  const active = mode === "gap" ? COMPARATORS : SERIES;

  const filtered = useMemo(() => {
    const points = history?.points ?? [];
    if (!points.length) return [];
    const now = points[points.length - 1].t;
    const cut =
      range === "1M"
        ? now - 30 * 86_400_000
        : range === "3M"
          ? now - 90 * 86_400_000
          : range === "THESIS"
            ? dayZeroMs
            : 0;
    return points.filter((p) => p.t >= cut);
  }, [history, range, dayZeroMs]);

  const rows: ChartRow[] = useMemo(
    () =>
      filtered.map((p) => {
        const gap = (cap: number | null) =>
          cap !== null && p.vvvCap ? cap / p.vvvCap : null;
        return {
          t: p.t,
          vvv: mode === "valuation" ? p.vvvCap : mode === "indexed" ? p.vvvIndex : null,
          tao: mode === "valuation" ? p.taoCap : mode === "indexed" ? p.taoIndex : gap(p.taoCap),
          zec: mode === "valuation" ? p.zecCap : mode === "indexed" ? p.zecIndex : gap(p.zecCap),
          near:
            mode === "valuation" ? p.nearCap : mode === "indexed" ? p.nearIndex : gap(p.nearCap),
          vvvPrice: p.vvvPrice,
          vvvCap: p.vvvCap,
          taoCap: p.taoCap,
          zecCap: p.zecCap,
          nearCap: p.nearCap,
        };
      }),
    [filtered, mode],
  );

  /** Day 0 gap per comparator, so the legend can show progress rather than a bare number. */
  const gapProgress = useMemo(() => {
    if (mode !== "gap") return null;
    const all = history?.points ?? [];
    const atDayZero = all.find((p) => p.t >= dayZeroMs);
    const latest = all[all.length - 1];
    if (!atDayZero || !latest) return null;
    const at = (p: typeof latest, cap: "taoCap" | "zecCap" | "nearCap") =>
      p[cap] !== null && p.vvvCap ? (p[cap] as number) / p.vvvCap : null;
    return {
      tao: { then: at(atDayZero, "taoCap"), now: at(latest, "taoCap") },
      zec: { then: at(atDayZero, "zecCap"), now: at(latest, "zecCap") },
      near: { then: at(atDayZero, "nearCap"), now: at(latest, "nearCap") },
    } as Record<string, { then: number | null; now: number | null }>;
  }, [mode, history, dayZeroMs]);

  const benchmarks = useMemo(() => {
    if (mode !== "valuation" || !showBenchmarks) return [];
    return [
      ...PRICE_MILESTONES.map((p) => ({
        y: p * freeFloat,
        label: `$${p.toLocaleString()} VVV`,
        kind: "milestone" as const,
      })),
      ...PRIVATE_BENCHMARKS.map((b) => ({
        y: b.valuation,
        label: b.company,
        kind: "private" as const,
      })),
    ];
  }, [mode, showBenchmarks, freeFloat]);

  const domain = useMemo<[number, number]>(() => {
    const vals: number[] = [];
    for (const r of rows) {
      for (const k of active) {
        if (hidden.has(k.key)) continue;
        const v = r[k.key];
        if (typeof v === "number" && v > 0) vals.push(v);
      }
    }
    for (const b of benchmarks) vals.push(b.y);
    if (!vals.length) return [1, 10];
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    if (mode === "indexed") return [Math.min(0.95, lo * 0.98), Math.max(1.05, hi * 1.03)];
    // Do not drag parity (1.0x) into the domain. On a log axis that squashes a
    // 7x-to-60x spread into the top third and hides the movement, which is the
    // only thing this view exists to show.
    if (mode === "gap") return [lo * 0.75, hi * 1.25];
    return [lo * 0.62, hi * 1.5];
  }, [rows, hidden, benchmarks, mode, active]);

  // Recharts packs a log axis with ticks and picks ragged linear ones. Choose
  // decade steps for log modes and round steps for the indexed view.
  const ticks = useMemo(() => {
    const [lo, hi] = domain;
    if (mode === "indexed") {
      const span = hi - lo;
      const step = span > 1 ? 0.25 : span > 0.4 ? 0.1 : 0.05;
      const out: number[] = [];
      for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(Number(v.toFixed(2)));
      return out.length > 2 ? out : undefined;
    }
    const out: number[] = [];
    for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) {
      for (const m of [1, 2, 5]) {
        const v = m * 10 ** e;
        if (v >= lo && v <= hi) out.push(v);
      }
    }
    return out.length > 2 ? out : undefined;
  }, [domain, mode]);

  /**
   * Some benchmarks land almost on top of each other ($500 VVV is ~$6.95B and
   * OpenRouter is $7B). Draw every line, but drop a label that would collide
   * with the one above it. The scoreboard below carries the full list.
   */
  const labelled = useMemo(() => {
    if (!benchmarks.length) return [] as (typeof benchmarks[number] & { showLabel: boolean })[];
    const [lo, hi] = domain;
    const span = Math.log10(hi) - Math.log10(lo);
    let lastPos = Infinity;
    return [...benchmarks]
      .sort((a, b) => b.y - a.y)
      .map((b) => {
        const pos = (Math.log10(hi) - Math.log10(b.y)) / span;
        const showLabel = lastPos === Infinity || pos - lastPos > 0.045;
        if (showLabel) lastPos = pos;
        return { ...b, showLabel };
      });
  }, [benchmarks, domain]);

  const toggle = (k: SeriesKey) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else if (active.filter((s) => !next.has(s.key)).length > 1) next.add(k);
      return next;
    });

  const axisFormat = (v: number) =>
    mode === "valuation" ? "$" + compactNumber(v, 0) : v.toFixed(2) + "x";

  return (
    <section className="rounded-xl border bg-[var(--bg-raised)]">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">{COPY[mode].title}</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-faint)]">
            {COPY[mode].sub}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented options={MODES} value={mode} onChange={(v) => setMode(v as Mode)} />
          <Segmented options={RANGES} value={range} onChange={(v) => setRange(v as RangeKey)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-4 sm:px-5">
        {active.map((s) => {
          const off = hidden.has(s.key);
          const p = gapProgress?.[s.key];
          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              className="group flex items-baseline gap-2 text-[12px] transition-opacity"
              style={{ opacity: off ? 0.35 : 1 }}
              aria-pressed={!off}
            >
              <span
                className="h-[3px] w-4 shrink-0 translate-y-[-3px] rounded-full"
                style={{ background: s.color }}
                aria-hidden
              />
              <span className="text-[var(--text-dim)] group-hover:text-[var(--text)]">
                {mode === "valuation" ? s.label : s.short}
              </span>
              {p?.then != null && p.now != null && (
                <span className="tnum text-[11px] text-[var(--text-faint)]">
                  {p.then.toFixed(1)}x →{" "}
                  <span style={{ color: p.now < p.then ? "var(--pos)" : "var(--neg)" }}>
                    {p.now.toFixed(1)}x
                  </span>
                </span>
              )}
            </button>
          );
        })}
        {mode === "valuation" && (
          <button
            onClick={() => setShowBenchmarks((v) => !v)}
            className="ml-auto rounded-md border px-2 py-1 text-[11px] text-[var(--text-dim)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
            aria-pressed={showBenchmarks}
          >
            {showBenchmarks ? "Hide benchmarks" : "Show benchmarks"}
          </button>
        )}
      </div>

      <div className="h-[380px] w-full px-1 pb-2 pt-3 sm:h-[480px] sm:px-2">
        {!history ? (
          <div className="flex h-full items-center justify-center text-[13px] text-[var(--text-faint)]">
            Loading history…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 12, right: 10, left: 10, bottom: 8 }}>
              <defs>
                <linearGradient id="vvvFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--vvv)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--vvv)" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t) =>
                  new Date(t).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })
                }
                tick={{ fill: "var(--text-faint)", fontSize: 11 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                minTickGap={44}
                dy={6}
              />
              <YAxis
                scale={mode === "indexed" ? "linear" : "log"}
                domain={domain}
                allowDataOverflow
                orientation="right"
                width={58}
                ticks={ticks}
                tickFormatter={axisFormat}
                tick={{ fill: "var(--text-faint)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              {mode === "indexed" && (
                <ReferenceLine
                  y={1}
                  stroke="var(--border-strong)"
                  strokeDasharray="4 4"
                  label={{
                    value: "Day 0 = 1.00x",
                    position: "insideTopLeft",
                    fill: "var(--text-faint)",
                    fontSize: 10,
                  }}
                />
              )}

              {mode === "gap" && domain[0] <= 1 && (
                <ReferenceLine
                  y={1}
                  stroke="var(--pos)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                  label={{
                    value: "Parity",
                    position: "insideTopLeft",
                    fill: "var(--pos)",
                    fontSize: 10,
                  }}
                />
              )}

              {labelled.map((b) => (
                <ReferenceLine
                  key={b.label}
                  y={b.y}
                  stroke={b.kind === "milestone" ? "var(--border-strong)" : "var(--warn)"}
                  strokeDasharray={b.kind === "milestone" ? "3 5" : "2 4"}
                  strokeOpacity={b.kind === "milestone" ? 0.75 : 0.55}
                  label={
                    b.showLabel
                      ? {
                          value: b.label,
                          position: "insideTopLeft",
                          offset: 6,
                          dy: -3,
                          fill: b.kind === "milestone" ? "var(--text-faint)" : "var(--warn)",
                          fontSize: 10,
                        }
                      : undefined
                  }
                />
              ))}

              {dayZeroMs > (rows[0]?.t ?? 0) && (
                <ReferenceLine
                  x={dayZeroMs}
                  stroke="var(--text-dim)"
                  strokeDasharray="5 4"
                  label={{
                    value: "THESIS LAUNCH",
                    position: "insideTopLeft",
                    fill: "var(--text-dim)",
                    fontSize: 10,
                    offset: 10,
                  }}
                />
              )}

              {mode !== "gap" && !hidden.has("vvv") && (
                <Area
                  type="monotone"
                  dataKey="vvv"
                  stroke="none"
                  fill="url(#vvvFill)"
                  isAnimationActive={false}
                  connectNulls
                />
              )}

              {active
                .filter((s) => s.key !== "vvv" && !hidden.has(s.key))
                .map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={mode === "gap" ? 2 : s.width}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0 }}
                    isAnimationActive={false}
                    connectNulls
                  />
                ))}

              {mode !== "gap" && !hidden.has("vvv") && (
                <Line
                  type="monotone"
                  dataKey="vvv"
                  stroke="var(--vvv)"
                  strokeWidth={2.25}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--bg-raised)" }}
                  isAnimationActive={false}
                  connectNulls
                />
              )}

              <Tooltip
                cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
                content={<ChartTooltip mode={mode} freeFloat={freeFloat} hidden={hidden} rows={rows} />}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="border-t px-4 py-3 text-[11px] leading-relaxed text-[var(--text-faint)] sm:px-5">
        {mode === "gap" ? (
          <>
            Each line is how many times bigger that comparator is than VVV on the day. It falls
            when VVV gains ground and rises when it loses ground, whichever way the whole market
            moved. 1.0x means they are worth the same.
          </>
        ) : mode === "indexed" ? (
          <>
            This shows which one moved more, not how close VVV is to catching them. Switch to Gap
            to parity for that.
          </>
        ) : (
          <>
            The historical free-float cap line applies today&apos;s free float of{" "}
            <span className="tnum text-[var(--text-dim)]">{compactNumber(freeFloat, 2)} VVV</span> to
            each day&apos;s VVV close. Free float was {compactNumber(13_600_000, 2)} at Day 0, so the
            scaling shifts the line by under 3 percent. Daily float snapshots start accumulating from
            launch and will replace this once the series is long enough to stand on its own.
          </>
        )}
      </p>
    </section>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border bg-[var(--bg)] p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className="rounded-[6px] px-2.5 py-1 text-[12px] font-medium transition-colors"
          style={
            value === o.key
              ? { background: "var(--bg-hover)", color: "var(--text)" }
              : { color: "var(--text-faint)" }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ChartTooltip({
  active,
  label,
  mode,
  freeFloat,
  hidden,
  rows,
}: {
  active?: boolean;
  payload?: unknown;
  label?: number;
  mode: Mode;
  freeFloat: number;
  hidden: Set<SeriesKey>;
  rows: ChartRow[];
}) {
  const row = label === undefined ? undefined : rows.find((r) => r.t === label);
  if (!active || !row) return null;

  const shown = (mode === "gap" ? COMPARATORS : SERIES).filter((s) => !hidden.has(s.key));
  const caps = { tao: row.taoCap, zec: row.zecCap, near: row.nearCap } as const;

  return (
    <div className="min-w-[262px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-raised)] p-3 shadow-2xl">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-faint)]">
        {longDate(new Date(row.t).toISOString().slice(0, 10))}
      </div>

      <dl className="space-y-1.5 text-[12px]">
        {mode === "valuation" && row.vvvPrice !== null && (
          <Row label="VVV price" value={usd(row.vvvPrice)} />
        )}

        {shown.map((s) => {
          const v = row[s.key];
          if (typeof v !== "number" || !Number.isFinite(v)) return null;
          return (
            <div key={s.key} className="flex items-center justify-between gap-6">
              <dt className="flex items-center gap-2 text-[var(--text-dim)]">
                <span
                  className="h-[3px] w-3 rounded-full"
                  style={{ background: s.color }}
                  aria-hidden
                />
                {mode === "valuation" ? s.label : s.short}
              </dt>
              <dd className="tnum font-medium">
                {mode === "valuation" ? "$" + compactNumber(v, 2) : v.toFixed(2) + "x"}
              </dd>
            </div>
          );
        })}

        {/* Distance to every comparator, not just TAO. */}
        {mode !== "gap" && row.vvvCap && (
          <>
            <div className="my-1.5 border-t" />
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-faint)]">
              Distance to parity
            </div>
            {COMPARATORS.map((s) => {
              const cap = caps[s.key as "tao" | "zec" | "near"];
              if (cap === null || !row.vvvCap) return null;
              return (
                <div key={s.key} className="flex items-center justify-between gap-6">
                  <dt className="text-[var(--text-dim)]">
                    {s.short}
                    <span className="tnum ml-1.5 text-[var(--text-faint)]">
                      VVV / {s.short} {(row.vvvCap / cap).toFixed(3)}x
                    </span>
                  </dt>
                  <dd className="tnum font-medium">{(cap / row.vvvCap).toFixed(1)}x</dd>
                </div>
              );
            })}
          </>
        )}

        {mode === "valuation" && (
          <>
            <div className="my-1.5 border-t" />
            <Row label="Free float applied" value={compactNumber(freeFloat, 2) + " VVV"} />
          </>
        )}
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <dt className="text-[var(--text-dim)]">{label}</dt>
      <dd className="tnum font-medium">{value}</dd>
    </div>
  );
}
