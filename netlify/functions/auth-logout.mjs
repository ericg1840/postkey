import { clearSessionCookie, json } from "./_lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });
  return json({ ok: true }, { status: 200, headers: { "Set-Cookie": clearSessionCookie() } });
};

export const config = { path: "/api/auth/logout" };
