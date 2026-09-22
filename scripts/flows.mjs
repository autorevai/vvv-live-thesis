#!/usr/bin/env node
/**
 * Writes one immutable daily flow record to data/flows/<YYYY-MM-DD>.json.
 *
 * It reads every VVV ERC-20 Transfer event in a single UTC day straight from a
 * Base node, so the numbers need no indexer, no API key and no trust in a
 * third-party label set. Existing files are never overwritten.
 *
 * What it answers: is anyone actually accumulating VVV, or is the volume just
 * churn between routers. The signals, in order of how much they are worth:
 *
 *   1. Pool absorption. VVV leaving DEX pools is VVV somebody bought off the
 *      market. VVV piling into pools is supply being sold into them. This is
 *      the closest thing to a net buy or sell pressure reading that a public
 *      ledger gives you.
 *   2. Staking vault net flow. Staked VVV is out of the float and earns
 *      inference credit, so it is the slowest, most deliberate money on chain.
 * It deliberately does NOT rank individual wallets. Exchanges issue a fresh
 * deposit address per customer and sweep it into the hot wallet later, so an
 * unlabelled address ending the day heavier is usually exchange plumbing, not
 * somebody building a position. Custody is measured by balance instead, in
 * scripts/custody.mjs.
 *
 * Usage:
 *   node scripts/flows.mjs                 # yesterday (UTC), the last full day
 *   node scripts/flows.mjs 2026-09-20      # a specific UTC day
 *   node scripts/flows.mjs --backfill 7    # the last 7 full days, skipping any on record
 */

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "data", "flows");
const LABELS_PATH = path.join(process.cwd(), "data", "address-labels.json");
const ENTITY_PATH = path.join(process.cwd(), "data", "entity-labels.json");
const RPC = process.env.BASE_RPC_URL || "https://mainnet.base.org";

const VVV = "0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf".toLowerCase();
const STAKING = "0x321b7ff75154472B18EDb199033fF4D116F340Ff".toLowerCase();
const DIEM = "0xF4d97F2da56e8c3098f3a8D538DB630A2606a024".toLowerCase();
const ZERO = "0x0000000000000000000000000000000000000000";
const WETH_BASE = "0x4200000000000000000000000000000000000006";

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const SEL = { token0: "0x0dfe1681", token1: "0xd21220a7", symbol: "0x95d89b41" };

/** An address moving this much VVV net in a day is worth a label lookup. */
const NOTABLE_NET_VVV = 5_000;
/** Only the loudest addresses get a code lookup. Anything smaller is noise. */
const LABEL_BUDGET = 300;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

const log = (msg) => process.stderr.write(msg + "\n");

/** Counted per HTTP request, so a batched request of 50 calls counts as one. */
let rpcCalls = 0;

/** Parallel HTTP requests. The public Base endpoint throttles above this. */
const CONCURRENCY = 4;
/** The public Base endpoint rejects anything above 10 calls in one batch. */
const BATCH_SIZE = 10;
/** How many times a throttled call gets another go before it is given up on. */
const THROTTLE_PASSES = 10;
/**
 * Pause between waves. The public endpoint meters by how much work a request
 * costs, and a batch of eth_getCode on large contracts is expensive, so the
 * scan paces itself rather than racing the limiter and losing addresses.
 */
const WAVE_PAUSE_MS = 400;

/**
 * One HTTP round trip for many calls. The public Base endpoint rate limits per
 * request rather than per call, so batching is what keeps a few thousand
 * lookups from turning into a wall of 429s.
 *
 * Returns one entry per input, in order: the result, or an Error carrying
 * `reverted` when the chain answered "this address does not do that".
 */
async function rpcBatch(calls, attempts = 4) {
  if (calls.length === 0) return [];
  let last;
  for (let i = 0; i < attempts; i++) {
    rpcCalls++;
    try {
      const res = await fetch(RPC, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(
          calls.map((c, id) => ({ jsonrpc: "2.0", id, method: c.method, params: c.params })),
        ),
        signal: AbortSignal.timeout(45_000),
      });
      if (res.status === 429) throw new Error("HTTP 429");
      if (res.status === 413) throw Object.assign(new Error("HTTP 413"), { tooBig: true });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // A batch that blew a size limit comes back as one error object rather
      // than an array. eth_getCode on a few large contracts is enough to do
      // it, so halve and retry instead of writing the whole batch off.
      if (!Array.isArray(json)) {
        const err = json?.error ? toRpcError(json.error) : new Error("batch reply was not an array");
        if (err.split || err.tooBig) throw Object.assign(err, { tooBig: true });
        throw err;
      }

      const byId = new Map(json.map((r) => [r.id, r]));
      const out = calls.map((_, id) => {
        const r = byId.get(id);
        if (!r) return new Error("missing from batch reply");
        if (r.error) return toRpcError(r.error);
        return r.result;
      });
      return out;
    } catch (err) {
      if (err.tooBig && calls.length > 1) {
        const mid = Math.ceil(calls.length / 2);
        const [a, b] = await Promise.all([
          rpcBatch(calls.slice(0, mid), attempts),
          rpcBatch(calls.slice(mid), attempts),
        ]);
        return [...a, ...b];
      }
      last = err;
      if (i < attempts - 1) await sleep(750 * 2 ** i);
    }
  }
  return calls.map(() => last);
}

function toRpcError(error) {
  // These all mean "ask for less", so the caller splits its range or batch.
  if (error.code === -32614 || error.code === -32020 || error.code === -32014) {
    return Object.assign(new Error(error.message), { split: true, tooBig: true });
  }
  // The public endpoint reports throttling inside the batch reply rather than
  // as HTTP 429, so it has to be caught here or it looks like a real answer.
  if (/rate limit|too many requests|429/i.test(error.message)) {
    return Object.assign(new Error(error.message), { rateLimited: true });
  }
  // A revert is an answer: this address does not implement the method. Code 3
  // is how Base reports one. Anything else is the node having a bad time.
  if (error.code === 3 || /revert|invalid opcode|out of gas|invalid jump/i.test(error.message)) {
    return Object.assign(new Error(error.message), { reverted: true });
  }
  return new Error(error.message);
}

/** A single call, for the heavy responses that have no business in a batch. */
async function rpc(method, params, attempts = 5) {
  let last;
  for (let i = 0; i < attempts; i++) {
    rpcCalls++;
    try {
      const res = await fetch(RPC, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: AbortSignal.timeout(45_000),
      });
      if (res.status === 429) throw new Error("HTTP 429");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw toRpcError(json.error);
      return json.result;
    } catch (err) {
      if (err.split || err.reverted) throw err;
      last = err;
      if (i < attempts - 1) await sleep(750 * 2 ** i);
    }
  }
  throw last;
}

const hexToBigInt = (h) => BigInt(h);
const toHex = (n) => "0x" + n.toString(16);
const WAD = 1e18;

async function blockTimestamp(n) {
  const b = await rpc("eth_getBlockByNumber", [toHex(n), false]);
  return Number(hexToBigInt(b.timestamp));
}

/**
 * First block whose timestamp is at or after `target`. Base has no timestamp
 * index, so this is a plain binary search over the block range.
 */
async function blockAtOrAfter(target, head) {
  let lo = 0n;
  let hi = head;
  if ((await blockTimestamp(hi)) < target) return null;
  while (lo < hi) {
    const mid = (lo + hi) / 2n;
    if ((await blockTimestamp(mid)) < target) lo = mid + 1n;
    else hi = mid;
  }
  return lo;
}

/** Splits the range whenever the node says it is too wide or too heavy. */
async function getLogs(from, to) {
  try {
    return await rpc("eth_getLogs", [
      { address: VVV, topics: [TRANSFER_TOPIC], fromBlock: toHex(from), toBlock: toHex(to) },
    ]);
  } catch (err) {
    if (!err.split || to <= from) throw err;
    const mid = from + (to - from) / 2n;
    const left = await getLogs(from, mid);
    const right = await getLogs(mid + 1n, to);
    return [...left, ...right];
  }
}

function decodeString(hex) {
  if (!hex || hex === "0x") return null;
  try {
    const buf = Buffer.from(hex.slice(2), "hex");
    const len = Number(hexToBigInt("0x" + buf.subarray(32, 64).toString("hex")));
    if (!len || len > 64) return null;
    return buf.subarray(64, 64 + len).toString("utf8").replace(/\0/g, "") || null;
  } catch {
    return null;
  }
}

/**
 * Classifies addresses from their own bytecode only. Nothing here depends on a
 * label database, so the answer is reproducible from any Base node.
 *   pool     - a contract that answers token0()/token1() with VVV on one side
 *   contract - any other deployed code (routers, aggregators, vaults, multisigs)
 *   wallet   - no code at this block: an externally owned account
 *
 * An address the node never answered for is left out of the returned map. A
 * guess would quietly move a busy pool into the "contract" bucket and wreck the
 * absorption figure, so an unresolved address is reported rather than assumed.
 */
async function classifyAll(addresses, onProgress) {
  const labels = new Map();
  const unresolved = new Set();

  const codes = await mapBatched(addresses, (a) => ({ method: "eth_getCode", params: [a, "latest"] }), onProgress);

  const contracts = [];
  for (const a of addresses) {
    const code = codes.get(a);
    if (code instanceof Error) {
      if (unresolved.size === 0) log(`  first unresolved (${a}): ${code.message}`);
      unresolved.add(a);
      continue;
    }
    if (!code || code === "0x") labels.set(a, { kind: "wallet" });
    else contracts.push(a);
  }

  const t0 = await mapBatched(contracts, (a) => ({ method: "eth_call", params: [{ to: a, data: SEL.token0 }, "latest"] }), onProgress);
  const t1 = await mapBatched(contracts, (a) => ({ method: "eth_call", params: [{ to: a, data: SEL.token1 }, "latest"] }), onProgress);

  const addr = (r) => (typeof r === "string" && r.length >= 66 ? "0x" + r.slice(26, 66).toLowerCase() : null);
  const needSymbol = new Map();
  for (const a of contracts) {
    const x = t0.get(a);
    const y = t1.get(a);
    // A revert means "not a pool". A transport failure means "we do not know".
    const failed = (r) => r instanceof Error && !r.reverted;
    if (failed(x) || failed(y)) {
      const why = failed(x) ? x : y;
      if (unresolved.size === 0) log(`  first unresolved call (${a}): ${why.message}`);
      unresolved.add(a);
      continue;
    }
    const p = addr(x);
    const q = addr(y);
    if (p && q && (p === VVV || q === VVV)) {
      const other = p === VVV ? q : p;
      labels.set(a, { kind: "pool", pair: "VVV pool", counterToken: other });
      if (other !== WETH_BASE) needSymbol.set(a, other);
      else labels.get(a).pair = "VVV/WETH";
    } else {
      labels.set(a, { kind: "contract" });
    }
  }

  const tokens = [...new Set(needSymbol.values())];
  const symbols = await mapBatched(tokens, (t) => ({ method: "eth_call", params: [{ to: t, data: SEL.symbol }, "latest"] }), onProgress);
  for (const [pool, token] of needSymbol) {
    const sym = symbols.get(token);
    const text = sym instanceof Error ? null : decodeString(sym);
    if (text) labels.get(pool).pair = `VVV/${text}`;
  }

  return { labels, unresolved: [...unresolved] };
}

/** Runs one call per item through batched requests, keyed back by item. */
async function mapBatched(items, toCall, onProgress) {
  const out = new Map();
  let todo = items;
  let done = 0;

  // The endpoint throttles per call, not per request, and it throttles harder
  // on heavy replies like a large contract's bytecode. So a pass retries only
  // the calls that came back throttled instead of the whole batch.
  for (let pass = 0; pass < THROTTLE_PASSES && todo.length > 0; pass++) {
    if (pass > 0) await sleep(3_000 * pass);
    const batches = chunk(todo, BATCH_SIZE);
    for (const wave of chunk(batches, CONCURRENCY)) {
      if (done > 0 || pass > 0) await sleep(WAVE_PAUSE_MS);
      const replies = await Promise.all(wave.map((b) => rpcBatch(b.map(toCall))));
      wave.forEach((batch, w) => batch.forEach((item, i) => out.set(item, replies[w][i])));
      if (pass === 0) {
        done += wave.reduce((n, b) => n + b.length, 0);
        onProgress?.(done, items.length);
      }
    }
    todo = todo.filter((item) => {
      const r = out.get(item);
      return r instanceof Error && r.rateLimited;
    });
    if (todo.length) log(`  retrying ${todo.length} throttled call(s)`);
  }
  return out;
}

const KNOWN = {
  [STAKING]: { kind: "staking", name: "Venice staking vault (sVVV)" },
  [DIEM]: { kind: "contract", name: "DIEM" },
  [ZERO]: { kind: "burn", name: "Buy-and-burn sink" },
};

/**
 * Arkham's published entity labels for VVV. They take priority over the
 * bytecode classifier: Arkham knows an address is an Aerodrome pool or an OKX
 * hot wallet, where the classifier can only see that it has code.
 */
async function loadEntityLabels() {
  try {
    const file = JSON.parse(await readFile(ENTITY_PATH, "utf8"));
    const out = {};
    for (const [addr, meta] of Object.entries(file.addresses)) {
      out[addr.toLowerCase()] = meta.kind === "pool" ? { kind: "pool", pair: meta.label } : { kind: meta.kind };
    }
    return out;
  } catch {
    return {};
  }
}

async function loadLabels() {
  if (!existsSync(LABELS_PATH)) return {};
  try {
    return JSON.parse(await readFile(LABELS_PATH, "utf8"));
  } catch {
    return {};
  }
}

async function vvvPriceOn(date) {
  // Venice's own stats endpoint is spot only, so a historical day comes from
  // CoinGecko. A missing price means USD columns are written as null.
  const [y, m, d] = date.split("-");
  const url = `https://api.coingecko.com/api/v3/coins/venice-token/history?date=${d}-${m}-${y}&localization=false`;
  try {
    const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.market_data?.current_price?.usd ?? null;
  } catch {
    return null;
  }
}

async function recordDay(date, labels) {
  const startTs = Date.parse(`${date}T00:00:00Z`) / 1000;
  const endTs = startTs + 86_400;
  const head = hexToBigInt(await rpc("eth_blockNumber", []));

  if ((await blockTimestamp(head)) < endTs) {
    throw new Error(`${date} is not a finished UTC day on this chain yet`);
  }

  const firstBlock = await blockAtOrAfter(startTs, head);
  const afterLast = await blockAtOrAfter(endTs, head);
  const lastBlock = afterLast - 1n;
  log(`${date}: blocks ${firstBlock}-${lastBlock}, reading transfers`);

  const spans = [];
  for (let b = firstBlock; b <= lastBlock; b += 2000n) {
    spans.push([b, b + 1999n > lastBlock ? lastBlock : b + 1999n]);
  }
  const logs = [];
  let spansDone = 0;
  for (const batch of chunk(spans, CONCURRENCY)) {
    const got = await Promise.all(batch.map(([a, b]) => getLogs(a, b)));
    for (const g of got) logs.push(...g);
    spansDone += batch.length;
    log(`  transfers ${logs.length} (${spansDone}/${spans.length} spans)`);
  }

  const transfers = logs.map((l) => ({
    from: ("0x" + l.topics[1].slice(26)).toLowerCase(),
    to: ("0x" + l.topics[2].slice(26)).toLowerCase(),
    vvv: Number(hexToBigInt(l.data)) / WAD,
    block: Number(hexToBigInt(l.blockNumber)),
    tx: l.transactionHash,
  }));

  const ledger = new Map();
  const touch = (addr) => {
    let e = ledger.get(addr);
    if (!e) ledger.set(addr, (e = { in: 0, out: 0, transfers: 0 }));
    return e;
  };
  for (const t of transfers) {
    const a = touch(t.from);
    a.out += t.vvv;
    a.transfers++;
    const b = touch(t.to);
    b.in += t.vvv;
    b.transfers++;
  }

  // Label the loudest addresses first. The tail is left unlabelled on purpose:
  // it is thousands of dust wallets that cannot move any of these totals.
  const ranked = [...ledger.entries()].sort((a, b) => b[1].in + b[1].out - (a[1].in + a[1].out));
  const wanted = new Set();
  let budget = LABEL_BUDGET;
  for (const [addr, e] of ranked) {
    if (KNOWN[addr]) {
      labels[addr] = KNOWN[addr];
      continue;
    }
    // The loudest addresses by gross volume, plus anything that moved a lot on
    // net even if it traded quietly. Both can be a pool we have not seen yet.
    if (budget > 0) {
      budget--;
      wanted.add(addr);
    } else if (Math.abs(e.in - e.out) >= NOTABLE_NET_VVV) {
      wanted.add(addr);
    }
  }
  const pending = [...wanted].filter((a) => !labels[a]);

  const first = await classifyAll(pending, (d, n) => log(`  labelled ${d}/${n}`));
  for (const [addr, label] of first.labels) labels[addr] = label;

  // One more pass for whatever the node fumbled. Anything still unresolved is
  // kept out of the cache so the next run tries it again.
  const retry = await classifyAll(first.unresolved);
  for (const [addr, label] of retry.labels) labels[addr] = label;
  const stillUnresolved = retry.unresolved;
  if (stillUnresolved.length) {
    log(`  ${stillUnresolved.length} address(es) unresolved: ${stillUnresolved.join(", ")}`);
  }

  const kindOf = (addr) => labels[addr]?.kind ?? "unlabelled";
  const bucket = { pool: { in: 0, out: 0 }, staking: { in: 0, out: 0 }, burn: { in: 0, out: 0 } };
  for (const [addr, e] of ledger) {
    const k = kindOf(addr);
    if (bucket[k]) {
      bucket[k].in += e.in;
      bucket[k].out += e.out;
    }
  }

  const pools = [...ledger.entries()]
    .filter(([addr]) => kindOf(addr) === "pool")
    .map(([addr, e]) => ({
      address: addr,
      pair: labels[addr]?.pair ?? "VVV pool",
      net: e.in - e.out,
      volume: (e.in + e.out) / 2,
    }))
    .sort((a, b) => b.volume - a.volume);

  const price = await vvvPriceOn(date);
  const usd = (v) => (price == null || v == null ? null : v * price);

  // Pools gaining VVV means holders sold into them, so absorption is the
  // negative of the pools' net change.
  const poolAbsorption = -(bucket.pool.in - bucket.pool.out);

  return {
    date,
    recorded_at: new Date().toISOString(),
    first_block: Number(firstBlock),
    last_block: Number(lastBlock),
    vvv_price_usd: price,
    transfer_count: transfers.length,
    addresses_touched: ledger.size,
    addresses_labelled: Object.keys(labels).filter((a) => ledger.has(a)).length,
    /**
     * Addresses the node would not classify. Each one is excluded from both
     * the pool and the wallet buckets, so a non-zero count means the totals
     * below understate real activity by that address's volume.
     */
    addresses_unresolved: stillUnresolved.length,
    unresolved_vvv: stillUnresolved.reduce((s, a) => {
      const e = ledger.get(a);
      return s + (e ? e.in + e.out : 0);
    }, 0),
    /** Positive means the market bought VVV out of the pools on net. */
    pool_absorption_vvv: poolAbsorption,
    pool_absorption_usd: usd(poolAbsorption),
    pool_volume_vvv: pools.reduce((s, p) => s + p.volume, 0),
    staking_in_vvv: bucket.staking.in,
    staking_out_vvv: bucket.staking.out,
    staking_net_vvv: bucket.staking.in - bucket.staking.out,
    staking_net_usd: usd(bucket.staking.in - bucket.staking.out),
    burned_vvv: bucket.burn.in,
    burned_usd: usd(bucket.burn.in),
    pools: pools.slice(0, 8),
    rpc_calls: rpcCalls,
  };
}

function utcDay(offsetDays = 0) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const args = process.argv.slice(2);
await mkdir(OUT_DIR, { recursive: true });

let days;
const backfillAt = args.indexOf("--backfill");
if (backfillAt !== -1) {
  const n = Number(args[backfillAt + 1] ?? 7);
  days = Array.from({ length: n }, (_, i) => utcDay(-(i + 1))).reverse();
} else if (args[0] && /^\d{4}-\d{2}-\d{2}$/.test(args[0])) {
  days = [args[0]];
} else {
  days = [utcDay(-1)];
}

const entityLabels = await loadEntityLabels();
const labels = { ...(await loadLabels()), ...entityLabels };
const onDisk = new Set((await readdir(OUT_DIR)).map((f) => f.replace(/\.json$/, "")));

for (const date of days) {
  if (onDisk.has(date)) {
    console.log(`${date} already on record, leaving it alone.`);
    continue;
  }
  rpcCalls = 0;
  try {
    const record = await recordDay(date, labels);
    await writeFile(path.join(OUT_DIR, `${date}.json`), JSON.stringify(record, null, 2) + "\n");
    console.log(
      `${date}: ${record.transfer_count} transfers, ` +
        `pool absorption ${Math.round(record.pool_absorption_vvv).toLocaleString()} VVV, ` +
        `staking net ${Math.round(record.staking_net_vvv).toLocaleString()} VVV, ` +
        `${rpcCalls} rpc calls`,
    );
  } catch (err) {
    console.error(`${date} failed: ${err.message}`);
    process.exitCode = 1;
  }
}

const cache = Object.fromEntries(Object.entries(labels).filter(([a]) => !entityLabels[a]));
await writeFile(LABELS_PATH, JSON.stringify(cache, null, 2) + "\n");
