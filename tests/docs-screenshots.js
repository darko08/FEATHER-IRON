// Regenerates the README screenshots in docs/screenshots/: node tests/docs-screenshots.js
// Plays a short scripted session in the built prototype and saves 2x JPEGs.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../prototype');
const OUT = path.resolve(__dirname, '../docs/screenshots');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp' };

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://local').pathname));
      if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      if (file.endsWith(path.sep)) file += 'index.html';
      fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
        res.end(buf);
      });
    }).listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter((i) => !i.complete && i.loading !== 'lazy').map((i) => new Promise((r) => { i.onload = i.onerror = r; })));
  });
  await page.waitForTimeout(400);
}

async function play(page, base) {
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.toast{display:none!important}' });
  await page.click('[data-act="start"]');
  await page.evaluate(() => {
    const G = window.GAME;
    G.build('windmill'); G.advance(1200);
    G.build('field'); G.hatch('u', 'pecker', 40, 'egg'); G.hatch('d', 'wattle', 12, 'egg');
    G.advance(5400);
  });
  await page.click('#nav [data-v="overview"]');
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch();
  const opts = { type: 'jpeg', quality: 82 };

  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await desk.newPage();
  await play(page, base);
  await page.evaluate(() => { window.GAME.S.speed = 1; });
  await settle(page);
  await page.screenshot({ path: `${OUT}/overview.jpg`, ...opts });

  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.click('#nav [data-v="neighborhood"]');
  await page.click('[data-act="plot"][data-v="7"]');
  await settle(page);
  await page.screenshot({ path: `${OUT}/neighborhood.jpg`, ...opts });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.click('#nav [data-v="hatchery"]');
  await settle(page);
  await page.screenshot({ path: `${OUT}/hatchery.jpg`, ...opts });

  await page.click('#nav [data-v="neighborhood"]');
  await page.click('[data-act="plot"][data-v="7"]');
  await page.click('[data-act="flockto"][data-m="raid"]');
  await page.click('[data-act="allunits"][data-v="pecker"]');
  await page.click('[data-act="send"]');
  await page.evaluate(() => window.GAME.advance(2 * 3600));
  await page.waitForTimeout(900);
  await page.click('#nav [data-v="messages"]');
  await page.click('.msg button[data-act="openmsg"]');
  await settle(page);
  await page.screenshot({ path: `${OUT}/battle-report.jpg`, ...opts });
  await desk.close();

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce', isMobile: true, hasTouch: true });
  const p2 = await phone.newPage();
  await play(p2, base);
  await p2.evaluate(() => { window.GAME.S.speed = 1; });
  await settle(p2);
  await p2.screenshot({ path: `${OUT}/phone.jpg`, ...opts });
  await phone.close();

  await browser.close();
  srv.close();
  console.log('Saved', fs.readdirSync(OUT).join(', '));
})();
