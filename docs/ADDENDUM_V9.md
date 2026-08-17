# Addendum Prompt — Acquisition & Landing Layer (v9)

> **Additive only. Do not replace, remove or rewrite anything.** Applies on top
> of `PROJECT_PROMPT.md` (v4), `ADDENDUM_V5.md`, `ADDENDUM_V6.md`,
> `ADDENDUM_V7.md` and `STRUCTURE_AND_V8.md`.
>
> Derived from a gap analysis against high-converting commercial education and
> services sites. **Their patterns are adapted, not copied** — those sites sell
> courses to individuals; this site sells engineering to companies. The
> anti-patterns in §119 matter as much as the features.

---

## 119. What NOT to import — read first

The reference sites use a consumer sales funnel. Importing it wholesale would
actively damage credibility with a senior technical buyer. **Never add:**

- **Hype openers.** "Be at the forefront of the AI revolution", "unlock your
  potential", "game-changing". A CTO reads these as a signal to stop reading.
- **Discount theatre.** "49% OFF", strikethrough prices, countdown timers,
  "limited spots". These frame expert services as a commodity and invite
  haggling. Prices are quoted, not discounted.
- **Volume as a proxy for value.** "293 hours, 11 courses, 27 projects." His
  advantage is depth. Listing quantity invites comparison on quantity, which he
  loses to an agency.
- **Manufactured urgency or scarcity** of any kind.
- **Aggregate star ratings he does not have.** Only real, linkable, third-party
  verifiable ratings (§59).
- **Cookie consent theatre** — better to collect nothing and say so (§30).

The tone target is unchanged: confident, specific, understated.

---

# PART P — LANDING PAGES BY SPECIALISM

## 120. Why one services page is not enough

A single generic services page competes for every search term and wins none. A
buyer searching "real-time voice AI developer" wants a page that is *about* that,
in their vocabulary, with proof specific to it. Specialised landing pages also
rank far better than a general page for the exact phrases a hiring client uses.

## 121. Build four landing pages

| Page | Target phrase | Primary proof |
|---|---|---|
| `voice-ai.html` | real-time voice AI engineer, Pipecat developer, WebRTC voice agent | Muhawir case study, live voice demo, latency numbers |
| `llm-agents.html` | multi-agent LLM development, LangGraph developer, RAG engineer | Agents case study, live pipeline demo, evaluation page |
| `arabic-ai.html` | Arabic voice assistant developer, bilingual AI, RTL AI product | Bilingual architecture, language-aware endpointing, RTL work |
| `ml-to-production.html` | ML prototype to production, deploy ML model API, MLOps contractor | Deployment write-ups, WebRTC infrastructure note, cost dashboard |

## 122. Shared landing page structure

Every landing page follows the same eight blocks, so building the fourth costs a
fraction of the first:

1. **Headline naming the exact problem**, in the buyer's words — not his.
   Example for `voice-ai.html`: "Your voice agent works in the demo and dies in
   production." Not: "I build voice AI."
2. **Three symptoms** the reader will recognise, as a checklist. If they nod at
   two, they keep reading.
3. **The approach** in five steps, specific to this specialism.
4. **Proof block** — the relevant case study summary with hard numbers, plus an
   embedded live demo where one exists.
5. **What you get** — concrete deliverables, not adjectives.
6. **Objection block** — the two objections specific to this specialism, answered.
   For voice: latency and hosting. For Arabic: quality versus English.
7. **Pricing anchor** — the relevant tier with a "from" figure, linking to full
   pricing.
8. **One CTA**, repeated at top and bottom, identical wording.

## 123. Landing page technical requirements

- Unique `<title>`, meta description and `h1` containing the target phrase, plus
  the phrase in at least two `h2` headings — placed naturally, never stuffed.
- `Service` JSON-LD with `serviceType`, `areaServed: "Worldwide"` and `provider`.
- Canonical URL, and cross-links between all four so authority is shared.
- Listed in `sitemap.xml` and in the footer under a "Specialisms" column.
- **No duplicated body copy between them.** Near-identical pages are treated as
  duplicates and all four lose ranking. Each needs genuinely distinct writing.

---

# PART Q — STICKY IN-PAGE NAVIGATION

## 124. The problem

Case studies, pricing and landing pages are long. A reader deep in the page has
no idea what remains, cannot jump between sections, and cannot reach the CTA
without scrolling back.

## 125. Build a section rail

A sticky secondary bar appearing below the header once the reader passes the
page introduction:

- Anchor links to each major section of the page, generated from its `h2`
  elements at load — no manual list to maintain.
- The active section highlights as it enters the viewport (IntersectionObserver,
  not scroll maths).
- A persistent CTA button on the right of the rail.
- On mobile, the rail becomes a horizontally scrollable strip of pills; if there
  are more than five sections, it collapses into a dropdown.
- Respects `scroll-margin-top` so an anchored heading is never hidden behind the
  fixed header.
- Keyboard accessible with `aria-current="true"` on the active link.

Apply to: both case studies, all four landing pages, `pricing.html`,
`services.html` and `notes.html`.

---

# PART R — THE INTERNAL CHAMPION

## 126. The problem nobody solves

The person who finds this site is often an engineer or product lead who **cannot
authorise spend**. They like the work, then have to persuade a manager, using
their own words, from memory, days later. Most of those conversations never
happen.

## 127. "Convince your manager" — `make-the-case.html`

Give the champion a ready-made internal case. A page containing:

**A copy-ready email** with fill-in-the-blank fields the reader completes on the
page (their name, the project, the timeline), rendered live as they type, with a
copy button:

> Subject: External specialist for the [project] voice feature
>
> Hi [manager], We've been blocked on [specific problem] for [duration]. I've
> found an engineer who has shipped this exact system end to end — real-time
> voice with sub-800ms turn latency, deployed and operating in production. He
> works on fixed-scope contracts starting at [tier], 50% upfront, and we own the
> code on completion. The alternative is [in-house cost / agency cost / continued
> delay]. I'd like to book a 30-minute scoping call. His work is at [link].

**A one-page business case PDF** (print stylesheet), containing: the problem in
business terms, three options compared with costs, the recommendation, the
risk-reversal terms from §64, and the engagement timeline. Nothing a manager has
to translate.

**An objection cheat-sheet** for the champion: what to say when the manager asks
"why not our own team", "why not an agency", "what if he disappears", "how do we
pay someone abroad". Two sentences each, honest, including the cases where the
answer is genuinely "you shouldn't hire him".

This single page converts a powerless admirer into an internal advocate. Almost
no independent engineer builds it.

---

# PART S — NUMBERS AND PROOF ABOVE THE FOLD

## 128. One number, very large

The reference sites lead with a single striking figure. Adapt, do not imitate:
lead with the number that defines the discipline, not a salary.

Place directly beneath the hero headline, at display size:

> **< 800 ms** — the turn latency below which a spoken conversation stops feeling
> like waiting on a server. Everything I build is measured against it.

One number, one sentence of meaning. It states his obsession and his competence
simultaneously, and it is memorable in a way no paragraph is.

## 129. Metric row above the fold

Four compact counters in the first screen: turn latency · languages shipped ·
production deployments · response time. Animated on load, not on scroll — they
must be visible to a reader who never scrolls (§106).

## 130. External verification beside the metrics

Immediately adjacent, the third-party links from §59 — platform profile with its
real rating, GitHub with real counts. Self-reported numbers and externally
verifiable ones sitting side by side is what makes both believable.

**Render nothing without real data.** No placeholder rating, ever.

---

# PART T — PRICING PRESENTATION

## 131. Currency selector

A control at the top of `pricing.html` switching all displayed figures between
USD, EUR and GBP at a **fixed, dated rate**, with a persistent line: "Rates as of
{date}. All contracts invoiced and settled in USD." Never fetch a live rate — a
rate that moves between viewing and invoicing becomes a dispute.

## 132. Risk reversal as a headline block

Promote the terms from §64 out of the table into a prominent four-icon row
directly under the tiers: **paid pilot milestone · unstarted milestones fully
refundable · you own the code on completion · named support window.**

The reference sites give their guarantee an icon, a heading and its own space.
Yours is currently a table row. Buyers scan for the guarantee; make it findable.

## 133. Pricing FAQ

Directly beneath the tiers, six questions answered in full paragraphs rather than
single lines: what drives an estimate up or down · what happens if scope changes
mid-project · what if the work takes longer than estimated · why fixed scope
rather than hourly · what is not included · how payment works for a first-time
client.

Answer completely. A short answer to a money question reads as evasion.

## 134. Team and multi-project note

A short line for the buyer with more than one project: retainer terms, and a
statement that he works inside an existing team's repository and process when
that is what fits. Currently the site implies solo delivery only, which
disqualifies him from a category of work he can do.

---

# PART U — DEPTH IN THE ANSWERS

## 135. Expand every FAQ answer

The current answers are one line. The reference FAQ answers run several
paragraphs with sub-headings, and that depth is the credibility. Rewrite each
home FAQ answer to two or three real paragraphs, including the uncomfortable
part. "What if you become unavailable?" gets an honest answer about bus factor
and what he does to mitigate it, not a reassurance.

## 136. `FAQPage` structured data

Mark up both the home FAQ and the pricing FAQ with `FAQPage` JSON-LD. It can win
expanded search results, and AI assistants answering hiring queries lift from it
directly.

---

# PART V — LEAD MAGNETS

## 137. Give something away that proves competence

A visitor not ready to hire today is still worth capturing — but only with
material that demonstrates skill rather than harvests emails.

Three candidates, each downloadable **without an email wall**, with an optional
newsletter prompt after the download:

1. **Voice AI latency checklist** — a one-page audit of the twelve places latency
   hides in a speech pipeline. Useful even to someone who never hires him, which
   is exactly why it gets shared.
2. **LLM cost estimation worksheet** — the model behind the calculator (§ cost
   estimator), as a spreadsheet.
3. **Production readiness checklist for AI features** — what must exist before a
   prototype meets users.

**No gating.** An email wall on a checklist reads as marketing; a free useful
artefact reads as expertise, and it circulates.

## 138. Newsletter, honestly framed

One field, on `notes.html` and after each download: "New engineering notes,
roughly monthly. Nothing else, ever. Unsubscribe in one click." Never pre-ticked,
never a modal, never on page load.

---

# PART W — COMPLETE FOOTER AND LEGAL

## 139. Footer as a site map

The current footer has three links, two of them dead. Rebuild as four columns:

- **Work** — Projects · Case studies · Demos · Notes
- **Specialisms** — the four landing pages from §121
- **Engage** — Services · Pricing · Make the case · Contact
- **About** — About · Résumé · Uses · Changelog · Legal

Plus a row of real social links, the availability line from `status.json`, and
the copyright.

**Every link must resolve.** A dead link in a footer is worse than a missing one.

## 140. Legal pages

`privacy.html`, `terms.html` and the accessibility statement (§113), reachable
from the footer. Enterprise procurement checks for these before a contract, and
their absence stalls deals that were otherwise agreed.

Write in plain language. **Do not state a legal position that has not been
confirmed by him** — mark unconfirmed clauses as placeholders rather than
inventing terms.

---

## 141. Updated acceptance criteria

Everything from §13, §34, §53, §85 and §117, plus:

- [ ] Each landing page has genuinely distinct copy — no duplicated blocks
- [ ] Each landing page's target phrase appears in title, description, `h1` and
      two `h2` headings, reading naturally in all four places
- [ ] The sticky rail generates from headings automatically, tracks the active
      section, and never covers an anchored heading
- [ ] The "make the case" email updates live as fields are filled and copies
      correctly
- [ ] The business case PDF prints to one page
- [ ] The currency selector changes every figure and shows a dated rate
- [ ] Every FAQ answer runs at least two paragraphs and answers the hard part
- [ ] `FAQPage` and `Service` structured data validate
- [ ] All three lead magnets download without an email wall
- [ ] **Every footer link resolves** — verified by an automated link check
- [ ] No hype language, discount framing, urgency device or unverified rating
      appears anywhere on the site (§119)

---

## 142. Priority

1. **§128–130 numbers and verification above the fold** — one afternoon, largest gain
2. **§139 complete footer** and **§140 legal pages** — fixes dead links, unblocks
   enterprise buyers
3. **§132–133 risk reversal and pricing FAQ** — removes money objections
4. **§121–123 the four landing pages** — the compounding SEO investment
5. **§126–127 make the case** — the differentiator nobody else builds
6. **§124–125 sticky rail** — usability on long pages
7. **§135–136 FAQ depth and structured data**
8. **§131 currency**, **§137–138 lead magnets**

---

## 143. Standing constraints

- **Never fabricate** a rating, badge, testimonial, client, metric or credential.
  No element renders without real data.
- **No hype, no discounts, no urgency, no scarcity** (§119).
- **Never state an unconfirmed legal, tax or contractual position.**
- **Never publish an unmeasured benchmark figure**, and date every measured one.
- **Never autoplay unmuted audio or video.**
- **Never expose an unmetered inference endpoint.**
- **Every footer and navigation link must resolve** before deploy.
- **A placeholder left in a deployed build is a defect.**
