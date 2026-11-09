"""Build the Feather & Iron prototype into a single HTML page.

    python3 build.py              writes index.html, a standalone page for GitHub Pages or any static server
    python3 build.py --artifact   writes artifact.html, the fragment published as a claude.ai Artifact

Images stay next to the page in img/ and are loaded by relative path.
"""
import pathlib
import sys

d = pathlib.Path(__file__).resolve().parent
src = d / 'src'

FONTS = ('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800'
         '&family=Saira+Stencil+One&family=Courier+Prime:wght@400;700&display=swap')
TITLE = 'Feather &amp; Iron Prototype'
DESC = ('Playable prototype of Feather &amp; Iron, a Chikn NFT browser strategy game: '
        'coops, neighborhoods, eggs, flocks and raids.')

css = (src / 'proto.css').read_text()
js = '\n'.join((src / f).read_text() for f in ['icons.js', 'engine.js', 'ui.js'])
fonts = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         f'<link rel="stylesheet" href="{FONTS}">\n')
page = f'<style>\n{css}\n</style>\n<div id="app"></div>\n<script>\n{js}\n</script>\n'

if '--artifact' in sys.argv:
    out = (f'<title>{TITLE}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
           f'<meta name="description" content="{DESC}">\n' + fonts + page)
    name = 'artifact.html'
else:
    reset = ('<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}'
             'body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>\n')
    out = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
           f'<title>{TITLE}</title>\n<meta name="description" content="{DESC}">\n'
           + fonts + reset + '</head>\n<body>\n' + page + '</body>\n</html>\n')
    name = 'index.html'

(d / name).write_text(out)
print(name, len(out.encode()), 'bytes')
