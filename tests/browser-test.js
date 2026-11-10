// End-to-end check in Chromium: node tests/browser-test.js [--shots]
// Serves prototype/ on a free local port, plays the main flow on a desktop and a phone viewport
// (start, build, hatch with eggs, speed-up, crack eggs, neighborhood map, raid, battle report,
// reload, start over) and fails on page errors, console errors or sideways page scroll.
// Needs Playwright with Chromium (npm i playwright && npx playwright install chromium).
// --shots also saves screenshots to tests/shots/.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../prototype');
const SHOTS = path.join(__dirname, 'shots');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };

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

(async () => {
  const saveShots = process.argv.includes('--shots');
  if (saveShots) fs.mkdirSync(SHOTS, { recursive: true });
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch();
  const log = [];
  let failed = false;
  const fail = (msg) => { failed = true; log.push('FAIL ' + msg); };

  for (const vp of [{ name: 'desk', width: 1440, height: 900 }, { name: 'phone', width: 390, height: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') fail(`${vp.name} console: ${m.text()}`); });
    page.on('pageerror', (e) => fail(`${vp.name} page error: ${e.message}`));
    const shot = async (n) => { if (saveShots) { await page.waitForTimeout(200); await page.screenshot({ path: `${SHOTS}/${vp.name}-${n}.png`, fullPage: true }); } };
    const noSideScroll = async (n) => {
      const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: document.documentElement.clientWidth }));
      if (o.sw > o.w) fail(`${vp.name} page scrolls sideways on ${n}: ${o.sw} > ${o.w}`);
    };
    const toast = () => page.evaluate(() => { const t = document.getElementById('toast'); return t && !t.hidden ? t.textContent : ''; });
    const expect = (cond, msg) => { if (cond) log.push(`ok   ${vp.name} ${msg}`); else fail(`${vp.name} ${msg}`); };

    await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
    await shot('01-intro'); await noSideScroll('intro');
    await page.click('[data-act="start"]'); await page.waitForTimeout(300);
    expect(await page.evaluate(() => GAME.S.eggs === 1000), 'game starts with 1,000 eggs');
    await shot('02-overview'); await noSideScroll('overview');

    await page.click('#nav [data-v="buildings"]');
    await page.click('[data-act="build"][data-v="windmill"]');
    expect(/Construction started/.test(await toast()), 'Windmill construction starts');
    await noSideScroll('buildings');

    await page.click('#nav [data-v="hatchery"]');
    await page.fill('#q-u-pecker', '30');
    await page.click('[data-act="hatch"][data-v="pecker"][data-src="egg"]');
    expect(await page.evaluate(() => GAME.S.eggs === 940), '30 Peckers cost 60 eggs');
    await page.click('[data-act="speedup"][data-v="hatch"]'); await page.waitForTimeout(200);
    expect(await page.evaluate(() => GAME.cur().units.pecker === 30), 'speed-up delivers all 30 Peckers');
    await shot('03-hatchery'); await noSideScroll('hatchery');

    await page.click('[data-act="tab"][data-v="eggs"]');
    await page.fill('#crackN', '10'); await page.selectOption('#crackInto', 'o'); await page.click('[data-act="crack"]');
    expect(/Eggs added/.test(await toast()), 'cracking 10 eggs is queued');
    await page.click('[data-act="tab"][data-v="defense"]'); await noSideScroll('defense');
    await page.evaluate(() => GAME.advance(3 * 3600)); await page.waitForTimeout(800);

    await page.click('#nav [data-v="neighborhood"]'); await page.waitForTimeout(200);
    await shot('04-neighborhood'); await noSideScroll('neighborhood');
    await page.click('g[data-act="hood"][data-v="7"]');
    await page.click('[data-act="street"][data-v="1"]');
    expect((await page.evaluate(() => document.querySelector('.nb-top h2').textContent)) === 'Apiary · Street 118', 'ring and street buttons move the map');
    await page.click('[data-act="home"]');
    await page.click('[data-act="plot"][data-v="7"]');
    await page.click('[data-act="flockto"][data-m="raid"]');
    await page.click('[data-act="allunits"][data-v="pecker"]');
    expect(/Distance/.test(await page.evaluate(() => document.getElementById('fsum').textContent)), 'flock summary shows distance and time');
    await noSideScroll('flocks');
    await page.click('[data-act="send"]'); await page.waitForTimeout(200);
    expect(await page.evaluate(() => GAME.S.flocks.length === 1), 'raid flock leaves');
    await shot('05-flock-sent');

    await page.evaluate(() => GAME.advance(2 * 3600)); await page.waitForTimeout(900);
    await page.click('#nav [data-v="messages"]');
    expect(await page.evaluate(() => GAME.S.msgs.some((m) => m.type === 'battle')), 'battle report arrives');
    await page.click('.msg button[data-act="openmsg"]');
    await shot('06-report'); await noSideScroll('messages');
    await page.evaluate(() => { GAME.cur().b.market = 1; });
    await page.click('#nav [data-v="market"]');
    await page.selectOption('#mkPay', 'e'); await page.selectOption('#mkGet', 'g'); await page.fill('#mkAmt', '10');
    expect(/You get/.test(await page.textContent('#mkQuote')), 'market shows a quote');
    const eggsBefore = await page.evaluate(() => GAME.S.eggs);
    await page.click('[data-act="mktrade"]');
    expect(/Traded 10 Eggs for [\d,]+ Grain/.test(await toast()), 'market trade goes through');
    expect(await page.evaluate((n) => GAME.S.eggs === n - 10, eggsBefore), 'the trade takes 10 eggs');
    await shot('07-market'); await noSideScroll('market');
    for (const s of ['research', 'wallet', 'ranks']) { await page.click(`#nav [data-v="${s}"]`); await noSideScroll(s); }

    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(300);
    expect(await page.evaluate(() => !!GAME.S && GAME.S.msgs.length > 0), 'game survives a reload');
    await page.click('#resetBtn'); await page.click('#resetBtn'); await page.waitForTimeout(200);
    expect(await page.evaluate(() => !!document.querySelector('[data-act="start"]')), 'Start over returns to the intro');
    await ctx.close();
  }

  await browser.close();
  srv.close();
  console.log(log.join('\n'));
  console.log(failed ? '\nSome checks failed.' : '\nAll browser checks passed.');
  process.exitCode = failed ? 1 : 0;
})();
