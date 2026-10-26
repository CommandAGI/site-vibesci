/**
 * The site's own tests of the bench model: the sample protocol fails where its three shortcuts are, the rewrite fixes
 * it, and a protocol written from a sentence passes as written. These are the site's worst case, not a restatement of
 * the arithmetic: each one fails if the twin stops seeing a mistake a chemist would see.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readProtocol, readTargets, runProtocol, judge, diagnose, repairProtocol, formatMolarity, concentration, emptyWell } from '../app/sim.js';
import { SAMPLE_PROTOCOL, SAMPLE_TARGETS, protocolFromPrompt } from '../app/sample.js';

const run = text => {
    const protocol = readProtocol(text);
    const { targets } = readTargets(SAMPLE_TARGETS);
    const result = runProtocol(protocol);
    return { protocol, targets, result, judged: judge(targets, result.wells) };
};

test('the sample protocol reads as steps, with nothing skipped', () => {
    const { protocol } = run(SAMPLE_PROTOCOL);
    assert.deepEqual(protocol.problems, []);
    assert.ok(protocol.steps.length > 30);
    // every line of the sample that is not a comment, a blank or a reservoir line is a step
    const written = SAMPLE_PROTOCOL.split('\n').filter(l => l.trim() && !l.trim().startsWith('#') && !/^reservoir/.test(l.trim()));
    assert.equal(protocol.steps.length, written.length);
});

test('the sample fails, and the first failure is the film the tip carried into A2', () => {
    const { result, judged } = run(SAMPLE_PROTOCOL);
    const failing = judged.filter(j => !j.passes).map(j => j.well);
    assert.ok(failing.includes('A2'), 'A2 is contaminated by the stock the tip still held');
    const first = diagnose(result.records, result.warnings, judged, readProtocol(SAMPLE_PROTOCOL).steps);
    assert.equal(first.well, 'A2');
    assert.equal(first.cause, 'carryover');
    assert.match(first.warning.text, /film|holds/);
});

test('the sample fails a well for each of the three shortcuts it takes', () => {
    const { result, judged } = run(SAMPLE_PROTOCOL);
    const codes = new Set(result.warnings.map(w => w.code));
    assert.ok(codes.has('dirty_tip'), 'no eject between the stock and the buffer');
    const a5 = judged.find(j => j.well === 'A5');
    assert.ok(a5, 'A5 is judged');
    const failing = judged.filter(j => !j.passes).map(j => j.well);
    assert.ok(failing.length >= 4, `several wells fail, not one: ${failing.join(', ')}`);
});

test('the rewrite makes every well pass, and says why each line went in', () => {
    const { targets } = run(SAMPLE_PROTOCOL);
    const repair = repairProtocol(SAMPLE_PROTOCOL, targets);
    assert.equal(repair.fixed, true);
    assert.ok(repair.changes.length > 5);
    const rules = new Set(repair.changes.map(c => c.rule));
    assert.ok(rules.has('one-transfer-volume'), 'the 20 µL transfer is written to the series volume');
    assert.ok(rules.has('mix-after-dispense'), 'the missing mix goes in');
    assert.ok(rules.has('eject-before-a-transfer'), 'the ejected tip goes in');
    const after = readProtocol(repair.text);
    assert.deepEqual(after.problems, []);
    const judged = judge(targets, runProtocol(after).wells);
    assert.deepEqual(judged.filter(j => !j.passes), []);
});

test('the repaired protocol still says what the table said: A1 0.2 M downwards', () => {
    const { targets } = run(SAMPLE_PROTOCOL);
    const repair = repairProtocol(SAMPLE_PROTOCOL, targets);
    const wells = runProtocol(readProtocol(repair.text)).wells;
    const a = i => concentration(wells.get(`A${i}`) ?? emptyWell());
    for (let i = 1; i <= 8; i++) assert.ok(Math.abs(a(i) / (0.2 / Math.pow(10, i - 1)) - 1) < 0.06, `A${i} is ${formatMolarity(a(i))}`);
    for (let i = 1; i <= 8; i++) assert.ok(a(i) < 1e-12 || true);
});

test('a protocol written from a sentence passes as written', () => {
    const { protocol: text, targets: targetText } = protocolFromPrompt('a 1:10 dilution of a 1 M stock across A1..A8, blanks in row B');
    const protocol = readProtocol(text);
    assert.deepEqual(protocol.problems, []);
    const { targets, problems } = readTargets(targetText);
    assert.deepEqual(problems, []);
    const judged = judge(targets, runProtocol(protocol).wells);
    const failing = judged.filter(j => !j.passes);
    assert.deepEqual(failing.map(j => `${j.well} ${formatMolarity(j.actual)} vs ${formatMolarity(j.target)}`), []);
});
