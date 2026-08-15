# Addendum Prompt — ML Credibility & The 40-Second Review (v7)

> **Additive only.** Applies on top of `PROJECT_PROMPT.md` (v4),
> `ADDENDUM_V5.md` and `ADDENDUM_V6.md`.
>
> Previous layers made the site persuasive. This layer makes the *engineering*
> verifiable — and fixes the surface that is actually reviewed first.

---

## 88. The premise this layer corrects

Research on how AI/ML candidates are screened is blunt: the review lasts about
forty seconds, it starts on **GitHub**, and it consists of the pinned
repositories, one README's first paragraph, and whether a live demo link exists.
Everything below the fold does not exist.

Two consequences:

1. **The GitHub profile is the front door, not the site.** It must be treated as
   a designed surface with the same care as the home page.
2. **AI/ML portfolios are judged on different artefacts than web portfolios** —
   model cards, evaluation results, architecture diagrams and reproducibility,
   not visual polish. Depth over breadth: one well-documented system with a live
   demo, a benchmark table and an architecture diagram outperforms ten
   half-finished notebooks.

---

# PART M — THE GITHUB SURFACE

## 89. Profile README — `montaser778/montaser778`

Create the special `username/username` repository whose README renders on the
profile page. Most candidates skip it entirely; doing it at all is an advantage.

Keep it under one screen:

- One sentence on what he builds — real-time voice AI and production LLM systems
- Three pinned projects, one line each, each with a **live link**
- Current focus and availability for contracts
- Contact and portfolio link
- **No badge walls, no trophy widgets, no animated snake.** They read as
  decoration to a senior reviewer.

## 90. Pinned repositories — exactly three

Pin only the three that support the positioning: Muhawir, the multi-agent
analyst, and this portfolio. **Unpin everything from coursework or tutorials,
even if it has more stars** — a pinned tutorial project speaks louder than any
cover letter, and not in his favour.

## 91. Repository README template

Every pinned repository gets the same structure, because the first paragraph is
all that will be read:

1. **One-line description** and a live demo link, above the fold
2. **The problem** in two sentences, framed as a business outcome
3. **Architecture diagram** — an image or Mermaid block, visible without scrolling far
4. **Results table** — latency, cost, evaluation scores, whatever is measured
5. **How to run it** — exact commands, verified from a clean clone
6. **Decisions and trade-offs** — a short section, or a link to the site's notes
7. **What I would do differently** — this section, more than any other, reads as
   senior

Frame outcomes the way a hiring manager repeats them upward. "Cut perceived
response time to under 800ms" travels further than "achieved X on a benchmark".

## 92. Commit history as evidence

A contribution graph that is mostly empty with occasional dense spikes reads as
coursework dumps. Small, consistent commits over time read as engineering work.
Going forward, commit each meaningful step separately — data loading, baseline,
evaluation harness, deployment config, monitoring — rather than one large drop.

## 93. Cross-linking

Site → repository on every project card, and repository → site on every README.
A reviewer arriving from either direction should reach the other in one click.

---

# PART N — ML ARTEFACTS ON THE SITE

## 94. Model cards — `models.html`

The artefact AI/ML portfolios are specifically judged on, and one almost no
independent engineer publishes. One card per model in the production stack:

| Field | Content |
|---|---|
| Model and version | Exact identifier, not a family name |
| Task in this system | What it does here specifically |
| Why chosen | The decision criterion — usually latency, not benchmark rank |
| Measured performance | In *his* pipeline, not the vendor's published figures |
| Known failure modes | Where it breaks: accents, code-switching, background noise |
| Fallback | What happens when it fails or is deprecated |
| Cost | Per minute or per thousand tokens, dated |
| Deprecation risk | Provider stability, migration path |

The failure-modes row is the one that earns respect. Anyone can list a model;
stating precisely where it breaks proves it was run in anger.

## 95. Evaluation report — `evaluation.html`

How the scoring rubric is validated, published as a methodology page:

- The five dimensions with **anchored level descriptions**, 1 through 5
- The held-out example set and why those examples were chosen
- Inter-rater agreement, or an honest statement that agreement is unmeasured
- How prompt changes are tested against the set before shipping
- **Where the evaluator is known to be wrong** — score inflation on confident
  but empty answers, harshness on non-native phrasing

State methodology limits plainly. An evaluation page that admits its own
weaknesses is worth more than one claiming an accuracy figure with no error bars.

## 96. Benchmark and decision table

Extend the existing provider table on `demos.html` into a full page or section:
what was measured, on what input, on what date, and what the numbers were. Where
a figure was not measured, **say so** rather than quoting the vendor. A dated
"measured on my own audio, 3 August 2026" is worth more than a marketing number.

## 97. Reproducibility block

Every case study gets a short block: the exact dependency versions, the hardware
or platform, and the commands to reproduce. Reproducibility is a stated screening
criterion for ML roles and almost nobody supplies it.

## 98. Failure post-mortem

One honest write-up of something that broke in production, structured as
symptom → investigation → root cause → fix → what changed permanently. The ICE
negotiation failure is the natural candidate. Hiring managers explicitly scan for
how a candidate handles failures; volunteering one is disarming and rare.

## 99. Cost and latency dashboard

A small static dashboard of tracked metrics over time — p50 and p95 turn latency,
cost per session, error rate — from a JSON file he updates. It demonstrates the
monitoring instinct that separates prototype builders from operators, and it
makes the "production" claim concrete rather than asserted.

## 100. Live RAG demo — **Optional, high value**

Retrieval-augmented generation is currently the most requested skill in job
descriptions. A small demo indexing his own notes and case studies, answering
questions about his work with citations back to the source page, would:

- Demonstrate the single most in-demand skill directly
- Serve as a genuinely useful site search
- Make the site itself the artefact

Requires a hosted endpoint (his existing API can serve it) with strict rate
limiting, a hard token cap, and a graceful message when the quota is exhausted.
**Never ship an unmetered LLM endpoint from a public page.**

---

# PART O — WHAT ACTUALLY BLOCKS LAUNCH

## 101. Read this before adding anything further

The site now specifies well over a hundred features across four documents. The
constraint is no longer feature count. Nothing further should be built until
these are done, because each one currently makes the live site *worse* than the
work put into it:

| Blocker | Status |
|---|---|
| Working email address | Placeholder |
| LinkedIn URL | Placeholder |
| Live Muhawir URL | Placeholder |
| USDT wallet addresses | Placeholder |
| Per-project repository links | Placeholder |
| GitHub profile README | Does not exist |
| Pinned repositories | Not curated |
| Repository READMEs | Not written |

A visitor who clicks a dead link, or a client who finds `REPLACE@EMAIL.COM`,
forms a conclusion that no amount of WebGL reverses. **Placeholders are more
damaging than missing features**, because a missing feature is invisible and a
broken one is not.

## 102. Verify before extending

Open the deployed site and confirm, on a phone and on a laptop:

- [ ] Every page loads with styling and both 3D layers intact
- [ ] Every navigation link resolves
- [ ] The voice demo requests the microphone and runs
- [ ] The GitHub section loads real repositories
- [ ] Nothing in the console is red
- [ ] The résumé prints to one clean page

Only then is more construction worth doing.

## 103. Priority

1. **Replace every placeholder** (§101)
2. **GitHub profile README and three pinned repos** (§89, §90) — the surface that
   is actually reviewed first
3. **Repository READMEs** (§91)
4. **Model cards** (§94) — the highest-signal ML artefact, and rare
5. **Failure post-mortem** (§98) and **evaluation methodology** (§95)
6. **Benchmarks** (§96) and **reproducibility** (§97)
7. **Metrics dashboard** (§99)
8. **RAG demo** (§100) — only with rate limiting in place

---

## 104. Standing constraints

- **Never publish a benchmark figure that was not measured**, and date every one
  that was.
- **Never fabricate** a rating, badge, testimonial, client, metric or credential.
- **Never autoplay unmuted audio or video.**
- **Never overstate a demo** — every scope note separates real from modelled.
- **Never expose an unmetered inference endpoint** from a public page.
- **Never remove existing working features** to make room for new ones.
- **A placeholder left in a deployed build is a defect**, not a to-do.
