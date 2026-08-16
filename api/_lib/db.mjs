import { neon } from "@neondatabase/serverless";

let db;
export function getDb() {
  if (!db) {
    const sql = neon(process.env.DATABASE_URL);
    db = { sql };
  }
  return db;
}
