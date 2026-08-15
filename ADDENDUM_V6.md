# Addendum Prompt — Trust, Conversion & Enterprise Layer (v6)

> **Additive only. Do not replace, remove or rewrite anything.** Apply on top of
> `PROJECT_PROMPT.md` (v4) and `ADDENDUM_V5.md` (v5). Everything below is new.
>
> Every item here is grounded in what current research says actually converts a
> visitor into a paying client for an independent engineer — not in visual
> fashion. Where a feature is visual, its justification is still conversion.

---

## Global additive rules (unchanged from v5)

New files and appended CSS blocks only · every module an IIFE that no-ops when
its target is missing · every feature degrades to nothing · nothing blocks first
paint · **never fabricate a testimonial, badge, client, metric or credential.**

---

# PART F — THE FIVE-SECOND TEST

## 56. The 30-second answer block

Research is consistent: a visitor decides within seconds, and a site must answer
five questions almost immediately — what you do, who you do it for, what results
to expect, why you should be trusted, and what to do next.

Add a compact band directly under the hero, above everything else, answering all
five in one screen:

| Slot | Content |
|---|---|
| **What** | Real-time voice AI, multi-agent systems, production LLM pipelines |
| **Who for** | Product teams and founders shipping AI features to real users |
| **Result** | Sub-800ms voice turns, bilingual by default, deployed and operable |
| **Proof** | Live demos · two case studies · public repositories |
| **Next** | Send a brief — reply within one business day |

Five cells on desktop, a stacked list on mobile, each linking to the page that
proves it. This single band does more for conversion than any animation on the
site.

## 57. Contact on every page

Currently contact lives on one page. Add a persistent path from everywhere:

- A compact CTA band at the foot of **every** page — one line plus one button,
  not a full section
- Email visible in the footer of every page as real text, not only behind a form
- The command palette already carries "Email me"; surface it in the header on
  mobile too, where the palette is hidden

## 58. Prune to the strongest work

Six project cards currently compete for attention. Research favours **three to
six high-impact case studies over a complete inventory**, and clickable case
studies convert roughly twice as well as text-heavy project lists.

Restructure `projects.html` into two tiers: **Featured** (Muhawir and the
multi-agent analyst, large cards with metrics and a "Read the case study" link)
and **Also built** (the remaining four, compact single-line entries). Do not
delete anything — demote it.

---

# PART G — VERIFIABLE PROOF

## 59. Third-party verification strip

Visitors discount what you say about yourself and weight what others say. Add a
strip of **links out to independently verifiable profiles**:

- Upwork or Toptal profile with its real rating and job-success score
- GitHub profile with real contribution and repository counts (already fetched
  live in §demos — surface the headline numbers on the home page too)
- Any platform badge that is genuinely earned

**Render each badge only when its underlying value is supplied.** A badge slot
with no data must not render at all — never a placeholder rating, never a
"5.0 ★" that no platform issued. Fabricated proof is both illegal in many
jurisdictions and fatal when discovered.

## 60. Video introduction — 45 seconds

The single highest-trust element available to a solo engineer, and the one his
competitors will not have. A short, plain video of him speaking: who he is, what
he builds, how he works. No script read to camera, no production, no music.

- Self-hosted `.webm` with `.mp4` fallback, or embedded from YouTube with
  `youtube-nocookie.com`
- **Poster frame, click to play, never autoplay with sound** (§42)
- Captions required — `.vtt` for self-hosted, or YouTube captions verified by
  hand, not auto-generated
- Placed in the hero on desktop as a small circular play affordance, and as a
  full card on `about.html`
- Under 8MB if self-hosted, lazy-loaded

## 61. One-page case study PDFs

Each case study also exists as a downloadable one-page PDF following
problem → solution → result, generated from a print stylesheet on the existing
case study page so it can never drift out of sync. The person who decides is
often not the person browsing; give the browser something to forward.

## 62. Video testimonials — slots only

When real client quotes exist, a 30-second video clip outperforms a text quote by
a wide margin. Build the slot: a card grid with poster, name, role, company,
click-to-play, captions.

**Ship it commented out and absent from the DOM until real material is supplied.**

---

# PART H — REMOVING THE CLIENT'S RISK

## 63. "What happens after you send this"

Directly beneath the contact form, a four-step strip: reply within one business
day · a 30-minute call · a written scope and fixed price · work starts. Explaining
what follows a submission measurably reduces form abandonment, because the
unknown is the friction.

## 64. Risk reversal

State plainly what protects the client:

- A paid, small **first milestone** so they can evaluate the working relationship
  before committing to the full engagement
- **Unstarted milestones fully refundable** (already in the pricing terms —
  surface it as a headline, not a table row)
- **They own the code** on final payment, with repository and credentials
  transferred
- A named **support window** after delivery

Present as four short cards, not paragraphs. Each removes a specific objection.

## 65. Legal and compliance page — `legal.html`

Enterprise procurement blocks contracts over exactly these gaps, and having the
answers ready is itself a differentiator against other independents:

- **NDA** — willing to sign the client's, or offer a standard mutual one
- **IP assignment** — work-for-hire, assigned on final payment, stated explicitly
- **Data handling** — what he stores, for how long, where; his stance on training
  data and client confidentiality with AI tools
- **Sub-processors** — the model providers a project's data would touch, named
- **Accessibility statement** — the site's own conformance target and known gaps
- **Privacy** — what the site collects (if analytics are used) and what it does not

Write it in plain language, not boilerplate. **Do not state a legal position that
has not been confirmed with him** — mark anything unconfirmed as a placeholder.

## 66. Security posture note

A short section on `legal.html` or `process.html`: how he handles credentials
(never in chat or email), his use of platform secret managers, least-privilege
access requests, and what he needs from a client to start safely. Any client who
has been burned once will read this closely.

---

# PART I — PRICING AND MONEY

## 67. Multi-currency display

Show prices in USD with a toggle for EUR and GBP at a fixed, dated conversion
("rates as of {date}, invoiced in USD"). A European client seeing a familiar
currency evaluates faster. **Never fetch a live rate** — a wrong rate on a quote
is a dispute.

## 68. Pricing transparency logic

Beyond the tiers, one short paragraph on **how** he prices: what drives an
estimate up (real-time constraints, multiple languages, compliance requirements)
and what brings it down (an existing codebase, a defined API surface, a single
language). Even where exact figures cannot be published, publishing the *logic*
builds trust and pre-qualifies the enquiry.

## 69. Payment method matrix

Extend the existing USDT section into a small matrix: **USDT** (fastest, his
preference) · **freelance platform escrow** (best for a first engagement with a
cautious client) · **bank transfer** (for companies with procurement rules).

Adding escrow as a visible option removes the largest single objection a
first-time client has about paying an independent contractor abroad, and costs
him nothing to offer.

## 70. Rate card for the sceptical

An honest note explaining that a fixed price is quoted per scope rather than per
hour, why that is better for the client (they carry no risk of overrun), and the
hourly figure used underneath for reference.

---

# PART J — AUTHORITY AND REACH

## 71. Open-source and public work

A section listing genuine public contributions — repositories, issues filed,
answers written, packages published. Pull live from the GitHub API where possible.
If the list is thin, it is better to show three real items than to pad it.

## 72. Speaking, writing and community

Slots for talks given, articles published elsewhere, and communities he is active
in, each with a real link. Combined with the existing notes, this establishes the
authority signal that research repeatedly identifies as a top-tier trust factor.
**Render only real entries.**

## 73. Newsletter — **Optional**

A single-field subscribe form on `notes.html` ("new engineering notes, roughly
monthly, no other email"). Use a static-friendly provider endpoint. A visitor not
ready to hire today is worth keeping. Include the unsubscribe promise in the
label, and never pre-tick anything.

## 74. SEO for intent, not vanity

Target the phrases a hiring client actually searches: "real-time voice AI
engineer", "Pipecat developer", "Arabic voice assistant developer", "LLM latency
optimisation consultant". Place the primary phrase in the title, meta description,
`h1`, and at least two `h2` elements per relevant page. Add `CreativeWork`
JSON-LD to each case study and `FAQPage` JSON-LD to the home FAQ, both of which
can win rich results.

## 75. Answer-engine optimisation

AI search assistants increasingly answer hiring queries directly. Structure each
case study and note so the first paragraph is a self-contained answer to the
question its title poses, and keep the JSON-LD accurate. Being cited by an
assistant is now a real referral channel and costs nothing beyond good structure.

---

# PART K — EXPERIENCE DEPTH

## 76. Client project dashboard demo

A mock read-only dashboard showing what a client sees during an engagement:
milestone status, weekly update entries, latency and cost charts, and a decision
log. Clearly labelled as a demonstration. It answers "what is it like to work
with him" more convincingly than any paragraph, and it showcases front-end skill
at the same time.

## 77. Interactive scope builder

Extend §45: after the three questions, produce a **draft scope document** —
deliverables, assumptions, out-of-scope items, milestone breakdown and an
indicative range — printable and deep-linkable. A prospect arriving at the call
with a scope already drafted converts at a completely different rate.

## 78. Comparison against alternatives

Already specified in §46. Extend to include the option **"build it in-house with
your existing team"** and be honest about when that is the right answer. Telling a
prospect not to hire you when it is true is the strongest possible trust signal,
and the ones who come back are the ones worth having.

## 79. FAQ expansion by objection

Rewrite the home FAQ around the five real objections rather than general
curiosity: *Can one person deliver this?* · *What if you become unavailable?* ·
*How do we handle the timezone gap?* · *Can you work inside our repo and process?*
· *What if we need to stop halfway?* Answer each directly, including the
uncomfortable parts.

## 80. Response-time and availability integrity

The availability banner and the one-business-day promise must be true. Build them
from a single `status.json` he updates, and add a visible "last updated" date. A
stale "available now" banner from four months ago does more damage than no banner.

---

# PART L — OPERATIONS

## 81. Analytics that answer one question

If analytics are used (§30, privacy-preserving only), track exactly four events:
demo started · pricing viewed · scope builder completed · brief submitted. That
funnel tells him which page earns contracts. Anything more is noise.

## 82. A/B-ready hero

Structure the hero headline and CTA so their text comes from a single config
object, making it trivial to test a second version later without touching markup.

## 83. Broken-state audit

A documented manual pass, repeated before every deploy: JavaScript disabled ·
WebGL unavailable · offline · slow 3G · 320px width · keyboard only · screen
reader · reduced motion · reduced data · dark and light · LTR and RTL. Record the
result in `changelog.html`. Most sites fail four of these and never know.

## 84. Uptime and freshness

A monthly reminder to update: availability status, the changelog, the GitHub
pinned repositories, and the résumé date. Document the checklist in `README.md`.
An abandoned-looking site reads as an unavailable engineer.

---

## 85. Updated acceptance criteria

Everything from §13, §34 and §53, plus:

- [ ] A first-time visitor can answer all five questions from §56 without
      scrolling past two screens
- [ ] Contact is reachable from every page without using the navigation menu
- [ ] **No badge, rating, testimonial, logo or metric renders without real
      supplied data** — verified by loading the site with an empty data file
- [ ] Every video has verified captions and never autoplays with sound
- [ ] Case study PDFs generate correctly and match the live page content
- [ ] The scope builder output prints cleanly and its deep link restores state
- [ ] `legal.html` contains no unconfirmed legal claim
- [ ] Currency toggle shows a dated rate and states the invoicing currency
- [ ] `status.json` drives every availability claim on the site, with a visible
      last-updated date
- [ ] The full broken-state audit in §83 passes on every page

---

## 86. Priority order

1. **§56 five-second band** and **§57 contact everywhere** — cheapest, largest gain
2. **§63 what happens next** and **§64 risk reversal** — remove objections at the
   exact moment they occur
3. **§59 verification** and **§60 video intro** — external proof beats self-claims
4. **§58 prune projects** and **§79 objection FAQ** — sharpen what already exists
5. **§65 legal** and **§69 payment matrix** — unblock enterprise and cautious clients
6. **§77 scope builder** and **§76 dashboard demo** — the differentiators
7. **§74–75 SEO and AEO**, **§71–72 authority** — compounding over months
8. **§80–84 operations** — what keeps all of it true

---

## 87. Standing constraints

- **Never fabricate** a rating, badge, testimonial, client, logo, metric or
  credential. Where data is missing, the element does not render.
- **Never autoplay unmuted audio or video.**
- **Never overstate a demo.**
- **Never state a legal, tax or contractual position that has not been confirmed
  by him.** Mark unconfirmed items as placeholders — this is his liability, not
  the builder's judgement call.
- **Never remove existing working features** to make room for new ones.
