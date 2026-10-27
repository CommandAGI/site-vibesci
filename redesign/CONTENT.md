# VibeSci: the audit (before the 2027 redesign)

What the site was at `8c27f6f` (the site of task vibe-org-vibesci), and what the redesign must keep.

## Routes

| route | what it is | kept |
|---|---|---|
| `index.html`, `es/index.html`, `zh/index.html` | the landing page in English, Spanish, Simplified Chinese | yes, all three, built from one template (`redesign/pages.mjs`) |
| `lab.html`, `es/lab.html`, `zh/lab.html` | the lab: a protocol and a target per well, run in the twin, judged, rewritten | yes, unchanged in behaviour |
| `mailto:hello@vibesci.dev` | the only contact | yes, in the page and the footer |
| the A/文 language picker (`<dialog>`, `commandfor`) | on every page, `<noscript>` links as a fallback | yes |

## Real workflows (they run, in the browser, with nothing sent)

- Run the sample protocol in the twin: 55 steps, 7 wells of 16 out of tolerance, the first at step 7 (A2, +61 %, carryover on a tip that was not ejected).
- "VibeSci, fix it": the rewrite adds the missing tip ejections and one transfer volume, each added line with a comment that says why, and runs again in the same twin until every well passes.
- Write a protocol from a sentence (`a 1:10 dilution of a 1 M stock across A1..A8, blanks in row B`), offline, by rule.
- Step through a run frame by frame (◂ ▸, replay), read the step log and the per-well table.

`app/sim.js` (the bench model) and `app/sample.js` were not changed by the redesign; every number the landing page prints is computed from a run of them at build time, so the copy cannot drift from the twin.

## What is a demo and what is a claim

- Everything on the plate is **simulated in the twin, not verified on a bench**. Both flags sit beside every plate, chart and diagram.
- No customers, logos, user counts, quotes, press or prices. "Prices are set at launch; the demo is free" stays.
- "Next in the notebook" lists three things **planned, not built** (bench photo → deck, PDF reading with a server-held key, 3D twin). Each carries the label.
- The film is generated with fal and printed in two inks; it says so on the first screen and on every film section. It never poses as lab footage or a real result.
- The page sends nothing (`connect-src 'none'`) and calls no model. The footer says the team are AI agents.
- LabTwin's authors allowed use of their code without attribution (owner, 2026-10-26); no page carries their name, text or styling.

## Copy cut

The first site had four text sections ("Four steps, one loop", "What it catches", "Where it is going", "Contact") as paragraphs. The redesign says each as one sentence over a picture: the plate story, four slides (one failure each), the code reel, the open lab, the plans, the address.
