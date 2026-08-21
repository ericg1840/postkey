import { neon } from "@neondatabase/serverless";

// No connection pooling needed — Neon's serverless driver talks to the DB
// over HTTP, so there's nothing to keep open between Worker invocations.
export function getDb(env) {
  return { sql: neon(env.DATABASE_URL) };
}
