# Portfolio API

FastAPI backend for the portfolio site: the Groq-backed chat widget, the
admin dashboard (`/admin`), and public read endpoints (`/content/*`) the
static site fetches to render project cards and pricing. GitHub Pages
(where the static site is hosted) can't run Python, so this runs as a
separate service.

## Local run

```bash
cd fastapi-chat
pip install -r requirements.txt
cp .env.example .env   # then fill in the values below
set -a; source .env; set +a
uvicorn app.main:app --reload --port 8000
```

Without `DATABASE_URL` set, it falls back to a local `dev.db` SQLite file —
fine for local dev, **never use SQLite in production** (see below).

## Environment variables

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | From console.groq.com. Required for the chat widget to respond. |
| `GROQ_MODEL` | Defaults to `openai/gpt-oss-20b`. Check `GET https://api.groq.com/openai/v1/models` with your key if this ever 404s — Groq's available model list changes over time. |
| `ALLOWED_ORIGINS` | Comma-separated list of origins allowed to call this API from a browser, e.g. `https://eng7montaser.tech,https://montaser778.github.io`. Empty = no cross-origin requests allowed at all. |
| `SESSION_SECRET` | Signs admin login cookies. Generate with `python -c "import secrets; print(secrets.token_hex(32))"`. |
| `DATABASE_URL` | A real Postgres connection string (Neon's free tier works well). **Do not leave unset in production** — Render's disk is ephemeral, so SQLite there loses all data on every redeploy/restart. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Seed the one owner account, **only on first run** (i.e. only while the `admin_users` table is empty). Change the password via the dashboard afterwards — these are not re-applied once a user exists, so it's safe to leave them set. |
| `GITHUB_TOKEN` | A fine-grained GitHub PAT scoped to **only** this repo, with Contents: Read and write. Used by the dashboard to commit uploaded images and site-text edits. |
| `GITHUB_REPO` | `owner/repo`, e.g. `Montaser778/ai-engineer-portfolio`. |
| `GITHUB_BRANCH` | Defaults to `main`. |
| `SITE_DOMAIN` | The custom domain the site is actually served from, e.g. `eng7montaser.tech` — used to build correct URLs for uploaded images. |

## Deploy on Render

1. New Web Service, pointed at this repo, root directory `fastapi-chat`.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set all the environment variables above.
5. Once deployed, the site's `assets/js/chat-widget.js` (`CHAT_API_URL`) and
   `assets/js/cards.js` (`API_BASE`) both need to point at this service's URL
   — they're currently hardcoded to the already-deployed instance, so this
   only matters if you ever redeploy to a new URL.

Free-tier Render services spin down on idle — the first request after a
period of inactivity will be slow while it wakes up. Upgrade to a paid tier
to avoid that if this becomes something visitors rely on.

## The admin dashboard

Visit `/admin` on the deployed URL. Log in with `ADMIN_USERNAME`/
`ADMIN_PASSWORD` (the owner account). From there:

- **Site text** — edits `assets/data/i18n.json` directly in the GitHub repo.
  Changes appear on the live site on next page load, no redeploy needed
  (the site already fetches this file at runtime for its EN/AR toggle).
- **Projects** — the "Featured" cards on `projects.html`. Metrics are
  entered as `value|suffix|label` (one per line), buttons as `label|link`
  (one per line). The three cards that used to be hand-written in
  `projects.html` are auto-seeded into the database on first run so nothing
  goes blank when this ships.
- **Pricing** — editable in the dashboard and exposed at `/content/pricing`,
  but `pricing.html` itself isn't wired up to fetch from it yet (that page
  has more visual variants — a "featured/most common" badge, "from"
  prefixes, a "/mo" suffix — than the simple data model covers so far).
- **Messages** — the contact form dual-submits to both Formspree (the
  original, reliable path) and this backend's `/contact`, and every chat
  widget exchange is logged here too, grouped by a per-visitor session id.
- **Users** — owner-only. Add/remove the one "editor" account (content
  access, no user management).

There is deliberately no "Demos" CRUD: `demos.html` is bespoke interactive
widgets (a cost calculator, an agent-pipeline simulator, a scoring demo),
not a card grid, so there's nothing there with the same list-of-cards shape
`projects.html` has.
