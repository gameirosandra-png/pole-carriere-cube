const { chromium } = require('playwright');
const out = process.argv[2] || require('os').tmpdir();
const URL = process.env.URL || 'http://127.0.0.1:4173/';
(async () => {
  const b = await chromium.launch();
  const ok = (c, m) => console.log(c ? '✓' : '✗', m);
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } });
  await ctx.addInitScript(() => localStorage.setItem('pole-carriere-cube:visite-vue', '1'));
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(400);

  // Hugo vise un CDI : le volet est replié
  await p.click('nav >> text=Espace apprenant');
  await p.selectOption('.choix-demo select', { label: 'Hugo Martin' });
  ok((await p.textContent('.volet-freelance h2')) === 'Et en freelance ?', 'Hugo (CDI) : volet replié');
  await p.click('.volet-freelance button:has-text("Ouvrir le simulateur")');
  ok((await p.textContent('.simulateur-reponse')) === '330 €' || (await p.textContent('.simulateur-reponse')).replace(/\s/g, '') === '330€', 'défaut : 3 000 € net → TJM 330 €');
  ok((await p.textContent('.simulateur-details')).includes('13,3 / mois'), 'défaut : 13,3 jours facturés par mois');
  ok((await p.textContent('.simulateur-marche')).includes('Dans la fourchette'), 'défaut : dans le marché');
  ok((await p.textContent('.simulateur-resultats')).includes('TVA'), 'alerte TVA au-delà de 37 500 €');

  // Je veux plus : 6 000 € → plafond micro dépassé
  await p.locator('input[aria-label="Revenu net mensuel visé"]').fill('6000');
  ok((await p.textContent('.simulateur-resultats')).includes('la micro-entreprise ne suffit plus'), '6 000 € net : plafond micro signalé');
  ok((await p.textContent('.simulateur-marche')).includes('Au-dessus'), '6 000 € net : au-dessus du marché junior');

  // Mode inverse : je fixe mon TJM
  await p.click('.simulateur-modes button:has-text("Je fixe mon TJM")');
  await p.locator('input[aria-label="TJM facturé"]').fill('330');
  ok((await p.textContent('.simulateur-reponse')).replace(/\s/g, '') === '3094€', 'TJM 330 € → 3 094 € net par mois');
  await p.locator('input[aria-label="Part du temps facturée"]').fill('0.5');
  ok((await p.textContent('.simulateur-reponse')).replace(/\s/g, '') !== '3094€', 'moins de temps facturé → moins de revenu');
  await p.locator('.volet-freelance').scrollIntoViewIfNeeded();
  await p.screenshot({ path: out + '/s-simulateur.png' });

  // Lucas : questionnaire alternance → replié ; Mehdi après questionnaire freelance → ouvert
  await p.selectOption('.choix-demo select', { label: 'Mehdi Rahmani (en formation)' });
  await p.click('.questionnaire-appel button');
  await p.click('.questionnaire label:has-text("Freelance")');
  await p.click('.questionnaire button:has-text("Envoyer mes réponses")');
  await p.selectOption('.choix-demo select', { label: 'Lucas Bernard (en formation)' });
  await p.selectOption('.choix-demo select', { label: 'Mehdi Rahmani (en formation)' });
  ok((await p.textContent('.volet-freelance h2')) === 'Ton projet freelance' && (await p.locator('.simulateur').count()) === 1, 'Mehdi (freelance) : simulateur ouvert d\'office');

  // Page autonome (module à intégrer)
  const seul = await ctx.newPage();
  await seul.goto(URL.replace(/\/$/, '') + '/#simulateur-freelance'); await seul.waitForTimeout(400);
  ok((await seul.textContent('h1')) === 'Simulateur freelance' && !(await seul.locator('.barre').count()), 'page autonome sans l\'outil interne');
  await seul.screenshot({ path: out + '/s-page.png', fullPage: true });

  // Mobile
  const m = await ctx.newPage();
  await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(URL.replace(/\/$/, '') + '/#simulateur-freelance'); await m.waitForTimeout(400);
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= 390), 'mobile : sans débordement');
  await m.screenshot({ path: out + '/s-mobile.png', fullPage: true });
  console.log('erreurs JS:', JSON.stringify(errs));
  await b.close();
})();
