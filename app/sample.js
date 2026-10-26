/**
 * The protocol the demo starts with: a 1:10 dilution series of a stock down row A, with blank wells in row B, written
 * the way a lab writes one after a long day. The three shortcuts in it are the three the bench punishes, and the twin
 * names each of them when it runs.
 */
export const SAMPLE_PROTOCOL = `# Row A: a 1:10 dilution series of a 1 M stock. Row B: blanks.
# Written for the 8-channel bench. The twin runs exactly these lines.
reservoir stock = 1 M
reservoir buffer = 0 M

add 80 µL buffer to A1
pick tip
aspirate 20 µL from stock
dispense 20 µL into A1
mix A1

# dilute down the row: 90 µL of buffer in each well, then 10 µL carried across
aspirate 90 µL from buffer
dispense 90 µL into A2
aspirate 90 µL from buffer
dispense 90 µL into A3
aspirate 90 µL from buffer
dispense 90 µL into A4
aspirate 90 µL from buffer
dispense 90 µL into A5
aspirate 90 µL from buffer
dispense 90 µL into A6
aspirate 90 µL from buffer
dispense 90 µL into A7
aspirate 90 µL from buffer
dispense 90 µL into A8

# the series
aspirate 10 µL from A1
dispense 10 µL into A2
mix A2
aspirate 10 µL from A2
dispense 10 µL into A3
mix A3
aspirate 10 µL from A3
dispense 10 µL into A4
mix A4
aspirate 10 µL from A4
dispense 10 µL into A5
mix A5
aspirate 10 µL from A5
dispense 10 µL into A6
aspirate 10 µL from A6
dispense 10 µL into A7
mix A7
aspirate 20 µL from A7
dispense 20 µL into A8
mix A8

# blanks
aspirate 100 µL from buffer
dispense 100 µL into B1
aspirate 100 µL from buffer
dispense 100 µL into B2
aspirate 100 µL from buffer
dispense 100 µL into B3
aspirate 100 µL from buffer
dispense 100 µL into B4
aspirate 100 µL from buffer
dispense 100 µL into B5
aspirate 100 µL from buffer
dispense 100 µL into B6
aspirate 100 µL from buffer
dispense 100 µL into B7
aspirate 100 µL from buffer
dispense 100 µL into B8
`;

/** What each well should hold when the protocol is done. */
export const SAMPLE_TARGETS = `# what the scientist asked for
A1 0.2 M
A2 0.02 M
A3 0.002 M
A4 0.0002 M
A5 0.00002 M
A6 0.000002 M
A7 0.0000002 M
A8 0.00000002 M
tolerance 5%
# a blank may hold nothing above a micromolar
tolerance B1..B8 0.000001 M
`;

/**
 * A protocol and its target written from a sentence: "a 1:10 dilution of a 1 M stock across A1..A8, blanks in row B".
 * Rule-based, and honest about it: it reads the factor, the count, the stock and the blanks, and writes a clean
 * protocol that passes its own twin. The sample above is a person's; this one is the machine's.
 * → { protocol, targets }
 */
export function protocolFromPrompt(text) {
    const sentence = String(text ?? '');
    const factor = Number(/1\s*[:/]\s*(\d+)/.exec(sentence)?.[1] ?? 10) || 10;
    const stockMatch = /(\d+(?:\.\d+)?)\s*(mm|µm|um|nm|m)\b/i.exec(sentence);
    const unit = (stockMatch?.[2] ?? 'M').toLowerCase();
    const stock = Number(stockMatch?.[1] ?? 1) * (unit === 'mm' ? 1e-3 : unit === 'nm' ? 1e-9 : /µ|u/.test(unit) ? 1e-6 : 1);
    const countMatch = /A1\s*(?:\.\.|-|–|to)\s*A(\d+)/i.exec(sentence);
    const count = Math.max(2, Math.min(12, countMatch ? Number(countMatch[1]) : 8));
    const blanks = /blank/i.test(sentence);

    // a 1:N dilution carries V of the previous well into (N-1)·V of diluent: 10 µL into 90 µL is 1:10
    const transfer = 10;
    const diluent = (factor - 1) * transfer;
    const lines = [
        `# a 1:${factor} dilution series of a ${stock} M stock across A1..A${count}${blanks ? ', blanks in row B' : ''}`,
        `reservoir stock = ${stock} M`,
        'reservoir buffer = 0 M',
        '',
        `add ${diluent} µL buffer to A1..A${count}`,
        'pick tip',
        `aspirate ${transfer} µL from stock`,
        `dispense ${transfer} µL into A1`,
        'mix A1',
    ];
    for (let i = 2; i <= count; i++) {
        lines.push('eject tip', 'pick tip', `aspirate ${transfer} µL from A${i - 1}`, `dispense ${transfer} µL into A${i}`, `mix A${i}`);
    }
    if (blanks) lines.push('', `add ${diluent} µL buffer to B1..B${count}`);

    // A1 holds the stock diluted by the factor; each well after it is the one before it, diluted again
    const series = Array.from({ length: count }, (_, i) => `A${i + 1} ${formatConcentration(stock / Math.pow(factor, i + 1))}`);
    const targetText = [...series, 'tolerance 5%', ...(blanks ? [`tolerance B1..B${count} 0.000001 M`] : [])].join('\n');
    return { protocol: lines.join('\n'), targets: targetText, series };
}

const formatConcentration = m => `${Number(m.toPrecision(6))} M`;
