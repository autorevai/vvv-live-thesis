#!/usr/bin/env node
/**
 * Writes one immutable daily snapshot to data/snapshots/<YYYY-MM-DD>.json.
 *
 * Existing files are never overwritten. Anything the sources cannot supply is
 * written as null, never as zero and never interpolated. Run by GitHub Actions
 * once a day, and the commit history is the audit trail.
 */

import { mkdir, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "data", "snapshots");
const CG = "https://api.coingecko.com/api/v3";
const KEY = process.env.COINGECKO_API_KEY;
const RPC = process.env.BASE_RPC_URL || "https://mainnet.base.org";

const VVV = "0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf";
const DIEM = "0xF4d97F2da56e8c3098f3a8D538DB630A2606a024";
const STAKING = "0x321b7ff75154472B18EDb199033fF4D116F340Ff";
const ZERO = "0x0000000000000000000000000000000000000000";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, init, attempts = 4) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: { accept: "application/json", ...(init?.headers ?? {}) },
        signal: AbortSignal.timeout(20_000),
      });
      if (res.status === 429) throw new Error("rate limited");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      last = err;
      if (i < attempts - 1) await sleep(2_000 * 2 ** i);
    }
  }
  throw last;
}

const withKey = (u) => (KEY ? `${u}${u.includes("?") ? "&" : "?"}x_cg_demo_api_key=${KEY}` : u);

async function ethCall(to, data) {
  const r = await getJson(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] }),
  });
  if (r.error) throw new Error(r.error.message);
  return Number(BigInt(r.result)) / 1e18;
}

const balanceOf = (holder) => "0x70a08231" + holder.toLowerCase().replace(/^0x/, "").padStart(64, "0");

/** Null rather than a throw: one dead source must not cost us the whole day. */
async function soft(fn, label) {
  try {
    return await fn();
  } catch (err) {
    console.error(`  ! ${label}: ${err.message}`);
    return null;
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(OUT_DIR, `${date}.json`);

  if (existsSync(file)) {
    console.log(`${date} already recorded. Snapshots are never overwritten.`);
    return;
  }

  console.log(`Recording ${date}`);

  const market = await soft(
    () =>
      getJson(
        withKey(
          `${CG}/simple/price?ids=venice-token,bittensor,near,zcash&vs_currencies=usd&include_market_cap=true`,
        ),
      ),
    "coingecko",
  );

  const venice = await soft(() => getJson("https://api.venice.ai/api/v1/vvv/stats"), "venice");

  const burned = await soft(() => ethCall(VVV, balanceOf(ZERO)), "burned");
  await sleep(400);
  const sVvv = await soft(() => ethCall(STAKING, "0x18160ddd"), "sVVV supply");
  await sleep(400);
  const diem = await soft(() => ethCall(DIEM, "0x18160ddd"), "DIEM supply");
  await sleep(400);
  const onChainTotal = await soft(() => ethCall(VVV, "0x18160ddd"), "VVV total supply");

  const price = market?.["venice-token"]?.usd ?? null;
  const circulating = venice ? Number(venice.circulatingSupply) : null;
  const freeFloat = circulating !== null && sVvv !== null ? circulating - sVvv : null;

  const snapshot = {
    date,
    recorded_at: new Date().toISOString(),
    vvv_price: price,
    vvv_circulating: circulating,
    vvv_total_supply: venice ? Number(venice.totalSupply) : null,
    vvv_free_float: freeFloat,
    vvv_free_float_cap: price !== null && freeFloat !== null ? price * freeFloat : null,
    vvv_staked_plus_locked: sVvv,
    vvv_burned: burned,
    vvv_total_supply_onchain: onChainTotal,
    diem_supply: diem,
    vvv_market_cap: market?.["venice-token"]?.usd_market_cap ?? null,
    tao_market_cap: market?.bittensor?.usd_market_cap ?? null,
    near_market_cap: market?.near?.usd_market_cap ?? null,
    zec_market_cap: market?.zcash?.usd_market_cap ?? null,
    // No live feed exists for these. They stay null here and are served from
    // the verified point-in-time records in src/lib/constants.ts.
    venice_arr: null,
    venice_users: null,
    api_calls_day: null,
    tokens_processed_month: null,
  };

  const missing = Object.entries(snapshot).filter(([, v]) => v === null).map(([k]) => k);
  if (price === null && freeFloat === null && burned === null) {
    throw new Error("every source failed, refusing to write an empty snapshot");
  }

  await writeFile(file, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`  wrote ${path.relative(process.cwd(), file)}`);
  if (missing.length) console.log(`  null fields: ${missing.join(", ")}`);

  const all = (await readdir(OUT_DIR)).filter((f) => f.endsWith(".json"));
  console.log(`  ${all.length} snapshots on record`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
