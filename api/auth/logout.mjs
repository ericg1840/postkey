import { clearSessionCookie, json } from "../_lib/auth.mjs";

export async function POST() {
  return json({ ok: true }, { status: 200, headers: { "Set-Cookie": clearSessionCookie() } });
}
