// VibeSci's generated film: one fal text-to-video call per clip, then ffmpeg prints each clip in two riso inks.
// The key comes from the .env cascade (COMMANDAGI_ENV_ROOT), is sent only to fal and is never printed or written.
//
//   COMMANDAGI_ENV_ROOT=/path/to/commandagi node redesign/media.mjs [clip …]   generate (skips clips already in .raw/)
//   node redesign/media.mjs --encode                                             only re-print .raw/ into media/
//
// Raw downloads stay in redesign/.raw/ (ignored; a dot folder is never served). The site serves media/<clip>.webm
// (AV1), media/<clip>.mp4 (H.264, the fallback) and media/<clip>.webp (the poster). FFMPEG names an ffmpeg with
// libaom, libx264 and libwebp (the imageio-ffmpeg wheel's has them).
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(fileURLToPath(new URL('..', import.meta.url)));
const RAW = join(SITE, 'redesign', '.raw');
const OUT = join(SITE, 'media');
const MODEL = 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video';

// The source is shot flat and bright on purpose: the riso print below throws the colour away and keeps the tones.
const LOOK = 'high-key macro photography, bright white seamless background, crisp focus, strong graphic shapes, slow motion, locked-off camera, no text, no labels, no logos, no people, no faces';
export const CLIPS = {
    drop: 'Extreme macro of a single drop of dark ink falling from a clear plastic pipette tip into one round well of a clear 96-well microplate, the drop hits the liquid surface and a ring of ripples spreads, slow motion',
    bloom: 'Overhead macro of dark ink blooming and curling into clear water inside a small round well, slow plumes and tendrils that never fully mix, slow motion',
    tips: 'Macro of rows of clear disposable pipette tips standing in a rack, a thin film of liquid clinging inside one tip, a droplet sliding slowly down its inner wall',
    plate: 'Slow overhead pan across a clear 96-well microplate on a white bench, the wells holding a gradient of dark to pale liquid from left to right, shallow depth of field',
};

async function key() {
    const root = process.env.COMMANDAGI_ENV_ROOT;
    if (!root) throw new Error('set COMMANDAGI_ENV_ROOT to the folder whose .env holds SVC__FAL__MAIN__API_KEY');
    for (const file of ['.env.api', '.env']) {
        const text = await readFile(join(root, file), 'utf8').catch(() => '');
        const line = text.split('\n').find(l => l.startsWith('SVC__FAL__MAIN__API_KEY='));
        if (line) return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
    }
    throw new Error('SVC__FAL__MAIN__API_KEY is not in the cascade');
}

const exists = p => access(p).then(() => true, () => false);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function generate(name, secret) {
    const raw = join(RAW, `${name}.mp4`);
    if (await exists(raw)) return console.log(`have ${name}`);
    const headers = { authorization: `Key ${secret}`, 'content-type': 'application/json' };
    const body = { prompt: `${CLIPS[name]}. ${LOOK}`, duration: '5', aspect_ratio: '16:9', negative_prompt: 'text, watermark, logo, faces, people, hands, blur, distortion, cartoon', cfg_scale: 0.5 };
    const queued = await (await fetch(`https://queue.fal.run/${MODEL}`, { method: 'POST', headers, body: JSON.stringify(body) })).json();
    if (!queued.status_url) throw new Error(`${name}: ${JSON.stringify(queued).slice(0, 300)}`);
    for (;;) {
        await sleep(5000);
        const status = await (await fetch(queued.status_url, { headers })).json();
        if (status.status === 'COMPLETED') break;
        if (status.status !== 'IN_QUEUE' && status.status !== 'IN_PROGRESS') throw new Error(`${name}: ${JSON.stringify(status).slice(0, 300)}`);
    }
    const result = await (await fetch(queued.response_url, { headers })).json();
    const url = result.video?.url;
    if (!url) throw new Error(`${name}: no video in ${JSON.stringify(result).slice(0, 300)}`);
    await writeFile(raw, Buffer.from(await (await fetch(url)).arrayBuffer()));
    console.log(`made ${name} (${MODEL}, 5 s)`);
}

const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';

// The riso print: the clip's tones split into two plates. Teal carries the shadows (a hard curve), pink the
// mid-tones and stays out of the deepest shadow, so an overprint reads as two inks and not as black; each plate multiplies its ink onto white, the teal plate is set 5 px off register, and the sheet is the
// warm paper with a grain that moves. lutrgb maps a grey level v to 255 − (255 − v)·(255 − ink)/255: white stays
// paper, black becomes full ink.
const ink = (hex, k = 1) => {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    const c = x => `255-(255-val)*${((255 - x) / 255 * k).toFixed(3)}`;
    return `lutrgb=r='${c(r)}':g='${c(g)}':b='${c(b)}'`;
};
const PINK = '#ff4fa3', TEAL = '#0f8f8c', PAPER = '#f5efe2';
const RISO = [
    'scale=960:-2:flags=lanczos,fps=24,format=gray,split=2[a][b]',
    `[a]curves=all='0/0.55 0.2/0.3 0.5/0.45 0.82/1 1/1',format=rgb24,${ink(PINK, 0.95)}[pink]`,
    `[b]curves=all='0/0 0.3/0.12 0.5/0.9 1/1',format=rgb24,${ink(TEAL, 0.9)},pad=iw+5:ih+4:5:4:white,crop=iw-5:ih-4:0:0[teal]`,
    '[pink][teal]blend=all_mode=multiply,noise=alls=10:allf=t,',
].join(';');
const PAPERED = `${RISO}format=rgb24,colorchannelmixer=rr=${(0xf5 / 255).toFixed(3)}:gg=${(0xef / 255).toFixed(3)}:bb=${(0xe2 / 255).toFixed(3)}`;

function encode(name) {
    const raw = join(RAW, `${name}.mp4`);
    const ff = args => execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', raw, '-an', '-filter_complex', PAPERED, ...args]);
    ff(['-c:v', 'libaom-av1', '-crf', '42', '-b:v', '0', '-cpu-used', '6', '-row-mt', '1', '-pix_fmt', 'yuv420p', join(OUT, `${name}.webm`)]);
    ff(['-c:v', 'libx264', '-profile:v', 'high', '-crf', '30', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(OUT, `${name}.mp4`)]);
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', '2.5', '-i', raw, '-filter_complex', `${PAPERED},trim=end_frame=1`, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '68', join(OUT, `${name}.webp`)]);
    console.log(`printed ${name}`);
}

await mkdir(RAW, { recursive: true });
await mkdir(OUT, { recursive: true });
const names = process.argv.slice(2).filter(a => !a.startsWith('--'));
const which = names.length ? names : Object.keys(CLIPS);
if (!process.argv.includes('--encode')) {
    const secret = await key();
    await Promise.all(which.map(n => generate(n, secret).catch(e => console.error(e.message))));
}
for (const n of which) if (await exists(join(RAW, `${n}.mp4`))) encode(n);
export { PINK, TEAL, PAPER };
