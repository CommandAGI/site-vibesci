# VibeSci redesign: notes

## Generated media (fal)

Model: `fal-ai/kling-video/v2.5-turbo/pro/text-to-video`, 5 s, 16:9, `cfg_scale 0.5`, through `redesign/media.mjs`
(the key from the `.env` cascade, `SVC__FAL__MAIN__API_KEY`, sent only to fal, never printed or written). One call per
clip, no retries. Every prompt ends with the shared look:

> high-key macro photography, bright white seamless background, crisp focus, strong graphic shapes, slow motion,
> locked-off camera, no text, no labels, no logos, no people, no faces

Negative prompt: `text, watermark, logo, faces, people, hands, blur, distortion, cartoon`.

| clip | prompt | used in |
|---|---|---|
| drop | Extreme macro of a single drop of dark ink falling from a clear plastic pipette tip into one round well of a clear 96-well microplate, the drop hits the liquid surface and a ring of ripples spreads, slow motion | the cover, the OG image |
| bloom | Overhead macro of dark ink blooming and curling into clear water inside a small round well, slow plumes and tendrils that never fully mix, slow motion | slide 2 |
| tips | Macro of rows of clear disposable pipette tips standing in a rack, a thin film of liquid clinging inside one tip, a droplet sliding slowly down its inner wall | slide 1 |
| plate | Slow overhead pan across a clear 96-well microplate on a white bench, the wells holding a gradient of dark to pale liquid from left to right, shallow depth of field | the code reel |

Cost: 4 calls × $0.35 (fal's listed price for a 5 s clip of this model) = **$1.40** of the $15 allowed.

The riso print is ours (ffmpeg, `media.mjs --encode`): AV1 CRF 42 + H.264 CRF 30 + a WebP poster; the twelve files are
1.2 MB together, no loop over 200 KB. The raw downloads stay in `redesign/.raw/` (ignored).

## Other generated assets

- `wordmark.svg`, `mark.svg`: outlined from Recursive (CASL 1, wght 900) by `redesign/wordmark.py`; "Vibe" casual,
  "Sci" mono, the pink plate 6 units off register.
- `og.png` (1200 × 630) and `touch-icon.png` (180 px): `redesign/og.py`, from the font, the wordmark and the drop poster.

## Checks

- `python3 tests/pages.py [url]`: in Chromium, for en, es, zh: the plate's verdict rings the 7 failing wells, the
  rewrite passes with no ring, the step buttons move the frame, the language picker opens, the lab fails the sample
  and the rewrite passes all 16 wells, the lab opens at its title, nothing is wider than 320 px, no script error.
- `node --test tests/sim.test.mjs`: the bench model.
- `python3 redesign/shots.py [url]`: the screenshots at 1440, 768, 390, 320 and reduced motion, into `redesign/.shots/`.

## Iterations seen in the screenshots

- The lab page opened 183 px down, its title under the header: the step log's `scrollIntoView` scrolled the page.
  It now scrolls only the log; `tests/pages.py` checks the lab opens at the top.
