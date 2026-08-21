// Single Worker entry point (Cloudflare's CI provisions Workers-scoped API
// tokens, not Pages-scoped ones, so this deploys as a plain Worker with a
// static-assets binding rather than as a Pages project). Each handler below
// is the same functions/api/**.mjs file used during earlier Pages-based
// development — only how they're invoked changed, not their internals.
import * as login from "../functions/api/auth/login.mjs";
import * as logout from "../functions/api/auth/logout.mjs";
import * as me from "../functions/api/auth/me.mjs";
import * as signup from "../functions/api/auth/signup.mjs";
import * as requestReset from "../functions/api/auth/request-reset.mjs";
import * as resetPassword from "../functions/api/auth/reset-password.mjs";
import * as changePassword from "../functions/api/auth/change-password.mjs";
import * as brandKit from "../functions/api/brand-kit.mjs";
import * as propertyLookup from "../functions/api/property-lookup.mjs";

const ROUTES = {
  "/api/auth/login": { POST: login.onRequestPost },
  "/api/auth/logout": { POST: logout.onRequestPost },
  "/api/auth/me": { GET: me.onRequestGet },
  "/api/auth/signup": { POST: signup.onRequestPost },
  "/api/auth/request-reset": { POST: requestReset.onRequestPost },
  "/api/auth/reset-password": { POST: resetPassword.onRequestPost },
  "/api/auth/change-password": { POST: changePassword.onRequestPost },
  "/api/brand-kit": { GET: brandKit.onRequestGet, PUT: brandKit.onRequestPut },
  "/api/property-lookup": { GET: propertyLookup.onRequestGet },
};

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const route = ROUTES[pathname];
    if (route) {
      const handler = route[request.method];
      if (!handler) return new Response("Method not allowed", { status: 405 });
      return handler({ request, env, ctx });
    }
    // Not an API route — serve the built static site (index.html fallback
    // for client-side routing is handled by the `not_found_handling` setting
    // on the assets binding in wrangler.toml).
    return env.ASSETS.fetch(request);
  },
};
