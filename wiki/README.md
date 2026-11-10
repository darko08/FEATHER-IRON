# Feather & Iron — design proposals wiki

Open `index.html` in a browser (or via GitHub Pages at `/wiki/`).

Pages: whale balance, coalition attacks, the 3-month season and prize split,
business plan calculator, EGG token simulation (4 scenarios), legal notes.

Everything here is a **proposal**, not a decision. The EGG-as-token section
reverses the earlier "no EGG/ETH" rule and needs legal review before anything ships.

`src/` holds the parts the page is built from (`head.html`, `body.html`,
`app.js`, `sim.js`); `index.html` is built from them: `python3 wiki/build.py`.
