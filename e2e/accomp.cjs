const { chromium } = require('playwright');
const out = process.argv[2] || require('os').tmpdir();
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1360, height: 900 } });
  await p.addInitScript(() => localStorage.setItem('pole-carriere-cube:visite-vue','1'));
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const ok = (c, m) => console.log(c ? '✓' : '✗', m);
  await p.goto(process.env.URL || 'http://127.0.0.1:4173/'); await p.waitForTimeout(400);

  // Cette semaine
  const lignes = await p.locator('.agenda-ligne').count();
  ok(lignes >= 4, `agenda de la semaine (${lignes} lignes)`);
  ok((await p.locator('.agenda-ligne').first().textContent()).includes('En retard'), 'retards en tête');
  await p.screenshot({ path: out + '/a-tdb.png', fullPage: true });

  // Fiche Hugo : onglets
  await p.click('.carre[title="Hugo Martin"]');
  ok((await p.locator('.onglet').count()) === 6, '6 onglets dans la fiche');
  await p.click('.onglet:has-text("CV")');
  ok((await p.textContent('.atelier-score')).trim() === '67', 'CV : score 67');
  ok((await p.locator('.plan-action li').count()) === 3, 'CV : 3 priorités');
  await p.screenshot({ path: out + '/a-cv.png' });
  await p.check('input[aria-label="Résultats chiffrés : Solide"]');
  ok((await p.textContent('.atelier-score')).trim() === '83', 'CV : score mis à jour (83)');

  await p.click('.onglet:has-text("Portfolio")');
  ok((await p.locator('.projet').count()) === 3, 'Portfolio : 3 projets');
  ok((await p.textContent('.atelier-resultat')).includes('Suivi des ruptures'), 'Portfolio : projet phare');
  await p.fill('input[aria-label="Nom du projet"]', 'Chatbot RH');
  await p.click('button:has-text("Ajouter le projet")');
  ok((await p.locator('.projet').count()) === 4, 'Portfolio : projet ajouté');

  await p.click('.onglet:has-text("Salaire")');
  ok((await p.textContent('.marche-chiffres')).includes('42 k€'), 'Salaire : prétention 42 k€');
  await p.screenshot({ path: out + '/a-salaire.png', fullPage: false });
  await p.locator('.atelier select').nth(1).selectOption('regions');
  ok(!(await p.textContent('.marche-chiffres')).includes('42 k€'), 'Salaire : change avec la zone');
  await p.locator('.atelier select').nth(2).selectOption('freelance');
  ok((await p.textContent('.marche-chiffres')).includes('€/jour'), 'Salaire : TJM en freelance');
  ok((await p.locator('.note-methode a').count()) >= 2, 'Salaire : sources citées');

  await p.click('.onglet:has-text("Convaincre")');
  ok((await p.locator('.pitch li').count()) === 4, 'Pitch : 4 temps');
  ok((await p.locator('.pitch mark').count()) === 4, 'Pitch : trous surlignés');
  ok((await p.textContent('.atelier')).includes('65/100'), 'Simulation : 65/100');
  await p.screenshot({ path: out + '/a-convaincre.png' });

  await p.click('.onglet:has-text("Suivi")');
  ok(await p.locator('text=Parcours d\'accompagnement').isVisible(), 'Suivi : parcours en 7 séances');
  await p.keyboard.press('Escape');

  // Ateliers collectifs
  await p.click('nav >> text=Ateliers');
  ok((await p.locator('.atelier-collectif').count()) === 4, '4 ateliers à venir');
  const simu = p.locator('.atelier-collectif:has-text("Entretiens blancs")');
  const avant = await simu.locator('.jeton').count();
  await simu.locator('.bouton-inviter').first().click();
  ok((await simu.locator('.jeton').count()) === avant + 1, 'inviter un apprenant');
  await p.screenshot({ path: out + '/a-ateliers.png', fullPage: true });
  await p.selectOption('.ajout-entreprise select', 'negociation');
  await p.fill('.ajout-entreprise input[placeholder^="Ex. Négocier"]', 'Négociation : jeu de rôle');
  await p.click('button:has-text("Planifier l\'atelier")');
  ok((await p.locator('.atelier-collectif').count()) === 5, 'atelier planifié');

  // Mobile
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.addInitScript(() => localStorage.setItem('pole-carriere-cube:visite-vue','1'));
  await m.goto(process.env.URL || 'http://127.0.0.1:4173/'); await m.waitForTimeout(300);
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= 390), 'mobile accueil sans débordement');
  await m.click('.carre[title="Hugo Martin"]'); await m.click('.onglet:has-text("Salaire")');
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= 390), 'mobile salaire sans débordement');
  await m.screenshot({ path: out + '/a-mobile-salaire.png', fullPage: true });
  console.log('erreurs JS:', JSON.stringify(errs));
  await b.close();
})();
