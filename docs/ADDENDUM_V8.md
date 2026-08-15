# Project Structure & Addendum v8 — The Competitive Layer

---

# PART A — FILE STRUCTURE

## A1. The problem with the current layout

Prompt documents, drafts and internal notes currently sit next to `index.html`
in the repository root. They are publicly readable — meaning a client can read
the internal build specification, including the placeholder list and the notes
about what has not been verified. Move them.

## A2. Target structure

```
ai-engineer-portfolio/
│
├── index.html                   ← must stay in root; GitHub Pages entry point
├── 404.html                     ← must stay in root
├── favicon.svg                  ← root (browsers request /favicon.svg)
├── robots.txt                   ← root (crawlers require it there)
├── sitemap.xml                  ← root
├── site.webmanifest             ← root
├── .nojekyll                    ← root, empty, prevents Jekyll processing
├── CNAME                        ← root, only when a custom domain is set
├── README.md                    ← root, the repository's front page
│
├── assets/
│   ├── css/site.css
│   ├── js/  scene.js · hero3d.js · site.js · demos.js · tools.js · polish.js
│   ├── data/  status.json · search-index.json · i18n.json
│   ├── img/  og.png ...
│   └── audio/  narration segments, if built
│
├── docs/                        ← INTERNAL, not linked from the site
│   ├── PROJECT_PROMPT.md
│   ├── ADDENDUM_V5.md
│   ├── ADDENDUM_V6.md
│   ├── ADDENDUM_V7.md
│   ├── ADDENDUM_V8.md
│   └── CHECKLIST.md             pre-deploy checklist
│
└── .github/workflows/deploy.yml
```

## A3. Move the internal docs

Keeps them versioned and available, but out of search results and out of a
casual visitor's path. Add to `robots.txt`: `Disallow: /docs/`.

## A4. Why the HTML pages stay in the root

Do not move pages into `pages/`. Flat routing is correct for a site of this
size; the root is not "messy" when every file in it is a real page.

## A5. Naming conventions

Lowercase with hyphens, no spaces, prefix related pages (`note-*`, `project-*`),
one purpose per JS file.

## A6. Add a real `.gitignore`

OS files, editor folders, secrets (`.env`, `*.key`, `*.pem`), build artefacts.

## A7. README as the repository's front page

One-line description, live link, screenshot, stack, five-bullet feature list,
local run instructions, structure — not the build prompts.

---

# PART B — ADDENDUM V8: THE COMPETITIVE LAYER

> Additive only. Applies on top of v4, v5, v6 and v7.

## 105. Dynamic hero messaging

Headline second line cycles through audiences on a 3.5s interval, pausing on
hover and under reduced motion, four variants maximum.

## 106. Metrics and credibility above the fold

Promote a compact version of the counters into the hero: turn latency,
languages, deployments, response time.

## 107. An AI assistant that answers *about him*

A chat widget answering visitor questions about his work, grounded strictly in
site content via retrieval, with citations. **Retrieval-grounded only** — never
free-generation about him. Hard rate limit and token cap per session/day,
enforced server-side. Visible disclaimer. Graceful exhaustion message. No
transcript logging without a stated privacy policy.

## 108. Hover previews on project links

Floating preview card — screenshot, one-line result, stack — before the click.

## 109. Frictionless booking flow

Embed the scheduler inline where possible, pre-filled with known context
(engagement type, timezone).

## 110. Content architecture that scales

A tag/category system across notes, projects and demos, with a tag index page.

## 111. Case study depth tiers

60-second summary / 5-minute read / full technical write-up, toggled at the top.

## 112. Progressive disclosure everywhere

Nothing over three paragraphs without an expand control.

## 113. Accessibility as a stated position

A section in `legal.html`: conformance target, what's tested, known gaps,
contact for reports.

## 114. Deliberate restraint

Audit every effect against: does this help the reader, or only impress them?
Re-examine curtain transitions on slow connections, scramble on long labels,
custom cursor for anyone relying on system cursor settings.

## 115. Case study of the site itself

A page documenting how this site was built: constraints, particle system
architecture, performance budget, accessibility decisions, what was cut and why.

## 116. Submission-ready

Only after every placeholder is gone: a 1200×630 preview, a 60-second screen
recording, a 200-word description, credits.

---

## 117. Priority

1. A3 move the docs
2. §105 dynamic hero + §106 metrics above the fold
3. §114 restraint audit
4. §111 depth tiers + §112 progressive disclosure
5. §107 AI assistant (only with rate limiting)
6. §115 site case study
7. §108–110, §113
8. §116 submission

---

## 118. Standing constraints

- Never expose an unmetered inference endpoint from a public page.
- The assistant answers only from indexed content, never free-generation.
- Never fabricate a rating, badge, testimonial, client, metric or credential.
- Never autoplay unmuted audio or video.
- A placeholder left in a deployed build is a defect.
- Adding a feature is not always an improvement — every addition must survive
  the §114 question.
