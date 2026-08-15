# Montaser Hussam — Portfolio (v4)

Vanilla HTML/CSS/JS multi-page portfolio. No build step, no frameworks. Three.js
r128 loaded from CDN for the background particle field and the hero 3D
workstation model.

## Deploy

Copy every file to the root of the `montaser778.github.io` repository:

```bash
git add .
git commit -m "Portfolio v3"
git push
```

Settings → Pages → branch `main`, folder root. Live within a couple of minutes.
For a custom domain, add a `CNAME` file with the bare domain and point an
ALIAS/ANAME record at GitHub Pages.

## File structure

```
index.html, projects.html, project-muhawir.html, project-agents.html,
demos.html, notes.html, note-latency.html, note-idempotency.html,
note-webrtc.html, note-evaluation.html, about.html, services.html,
pricing.html, resume.html, contact.html, uses.html, changelog.html,
search.html, 404.html, offline.html
favicon.svg, og.svg, site.webmanifest, robots.txt, sitemap.xml, feed.xml,
sw.js, humans.txt, _headers
.github/workflows/deploy.yml, .github/lighthouserc.json
assets/css/site.css
assets/js/scene.js    background GLSL particle engine (theme-aware, §16)
assets/js/hero3d.js   hero workstation model + tilt cards
assets/js/site.js     UI chrome, command palette, theme/i18n, contact form,
                       search integration, timezone widget, craft details
assets/js/demos.js    voice VAD, answer scoring, agent pipeline sim
assets/js/tools.js    architecture explorer, cost calculator, live GitHub feed
assets/js/search.js   standalone search page, ?q= deep links
assets/data/i18n.json         EN/AR dictionary for data-i18n elements
assets/data/search-index.json content index for command palette + search.html
```

## Placeholders to replace before launch

These are intentionally obvious tokens — do not invent real values for them.

| Token | Location | Needs |
|---|---|---|
| `REPLACE@EMAIL.COM` | contact.html, resume.html, humans.txt, site.js `contactForm()` | Working email address |
| `REPLACE_WITH_YOUR_TRC20_ADDRESS` | pricing.html `WALLETS` object | USDT TRC20 address |
| `REPLACE_WITH_YOUR_ERC20_ADDRESS` | pricing.html `WALLETS` object | USDT ERC20 address (or delete the network) |
| `REPLACE_WITH_YOUR_BEP20_ADDRESS` | pricing.html `WALLETS` object | USDT BEP20 address (or delete the network) |
| `https://REPLACE-WITH-YOUR-LIVE-URL` | demos.html `#liveUrl`, projects.html Muhawir card | Deployed Muhawir URL |
| `href="#"` LinkedIn links | every page footer + contact.html + resume.html | LinkedIn profile URL |
| `data-user="montaser778"` | demos.html `#gh` | Confirm GitHub username is correct |
| Project repo/live links marked `href="#"` | projects.html (4 of 6 project cards) | Repo or live URL per project |
| `REPLACE_FORM_ENDPOINT` | contact.html / site.js `contactForm()` | Formspree, Basin or Web3Forms endpoint URL — falls back to `mailto:` until set |
| `REPLACE_BOOKING_URL` | contact.html, services.html, pricing.html | Cal.com or Calendly booking link |

## Part B additions (bilingual, theme, search, offline, infra)

- **Bilingual EN/AR (§15)** — toggle in the header, `assets/data/i18n.json`,
  `data-i18n` attributes. Infrastructure (RTL, font swap, persistence,
  hreflang, `<html lang/dir>`) is fully wired site-wide. Arabic copy is
  written (not machine-translated) for navigation, footer and the home hero;
  the rest of each page's body copy remains English by design — translating
  every page's full prose natively is a larger content pass than this build
  covered, so nothing was machine-translated to fake completeness.
- **Theme (§16)** — dark/light/system cycle, blocking inline script prevents
  a flash of the wrong theme, both Three.js scenes respond via a shared
  `uTheme` uniform (see `scene.js`).
- **Search (§17)** — `search-index.json` + scored client-side search, wired
  into the command palette and the standalone `search.html` (`?q=` deep
  links).
- **Notes split + RSS (§18)** — four standalone note pages, `feed.xml`,
  prev/next nav, reading time, JSON-LD, "discuss this" links pre-filling the
  contact form subject.
- **Second case study (§19)** — `project-agents.html`, with a hand-written
  SVG state-flow diagram and a graph-definition code block.
- **Trust (§20)** — trusted-stack strip and a dismissible availability
  banner on the home page. No client logos or testimonials exist yet, so
  none are in the DOM — per the spec, that section is left out entirely
  rather than faked.
- **Contact form (§21)** — `fetch` POST with honeypot + 3-second time-trap,
  automatic `mailto:` fallback while `REPLACE_FORM_ENDPOINT` is unset or on
  network error.
- **Booking + timezone (§22)** — booking CTA on services/pricing/contact,
  `Intl`-based timezone converter widget.
- **`uses.html` / `changelog.html` (§24, §25)** — both built in full.
- **Offline (§26)** — `sw.js` (cache-first static, network-first HTML,
  versioned cache) + `offline.html`.
- **Social preview (§27)** — `og.svg` wired via `og:image`/`twitter:image`
  on every page. A rasterised PNG was **not** produced — this environment
  has no image-rasterisation tooling available, so only the SVG source
  ships. Some platforms (older LinkedIn/Slack unfurlers) render `og:image`
  PNGs more reliably than SVG; convert `og.svg` to a 1200×630 PNG with any
  design tool before relying on link previews in those channels.
- **View transitions / route polish (§28)** — `@view-transition` CSS
  declaration, `<link rel="prefetch">` on viewport-entered nav links,
  `history.scrollRestoration = 'manual'`.
- **URL state (§29)** — project filters and the pricing USDT network
  selector read/write the query string.
- **Security headers (§31)** — `_headers` (Netlify/Cloudflare Pages; GitHub
  Pages ignores it, documented in the file itself).
- **CI (§32)** — `.github/workflows/deploy.yml` runs HTML validation, a
  link checker and Lighthouse CI (budgets in `.github/lighthouserc.json`)
  before deploying to Pages. Not run against a live repo in this session —
  verify the action versions still resolve when first pushed.
- **Craft pass (§33)** — console signature, `?` shortcut overlay, copy-code
  buttons, heading anchors on notes, `humans.txt`, reduced-data mode
  (halves particle count via `prefers-reduced-data`/`saveData`), focus traps
  on the palette and mobile nav, a global error-boundary listener.

### Deferred (per §35's own guidance on what's safest to cut)

- **§23 Quote/invoice generator** — not built. Explicitly marked optional
  and lowest-priority in the spec's own build order.
- **§30 Analytics** — not built. Explicitly optional; add a cookieless
  provider (Plausible/Umami/GoatCounter) later if measurement is wanted.
- Arabic translation is infrastructure-complete but content-partial (see
  above) — extending `data-i18n` coverage to every page's full body copy is
  the largest remaining Part B task if pursued further.
- The CI Lighthouse thresholds and link-checker are configured but untested
  against a real GitHub Actions run in this session.

## Notes on the build

- All chrome (preloader, cursor, command palette, reveals, mobile nav, FAQ,
  magnetic buttons, contact-form mailto) is injected/driven by `assets/js/site.js`
  and no-ops safely if its target markup is missing, so every script can be
  loaded on every page.
- `scene.js` wraps `WebGLRenderer` creation in try/catch and hides the canvas
  if WebGL is unavailable; `prefers-reduced-motion` zeroes drift via a
  `uReduced` uniform.
- The voice demo works with or without microphone permission — the
  "simulate a turn" button always works if `getUserMedia` is denied or absent.
- The GitHub demo fails gracefully to a text message on rate limit or network
  failure, never a blank panel.
- `resume.html` has a dedicated print stylesheet in `assets/css/site.css`
  (`@media print`) that removes canvases, header, footer and cursor, and
  switches to a white background.
