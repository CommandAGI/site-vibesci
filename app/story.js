/**
 * Plate 01 on the home page: the sample protocol run on the twin, scrubbed by the scroll. Every frame is a record of a
 * real run of sim.js (the same model the lab runs): the sample's steps, the judgement against its target, the rewrite
 * repairProtocol writes, and that rewrite's own run. Nothing here is drawn from a script of what should happen.
 *
 * The scroll is only one way through: the step buttons move the same frames (and the scroll with them), and the
 * caption is a polite live region. Reduced motion keeps the frames and drops the transitions (the stylesheet's rule).
 */
import { readProtocol, readTargets, runProtocol, judge, diagnose, repairProtocol, formatMolarity } from './sim.js';
import { SAMPLE_PROTOCOL, SAMPLE_TARGETS } from './sample.js';
import { STORY, T, warningText } from './i18n.js';
import { wellInk, wetness, wellCentre } from './plate.js';

const $ = (sel, root = document) => root.querySelector(sel);
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const percent = d => `${d >= 0 ? '+' : ''}${Math.round(d * 100)}%`;

/** The frames of the story, from two runs of the twin. */
export function frames(protocolText = SAMPLE_PROTOCOL, targetText = SAMPLE_TARGETS) {
    const protocol = readProtocol(protocolText);
    const { targets } = readTargets(targetText);
    const run = runProtocol(protocol);
    const judged = judge(targets, run.wells);
    const failing = judged.filter(j => !j.passes);
    const d = diagnose(run.records, run.warnings, judged, protocol.steps);
    const repair = repairProtocol(protocolText, targets);
    const fixedRun = runProtocol(readProtocol(repair.text));
    const fixedJudged = judge(targets, fixedRun.wells);
    const wet = wetness(run.records), fixedWet = wetness(fixedRun.records);
    const first = failing.find(j => j.well === d?.well) ?? failing[0];
    const out = [];
    run.records.forEach((r, i) => out.push({ phase: 'run', i, n: run.records.length, record: r, state: r.state, wet: wet[i], line: r.line, text: 'sample', warning: d && r.index >= d.record.index && r.index < d.record.index + 16 ? d.warning : null }));
    const finalState = run.records.at(-1).state, fixedFinal = fixedRun.records.at(-1).state;
    for (let k = 0; k < 14; k++) out.push({ phase: 'judge', state: finalState, wet: wet.at(-1), failing: new Set(failing.map(j => j.well)), first, cause: d?.cause, count: failing.length, step: d ? d.record.index + 1 : null, text: 'sample', line: d?.record.line });
    fixedRun.records.forEach((r, i) => out.push({ phase: 'fix', i, n: fixedRun.records.length, record: r, state: r.state, wet: fixedWet[i], line: r.line, text: 'fixed', changes: repair.changes.length }));
    const passes = fixedJudged.every(j => j.passes);
    for (let k = 0; k < 12; k++) out.push({ phase: passes ? 'pass' : 'judge', state: fixedFinal, wet: fixedWet.at(-1), failing: new Set(fixedJudged.filter(j => !j.passes).map(j => j.well)), text: 'fixed', count: fixedJudged.length });
    return { frames: out, sampleText: protocolText, fixedText: repair.text, failing, first, diagnosis: d, repair, passes };
}

/** Which lines of the rewrite are new: the lines outside the longest common run of lines with the sample. */
export function addedLines(before, after) {
    const a = before.split('\n'), b = after.split('\n');
    const L = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const added = new Set();
    let i = 0, j = 0;
    while (j < b.length) {
        if (i < a.length && a[i] === b[j]) { i++; j++; } else if (i < a.length && L[i + 1][j] >= L[i][j + 1]) i++; else { added.add(j + 1); j++; }
    }
    return added;
}

/** The caption of a frame, in the page's language. */
export function caption(f) {
    if (f.phase === 'run') {
        if (f.warning) return fill(STORY.warned, { step: f.warning.index + 1, why: warningText(f.warning) });
        return fill(STORY.running, { n: f.n });
    }
    if (f.phase === 'judge' && f.first) {
        return fill(STORY.judged, { count: f.count, well: f.first.well, step: f.step, actual: formatMolarity(f.first.actual), target: formatMolarity(f.first.target), deviation: percent(f.first.deviation), cause: T.cause[f.cause] ?? f.cause ?? '' });
    }
    if (f.phase === 'fix') return fill(STORY.fixing, { changes: f.changes });
    return STORY.passed;
}

function mount(root) {
    const story = frames();
    const svg = $('svg.plate', root);
    const tape = $('.tape', root);
    const cap = $('.caption', root);
    const out = $('output', root);
    const stamp = $('.stamp', root);
    const track = $('.bench__track', root);
    const tip = $('.tip', svg);
    const wells = new Map([...svg.querySelectorAll('circle.fill')].map(c => [c.dataset.well, c]));
    const added = addedLines(story.sampleText, story.fixedText);

    // the tape: the protocol's lines, one list per text, swapped when the story turns to the rewrite
    const tapes = {};
    for (const [key, text] of [['sample', story.sampleText], ['fixed', story.fixedText]]) {
        const inner = document.createElement('div');
        inner.className = 'tape__inner';
        text.split('\n').forEach((line, i) => {
            if (!line.trim()) return;
            const li = document.createElement('li');
            li.dataset.line = String(i + 1);
            if (key === 'fixed' && added.has(i + 1)) li.classList.add('added');
            const ln = document.createElement('span');
            ln.className = 'ln';
            ln.textContent = String(i + 1);
            const code = document.createElement('code');
            code.textContent = line;
            li.append(ln, code);
            inner.append(li);
        });
        tapes[key] = inner;
    }
    tape.replaceChildren(tapes.sample);
    tape.setAttribute('aria-hidden', 'true');

    let current = -1, shownText = 'sample', lastCaption = '';
    // the page writer drew the judged plate for readers without scripts; from here the frames own the rings
    svg.querySelectorAll('.ring').forEach(r => r.remove());
    const rings = new Map();
    function draw(index) {
        index = Math.max(0, Math.min(story.frames.length - 1, index));
        if (index === current) return;
        current = index;
        const f = story.frames[index];
        for (const [name, c] of wells) {
            const isWet = f.wet.has(name);
            c.setAttribute('r', isWet ? '14' : '0');
            c.setAttribute('fill', wellInk(f.state.get(name) ?? 0, isWet));
        }
        // rings round the failing wells, drawn once and shown when the frame judges
        for (const [name, ring] of rings) ring.style.display = f.failing?.has(name) ? '' : 'none';
        for (const name of f.failing ?? []) {
            if (rings.has(name)) continue;
            const { x, y } = wellCentre(name);
            const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            Object.entries({ class: 'ring', cx: x, cy: y, r: 20 }).forEach(([k, v]) => ring.setAttribute(k, v));
            svg.insertBefore(ring, tip);
            rings.set(name, ring);
        }
        // the pipette over the well the step acted on
        const well = f.record?.well;
        if (well && /^[A-H]\d+$/.test(well)) {
            const { x, y } = wellCentre(well);
            tip.setAttribute('opacity', '1');
            tip.style.transform = `translate(${x}px, ${y}px)`;
        } else tip.setAttribute('opacity', '0');
        // the tape follows the line the step came from
        if (f.text !== shownText) { tape.replaceChildren(tapes[f.text]); shownText = f.text; }
        const inner = tapes[f.text];
        let now = null;
        for (const li of inner.children) {
            const ln = Number(li.dataset.line);
            li.classList.toggle('now', ln === f.line);
            li.classList.toggle('done', f.phase === 'pass' || ln < (f.line ?? 0));
            li.classList.toggle('bad', f.phase === 'judge' && ln === f.line);
            if (ln === f.line) now = li;
        }
        if (f.phase === 'pass') now = inner.lastElementChild;
        inner.style.transform = now ? `translateY(${-now.offsetTop - now.offsetHeight / 2}px)` : '';
        // the stamp and the words
        stamp.hidden = !(f.phase === 'judge' || f.phase === 'pass');
        if (!stamp.hidden) {
            const pass = f.phase === 'pass';
            stamp.classList.toggle('pass', pass);
            stamp.firstChild.textContent = pass ? STORY.stampPass : STORY.stampFail;
            stamp.lastChild.textContent = pass ? STORY.stampPassSmall : `${f.first.well} ${percent(f.first.deviation)}`;
        }
        const text = caption(f);
        if (text !== lastCaption) { cap.innerHTML = ''; cap.append(text); lastCaption = text; }
        out.textContent = f.phase === 'run' || f.phase === 'fix'
            ? fill(STORY.counter, { k: f.i + 1, n: f.n, which: f.phase === 'run' ? STORY.sample : STORY.rewrite })
            : (f.phase === 'pass' ? STORY.sameTwin : STORY.judgedShort);
    }

    // the scroll is the playhead: the track's progress picks the frame
    const progress = () => {
        const box = track.getBoundingClientRect();
        const span = box.height - innerHeight;
        return span > 0 ? Math.max(0, Math.min(1, -box.top / span)) : 0;
    };
    const frameAt = p => Math.round(p * (story.frames.length - 1));
    let queued = false;
    addEventListener('scroll', () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; draw(frameAt(progress())); });
    }, { passive: true });

    // the buttons move one step and carry the scroll with them, so the two ways never disagree
    const goTo = index => {
        index = Math.max(0, Math.min(story.frames.length - 1, index));
        const top = track.getBoundingClientRect().top + scrollY;
        const span = track.offsetHeight - innerHeight;
        draw(index);
        scrollTo({ top: top + (index / (story.frames.length - 1)) * span, behavior: 'instant' });
    };
    const phaseStart = phase => story.frames.findIndex(f => f.phase === phase);
    $('[data-step="back"]', root).addEventListener('click', () => goTo(current - 1));
    $('[data-step="next"]', root).addEventListener('click', () => goTo(current + 1));
    $('[data-step="judge"]', root).addEventListener('click', () => goTo(phaseStart('judge')));
    $('[data-step="fix"]', root).addEventListener('click', () => goTo(Math.max(phaseStart('pass'), phaseStart('fix'))));
    root.addEventListener('keydown', e => {
        if (e.target.closest('button') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); goTo(current + (e.key === 'ArrowRight' ? 1 : -1)); }
    });
    draw(frameAt(progress()));
}

/** The films: lazy beyond the first screen, still under reduced motion, and one switch for all of them. */
function films() {
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const videos = [...document.querySelectorAll('video.film')];
    const toggles = [...document.querySelectorAll('[data-films]')];
    let on = !still.matches && localStorage.getItem('vibesci.films') !== 'off';
    const visible = new Set();
    const apply = () => {
        for (const v of videos) {
            if (on && visible.has(v)) {
                if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
                v.play().catch(() => {});
            } else v.pause();
        }
        for (const b of toggles) { b.setAttribute('aria-pressed', String(!on)); b.textContent = on ? STORY.filmPause : STORY.filmPlay; }
    };
    const io = new IntersectionObserver(entries => {
        for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
        apply();
    }, { rootMargin: '200px 0px' });
    videos.forEach(v => io.observe(v));
    toggles.forEach(b => b.addEventListener('click', () => { on = !on; localStorage.setItem('vibesci.films', on ? 'on' : 'off'); apply(); }));
    still.addEventListener('change', () => { on = !still.matches; apply(); });
    apply();
}

if (typeof document !== 'undefined') {
    const bench = document.querySelector('#bench');
    if (bench) mount(bench);
    films();
}
