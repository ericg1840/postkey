import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { splitStatements } from "../scripts/sqlStatements.mjs";

const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations");

describe("splitStatements", () => {
  test("splits plain statements on semicolons", () => {
    assert.deepEqual(splitStatements("SELECT 1; SELECT 2;"), ["SELECT 1", "SELECT 2"]);
  });

  test("a trailing semicolon doesn't produce an empty statement", () => {
    assert.equal(splitStatements("SELECT 1;").length, 1);
    assert.equal(splitStatements("SELECT 1;\n\n").length, 1);
  });

  test("a missing final semicolon still yields the statement", () => {
    assert.deepEqual(splitStatements("SELECT 1"), ["SELECT 1"]);
  });

  // The DO blocks in 003 contain semicolons inside $$ ... $$. Splitting on
  // those would send Postgres a syntactically broken fragment.
  test("keeps a dollar-quoted block intact", () => {
    const sql = `DO $$ BEGIN IF x THEN ALTER TABLE a RENAME TO b; END IF; END $$;\nSELECT 1;`;
    const out = splitStatements(sql);
    assert.equal(out.length, 2);
    assert.ok(out[0].startsWith("DO $$"));
    assert.ok(out[0].includes("RENAME TO b;"), "inner semicolons survive");
    assert.ok(out[0].trimEnd().endsWith("$$"));
    assert.equal(out[1], "SELECT 1");
  });

  test("handles a named dollar tag", () => {
    const out = splitStatements("DO $body$ BEGIN a; b; END $body$; SELECT 2;");
    assert.equal(out.length, 2);
    assert.ok(out[0].includes("a; b;"));
  });

  test("a semicolon inside a string literal is not a boundary", () => {
    const out = splitStatements("INSERT INTO t VALUES ('a;b'); SELECT 1;");
    assert.equal(out.length, 2);
    assert.ok(out[0].includes("'a;b'"));
  });

  test("an escaped quote inside a string doesn't end it early", () => {
    const out = splitStatements("SELECT 'it''s; fine'; SELECT 2;");
    assert.equal(out.length, 2);
    assert.ok(out[0].includes("'it''s; fine'"));
  });

  test("a semicolon inside a line comment is not a boundary", () => {
    const out = splitStatements("SELECT 1 -- trailing; comment\n; SELECT 2;");
    assert.equal(out.length, 2);
  });

  test("a semicolon inside a block comment is not a boundary", () => {
    const out = splitStatements("SELECT 1 /* a; b */; SELECT 2;");
    assert.equal(out.length, 2);
  });

  test("comment-only content produces no statements", () => {
    assert.deepEqual(splitStatements("-- just a header\n\n"), []);
    assert.deepEqual(splitStatements("/* block */\n"), []);
    assert.deepEqual(splitStatements(""), []);
  });

  test("a leading file comment stays attached to the first statement", () => {
    const out = splitStatements("-- why this exists\nSELECT 1;");
    assert.equal(out.length, 1);
    assert.ok(out[0].includes("-- why this exists"));
    assert.ok(out[0].includes("SELECT 1"));
  });
});

// The real payload: every migration in the repo has to come apart into
// statements that are individually valid, since the runner sends them one at
// a time. Anything unbalanced here would only show up against production.
describe("every migration in the repo splits cleanly", async () => {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();

  test("there are migrations to check", () => {
    assert.ok(files.length > 0);
  });

  for (const file of files) {
    test(file, async () => {
      const text = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      const statements = splitStatements(text);
      assert.ok(statements.length > 0, "should yield at least one statement");

      for (const statement of statements) {
        assert.doesNotMatch(statement, /^\s*$/, "no blank statements");
        // Balanced dollar quoting: an odd count means a DO block got cut.
        const dollarTags = statement.match(/\$[A-Za-z_]*\$/g) || [];
        assert.equal(dollarTags.length % 2, 0, `unbalanced dollar-quoting in: ${statement.slice(0, 60)}`);
        // Balanced single quotes, ignoring '' escapes — and ignoring
        // comments, where an ordinary apostrophe ("hasn't") is legal SQL and
        // would otherwise read as an unclosed string. The splitter already
        // treats comment text as inert; this check has to agree with it.
        const code = statement.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "");
        const quotes = (code.replace(/''/g, "").match(/'/g) || []).length;
        assert.equal(quotes % 2, 0, `unbalanced quotes in: ${statement.slice(0, 60)}`);
      }

      // Reassembling has to reproduce the file's statements — proof nothing
      // was dropped on the floor.
      const meaningful = text.replace(/\s+/g, "");
      const rejoined = statements.join(";").replace(/\s+/g, "");
      for (const fragment of ["CREATETABLE", "ALTERTABLE", "CREATEINDEX"]) {
        const inFile = meaningful.split(fragment).length - 1;
        const inSplit = rejoined.split(fragment).length - 1;
        assert.equal(inSplit, inFile, `${fragment} count changed for ${file}`);
      }
    });
  }
});
