import { clearSessionCookie, json } from "../../_lib/auth.mjs";

export async function onRequestPost() {
  return json({ ok: true }, { status: 200, headers: { "Set-Cookie": clearSessionCookie() } });
}
