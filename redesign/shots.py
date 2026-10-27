# Screenshots of the site at 1440, 768, 390 and 320 px and under reduced motion, into redesign/.shots/:
#   python3 redesign/shots.py [base-url]     (no url: serves this folder on a free port)
# Besides each page's first screen and its full length, it scrolls plate 01 to its verdict and to the rewrite's pass,
# because that is the moment the page is about.
import sys, threading, functools, http.server, socketserver, pathlib
from playwright.sync_api import sync_playwright

SITE = pathlib.Path(__file__).resolve().parent.parent
OUT = SITE / 'redesign' / '.shots'
OUT.mkdir(exist_ok=True)
base = sys.argv[1] if len(sys.argv) > 1 else None
if not base:
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    handler = functools.partial(Quiet, directory=str(SITE))
    httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{httpd.server_address[1]}/'

SIZES = [(1440, 900), (768, 1024), (390, 844), (320, 640)]
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    for w, h in SIZES:
        for motion in (['no-preference', 'reduce'] if w in (1440, 390) else ['no-preference']):
            ctx = browser.new_context(viewport={'width': w, 'height': h}, reduced_motion=motion, device_scale_factor=1)
            page = ctx.new_page()
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('console', lambda m: m.type == 'error' and errors.append(m.text))
            tag = f'{w}' + ('-still' if motion == 'reduce' else '')
            for path in ['index.html', 'lab.html', 'es/index.html', 'zh/index.html']:
                if path.startswith(('es', 'zh')) and w not in (1440, 390): continue
                page.goto(base + path, wait_until='load')
                page.wait_for_timeout(900)
                name = path.replace('/', '-').replace('.html', '')
                page.screenshot(path=str(OUT / f'{name}-{tag}.png'))
                if path == 'index.html':
                    track = page.evaluate("(() => { const t = document.querySelector('.bench__track'); return [t.getBoundingClientRect().top + scrollY, t.offsetHeight - innerHeight]; })()")
                    for label, at in [('run', 0.12), ('verdict', 0.36), ('pass', 0.97)]:
                        page.evaluate(f'window.scrollTo(0, {track[0] + track[1] * at})')
                        page.wait_for_timeout(500)
                        page.screenshot(path=str(OUT / f'{name}-{tag}-plate-{label}.png'))
                    page.evaluate('window.scrollTo(0, 0)')
                    if w in (1440, 390) and motion == 'no-preference':
                        for i, sel in enumerate(['#catches-h', '.slide >> nth=0', '.slide >> nth=1', '.slide >> nth=2', '.slide >> nth=3', '.reel', '.open', '.plans', '#contact']):
                            page.locator(sel).first.scroll_into_view_if_needed()
                            page.locator(sel).first.evaluate('e => e.scrollIntoView({block: "start"})')
                            page.wait_for_timeout(700)
                            page.screenshot(path=str(OUT / f'{name}-{tag}-s{i}.png'))
                if path == 'lab.html' and w == 1440 and motion == 'no-preference':
                    page.click('#fix'); page.wait_for_timeout(300)
                    page.screenshot(path=str(OUT / f'{name}-{tag}-full.png'), full_page=True)
            ctx.close()
    browser.close()
print('errors:', errors or 'none')
print('shots in', OUT)
