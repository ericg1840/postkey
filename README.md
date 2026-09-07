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

Schema changes live in `migrations/`, applied against the database by hand;
`schema.sql` is the equivalent for a fresh database.

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
