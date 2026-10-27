# The wordmark and the mark, outlined from Recursive (CASL 1, wght 900) with fontTools: no font is needed to draw them.
#   python redesign/wordmark.py <Recursive_VF.ttf>     writes wordmark.svg, mark.svg
# "Vibe" is set casual and "Sci" mono (the two voices of the notebook); the pink plate sits 6 units off register.
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

def outline(path, text, mono, track):
    font = instantiateVariableFont(TTFont(path), {"wght": 900, "CASL": 1, "MONO": mono, "slnt": 0, "CRSV": 0.5})
    gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
    x, paths = 0, []
    for ch in text:
        name = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[name].draw(pen)
        paths.append((x, pen.getCommands()))
        x += hmtx[name][0] + track
    return paths, x - track

src = sys.argv[1]
vibe, w1 = outline(src, "Vibe", 0, -10)
sci, w2 = outline(src, "Sci", 1, -40)
gap, asc, desc = 40, 760, 30
W = w1 + gap + w2
def group(paths, dx):
    return "".join(f'<path transform="translate({dx + x} 0)" d="{d}"/>' for x, d in paths)
body = group(vibe, 0) + group(sci, w1 + gap)
h = asc + desc
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -{asc} {W + 30} {h + 10}" width="{round((W + 30) / 20)}" height="{round((h + 10) / 20)}" role="img" aria-label="VibeSci">
<title>VibeSci</title>
<g transform="scale(1 -1)"><g transform="translate(16 -14)" fill="#ff48b0">{body}</g><g fill="#0b4f51" style="mix-blend-mode:multiply">{body}</g></g>
</svg>
'''
open("wordmark.svg", "w").write(svg)
# the mark: one well printed twice, the pink disc off register under the teal ring
mark = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
<rect width="64" height="64" fill="#f6efe1"/>
<circle cx="35" cy="36" r="20" fill="#ff48b0"/>
<circle cx="30" cy="30" r="20" fill="none" stroke="#0b4f51" stroke-width="7"/>
<circle cx="30" cy="30" r="6" fill="#a4efd6"/>
</svg>
'''
open("mark.svg", "w").write(mark)
print("wordmark", W, "units")
