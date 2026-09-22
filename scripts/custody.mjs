#!/usr/bin/env node
/**
 * Writes one daily custody record to data/custody/<YYYY-MM-DD>.json.
 *
 * For every address Arkham publishes an entity label for, this reads the VVV
 * balance straight from Base. Balances, not flows: an exchange sweeping a
 * customer's deposit address into its hot wallet moves no VVV in or out of the
 * exchange, so a balance cannot be inflated by internal plumbing the way a
 * transfer count can. That is the whole reason this file exists separately
 * from scripts/flows.mjs.
 *
 * Labels come from data/entity-labels.json, which is a committed snapshot of
 * the public Arkham page for VVV. Balances are verified on chain every run, so
 * a stale or wrong label shows up as an entity holding nothing rather than as
 * a number nobody can check.
 *
 * Usage: node scripts/custody.mjs [--force]
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "data", "custody");
const LABELS = path.join(process.cwd(), "data", "entity-labels.json");

/**
 * publicnode serves current state without a key and without the aggressive
 * throttling on mainnet.base.org. It refuses archive requests, which is fine:
 * this script only ever asks for the latest block.
 */
const RPC = process.env.BASE_RPC_URL || "https://base-rpc.publicnode.com";
const VVV = "0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf";
const BALANCE_OF = "0x70a08231";
const BATCH = 8;
const WAD = 1e18;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (a) => a.toLowerCase().replace(/^0x/, "").padStart(64, "0");

async function balances(addresses) {
  const out = new Map();
  for (let i = 0; i < addresses.length; i += BATCH) {
    const slice = addresses.slice(i, i + BATCH);
    const body = slice.map((a, id) => ({
      jsonrpc: "2.0",
      id,
      method: "eth_call",
      params: [{ to: VVV, data: BALANCE_OF + pad(a) }, "latest"],
    }));
    let reply = null;
    for (let attempt = 0; attempt < 5 && !reply; attempt++) {
      try {
        const res = await fetch(RPC, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30_000),
        });
        const json = await res.json();
        if (Array.isArray(json) && !json.some((r) => r.error)) reply = json;
      } catch {
        /* fall through to the backoff */
      }
      if (!reply) await sleep(900 * 2 ** attempt);
    }
    // A slice the node never answered is recorded as null, never as zero. A
    // zero here would read as "this exchange sold everything".
    slice.forEach((a, k) => {
      const r = reply?.[k];
      out.set(a, r?.result && r.result !== "0x" ? Number(BigInt(r.result)) / WAD : null);
    });
    await sleep(400);
  }
  return out;
}

async function vvvPrice() {
  try {
    const res = await fetch("https://api.venice.ai/api/v1/vvv/stats", {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return Number(json?.price) || null;
  } catch {
    return null;
  }
}

const labelFile = JSON.parse(await readFile(LABELS, "utf8"));
const entries = Object.entries(labelFile.addresses);
const held = await balances(entries.map(([a]) => a));
const price = await vvvPrice();

const rows = entries
  .map(([address, meta]) => ({ address, ...meta, vvv: held.get(address) }))
  .filter((r) => r.vvv === null || r.vvv >= 1)
  .sort((a, b) => (b.vvv ?? -1) - (a.vvv ?? -1));

const byEntity = new Map();
for (const r of rows) {
  if (r.vvv === null) continue;
  const e = byEntity.get(r.entity) ?? { entity: r.entity, kind: r.kind, vvv: 0, addresses: 0 };
  e.vvv += r.vvv;
  e.addresses++;
  byEntity.set(r.entity, e);
}
const entities = [...byEntity.values()].sort((a, b) => b.vvv - a.vvv);
const sumKind = (kind) => entities.filter((e) => e.kind === kind).reduce((s, e) => s + e.vvv, 0);

const date = new Date().toISOString().slice(0, 10);
const unread = rows.filter((r) => r.vvv === null).length;

const record = {
  date,
  recorded_at: new Date().toISOString(),
  vvv_price_usd: price,
  label_source: labelFile.source,
  labels_retrieved_at: labelFile.retrieved_at,
  addresses_checked: entries.length,
  addresses_unread: unread,
  exchange_vvv: sumKind("exchange"),
  exchange_usd: price ? sumKind("exchange") * price : null,
  market_maker_vvv: sumKind("market-maker"),
  issuer_vvv: sumKind("issuer"),
  vesting_vvv: sumKind("vesting"),
  pool_vvv: sumKind("pool"),
  entities,
  addresses: rows,
};

await mkdir(OUT_DIR, { recursive: true });
const file = path.join(OUT_DIR, `${date}.json`);
if (existsSync(file) && !process.argv.includes("--force")) {
  console.log(`${date} already on record. Pass --force to overwrite.`);
} else {
  await writeFile(file, JSON.stringify(record, null, 2) + "\n");
  console.log(
    `${date}: ${Math.round(record.exchange_vvv).toLocaleString()} VVV in exchange custody` +
      (price ? ` ($${(record.exchange_usd / 1e6).toFixed(0)}M)` : "") +
      `, ${entities.length} entities, ${unread} address(es) unread`,
  );
}
