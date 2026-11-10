"""Builds wiki/index.html from src/ (head, body, sim.js, app.js)."""
import pathlib
d = pathlib.Path(__file__).parent
s = d / 'src'
page = ('<!doctype html>\n<html lang="sr">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        + (s / 'head.html').read_text() + '\n</head>\n<body>\n' + (s / 'body.html').read_text()
        + '<script>\n' + (s / 'sim.js').read_text() + '\n' + (s / 'app.js').read_text() + '\n</script>\n</body>\n</html>\n')
(d / 'index.html').write_text(page)
print(len(page.encode()), 'bytes')
