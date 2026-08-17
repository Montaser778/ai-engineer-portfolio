# Addendum Prompt — Scene, Timeline & Social Proof Layer (v10)

> **Additive only. Do not replace, remove or rewrite anything.** Applies on top
> of `PROJECT_PROMPT.md` (v4) and addenda V5, V6, V7, V8 and V9.
>
> Derived from a review of a widely-copied 3D developer portfolio template. The
> selection is deliberate: §144–§149 are adopted, §150 is rejected outright, and
> §151 is the most important section in this document.

---

## 144. What is being adopted, and why

| Adopted | Reason |
|---|---|
| Interior 3D room scene | Lighting tells a story; a floating object does not |
| Company logos beside testimonials | Institutional proof beats a personal name |
| Logo-in-node timeline | Scannable, and the logo carries recognition |
| Section eyebrow badges | Small typographic detail, large perceived polish |
| Contact form beside a 3D scene | Balances a dull form with the site's signature |

Rejected: the generalist skill row (§150) and, critically, fabricated
testimonials (§151).

---

# PART X — THE ROOM SCENE

## 145. Replace nothing — add a second scene mode

The existing `hero3d.js` workstation stays and remains the default. Add an
**interior room scene** as a new mode in the same module, selected by
`<div id="hero3d" data-scene="room">`. Both must work; the workstation is the
fallback if the room fails to build.

## 146. Room construction — all from primitives (Three.js r128)

No external model files. No GLTF loader. Everything from `BoxGeometry`,
`PlaneGeometry`, `CylinderGeometry` and `TorusGeometry`, so the scene costs zero
network bytes beyond the library.

**Structure:**

- **Two walls and a floor** as a corner — back wall and left wall meeting at a
  vertical edge, floor plane beneath. Matte `MeshStandardMaterial`, roughness
  near 0.9, so light falls off convincingly.
- **A window** cut into the back wall: a dark frame of four thin boxes, with a
  plane behind it in deep night blue. Scatter twenty small emissive point sprites
  across it as stars, drifting almost imperceptibly.
- **A curtain** at one side of the window: a `PlaneGeometry` with 12 width
  segments whose vertices are displaced by a sine wave on the X axis, giving
  vertical folds. Deep crimson, emissive at very low intensity so it catches the
  room light.
- **A desk** against the back wall: a top slab, two L-shaped leg assemblies.
- **A monitor** on the desk carrying the existing `CanvasTexture` code screen
  from the current implementation — reuse that code exactly, do not rewrite it.
- **A second smaller monitor** angled beside it, showing a simple animated
  waveform drawn on a second canvas texture.
- **A desk chair**: seat, back, a cylinder column and a five-spoke base of thin
  boxes rotated around the axis. It rotates very slowly, as if just vacated.
- **A radiator** under the window: eight thin vertical boxes in a row.
- **A desk lamp**: a cylinder base, a thin arm, a cone shade, and a point light
  inside it.

**Lighting is the entire effect — get this right before adding detail:**

- Ambient at very low intensity, cool blue — the room is dark.
- A **teal-white area of light from the monitors**, implemented as a rectangular
  point light in front of the screens, intensity pulsing subtly. This is the key
  light and it should be clearly the brightest source.
- A **warm amber point light** inside the lamp shade, distance-limited so it
  pools on the desk rather than filling the room.
- A **cold blue rim** from the window direction, low intensity, defining the
  silhouette of the desk and chair against the wall.
- A violet accent light low behind the desk, barely visible, tying the scene to
  the brand palette.

The target look: a dark room lit almost entirely by screens, with one warm pool
of lamplight and cold night through the window. Contrast between the cold screen
light and the warm lamp is what makes it feel photographic rather than rendered.

## 147. Room scene motion

- Very slow camera orbit within a narrow arc (about 12°), driven by the existing
  scroll timeline in `hero3d.js` — reuse the keyframe system, do not build a
  second one.
- Pointer parallax layered on top, damped as it already is.
- Dust motes: 60 tiny points drifting upward slowly in the lamp light cone only,
  additive blended, nearly transparent. This single detail does more for realism
  than any extra geometry.
- The chair rotates at roughly 2° per second.
- The screen textures continue their existing animation.

## 148. Room scene performance rules

The room is far heavier than the workstation. It must not degrade the page:

- Merge static geometry where possible; the walls, floor and radiator never move
  and can share one material instance.
- Cap the second WebGL context at pixel ratio 1.5 on desktop and 1 on mobile.
- **Below 760px, do not build the room at all** — fall back to the workstation,
  which is lighter, or to a static gradient panel.
- Under `prefers-reduced-motion`, build the scene but freeze all animation except
  the screen texture.
- Under `prefers-reduced-data`, skip the scene entirely.
- If the frame budget is exceeded for 60 consecutive frames, drop the dust motes
  first, then the lamp shadow, then reduce pixel ratio — degrade in stages rather
  than all at once.

## 149. Contact page scene

Apply the same room, viewed from a different camera angle, beside the contact
form — the form on one side, the scene on the other, as a two-column layout
collapsing below 900px. A dull form beside the site's signature scene is a
better page than a form alone. Reuse the same module with a `data-view="contact"`
attribute selecting the alternate camera position.

---

# PART Y — TIMELINE AND SECTION DETAIL

## 150. Do not add a generalist skill row

The reference site displays a row of large technology logos labelled "React
Developer · Python Developer · Backend Developer · Project Manager".

**Do not replicate this.** It is actively harmful to this positioning:

- It signals generalism. This site's entire advantage is that he is a
  *specialist* in real-time voice and production LLM systems. A row implying he
  is equally a project manager dilutes that to nothing.
- Displaying a Python logo communicates no information. Every candidate for this
  work knows Python; a logo says only "I have heard of this".
- Large technology logos are the visual signature of junior portfolios, and a
  senior reviewer reads them that way instantly.

The existing capability cards — real-time voice AI, multi-agent systems,
production ML delivery — are strictly better, because each states a *problem he
solves* rather than a tool he has touched. Keep them.

**If a stack display is wanted**, keep it as the existing small tag row on
`about.html`, where it functions as a keyword list for scanners rather than a
claim of identity.

## 151. Logo-in-node timeline

Upgrade the existing experience timeline on `about.html`:

- Each entry's marker becomes a circular node containing the organisation's logo
  or, absent one, a monogram on a brand-coloured disc.
- The connecting line runs through the node centres, brightening on the segment
  the reader has scrolled past.
- Entry content sits to one side; on mobile everything stacks with the node
  inline above the title.
- Each entry keeps its dated range and its **quantified achievements**, not
  responsibilities — this content requirement outranks the visual upgrade.

## 152. Section eyebrow badges

Above each `h2`, a small pill containing an icon and two or three words, centred
or left-aligned to match the section. Examples: "Selected work", "How I work",
"Measured, not claimed". Implemented as a styled `<span>` with a border, 11px
mono, muted colour, with the icon as an inline SVG.

Small change, disproportionate effect on perceived finish. Apply to every major
section across the site.

## 153. Icon system

Define a single inline SVG sprite of twelve line icons at 1.5px stroke,
`currentColor`, 24×24 viewBox, referenced by `<use>`. No icon font, no library.
Used in the eyebrow badges, the risk-reversal row, the process steps and the
footer. **One consistent stroke weight across every icon** — mixing weights is
the most common tell of an assembled rather than designed interface.

---

# PART Z — SOCIAL PROOF: THE RULE THAT MATTERS MOST

## 154. The trap in the reference site

The reference site displays six five-star testimonials from **Esther Howard, Guy
Hawkins, Floyd Miles, Wade Warren, Albert Flores and Marvin McKinney** — every
one of them a placeholder name from a well-known design system's sample data,
paired with stock portraits and generic praise.

It is a tutorial template. Those testimonials are demonstration content, not
endorsements.

**Copying that pattern with invented names would be catastrophic here**, for
reasons that are practical rather than moral alone:

- Those specific names are widely recognised as placeholder data. A reviewer who
  has ever opened a design file will recognise them on sight.
- A single search on any invented name ends the evaluation, and every genuine
  claim on the site becomes suspect by association.
- In many jurisdictions, fabricated endorsements are unlawful commercial
  practice — a real liability when invoicing internationally.

## 155. Build the structure, ship it empty

Build the testimonial section completely — card grid, star rating, quote, avatar,
name, role, **company logo**, and the carousel behaviour — driven entirely from
`assets/data/testimonials.json`.

Ship that file as an **empty array**. The section must:

- Render nothing at all when the array is empty — not a placeholder, not a
  skeleton, not a "coming soon". The section simply does not exist in the DOM.
- Populate automatically the moment a real entry is added.
- Require every field: quote, name, role, company, and a **verifiable link** to
  the reviewer's platform profile or the public review it came from.

## 156. How to obtain real testimonials

Because the section stays empty until they exist, this matters:

- Ask at the moment of delivery, when satisfaction peaks — not months later.
- Ask for something specific: "would you write two sentences on the latency
  problem and what changed?" rather than "would you write a testimonial?"
- Offer to draft it for their approval and editing; most people are willing but
  time-poor.
- **Always request permission to use their name, role and company logo in
  writing**, and store that permission.
- A verifiable platform review (Upwork, Toptal, LinkedIn recommendation) is worth
  more than a quote on his own site, because the visitor can check it. Prefer
  those, and link to them.

## 157. Until then — proof without testimonials

The site already carries proof that does not depend on anyone's word:

- Live demos the visitor operates themselves
- Public repositories with real commit history
- Case studies with measured numbers and dated benchmarks
- Engineering notes demonstrating judgement
- A published failure post-mortem

**This is stronger than six anonymous five-star quotes**, and it is entirely
his own. An empty testimonial section costs nothing; a fabricated one costs
everything.

---

## 158. Updated acceptance criteria

Everything from §13, §34, §53, §85, §117 and §141, plus:

- [ ] The room scene builds and runs at both scene modes without errors
- [ ] The workstation scene still works, unchanged, as the fallback
- [ ] The room is not built below 760px, and the fallback renders instead
- [ ] Reduced-motion freezes the room; reduced-data skips it
- [ ] Degradation happens in stages — motes, then shadow, then pixel ratio
- [ ] The contact page renders the alternate camera view without a second module
- [ ] Timeline nodes render logos or monograms, and the line brightens on scroll
- [ ] Every icon on the site shares one stroke weight
- [ ] **`testimonials.json` ships as an empty array and the section is absent
      from the DOM** — verified by inspecting the deployed page
- [ ] No placeholder name, stock portrait or generic quote appears anywhere
- [ ] No generalist skill-logo row exists (§150)

---

## 159. Priority

1. **§152 eyebrow badges** and **§153 icon system** — an afternoon, visible everywhere
2. **§151 timeline upgrade** — contained, and improves the most-read page
3. **§146–147 room scene** — the largest visual gain, and the largest effort
4. **§148 performance guards** — build these *with* the scene, never after
5. **§149 contact scene** — reuses everything already built
6. **§155 testimonial structure** — build it, ship it empty, populate later

---

## 160. Standing constraints

- **Never fabricate a testimonial, name, logo, rating or endorsement.** The
  section renders only from real, attributed, permission-granted entries.
- **Never display a placeholder name** — Esther Howard, Guy Hawkins, Floyd Miles
  and every other sample-data name are permanently forbidden.
- **Never claim generalist breadth** at the expense of the specialist positioning.
- **Never let a second WebGL context degrade the page** — guards ship with the
  scene, not afterwards.
- **Never publish an unmeasured benchmark**, and date every measured one.
- **Never autoplay unmuted audio or video.**
- **A placeholder left in a deployed build is a defect.**
