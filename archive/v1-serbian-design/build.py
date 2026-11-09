import pathlib
d = pathlib.Path(__file__).parent
fonts = ("https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800;900"
 "&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400"
 "&family=JetBrains+Mono:wght@400;500;600;700&family=Saira+Stencil+One&family=Courier+Prime:wght@400;700"
 "&family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500"
 "&family=Chakra+Petch:wght@400;500;600;700&display=swap")
head = ('<title>Perje i gvožđe</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
 '<meta name="description" content="Koncept strategije u pregledaču za Chikn NFT: priča, svet kokošinjaca, ekonomija jaja i izbor dizajna.">\n'
 '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
 f'<link rel="stylesheet" href="{fonts}">\n')
css = (d/'page.css').read_text() + '\n' + (d/'screens.css').read_text()
body = (d/'page.html').read_text()
js = '\n'.join((d/f).read_text() for f in ['art.js','screens.js','app.js'])
out = head + '<style>\n' + css + '\n</style>\n' + body + '\n<script>\n' + js + '\n</script>\n'
# standalone page
skel = ('<!doctype html><html lang="sr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
 '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>')
(d/'index.html').write_text(skel + out + '</body></html>')
print('index.html', len(out.encode()), 'bytes')
