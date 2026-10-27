// Writes the six pages (index and lab, in English, Spanish and Simplified Chinese) from one template:
//   node redesign/pages.mjs
// Every number a page prints about the sample (steps, wells, deviations, changes) comes from a run of app/sim.js here,
// so the words cannot drift from what the twin does. The plate the page opens with is the sample's judged state,
// which is also what a reader without JavaScript sees.
import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatMolarity } from '../app/sim.js';
import { plateSVG } from '../app/plate.js';
import { frames } from '../app/story.js';

const SITE = resolve(fileURLToPath(new URL('..', import.meta.url)));
const story = frames();
const judged = story.frames.find(f => f.phase === 'judge');
const first = story.first;
const pct = d => `${d >= 0 ? '+' : ''}${Math.round(d * 100)}%`;
const eject = story.repair.changes.find(c => c.rule === 'eject-before-a-transfer');
const volume = story.repair.changes.find(c => c.rule === 'one-transfer-volume');
const N = story.frames.find(f => f.phase === 'run').n;
const facts = {
    steps: N, failing: story.failing.length, changes: story.repair.changes.length,
    well: first.well, step: story.diagnosis.record.index + 1, actual: formatMolarity(first.actual), target: formatMolarity(first.target), dev: pct(first.deviation),
    volumeLine: volume?.line ?? 46,
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fill = (s, v = facts) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

const L = {
    en: {
        dir: '', lang: 'en', hreflang: 'en', name: 'English',
        title: 'VibeSci: run the protocol before the reagents',
        description: 'VibeSci reads a liquid-handling protocol, runs it on a twin of your bench, names the step and the well that fail, rewrites the protocol and proves the fix in the same twin.',
        labTitle: 'The lab · VibeSci',
        labDescription: "Run a liquid-handling protocol on VibeSci's twin of the bench: the step log, the failing well, the cause, and the rewritten protocol proven in the same twin.",
        skip: 'Skip to the content', site: 'Site', language: 'Language', close: 'Close',
        tabs: ['The bench', 'The lab', 'What it catches', 'Contact'],
        entry: ['Entry 001', 'Lab notebook', 'Bench: a twin'],
        h1: 'Run the protocol <em>before</em> the reagents.',
        lede: 'Paste a liquid-handling protocol. VibeSci runs it on a twin of your bench, names the step and the well that fail, and proves the rewrite.',
        ctaLab: 'Run one in the twin', ctaPlate: 'Watch a plate fail',
        filmLabel: 'Film: generated with fal, printed in two inks. Not lab footage.',
        filmPause: 'Pause the films',
        benchH: 'A Tuesday dilution series.',
        sim: 'Simulated in the twin', unverified: 'Not verified on a bench',
        plateTitle: 'A 96-well plate seen from above: liquid is mint, and the more a well carries, the pinker it is.',
        startCaption: 'The sample protocol, {steps} steps, as a lab writes it after a long day. {failing} wells come out wrong; the first is {well} at step {step}: {actual} where {target} was asked ({dev}).',
        back: 'Previous step', next: 'Next step', toJudge: 'Jump to the verdict', toFix: 'Jump to the rewrite',
        skipPlate: 'Skip past the plate',
        catchesH: 'What the twin catches',
        slides: [
            ['Carryover', 'A tip that still holds the last solution leaves a film in the next well. On a blank, that film is the result.', 'tips'],
            ['A missed mix', 'An unmixed well is a bolus sitting on diluent. The next aspirate takes the bolus, and the series walks away from its numbers.', 'bloom'],
            ['A wrong volume', 'Line {volumeLine} of the sample moves 20 µL where the series moves 10. The dilution factor is no longer the one on the page.', 'volume'],
            ['A target nothing meets', 'A series can agree with itself and still miss the assay. Every well is held to its target, not to its neighbour.', 'ladder'],
        ],
        written: 'written', moved: 'moved', target: 'target', twin: 'the twin',
        reelLine: 'Every line it adds says why.',
        openH: 'The lab is open.',
        openP: 'Paste your protocol and a target per well, or describe one in a sentence. It runs in your browser: nothing is sent, no model is called.',
        openCta: 'Open the lab',
        plansH: 'Next in the notebook',
        planned: 'Planned, not built',
        plans: ['A photo of your bench becomes the twin’s deck.', 'A model reads the protocol out of a PDF (that needs a server to hold its key).', 'The twin runs in 3D beside the plate.'],
        contactH: 'Write to us',
        foot: 'VibeSci is a company of CommandAGI. Its team are AI agents, and they say so. Prices are set at launch; the demo is free.',
        notice: 'The demo runs on a model of a bench. It is not a substitute for your lab’s own validation.',
        // the lab
        labH: 'The lab',
        labLede: 'A protocol on the left, the bench on the right. Run it, read the step log, then ask VibeSci to fix it: the rewrite runs in the same twin, and the table has to come back clean.',
        promptLabel: 'Describe the protocol in a sentence', write: 'Write it',
        protocolLabel: 'The protocol, as the lab wrote it',
        help: 'One step a line: <code>pick tip</code>, <code>aspirate 10 µL from A1</code>, <code>dispense 10 µL into A2</code>, <code>mix A2</code>, <code>eject tip</code>, <code>add 90 µL buffer to A1..A8</code>. <code>reservoir stock = 1 M</code> names a bottle.',
        targetsLabel: 'The target per well', run: 'Run it in the twin', fix: 'VibeSci, fix it',
        canvas: 'A 96-well plate seen from the bench, with the wells coloured by what they hold',
        replay: 'Replay', step1: 'Step 1', did: 'What the bench did', noticed: 'What the bench noticed',
        tableH: 'Target against the twin', well: 'Well', tgt: 'Target', found: 'What the twin found', verdict: 'Verdict',
        rewriteH: 'The rewrite', rewrote: 'What VibeSci rewrote', rewroteNone: 'Ask for the fix and every line it adds is listed here, with the reason.',
        after: 'The protocol after the rewrite', afterRun: 'The rewritten run',
    },
    es: {
        dir: 'es/', lang: 'es', hreflang: 'es', name: 'Español',
        title: 'VibeSci: ejecuta el protocolo antes que los reactivos',
        description: 'VibeSci lee un protocolo de manipulación de líquidos, lo ejecuta en un gemelo de tu mesa, nombra el paso y el pocillo que fallan, reescribe el protocolo y demuestra la corrección en el mismo gemelo.',
        labTitle: 'El laboratorio · VibeSci',
        labDescription: 'Ejecuta un protocolo de manipulación de líquidos en el gemelo de la mesa de VibeSci: el registro de pasos, el pocillo que falla, la causa y el protocolo reescrito, demostrado en el mismo gemelo.',
        skip: 'Saltar al contenido', site: 'Sitio', language: 'Idioma', close: 'Cerrar',
        tabs: ['La mesa', 'El laboratorio', 'Qué detecta', 'Contacto'],
        entry: ['Entrada 001', 'Cuaderno de laboratorio', 'Mesa: un gemelo'],
        h1: 'Ejecuta el protocolo <em>antes</em> que los reactivos.',
        lede: 'Pega un protocolo de manipulación de líquidos. VibeSci lo ejecuta en un gemelo de tu mesa, nombra el paso y el pocillo que fallan, y demuestra la reescritura.',
        ctaLab: 'Ejecuta uno en el gemelo', ctaPlate: 'Mira fallar una placa',
        filmLabel: 'Película: generada con fal, impresa en dos tintas. No es metraje de laboratorio.',
        filmPause: 'Pausar las películas',
        benchH: 'Una serie de diluciones de un martes.',
        sim: 'Simulado en el gemelo', unverified: 'No verificado en una mesa',
        plateTitle: 'Una placa de 96 pocillos vista desde arriba: el líquido es menta, y cuanto más lleva un pocillo, más rosa es.',
        startCaption: 'El protocolo de ejemplo, {steps} pasos, como lo escribe un laboratorio después de un día largo. {failing} pocillos salen mal; el primero es {well} en el paso {step}: {actual} donde se pedían {target} ({dev}).',
        back: 'Paso anterior', next: 'Paso siguiente', toJudge: 'Ir al veredicto', toFix: 'Ir a la reescritura',
        skipPlate: 'Saltar la placa',
        catchesH: 'Qué detecta el gemelo',
        slides: [
            ['Arrastre', 'Una punta que todavía guarda la última solución deja una película en el pocillo siguiente. En un blanco, esa película es el resultado.', 'tips'],
            ['Una mezcla olvidada', 'Un pocillo sin mezclar es un bolo sobre el diluyente. La siguiente aspiración toma el bolo y la serie se aleja de sus números.', 'bloom'],
            ['Un volumen equivocado', 'La línea {volumeLine} del ejemplo mueve 20 µL donde la serie mueve 10. El factor de dilución ya no es el de la página.', 'volume'],
            ['Un objetivo que nada cumple', 'Una serie puede ser coherente consigo misma y aun así no servir al ensayo. Cada pocillo se compara con su objetivo, no con su vecino.', 'ladder'],
        ],
        written: 'escrito', moved: 'movido', target: 'objetivo', twin: 'el gemelo',
        reelLine: 'Cada línea que añade dice por qué.',
        openH: 'El laboratorio está abierto.',
        openP: 'Pega tu protocolo y un objetivo por pocillo, o descríbelo en una frase. Corre en tu navegador: no se envía nada y no se llama a ningún modelo.',
        openCta: 'Abrir el laboratorio',
        plansH: 'Lo siguiente en el cuaderno',
        planned: 'Previsto, no construido',
        plans: ['Una foto de tu mesa se convierte en la cubierta del gemelo.', 'Un modelo lee el protocolo de un PDF (necesita un servidor que guarde su clave).', 'El gemelo corre en 3D junto a la placa.'],
        contactH: 'Escríbenos',
        foot: 'VibeSci es una empresa de CommandAGI. Su equipo son agentes de IA, y lo dicen. Los precios se fijan en el lanzamiento; la demostración es gratuita.',
        notice: 'La demostración corre sobre un modelo de una mesa. No sustituye la validación propia de tu laboratorio.',
        labH: 'El laboratorio',
        labLede: 'Un protocolo a la izquierda, la mesa a la derecha. Ejecútalo, lee el registro de pasos y luego pídele a VibeSci que lo arregle: la reescritura corre en el mismo gemelo y la tabla tiene que volver limpia.',
        promptLabel: 'Describe el protocolo en una frase', write: 'Escríbelo',
        protocolLabel: 'El protocolo, tal como lo escribió el laboratorio',
        help: 'Un paso por línea: <code>pick tip</code>, <code>aspirate 10 µL from A1</code>, <code>dispense 10 µL into A2</code>, <code>mix A2</code>, <code>eject tip</code>, <code>add 90 µL buffer to A1..A8</code>. <code>reservoir stock = 1 M</code> nombra una botella.',
        targetsLabel: 'El objetivo por pocillo', run: 'Ejecútalo en el gemelo', fix: 'VibeSci, corrígelo',
        canvas: 'Una placa de 96 pocillos vista desde la mesa, con los pocillos coloreados según lo que contienen',
        replay: 'Repetir', step1: 'Paso 1', did: 'Lo que hizo la mesa', noticed: 'Lo que notó la mesa',
        tableH: 'El objetivo frente al gemelo', well: 'Pocillo', tgt: 'Objetivo', found: 'Lo que encontró el gemelo', verdict: 'Veredicto',
        rewriteH: 'La reescritura', rewrote: 'Lo que VibeSci reescribió', rewroteNone: 'Pide la corrección y cada línea que añade aparece aquí, con su razón.',
        after: 'El protocolo después de la reescritura', afterRun: 'La ejecución reescrita',
    },
    zh: {
        dir: 'zh/', lang: 'zh-Hans', hreflang: 'zh-Hans', name: '简体中文',
        title: 'VibeSci：先跑协议，再动试剂',
        description: 'VibeSci 读取一份移液协议，在你的实验台的数字孪生上运行，指出出错的步骤和孔，改写协议，并在同一个孪生上证明修复有效。',
        labTitle: '实验室 · VibeSci',
        labDescription: '在 VibeSci 的实验台孪生上运行一份移液协议：步骤记录、出错的孔、原因，以及在同一个孪生上验证过的改写协议。',
        skip: '跳到正文', site: '网站', language: '语言', close: '关闭',
        tabs: ['实验台', '实验室', '它能发现什么', '联系'],
        entry: ['条目 001', '实验记录本', '实验台：孪生'],
        h1: '先跑协议，<em>再</em>动试剂。',
        lede: '粘贴一份移液协议。VibeSci 在你的实验台的孪生上运行它，指出出错的步骤和孔，并证明改写有效。',
        ctaLab: '在孪生上跑一份', ctaPlate: '看一块板怎么失败',
        filmLabel: '影片：用 fal 生成，以两种油墨印刷。不是实验室实拍。',
        filmPause: '暂停影片',
        benchH: '一个周二的稀释系列。',
        sim: '在孪生上模拟', unverified: '未在实验台上验证',
        plateTitle: '从上方看一块 96 孔板：液体是薄荷色，孔里携带的物质越多，颜色越粉。',
        startCaption: '示例协议共 {steps} 步，就像实验室忙了一整天后写的那样。{failing} 个孔结果不对；第一个是第 {step} 步的 {well}：实测 {actual}，目标 {target}（{dev}）。',
        back: '上一步', next: '下一步', toJudge: '跳到判定', toFix: '跳到改写',
        skipPlate: '跳过这块板',
        catchesH: '孪生能发现什么',
        slides: [
            ['残留', '吸头里还留着上一种溶液，就会在下一个孔里留下一层膜。在空白孔里，这层膜就是结果。', 'tips'],
            ['漏了混匀', '没混匀的孔是一团浮在稀释液上的液团。下一次吸取拿走的是液团，整个系列就偏离了自己的数字。', 'bloom'],
            ['体积写错', '示例第 {volumeLine} 行转移 20 µL，而系列转移的是 10 µL。稀释倍数已经不是纸上写的那个。', 'volume'],
            ['没有一步能达成的目标', '一个系列可以自洽，却仍然达不到实验的要求。每个孔都和它的目标比，而不是和邻孔比。', 'ladder'],
        ],
        written: '写的', moved: '实际', target: '目标', twin: '孪生',
        reelLine: '它加的每一行都写明原因。',
        openH: '实验室开着。',
        openP: '粘贴你的协议和每个孔的目标，或者用一句话描述。它在你的浏览器里运行：什么都不发送，也不调用任何模型。',
        openCta: '打开实验室',
        plansH: '记录本的下一页',
        planned: '计划中，尚未构建',
        plans: ['一张实验台的照片变成孪生的台面。', '一个模型从 PDF 里读出协议（这需要一台保存密钥的服务器）。', '孪生在板旁以 3D 运行。'],
        contactH: '写信给我们',
        foot: 'VibeSci 是 CommandAGI 旗下的公司。它的团队是 AI 智能体，并且如实说明。价格在发布时确定；演示免费。',
        notice: '演示运行在一个实验台的模型上，不能替代你的实验室自己的验证。',
        labH: '实验室',
        labLede: '左边是协议，右边是实验台。先运行，看步骤记录，然后让 VibeSci 修好它：改写后的版本在同一个孪生上运行，表格必须全部通过。',
        promptLabel: '用一句话描述这个协议', write: '写出来',
        protocolLabel: '协议原文（实验室写的那一份）',
        help: '一行一步：<code>pick tip</code>、<code>aspirate 10 µL from A1</code>、<code>dispense 10 µL into A2</code>、<code>mix A2</code>、<code>eject tip</code>、<code>add 90 µL buffer to A1..A8</code>。<code>reservoir stock = 1 M</code> 给一瓶液体命名。',
        targetsLabel: '每个孔的目标', run: '在孪生上运行', fix: 'VibeSci，修复它',
        canvas: '从实验台看一块 96 孔板，孔的颜色表示其中的物质',
        replay: '重放', step1: '第 1 步', did: '实验台做了什么', noticed: '实验台发现了什么',
        tableH: '目标与孪生实测', well: '孔', tgt: '目标', found: '孪生实测', verdict: '结果',
        rewriteH: '改写', rewrote: 'VibeSci 改写了什么', rewroteNone: '请求修复后，它加的每一行都列在这里，并说明原因。',
        after: '改写后的协议', afterRun: '改写后的运行',
    },
};

const film = (name, up, cls = 'film', lazy = true) =>
    `<video class="${cls}" muted loop playsinline ${lazy ? 'preload="none"' : 'preload="metadata"'} poster="${up}media/${name}.webp" aria-hidden="true" tabindex="-1">` +
    `<source src="${up}media/${name}.webm" type="video/webm; codecs=av01.0.05M.08"><source src="${up}media/${name}.mp4" type="video/mp4"></video>`;

function head(s, page) {
    const up = s.dir ? '../' : '';
    const file = page === 'lab' ? 'lab.html' : 'index.html';
    const title = page === 'lab' ? s.labTitle : s.title;
    const description = page === 'lab' ? s.labDescription : s.description;
    const alt = Object.values(L).map(o => `<link rel="alternate" hreflang="${o.hreflang}" href="${up}${o.dir}${file}">`).join('\n');
    return `<!doctype html>
<html lang="${s.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#f6efe1">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="https://vibesci.commandagi.app/og.png">
<meta property="og:url" content="https://vibesci.commandagi.app/${s.dir}${file}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${up}fonts/recursive.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${up}style.css">
<link rel="icon" href="${up}mark.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${up}touch-icon.png">
${alt}
</head>`;
}

function header(s, page) {
    const up = s.dir ? '../' : '';
    const here = page === 'lab' ? 'lab.html' : 'index.html';
    const idx = page === 'lab' ? 'index.html' : '';
    const tabs = [
        [`${idx}#bench`, page === 'index'],
        ['lab.html', page === 'lab'],
        [`${idx}#catches`, false],
        [`${idx}#contact`, false],
    ];
    const langs = Object.values(L).map(o => `<li><a href="${up}${o.dir}${here}" hreflang="${o.hreflang}"${o === s ? ' aria-current="true"' : ''}><span lang="${o.hreflang}">${o.name}</span></a></li>`).join('');
    const others = Object.values(L).filter(o => o !== s).map(o => `<a href="${up}${o.dir}${here}" hreflang="${o.hreflang}" lang="${o.hreflang}">${o.name}</a>`).join(' · ');
    return `<body class="${page}">
<a class="skip" href="#main">${s.skip}</a>
<header class="head">
  <a class="wordmark" href="index.html"><img src="${up}wordmark.svg" alt="VibeSci" width="197" height="40"></a>
  <nav class="tabs" aria-label="${s.site}">
    ${tabs.map(([href, current], i) => `<a class="tab" href="${href}"${current ? ' aria-current="page"' : ''}><span class="n">0${i + 1}</span> <span class="w">${s.tabs[i]}</span></a>`).join('\n    ')}
    <span class="lang">
      <button type="button" class="tab lang-btn" commandfor="lang-dialog" command="show-modal" aria-haspopup="dialog" aria-label="${s.language}" title="${s.language}"><span aria-hidden="true">A/<span lang="zh-Hans">文</span></span></button>
      <noscript>${others}</noscript>
    </span>
  </nav>
  <dialog id="lang-dialog" class="lang-dialog" aria-labelledby="lang-dialog-title" closedby="any">
    <div class="lang-dialog__box">
      <div class="lang-dialog__head"><h2 id="lang-dialog-title">${s.language}</h2><form method="dialog"><button class="lang-dialog__close" aria-label="${s.close}">✕</button></form></div>
      <ul class="lang-list" role="list">${langs}</ul>
    </div>
  </dialog>
</header>`;
}

function footer(s, page) {
    const other = page === 'lab' ? `<a href="index.html">${s.tabs[0]}</a>` : `<a href="lab.html">${s.tabs[1]}</a>`;
    return `<footer class="foot">
  <span>${s.foot}</span>
  <span>${other} · <a href="mailto:hello@vibesci.dev">hello@vibesci.dev</a></span>
</footer>`;
}

/** Slide 3: the volume the series moves against the volume line N moves, as two tips drawn to scale. */
function volumeDiagram(s) {
    const tip = (x, ul, label, ink) => {
        const h = ul * 9;
        return `<g transform="translate(${x} 0)"><path d="M0 20 L80 20 L60 260 L20 260 Z" fill="none" stroke="#0b4f51" stroke-width="4"/>` +
            `<clipPath id="c${x}"><path d="M0 20 L80 20 L60 260 L20 260 Z"/></clipPath><rect clip-path="url(#c${x})" x="0" y="${260 - h}" width="80" height="${h}" fill="${ink}"/>` +
            `<text class="big" x="40" y="310" text-anchor="middle" font-size="44">${ul} µL</text><text x="40" y="340" text-anchor="middle" font-size="18">${label}</text></g>`;
    };
    return `<svg class="diagram" viewBox="0 0 360 350" role="img" aria-label="10 µL ${s.written}, 20 µL ${s.moved}">` + tip(40, 10, s.written, '#a4efd6') + tip(220, 20, s.moved, '#ff48b0') + '</svg>';
}

/** Slide 4: each well's target against what the twin found in the sample, on a log ladder (real numbers). */
function ladderDiagram(s) {
    const all = Array.from({ length: 8 }, (_, i) => ({ w: `A${i + 1}`, target: 0.2 / Math.pow(10, i), actual: judged.state.get(`A${i + 1}`) }));
    const y = m => 30 + (Math.log10(0.2) - Math.log10(Math.max(m, 1e-10))) / (Math.log10(0.2) + 10) * 300;
    const parts = all.map((r, i) => {
        const x = 60 + i * 40;
        return `<line x1="${x - 14}" x2="${x + 14}" y1="${y(r.target)}" y2="${y(r.target)}" stroke="#0b4f51" stroke-width="4"/>` +
            `<circle cx="${x}" cy="${y(r.actual)}" r="8" fill="#ff48b0" stroke="#b8126a" stroke-width="2"/>` +
            `<text x="${x}" y="356" text-anchor="middle" font-size="15">${r.w}</text>`;
    }).join('');
    return `<svg class="diagram" viewBox="0 0 380 370" role="img" aria-label="${esc(all.map(r => `${r.w}: ${s.target} ${formatMolarity(r.target)}, ${s.twin} ${formatMolarity(r.actual)}`).join('; '))}">` +
        `<line x1="40" x2="40" y1="20" y2="336" stroke="#0b4f51" stroke-width="2"/>` + parts +
        `<g transform="translate(220 40)"><line x1="0" x2="26" y1="0" y2="0" stroke="#0b4f51" stroke-width="4"/><text x="34" y="6" font-size="15">${s.target}</text>` +
        `<circle cx="13" cy="28" r="8" fill="#ff48b0" stroke="#b8126a" stroke-width="2"/><text x="34" y="34" font-size="15">${s.twin}</text></g></svg>`;
}

function index(s) {
    const up = s.dir ? '../' : '';
    const startCaption = fill(s.startCaption);
    const slides = s.slides.map(([h, p, pic], i) => {
        const media = pic === 'volume' ? volumeDiagram(s) : pic === 'ladder' ? ladderDiagram(s) : film(pic, up);
        return `<article class="slide" aria-labelledby="slide-${i + 1}">
    <p class="slide__n" aria-hidden="true">0${i + 1}</p>
    <div class="slide__text"><h3 id="slide-${i + 1}">${h}</h3><p>${fill(p)}</p></div>
    <figure class="slide__pic">${media}${pic === 'tips' || pic === 'bloom' ? `<figcaption class="label">${s.filmLabel}</figcaption>` : `<figcaption class="label">${s.sim} · ${s.unverified}</figcaption>`}</figure>
  </article>`;
    }).join('\n  ');
    const ejectText = eject ? `<span>+ ${esc(eject.text)}</span>\n<span class="why">  # ${esc(eject.why)}</span>` : '';
    return `${head(s, 'index')}
${header(s, 'index')}
<main id="main">
  <section class="cover" aria-labelledby="cover-h">
    ${film('drop', up, 'film', false)}
    <p class="film-note"><span class="flag unverified">${s.filmLabel}</span> <button type="button" class="film-toggle" data-films aria-pressed="false">${s.filmPause}</button></p>
    <div class="cover__sheet">
      <p class="entry label">${s.entry.map(e => `<span>${e}</span>`).join('')}</p>
      <h1 id="cover-h" class="misreg">${s.h1}</h1>
      <p class="cover__lede">${s.lede}</p>
      <p class="cta-row"><a class="print" href="lab.html">${s.ctaLab} →</a> <a class="pencil" href="#bench">${s.ctaPlate} ↓</a></p>
    </div>
  </section>

  <section id="bench" class="bench" aria-labelledby="bench-h">
    <div class="bench__track">
      <div class="bench__stick">
        <header class="bench__head">
          <h2 id="bench-h" class="misreg">${s.benchH}</h2>
          <p class="bench__flags"><span class="flag sim">${s.sim}</span><span class="flag unverified">${s.unverified}</span></p>
        </header>
        <figure class="plate-fig">
          <div class="plate-wrap">${plateSVG({ state: judged.state, wet: judged.wet, failing: judged.failing, title: esc(s.plateTitle) })}<p class="stamp" aria-hidden="true"><span>${s.lang === 'en' ? 'Fails' : s.lang === 'es' ? 'Falla' : '失败'}</span><small>${facts.well} ${facts.dev}</small></p></div>
        </figure>
        <div class="bench__side">
          <p class="caption" aria-live="polite">${startCaption}</p>
          <div class="bench__ctrl">
            <button type="button" class="btn small quiet" data-step="back" aria-label="${s.back}">◀</button>
            <button type="button" class="btn small quiet" data-step="next" aria-label="${s.next}">▶</button>
            <button type="button" class="btn small quiet" data-step="judge">${s.toJudge}</button>
            <button type="button" class="btn small" data-step="fix">${s.toFix}</button>
          </div>
          <p class="bench__meta"><output>${s.sim}</output> <a class="pencil" href="#catches">${s.skipPlate} ↓</a></p>
          <ol class="tape" aria-hidden="true"></ol>
        </div>
      </div>
    </div>
  </section>

  <section id="catches" class="catches" aria-labelledby="catches-h">
    <h2 id="catches-h" class="catches__title misreg">${s.catchesH}</h2>
  ${slides}
  </section>

  <section class="reel" aria-labelledby="reel-h">
    ${film('plate', up)}
    <div>
      <h2 id="reel-h" class="reel__line misreg">${s.reelLine}</h2>
      <pre class="reel__code" aria-label="${esc(eject ? eject.text + ': ' + eject.why : '')}">${ejectText}</pre>
    </div>
    <p class="film-label label"><span class="flag unverified">${s.filmLabel}</span></p>
  </section>

  <section class="open" aria-labelledby="open-h">
    <h2 id="open-h" class="misreg">${s.openH}</h2>
    <p>${s.openP}</p>
    <p class="cta-row"><a class="print" href="lab.html">${s.openCta} →</a></p>
    <p class="notice">${s.notice}</p>
  </section>

  <section class="plans" aria-labelledby="plans-h">
    <h2 id="plans-h">${s.plansH}</h2>
    <ol>${s.plans.map(p => `<li><span class="label">${s.planned}</span>${p}</li>`).join('')}</ol>
  </section>

  <section id="contact" class="contact" aria-labelledby="contact-h">
    <h2 id="contact-h" class="misreg">${s.contactH}</h2>
    <a href="mailto:hello@vibesci.dev">hello@vibesci.dev</a>
  </section>
</main>
${footer(s, 'index')}
<script type="module" src="${up}app/story.js"></script>
<script type="module" src="${up}app/lang.js"></script>
</body>
</html>
`;
}

function lab(s) {
    const up = s.dir ? '../' : '';
    return `${head(s, 'lab')}
${header(s, 'lab')}
<main id="main" class="lab">
  <div class="lab__head">
    <p class="lab__flags"><span class="flag sim">${s.sim}</span><span class="flag unverified">${s.unverified}</span></p>
    <h1 class="misreg">${s.labH}</h1>
    <p>${s.labLede}</p>
  </div>
  <div class="prompt">
    <input type="text" id="prompt" aria-label="${s.promptLabel}">
    <button type="button" class="btn quiet" id="build">${s.write}</button>
  </div>

  <div class="console">
    <div class="panel">
      <div class="field">
        <label for="protocol">${s.protocolLabel}</label>
        <textarea id="protocol" spellcheck="false" aria-describedby="protocolhelp"></textarea>
        <p id="protocolhelp" class="muted" style="font-size:0.85rem;margin:0">${s.help}</p>
      </div>
      <div class="field">
        <label for="targets">${s.targetsLabel}</label>
        <textarea id="targets" spellcheck="false"></textarea>
      </div>
      <div class="row">
        <button type="button" class="btn" id="run">${s.run}</button>
        <button type="button" class="btn quiet" id="fix">${s.fix}</button>
      </div>
      <div class="problems" id="problems" hidden></div>
      <div class="problems" id="targetproblems" hidden></div>
    </div>

    <div class="panel">
      <canvas id="stage" width="720" height="360" role="img" aria-label="${s.canvas}"></canvas>
      <div class="row" style="justify-content:space-between">
        <span class="row">
          <button type="button" class="btn small quiet" id="back" aria-label="${s.back}">◀</button>
          <button type="button" class="btn small quiet" id="replay">${s.replay}</button>
          <button type="button" class="btn small quiet" id="forward" aria-label="${s.next}">▶</button>
        </span>
        <span id="stepcount" class="mono">${s.step1}</span>
      </div>
      <div class="verdict" id="verdict" role="status" hidden></div>
      <h3>${s.did}</h3>
      <ol class="log" id="steps"></ol>
      <h3>${s.noticed}</h3>
      <ul class="log" id="warnings"></ul>
    </div>
  </div>

  <section class="section" aria-labelledby="table-title">
    <h2 id="table-title" class="misreg">${s.tableH}</h2>
    <table class="results" id="results">
      <thead><tr><th scope="col">${s.well}</th><th scope="col">${s.tgt}</th><th scope="col">${s.found}</th><th scope="col">${s.verdict}</th></tr></thead>
      <tbody></tbody>
    </table>
  </section>

  <section class="section" aria-labelledby="fix-title">
    <h2 id="fix-title" class="misreg">${s.rewriteH}</h2>
    <div class="verdict" id="fixverdict" role="status" hidden></div>
    <div class="two">
      <div>
        <h3>${s.rewrote}</h3>
        <ul class="changes" id="changes"><li class="none muted">${s.rewroteNone}</li></ul>
      </div>
      <div>
        <h3>${s.after}</h3>
        <pre class="code" id="fixedcode" hidden></pre>
        <h3>${s.afterRun}</h3>
        <table class="results" id="after">
          <thead><tr><th scope="col">${s.well}</th><th scope="col">${s.found}</th><th scope="col">${s.verdict}</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  </section>
  <p class="notice mono" style="margin-top:40px">${s.notice}</p>
</main>
${footer(s, 'lab')}
<script type="module" src="${up}app/lab.js"></script>
<script type="module" src="${up}app/lang.js"></script>
</body>
</html>
`;
}

for (const s of Object.values(L)) {
    await mkdir(join(SITE, s.dir || '.'), { recursive: true });
    await writeFile(join(SITE, s.dir, 'index.html'), index(s));
    await writeFile(join(SITE, s.dir, 'lab.html'), lab(s));
}
console.log('wrote 6 pages', JSON.stringify(facts));
