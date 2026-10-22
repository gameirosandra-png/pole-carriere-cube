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

  // Tableau de bord : questions en attente
  const qat = await p.textContent('.questions-a-traiter');
  ok(qat.includes('Lucas Bernard') && qat.includes('Chloé Garnier'), 'tdb : 2 questions à traiter');
  ok((await p.textContent('.questions-a-traiter .compteur')) === '2', 'tdb : compteur 2');

  // Espace apprenant de Mehdi : questionnaire vierge
  await p.click('nav >> text=Espace apprenant');
  await p.selectOption('.choix-demo select', { label: 'Mehdi Rahmani (en formation)' });
  ok((await p.textContent('.questionnaire-appel')).includes('5 minutes'), 'espace : invitation au questionnaire');
  await p.click('.questionnaire-appel button:has-text("Répondre au questionnaire")');
  ok((await p.inputValue('.questionnaire input[placeholder^="Ex. 8 ans"]')) === '5 ans dans la vente', 'questionnaire : pré-rempli avec la fiche');
  await p.fill('.questionnaire input[placeholder^="Ex. organiser"]', 'Convaincre, négocier, écouter les clients');
  await p.fill('.questionnaire input[placeholder^="Ex. santé"]', 'PME, industrie');
  await p.click('.questionnaire label:has-text("Freelance")');
  await p.click('.questionnaire label:has-text("En régions")');
  await p.click('.questionnaire label:has-text("Télétravail complet")');
  await p.click('.questionnaire label:has-text("Parler salaire")');
  await p.click('.questionnaire label:has-text("La confiance en moi")');
  await p.fill('.questionnaire textarea', 'pour des PME qui perdent du temps sur la saisie.');
  await p.screenshot({ path: out + '/q-formulaire.png', fullPage: true });
  await p.click('.questionnaire button:has-text("Envoyer mes réponses")');
  ok((await p.textContent('.questionnaire-appel')).includes('Merci'), 'questionnaire : remerciement');
  ok((await p.textContent('.boite-outils')).includes('€/jour'), 'questionnaire → prétention en TJM (freelance)');
  ok((await p.textContent('.boite-outils .pitch')).includes('pour des PME qui perdent du temps'), 'questionnaire → pitch complété');

  // Boîte à questions
  await p.fill('.boite-questions textarea', 'Combien de projets faut-il dans le portfolio ?');
  await p.click('.boite-questions button:has-text("Envoyer ma question")');
  ok((await p.textContent('.boite-questions')).includes('En attente de réponse'), 'question envoyée, en attente');
  await p.locator('.boite-questions').scrollIntoViewIfNeeded();
  await p.screenshot({ path: out + '/q-espace.png' });

  // Tableau de bord → fiche de Mehdi : profil + réponse
  await p.click('nav >> text=Tableau de bord');
  ok((await p.textContent('.questions-a-traiter .compteur')) === '3', 'tdb : la nouvelle question apparaît (3)');
  await p.click('.questions-a-traiter button:has-text("Mehdi Rahmani")');
  const profil = await p.textContent('.profil');
  ok(profil.includes('Freelance · en régions · télétravail complet'), 'fiche : résumé du questionnaire');
  ok((await p.textContent('.points-attention')).includes('parler salaire'), 'fiche : points d\'attention');
  await p.locator('.profil').scrollIntoViewIfNeeded();
  await p.screenshot({ path: out + '/q-fiche.png' });
  await p.fill('.reponse-saisie textarea', '2 ou 3 projets bien racontés suffisent.');
  await p.click('.reponse-saisie button');
  ok((await p.textContent('.fiche')).includes('Réponse du'), 'fiche : réponse enregistrée');
  await p.click('.fiche button:has-text("Préparer le rendez-vous")');
  ok((await p.textContent('.brief')).includes('Inquiet·e : parler salaire'), 'brief : inquiétudes reprises');
  await p.keyboard.press('Escape');
  ok((await p.textContent('.questions-a-traiter .compteur')) === '2', 'tdb : question traitée (2)');

  // L'apprenant voit la réponse
  await p.click('nav >> text=Espace apprenant');
  await p.selectOption('.choix-demo select', { label: 'Mehdi Rahmani (en formation)' });
  ok((await p.textContent('.boite-questions')).includes('2 ou 3 projets bien racontés'), 'espace : réponse visible par l\'apprenant');
  ok((await p.textContent('.questionnaire-appel')).includes('Modifier mes réponses'), 'espace : questionnaire modifiable');

  // Matching : Lucas veut l'alternance
  await p.click('nav >> text=Entreprises & offres');
  const offres = p.locator('.offre:not(.offre-pourvue)');
  let trouve = false;
  for (let i = 0; i < await offres.count(); i++) {
    const o = offres.nth(i);
    await o.locator('.bouton-suggerer:not(.bouton-shortlist)').click();
    const t = await o.locator('.suggestions').textContent();
    if (t.includes('Préfère') || t.includes('Contrat souhaité')) trouve = true;
  }
  ok(trouve, 'matching : le contrat souhaité apparaît dans les raisons');

  // Mobile
  const m = await ctx.newPage();
  await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(URL); await m.waitForTimeout(300);
  await m.click('nav >> text=Espace apprenant');
  await m.selectOption('.choix-demo select', { label: 'Mehdi Rahmani (en formation)' });
  await m.click('.questionnaire-appel button');
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= 390), 'mobile : questionnaire sans débordement');
  await m.screenshot({ path: out + '/q-mobile.png' });
  console.log('erreurs JS:', JSON.stringify(errs));
  await b.close();
})();
