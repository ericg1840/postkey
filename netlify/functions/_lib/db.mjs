import { getDatabase } from "@netlify/database";

let db;
export function getDb() {
  if (!db) db = getDatabase();
  return db;
}
