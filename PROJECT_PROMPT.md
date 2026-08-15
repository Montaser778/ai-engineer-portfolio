# Project Prompt — Montaser Hussam Portfolio (v4, complete)

> A single self-contained build specification. Part A defines the base site.
> Part B is everything that separates a strong portfolio from a world-class one.
> Build all of it unless a section is marked **Optional**. This supersedes v3.

---

# PART A — FOUNDATION

## 0. Role and objective

You are a senior front-end engineer and 3D web specialist. Build a complete,
production-ready, multi-page personal website for **Montaser Hussam**, an AI &
Machine Learning engineer based in Gaza, Palestine, working remotely worldwide.

**Primary objective:** convert international companies and founders into paid
remote contracts. Every page moves a visitor toward sending a project brief.

**Secondary objective:** survive technical scrutiny. A CTO will open the console,
run Lighthouse, and read the writing. The site itself is the evidence.

**Tone:** confident, specific, understated. No hype adjectives, no emoji, no
"passionate about technology". Every claim concrete and verifiable.

## 1. Technical constraints (non-negotiable)

- **Vanilla HTML, CSS, JavaScript.** No framework, no bundler, no build step.
  Deploys by copying files to a GitHub Pages repository root.
- **Three.js r128 from CDN.** No ES module imports, no `OrbitControls`, no
  `CapsuleGeometry` — unavailable in r128. Build geometry from primitives.
- **No browser storage for content state.** Theme and language preference are the
  only permitted exceptions (§15, §16) and must degrade silently if blocked.
- **Dependencies:** Three.js and Google Fonts only. No GSAP, no jQuery, no icon
  library, no analytics SDK.
- **One stylesheet** at `assets/css/site.css`.
- **Modular scripts**, each an IIFE that no-ops when its target element is absent,
  so any script can load on any page safely.

## 2. File structure

```
/
├── index.html            projects.html         project-muhawir.html
├── project-agents.html   demos.html            notes.html
├── note-latency.html     note-idempotency.html note-webrtc.html
├── note-evaluation.html  about.html            services.html
├── pricing.html          resume.html           contact.html
├── uses.html             changelog.html        search.html
├── 404.html              offline.html
├── favicon.svg           og.svg                site.webmanifest
├── robots.txt            sitemap.xml           feed.xml
├── sw.js                 humans.txt            _headers
├── README.md             PROJECT_PROMPT.md
├── .github/workflows/deploy.yml
└── assets/
    ├── css/site.css
    ├── js/  scene.js · hero3d.js · site.js · demos.js · tools.js · search.js
    └── data/  search-index.json · i18n.json
```

Load order: `three.min.js` → `scene.js` → `site.js` → `hero3d.js` →
(`demos.js`, `tools.js` on demos only) → (`search.js` where search is used).

## 3. Brand system

**Colour tokens** on `:root`, theme-aware (§16):

| Token | Dark (default) | Light |
|---|---|---|
| `--ink` | `#05070d` | `#f7f5f0` |
| `--panel` | `rgba(11,16,32,.66)` | `rgba(255,255,255,.72)` |
| `--violet` | `#7c5cff` | `#5b3df5` |
| `--teal` | `#22d3c5` | `#0d9488` |
| `--sand` | `#f2e8d5` | `#12151f` |
| `--body` | `#b9c1d1` | `#414a5c` |
| `--muted` | `#8892a6` | `#6b7689` |
| `--line` | `rgba(136,146,166,.18)` | `rgba(20,25,40,.14)` |

Amber `#ffb545` for warnings only. Green `#4ade80` for the availability dot only.

**Typography:** Space Grotesk (display, `letter-spacing:-.02em`), IBM Plex Sans
(body, `line-height:1.8`), JetBrains Mono (data/labels). Arabic mode swaps to
Reem Kufi + IBM Plex Sans Arabic (§15); mono stays Latin. Fluid `clamp()` sizing;
`h1` from 1.95rem to 4.9rem.

**Layout:** container 1160px, padding 28/20/16px. Section rhythm 110/78/62px.
Radius: 6px tags, 8–10px buttons, 14px cards, 16px modals.

## 4. The 3D layer

### 4a. Background particle field — `scene.js`

Fixed full-viewport canvas behind all content, every page.

- **Hand-written `ShaderMaterial`**, not `PointsMaterial`.
- **Budget:** 14,000 desktop / 9,000 under 1200px / 4,000 under 760px. DPR capped
  at 2 desktop, 1.5 mobile.
- **Six shape generators**, pure functions `(index, count, out[3])`:
  `sphere` (Fibonacci sphere with a sine wave on the radius — speech waveform),
  `knot` (torus knot with jitter — interconnected agents),
  `field` (sin/cos height grid — loss surface),
  `helix` (three-armed spiral — data pipeline),
  `grid` (cubic lattice — embedding space),
  `torus` (points on a torus — latent manifold).
- **Morphing:** `aFrom` / `aTo` attributes plus a `uMix` uniform. On change, bake
  the interpolated state into `aFrom`, write the new target into `aTo`, reset
  `uMix`. Stagger arrival by a per-particle random seed so the transition travels
  as a wave rather than snapping.
- **Ambient drift:** 3D value noise implemented inside the vertex shader (hash +
  trilinear smoothstep), offsetting each particle over time.
- **Cursor repulsion:** raycast the pointer onto a z-plane, pass as `uMouse`, push
  outward with `smoothstep` falloff, grow point size and shift colour toward
  amber near the cursor.
- **Scroll coupling:** scroll velocity feeds `uEnergy` (drift amplitude); scroll
  progress drives camera Y and Z.
- **Shape binding:** `<body data-shape="sphere">` per page,
  `<section data-shape="knot">` per section via IntersectionObserver at 0.3.
- **Guards:** pause when `document.hidden` or off-screen; drop DPR to 1 once after
  60 consecutive frames over 33ms; debounce resize 120ms; try/catch the renderer
  and hide gracefully without WebGL; `uReduced` zeroes motion.

### 4b. Hero workstation model — `hero3d.js`

A second WebGL context rendering into `#hero3d` on the home page, built from
primitives with `MeshStandardMaterial`:

- Desk slab with an emissive violet front lip
- Monitor: body box, cylindrical stand, base disc
- **Screen: a `CanvasTexture` redrawn every frame** rendering syntax-coloured
  Python — the real turn-latency measurement function — typing itself line by
  line with a blinking caret, plus `# p50 612ms  p95 780ms`
- Keyboard: 4×14 key meshes, one `emissive` per tick simulating typing
- 16 icosahedron data nodes orbiting at varying radii, connected by a
  `LineSegments` whose vertices update each frame

Lighting: violet directional key front-right, teal directional rim back-left,
pulsing teal point light at the screen, cool ambient fill.

**Scroll-driven camera timeline** (the ScrollTrigger idea, hand-rolled): four
keyframes of `{at, cameraPosition, rotationY, rotationX}` at scroll progress
0 / 0.34 / 0.66 / 1.0, `smoothstep` interpolation, damped 0.075/frame, with
pointer parallax on top.

### 4c. Tilt cards

`data-tilt` elements rotate toward the pointer on 900px perspective, max 9°,
damped 0.14/frame, with a cursor-tracking radial glare and children lifted on
`translateZ(22px)`. Disabled under `pointer: coarse` and reduced motion.

## 5. UI chrome — `site.js`, all JavaScript-injected so markup stays clean

Preloader with counting percentage · custom cursor (instant dot + ring lagging at
0.16, expanding over interactive elements, `pointer: fine` only) · scroll progress
bar · **command palette** (`⌘K` / `Ctrl+K` / `/`, arrow navigation, Enter opens,
Escape closes, copy-link action, single-key shortcuts when not typing) · split
headline reveals behind overflow masks with staggered `cubic-bezier(.16,1,.3,1)` ·
scroll reveals, counters and skill bars on one IntersectionObserver plus a `load`
safety net · magnetic buttons · mobile burger with scroll lock and header shrink
past 40px · project filters with staggered re-entry · FAQ accordion on
`aria-expanded` with animated `max-height` · contact form composing a structured
`mailto:`.

## 6. Pages — base content

**index.html** (`sphere`) — two-column hero (text + `#hero3d`, stacking below
980px): label, availability chip with pulsing dot, `data-split` H1 "I build AI
systems / that listen, reason / and ship.", lede, three chips (turn latency
< 800ms · bilingual EN/AR · shipped on Fly.io + Pipecat Cloud), two CTAs, scroll
hint. Then three capability cards (`helix`), two featured projects (`knot`), a
tool marquee, two delivery-standard quote cards (`torus`), a five-item FAQ
(`grid`), three counting stats and a closing CTA (`field`).

**projects.html** (`grid`) — filter pills All / Voice AI / Agents & LLM / Backend
/ Web against `data-cats`. Six cards: Muhawir (flagship), multi-agent business
analyst, subscription & payment layer, WebRTC deployment pipeline, answer scoring
rubric, portfolio & 3D interfaces — each with an outcome-focused description,
stack tags and links.

**project-muhawir.html** (`sphere`) — prose left, sticky spec panel right. The
problem · the constraint that shaped everything (pull quote: scoring inside the
conversation loop kills the conversation) · how it works (capture, understand,
respond, evaluate, report) · the hard parts (hosting real-time media, measuring
latency honestly, bilingual not translated, billing that cannot double-charge) ·
outcome. Spec panel: role, backend, models, transport, data, deploy.

**demos.html** (`sphere`) — six interactive sections, each with an honest scope
note distinguishing what is real from what is modelled. **Never overstate a demo.**

1. **Voice pipeline** — real `getUserMedia` + `AnalyserNode`, live mirrored RMS
   waveform with a dashed threshold line, turn end at RMS < 0.028 sustained
   520ms, four-stage timeline with counting values, total turning teal below
   800ms, a simulate fallback for blocked microphones, and an explicit statement
   that audio never leaves the device.
2. **Answer scoring** — textarea plus a transparent heuristic scorer across
   Relevance, Depth, Structure, Evidence, Concision (1–5), counting sequencing
   markers, quantified figures, technical terms, hedging and length; animated
   canvas radar, per-dimension bars, and a verdict naming the weakest dimension.
3. **Multi-agent pipeline** — four agent cards moving queued → running → done at
   staggered intervals while streaming into a live log, then a synthesis step
   that detects a conflict between two agents and resolves it.
4. **Architecture explorer** — six clickable nodes, each opening what it does plus
   a distinct "Why this way" rationale.
5. **Cost estimator** — sliders for users and voice minutes, language and voice
   quality selects; outputs monthly inference cost, cost per user, a four-part
   breakdown with bars, and expected turn latency (Arabic adds an endpointing
   penalty, premium TTS adds synthesis time).
6. **Live GitHub** — `fetch` the six most recently updated repos with name,
   description, language, stars and relative push time, with a graceful
   rate-limit fallback.

Plus a provider decision table and a lazy-loaded live-product iframe, mounted only
once the URL placeholder is replaced.

**notes.html** (`helix`) — index of the write-ups (§18).
**about.html** (`helix`) — method, spec panel, three-entry timeline, six skill
bars, stack cloud.
**services.html** (`knot`) — four engagement cards, four-step process timeline.
**pricing.html** (`grid`) — Sprint from $1,800, **Build from $6,000** (featured),
Retainer $3,500/month, advisory $65/hour minimum 5 hours. USDT section: network
selector swapping address and fee note, copy button with confirmation, amber
wrong-network warning, fee estimator, terms table, and a "prefer not to use
crypto?" card. Terms: priced USD settled USDT, 50/50, client pays network fee,
transaction hash as receipt, unstarted milestones refundable.
**resume.html** (`grid`) — one-page CV of quantified achievements, print button.
**contact.html** (`field`) — brief form + sidebar (email, GitHub, LinkedIn, UTC+3
overlap note, one-business-day response, "good fit if" card).
**404.html** — short apology, ⌘K prompt, three recovery buttons.

## 7. Responsive specification

| Breakpoint | Changes |
|---|---|
| ≥1100px | Full layout, sidebar grids 1.6fr/1fr, sticky panels active |
| 1100px | Sidebar grids tighten to 1.3fr/1fr |
| 980px | Hero stacks; 3D stage moves below text |
| 900px | Three-column → two; sidebar grids → single column |
| 860px | Burger nav; ⌘K trigger and custom cursor removed; panels unstick; tables scroll; footer stacks; sections 78px |
| 640px | All grids single column; buttons full-width stacked; wallet address stacks; sections 62px; canvas opacity 0.8 |
| 380px | Padding 14px; h1 1.8rem; card padding 18px |
| Landscape ≤480px tall | Hero and page-head padding reduced to clear the fold |

`--nav-h` (68px / 58px) drives hero padding and `scroll-margin-top`. Line masks
need `padding-bottom:.14em` with matching negative margin or tall glyphs clip. No
horizontal overflow at any width. Touch targets ≥44px.

## 8. Accessibility

Skip link · `:focus-visible` 2px teal at 3px offset · decorative canvases
`aria-hidden` · palette `role="dialog"`/`aria-modal`, list `role="listbox"` · FAQ
`aria-expanded`, filters `aria-pressed` · log `aria-live="polite"` · full
reduced-motion support · every control labelled · diagrams `role="img"` with a
descriptive `aria-label`.

## 9. Performance budget

First paint never waits on WebGL. Preconnect to fonts and CDN. `display=swap`.
Read geometry once per pointer event, write in rAF. Passive scroll and pointer
listeners. Debounced resize, paused loops when hidden. Site weight excluding fonts
and Three.js under 250KB.

## 10. SEO and metadata

Per page: unique title and description, Open Graph title/description/type/
site_name/image, Twitter `summary_large_image`, favicon, manifest, theme-color.
Site-wide: `robots.txt` → `sitemap.xml`, `Person` JSON-LD on home.

## 11. Placeholders — never invent values

| Token | Location |
|---|---|
| `REPLACE@EMAIL.COM` | contact, resume, palette, feed |
| `REPLACE_WITH_YOUR_TRC20_ADDRESS` | pricing `WALLETS` |
| `REPLACE_WITH_YOUR_ERC20_ADDRESS` | pricing (or delete that network) |
| `REPLACE_WITH_YOUR_BEP20_ADDRESS` | pricing (or delete that network) |
| `https://REPLACE-WITH-YOUR-LIVE-URL` | demos `#liveUrl` |
| LinkedIn `href="#"` | every footer, contact |
| `data-user="montaser778"` | demos `#gh` |
| Per-project repo / live links | projects |
| `REPLACE_FORM_ENDPOINT` | contact (§21) |
| `REPLACE_BOOKING_URL` | contact, services (§22) |

## 12. Deployment

Copy all files to the root of `montaser778.github.io`, commit, push. Settings →
Pages → branch `main`, folder root. Custom domain via a `CNAME` file plus an
ALIAS/ANAME record.

## 13. Acceptance criteria (base)

Zero console errors · no horizontal scroll at 320/375/768/1024/1440/1920 · both
WebGL contexts hold 50fps on a mid-range laptop and degrade automatically ·
readable and navigable with JavaScript disabled · usable with WebGL unavailable ·
reduced motion removes all non-essential motion · microphone denial does not break
the voice demo · GitHub failure shows a fallback · résumé prints clean on one page ·
no dead links outside the placeholder list · palette fully keyboard operable ·
every demo scope note accurate.

## 14. Writing rules

Lead with the outcome, then the method — "cut p95 from 940ms to 210ms" beats
"worked on performance". Name the trade-off in every architectural decision. No
superlatives about himself. One spelling convention across all pages. **Never
claim a metric, client, testimonial or credential that has not been supplied** —
if a number is unavailable, restructure the sentence rather than invent one.

---

# PART B — THE PROFESSIONAL LAYER

## 15. Bilingual EN ⇄ AR with full RTL — `i18n.json`

The highest-value addition, because it demonstrates the exact skill his product
sells: treating Arabic as a first-class language rather than a translation.

- Toggle in the header (`EN | ع`) and in the command palette.
- All copy lives in `assets/data/i18n.json`, keyed by `data-i18n` attributes,
  swapped without a page reload.
- Toggling sets `<html lang>` and `<html dir>`. Every layout must work in RTL —
  use CSS logical properties (`margin-inline-start`, `padding-inline`,
  `inset-inline`, `border-inline`) throughout, so RTL needs no second stylesheet.
- Arabic swaps the font stack: Reem Kufi display, IBM Plex Sans Arabic body.
- Numbers, code blocks, the architecture diagram and the terminal texture stay LTR
  inside an RTL page — set `direction: ltr` on those containers explicitly.
- Persist the choice in `localStorage` inside try/catch; fall back to
  `navigator.language` if storage is blocked.
- Add `<link rel="alternate" hreflang="ar">` and `hreflang="en"` pairs.

**Do not machine-translate.** Arabic copy must be written natively — shorter
sentences, no calques. If Arabic for a section is unavailable, leave it English
and mark it `data-i18n-todo` rather than shipping awkward Arabic.

## 16. Theme system — dark, light, system

A three-state toggle cycling dark → light → system, reading
`prefers-color-scheme` in system mode and listening for changes. Applied via a
`data-theme` attribute on `<html>` driving the token table in §3.

**Both 3D scenes must respond**, or the background disappears on a light page:
shift particle colours darker, reduce additive blending opacity, and change the
fog colour. Persist in `localStorage` inside try/catch. Add an inline blocking
script in `<head>` that sets the attribute before first paint to prevent a flash
of the wrong theme.

## 17. Client-side search — `search.js` + `search-index.json`

A real search across every page and note.

- Build `assets/data/search-index.json` as `{url, title, section, type, body}`
  entries covering all pages and notes.
- Scoring without any library: title match ×3, section heading ×2, body ×1, with
  a bonus for consecutive-term matches.
- Wire it into the command palette so `⌘K` searches *content*, not just page
  names, highlighting matched terms in each result snippet.
- A standalone `search.html` accepting `?q=` for deep links and the 404 page.
- Debounce input at 120ms, cap results at 12.

## 18. Notes as individual pages + RSS

Split the four write-ups into their own URLs so each is shareable and indexable:
`note-latency.html`, `note-idempotency.html`, `note-webrtc.html`,
`note-evaluation.html`. Each gets:

- Reading time, publication date, and a table of contents for longer notes
- `Article` JSON-LD with `headline`, `datePublished`, `author`, `wordCount`
- Previous / next navigation
- A "discuss this" link to contact with the note title pre-filled in the subject
- `feed.xml`, a valid RSS 2.0 feed of all notes, linked from every page head

`notes.html` becomes the index: date, reading time, two-line excerpt per note.

## 19. Second case study — `project-agents.html`

One case study reads as a lucky project; two read as a method. Build the
multi-agent business analyst as a full case study mirroring the Muhawir shape:
the problem (founders get a confident single-perspective answer) · the constraint
(four agents disagreeing is the feature, not a bug) · how it works · the hard
parts (conflict resolution at synthesis, cost per run, stopping agents converging
on each other's language) · the outcome. Include a hand-written SVG state-flow
diagram and a code block showing the graph definition.

## 20. Proof and trust

Hiring managers scan for external validation. On the home page:

- **Logo strip** — greyscale at 0.55 opacity, saturating on hover. With no client
  logos available, use a **"Trusted stack"** strip of the technologies he ships
  on, honestly labelled. Never imply clients he does not have.
- **Testimonial slots** — a two-card carousel with quote, name, role, company.
  Leave them **out of the DOM entirely** until real quotes are supplied. A
  fabricated testimonial is the fastest way to lose a contract.
- **Availability banner** — a dismissible strip stating current capacity and the
  next available start date.

## 21. Working contact form with a real backend

Keep `mailto:` as the fallback and add a real submission path:

- `fetch` POST to `REPLACE_FORM_ENDPOINT` (Formspree, Basin or Web3Forms all work
  on a static host), with inline pending, success and error states.
- **Honeypot field** — visually hidden input that bots fill; discard silently.
- **Time-trap** — reject submissions completed in under 3 seconds.
- Client-side validation with messages tied to inputs by `aria-describedby`.
- Automatic `mailto:` fallback if the endpoint errors, so a brief is never lost.
- On success, show the response-time promise and a link to pricing.

## 22. Booking and timezone converter

A "Book a 30-minute call" CTA on services, pricing and contact opening
`REPLACE_BOOKING_URL` (Cal.com or Calendly). Beside it, read the visitor's zone
from `Intl.DateTimeFormat().resolvedOptions().timeZone` and render "his
09:00–18:00 UTC+3 is your 06:00–15:00" automatically. Removing the mental
arithmetic measurably increases bookings from other timezones.

## 23. Quote and invoice generator — **Optional, high leverage**

At the end of pricing, a tool that produces a real quote: pick an engagement type,
add scope items, choose a currency; render line items, subtotal, the 50/50
schedule and USDT settlement terms; print to PDF with a dedicated stylesheet;
deep-linkable by query string so he can send a client a pre-filled quote URL.
This turns the portfolio from a brochure into a sales instrument.

## 24. `uses.html` — the stack page

A known genre among senior engineers: editor and extensions, terminal and shell,
machine, the AI tooling he actually works with, the model providers he has
benchmarked, hosting choices — each with the reasoning and the trade-off. Short
and opinionated. This page gets shared in developer communities and brings
inbound traffic no marketing copy will.

## 25. `changelog.html` — the site as a living project

A dated log of what changed and why. Signals ongoing maintenance, gives returning
visitors a reason to come back, and quietly proves he ships. Each entry: date,
version, bullets, and a one-line rationale where it matters.

## 26. Offline support — `sw.js` + `offline.html`

A service worker: **cache-first for static assets, network-first for HTML**, with
a versioned cache name so a deploy invalidates cleanly. Precache the shell,
stylesheet, scripts and favicon. Serve `offline.html` on navigation failure.
Register only over HTTPS behind a feature check. The site should open on a plane —
which, for a portfolio reviewed by travelling hiring managers, is not a gimmick.

## 27. Social preview image — `og.svg` + rasterised PNG

A designed 1200×630 card: name, role, the three key chips, and the particle motif
rendered flat. Ship the SVG source and a PNG, referenced by `og:image`,
`og:image:width`, `og:image:height` and `twitter:image`, with per-page variants
for the case studies and the notes index. A link with no preview image looks
amateur in exactly the channels where contracts start.

## 28. View transitions and route polish

Use the View Transitions API where supported (`document.startViewTransition`) for
cross-page fades, with a `@view-transition` declaration and a full no-op fallback.
Add `<link rel="prefetch">` to navigation links as they enter the viewport so a
nav click feels instant. Set `history.scrollRestoration = 'manual'` with explicit
handling, so returning to a filtered project list keeps its position.

## 29. URL state for filters and tools

Project filters write to and read from the query string (`?filter=voice`), making
a filtered view shareable and the back button correct. Same for the pricing
currency, the architecture explorer's open node, and the cost estimator's slider
values — a prospect can email his own configuration back, which starts a
conversation.

## 30. Analytics without surveillance — **Optional**

If measurement is wanted, use a cookieless, privacy-preserving option (Plausible,
self-hosted Umami, or GoatCounter). No Google Analytics, no fingerprinting, no
consent banner required. Track page views and outbound CTA clicks only. State the
choice on the site — a visible privacy stance is itself a professional signal to
European clients.

## 31. Security headers — `_headers`

Ship a `_headers` file (honoured by Netlify and Cloudflare Pages; document that
GitHub Pages ignores it, so it applies on migration):

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://api.github.com
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
Permissions-Policy: geolocation=(), camera=(), microphone=(self)
```

`microphone=(self)` is required for the voice demo. Every external link carries
`rel="noopener noreferrer"`. The live-product iframe stays sandboxed.

## 32. Continuous integration — `.github/workflows/deploy.yml`

On every push to `main`: validate HTML across all pages · run a link checker and
fail on any broken internal link · run Lighthouse CI against budgets
(**Performance ≥ 90, Accessibility 100, Best Practices ≥ 95, SEO 100**) · deploy
to Pages only if everything passes. A visitor who finds a CI badge in the README
understands immediately what kind of engineer built this.

## 33. Craft details

- **Console signature** — a styled `console.log` greeting with an invitation to
  get in touch and the site version. Engineers open the console; meet them there.
- **Shortcut overlay** — `?` opens a map of every keyboard shortcut.
- **Copy-code buttons** on every code block, with a confirmation state.
- **Anchor links** on note headings, revealed on hover.
- **`humans.txt`** — the old-web credits file, a quiet craft signal.
- **Reduced-data mode** — honour `prefers-reduced-data` by halving the particle
  count and skipping the hero model.
- **Focus trap** in the palette and mobile nav, returning focus to the trigger.
- **Error boundary** — a global `window.onerror` handler that hides a broken 3D
  layer rather than leaving a dead canvas, and never surfaces a stack trace.

## 34. Final acceptance criteria

Everything in §13, plus:

- [ ] Every page renders correctly in both `dir="ltr"` and `dir="rtl"`
- [ ] Theme toggle changes CSS tokens **and both 3D scenes**, with no flash of
      incorrect theme on load
- [ ] Search returns sensible ranked results for "latency", "webrtc", "pricing",
      "arabic", "idempotent"
- [ ] Every note is reachable at its own URL and appears in `feed.xml`
- [ ] The contact form succeeds against a real endpoint and falls back to
      `mailto:` when unreachable
- [ ] Honeypot and time-trap silently reject an automated submission
- [ ] The service worker serves the site offline after one visit, and a new
      deploy invalidates the old cache
- [ ] Social preview renders correctly in LinkedIn, Slack, WhatsApp and X
- [ ] Filter, node and estimator state survives a reload via the URL
- [ ] Lighthouse: Performance ≥ 90, Accessibility 100, Best Practices ≥ 95, SEO 100
- [ ] Keyboard-only: reach every page, open the palette, run every demo and submit
      the form without a pointer
- [ ] Timezone converter shows correct local hours from three different zones
- [ ] No placeholder token from §11 remains in a deployed build

## 35. Build order

Build in leverage order, not file order:

1. Foundation — tokens, layout, navigation, responsive grid (§3, §7)
2. Content — every page's real copy, unstyled (§6). Copy first, effects later.
3. Background 3D engine (§4a)
4. UI chrome and command palette (§5)
5. Hero model and tilt (§4b, §4c)
6. Demos, tools and search (§6, §17)
7. Bilingual and theme (§15, §16)
8. Notes split, RSS, second case study (§18, §19)
9. Forms, booking, quote tool (§21, §22, §23)
10. Infrastructure — service worker, headers, CI, OG images (§26, §27, §31, §32)
11. Craft pass (§33), then the full acceptance sweep (§34)

If time is limited, **§15, §17, §18, §19 and §21 deliver the most contract value
per hour**. §23, §25 and §30 are the safest to defer.
