const { chromium } = require('playwright');
const out = process.argv[2] || require('os').tmpdir();
const URL = process.env.URL || 'http://127.0.0.1:4173/';
(async () => {
  const b = await chromium.launch();
  const ok = (c, m) => console.log(c ? '✓' : '✗', m);
  const errs = [];

  // --- Visite guidée au premier passage
  const p = await b.newPage({ viewport: { width: 1360, height: 900 } });
  p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  await p.goto(URL); await p.waitForTimeout(600);
  ok(await p.locator('.visite-bulle').isVisible(), 'visite lancée au premier passage');
  await p.screenshot({ path: out + '/w-visite-1.png' });
  const titres = [];
  for (let i = 0; i < 8; i++) {
    titres.push(await p.textContent('#visite-titre'));
    ok(await p.locator('.visite-projecteur').count() === 1, `étape ${i + 1} : zone mise en lumière`);
    if (i === 4) await p.screenshot({ path: out + '/w-visite-5.png' });
    await p.click(i < 7 ? '.visite-bulle button:has-text("Suivant")' : '.visite-bulle button:has-text("Terminer")');
    await p.waitForTimeout(250);
  }
  ok(!(await p.locator('.visite').count()), 'visite terminée');
  ok((await p.locator('nav .actif').textContent()) === 'Tableau de bord', 'retour au tableau de bord');
  await p.reload(); await p.waitForTimeout(400);
  ok(!(await p.locator('.visite').count()), 'pas relancée au 2e passage');
  await p.click('.entete-banniere button:has-text("Visite guidée")');
  ok(await p.locator('.visite-bulle').isVisible(), 'relançable depuis la bannière');
  await p.keyboard.press('Escape');
  ok(!(await p.locator('.visite').count()), 'Échap ferme la visite');

  // --- Funnel
  const funnel = await p.locator('.funnel-barre strong').allTextContents();
  ok(funnel.join(',') === '13,9,9,7', 'funnel 13 → 9 → 9 → 7');
  ok((await p.textContent('.funnel-conseil')).includes('Parcours bouclé'), 'goulot : parcours bouclé');

  // --- Notes : modifier / supprimer + annulation
  await p.click('.carre[title="Thomas Girard"]');
  await p.click('.notes button:has-text("Modifier")');
  await p.fill('.note-edition textarea', 'Note modifiée');
  await p.click('.note-edition button:has-text("Enregistrer")');
  ok((await p.textContent('.notes')).includes('Note modifiée'), 'note modifiée');
  await p.click('.notes button:has-text("Supprimer")');
  ok((await p.textContent('.fiche')).includes("Aucune note"), 'note supprimée');
  ok(await p.locator('.toast').isVisible(), 'message d\'annulation affiché');
  await p.click('.toast-annuler');
  ok((await p.textContent('.notes')).includes('Note modifiée'), 'annulation : note restaurée');

  // --- Suppression de fiche annulable
  await p.click('text=Supprimer la fiche');
  ok((await p.locator('.carre').count()) === 15, 'fiche supprimée (15)');
  await p.click('.toast-annuler');
  ok((await p.locator('.carre').count()) === 16, 'annulation : fiche restaurée (16)');

  // --- Entreprises : matching, retrait, suppression
  await p.click('nav >> text=Entreprises & offres');
  const offreKairos = p.locator('.entreprise:has(h2:text("Kairos RH")) .offre').first();
  await offreKairos.locator('.bouton-suggerer:not(.bouton-shortlist)').click();
  const sugg = await offreKairos.locator('.suggestions-liste li').count();
  ok(sugg === 3, '3 suggestions');
  const premier = await offreKairos.locator('.suggestions-liste li').first().textContent();
  ok(premier.includes('Hugo Martin') && premier.includes('Vise « Product Builder »'), 'meilleur profil : ' + premier.replace(/\s+/g, ' ').slice(0, 80));
  await p.screenshot({ path: out + '/w-matching.png' });
  await offreKairos.locator('.suggestions-liste li').first().locator('button:has-text("Proposer")').click();
  ok((await offreKairos.locator('.jeton').count()) === 2, 'candidat proposé depuis la suggestion');
  await offreKairos.locator('.jeton-retirer').last().click();
  ok((await offreKairos.locator('.jeton').count()) === 1, 'candidat retiré');
  const nbEntreprises = await p.locator('.entreprise').count();
  await p.locator('.entreprise').first().locator('.entreprise-supprimer').click();
  ok((await p.locator('.entreprise').count()) === nbEntreprises - 1, 'entreprise supprimée');
  await p.click('.toast-annuler');
  ok((await p.locator('.entreprise').count()) === nbEntreprises, 'entreprise restaurée');

  // --- Espace apprenant pour un apprenant en formation
  await p.click('nav >> text=Espace apprenant');
  await p.selectOption('.choix-demo select', { label: 'Lucas Bernard (en formation)' });
  ok((await p.textContent('.espace')).includes('Encore en formation'), 'apprenant en formation : carte dédiée');
  ok(await p.locator('.checklist').isVisible(), 'apprenant en formation : checklist accessible');

  // --- Rapport
  await p.click('nav >> text=Rapport');
  ok((await p.locator('.rapport-tableau').first().locator('tbody tr').count()) === 3, 'rapport : 3 promos');
  ok((await p.textContent('.rapport-chiffres')).includes('83 %'), 'rapport : 83 %');
  await p.screenshot({ path: out + '/w-rapport.png', fullPage: true });
  await p.emulateMedia({ media: 'print' });
  ok(!(await p.locator('.barre').isVisible()), 'impression : menu masqué');
  await p.pdf({ path: out + '/w-rapport.pdf', format: 'A4', printBackground: true });
  await p.emulateMedia({ media: 'screen' });

  // --- Mobile : tous les onglets visibles
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.addInitScript(() => localStorage.setItem('pole-carriere-cube:visite-vue', '1'));
  await m.goto(URL); await m.waitForTimeout(400);
  const visibles = await m.evaluate(() => [...document.querySelectorAll('.nav-lien')].every(b => { const r = b.getBoundingClientRect(); return r.right <= innerWidth && r.left >= 0; }));
  ok(visibles, 'mobile : les 5 onglets visibles sans défilement');
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= 390), 'mobile : pas de débordement');
  await m.screenshot({ path: out + '/w-mobile.png' });
  const mv = await b.newPage({ viewport: { width: 390, height: 844 } });
  await mv.goto(URL); await mv.waitForTimeout(600);
  await mv.screenshot({ path: out + '/w-mobile-visite.png' });
  ok(await mv.locator('.visite-bulle').isVisible(), 'mobile : visite lisible');

  console.log('erreurs JS:', JSON.stringify(errs));
  await b.close();
})();
