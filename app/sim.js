/**
 * The liquid-handling model of the VibeSci bench.
 *
 * A well holds layers of liquid; a tip holds a mixture and keeps a film after it dispenses; a protocol is a list of
 * steps. The model is arithmetic, not a rendering of one: a well's concentration is its amount over its volume, and the
 * three ways a written protocol fails a bench (a film carried to the next well, a bolus pipetted because nothing mixed
 * it, a transfer of the wrong volume) are the operations themselves, not a score written beside them.
 *
 * Units: a volume is µL, an amount is µmol, a concentration is M (µmol/µL). 20 µL of a 1 M stock in a 100 µL well is
 * therefore 0.2 M. Every function is pure: it returns new wells, never the ones it was given.
 */

/**
 * A tip's dead volume: it draws this much more than it delivers, and keeps it as a film once it has dispensed. The film
 * is what carries one solution into the next when the tip is not ejected, which is the first mistake a bench finds.
 */
export const FILM_UL = 1.5;
/** A tip is dirty past this much held liquid. */
const WET_UL = 0.1;
const EPS = 1e-12;

export const emptyWell = () => ({ layers: [] });
export const volumeOf = w => w.layers.reduce((s, l) => s + l.volume, 0);
export const amountOf = w => w.layers.reduce((s, l) => s + l.amount, 0);

/** A well's concentration, M: the total amount over the total volume, whatever the layers. */
export function concentration(w) {
    const v = volumeOf(w);
    return v > EPS ? amountOf(w) / v : 0;
}

const copy = w => ({ layers: w.layers.map(l => ({ ...l })) });

/** Mixing merges the layers: afterwards the well holds one concentration at every depth. */
export function mixWell(w) {
    const v = volumeOf(w);
    return { layers: v > EPS ? [{ volume: v, amount: amountOf(w) }] : [] };
}

/** Remove `volume` µL from the top. A bolus nobody mixed is at the top, and it is what comes back out. */
function takeFromTop(w, volume) {
    const next = copy(w);
    let need = volume;
    let amount = 0;
    while (need > EPS && next.layers.length) {
        const top = next.layers[next.layers.length - 1];
        const take = Math.min(need, top.volume);
        const c = top.volume > EPS ? top.amount / top.volume : 0;
        amount += take * c;
        top.volume -= take;
        top.amount -= take * c;
        need -= take;
        if (top.volume <= EPS) next.layers.pop();
    }
    return { well: next, drawn: volume - need, amount };
}

export const newTip = () => ({ volume: 0, amount: 0 });
export const tipConcentration = tip => (tip && tip.volume > EPS ? tip.amount / tip.volume : 0);

/**
 * The pipette takes liquid from a well into the tip; what the tip already held (its film) blends with it. It draws the
 * volume it will deliver plus its dead volume, so the dead volume sits in the tip afterwards, not in the well.
 */
export function aspirate(w, tip, volume) {
    const { well, drawn, amount } = takeFromTop(w, volume + FILM_UL);
    return { well, tip: { volume: (tip?.volume ?? 0) + drawn, amount: (tip?.amount ?? 0) + amount }, drawn };
}

/** The pipette puts liquid from the tip into a well, and keeps its dead volume of the same mixture as a film. */
export function dispense(w, tip, volume) {
    const c = tipConcentration(tip);
    const held = tip?.volume ?? 0;
    const given = Math.max(0, Math.min(volume, held - (held >= FILM_UL ? FILM_UL : 0)));
    const next = copy(w);
    if (given > EPS) next.layers.push({ volume: given, amount: given * c });
    const film = Math.min(held - given, FILM_UL);
    return { well: next, tip: { volume: film, amount: film * c }, given };
}

/** A reservoir (a bottle, a trough): its contents never run out, and pouring from it uses no tip. */
export function addFromReservoir(w, volume, molarity) {
    const next = copy(w);
    if (volume > EPS) next.layers.push({ volume, amount: volume * molarity });
    return next;
}

// -------------------------------------------------------------------------------------------------------------
// a protocol: the text a person writes, read into steps

const NUM = String.raw`(\d+(?:\.\d+)?(?:[eE]-?\d+)?)`;
const WELL = String.raw`([A-H](?:1[0-2]|[1-9]))`;
const UL = String.raw`(?:µl|ul|μl|microlit(?:er|re)s?|µL|uL)`;
const MOLAR = String.raw`\s*(m|µm|um|mm|nm|mM|µM|uM|nM)?`;

const RE_ADD = new RegExp(`^add\\s+${NUM}\\s*${UL}\\s+(?:of\\s+)?(\\w+)\\s+(?:to|into)\\s+${WELL}\\s*(?:\\.\\.|-|–|to)\\s*${WELL}\\.?$`, 'i');
const RE_ADD_ONE = new RegExp(`^add\\s+${NUM}\\s*${UL}\\s+(?:of\\s+)?(\\w+)\\s+(?:to|into)\\s+${WELL}\\.?$`, 'i');
const RE_ASP = new RegExp(`^aspirate\\s+${NUM}\\s*${UL}\\s+(?:of\\s+[\\w ]+?\\s+)?(?:from|out of)\\s+([A-H](?:1[0-2]|[1-9])|stock|buffer)\\.?$`, 'i');
const RE_DISP = new RegExp(`^dispense\\s+${NUM}\\s*${UL}\\s+(?:into|to)\\s+${WELL}\\.?$`, 'i');
const RE_MIX = new RegExp(`^mix\\s+${WELL}\\.?$`, 'i');
const RE_RESERVOIR = new RegExp(`^reservoir\\s+(\\w+)\\s*(?:=|:)\\s*${NUM}${MOLAR}\\.?$`, 'i');

/** `A1` → { row: 'A', col: 1 }. */
export function wellAt(name) {
    const m = /^([A-H])(1[0-2]|[1-9])$/.exec(String(name).trim().toUpperCase());
    return m ? { row: m[1], col: Number(m[2]) } : null;
}

export const wellName = (row, col) => `${row}${col}`;

/** Every well a range names, in one row or down one column: `A1..A4` → ['A1','A2','A3','A4']. */
export function expandRange(from, to) {
    const a = wellAt(from), b = wellAt(to);
    if (!a || !b) return [];
    const out = [];
    if (a.row === b.row)
        for (let c = Math.min(a.col, b.col); c <= Math.max(a.col, b.col); c++) out.push(wellName(a.row, c));
    else if (a.col === b.col)
        for (let r = a.row.charCodeAt(0); r <= b.row.charCodeAt(0); r++) out.push(wellName(String.fromCharCode(r), a.col));
    return out;
}

const molarity = (value, unit) => {
    const u = (unit ?? 'M').toLowerCase();
    const scale = u === 'mm' ? 1e-3 : u === 'µm' || u === 'um' ? 1e-6 : u === 'nm' ? 1e-9 : 1;
    return Number(value) * scale;
};

/**
 * Read a protocol's text. A line that is not a step is nothing to do (a heading, a note, a blank). A line that starts
 * like a step and cannot be read is a problem, named, never skipped: skipping it would run a protocol nobody wrote.
 * → { steps, reservoirs, problems }
 */
export function readProtocol(text) {
    const steps = [];
    const problems = [];
    const reservoirs = new Map([['buffer', 0]]);
    String(text ?? '').split(/\r?\n/).forEach((raw, i) => {
        const line = raw.trim();
        const at = `line ${i + 1}`;
        if (!line || line.startsWith('#') || line.startsWith('//')) return;
        let m;
        if ((m = RE_RESERVOIR.exec(line))) { reservoirs.set(m[1].toLowerCase(), molarity(m[2], m[3])); return; }
        if (/^pick\b/i.test(line) && /\btip\b/i.test(line)) { steps.push({ op: 'pick', line: i + 1 }); return; }
        if (/^eject\b/i.test(line) && /\btip\b/i.test(line)) { steps.push({ op: 'eject', line: i + 1 }); return; }
        if ((m = RE_ADD.exec(line))) {
            const wells = expandRange(m[3], m[4]);
            if (!wells.length) { problems.push(`${at}: ${m[3]}..${m[4]} is not a range in one row or one column`); return; }
            for (const well of wells) steps.push({ op: 'add', well, volume: Number(m[1]), solution: m[2].toLowerCase(), line: i + 1 });
            return;
        }
        if ((m = RE_ADD_ONE.exec(line))) { steps.push({ op: 'add', well: m[3].toUpperCase(), volume: Number(m[1]), solution: m[2].toLowerCase(), line: i + 1 }); return; }
        if ((m = RE_ASP.exec(line))) { steps.push({ op: 'aspirate', from: m[2].toUpperCase(), volume: Number(m[1]), line: i + 1 }); return; }
        if ((m = RE_DISP.exec(line))) { steps.push({ op: 'dispense', to: m[2].toUpperCase(), volume: Number(m[1]), line: i + 1 }); return; }
        if ((m = RE_MIX.exec(line))) { steps.push({ op: 'mix', well: m[1].toUpperCase(), line: i + 1 }); return; }
        if (/^(add|aspirate|dispense|mix|pick|eject|reservoir)\b/i.test(line))
            problems.push(`${at}: "${line}" is not a step this reader reads. Write: add 90 µL buffer to A1..A8, pick tip, aspirate 10 µL from A1, dispense 10 µL into A2, mix A2, eject tip.`);
    });
    return { steps, reservoirs, problems };
}

// -------------------------------------------------------------------------------------------------------------
// a target: what each well should hold

/**
 * Read the target per well. → { targets, problems }
 * `A1 0.2 M` is a concentration and the tolerance after it applies to it in proportion; `tolerance B1 1e-6 M` is a
 * ceiling, which is how a blank is judged: a blank does not hold a concentration, it may not hold more than this.
 */
export function readTargets(text) {
    const targets = [];
    const problems = [];
    String(text ?? '').split(/\r?\n/).forEach((raw, i) => {
        const line = raw.trim();
        if (!line || line.startsWith('#') || line.startsWith('//')) return;
        let m;
        if ((m = new RegExp(`^tolerance\\s+${WELL}\\s*(\\.\\.|-|–|to)\\s*${WELL}\\s+${NUM}${MOLAR}$`, 'i').exec(line))) {
            for (const well of expandRange(m[1], m[3])) targets.push({ well, molarity: 0, ceiling: molarity(m[4], m[5]) });
            return;
        }
        if ((m = new RegExp(`^${WELL}\\s*(\\.\\.|-|–|to)\\s*${WELL}\\s+${NUM}${MOLAR}$`, 'i').exec(line))) {
            for (const well of expandRange(m[1], m[3])) targets.push({ well, molarity: molarity(m[4], m[5]), relative: 0.05 });
            return;
        }
        if ((m = new RegExp(`^tolerance\\s+${WELL}\\s+${NUM}${MOLAR}$`, 'i').exec(line))) { targets.push({ well: m[1].toUpperCase(), molarity: 0, ceiling: molarity(m[2], m[3]) }); return; }
        if ((m = new RegExp(`^${WELL}\\s+${NUM}${MOLAR}$`, 'i').exec(line))) { targets.push({ well: m[1].toUpperCase(), molarity: molarity(m[2], m[3]), relative: 0.05 }); return; }
        if ((m = /^tolerance\s+(\d+(?:\.\d+)?)\s*%$/i.exec(line))) {
            const fraction = Number(m[1]) / 100;
            for (const t of targets) if (t.ceiling === undefined) t.relative = fraction;
            return;
        }
        problems.push(`line ${i + 1}: "${line}" is not a target line. Write: A1 0.2 M, A2..A8 0.02 M, tolerance 5%, tolerance B1 1e-06 M.`);
    });
    return { targets, problems };
}

// -------------------------------------------------------------------------------------------------------------
// running a protocol on the twin

/**
 * Run a protocol the way the bench runs it. → { wells, records, warnings }
 * A record is one step: where it acted, what the tip held before it, and what the twin noticed. A warning is the
 * bench telling on itself before a result is read: a tip that was not ejected, a bolus still sitting on top.
 */
export function runProtocol({ steps, reservoirs }) {
    const wells = new Map();
    const well = name => wells.get(name) ?? emptyWell();
    for (const step of steps) {
        const name = step.well ?? step.to;
        if (name && /^[A-H](1[0-2]|[1-9])$/.test(name) && !wells.has(name)) wells.set(name, emptyWell());
    }

    let tip = null;
    let lastSource = null;      // where the tip last took liquid from
    let lastDispensed = null;   // { well, molarity } of what it last put into a well
    const records = [];
    const warnings = [];
    const warn = (index, well, code, text, params = {}) => warnings.push({ index, well, code, text, params });

    steps.forEach((step, index) => {
        const where = step.well ?? step.to ?? step.from ?? null;
        const record = { index, line: step.line, op: step.op, well: where, tipBefore: tip ? { volume: tip.volume, concentration: tipConcentration(tip) } : null };
        switch (step.op) {
            case 'pick':
                tip = newTip();
                lastDispensed = null;
                lastSource = null;
                record.note = 'a new tip';
                break;
            case 'eject':
                tip = null;
                lastDispensed = null;
                lastSource = null;
                record.note = 'the tip goes to the waste';
                break;
            case 'add': {
                const c = reservoirs.get(step.solution);
                if (c === undefined) { warn(index, step.well, 'unknown_solution', `the protocol pours ${step.solution}, which no reservoir line names`, { solution: step.solution }); record.note = `unknown solution ${step.solution}`; break; }
                record.before = volumeOf(well(step.well));
                wells.set(step.well, addFromReservoir(well(step.well), step.volume, c));
                record.volume = step.volume;
                record.note = `${round(step.volume)} µL of ${step.solution} poured into ${step.well}`;
                break;
            }
            case 'aspirate': {
                if (!tip) { tip = newTip(); record.note = 'a tip is picked up'; }
                const from = step.from;
                if (from !== 'STOCK' && from !== 'BUFFER' && !wells.has(from)) {
                    warn(index, from, 'unknown_well', `${from} holds nothing: the protocol aspirates from an empty well`, { from });
                    record.note = `${from} holds nothing`;
                    break;
                }
                // a film of what the tip is about to take cannot change it; a film of anything else can, which is what
                // the bench reports here. A blank's source is 0 M, so any film at all is a contamination of it.
                const sourceMolarity = from === 'STOCK' || from === 'BUFFER' ? reservoirs.get(from.toLowerCase()) : concentration(well(from));
                const carried = tipConcentration(tip);
                const matters = sourceMolarity === undefined ? tip.volume > WET_UL
                    : Math.abs(carried - sourceMolarity) > Math.max(sourceMolarity * 0.01, EPS);
                if (tip.volume > WET_UL && matters)
                    warn(index, from, 'dirty_tip', `the tip still holds ${round(tip.volume)} µL at ${formatMolarity(carried)} when the protocol aspirates from ${from}, which holds ${formatMolarity(sourceMolarity ?? 0)}: nothing ejected it`, { held: round(tip.volume), carried: formatMolarity(carried), from, source: formatMolarity(sourceMolarity ?? 0) });
                if (from === 'STOCK' || from === 'BUFFER') {
                    const c = reservoirs.get(from.toLowerCase());
                    if (c === undefined) { warn(index, from, 'unknown_solution', `no reservoir line names ${from.toLowerCase()}`); break; }
                    const drawnVolume = step.volume + FILM_UL;
                    const held = tip.volume > EPS ? { volume: tip.volume + drawnVolume, amount: tip.amount + drawnVolume * c } : { volume: drawnVolume, amount: drawnVolume * c };
                    tip = held;
                    lastSource = from;
                    record.volume = step.volume;
                    record.note = `${round(step.volume)} µL from the ${from.toLowerCase()} reservoir`;
                    break;
                }
                const r = aspirate(well(from), tip, step.volume);
                wells.set(from, r.well);
                tip = r.tip;
                lastSource = from;
                record.volume = r.drawn;
                record.note = `${round(step.volume)} µL out of ${from}, and the tip's ${round(r.drawn - step.volume)} µL of dead volume with it`;
                break;
            }
            case 'dispense': {
                if (!tip) { warn(index, step.to, 'no_tip', `the protocol dispenses into ${step.to} with no tip`, { to: step.to }); break; }
                const c = tipConcentration(tip);
                const before = volumeOf(well(step.to));
                const r = dispense(well(step.to), tip, step.volume);
                wells.set(step.to, r.well);
                tip = r.tip;
                record.before = before;
                record.volume = r.given;
                record.molarity = c;
                record.note = `${round(r.given)} µL at ${formatMolarity(c)} into ${step.to}`;
                if (lastDispensed && lastSource && lastSource !== step.to && Math.abs(lastDispensed.molarity - c) > 1e-12 && tip.volume > WET_UL)
                    warn(index, step.to, 'carryover', `a ${round(tip.volume)} µL film of what the tip last dispensed (${lastDispensed.well}, ${formatMolarity(lastDispensed.molarity)}) goes into ${step.to} with it`, { held: round(tip.volume), where: lastDispensed.well, at: formatMolarity(lastDispensed.molarity), to: step.to });
                lastDispensed = { well: step.to, molarity: c };
                break;
            }
            case 'mix':
                wells.set(step.well, mixWell(well(step.well)));
                record.note = `${step.well} mixed: one concentration at every depth`;
                break;
            default:
                break;
        }
        record.state = new Map([...wells].map(([name, w]) => [name, concentration(w)]));
        records.push(record);
    });
    return { wells, records, warnings };
}

// -------------------------------------------------------------------------------------------------------------
// reading a run

/** A concentration in the unit a chemist would say it in. */
export function formatMolarity(m) {
    if (!Number.isFinite(m)) return '—';
    if (m === 0) return '0 M';
    const abs = Math.abs(m);
    if (abs >= 1) return `${round(m, 3)} M`;
    if (abs >= 1e-3) return `${round(m * 1e3, 3)} mM`;
    if (abs >= 1e-6) return `${round(m * 1e6, 3)} µM`;
    if (abs >= 1e-9) return `${round(m * 1e9, 3)} nM`;
    if (abs >= 1e-12) return `${round(m * 1e12, 3)} pM`;
    return 'a trace';
}

const round = (x, digits = 4) => String(Number(Number(x).toPrecision(digits)));

/**
 * Compare every target with what the run left in its well.
 * → [{ well, target, actual, ceiling, passes, deviation }]
 * A concentration passes inside its fraction (5% of 0.2 M). A ceiling passes under it (a blank may hold nothing above
 * 1 µM): the two are different questions, which is why they are held apart.
 */
export function judge(targets, wells) {
    return targets.map(t => {
        const w = wells.get(t.well) ?? emptyWell();
        const actual = concentration(w);
        if (t.ceiling !== undefined)
            return { well: t.well, actual, ceiling: t.ceiling, target: 0, passes: actual <= t.ceiling + EPS, deviation: t.ceiling > 0 ? actual / t.ceiling - 1 : (actual > EPS ? Infinity : 0) };
        const deviation = t.molarity === 0 ? (actual > EPS ? Infinity : 0) : actual / t.molarity - 1;
        return { well: t.well, actual, target: t.molarity, relative: t.relative, passes: Math.abs(deviation) <= t.relative + 1e-9, deviation };
    });
}

/**
 * Where a run went wrong, in the bench's words: the failing wells, the step that failed the first of them, and the
 * cause the twin saw there. → { well, record, warning, cause } | null
 * The cause names one of the three ways a written protocol fails a bench; a step that carries a warning is its cause
 * in the twin's own words.
 */
export function diagnose(records, warnings, judged, steps) {
    const failing = judged.filter(j => !j.passes);
    if (!failing.length) return null;
    const wells = new Set(failing.map(j => j.well));
    const first = records.find(r => r.well && wells.has(r.well));
    if (!first) return { well: failing[0].well, record: null, warning: null, cause: 'target' };
    const warning = warnings.find(w => w.index === first.index) ?? null;
    let cause = 'volume';
    if (warning && (warning.code === 'dirty_tip' || warning.code === 'carryover')) cause = 'carryover';
    else if (first.op === 'aspirate') cause = 'missed mix';
    else if (first.op === 'dispense') {
        const mixedAfter = steps.slice(first.index + 1).find(s => (s.well ?? s.to) === first.well);
        cause = mixedAfter && mixedAfter.op === 'mix' ? 'volume' : 'missed mix';
    }
    return { well: failing[0].well, record: first, warning, cause, failing };
}

// -------------------------------------------------------------------------------------------------------------
// the rewrite

/**
 * Rewrite a protocol until its own twin passes, and say why each line went in. Three rules, each the fix of one way a
 * written protocol fails a bench:
 *  - `one-transfer-volume`: a series transfers one volume, so a transfer off it is written to it (once, at the start);
 *  - `mix-after-dispense`: a dispense into a well that already held liquid leaves a bolus on top, so a mix follows it;
 *  - `eject-before-a-transfer`: a tip that still holds liquid is ejected before it takes another.
 * The rewrite is the twin's own failures read back: each round runs the protocol, finds what the bench saw, and writes
 * the line the bench needed. It stops when the target passes, when a round finds nothing to write, or after six rounds.
 * → { text, changes: [{ rule, line, why }], fixed, rounds }
 */
export function repairProtocol(text, targets) {
    let current = String(text ?? '');
    const changes = [];
    const seen = new Set();
    const note = entry => {
        const key = `${entry.rule}|${entry.line ?? entry.afterLine}|${entry.text}`;
        if (seen.has(key)) return false;
        seen.add(key);
        changes.push(entry);
        return true;
    };

    // rule 1, once: the series' volume, over the transfers between wells (a pour from a reservoir keeps its own)
    current = oneTransferVolume(current, note);

    for (let pass = 1; pass <= 6; pass++) {
        const protocol = readProtocol(current);
        const run = runProtocol(protocol);
        const judged = judge(targets, run.wells);
        if (judged.every(j => j.passes)) return { text: current, changes, fixed: true, rounds: pass };

        let wrote = false;
        const lines = current.split(/\r?\n/);

        // rule 2: a well that already held liquid and got a dispense is mixed, before anything else touches it
        const inserts = new Map();
        const volumes = new Map();
        for (const step of protocol.steps) {
            const name = step.well ?? step.to;
            if (step.op === 'add') volumes.set(name, (volumes.get(name) ?? 0) + step.volume);
            else if (step.op === 'aspirate' && /^[A-H]\d/.test(step.from)) volumes.set(step.from, Math.max(0, (volumes.get(step.from) ?? 0) - step.volume));
            else if (step.op === 'dispense') {
                const before = volumes.get(name) ?? 0;
                const next = protocol.steps.slice(protocol.steps.indexOf(step) + 1).find(s => (s.well ?? s.to) === name);
                if (before > EPS && (!next || next.op !== 'mix'))
                    inserts.set(step.line, [{ text: `mix ${step.to}`, rule: 'mix-after-dispense', why: `${step.to} already held liquid, and nothing mixed the ${round(step.volume, 3)} µL bolus: the next aspirate would take it undiluted` }]);
                volumes.set(name, before + step.volume);
            }
        }

        // rule 3: the steps the bench warned about a dirty tip carry an eject before them. Only the aspirate's own
        // warning is acted on: a carryover warning belongs to the dispense the dirty aspirate fed, and the fix for it is
        // the eject before that aspirate, which its dirty-tip warning already wrote.
        for (const warning of run.warnings) {
            if (warning.code !== 'dirty_tip') continue;
            const step = protocol.steps[warning.index];
            if (!step) continue;
            const line = step.line;
            const list = Array.isArray(inserts.get(line - 1)) ? inserts.get(line - 1) : inserts.get(line - 1) ? [inserts.get(line - 1)] : [];
            list.push({ text: 'eject tip', rule: 'eject-before-a-transfer', why: warning.text }, { text: 'pick tip', rule: 'eject-before-a-transfer', why: `a fresh tip for ${step.from ?? step.to}` });
            inserts.set(line - 1, list);
        }

        // write them in: an insert after line n goes below it
        const after = new Map();
        for (const [line, entry] of inserts) {
            const list = after.get(line) ?? [];
            list.push(...(Array.isArray(entry) ? entry : [entry]));
            after.set(line, list);
        }
        const out = [];
        lines.forEach((line, i) => {
            out.push(line);
            for (const entry of after.get(i + 1) ?? []) {
                out.push(entry.text);
                wrote = note({ ...entry, afterLine: i + 1 }) || wrote;
            }
        });
        if (!wrote) return { text: current, changes, fixed: false, rounds: pass, judged };
        current = out.join('\n');
    }
    return { text: current, changes, fixed: false, rounds: 6 };
}

/** Rule 1: the volume most of a series' transfers use is the volume every transfer of it writes. */
function oneTransferVolume(text, note) {
    const protocol = readProtocol(text);
    const transfers = protocol.steps.filter(s => s.op === 'aspirate' && /^[A-H]\d/.test(s.from));
    const counts = new Map();
    for (const t of transfers) counts.set(t.volume, (counts.get(t.volume) ?? 0) + 1);
    const seriesVolume = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0];
    if (seriesVolume === undefined) return text;

    const paired = new Set();
    const aspirates = transfers.filter(t => t.volume !== seriesVolume);
    for (const wrong of aspirates) {
        const step = protocol.steps.find(s => s.op === 'dispense' && s.line > wrong.line && s.volume === wrong.volume && !paired.has(s.line));
        if (step) paired.add(step.line);
    }
    return text.split(/\r?\n/).map((line, i) => {
        const steps = protocol.steps.filter(s => s.line === i + 1);
        const wrong = steps.find(s => (s.op === 'aspirate' && /^[A-H]\d/.test(s.from) && s.volume !== seriesVolume) || (s.op === 'dispense' && paired.has(s.line)));
        if (!wrong) return line;
        note({
            rule: 'one-transfer-volume', line: i + 1, afterLine: null,
            text: null,
            why: `the series transfers ${round(seriesVolume, 3)} µL; this line writes ${round(wrong.volume, 3)} µL ${wrong.op === 'aspirate' ? `out of ${wrong.from}` : `into ${wrong.to}`}`,
        });
        return line.replace(String(wrong.volume), String(seriesVolume));
    }).join('\n');
}
