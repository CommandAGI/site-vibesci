/**
 * The plate as the notebook prints it: one rule for the colour of a well, shared by the console's canvas (lab.js),
 * the home page's plate (story.js) and the page writer (redesign/pages.mjs). Pure: strings and numbers, no DOM.
 *
 * Liquid is mint. What the liquid carries is pink, on a log scale from a nanomolar (no pink) to a molar (full pink),
 * because a dilution series is a ladder of tenths and a linear scale would show one pink well and seven mint ones.
 */
export const INK = { paper: '#f6efe1', paper2: '#ece2cd', teal: '#0a7f80', tealDeep: '#0b4f51', pink: '#ff48b0', pinkDeep: '#b8126a', mint: '#a4efd6' };
export const ROWS = 'ABCDEFGH';
export const COLS = 12;

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a, b, k) => '#' + hex(a).map((x, i) => Math.round(x + (hex(b)[i] - x) * k).toString(16).padStart(2, '0')).join('');

/** 0 for a nanomolar or less, 1 for a molar. */
export const strength = m => (m > 1e-9 ? Math.max(0, Math.min(1, (Math.log10(m) + 9) / 9)) : 0);

/** The colour of a well: paper when dry, mint when it holds liquid, pinker the more the liquid carries. */
export const wellInk = (m, wet) => (!wet ? INK.paper : mixHex(INK.mint, INK.pink, Math.pow(strength(m), 1.4)));

/** Which wells hold liquid after each record: a well is wet from the first add or dispense into it. */
export function wetness(records) {
    const wet = new Set();
    return records.map(r => {
        if ((r.op === 'add' || r.op === 'dispense') && /^[A-H]\d+$/.test(r.well)) wet.add(r.well);
        return new Set(wet);
    });
}

/** The plate as SVG markup, seen from above: 12 × 8 wells, the pink plate a few units off under the teal frame. */
export function plateSVG({ state = new Map(), wet = new Set(), failing = new Set(), title = '' } = {}) {
    const pitch = 40, r = 15, ox = 46, oy = 46;
    const w = ox + COLS * pitch + 18, h = oy + ROWS.length * pitch + 18;
    const out = [`<svg class="plate" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="plate-title"><title id="plate-title">${title}</title>`];
    out.push(`<rect class="frame-pink" x="${10 + 6}" y="${10 + 5}" width="${w - 20}" height="${h - 20}"/>`);
    out.push(`<rect class="frame" x="10" y="10" width="${w - 20}" height="${h - 20}"/>`);
    for (let c = 0; c < COLS; c++) out.push(`<text class="tick" x="${ox + c * pitch + pitch / 2}" y="36" text-anchor="middle">${c + 1}</text>`);
    [...ROWS].forEach((row, ri) => {
        out.push(`<text class="tick" x="26" y="${oy + ri * pitch + pitch / 2 + 5}" text-anchor="middle">${row}</text>`);
        for (let c = 0; c < COLS; c++) {
            const name = `${row}${c + 1}`;
            const cx = ox + c * pitch + pitch / 2, cy = oy + ri * pitch + pitch / 2;
            const isWet = wet.has(name);
            out.push(`<circle class="rim" cx="${cx}" cy="${cy}" r="${r + 1}"/>`);
            out.push(`<circle class="fill" data-well="${name}" cx="${cx}" cy="${cy}" r="${isWet ? r - 1 : 0}" fill="${wellInk(state.get(name) ?? 0, isWet)}"/>`);
            if (failing.has(name)) out.push(`<circle class="ring" data-ring="${name}" cx="${cx}" cy="${cy}" r="${r + 5}"/>`);
        }
    });
    out.push(`<g class="tip" aria-hidden="true" opacity="0"><line x1="0" y1="-46" x2="0" y2="-14"/><path class="tip-end" d="M-6 -16 L6 -16 L0 -4 Z"/></g>`);
    out.push('</svg>');
    return out.join('');
}

/** The plate's geometry, for whoever moves the pipette over a well. */
export const wellCentre = name => ({ x: 46 + (Number(name.slice(1)) - 1) * 40 + 20, y: 46 + ROWS.indexOf(name[0]) * 40 + 20 });
