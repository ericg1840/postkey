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
