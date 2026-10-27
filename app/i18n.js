/**
 * The words of the bench in the page's language: the console (lab.js) and the plate on the home page (story.js) say
 * the same things the same way. The model records codes and numbers; these turn them into sentences.
 */
export const LOCALE = (globalThis.document?.documentElement.lang || 'en').toLowerCase();
export const STRINGS = {
    en: {
        run: 'Run it in the twin', fix: 'VibeSci, fix it', build: 'Write it', replay: 'Replay', pause: 'Pause',
        step: 'Step', back: 'Previous step', forward: 'Next step', reset: 'Back to the protocol',
        passed: 'Every well is within tolerance.', also: '{count} wells are out of tolerance: {wells}', failed: 'Fails at step {step}, well {well}: {actual} where {target} was asked ({deviation}).',
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
        passed: 'Todos los pocillos están dentro de la tolerancia.', also: '{count} pocillos están fuera de tolerancia: {wells}', failed: 'Falla en el paso {step}, pocillo {well}: {actual} donde se pedían {target} ({deviation}).',
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
        passed: '每个孔都在容差内。', also: '有 {count} 个孔超出容差：{wells}', failed: '第 {step} 步、{well} 孔失败：实测 {actual}，目标 {target}（{deviation}）。',
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
export const T = STRINGS[LOCALE] ?? STRINGS.en;
export const t = (key, values = {}) => {
    const raw = key.split('.').reduce((o, k) => (o ? o[k] : undefined), T) ?? key;
    return String(raw).replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');
};

/** A warning in the page's language: the model records a code and the numbers it saw. */
export const warningText = w => {
    const p = w.params ?? {};
    const name = { dirty_tip: 'dirtyTip', carryover: 'carryover', unknown_solution: 'unknownSolution', unknown_well: 'unknownWell', no_tip: 'noTip' }[w.code];
    const raw = name ? T.warn?.[name] : undefined;
    return raw ? raw.replace(/\{(\w+)\}/g, (_, k) => p[k] ?? '') : w.text;
};

/** The words of plate 01 on the home page (story.js). */
const STORY_STRINGS = {
    en: {
        running: 'The sample protocol, {n} steps, as a lab writes it after a long day. The twin runs exactly these lines.',
        warned: 'Step {step}: {why}.',
        judged: '{count} wells out of tolerance. The first goes wrong at step {step}: {well} holds {actual} where {target} was asked ({deviation}), from {cause}.',
        fixing: 'VibeSci rewrites it: {changes} changes, each with its reason. The rewrite runs in the same twin.',
        passed: 'Same twin, every well within tolerance. Simulated: nobody has run it on a bench yet.',
        counter: 'step {k} of {n} · {which}', sample: 'the sample', rewrite: 'the rewrite',
        judgedShort: 'judged against the target', sameTwin: 'the rewrite, judged',
        stampFail: 'Fails', stampPass: 'Passes', stampPassSmall: 'in the twin',
        filmPause: 'Pause the films', filmPlay: 'Play the films',
    },
    es: {
        running: 'El protocolo de ejemplo, {n} pasos, como lo escribe un laboratorio después de un día largo. El gemelo ejecuta exactamente estas líneas.',
        warned: 'Paso {step}: {why}.',
        judged: '{count} pocillos fuera de tolerancia. El primero falla en el paso {step}: {well} tiene {actual} donde se pedían {target} ({deviation}), por {cause}.',
        fixing: 'VibeSci lo reescribe: {changes} cambios, cada uno con su razón. La reescritura corre en el mismo gemelo.',
        passed: 'El mismo gemelo, todos los pocillos dentro de la tolerancia. Simulado: nadie lo ha ejecutado aún en una mesa.',
        counter: 'paso {k} de {n} · {which}', sample: 'el ejemplo', rewrite: 'la reescritura',
        judgedShort: 'comparado con el objetivo', sameTwin: 'la reescritura, juzgada',
        stampFail: 'Falla', stampPass: 'Pasa', stampPassSmall: 'en el gemelo',
        filmPause: 'Pausar las películas', filmPlay: 'Reproducir las películas',
    },
    'zh-hans': {
        running: '示例协议共 {n} 步，就像实验室忙了一整天后写的那样。孪生严格按这些行运行。',
        warned: '第 {step} 步：{why}。',
        judged: '有 {count} 个孔超出容差。第一个错在第 {step} 步：{well} 实测 {actual}，目标 {target}（{deviation}），原因是{cause}。',
        fixing: 'VibeSci 改写了它：{changes} 处改动，每一处都写明原因。改写后的协议在同一个孪生上运行。',
        passed: '同一个孪生，每个孔都在容差内。这是模拟：还没有人在实验台上跑过它。',
        counter: '第 {k} / {n} 步 · {which}', sample: '示例', rewrite: '改写',
        judgedShort: '与目标比对', sameTwin: '改写后的结果',
        stampFail: '失败', stampPass: '通过', stampPassSmall: '在孪生上',
        filmPause: '暂停影片', filmPlay: '播放影片',
    },
};
export const STORY = STORY_STRINGS[LOCALE] ?? STORY_STRINGS.en;
