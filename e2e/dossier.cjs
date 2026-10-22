const { chromium } = require('playwright');
const out = process.argv[2] || require('os').tmpdir();
const URL = process.env.URL || 'http://127.0.0.1:4173/';
(async () => {
  const b = await chromium.launch();
  const SKIP = () => localStorage.setItem('pole-carriere-cube:visite-vue','1');
  const p = await b.newPage({ viewport: { width: 1360, height: 900 } });
  await p.addInitScript(SKIP);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  const ok = (c, m) => console.log(c ? '✓' : '✗', m);
  await p.goto(URL); await p.waitForTimeout(400);

  // Tableau de bord équipe
  const lead = await p.textContent('.lead-section');
  ok(lead.includes('2 apprenants sur 9'), 'KPI : 2 prêts sur 9 — ' + lead.trim().slice(0, 60));
  ok((await p.locator('.etapes-kpi li').count()) === 7, '7 barres d\'étapes');
  await p.screenshot({ path: out + '/d-tdb.png', fullPage: true });

  // Liste : colonne et filtre
  await p.click('nav >> text=Apprenants');
  ok((await p.locator('.tableau .jauge').count()) === 16, 'jauge dossier sur chaque ligne');
  await p.check('text=Prêts à proposer');
  ok((await p.textContent('.sous-titre')).includes('9 sur 16'), 'filtre prêts (7 insérés + 2 prêts)');
  await p.uncheck('text=Prêts à proposer');

  // Espace apprenant : tuiles + checklist
  await p.click('nav >> text=Espace apprenant');
  await p.selectOption('.choix-demo select', { label: 'Hugo Martin' });
  ok((await p.textContent('.tuiles')).includes('5/7'), 'tuile parcours 5/7');
  ok((await p.locator('.checklist input[disabled]').count()) === 5, '5 séances équipe verrouillées pour l\'apprenant');
  await p.selectOption('.choix-demo select', { label: 'Yanis Lambert' });
  ok((await p.textContent('.tuiles')).includes('2/7'), 'Yanis 2/7');
  await p.check('.checklist label:has-text("Portfolio") input');
  ok((await p.textContent('.tuiles')).includes('3/7'), 'cocher LinkedIn → 3/7');
  await p.screenshot({ path: out + '/d-espace.png', fullPage: true });

  // Fiche équipe : tout modifiable, passage à prêt
  await p.click('nav >> text=Tableau de bord');
  await p.click('.carre[title="Hugo Martin"]');
  ok((await p.locator('.fiche .checklist input[disabled]').count()) === 0, 'équipe : aucune étape verrouillée');
  await p.check('.fiche .checklist label:has-text("Simulation") input');
  await p.check('.fiche .checklist label:has-text("Négociation") input');
  ok(await p.locator('.fiche .badge-pret').isVisible(), 'Hugo devient « Prêt à être proposé »');
  await p.screenshot({ path: out + '/d-fiche.png' });
  await p.keyboard.press('Escape');
  ok((await p.textContent('.lead-section')).includes('3 apprenants sur 9'), 'KPI mis à jour : 3 prêts');

  // Proposition à une offre : prêts en premier
  await p.click('nav >> text=Entreprises & offres');
  const options = await p.locator('.select-jeton').first().locator('option').allTextContents();
  ok(options[1].includes('parcours bouclé'), 'offres : parcours bouclés en tête — ' + options[1]);

  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.addInitScript(SKIP);
  await m.goto(URL); await m.waitForTimeout(300);
  await m.click('nav >> text=Espace apprenant'); await m.waitForTimeout(200);
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= 390), 'mobile espace apprenant sans débordement');
  await m.screenshot({ path: out + '/d-mobile.png', fullPage: true });
  console.log('erreurs JS:', JSON.stringify(errs));
  await b.close();
})();
