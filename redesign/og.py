# The 1200×630 OG image and the 180 px touch icon, rendered with Playwright from the site's own font, wordmark,
# poster frame and inks:   python3 redesign/og.py
import pathlib
from playwright.sync_api import sync_playwright
SITE = pathlib.Path(__file__).resolve().parent.parent
OG = f'''<html><head><style>
@font-face {{ font-family: R; src: url("{(SITE/'fonts/recursive.woff2').as_uri()}"); font-weight: 350 900; }}
body {{ margin: 0; width: 1200px; height: 630px; background: #f6efe1 url("{(SITE/'media/drop.webp').as_uri()}") right center / auto 100% no-repeat; font-family: R; position: relative; overflow: hidden;
  background-image: url("{(SITE/'media/drop.webp').as_uri()}"); }}
.grid {{ position: absolute; inset: 0; background-image: linear-gradient(rgba(10,127,128,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(10,127,128,.09) 1px, transparent 1px); background-size: 24px 24px; }}
.sheet {{ position: absolute; left: 0; top: 0; bottom: 0; width: 640px; background: #f6efe1; border-right: 6px solid #0b4f51; padding: 56px 60px; box-sizing: border-box; }}
img {{ height: 64px; }}
h1 {{ margin: 46px 0 0; font-size: 76px; line-height: .95; color: #0b4f51; font-weight: 900; font-variation-settings: "CASL" 1; text-shadow: 4px 3px 0 #ff48b0; letter-spacing: -1px; }}
h1 em {{ font-style: normal; color: #b8126a; font-variation-settings: "CASL" 1, "MONO" 1; text-shadow: -4px 4px 0 rgba(10,127,128,.7); }}
p {{ position: absolute; bottom: 48px; left: 60px; margin: 0; font: 600 20px R; font-variation-settings: "MONO" 1; color: #0b4f51; text-transform: uppercase; }}
</style></head><body><div class="grid"></div><div class="sheet"><img src="{(SITE/'wordmark.svg').as_uri()}"><h1>Run the protocol <em>before</em> the reagents.</h1><p>vibesci.commandagi.app</p></div></body></html>'''
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1200, 'height': 630})
    tmp = SITE/'redesign'/'.og.html'
    tmp.write_text(OG)
    pg.goto(tmp.as_uri()); pg.wait_for_timeout(800)
    pg.screenshot(path=str(SITE/'og.png'))
    pg = b.new_page(viewport={'width': 180, 'height': 180})
    tmp.write_text(f'<body style="margin:0"><img src="{(SITE/"mark.svg").as_uri()}" style="width:180px;height:180px;display:block">')
    pg.goto(tmp.as_uri()); pg.wait_for_timeout(300)
    pg.screenshot(path=str(SITE/'touch-icon.png'))
    b.close()
    tmp.unlink()
