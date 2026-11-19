# ClearNote Clinical Design Principles & System Standards

> **Aesthetic Point of View: "Quiet Confidence"**  
> ClearNote is an AI clinical workflow platform designed to serve attending physicians and clinical staff under heavy cognitive load, rapid operational tempo, and acute emotional pressure. The design takes visual and functional inspiration from tools known for precision, restraint, and speed (Linear, Vercel, Stripe, Notion). The UI recedes; the patient's record, verified audio, and pharmacological safety signals remain the absolute focus.

---

## 1. Aesthetic Point of View

### Three Core Adjectives
1. **Precise**: Crisp 1px boundaries, exact tabular data alignment, zero ambiguity in clinical units, dosages, or provenance badges.
2. **Restful**: A cool slate neutral scale paired with a clinical teal accent that eliminates glare, harsh chromatic aberration, and visual fatigue across 10-hour hospital shifts.
3. **Unobtrusive**: Interface chrome steps back. Peripheral controls fade; active clinical notes, audio waveforms, and drug contraindications are front and center.

### What ClearNote is NOT
* **NOT a flashy consumer AI gadget**: No purple/pink gradient backgrounds, no gradient text, no neon glows, no glassmorphism gloss on working views, and no sparkle or magic-wand icons as lazy symbols for "AI".
* **NOT an alarm-fatiguing wall of alerts**: Warnings are strictly graded (Critical Crimson, Warning Amber, Info Slate). Red is reserved strictly for genuine life-threatening contraindications and irreversible deletions.
* **NOT a marketing template**: No generic hero with three identical rounded cards, no stock photos, no lorem ipsum or "John Doe" filler, no playful emojis as bullets, and no scroll-jacking or parallax effects.
* **NOT a slow or cluttered interface**: Every decision answers: *"Which task does this serve for the clinician?"* If it doesn't serve a specific clinical workflow, it is deleted.

---

## 2. Hard Anti-"AI Slop" Rules (Do / Don't Matrix)

| Category | Forbidden ("AI Slop") | ClearNote Clinical Standard |
| :--- | :--- | :--- |
| **Color & Theme** | Purple/pink/blue gradient text or backgrounds; neon glow accents; rainbow badges; mixed warm and cool grays. | One cool slate neutral scale (`Slate-50` to `Slate-950`) + ONE primary clinical teal accent (`#0D9488` light / `#14B8A6` dark). Status colors reserved for clinical meaning. |
| **Typography** | Generic system fonts without fallback; center-aligned walls of clinical text; all-caps labels; bold applied uniformly. | High-quality self-hosted `Geist Sans` for UI hierarchy + `Geist Mono` for dosages, ICD-10 codes, and millisecond timestamps. Strict scale: Body $\ge 14\text{px}$, Note prose $16\text{px}$, tabular figures. |
| **Component Shape** | Over-rounded bubble cards (`rounded-[2rem]` / 32px); heavy muddy drop shadows (`shadow-2xl`); borders + shadows + gradients stacked on one card. | Crisp-Subtle radius personality (4px tags, 6px buttons/inputs, 8px cards/tables, 12px modals). Flat surfaces bounded by 1px subtle borders (`border-slate-200` / `border-slate-800`). Max 2 elevation levels. |
| **AI Markers** | Sparkle icons (`✨`); magic wands; unverified inline AI text; opaque AI claims. | Explicit `[AI Draft]` versus `[Clinician Verified]` badges. Grounding guideline citations (`WHO Model Formulary`, `UpToDate`) with retrieval confidence scores. Mandatory doctor sign-off before prescription generation. |
| **Copy & Tone** | Vague microcopy ("Oops! Something went wrong"); exclamation marks; cutesy greetings; marketing buzzwords. | Factual, actionable clinical microcopy stating: (1) what happened, (2) the medical implication, and (3) the exact next step. |
| **Forms & Dialogs** | Nested modals; tooltips hiding critical information; placeholder-as-label; unvalidated inputs that lose state. | Inline validation on blur and submit; persistent input state; high-contrast labels; non-blocking inline banners for warnings; accessible modals with keyboard focus traps. |

---

## 3. Clinical AI Trust & Governance Standards

1. **Explicit Provenance**:
   - Every AI-extracted field begins in `[AI Draft]` status with a subtle indigo boundary indicator.
   - When a clinician edits or approves the field, it immediately transitions to `[Clinician Verified]` status with a verified green indicator.
2. **Grounding & Provenance Citations**:
   - Drug interaction cards must display the pharmacological mechanism and the specific medical guideline passage or reference source.
   - When RAG guideline retrieval yields zero matches or low similarity, the confidence meter is capped ($\le 0.5$) and annotated as `"(Unverified in local guidelines)"`.
3. **Human-in-the-Loop Sign-Off**:
   - The "Approve & Sign Off" action remains gated until all critical contraindications have been reviewed.
   - Prescription PDF generation is hard-blocked until attending physician sign-off is committed to the database.
4. **Calm Streaming State**:
   - Streaming transcript and extraction states use a steady, calm cursor and inform the clinician of active progress (e.g. "Extracting clinical entities..."). No pulsating neon loops or theatrical typing effects.

---

## 4. Motion & Animation Policy

ClearNote enforces strict zoning to ensure animations never distract a clinician during critical documentation or patient review.

### Motion Tokens
* **Instant**: `90ms` — hover states, toggle switches, button presses.
* **Fast**: `160ms` — dropdown menus, tab indicator shifts, small badge transitions.
* **Base**: `240ms` — dialog opens, drawer slide-ins, table row expansions.
* **Slow**: `400ms` — page transitions, complex multi-step modal changes.
* **Easing**: Cubic-bezier standard easing `cubic-bezier(0.16, 1, 0.3, 1)` (outQuart) for natural, crisp deceleration.

### Zone Separation
* **ZONE 1: Marketing, Landing & Auth**
  * Expressive clinical motion permitted (subtle hero text reveals, interactive consultation simulator).
  * One signature interaction per page.
  * Zero liquid background blobs, zero parallax, zero scroll-jacking.
* **ZONE 2: Core Clinical App (Dashboard, Reviewer, Patients, Settings)**
  * **Strictly functional motion only**:
    * 150–240ms eased transitions for dialogs, drawers, and popovers.
    * Active tab indicator slide.
    * Fast skeleton shimmer during initial queries.
    * Calm, steady AI text streaming cursor.
    * No decorative looping animations, no cursor effects, and no bouncing icons.

### Accessibility (`prefers-reduced-motion`)
* When `prefers-reduced-motion: reduce` is detected or toggled by the user:
  * All movement, scale transforms, and translation offsets are disabled.
  * Transitions degrade to instantaneous state changes or simple opacity fades ($\le 120\text{ms}$).
  * Animated counters display the final calculated integer immediately.
