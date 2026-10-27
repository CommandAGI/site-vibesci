/**
 * The lab console: the protocol a person writes on the left, the bench on the right.
 *
 * Everything here is the page's: it reads two text areas, runs the protocol through the twin in `sim.js`, and draws the
 * bench, the step log and the table. Nothing is sent anywhere (`connect-src 'none'`), no model is called, and the page
 * works from a file on a disk as well as from the site.
 */
import { readProtocol, readTargets, runProtocol, judge, diagnose, repairProtocol, formatMolarity } from './sim.js';
import { SAMPLE_PROTOCOL, SAMPLE_TARGETS, protocolFromPrompt } from './sample.js';

import { T, t, warningText } from './i18n.js';
import { INK, wellInk } from './plate.js';

const $ = sel => document.querySelector(sel);
const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) node.setAttribute(k, v);
    for (const child of [].concat(children)) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    return node;
};

// ----------------------------------------------------------------------------------------------------------------
// the bench, drawn

const ROWS = 'ABCDEFGH';
const COLS = 12;
const view = { current: null, state: null, index: 0, failing: new Set() };

function drawBench(canvas, { state = null, failing = new Set(), at = null } = {}) {
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 720;
    const height = Math.round(width * 0.5);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const g = canvas.getContext('2d');
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    g.clearRect(0, 0, width, height);

    const cw = Math.min(46, width / 16);
    const ch = cw * 0.42;
    const skew = cw * 0.30;
    const plateW = COLS * cw;
    const originX = (width - (plateW + ROWS.length * skew)) / 2 + 24;
    const originY = height * 0.30;
    const at_ = (col, row) => ({ x: originX + col * cw + row.length * skew, y: originY + row * ch });
    const atRC = (c, r) => ({ x: originX + c * cw + r * skew, y: originY + r * ch });

    // the plate
    const corner = atRC(0, 0);
    g.beginPath();
    g.moveTo(corner.x - 14, corner.y - 10);
    g.lineTo(corner.x + plateW + 6, corner.y - 10);
    g.lineTo(corner.x + plateW + ROWS.length * skew - 6, corner.y + ROWS.length * ch + 6);
    g.lineTo(corner.x + ROWS.length * skew - 16, corner.y + ROWS.length * ch + 10);
    g.closePath();
    // the pink plate first, off register, then the teal frame over it
    g.save(); g.translate(5, 4); g.strokeStyle = INK.pink; g.lineWidth = 3; g.stroke(); g.restore();
    g.fillStyle = INK.paper;
    g.strokeStyle = INK.tealDeep;
    g.lineWidth = 3;
    g.fill();
    g.stroke();

    // a well the protocol has not touched is dry paper; one it has is mint, pinker the more it carries
    const colour = m => (m === undefined ? INK.paper : wellInk(m, true));

    ROWS.split('').forEach((row, r) => {
        for (let c = 0; c < COLS; c++) {
            const name = `${row}${c + 1}`;
            const p = atRC(c, r);
            const x = p.x + cw / 2;
            const y = p.y + ch / 2;
            g.beginPath();
            g.ellipse(x, y, cw * 0.34, ch * 0.34, 0, 0, Math.PI * 2);
            g.fillStyle = colour(state ? state.get(name) : undefined);
            g.fill();
            g.strokeStyle = INK.teal;
            g.lineWidth = 1;
            g.stroke();
            if (failing.has(name)) {
                g.beginPath();
                g.ellipse(x, y, cw * 0.44, ch * 0.46, 0, 0, Math.PI * 2);
                g.strokeStyle = INK.pinkDeep;
                g.lineWidth = 3;
                g.setLineDash([3, 3]);
                g.stroke();
                g.setLineDash([]);
            }
        }
    });

    // letters and numbers, in the plate's own plane
    g.fillStyle = INK.tealDeep;
    g.font = `600 ${Math.round(cw * 0.28)}px Recursive, sans-serif`;
    ROWS.split('').forEach((row, r) => { const p = atRC(0, r); g.fillText(row, p.x - 20, p.y + ch * 0.72); });
    for (let c = 0; c < COLS; c++) { const p = atRC(c, 0); g.fillText(String(c + 1), p.x + cw * 0.36, p.y - 8); }

    // the pipette, over the well the step acted on
    if (at && /^[A-H]\d/.test(at)) {
        const row = at[0], col = Number(at.slice(1)) - 1;
        const p = atRC(col, ROWS.indexOf(row));
        const x = p.x + cw / 2;
        const y = p.y + ch / 2;
        g.strokeStyle = INK.tealDeep;
        g.fillStyle = INK.tealDeep;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x, y - height * 0.16);
        g.lineTo(x, y - ch * 0.9);
        g.stroke();
        g.beginPath();
        g.moveTo(x - 5, y - ch * 1.5);
        g.lineTo(x + 5, y - ch * 1.5);
        g.lineTo(x, y - ch * 0.9);
        g.closePath();
        g.fill();
        g.beginPath();
        g.moveTo(x - cw * 0.16, y - height * 0.16);
        g.lineTo(x + cw * 0.16, y - height * 0.16);
        g.stroke();
    }
}

// ----------------------------------------------------------------------------------------------------------------
// the console

let protocolText = SAMPLE_PROTOCOL;
let targetText = SAMPLE_TARGETS;
let last = null;
let playing = null;

function read() {
    const protocol = readProtocol(protocolText);
    const targets = readTargets(targetText);
    return { protocol, targets };
}

function analyse() {
    const { protocol, targets } = read();
    const run = runProtocol(protocol);
    const judged = judge(targets.targets, run.wells);
    return { protocol, targets, run, judged, diagnosis: diagnose(run.records, run.warnings, judged, protocol.steps) };
}

function renderProblems(selector, list, title) {
    const box = $(selector);
    box.replaceChildren();
    if (!list.length) { box.hidden = true; return; }
    box.hidden = false;
    box.append(el('p', { class: 'problem-title' }, title));
    const ul = el('ul');
    for (const p of list) ul.append(el('li', {}, p));
    box.append(ul);
}

function renderVerdict(result) {
    const box = $('#verdict');
    box.replaceChildren();
    box.hidden = false;
    const failing = result.judged.filter(j => !j.passes);
    if (!failing.length) {
        box.className = 'verdict ok';
        box.append(el('strong', {}, T.passed));
        return;
    }
    const d = result.diagnosis;
    const step = d?.record ? d.record.index + 1 : '—';
    const first = failing.find(j => j.well === d?.well) ?? failing[0];
    box.className = 'verdict bad';
    const text = first.ceiling !== undefined
        ? t('ceilingFailed', { step, well: first.well, actual: formatMolarity(first.actual), target: formatMolarity(first.ceiling) })
        : t('failed', { step, well: first.well, actual: formatMolarity(first.actual), target: formatMolarity(first.target), deviation: percent(first.deviation) });
    box.append(el('strong', {}, text));
    if (d?.cause) box.append(el('span', { class: 'cause' }, ` — ${T.cause[d.cause] ?? d.cause}`));
    if (d?.warning) box.append(el('p', { class: 'warning' }, warningText(d.warning)));
    if (failing.length > 1) box.append(el('p', { class: 'also' }, t('also', { count: failing.length, wells: failing.map(j => j.well).join(', ') })));
}

const percent = d => (d === Infinity ? '∞' : `${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)}%`);

/** A step in the page's language, from the fields the model recorded. */
const stepText = r => {
    const p = T.op ?? {};
    switch (r.op) {
        case 'pick': return p.pick;
        case 'eject': return p.eject;
        case 'add': return p.add.replace('{volume}', r.volume).replace('{well}', r.well);
        case 'aspirate': return p.aspirate.replace('{volume}', r.volume).replace('{from}', r.well);
        case 'dispense': return p.dispense.replace('{volume}', r.volume).replace('{at}', formatMolarity(r.molarity ?? 0)).replace('{to}', r.well);
        case 'mix': return p.mix.replace('{well}', r.well);
        default: return r.note ?? r.op;
    }
};

function renderTable(result) {
    const body = $('#results tbody');
    body.replaceChildren();
    for (const j of result.judged) {
        const row = el('tr', { class: j.passes ? 'pass' : 'fail' });
        row.append(el('th', { scope: 'row' }, j.well));
        row.append(el('td', {}, j.ceiling !== undefined ? `${T.ceiling} ${formatMolarity(j.ceiling)}` : formatMolarity(j.target)));
        row.append(el('td', {}, formatMolarity(j.actual)));
        row.append(el('td', {}, j.passes ? T.pass : `${T.fail} ${percent(j.deviation)}`));
        body.append(row);
    }
}

function renderSteps(records) {
    const list = $('#steps');
    list.replaceChildren();
    records.forEach((record, i) => {
        const li = el('li', { class: record.index === view.index ? 'now' : '' });
        li.append(el('span', { class: 'n' }, String(i + 1)));
        li.append(el('span', { class: 'what' }, stepText(record)));
        list.append(li);
    });
}

function renderWarnings(warnings) {
    const list = $('#warnings');
    list.replaceChildren();
    if (!warnings.length) { list.append(el('li', { class: 'none' }, T.noWarnings)); return; }
    for (const w of warnings) {
        const li = el('li', { class: `warn ${w.code}` });
        li.append(el('span', { class: 'n' }, `${T.step} ${w.index + 1}`));
        li.append(el('span', {}, warningText(w)));
        list.append(li);
    }
}

function show(index) {
    if (!last) return;
    const record = last.run.records[index];
    view.index = index;
    drawBench($('#stage'), { state: record?.state ?? last.run.wells, failing: new Set(last.judged.filter(j => !j.passes).map(j => j.well)), at: record?.well });
    for (const [i, li] of [...$('#steps').children].entries()) li.classList.toggle('now', i === index);
    // Scroll the log itself: scrollIntoView would also scroll the page, away from what the reader is looking at.
    const log = $('#steps'), now = log.children[index];
    if (now) {
        const box = log.getBoundingClientRect(), row = now.getBoundingClientRect();
        if (row.top < box.top || row.bottom > box.bottom) log.scrollTop += row.top - box.top - log.clientHeight / 2;
    }
    $('#stepcount').textContent = `${T.step} ${index + 1}/${last.run.records.length}`;
}

function run() {
    stop();
    const { protocol, targets } = read();
    renderProblems('#problems', protocol.problems, T.problems);
    renderProblems('#targetproblems', targets.problems, T.targetProblems);
    const result = analyse();
    last = result;
    renderVerdict(result);
    renderTable(result);
    renderSteps(result.run.records);
    renderWarnings(result.run.warnings);
    $('#fix').disabled = result.protocol.steps.length === 0;
    show(0);
}

function fix() {
    stop();
    const { targets } = read();
    const result = analyse();
    last = result;
    const repair = repairProtocol(protocolText, targets.targets);
    const list = $('#changes');
    list.replaceChildren();
    if (!repair.changes.length) {
        list.append(el('li', {}, T.notRepaired.replace('{reason}', 'the twin found nothing to change')));
        return;
    }
    for (const change of repair.changes) {
        const li = el('li', { class: change.rule });
        li.append(el('code', {}, change.text ?? '(the volume is rewritten)'));
        li.append(el('span', { class: 'why' }, change.why));
        if (change.afterLine) li.append(el('span', { class: 'where' }, `${T.line} ${change.afterLine}`));
        list.append(li);
    }
    if (repair.fixed) {
        $('#fixverdict').className = 'verdict ok';
        $('#fixverdict').textContent = T.repaired;
    } else {
        $('#fixverdict').className = 'verdict bad';
        $('#fixverdict').textContent = T.notRepaired.replace('{reason}', 'a well is still out of tolerance after six rounds');
    }
    $('#fixverdict').hidden = false;
    const code = $('#fixedcode');
    code.textContent = repair.text;
    code.hidden = false;
    // run the rewritten protocol in the same twin, beside the original
    const after = { protocol: readProtocol(repair.text), targets };
    const runAfter = runProtocol(after.protocol);
    const judgedAfter = judge(targets.targets, runAfter.wells);
    const body = $('#after tbody');
    body.replaceChildren();
    for (const j of judgedAfter) {
        const row = el('tr', { class: j.passes ? 'pass' : 'fail' });
        row.append(el('th', { scope: 'row' }, j.well));
        row.append(el('td', {}, formatMolarity(j.actual)));
        row.append(el('td', {}, j.passes ? T.pass : `${T.fail} ${percent(j.deviation)}`));
        body.append(row);
    }
}

function stop() {
    if (playing) { clearInterval(playing); playing = null; $('#replay').textContent = T.replay; }
}

function play() {
    if (!last) return;
    if (playing) { stop(); return; }
    $('#replay').textContent = T.pause;
    let i = view.index >= last.run.records.length - 1 ? 0 : view.index;
    playing = setInterval(() => {
        if (!last || i >= last.run.records.length - 1) { stop(); return; }
        show(++i);
    }, 260);
    show(i);
}

function wire() {
    const protocol = $('#protocol');
    const targets = $('#targets');
    protocol.value = protocolText;
    targets.value = targetText;
    protocol.addEventListener('input', () => { protocolText = protocol.value; });
    targets.addEventListener('input', () => { targetText = targets.value; });

    $('#run').addEventListener('click', run);
    $('#fix').addEventListener('click', fix);
    $('#replay').addEventListener('click', play);
    $('#back').addEventListener('click', () => { stop(); show(Math.max(0, view.index - 1)); });
    $('#forward').addEventListener('click', () => { stop(); show(Math.min((last?.run.records.length ?? 1) - 1, view.index + 1)); });
    $('#build').addEventListener('click', () => {
        const built = protocolFromPrompt($('#prompt').value);
        protocolText = built.protocol;
        targetText = built.targets;
        protocol.value = protocolText;
        targets.value = targetText;
        run();
    });
    $('#prompt').placeholder = T.promptHint;
    addEventListener('resize', () => show(view.index));
    run();
}

if (document.getElementById('stage')) wire();

export { drawBench };
