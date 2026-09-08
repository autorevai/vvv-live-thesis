/** Shared fetch helpers: bounded retry, no silent zeros. */

export class SourceError extends Error {
  constructor(public source: string, message: string) {
    super(`[${source}] ${message}`);
  }
}

export async function fetchJson<T>(
  source: string,
  url: string,
  init: RequestInit & { next?: { revalidate?: number } } = {},
  attempts = 3,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: { accept: "application/json", ...(init.headers ?? {}) },
        signal: AbortSignal.timeout(12_000),
      });
      if (res.status === 429) {
        // Public tiers hand back 429 under burst. Back off hard rather than
        // hammering, and respect Retry-After when the upstream sends one.
        const retryAfter = Number(res.headers.get("retry-after"));
        const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1500 * 2 ** i;
        throw Object.assign(new SourceError(source, "HTTP 429"), { retryAfter: wait });
      }
      if (!res.ok) throw new SourceError(source, `HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        const hinted = (err as { retryAfter?: number })?.retryAfter;
        await sleep(Math.min(hinted ?? 350 * 2 ** i, 6_000));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new SourceError(source, String(lastErr));
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Resolves to null instead of throwing, so one dead source cannot blank the page. */
export async function soft<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (err) {
    console.error("source failed:", err);
    return null;
  }
}
