# Moving PostKey from Netlify to Vercel

The code side of this migration is done — a full `/api` directory mirrors every
Netlify function, using Vercel's Node.js runtime (Web-standard `Request`/`Response`,
same as before) and `@neondatabase/serverless` instead of `@netlify/database`.
The `netlify/` directory is untouched, so nothing here breaks the existing Netlify
deploy if you want to keep both around for a bit.

What's left needs your accounts/credentials — here's exactly what to do, in order.

## 1. Get a Postgres database

Vercel doesn't come with a database. Two options:

**A. Start fresh (recommended if you don't have real signups yet)**
1. In the Vercel dashboard: your project → **Storage** → **Create Database** → **Postgres** (this is Neon-backed, same tech Netlify DB uses).
2. Vercel automatically adds a `DATABASE_URL` env var to your project — nothing more to do here.
3. Run `api/schema.sql` against it once, from the Vercel dashboard's built-in SQL editor (or `psql "$DATABASE_URL" -f api/schema.sql` from your terminal).

**B. Keep your existing users**
1. In Netlify: your site → **Extensions** → **Neon** → open the Neon project it created. That gives you the real connection string (Netlify never exposes it as a plain env var, which is why I couldn't grab it automatically).
2. Add that same connection string as `DATABASE_URL` in Vercel — no schema/data migration needed, you're pointing at the same database.

## 2. Set environment variables in Vercel

Project → **Settings** → **Environment Variables**. Add these (values Netlify has today, masked for me — you'll need to re-enter or regenerate them):

| Key | Value |
|---|---|
| `DATABASE_URL` | from step 1 |
| `SESSION_SECRET` | any long random string — generate a new one with `openssl rand -hex 32`. This invalidates existing logged-in sessions (everyone just logs in again), which is expected. |
| `RESEND_API_KEY` | from your [resend.com](https://resend.com) dashboard — same key you're already using |
| `RESEND_FROM_EMAIL` | same value as on Netlify, e.g. `PostKey <onboarding@resend.dev>` |

## 3. Connect and deploy

I don't have Vercel credentials in this session, so this part is on you:

```bash
npm i -g vercel
vercel login
vercel link      # links this repo to a new or existing Vercel project
vercel --prod    # builds and deploys
```

Or just import the GitHub repo directly at vercel.com/new — same result, and it'll auto-deploy on every push to `main` going forward (unlike the Netlify setup, which stopped auto-deploying).

You'll land on a free `your-project.vercel.app` URL immediately. A custom domain can be added later from the same project's **Domains** tab whenever you buy one.

## 4. Once it's live and verified

- Test signup, login, and brand-kit save/download end to end on the new URL.
- If everything works and you don't need Netlify anymore, you can delete the `netlify/` directory, `netlify.toml`, and the `@netlify/database` dependency in a follow-up cleanup.
