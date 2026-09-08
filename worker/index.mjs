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
import * as bio from "../functions/api/bio.mjs";
import * as bioPublic from "../functions/api/bio-public.mjs";
import * as listingsFetch from "../functions/api/listings-fetch.mjs";
import * as posts from "../functions/api/posts.mjs";
import * as drafts from "../functions/api/drafts.mjs";
import * as contentPosts from "../functions/api/content/posts.mjs";
import * as contentIdeas from "../functions/api/content/ideas.mjs";
import * as contentAutofill from "../functions/api/content/autofill.mjs";
import * as adminStats from "../functions/api/admin/stats.mjs";
import * as adminUsers from "../functions/api/admin/users.mjs";
import * as adminUsersExport from "../functions/api/admin/users-export.mjs";
import * as adminUserAction from "../functions/api/admin/user-action.mjs";
import * as adminUserActivity from "../functions/api/admin/user-activity.mjs";
import * as adminActivityLog from "../functions/api/admin/activity-log.mjs";
import * as adminAnalytics from "../functions/api/admin/analytics.mjs";
import * as track from "../functions/api/track.mjs";
import * as verifyEmail from "../functions/api/auth/verify-email.mjs";
import * as resendVerification from "../functions/api/auth/resend-verification.mjs";
import { sendErrorAlert } from "../functions/_lib/alerts.mjs";

const ROUTES = {
  "/api/auth/login": { POST: login.onRequestPost },
  "/api/auth/logout": { POST: logout.onRequestPost },
  "/api/auth/me": { GET: me.onRequestGet },
  "/api/auth/signup": { POST: signup.onRequestPost },
  "/api/auth/request-reset": { POST: requestReset.onRequestPost },
  "/api/auth/reset-password": { POST: resetPassword.onRequestPost },
  "/api/auth/change-password": { POST: changePassword.onRequestPost },
  "/api/auth/verify-email": { POST: verifyEmail.onRequestPost },
  "/api/auth/resend-verification": { POST: resendVerification.onRequestPost },
  "/api/brand-kit": { GET: brandKit.onRequestGet, PUT: brandKit.onRequestPut },
  "/api/bio": { GET: bio.onRequestGet, PUT: bio.onRequestPut },
  "/api/bio-public": { GET: bioPublic.onRequestGet },
  "/api/listings-fetch": { POST: listingsFetch.onRequestPost },
  "/api/posts": { GET: posts.onRequestGet, POST: posts.onRequestPost, DELETE: posts.onRequestDelete },
  "/api/drafts": { GET: drafts.onRequestGet, PUT: drafts.onRequestPut, DELETE: drafts.onRequestDelete },
  "/api/content/posts": {
    GET: contentPosts.onRequestGet, POST: contentPosts.onRequestPost,
    PATCH: contentPosts.onRequestPatch, DELETE: contentPosts.onRequestDelete,
  },
  "/api/content/ideas": { GET: contentIdeas.onRequestGet, POST: contentIdeas.onRequestPost, PATCH: contentIdeas.onRequestPatch },
  "/api/content/autofill": { POST: contentAutofill.onRequestPost },
  "/api/admin/stats": { GET: adminStats.onRequestGet },
  "/api/admin/users": { GET: adminUsers.onRequestGet },
  "/api/admin/users-export": { GET: adminUsersExport.onRequestGet },
  "/api/admin/user-action": { POST: adminUserAction.onRequestPost },
  "/api/admin/user-activity": { GET: adminUserActivity.onRequestGet },
  "/api/admin/activity-log": { GET: adminActivityLog.onRequestGet },
  "/api/admin/analytics": { GET: adminAnalytics.onRequestGet },
  "/api/track": { POST: track.onRequestPost },
};

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const route = ROUTES[pathname];
    if (route) {
      const handler = route[request.method];
      if (!handler) return new Response("Method not allowed", { status: 405 });
      try {
        return await handler({ request, env, ctx });
      } catch (err) {
        // An uncaught error here would otherwise surface as Cloudflare's
        // generic "Worker threw exception" HTML page (error 1101) — useless
        // to the frontend, which expects JSON.
        //
        // The raw message can't go back to the caller though: what actually
        // reaches this point is things like "SESSION_SECRET is not
        // configured", a Resend API response body, or a Postgres error
        // naming columns — all of it internal. Instead, log the real error
        // with a short reference and hand the caller only that reference, so
        // a user can report "error ref a1b2c3d4" and it can be grepped
        // straight out of `wrangler tail` without anything leaking.
        const ref = crypto.randomUUID().slice(0, 8);
        console.error(`${pathname} threw [ref ${ref}]:`, err);
        // Sent without awaiting: a 500 shouldn't get slower because we're
        // also emailing about it, and waitUntil keeps the isolate alive long
        // enough for it to finish after the response has gone out.
        const alert = sendErrorAlert({ env, ref, pathname, method: request.method, error: err });
        if (ctx?.waitUntil) ctx.waitUntil(alert); else await alert.catch(() => {});
        return new Response(
          JSON.stringify({ error: `Something went wrong on our end. Please try again. (ref: ${ref})`, ref }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    // Not an API route — serve the built static site (index.html fallback
    // for client-side routing is handled by the `not_found_handling` setting
    // on the assets binding in wrangler.toml).
    return env.ASSETS.fetch(request);
  },
};
