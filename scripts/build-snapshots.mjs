#!/usr/bin/env node
/**
 * Bundles data/snapshots/*.json into one module the app imports statically, so
 * the series ships with the build instead of relying on filesystem tracing.
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = path.join(process.cwd(), "data", "snapshots");
const OUT = path.join(process.cwd(), "src", "data", "snapshots.json");

const files = (await readdir(SRC)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
const rows = [];
for (const f of files) rows.push(JSON.parse(await readFile(path.join(SRC, f), "utf8")));

await writeFile(OUT, JSON.stringify(rows, null, 2) + "\n");
console.log(`bundled ${rows.length} snapshot(s) -> ${path.relative(process.cwd(), OUT)}`);
