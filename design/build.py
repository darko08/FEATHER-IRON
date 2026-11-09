"""Build the Feather & Iron design document (v0.2) into a single HTML page.

    python3 build.py              writes index.html, a standalone page
    python3 build.py --artifact   writes artifact.html, the fragment published as a claude.ai Artifact

The art picks are saved through the claude.ai Artifact database when the page runs there.
Opened anywhere else the page works the same, but the picks are not stored.
"""
import pathlib
import sys

d = pathlib.Path(__file__).resolve().parent
src = d / 'src'

FONTS = ('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800;900'
         '&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400'
         '&family=JetBrains+Mono:wght@400;500;600;700&family=Saira+Stencil+One&family=Courier+Prime:wght@400;700'
         '&family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&display=swap')
TITLE = 'Feather &amp; Iron'
DESC = ('Game design for a Chikn NFT browser strategy game: NFT tickets, starting eggs, '
        'resources, rules and art picks.')

css = (src / 'page.css').read_text() + '\n' + (src / 'screens.css').read_text()
body = (src / 'page.html').read_text()
js = '\n'.join((src / f).read_text() for f in ['icons.js', 'screens.js', 'app.js'])
fonts = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         f'<link rel="stylesheet" href="{FONTS}">\n')
page = '<style>\n' + css + '\n</style>\n' + body + '\n<script>\n' + js + '\n</script>\n'

if '--artifact' in sys.argv:
    out = (f'<title>{TITLE}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
           f'<meta name="description" content="{DESC}">\n' + fonts + page)
    name = 'artifact.html'
else:
    reset = ('<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}'
             'body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>\n')
    out = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
           f'<title>{TITLE}</title>\n<meta name="description" content="{DESC}">\n'
           + fonts + reset + '</head>\n<body>\n' + page + '</body>\n</html>\n')
    name = 'index.html'

(d / name).write_text(out)
print(name, len(out.encode()), 'bytes')
