# Montaser Hussam — AI Engineer Portfolio

> Vanilla HTML / CSS / JS multi-page portfolio. No build step, no frameworks.
> Three.js r128 (CDN) powers the background particle field and the hero 3D workstation model.

**Live:** https://eng7montaser.tech

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | Vanilla HTML5 (multi-page) |
| Styling | Custom CSS, no framework |
| 3D / WebGL | Three.js r128 + custom GLSL ShaderMaterial |
| Interactivity | Vanilla JS (ES modules) |
| i18n | EN / AR dictionary (`assets/data/i18n.json`) |
| Hosting | GitHub Pages |

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
```
index.html            projects.html        project-muhawir.html
project-agents.html   demos.html           notes.html
note-latency.html     note-idempotency.html
note-webrtc.html      note-evaluation.html
about.html            services.html        pricing.html
resume.html           contact.html         uses.html
changelog.html        search.html          404.html
offline.html
```

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
| `assets/js/scene.js` | Background particle engine (theme-aware, §16) |
| `assets/js/hero3d.js` | Hero workstation model, tilt cards |
| `assets/js/site.js` | UI chrome, command palette, theme/i18n, contact form, timezone widget |
| `assets/js/demos.js` | Voice VAD, scoring, agent pipeline simulation |
| `assets/js/tools.js` | Architecture explorer, cost calculator, GitHub feed |
| `assets/js/search.js` | Standalone search page, `?q=` deep links |
| `assets/data/i18n.json` | EN / AR dictionary for `data-i18n` elements |
| `assets/data/index.json` | Content index for command palette + `search.html` |

---

## Placeholders — Replace Before Launch

These are intentionally obvious tokens. **Do not invent values for them.**

| Token | Location | Needs |
|---|---|---|
| `REPLACE@EMAIL.COM` | `contact.html`, `resume.html`, `humans.txt`, `site.js` → `contactForm()` | Working email |
| `REPLACE_WITH_YOUR_TRC20_ADDRESS` | `pricing.html` → `WALLETS` | USDT TRC20 address |
| `REPLACE_WITH_YOUR_ERC20_ADDRESS` | `pricing.html` → `WALLETS` | USDT ERC20 address (or delete network) |
| `REPLACE_WITH_YOUR_BEP20_ADDRESS` | `pricing.html` → `WALLETS` | USDT BEP20 address (or delete network) |
| `https://REPLACE-WITH-YOUR-LIVE-URL` | `demos.html` → `#liveUrl`, `projects.html` Muhawir card | Deployed Muhawir URL |
| LinkedIn links | Every page footer, `contact.html`, `resume.html` | LinkedIn profile URL |
| `data-user="montaser778"` | `demos.html` → `#gh` | Confirm GitHub username |
| `href="#"` | `projects.html` (4 of 6 project cards) | Repo / live URL per project |
| `REPLACE_FORM_ENDPOINT` | `contact.html`, `site.js` → `contactForm()` | Formspree / Basin / Web3Forms endpoint — falls back to `mailto:` until set |
| `REPLACE_BOOKING_URL` | `contact.html`, `services.html`, `pricing.html` | Cal.com or Calendly link |

Find them all at once:

```bash
git grep -n "REPLACE"
```

---

## Deferred — Not Built This Pass

| Item | Notes |
|---|---|
| `assets/audio/en/*.webm`, `assets/audio/ar/*.webm` (+ `.mp3`, `.vtt`) | Real Cartesia Sonic narration audio and captions |
| Video intro / poster | A real 45s self-hosted or YouTube-embedded video |
| Upwork / Toptal rating headline stats (home page) | Real, confirmed profile data — never a placeholder rating |
| `legal.html` items marked "Unconfirmed" (data sub-processors) | Written confirmation before this can be final |

---

## Part B Additions

Bilingual support, theme switching, search, offline mode, and supporting
infrastructure.

---

## License

All rights reserved. © Montaser Hussam
