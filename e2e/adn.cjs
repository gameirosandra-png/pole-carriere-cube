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

  // Mise en avant : encart sur le tableau de bord, écran dédié dans le menu
  ok((await p.textContent('.encart-adn')).includes('Yanis Lambert'), 'tableau de bord : encart ADN avec qui écouter');
  await p.screenshot({ path: out + '/adn-tdb.png' });
  await p.click('.encart-adn button:has-text("Ouvrir la méthode ADN")');
  ok((await p.textContent('h1')) === 'Méthode ADN', 'écran Méthode ADN ouvert depuis l\'encart');
  ok((await p.locator('.meteo-ligne').count()) === 6 && (await p.locator('.meteo-ligne.alerte').count()) === 2, 'météo de la cohorte : 6 apprenants, 2 à écouter');
  ok((await p.textContent('.adn-conseil')).includes('Peur de gagner de l\'argent'), 'atelier collectif proposé sur le frein n°1');
  await p.screenshot({ path: out + '/adn-page.png', fullPage: true });
  await p.click('nav >> text=Simulateur freelance');
  ok((await p.locator('.simulateur').count()) === 1, 'simulateur dans le menu');
  await p.click('nav >> text=Tableau de bord');

  // Fiche d'Hugo : onglet Méthode ADN
  await p.click('.carre[title="Hugo Martin"]');
  await p.click('#onglet-adn');
  ok((await p.locator('.adn-lettres span.fait').count()) === 3, 'Hugo : 3 piliers ADN en place');
  ok((await p.locator('.adn-freins li').count()) === 2, 'Hugo : 2 freins avec exercice');
  ok((await p.locator('.adn-historique li').count()) === 3, 'Hugo : historique de météo');
  await p.locator('.adn').scrollIntoViewIfNeeded();
  await p.screenshot({ path: out + '/adn-fiche.png' });
  // Météo du jour en tempête → alerte
  await p.click('#panneau-adn label:has-text("Tempête")');
  ok((await p.textContent('#panneau-adn')).includes('Confiance en baisse'), 'météo basse → alerte pour l\'équipe');
  // Frein ajouté → exercice
  await p.click('#panneau-adn label:has-text("Syndrome de l\'imposteur")');
  ok((await p.locator('.adn-freins li').count()) === 3, 'frein coché → exercice affiché');
  // Croyance recadrée
  await p.fill('.adn-ajout input[placeholder^="Ex. Je suis trop vieux"]', 'Je ne suis pas assez technique');
  await p.click('.adn-ajout button:has-text("Ajouter")');
  ok((await p.locator('.adn-croyances li').count()) === 3, 'croyance ajoutée');
  // Brief : reprend la météo et les freins
  await p.click('#onglet-suivi');
  await p.click('.fiche button:has-text("Préparer le rendez-vous")');
  const brief = await p.textContent('.brief');
  ok(brief.includes('Confiance en baisse') && brief.includes('Frein : syndrome'), 'brief : confiance et freins repris');
  await p.keyboard.press('Escape');

  // Espace apprenant : la même méthode, au tutoiement
  await p.click('nav >> text=Espace apprenant');
  await p.selectOption('.choix-demo select', { label: 'Hugo Martin' });
  ok((await p.textContent('.espace-adn')).includes('Ta météo de confiance'), 'espace : méthode ADN au tutoiement');
  await p.fill('.espace-adn input[placeholder^="Ex. J\'ai annoncé"]', 'Relance envoyée à Kairos RH');
  await p.click('.espace-adn button:has-text("Noter")');
  ok((await p.locator('.espace-adn .adn-victoires li').count()) === 4, 'espace : victoire notée');

  // Se lancer : Mehdi passe en freelance
  await p.selectOption('.choix-demo select', { label: 'Mehdi Rahmani (en formation)' });
  await p.click('.questionnaire-appel button');
  await p.click('.questionnaire label:has-text("Freelance")');
  await p.click('.questionnaire button:has-text("Envoyer mes réponses")');
  await p.click('.volet-freelance .onglet:has-text("Se lancer")');
  ok((await p.locator('.statut').count()) === 4, 'se lancer : 4 statuts comparés');
  await p.click('.statut:has-text("Micro-entreprise")');
  ok((await p.textContent('.se-lancer-tete')).includes('1/9'), 'statut choisi → démarche 1 cochée');
  await p.click('.checklist-lancement li:has-text("guichet unique") input');
  ok((await p.textContent('.se-lancer-tete')).includes('2/9') && (await p.textContent('.se-lancer-tete')).includes('acre'), '2/9, prochaine : ACRE');
  ok((await p.textContent('.se-lancer')).includes('293 B du CGI'), 'mentions obligatoires de facture');
  await p.locator('.se-lancer').scrollIntoViewIfNeeded();
  await p.screenshot({ path: out + '/se-lancer.png' });
  // Côté équipe : visible dans la fiche
  await p.click('nav >> text=Apprenants');
  await p.click('text=Mehdi Rahmani');
  ok((await p.textContent('.fiche')).includes('Se lancer en freelance') && (await p.textContent('.fiche .se-lancer-tete')).includes('2/9'), 'fiche : avancement « se lancer » visible par l\'équipe');

  // Mobile
  const m = await ctx.newPage();
  await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(URL); await m.waitForTimeout(300);
  await m.click('nav >> text=Espace apprenant');
  await m.selectOption('.choix-demo select', { label: 'Hugo Martin' });
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= 390), 'mobile : espace avec méthode ADN sans débordement');
  console.log('erreurs JS:', JSON.stringify(errs));
  await b.close();
})();
