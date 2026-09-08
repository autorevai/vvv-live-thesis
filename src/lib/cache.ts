/**
 * Process-local cache that keeps serving the last good value when an upstream
 * fails. Rate limits and blips then degrade to a stale timestamp on the page
 * rather than an empty chart. Each serverless instance keeps its own copy,
 * which is fine: it is a cushion in front of the CDN cache, not the store.
 */

type Entry<T> = { value: T; at: number; inflight?: Promise<T> };

const store = new Map<string, Entry<unknown>>();

export type Cached<T> = { value: T; at: number; stale: boolean };

export async function cached<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
  /** How long a stale value may still be served when the upstream is failing. */
  maxStaleMs = 6 * 60 * 60 * 1000,
): Promise<Cached<T>> {
  const hit = store.get(key) as Entry<T> | undefined;
  const age = hit ? Date.now() - hit.at : Infinity;

  if (hit && age < ttlMs) return { value: hit.value, at: hit.at, stale: false };

  // Collapse concurrent misses onto one upstream call.
  if (hit?.inflight) {
    try {
      const value = await hit.inflight;
      return { value, at: Date.now(), stale: false };
    } catch {
      if (age < maxStaleMs) return { value: hit.value, at: hit.at, stale: true };
      throw new Error(`cache(${key}): upstream failed and no usable value`);
    }
  }

  const inflight = load();
  if (hit) hit.inflight = inflight;

  try {
    const value = await inflight;
    store.set(key, { value, at: Date.now() });
    return { value, at: Date.now(), stale: false };
  } catch (err) {
    if (hit) {
      delete hit.inflight;
      if (age < maxStaleMs) {
        console.warn(`cache(${key}): serving ${Math.round(age / 1000)}s stale value`, err);
        return { value: hit.value, at: hit.at, stale: true };
      }
    }
    throw err;
  }
}
