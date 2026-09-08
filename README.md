# PostKey

A tool for building branded real estate social posts — upload property photos,
pick a layout, and export a finished image ready to post.

- **Listings** — a property post in one of eight layouts (Bold, Editorial,
  Collage, Modern, Signature, Ribbon, Roundup, Spotlight), exported at every
  social size
- **Local** — community and lifestyle posts: local spotlights, market stats,
  testimonials, tips, checklists, quotes, this-or-that
- **Planner** — a month view for deciding what to post and when
- **Captions** — generated listing descriptions
- **Bio** — a public link-in-bio page at `/u/<handle>`

Every post carries the agent's brand kit (logo, headshot, colors, contact and
brokerage details), which is set up once and applied everywhere.

## Deployment

Deployed as a single Cloudflare Worker (see `wrangler.toml`): `worker/index.mjs`
routes `/api/*` to the handlers in `functions/` and serves the built frontend
from `dist/` for everything else.

The app can't run as a static site — accounts, the brand kit, saved posts and
the planner all depend on those API routes and on Postgres (Neon).

## Configuration

Worker secrets/vars (`wrangler secret put NAME`):

| Name | Required | What it does |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon connection string |
| `SESSION_SECRET` | yes | Signs session cookies |
| `RESEND_API_KEY` | yes | Sends welcome, confirmation and password-reset email |
| `RESEND_FROM_EMAIL` | no | Defaults to Resend's sandbox sender |
| `ALERT_EMAIL` | no | Where 500s are reported. Unset means no alerts are sent — the app is otherwise unaffected |
| `GOOGLE_CLIENT_ID` | no | Enables "Continue with Google". Unset means the button 500s if clicked — the rest of auth is unaffected |
| `GOOGLE_CLIENT_SECRET` | no | Paired with `GOOGLE_CLIENT_ID` |

To set up Google sign-in, create an OAuth client (type "Web application") in
the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
and add `<your-app-origin>/api/auth/google/callback` as an authorized
redirect URI (e.g. `https://postkey.example.com/api/auth/google/callback`,
plus `http://localhost:5173/api/auth/google/callback` for local dev if
you're proxying `/api` to a deployed Worker).

`ALERT_EMAIL` is worth setting. Without it, a broken endpoint is only visible
in `wrangler tail`, which nobody is watching — that's how the planner stayed
broken for three days. With it, the first 500 on a route emails you the error,
its stack, and the same reference the user was shown; repeats of that same
failure are suppressed for 15 minutes so one outage isn't a thousand emails.

## Migrations

Schema changes live in `migrations/`, numbered in the order they apply.
`schema.sql` is the equivalent for a fresh database.

```
DATABASE_URL='postgres://...' npm run migrate              # apply anything pending
DATABASE_URL='postgres://...' npm run migrate -- --status  # list each file and whether it ran
DATABASE_URL='postgres://...' npm run migrate -- --dry-run # show pending, change nothing
```

Applied files are recorded in a `schema_migrations` table, so a migration
never runs twice and "has this one been applied?" is a question with an
answer. Each file runs in its own transaction — one that fails leaves nothing
behind and stays pending.

Write migrations to be idempotent anyway (`IF NOT EXISTS`, `ON CONFLICT DO
NOTHING`, guarded `DO` blocks), as the existing ones are: it makes re-running
after a partial failure safe, and it's what lets a database that predates the
tracking table catch up without any special handling.

**A missed migration shows up as a 500 on whichever page needs it, not as a
deploy failure — so run this before shipping a change that adds one.**

## Local development

```
npm install
npm run dev
```

## Checks

```
npm run check      # lint + tests + build, the same three CI runs on every PR
```

Individually: `npm run lint`, `npm test`, `npm run build`.
