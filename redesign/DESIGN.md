# VibeSci: the design (a printed lab notebook in two riso inks)

*The designer: a science-museum exhibit designer who prints risograph zines on the weekend.* A museum label has one
idea and a thing to look at; a riso zine has two inks, paper you can feel and plates that never quite line up. VibeSci
is a lab notebook printed that way: the protocol is the text, the 96-well plate is the picture, and the twin's verdict
is a rubber stamp.

## Concept

The page is one notebook entry: *Entry 001 — a Tuesday dilution series.* It opens on a full-viewport film of a drop
falling into a well, printed in pink and teal. Scroll, and the plate runs the protocol step by step, fails, gets
stamped **FAILS A2 +61 %**, then runs the rewrite and is stamped **PASSES**. Everything after that is one plate per
idea, like the pages of a zine.

## Type: Recursive only

One variable family, its axes used as voices (nobody else in the set uses Recursive):

- Display: `wght 900`, `CASL 1` (casual, hand-lettered), misregistered: a pink copy 0.045 em off (`--off`).
- Body: `wght 400–500`, `CASL 0.3`, `text-wrap: pretty`; headings `balance`.
- The machine's voice (protocol lines, step log, labels, flags): `MONO 1`, `CASL 0`, upper-case labels at `--step--1`.
- Scale: fluid, ratio about 1.25 at 390 px and 1.6 at 1440 px (`--step--1` … `--step-4`, `clamp()`); tabular numerals in the log and the tables.
- Self-hosted subset `fonts/recursive.woff2` (123 KB) with a metric-matched fallback face (`Recursive Fallback`).

## Colour (two inks on warm paper, plus the liquid)

| token | value | use | contrast on paper |
|---|---|---|---|
| `--paper` | #f6efe1, oklch(95.4% 0.021 84) | the sheet, 24 px graph ruling in 9 % teal | — |
| `--teal-deep` | #0b4f51 | body text, rules, controls | 8.9 : 1 |
| `--teal` | #0a7f80 (P3 0.12 0.49 0.5) | the teal plate | 4.6 : 1 (large type and fills) |
| `--pink` | #ff48b0 (P3 1 0.26 0.69) | riso fluorescent pink: plates, offsets, fills; never small text | — |
| `--pink-deep` | #b8126a | pink that reads as text (verdicts, warnings) | 5.6 : 1 |
| `--mint` | #a4efd6 | the liquid, and only the liquid (and the "now" step) | — |

Mixed with `color-mix(in oklch, …)`; sRGB fallbacks first, P3 inside `@supports`.

## Shape language

Hard, square, printed. No radius except the notebook's index tabs (the nav), which are cut like real divider tabs.
Buttons are ink blocks with a pink plate 4 px off register (`--plate-off`) instead of a shadow; secondary links are a
pencil underline. Flags are rubber-stamp boxes: solid teal for *Simulated in the twin*, dashed pink for *Not verified
on a bench*. No cards, no blur, no gradient.

## Layout

- **1440 / 2560**: the cover is the film edge to edge with the sheet of type on the left third; the plate sticks on
  the left at 55 % while the verdict and the protocol scroll on the right; slides alternate picture and text. Content
  is capped at 1400 px; the film is not.
- **768**: the plate goes above the verdict, the protocol listing below it; slides stack, picture first.
- **390**: the nav becomes four numbered tabs (only the current one keeps its words); the film note wraps above the
  title; the plate is full-width (wells about 22 px, labels still legible); buttons stack.
- **320**: the same as 390 with the plate at 12 × 8 still whole (no sideways scroll, a test checks it) and the display
  size at its floor (2.7 rem).

## Motion

The motion explains one thing: what the protocol does to the plate, in order.

- **The plate story** (`app/story.js`): the scroll position picks a frame of the real run (55 steps, then the judge,
  then the rewrite). Liquid fills in mint and pink, the tip moves, the failing wells get a dashed ring, the stamp
  lands. ◂ ▸ step one frame; "Jump to the verdict" / "Jump to the rewrite" go straight there; an `aria-live` line says
  the state. A reader can skip past the whole track.
- **Films**: muted, looped, poster first, `preload="metadata"` on the cover and `none` below it, played only while in
  view. One "Pause the films" button stops them all.
- **Registration** (CSS `animation-timeline: view()`): each slide's number and picture come in off register and
  settle into it as they enter. Misregistration never jitters.
- **Reduced motion**: no film plays (the riso poster frame is shown), the scroll-driven registration is off, and the
  plate story still swaps whole frames (each a still, no tween), by scroll or by the buttons. Nothing flashes.

## Media plan (fal, then ffmpeg)

Four 5 s text-to-video clips (`fal-ai/kling-video/v2.5-turbo/pro/text-to-video`), shot high-key on white on purpose,
then printed by `redesign/media.mjs` into two plates (teal shadows on a hard curve, pink mid-tones, teal 5 px off
register, grain, warm paper) and encoded AV1 + H.264 + a WebP poster, each under 200 KB. `drop` is the cover,
`bloom`/`tips` sit behind slides, `plate` behind the code reel. Prompts and cost in `NOTES.md`.

## The signature moment

The stamp. The plate runs, rings seven wells, and **FAILS A2 +61 %** lands askew in pink; keep scrolling and the
rewrite's **PASSES** lands where it was. That is the product in one gesture: run, see the discrepancy, see the
corrected protocol.

## Sections

1. Cover — the film, "Run the protocol *before* the reagents.", run / watch.
2. The bench — the plate story (simulated, not verified).
3. What the twin catches — four slides, one failure each, with its own diagram drawn from the run.
4. The reel — "Every line it adds says why." over the plate film, one added line with its reason.
5. The lab is open — one link, and the notice that a model of a bench does not replace validation.
6. Next in the notebook — three things, each labelled *planned, not built*.
7. Write to us — the address, set large.

## Don'ts

No rounded cards, no soft shadows, no gradient, no icons, no stock people, no third ink. Pink never carries small
text. Nothing generated is shown as lab footage or a result. No claim the twin has not computed.

## Self-scores (from the screenshots in `redesign/.shots/`, 2026-10-27)

| art direction | brand specificity | product expression | interaction | technical quality | craft | mean |
|---|---|---|---|---|---|---|
| 8 | 9 | 9 | 8 | 8 | 8 | 8.3 |
