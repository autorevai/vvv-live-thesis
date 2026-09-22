#!/usr/bin/env node
/**
 * Bundles data/snapshots/*.json, data/flows/*.json and data/custody/*.json into modules the app
 * imports statically, so both series ship with the build instead of relying on
 * filesystem tracing.
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "src", "data");

// The generated files are gitignored, so on a clean checkout this directory
// does not exist yet. Create it before writing.
await mkdir(OUT_DIR, { recursive: true });

await bundle("snapshots", "snapshot");
// Flow records start later than snapshots and a checkout may have none yet, so
// a missing directory bundles as an empty series rather than failing the build.
await bundle("flows", "flow day");
await bundle("custody", "custody reading");

async function bundle(name, noun) {
  const src = path.join(process.cwd(), "data", name);
  const out = path.join(OUT_DIR, `${name}.json`);
  let files = [];
  try {
    files = (await readdir(src)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  const rows = [];
  for (const f of files) rows.push(JSON.parse(await readFile(path.join(src, f), "utf8")));
  await writeFile(out, JSON.stringify(rows, null, 2) + "\n");
  console.log(`bundled ${rows.length} ${noun}(s) -> ${path.relative(process.cwd(), out)}`);
}
