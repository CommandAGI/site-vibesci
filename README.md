# site-vibesci

The site of VibeSci, a company of CommandAGI (`org-vibesci`): a little chemistry lab you run from a prompt. A static
folder served by CommandAGI's site hosting, mounted in the CommandAGI repository at
`seed/drive/platform/org-vibesci/sites/vibesci`.

- `index.html`, `lab.html`: the site, in English. `es/` and `zh/` are the same two pages in those locales, with
  the A/文 picker in the header of every page linking them as plain static pages.
- `app/sim.js`: the bench model. Wells hold layers, a tip keeps a film of its dead volume, a reservoir never runs out;
  a protocol is read from its text, run, judged against a target per well, and rewritten from what the run found.
  Pure: no DOM, no network, no clock.
- `app/sample.js`: the protocol the demo starts with, the target per well, and the protocol written from a sentence.
- `app/lab.js`: the console. It runs the model, draws the plate on a canvas, and lists the steps, the warnings, the
  table and the rewrite. It reads the page's `lang` and speaks English, Spanish or Simplified Chinese.
- `tests/sim.test.mjs`: the site's own tests (`node --test tests/sim.test.mjs`): the sample fails where its three
  shortcuts are, the rewrite passes in the same twin, and a protocol written from a sentence passes as written.

The page sends nothing: its policy is `connect-src 'none'` and it calls no model. A model that reads a protocol out of
a PDF is a next step, and it needs a server to hold its key.

The idea the site was built against is LabTwin (the Gemini 4 Argon hackathon project, `benjaminxie1/argon-hacks`). Its
authors gave CommandAGI permission to use their code with no attribution (the owner, 2026-10-26, verbal). No page of
this site carries that name, the hackathon's, or any of their text, styling or README: the bench model, the console,
the writing and the tests here are CommandAGI's own.
