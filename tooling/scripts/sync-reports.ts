/**
 * tooling/scripts/sync-reports.ts — explicit ingest step (reports/persisted-runs).
 * Copies sealed envelopes from the scanner's canonical store into the
 * website's tracked build-input directory (`apps/site/reports/`) byte-identically.
 * Idempotent; skips unreadable/unknown-version envelopes with a named warning.
 * This script is the ONLY writer into the website's build inputs.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname ?? ".", "../..");

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const from = path.resolve(arg("--from") ?? process.env.SCANNER_STORE_DIR ?? path.join(ROOT, "apps/scanner/scanner-reports"));
  const to = path.resolve(arg("--to") ?? path.join(ROOT, "apps/site/reports"));
  await mkdir(to, { recursive: true });

  let entries: string[];
  try {
    entries = await readdir(from);
  } catch {
    console.warn(`[sync-reports] source store missing: ${from} (nothing to ingest)`);
    return;
  }

  // Lazy-load the contract from the repo (no new dependency).
  const contracts = (await import("@leapscore/contracts")) as typeof import("@leapscore/contracts");

  let copied = 0;
  let skipped = 0;
  for (const name of entries) {
    if (name.startsWith(".") || !name.endsWith(".json")) continue;
    const runId = name.slice(0, -5);
    if (!contracts.isValidRunId(runId)) {
      console.warn(`[sync-reports] skipping ${name}: runId fails grammar`);
      skipped++;
      continue;
    }
    let raw: Buffer;
    try {
      raw = await readFile(path.join(from, name));
      const parsed = JSON.parse(raw.toString("utf8"));
      contracts.assertContractVersion(parsed);
      if (!parsed.meta || !parsed.report) throw new Error("missing meta/report");
    } catch (e) {
      console.warn(`[sync-reports] skipping ${name}: ${(e as Error).message}`);
      skipped++;
      continue;
    }
    const dest = path.join(to, name);
    let existing: Buffer | null = null;
    try {
      existing = await readFile(dest);
    } catch {
      existing = null;
    }
    if (existing && Buffer.compare(existing, raw) === 0) continue; // idempotent
    await writeFile(dest, raw);
    copied++;
  }
  console.log(`[sync-reports] done: ${copied} copied, ${skipped} skipped, store=${from} dest=${to}`);
}

main().catch((e) => {
  console.error(`[sync-reports] fatal: ${(e as Error).message}`);
  process.exit(1);
});
