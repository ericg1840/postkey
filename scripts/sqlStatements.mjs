// Splits a .sql file into individual statements.
//
// Neon's HTTP driver sends one statement per request, but a migration file is
// naturally several — so the runner has to break them apart. Splitting on ";"
// alone would corrupt three things that legitimately contain semicolons:
// dollar-quoted bodies ($$ ... $$, used by the DO blocks in 003), string
// literals, and comments. This walks the text tracking which of those it's
// inside, and only treats a ";" at the top level as a boundary.
export function splitStatements(sql) {
  const statements = [];
  let current = "";
  let i = 0;
  let inLineComment = false;
  let inBlockComment = false;
  let inString = false;
  let dollarTag = null; // the opening tag ($$, $body$, ...) we're waiting to close

  while (i < sql.length) {
    const ch = sql[i];
    const rest = sql.slice(i);

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      current += ch;
      i += 1;
      continue;
    }

    if (inBlockComment) {
      if (rest.startsWith("*/")) {
        inBlockComment = false;
        current += "*/";
        i += 2;
        continue;
      }
      current += ch;
      i += 1;
      continue;
    }

    if (dollarTag) {
      if (rest.startsWith(dollarTag)) {
        current += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      current += ch;
      i += 1;
      continue;
    }

    if (inString) {
      // '' is an escaped quote inside a string, not the end of one.
      if (ch === "'" && sql[i + 1] === "'") {
        current += "''";
        i += 2;
        continue;
      }
      if (ch === "'") inString = false;
      current += ch;
      i += 1;
      continue;
    }

    if (rest.startsWith("--")) {
      inLineComment = true;
      current += "--";
      i += 2;
      continue;
    }

    if (rest.startsWith("/*")) {
      inBlockComment = true;
      current += "/*";
      i += 2;
      continue;
    }

    if (ch === "'") {
      inString = true;
      current += ch;
      i += 1;
      continue;
    }

    const openingDollarTag = rest.match(/^\$[A-Za-z_]*\$/);
    if (openingDollarTag) {
      dollarTag = openingDollarTag[0];
      current += dollarTag;
      i += dollarTag.length;
      continue;
    }

    if (ch === ";") {
      statements.push(current);
      current = "";
      i += 1;
      continue;
    }

    current += ch;
    i += 1;
  }
  statements.push(current);

  // A chunk that's only the file's header comment (or trailing whitespace)
  // isn't a statement. Comments attached to a real statement are left in
  // place — Postgres is happy with them.
  return statements.map((s) => s.trim()).filter((s) => s && !isOnlyComments(s));
}

function isOnlyComments(text) {
  return (
    text
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/--[^\n]*/g, "")
      .trim() === ""
  );
}
