// Applies pending migrations and records which have run.
//
// Before this existed, migrations were applied by hand with nothing tracking
// them, so "has 005 been run?" was unanswerable — and a missed one only
// surfaced later as a 500 on whichever page happened to need it.
//
//   npm run migrate            apply everything pending
//   npm run migrate -- --dry-run   list what's pending, change nothing
//   npm run migrate -- --status    show every migration and whether it ran
//
// Needs DATABASE_URL (the same connection string the Worker uses).
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import { splitStatements } from "./sqlStatements.mjs";

const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations");

async function migrationFiles() {
  const entries = await readdir(MIGRATIONS_DIR);
  // Lexical order is chronological here because the files are zero-padded.
  return entries.filter((f) => f.endsWith(".sql")).sort();
}

async function appliedNames(sql) {
  // The tracking table has to exist before it can track anything, so the
  // runner owns creating it rather than a migration that couldn't record
  // itself.
  await sql(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  const rows = await sql(`SELECT name FROM schema_migrations`);
  return new Set(rows.map((r) => r.name));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const statusOnly = args.includes("--status");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Pass the same connection string the Worker uses:");
    console.error("  DATABASE_URL='postgres://...' npm run migrate");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const files = await migrationFiles();
  const applied = await appliedNames(sql);

  if (statusOnly) {
    for (const file of files) {
      console.log(`${applied.has(file) ? "applied" : "PENDING"}  ${file}`);
    }
    return;
  }

  const pending = files.filter((f) => !applied.has(f));
  if (pending.length === 0) {
    console.log(`Up to date — all ${files.length} migrations applied.`);
    return;
  }

  console.log(`${pending.length} pending: ${pending.join(", ")}`);
  if (dryRun) {
    console.log("--dry-run, nothing applied.");
    return;
  }

  for (const file of pending) {
    const text = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    const statements = splitStatements(text);
    process.stdout.write(`  ${file} (${statements.length} statement${statements.length === 1 ? "" : "s"}) ... `);
    try {
      // One transaction per file, so a migration that fails partway leaves
      // nothing behind and stays pending rather than half-applied.
      await sql.transaction(statements.map((s) => sql(s)));
      await sql(`INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [file]);
      console.log("ok");
    } catch (err) {
      console.log("FAILED");
      console.error(`\n${file} failed, and was not recorded as applied:\n${err?.message || err}\n`);
      console.error("Nothing from that file was committed. Fix it and re-run.");
      process.exit(1);
    }
  }

  console.log(`Applied ${pending.length} migration${pending.length === 1 ? "" : "s"}.`);
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
