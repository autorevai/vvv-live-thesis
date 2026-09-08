export function usd(n: number | null | undefined, opts: { compact?: boolean; dp?: number } = {}) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const { compact = false, dp } = opts;
  if (compact) return "$" + compactNumber(n, dp);
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: dp ?? 2,
    maximumFractionDigits: dp ?? 2,
  });
}

export function compactNumber(n: number | null | undefined, dp?: number) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12) return sign + (abs / 1e12).toFixed(dp ?? 2) + "T";
  if (abs >= 1e9) return sign + (abs / 1e9).toFixed(dp ?? 2) + "B";
  if (abs >= 1e6) return sign + (abs / 1e6).toFixed(dp ?? 1) + "M";
  if (abs >= 1e3) return sign + (abs / 1e3).toFixed(dp ?? 0) + "K";
  return sign + abs.toFixed(dp ?? 0);
}

export function tokens(n: number | null | undefined, dp = 2) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return compactNumber(n, dp);
}

export function multiple(n: number | null | undefined, dp = 1) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toFixed(dp) + "x";
}

export function pct(n: number | null | undefined, dp = 1) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const s = n > 0 ? "+" : "";
  return s + n.toFixed(dp) + "%";
}

export function relativeTime(iso: string | number | null | undefined) {
  if (iso === null || iso === undefined) return "—";
  const then = typeof iso === "number" ? iso : Date.parse(iso);
  if (!Number.isFinite(then)) return "—";
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return secs + " sec ago";
  const mins = Math.round(secs / 60);
  if (mins < 60) return mins + " min ago";
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return hrs + " hr ago";
  return Math.round(hrs / 24) + " days ago";
}

export function longDate(iso: string) {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function shortDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
