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

type Mode = "valuation" | "indexed";
type RangeKey = "1M" | "3M" | "THESIS" | "ALL";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "1M", label: "1M" },
  { key: "3M", label: "3M" },
  { key: "THESIS", label: "Since thesis" },
  { key: "ALL", label: "All" },
];

const SERIES = [
  { key: "vvv", label: "VVV free-float cap", color: "var(--vvv)", width: 2.25 },
  { key: "tao", label: "TAO market cap", color: "var(--tao)", width: 1.4 },
  { key: "zec", label: "ZEC market cap", color: "var(--zec)", width: 1.4 },
  { key: "near", label: "NEAR market cap", color: "var(--near)", width: 1.4 },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

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

  const rows = useMemo(
    () =>
      filtered.map((p) => ({
        t: p.t,
        vvv: mode === "valuation" ? p.vvvCap : p.vvvIndex,
        tao: mode === "valuation" ? p.taoCap : p.taoIndex,
        zec: mode === "valuation" ? p.zecCap : p.zecIndex,
        near: mode === "valuation" ? p.nearCap : p.nearIndex,
        vvvPrice: p.vvvPrice,
      })),
    [filtered, mode],
  );

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
      for (const k of SERIES) {
        if (hidden.has(k.key)) continue;
        const v = r[k.key];
        if (typeof v === "number" && v > 0) vals.push(v);
      }
    }
    for (const b of benchmarks) vals.push(b.y);
    if (!vals.length) return [1, 10];
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    if (mode === "indexed") return [Math.min(0.9, lo * 0.97), Math.max(1.1, hi * 1.05)];
    return [lo * 0.62, hi * 1.5];
  }, [rows, hidden, benchmarks, mode]);

  // Recharts packs a log axis with ticks. Pick clean decade and half-decade
  // steps inside the domain instead, so the labels stay readable.
  const ticks = useMemo(() => {
    const [lo, hi] = domain;
    if (mode === "indexed") return undefined;
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
    if (!benchmarks.length) return benchmarks.map((b) => ({ ...b, showLabel: true }));
    const [lo, hi] = domain;
    const span = Math.log10(hi) - Math.log10(lo);
    const minGap = 0.045; // ~4.5% of the plot height
    const sorted = [...benchmarks].sort((a, b) => b.y - a.y);
    let lastPos = Infinity;
    return sorted.map((b) => {
      const pos = (Math.log10(hi) - Math.log10(b.y)) / span;
      const showLabel = pos - lastPos > minGap || lastPos === Infinity;
      if (showLabel) lastPos = pos;
      return { ...b, showLabel };
    });
  }, [benchmarks, domain]);

  const toggle = (k: SeriesKey) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else if (next.size < SERIES.length - 1) next.add(k);
      return next;
    });

  const loading = !history;

  return (
    <section className="rounded-xl border bg-[var(--bg-raised)]">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">
            {mode === "valuation" ? "Free-float valuation vs comparators" : "Performance since Day 0"}
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-faint)]">
            {mode === "valuation"
              ? "Logarithmic. VVV plotted as free-float cap, comparators as full market cap."
              : `Every asset set to 1.00x on ${DAY_ZERO_LABEL}. Price return only.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            options={[
              { key: "valuation", label: "Valuation" },
              { key: "indexed", label: "Since Day 0" },
            ]}
            value={mode}
            onChange={(v) => setMode(v as Mode)}
          />
          <Segmented
            options={RANGES.map((r) => ({ key: r.key, label: r.label }))}
            value={range}
            onChange={(v) => setRange(v as RangeKey)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-4 sm:px-5">
        {SERIES.map((s) => {
          const off = hidden.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              className="group flex items-center gap-2 text-[12px] transition-opacity"
              style={{ opacity: off ? 0.35 : 1 }}
              aria-pressed={!off}
            >
              <span
                className="h-[3px] w-4 rounded-full"
                style={{ background: s.color }}
                aria-hidden
              />
              <span className="text-[var(--text-dim)] group-hover:text-[var(--text)]">
                {mode === "indexed" ? s.label.split(" ")[0] : s.label}
              </span>
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
        {loading ? (
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
                scale={mode === "valuation" ? "log" : "linear"}
                domain={domain}
                allowDataOverflow
                orientation="right"
                width={58}
                ticks={ticks}
                tickFormatter={(v) =>
                  mode === "valuation" ? "$" + compactNumber(v, 0) : v.toFixed(2) + "x"
                }
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

              {!hidden.has("vvv") && (
                <Area
                  type="monotone"
                  dataKey="vvv"
                  stroke="none"
                  fill="url(#vvvFill)"
                  isAnimationActive={false}
                  connectNulls
                />
              )}

              {SERIES.filter((s) => s.key !== "vvv" && !hidden.has(s.key)).map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={s.width}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                  isAnimationActive={false}
                  connectNulls
                />
              ))}

              {!hidden.has("vvv") && (
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

      {mode === "valuation" && (
        <p className="border-t px-4 py-3 text-[11px] leading-relaxed text-[var(--text-faint)] sm:px-5">
          The historical free-float cap line applies today&apos;s free float of{" "}
          <span className="tnum text-[var(--text-dim)]">{compactNumber(freeFloat, 2)} VVV</span> to
          each day&apos;s VVV close. Free float was {compactNumber(13_600_000, 2)} at Day 0, so the
          scaling shifts the line by under 3 percent. Daily float snapshots start accumulating from
          launch and will replace this once the series is long enough to stand on its own.
        </p>
      )}
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

type TooltipRow = { name: string; value: number; color: string };

type ChartRow = {
  t: number;
  vvv: number | null;
  tao: number | null;
  zec: number | null;
  near: number | null;
  vvvPrice: number | null;
};

function ChartTooltip({
  active,
  payload,
  label,
  mode,
  freeFloat,
  hidden,
  rows,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: number;
  mode: Mode;
  freeFloat: number;
  hidden: Set<SeriesKey>;
  rows: ChartRow[];
}) {
  if (!active || !payload?.length || label === undefined) return null;

  // Read straight from the row: vvvPrice is carried for the tooltip but never
  // drawn, so it does not appear in the payload Recharts hands over.
  const row = rows.find((r) => r.t === label);
  const get = (k: keyof ChartRow) => (row?.[k] ?? null) as number | null;
  const vvv = get("vvv");
  const price = get("vvvPrice");

  const lines: TooltipRow[] = SERIES.filter((s) => !hidden.has(s.key))
    .map((s) => ({ name: s.label, value: get(s.key) as number, color: s.color }))
    .filter((r) => typeof r.value === "number" && Number.isFinite(r.value));

  const taoCap = get("tao");

  return (
    <div className="min-w-[248px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-raised)] p-3 shadow-2xl">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-faint)]">
        {longDate(new Date(label).toISOString().slice(0, 10))}
      </div>
      <dl className="space-y-1.5 text-[12px]">
        {mode === "valuation" && typeof price === "number" && (
          <Row label="VVV price" value={usd(price)} />
        )}
        {lines.map((r) => (
          <div key={r.name} className="flex items-center justify-between gap-6">
            <dt className="flex items-center gap-2 text-[var(--text-dim)]">
              <span
                className="h-[3px] w-3 rounded-full"
                style={{ background: r.color }}
                aria-hidden
              />
              {mode === "indexed" ? r.name.split(" ")[0] : r.name}
            </dt>
            <dd className="tnum font-medium">
              {mode === "valuation" ? "$" + compactNumber(r.value, 2) : r.value.toFixed(2) + "x"}
            </dd>
          </div>
        ))}
        {mode === "valuation" && typeof vvv === "number" && typeof taoCap === "number" && (
          <>
            <div className="my-1.5 border-t" />
            <Row label="VVV / TAO" value={(vvv / taoCap).toFixed(3) + "x"} />
            <Row label="Multiple to TAO" value={(taoCap / vvv).toFixed(1) + "x"} />
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
