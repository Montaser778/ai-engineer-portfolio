# Addendum Prompt — Polish, Audio & Advanced Layer (v5)

> **This is additive. Do not replace, rewrite or remove anything that already
> exists.** Every existing page, script, style, demo and piece of copy stays
> exactly as it is. Everything below is added on top.
>
> Apply on top of `PROJECT_PROMPT.md` (v4). Where a rule here conflicts with an
> earlier one, this document wins — but conflicts should be rare by design.

---

## Global additive rules

1. **New files only, plus appends.** Add new `assets/js/*.js` modules and append
   new blocks to the end of `assets/css/site.css`. Do not restructure existing
   CSS or rewrite existing functions.
2. **Every new module is an IIFE** that no-ops when its target element is absent,
   so it can load on every page safely.
3. **Every new feature degrades to nothing.** If it fails, is unsupported, or the
   user has opted out, the site must behave exactly as it did before the feature
   existed.
4. **Load order:** all new modules load *after* the existing ones, immediately
   before `</body>`.
5. **Nothing added here may block first paint.**

---

# PART C — VISUAL POLISH LAYER

New module: `assets/js/polish.js`. Appended styles at the end of `site.css`.

## 36. Film grain, vignette and mesh glow

A fixed `pointer-events:none` layer at `z-index:3`, above the WebGL canvas and
below content, containing three stacked elements:

- **Grain** — an inline SVG `feTurbulence` fractal noise data-URI at 5% opacity,
  animated on `steps(6)` over 7s with small translate offsets, sized at `inset:-120%`
  so the motion never exposes an edge.
- **Mesh glow** — three overlapping radial gradients (violet top-left, teal
  bottom-right, violet mid) at 50% opacity, drifting on a 22s alternating ease.
- **Vignette** — a 200px inset box-shadow darkening the frame edges.

This is the single highest-impact visual change: it is what makes a site read as
*designed* rather than merely clean.

## 37. Curtain page transitions

Five vertical panels covering the viewport at `z-index:150`. They scale up from
the top on load (staggered 50ms apart, `cubic-bezier(.76,0,.24,1)`, 580ms) and
scale down from the bottom on navigation (420ms).

Intercept clicks on same-origin `<a>` elements only. **Never intercept**
`#` anchors, `mailto:`, `tel:`, `target="_blank"`, `download`, or external hosts.
Navigate after 520ms. Handle `pageshow` with `event.persisted` so a back
navigation restored from bfcache does not leave the curtain stuck closed.

Removed entirely under `prefers-reduced-motion`.

## 38. Text scramble reveal

Section labels marked `data-scramble` decode from random glyphs into their final
text when they enter the viewport at 0.6 threshold. Per-character start offsets
of 1.6 frames create a left-to-right cascade; scrambling glyphs render in violet
at 85% opacity. Cache the original string in a data attribute so re-runs are
idempotent. Skipped under reduced motion.

## 39. Scroll-velocity skew

Sections marked `data-skew` skew on Y proportional to scroll velocity (clamped to
±42px/frame, multiplied by 0.06deg) with a tiny compensating `scaleY`, damped at
0.1 and decaying at 0.86 per frame. Bail out of the write when the value is under
0.05 so idle scrolling costs nothing. This is the Awwwards-signature motion,
achieved without GSAP.

## 40. Cursor spotlight in cards

Each `.card`, `.demo` and `.gh-card` gets an `::after` radial gradient positioned
by `--mx` / `--my` custom properties, updated from a single delegated
`pointermove` listener on the parent grid rather than one listener per card.
Fades in on hover only. Pointer-fine only.

## 41. Structural details

- **Section numbers** — `00`, `01`, `02` in mono at 40% opacity, absolutely
  positioned above each section's right edge, injected by script so no markup
  changes. Hidden below 860px.
- **Back to top** — a circular button appearing after one viewport of scroll.
- **Shortcut overlay** — `?` opens a dialog listing every keyboard shortcut.
- **Copy buttons** on every code block, with a green confirmation state.
- **Console signature** — a styled three-line `console.log`: name and role,
  the stack line ("vanilla JS · Three.js r128 · zero build step"), and an
  invitation to get in touch. Engineers open the console; meet them there.
- **Selection colour** violet at 35%, **custom scrollbar** with a violet hover
  thumb, and `scrollbar-color` for Firefox.
- **Error boundary** — a capturing `error` listener that hides any canvas that
  fails and adds `.no-webgl` to the body, so a broken 3D layer never leaves a
  dead black rectangle.

---

# PART D — AUDIO (done correctly)

## 42. Read this before implementing any audio

Three hard facts that determine the entire design:

1. **Autoplay with sound is blocked.** Chrome and Safari block programmatic
   playback of unmuted audio in any tab the user has not yet interacted with.
   An autoplaying soundtrack simply will not play for a first-time visitor — the
   feature you are asked to build does not function as imagined.
2. **It is an accessibility failure.** Audio playing longer than three seconds
   without a stop mechanism is a documented WCAG 1.4.2 failure. Speech over
   background music additionally conflicts with the low-background-audio
   criterion. A site that fails these is disqualified from procurement at many
   large companies outright.
3. **It costs contracts.** A hiring manager opening the site in an open-plan
   office or a shared meeting is startled into closing the tab. That is the
   entire evaluation, over, before a word is read.

**Therefore: never autoplay unmuted audio. Not once, not briefly, not on a
second visit.**

## 43. What to build instead — the Guided Audio Tour

This is strictly better for his positioning: he sells voice AI, so the site
should let a visitor *hear his voice stack working*, on demand, in their control.

New module: `assets/js/audio.js`. New assets under `assets/audio/`.

### 43a. The invitation

On first scroll past the hero, a small, dismissible panel slides in from the
bottom-left — **never a modal, never blocking**:

> 🔊 **Take the audio tour** — I built the narration with the same voice stack I
> ship. 90 seconds. *Start · Not now*

- Dismissing it sets a session flag so it never returns in that session.
- If `prefers-reduced-motion` is set, the panel appears without motion.
- It never appears on `resume.html` or `contact.html` — a visitor there is
  already converting, so do not interrupt.

### 43b. The tour itself

Six narration segments, one per major section, each 12–18 seconds. Written in
first person, plain and unhurried — **not an advertisement**:

| Segment | Trigger | Content |
|---|---|---|
| 01 | Hero | Who he is, what he builds, and that this narration was generated by the stack he ships |
| 02 | Capabilities | The three things he goes deep on |
| 03 | Muhawir | The problem, and the latency constraint that shaped everything |
| 04 | Demos | An invitation to run the voice demo with their own microphone |
| 05 | How he works | Delivery and communication standards |
| 06 | Contact | What a good first message contains |

Segments trigger on the corresponding section entering the viewport at 0.5
threshold, but **only after the user has started the tour**, and only once each.
If the user scrolls past three sections quickly, queue and skip rather than
overlap — never play two segments at once.

### 43c. Production of the audio files

Generate with **Cartesia Sonic** — the same TTS in his production stack — from
scripts he writes himself. Produce both an **English** and an **Arabic** set,
selected by the site's current language (§15).

- Export as `.webm` (Opus, ~48kbps mono) with an `.mp3` fallback source.
- Normalise all segments to −16 LUFS so no segment is louder than another.
- Total payload across all twelve files must stay under 900KB.
- Lazy-load: fetch a segment only when the tour is running and that section is
  approaching. Never preload audio for a visitor who has not opted in.

### 43d. Ambient background bed — optional, and quiet

If a music bed is used at all:

- **Ducked to −22dB under narration**, brought to −18dB between segments.
  It must never compete with the voice.
- Style: sparse ambient / dark-synth texture with no melody, no percussion, no
  vocal. A melody demands attention; a texture does not.
- **Royalty-free with a documented licence.** Credit the source in `humans.txt`.
  Never use a track whose licence has not been verified — a copyright claim on a
  portfolio is a professional catastrophe.
- Loop seamlessly with a 2s crossfade using two Web Audio buffer sources.
- **Ships muted and off by default**, controlled independently from narration.

### 43e. The persistent audio control

Once the tour starts, a compact control docks to the bottom-left for the rest of
the session, and must remain visible and reachable at all times:

- Play / pause · a segment-progress bar · mute · a volume slider · a close button
- Fully keyboard operable: tab to it, Space to play/pause, arrows for volume
- `aria-label` on every control; state changes announced via `aria-live="polite"`
- Persists across pages within the session
- Automatically pauses on `visibilitychange` when the tab is hidden
- Automatically pauses if the visitor starts the **voice demo** — never let the
  tour talk over their microphone test

### 43f. Captions and transcript — required, not optional

- Each segment ships with a **`.vtt` caption file**, rendered as live captions in
  the control while the segment plays.
- A **full transcript** lives at `tour.html`, linked from the control and from
  the footer, readable with no audio at all.
- This is what makes the feature legitimate rather than a liability: the content
  is available to a deaf visitor, a visitor on mute, and a search crawler.

### 43g. Interaction sounds — **Optional, off by default**

Tiny UI sounds (a 40ms click on palette open, a soft tick on filter change)
synthesised with the Web Audio API rather than loaded as files. Gated behind the
same mute control, **default off**, and never triggered on page load.

---

# PART E — FURTHER PROFESSIONAL ADDITIONS

## 44. Case study metrics band

Above each case study's prose, a four-cell band of hard numbers with animated
counters: turn latency, languages, scoring dimensions, deployment platforms.
Numbers scan in two seconds; prose takes two minutes. Give the scanner something.

## 45. "How I'd approach your problem" interactive

On `services.html`, a three-question flow — *what are you building · where is it
stuck · what is your timeline* — that assembles a tailored first-response
paragraph plus a recommended engagement tier, then pre-fills the contact form
with those answers via query string. A prospect who has watched the site reason
about their problem arrives at the form already half-committed.

## 46. Comparison table — "why an independent engineer"

An honest three-column table: **agency · in-house hire · independent specialist**,
compared on speed to start, cost, domain depth, and continuity risk. **Include
the column where he loses** (continuity: an agency has bench depth, he does not)
and state his mitigation. A comparison that admits a weakness is believed; one
that does not, is not.

## 47. Process transparency page — `process.html`

What week one actually looks like, what he needs from the client, what a weekly
update contains (with a real example), how scope changes are handled, and what
happens if the project stalls. Every clause a client is nervous about, answered
before they have to ask.

## 48. Live status strip

A thin strip on the home page showing current capacity, next available start
date, current focus, and the timezone converter from §22. Update it manually via
one JSON file so it never goes stale. Nothing kills a lead faster than a contact
form with no sense of whether he is even available.

## 49. Downloadable one-pager — `capabilities.pdf`

A print-stylesheet-generated single page a prospect can forward internally to a
decision-maker who will never visit the site: positioning, three capabilities,
one case study summary, engagement tiers, contact. Generated from
`capabilities.html` via `window.print()`, so it can never fall out of sync.

## 50. Micro-interaction pass

- Buttons: 120ms scale-down on `:active` — physical feedback
- Inputs: label lifts and colours on focus
- Cards: staggered 45ms entrance on filter change
- Links: an underline that draws left-to-right on hover (`background-size`
  transition, not `border-bottom`)
- Success states: a checkmark that draws its own SVG path
- Loading: skeleton shapes, never spinners
- Empty states: every list that can be empty gets a written empty state, not a
  blank box

## 51. Content depth pass

- **Reading time** on every note and case study
- **"Last updated"** dates — a stale-looking site reads as an abandoned one
- **Related content** at the end of every note and case study
- **A written 404** that recommends actual pages rather than apologising
- **Footer sitemap** with all pages grouped by purpose

## 52. Performance additions

- `content-visibility: auto` with `contain-intrinsic-size` on below-fold sections
- `fetchpriority="high"` on the hero's critical resources
- Preload the two most-used font files as `woff2` with `crossorigin`
- Self-host fonts if Lighthouse flags render-blocking — removes a third-party
  round trip and a privacy dependency
- Ship a `<noscript>` block with core contact details on every page

## 53. Updated acceptance criteria

Everything from §13 and §34, plus:

- [ ] **No audio ever plays without an explicit user gesture** — verified in a
      fresh incognito profile with no prior site engagement
- [ ] The audio control is reachable and fully operable by keyboard alone
- [ ] Captions display for every segment; the full transcript page is reachable
- [ ] Muting persists for the session and survives navigation
- [ ] The tour pauses automatically when the voice demo starts and when the tab
      is hidden
- [ ] Total audio payload under 900KB, and zero audio bytes fetched for a
      visitor who never starts the tour
- [ ] The music bed licence is documented in `humans.txt`
- [ ] Curtain transitions never trap a back navigation from bfcache
- [ ] Grain, skew, scramble and curtain are all absent under
      `prefers-reduced-motion`
- [ ] Section numbers, spotlight and tilt are absent on touch devices
- [ ] Every polish feature can be removed by deleting one file without breaking
      the site — verify by loading each page with `polish.js` and `audio.js`
      blocked
- [ ] Lighthouse scores unchanged from the pre-polish build: Performance ≥ 90,
      Accessibility 100

---

## 54. Priority

If the whole list cannot be built at once, build in this order:

1. **§36 grain, vignette, mesh glow** — largest visual gain per line of code
2. **§48 live status strip** and **§44 metrics bands** — direct conversion impact
3. **§37 curtain** and **§39 skew** — the motion signature
4. **§43 audio tour**, complete with §43e controls and §43f captions — never ship
   the audio without the controls and transcript; a half-built audio feature is
   worse than none
5. **§45 approach flow** and **§46 comparison table** — sales instruments
6. **§38 scramble**, **§40 spotlight**, **§41 details**, **§50 micro-interactions**
7. **§47 process page**, **§49 one-pager**, **§51 content depth**
8. **§52 performance**, then the full §53 sweep

---

## 55. Standing constraints (repeat of the rules that matter most)

- **Never autoplay unmuted audio.**
- **Never fabricate** a testimonial, client, metric or credential.
- **Never overstate a demo** — every scope note must accurately separate what is
  real from what is modelled.
- **Never remove or rewrite existing working features** to make room for these.
- **Every addition must degrade to nothing** when unsupported or opted out.
