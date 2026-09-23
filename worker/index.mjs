// Single Worker entry point (Cloudflare's CI provisions Workers-scoped API
// tokens, not Pages-scoped ones, so this deploys as a plain Worker with a
// static-assets binding rather than as a Pages project). Each handler below
// is the same functions/api/**.mjs file used during earlier Pages-based
// development — only how they're invoked changed, not their internals.
import * as login from "../functions/api/auth/login.mjs";
import * as logout from "../functions/api/auth/logout.mjs";
import * as logoutAll from "../functions/api/auth/logout-all.mjs";
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
import * as contentRecurring from "../functions/api/content/recurring.mjs";
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
import * as bioHeadshot from "../functions/api/bio-headshot.mjs";
import * as bioVcard from "../functions/api/bio-vcard.mjs";
import { sendErrorAlert } from "../functions/_lib/alerts.mjs";
import { getDb } from "../functions/_lib/db.mjs";
import { loadBioMeta, bioShareText, hasShareableHeadshot } from "../functions/_lib/bioMeta.mjs";

// Every handler in functions/api/ has to be listed here by hand — one that
// isn't falls through to the static site and silently serves index.html.
// test/routes.test.mjs checks the two stay in step.
export const ROUTES = {
  "/api/auth/login": { POST: login.onRequestPost },
  "/api/auth/logout": { POST: logout.onRequestPost },
  "/api/auth/logout-all": { POST: logoutAll.onRequestPost },
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
  "/api/bio-headshot": { GET: bioHeadshot.onRequestGet },
  "/api/bio-vcard": { GET: bioVcard.onRequestGet },
  "/api/listings-fetch": { POST: listingsFetch.onRequestPost },
  "/api/posts": { GET: posts.onRequestGet, POST: posts.onRequestPost, DELETE: posts.onRequestDelete },
  "/api/drafts": { GET: drafts.onRequestGet, PUT: drafts.onRequestPut, DELETE: drafts.onRequestDelete },
  "/api/content/posts": {
    GET: contentPosts.onRequestGet, POST: contentPosts.onRequestPost,
    PATCH: contentPosts.onRequestPatch, DELETE: contentPosts.onRequestDelete,
  },
  "/api/content/ideas": {
    GET: contentIdeas.onRequestGet, POST: contentIdeas.onRequestPost,
    PATCH: contentIdeas.onRequestPatch, DELETE: contentIdeas.onRequestDelete,
  },
  "/api/content/autofill": { POST: contentAutofill.onRequestPost },
  "/api/content/recurring": {
    GET: contentRecurring.onRequestGet, POST: contentRecurring.onRequestPost,
    PATCH: contentRecurring.onRequestPatch, DELETE: contentRecurring.onRequestDelete,
  },
  "/api/admin/stats": { GET: adminStats.onRequestGet },
  "/api/admin/users": { GET: adminUsers.onRequestGet },
  "/api/admin/users-export": { GET: adminUsersExport.onRequestGet },
  "/api/admin/user-action": { POST: adminUserAction.onRequestPost },
  "/api/admin/user-activity": { GET: adminUserActivity.onRequestGet },
  "/api/admin/activity-log": { GET: adminActivityLog.onRequestGet },
  "/api/admin/analytics": { GET: adminAnalytics.onRequestGet },
  "/api/track": { POST: track.onRequestPost },
};

/* global HTMLRewriter -- provided by the Workers runtime */

// Link-preview scrapers (Facebook, LinkedIn, iMessage) mostly ignore a
// relative og:image, and index.html can't hardcode a domain — the same build
// serves the workers.dev URL and any custom domain. So the page's og:image,
// twitter:image and og:url are rewritten here to absolute URLs on whatever
// origin the request came in on. Only touches HTML; everything else passes
// straight through.
const SHARE_URL_TAGS = ['meta[property="og:image"]', 'meta[name="twitter:image"]', 'meta[property="og:url"]'];

export function absolutizeShareTags(response, request) {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html") || typeof HTMLRewriter === "undefined") return response;
  const url = new URL(request.url);
  const rewriter = new HTMLRewriter();
  for (const selector of SHARE_URL_TAGS) {
    rewriter.on(selector, {
      element(el) {
        const value = el.getAttribute("content") || "/";
        // og:url is the page itself (minus any query string, which can
        // carry reset/verify tokens); the images resolve against the origin.
        const absolute = selector.includes("og:url") ? `${url.origin}${url.pathname}` : new URL(value, url.origin).href;
        el.setAttribute("content", absolute);
      },
    });
  }
  return rewriter.transform(response);
}

// A public /u/<handle> page gets the agent's own title, description and
// photo in place of PostKey's generic ones, so a shared link previews as
// them. An unknown or disabled handle gets a real 404 status (the page
// still renders its own "not found" screen). Any failure here falls back to
// the generic page — a preview is never worth breaking the page over.
export async function rewriteBioPage(response, request, env, lookup = (handle) => loadBioMeta(getDb(env), handle)) {
  const match = new URL(request.url).pathname.match(/^\/u\/([^/]+)\/?$/);
  const type = response.headers.get("content-type") || "";
  if (!match || !type.includes("text/html") || typeof HTMLRewriter === "undefined") return response;

  let meta;
  try {
    meta = await lookup(decodeURIComponent(match[1]));
  } catch (err) {
    console.error("Bio page preview lookup failed", err);
    return response;
  }
  if (!meta) return new Response(response.body, { status: 404, headers: response.headers });

  const { title, description } = bioShareText(meta);
  const withPhoto = hasShareableHeadshot(meta.headshotUrl);
  const image = withPhoto ? `/api/bio-headshot?handle=${encodeURIComponent(meta.handle)}` : "/og-image.png";
  const set = (value) => ({ element(el) { el.setAttribute("content", value); } });
  return new HTMLRewriter()
    .on("title", { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', set(description))
    .on('meta[property="og:type"]', set("profile"))
    .on('meta[property="og:title"]', set(title))
    .on('meta[property="og:description"]', set(description))
    .on('meta[property="og:image"]', set(image))
    .on('meta[property="og:image:alt"]', set(title))
    // A square headshot, not a 1200x630 banner: drop the banner dimensions
    // and use the square card layout.
    .on('meta[property="og:image:width"]', { element(el) { if (withPhoto) el.remove(); } })
    .on('meta[property="og:image:height"]', { element(el) { if (withPhoto) el.remove(); } })
    .on('meta[name="twitter:card"]', set(withPhoto ? "summary" : "summary_large_image"))
    .on('meta[name="twitter:title"]', set(title))
    .on('meta[name="twitter:description"]', set(description))
    .on('meta[name="twitter:image"]', set(image))
    .transform(response);
}

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
    const response = await rewriteBioPage(await env.ASSETS.fetch(request), request, env);
    return absolutizeShareTags(response, request);
  },
};
