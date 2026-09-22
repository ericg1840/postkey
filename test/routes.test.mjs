import test from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ROUTES } from "../worker/index.mjs";

const API_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "functions", "api");
const METHOD_EXPORTS = { onRequestGet: "GET", onRequestPost: "POST", onRequestPut: "PUT", onRequestPatch: "PATCH", onRequestDelete: "DELETE" };

async function handlerFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await handlerFiles(full)));
    else if (entry.name.endsWith(".mjs")) out.push(full);
  }
  return out;
}

// Regression guard: /api/content/recurring shipped with a handler but no
// route, so the whole recurring-topics feature silently got index.html back.
test("every handler in functions/api is routed, with every method it exports", async () => {
  for (const file of await handlerFiles(API_DIR)) {
    const route = "/api/" + path.relative(API_DIR, file).replace(/\\/g, "/").replace(/\.mjs$/, "");
    const mod = await import(pathToFileURL(file).href);
    assert.ok(ROUTES[route], `${route} has a handler but no entry in worker/index.mjs`);
    for (const [exportName, method] of Object.entries(METHOD_EXPORTS)) {
      if (typeof mod[exportName] === "function") {
        assert.equal(ROUTES[route][method], mod[exportName], `${method} ${route} isn't routed to ${exportName}`);
      }
    }
  }
});
