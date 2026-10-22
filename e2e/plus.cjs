const { chromium } = require('playwright');
const out = process.argv[2] || require('os').tmpdir();
const URL = process.env.URL || 'http://127.0.0.1:4173/';
(async () => {
  const b = await chromium.launch();
  const ok = (c, m) => console.log(c ? '✓' : '✗', m);
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript(() => localStorage.setItem('pole-carriere-cube:visite-vue', '1'));
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  let envoiRelances = null;
  await p.route('**/api/relances', async r => { envoiRelances = JSON.parse(r.request().postData()); await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ envoye: envoiRelances.relances.length }) }); });
  await p.goto(URL); await p.waitForTimeout(500);

  // --- Relances automatiques + KPI progression
  const txtRel = await p.textContent('.relances-auto');
  ok(txtRel.includes("2 rappels d'atelier"), 'relances : 2 rappels d\'atelier');
  ok((await p.locator('.relance-auto').count()) === 3, 'relances : 3 messages visibles avant « voir tout »');
  await p.click('.relances-auto .bouton-texte');
  const nbRel = await p.locator('.relance-auto').count();
  ok(nbRel > 3, `relances : ${nbRel} messages en tout`);
  await p.click('.relances-auto .bouton-cta');
  await p.waitForTimeout(300);
  ok(envoiRelances && envoiRelances.relances.length === nbRel, 'relances : toutes envoyées à /api/relances');
  ok((await p.textContent('.relances-auto')).includes('relances envoyées via Make'), 'relances : confirmation affichée');
  ok((await p.textContent('.chiffre-progression')).includes('+35 pts'), 'KPI : +35 pts de score CV');
  await p.screenshot({ path: out + '/p-tdb.png', fullPage: false });

  // --- Fiche Hugo : progression
  await p.click('.carre[title="Hugo Martin"]');
  ok(await p.locator('.fiche .progression svg').isVisible(), 'fiche : courbe de progression');
  ok((await p.textContent('.progression-legende')).includes('33 → 67'), 'fiche : CV 33 → 67');
  await p.locator('.fiche .progression').scrollIntoViewIfNeeded();
  await p.screenshot({ path: out + '/p-progression.png' });
  // une note CV qui monte ajoute un point
  await p.click('#onglet-cv');
  await p.locator('input[type=radio][aria-label*="Résultats chiffrés"]').last().check();
  await p.click('#onglet-suivi');
  ok((await p.textContent('.progression-legende')).includes('33 → 83'), 'fiche : nouvelle note CV → 83 sur la courbe');

  // --- Fiche candidat
  await p.click('#onglet-candidat');
  const fc = await p.textContent('.fiche-candidat');
  ok(fc.includes('Hugo M.') && !fc.includes('Martin'), 'fiche candidat : prénom + initiale seulement');
  ok(!fc.includes('k€') && !fc.includes('['), 'fiche candidat : ni salaire ni trous');
  ok(fc.includes('Projet phare'), 'fiche candidat : projet phare');
  await p.screenshot({ path: out + '/p-fiche-candidat.png' });
  const lien = await p.getAttribute('.atelier a.bouton', 'href');
  ok(lien.includes('#candidat='), 'fiche candidat : lien de partage');
  const pub = await ctx.newPage();
  pub.on('pageerror', e => errs.push('pub: ' + e.message));
  await pub.goto(lien.replace(/^https?:\/\/[^/]+/, '' + (process.env.URL || 'http://127.0.0.1:4173/').replace(/\/$/, '') + '')); await pub.waitForTimeout(400);
  ok((await pub.textContent('.fiche-candidat')).includes('Hugo M.'), 'page publique : fiche lue depuis le lien');
  ok(!(await pub.locator('.barre').count()), 'page publique : sans l\'outil interne');
  await pub.screenshot({ path: out + '/p-public.png', fullPage: true });
  await pub.pdf({ path: out + '/p-public.pdf', format: 'A4', printBackground: true });
  const pub2 = await ctx.newPage(); await pub2.goto('' + (process.env.URL || 'http://127.0.0.1:4173/').replace(/\/$/, '') + '/#candidat=abime'); await pub2.waitForTimeout(300);
  ok((await pub2.textContent('main')).includes('incomplet'), 'page publique : lien abîmé géré');

  // --- Entraînement
  await p.click('#onglet-convaincre');
  await p.click('.appel-entrainement .bouton');
  ok(await p.locator('.entrainement').isVisible(), 'entraînement : plein écran');
  ok((await p.textContent('.entrainement-chrono')) === '2:00', 'entraînement : chrono à 2:00');
  await p.click('.entrainement button:has-text("Lancer le chrono")');
  await p.waitForTimeout(2200);
  const chrono = await p.textContent('.entrainement-chrono');
  ok(chrono === '1:58' || chrono === '1:59' || chrono === '1:57', 'entraînement : le chrono tourne (' + chrono + ')');
  await p.screenshot({ path: out + '/p-entrainement.png' });
  const q1 = await p.textContent('.entrainement-question');
  await p.click('.entrainement button:has-text("Question suivante")');
  ok((await p.textContent('.entrainement-compteur')) === 'Question 2 / 5' && (await p.textContent('.entrainement-question')) !== q1, 'entraînement : question suivante');
  await p.click('.entrainement-modes button:has-text("Mon pitch")');
  ok((await p.locator('.entrainement-pitch li').count()) === 4, 'entraînement : mode pitch');
  await p.keyboard.press('Escape');
  ok(!(await p.locator('.entrainement').count()) && await p.locator('.fiche').isVisible(), 'Échap ferme l\'entraînement, pas la fiche');
  await p.keyboard.press('Escape');

  // --- Shortlist
  await p.click('nav >> text=Entreprises & offres');
  const offre = p.locator('.offre:has(.jeton:has-text("Hugo Martin"))').first();
  await offre.locator('.bouton-shortlist').click();
  const msg = await offre.locator('.shortlist-message').textContent();
  ok(msg.includes('Hugo M.') && msg.includes('[lien vers la fiche candidat]'), 'shortlist : aperçu lisible');
  const mailto = await offre.locator('a.bouton').getAttribute('href');
  ok(mailto.startsWith('mailto:?subject=') && mailto.includes('%23candidat%3D'), 'shortlist : mail prêt, avec le vrai lien');
  await p.screenshot({ path: out + '/p-shortlist.png' });
  await offre.locator('button:has-text("Copier le message")').click();
  await p.waitForTimeout(200);
  const presse = await p.evaluate(() => navigator.clipboard.readText());
  ok(presse.startsWith('1 profil') && presse.includes('#candidat='), 'shortlist : message copié avec le lien');
  await offre.locator('.shortlist .bouton-texte').click();
  ok((await offre.textContent()).includes('Dernier envoi le'), 'shortlist : date d\'envoi notée');

  // --- Espace apprenant
  await p.click('nav >> text=Espace apprenant');
  await p.selectOption('.choix-demo select', { label: 'Hugo Martin' });
  const boite = await p.textContent('.boite-outils');
  ok(boite.includes('83') && boite.includes('42 k€'), 'espace : score CV et prétention visibles');
  ok(await p.locator('.boite-outils .progression svg').isVisible(), 'espace : courbe de progression');
  await p.locator('.boite-outils').scrollIntoViewIfNeeded();
  await p.screenshot({ path: out + '/p-espace.png' });
  await p.click('.boite-tete .bouton-cta');
  ok(await p.locator('.entrainement').isVisible(), 'espace : entraînement accessible');
  await p.keyboard.press('Escape');

  // --- Démo auto : chaque étape trouve sa zone
  await p.click('nav >> text=Tableau de bord');
  await p.click('.entete-banniere button:has-text("Démo auto")');
  for (let i = 0; i < 11; i++) {
    await p.waitForTimeout(350);
    const titre = await p.textContent('#visite-titre');
    ok(await p.locator('.visite-projecteur').count() === 1, `démo ${i + 1} : ${titre}`);
    if (i === 3 || i === 7) await p.screenshot({ path: out + `/p-demo-${i + 1}.png` });
    if (i < 10) await p.click('.visite-bulle button:has-text("Suivant")');
  }
  await p.click('.visite-bulle button:has-text("Terminer")');
  ok(!(await p.locator('.visite').count()) && !(await p.locator('.fiche').count()), 'démo terminée, fiche fermée');
  await p.click('.barre-pied .bouton-demo');
  await p.waitForTimeout(11800);
  ok((await p.textContent('.visite-compteur')).includes('2 / 11'), 'démo : avance seule après 11 s');
  await p.click('.visite-bulle button:has-text("Pause")');
  await p.waitForTimeout(1200);
  ok((await p.textContent('.visite-compteur')).includes('2 / 11'), 'démo : pause');
  await p.keyboard.press('Escape');

  // --- Mobile
  const m = await ctx.newPage();
  await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(URL); await m.waitForTimeout(400);
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= 390), 'mobile tdb : pas de débordement');
  await m.screenshot({ path: out + '/p-mobile-tdb.png', fullPage: true });
  await m.click('nav >> text=Espace apprenant');
  await m.selectOption('.choix-demo select', { label: 'Hugo Martin' });
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= 390), 'mobile espace : pas de débordement');
  await m.click('.boite-tete .bouton-cta');
  await m.screenshot({ path: out + '/p-mobile-entrainement.png' });

  console.log('erreurs JS:', JSON.stringify(errs));
  await b.close();
})();
