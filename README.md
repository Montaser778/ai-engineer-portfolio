# Montaser Hussam — AI Engineer Portfolio

> Vanilla HTML / CSS / JS multi-page portfolio, backed by a small FastAPI
> service that powers an admin dashboard, an AI chat widget, and
> dynamic (database-driven) site content. No frontend build step, no framework.

**Live:** https://eng7montaser.tech

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | Vanilla HTML5 (multi-page, 29 pages) |
| Styling | Custom CSS, no framework |
| 3D / background | Three.js r128 particle field + a custom animated neural-network canvas (`neural-bg.js`) |
| Interactivity | Vanilla JS (ES modules) |
| i18n | EN / AR dictionary (`assets/data/i18n.json`), RTL-aware |
| Hosting (site) | GitHub Pages, custom domain |
| Backend | FastAPI (`fastapi-chat/`), deployed on Render |
| Database | Neon Postgres (SQLAlchemy ORM) |
| AI chat | Groq-backed chat widget (`assets/js/chat-widget.js`) |
| Admin dashboard | Server-rendered, bilingual, session-auth (`fastapi-chat/app/routers/admin.py`) |
| Content storage | Site text / images committed to this repo via the GitHub Contents API |

---

## Backend & Admin Dashboard

Projects, pricing tiers, site text (EN/AR), homepage toggles, contact
messages, chat logs, and visitor analytics are all managed from a private
dashboard at `/admin` on the FastAPI service — no hand-editing HTML or
redeploying the site required. Two roles: **owner** (full control,
including user management) and **editor** (content only).

The public pages fetch this content at runtime (`assets/js/cards.js`,
`assets/js/site-settings.js`) and render it into the same markup/CSS the
site already used, so there's no visual difference between hand-written
and dashboard-managed content. Every dashboard save that changes visible
content also bumps `assets/data/status.json`, which the homepage reads
for its "Last updated" line.

See [`fastapi-chat/README.md`](fastapi-chat/README.md) for env vars,
local dev setup, and deployment details.

---

## Deploy

```bash
git add .
git commit -m "Portfolio update"
git push
```

Then go to **Settings → Pages → Branch: `main`, Folder: `/ (root)`**.
The site goes live within a couple of minutes.

For a custom domain, add a `CNAME` file at the repo root containing the bare
domain, and point A / ALIAS records at GitHub Pages.

---

## File Structure

### Pages
29 static HTML pages at the repo root — `index.html`, `projects.html`,
`pricing.html`, `contact.html`, `demos.html`, per-project/per-note pages,
`resume.html`, `services.html`, `about.html`, `legal.html`, `changelog.html`,
`search.html`, `404.html`, `offline.html`, and a handful of resource/checklist
pages.

### Assets & Config
```
favicon.svg           og.svg               site.webmanifest
robots.txt            sitemap.xml          feed.xml
sw.js                 humans.txt           _headers
.github/workflows/deploy.yml
.github/lighthouserc.json
```

### Scripts
| File | Responsibility |
|---|---|
| `assets/css/site.css` | All styling |
| `assets/js/scene.js` | Background particle engine (theme-aware) |
| `assets/js/neural-bg.js` | Animated neural-network canvas background (hero + dashboard) |
| `assets/js/hero3d.js` | Hero workstation model, tilt cards |
| `assets/js/site.js` | UI chrome, command palette, theme/i18n, contact form, timezone widget |
| `assets/js/cards.js` | Fetches `/content/projects` and renders project cards client-side |
| `assets/js/site-settings.js` | Fetches `/content/settings`, hides homepage sections toggled off in the dashboard |
| `assets/js/chat-widget.js` | Floating AI chat widget (Groq-backed, via `fastapi-chat`) |
| `assets/js/analytics.js` | First-party visitor beacon (no cookies/consent banner) |
| `assets/js/demos.js` | Voice VAD, scoring, agent pipeline simulation |
| `assets/js/tools.js` | Architecture explorer, cost calculator, GitHub feed |
| `assets/js/search.js` | Standalone search page, `?q=` deep links |
| `assets/data/i18n.json` | EN / AR dictionary for `data-i18n` elements |
| `assets/data/index.json` | Content index for command palette + `search.html` |
| `assets/data/status.json` | Availability/capacity banner + "Last updated" date (auto-bumped by the dashboard) |
| `fastapi-chat/` | FastAPI backend: chat API, admin dashboard, DB models |

---

## Deferred — Not Built Yet

| Item | Notes |
|---|---|
| `assets/audio/en/*.webm`, `assets/audio/ar/*.webm` (+ `.mp3`, `.vtt`) | Real Cartesia Sonic narration audio and captions |
| Video intro / poster | A real 45s self-hosted or YouTube-embedded video |
| Upwork / Toptal rating headline stats (home page) | Real, confirmed profile data — never a placeholder rating |
| `legal.html` items marked "Unconfirmed" (data sub-processors) | Written confirmation before this can be final |
| Per-language (EN/AR) project fields in the DB | Currently single-language; dashboard translation button covers the gap manually |
| `pricing.html` → `/content/pricing` | Dashboard CRUD exists; the live page still uses static hardcoded tiers |
| Demos page widgets | Simulated, not wired to live APIs (cost/abuse considerations) |

Any remaining hardcoded placeholder can be found with:

```bash
git grep -n "REPLACE"
```

---

## License

All rights reserved. © Montaser Hussam
