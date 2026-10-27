# The site in Chromium, nothing mocked:   python3 tests/pages.py [base-url]   (no url: serves this folder)
# For each language: plate 01 scrolled to its verdict rings the wells the twin fails and stamps it; scrolled to the end
# it has no ring and stamps the pass; the step buttons move the frame; the lab runs the sample, fails it, fixes it and
# the rewrite passes every well; the language picker opens; nothing scrolls sideways at 320 px; no script error.
import sys, threading, functools, http.server, socketserver, pathlib
from playwright.sync_api import sync_playwright

SITE = pathlib.Path(__file__).resolve().parent.parent
base = sys.argv[1] if len(sys.argv) > 1 else None
if not base:
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    handler = functools.partial(Quiet, directory=str(SITE))
    httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{httpd.server_address[1]}/'

failures = []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: failures.append(what)

def scroll_plate(page, at):
    page.evaluate(f"(() => {{ const t = document.querySelector('.bench__track'); scrollTo(0, t.getBoundingClientRect().top + scrollY + (t.offsetHeight - innerHeight) * {at}); }})()")
    page.wait_for_timeout(250)

with sync_playwright() as p:
    browser = p.chromium.launch()
    for lang in ['', 'es/', 'zh/']:
        errors = []
        ctx = browser.new_context(viewport={'width': 1280, 'height': 860})
        page = ctx.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(base + lang + 'index.html', wait_until='load')
        page.wait_for_timeout(300)
        scroll_plate(page, 0.36)
        rings = page.eval_on_selector_all('svg.plate .ring', 'rs => rs.filter(r => r.style.display !== "none").length')
        check(rings == 7 and page.is_visible('.stamp'), f'{lang or "en/"} verdict rings the 7 wells the twin fails ({rings})')
        scroll_plate(page, 1)
        rings = page.eval_on_selector_all('svg.plate .ring', 'rs => rs.filter(r => r.style.display !== "none").length')
        check(rings == 0 and page.eval_on_selector('.stamp', 'e => e.classList.contains("pass")'), f'{lang or "en/"} the rewrite passes with no ring')
        scroll_plate(page, 0)
        before = page.text_content('#bench output')
        page.click('[data-step="next"]'); page.wait_for_timeout(150)
        check(page.text_content('#bench output') != before, f'{lang or "en/"} the step button moves the frame')
        page.click('[commandfor="lang-dialog"]')
        check(page.is_visible('#lang-dialog'), f'{lang or "en/"} the language picker opens')
        page.keyboard.press('Escape')
        page.goto(base + lang + 'lab.html', wait_until='load'); page.wait_for_timeout(600)
        check(page.evaluate('scrollY') == 0, f'{lang or "en/"} the lab opens at its title (the step log scrolls only itself)')
        page.click('#run'); page.wait_for_timeout(100)
        check('bad' in page.get_attribute('#verdict', 'class'), f'{lang or "en/"} the lab fails the sample')
        page.click('#fix'); page.wait_for_timeout(200)
        rows = page.eval_on_selector_all('#after tbody tr', 'rs => rs.map(r => r.className)')
        check('ok' in page.get_attribute('#fixverdict', 'class') and rows and all(r == 'pass' for r in rows), f'{lang or "en/"} the rewrite passes all {len(rows)} wells')
        for path in ['index.html', 'lab.html']:
            page.set_viewport_size({'width': 320, 'height': 640})
            page.goto(base + lang + path, wait_until='load'); page.wait_for_timeout(200)
            wide = page.evaluate('document.documentElement.scrollWidth')
            check(wide <= 320, f'{lang or "en/"}{path} at 320 px is {wide} px wide')
        check(not errors, f'{lang or "en/"} no script error {errors}')
        ctx.close()
    browser.close()
sys.exit(1 if failures else 0)
