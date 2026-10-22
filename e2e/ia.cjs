const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1360, height: 900 } });
  await p.addInitScript(() => localStorage.setItem('pole-carriere-cube:visite-vue','1'));
  const ok = (c, m) => console.log(c ? '✓' : '✗', m);
  await p.goto(process.env.URL || 'http://127.0.0.1:4173/'); await p.waitForTimeout(400);
  await p.click('text=Envoyer le récap par e-mail'); await p.waitForTimeout(500);
  ok(await p.locator('.recap-erreur').isVisible(), 'récap sans serveur : message d\'erreur clair — ' + await p.textContent('.recap-message'));
  await p.click('.carre[title="Hugo Martin"]');
  await p.click('button:has-text("Préparer le rendez-vous")'); await p.waitForTimeout(500);
  ok((await p.locator('.brief h4').count()) === 3, 'brief de secours affiché (3 rubriques)');
  await p.locator('.preparation').screenshot({ path: process.argv[2] + '/w-brief.png' });
  await b.close();
})();
