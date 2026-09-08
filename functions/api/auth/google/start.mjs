import { buildAuthorizeUrl, createState, stateCookie } from "../../../_lib/googleAuth.mjs";

export async function onRequestGet({ request, env }) {
  const origin = new URL(request.url).origin;
  const state = createState();
  const url = buildAuthorizeUrl({ env, origin, state });
  return new Response(null, {
    status: 302,
    headers: { Location: url, "Set-Cookie": stateCookie(state) },
  });
}
