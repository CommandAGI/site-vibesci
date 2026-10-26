/**
 * The lab console: the protocol a person writes on the left, the bench on the right.
 *
 * Everything here is the page's: it reads two text areas, runs the protocol through the twin in `sim.js`, and draws the
 * bench, the step log and the table. Nothing is sent anywhere (`connect-src 'none'`), no model is called, and the page
 * works from a file on a disk as well as from the site.
 */
import { readProtocol, readTargets, runProtocol, judge, diagnose, repairProtocol, formatMolarity } from './sim.js';
import { SAMPLE_PROTOCOL, SAMPLE_TARGETS, protocolFromPrompt } from './sample.js';

const LOCALE = (document.documentElement.lang || 'en').toLowerCase();
const STRINGS = {
    en: {
        run: 'Run it in the twin', fix: 'VibeSci, fix it', build: 'Write it', replay: 'Replay', pause: 'Pause',
        step: 'Step', back: 'Previous step', forward: 'Next step', reset: 'Back to the protocol',
        passed: 'Every well is within tolerance.', failed: 'Fails at step {step}, well {well}: {actual} where {target} was asked ({deviation}).',
        ceilingFailed: 'Fails at step {step}, well {well}: {actual} of carryover in a blank (the ceiling is {target}).',
        cause: { carryover: 'carryover on a tip that was not ejected', 'missed mix': 'a bolus nothing mixed', volume: 'a transfer of the wrong volume', target: 'a target nothing met' },
        well: 'Well', target: 'Target', actual: 'What the twin found', verdict: 'Verdict', pass: 'pass', fail: 'fail', ceiling: 'at most',
        steps: 'What the bench did', warnings: 'What the bench noticed', changes: 'What VibeSci rewrote', noWarnings: 'Nothing. The protocol works as written.',
        repaired: 'The rewrite passes: every well is within tolerance, run in the same twin.', notRepaired: 'The rewrite did not settle the protocol: {reason}',
        problems: 'The protocol cannot be read:', targetProblems: 'The target cannot be read:', promptHint: 'a 1:10 dilution of a 1 M stock across A1..A8, blanks in row B',
        line: 'line', probe: 'the pipette', plate: 'A 96-well plate, seen from the bench',
        warn: {
            dirtyTip: 'the tip still holds {held} µL at {carried} when the protocol aspirates from {from}, which holds {source}: nothing ejected it',
            carryover: 'a {held} µL film of what the tip last put into {where} ({at}) goes into {to} with it',
            unknownSolution: 'the protocol pours {solution}, which no reservoir line names',
            unknownWell: '{from} holds nothing: the protocol aspirates from an empty well',
            noTip: 'the protocol dispenses into {to} with no tip',
        },
        op: {
            pick: 'a new tip', eject: 'the tip goes to the waste',
            add: '{volume} µL of the reservoir poured into {well}',
            aspirate: '{volume} µL drawn from {from}', dispense: '{volume} µL at {at} into {to}',
            mix: '{well} mixed: one concentration at every depth',
        },
    },
    es: {
        run: 'Ejecútalo en el gemelo', fix: 'VibeSci, corrígelo', build: 'Escríbelo', replay: 'Repetir', pause: 'Pausa',
        step: 'Paso', back: 'Paso anterior', forward: 'Paso siguiente', reset: 'Volver al protocolo',
        passed: 'Todos los pocillos están dentro de la tolerancia.', failed: 'Falla en el paso {step}, pocillo {well}: {actual} donde se pedían {target} ({deviation}).',
        ceilingFailed: 'Falla en el paso {step}, pocillo {well}: {actual} de arrastre en un blanco (el techo es {target}).',
        cause: { carryover: 'arrastre en una punta que no se cambió', 'missed mix': 'un bolo que nadie mezcló', volume: 'una transferencia con el volumen equivocado', target: 'un objetivo que nada cumplió' },
        well: 'Pocillo', target: 'Objetivo', actual: 'Lo que encontró el gemelo', verdict: 'Veredicto', pass: 'bien', fail: 'mal', ceiling: 'como máximo',
        steps: 'Lo que hizo la mesa', warnings: 'Lo que notó la mesa', changes: 'Lo que VibeSci reescribió', noWarnings: 'Nada. El protocolo funciona tal como está escrito.',
        repaired: 'La reescritura pasa: todos los pocillos están dentro de la tolerancia, en el mismo gemelo.', notRepaired: 'La reescritura no arregló el protocolo: {reason}',
        problems: 'El protocolo no se puede leer:', targetProblems: 'El objetivo no se puede leer:', promptHint: 'una dilución 1:10 de un patrón 1 M en A1..A8, blancos en la fila B',
        line: 'línea', probe: 'la pipeta', plate: 'Una placa de 96 pocillos, vista desde la mesa',
        warn: {
            dirtyTip: 'la punta todavía guarda {held} µL a {carried} cuando el protocolo aspira de {from}, que contiene {source}: nada la cambió',
            carryover: 'una película de {held} µL de lo último que la punta puso en {where} ({at}) entra en {to} con ella',
            unknownSolution: 'el protocolo vierte {solution}, que ningún reservorio nombra',
            unknownWell: '{from} no contiene nada: el protocolo aspira de un pocillo vacío',
            noTip: 'el protocolo dispensa en {to} sin punta',
        },
        op: {
            pick: 'una punta nueva', eject: 'la punta va al desecho',
            add: '{volume} µL del reservorio vertidos en {well}',
            aspirate: '{volume} µL tomados de {from}', dispense: '{volume} µL a {at} en {to}',
            mix: '{well} mezclado: una sola concentración en toda la profundidad',
        },
    },
    'zh-hans': {
        run: '在数字孪生上运行', fix: 'VibeSci，修复它', build: '写出来', replay: '重放', pause: '暂停',
        step: '第', back: '上一步', forward: '下一步', reset: '回到协议',
        passed: '每个孔都在容差内。', failed: '第 {step} 步、{well} 孔失败：实测 {actual}，目标 {target}（{deviation}）。',
        ceilingFailed: '第 {step} 步、{well} 孔失败：空白孔有 {actual} 的残留（上限 {target}）。',
        cause: { carryover: '没有换吸头造成的残留', 'missed mix': '没有混匀的液团', volume: '体积写错的转移', target: '没有一步能达成的目标' },
        well: '孔', target: '目标', actual: '孪生实测', verdict: '结果', pass: '通过', fail: '失败', ceiling: '至多',
        steps: '实验台做了什么', warnings: '实验台发现了什么', changes: 'VibeSci 改写了什么', noWarnings: '没有。协议按原文就能跑通。',
        repaired: '改写通过：每个孔都在容差内，在同一个孪生上运行。', notRepaired: '改写没有修好协议：{reason}',
        problems: '读不懂这份协议：', targetProblems: '读不懂这个目标：', promptHint: '把 1 M 的母液在 A1..A8 做 1:10 稀释，B 行为空白',
        line: '第', probe: '移液器', plate: '从实验台看一块 96 孔板',
        warn: {
            dirtyTip: '协议从 {from}（其中为 {source}）吸取时，吸头里还留着 {held} µL、{carried} 的液体：没有换吸头',
            carryover: '吸头上 {held} µL 的残液（上一次打进 {where} 的，{at}）跟着进入了 {to}',
            unknownSolution: '协议倒入了 {solution}，但没有储液槽这样命名',
            unknownWell: '{from} 里什么都没有：协议从一个空孔里吸取',
            noTip: '协议往 {to} 里分液，却没有吸头',
        },
        op: {
            pick: '新吸头', eject: '吸头丢弃',
            add: '{volume} µL 储液槽液体倒入 {well}',
            aspirate: '从 {from} 吸取 {volume} µL', dispense: '将 {volume} µL、{at} 打进 {to}',
            mix: '{well} 已混匀：各深度浓度一致',
        },
    },
};
const T = STRINGS[LOCALE] ?? STRINGS.en;
const t = (key, values = {}) => {
    const raw = key.split('.').reduce((o, k) => (o ? o[k] : undefined), T) ?? key;
    return String(raw).replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');
};

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
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
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
    g.fillStyle = dark ? '#14201f' : '#eef1ee';
    g.strokeStyle = dark ? '#24322f' : '#d7ddd6';
    g.lineWidth = 2;
    g.fill();
    g.stroke();

    const max = Math.max(1e-9, ...[...(state ? state.values() : [])]);
    const colour = m => {
        if (!m || m <= 1e-15) return dark ? '#26322f' : '#dfe6e0';
        const x = Math.log10(m / max);            // -9 (a trace) … 0 (the brightest well)
        const hue = 168 + Math.max(0, Math.min(1, (x + 9) / 9)) * 12;
        const light = dark ? 30 + Math.max(0, Math.min(1, (x + 9) / 9)) * 40 : 92 - Math.max(0, Math.min(1, (x + 9) / 9)) * 60;
        return `hsl(${hue} 62% ${light}%)`;
    };

    ROWS.split('').forEach((row, r) => {
        for (let c = 0; c < COLS; c++) {
            const name = `${row}${c + 1}`;
            const p = atRC(c, r);
            const x = p.x + cw / 2;
            const y = p.y + ch / 2;
            g.beginPath();
            g.ellipse(x, y, cw * 0.34, ch * 0.34, 0, 0, Math.PI * 2);
            g.fillStyle = colour(state ? state.get(name) : 0);
            g.fill();
            g.strokeStyle = dark ? '#2b3b37' : '#c9d2ca';
            g.lineWidth = 1;
            g.stroke();
            if (failing.has(name)) {
                g.beginPath();
                g.ellipse(x, y, cw * 0.44, ch * 0.46, 0, 0, Math.PI * 2);
                g.strokeStyle = dark ? '#ff8a75' : '#c8402a';
                g.lineWidth = 2.5;
                g.stroke();
            }
        }
    });

    // letters and numbers, in the plate's own plane
    g.fillStyle = dark ? '#7f918c' : '#7a8880';
    g.font = `600 ${Math.round(cw * 0.28)}px system-ui, sans-serif`;
    ROWS.split('').forEach((row, r) => { const p = atRC(0, r); g.fillText(row, p.x - 20, p.y + ch * 0.72); });
    for (let c = 0; c < COLS; c++) { const p = atRC(c, 0); g.fillText(String(c + 1), p.x + cw * 0.36, p.y - 8); }

    // the pipette, over the well the step acted on
    if (at && /^[A-H]\d/.test(at)) {
        const row = at[0], col = Number(at.slice(1)) - 1;
        const p = atRC(col, ROWS.indexOf(row));
        const x = p.x + cw / 2;
        const y = p.y + ch / 2;
        g.strokeStyle = dark ? '#8ee3d3' : '#0b7a6b';
        g.fillStyle = dark ? '#8ee3d3' : '#0b7a6b';
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
    if (failing.length > 1) box.append(el('p', { class: 'also' }, `${failing.length} wells are out of tolerance: ${failing.map(j => j.well).join(', ')}`));
}

const percent = d => (d === Infinity ? '∞' : `${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)}%`);

/** A warning in the page's language: the model records a code and the numbers it saw. */
const warningText = w => {
    const p = w.params ?? {};
    const name = { dirty_tip: 'dirtyTip', carryover: 'carryover', unknown_solution: 'unknownSolution', unknown_well: 'unknownWell', no_tip: 'noTip' }[w.code];
    const raw = name ? T.warn?.[name] : undefined;
    return raw ? raw.replace(/\{(\w+)\}/g, (_, k) => p[k] ?? '') : w.text;
};

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
    const now = $('#steps').children[index];
    if (now) now.scrollIntoView({ block: 'nearest' });
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
