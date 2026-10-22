const { chromium } = require('playwright');
const out = process.argv[2] || require('os').tmpdir();
const URL = process.env.URL || 'http://127.0.0.1:4173/';
(async () => {
  const b = await chromium.launch();
  const ok = (c, m) => console.log(c ? '✓' : '✗', m);
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } });
  // Moteur de synthèse simulé : enregistre les phrases et « parle » 600 ms.
  await ctx.addInitScript(() => {
    localStorage.setItem('pole-carriere-cube:visite-vue', '1');
    window.__dits = [];
    const voix = [
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Microsoft Denise Online (Natural) - French (France)', lang: 'fr-FR' },
      { name: 'Google français', lang: 'fr-FR' },
    ];
    let enCours = null, timer = 0, enPause = false;
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    Object.defineProperty(window, 'speechSynthesis', { value: {
      getVoices: () => voix,
      addEventListener() {},
      speak(u) { if (!u.text.trim()) return; window.__dits.push({ texte: u.text, voix: u.voice && u.voice.name, rate: u.rate }); enCours = u; timer = setTimeout(() => { enCours = null; u.onend && u.onend(); }, 600); },
      cancel() { clearTimeout(timer); const u = enCours; enCours = null; u && u.onerror && u.onerror({ error: 'canceled' }); },
      pause() { enPause = true; clearTimeout(timer); window.__pause = true; },
      resume() { if (enPause && enCours) { const u = enCours; timer = setTimeout(() => { enCours = null; u.onend && u.onend(); }, 600); } enPause = false; },
    }});
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(400);
  await p.click('.entete-banniere button:has-text("Démo auto")');
  await p.waitForTimeout(500);
  ok((await p.textContent('.visite-voix') || '').includes('Microsoft Denise Online (Natural)'), 'voix : la voix neuronale française est choisie');
  await p.screenshot({ path: out + '/v-demo-voix.png' });
  await p.waitForTimeout(1800);
  ok((await p.textContent('.visite-compteur')).includes('2 / 11'), 'voix : la démo avance à la fin de la phrase (pas au minuteur)');
  const dits = await p.evaluate(() => window.__dits);
  ok(dits[0].texte.startsWith('Bienvenue au pôle carrière'), 'voix : texte écrit pour l\'oral');
  // Pause
  await p.click('.visite-bulle button:has-text("Pause")');
  const avant = await p.textContent('.visite-compteur');
  await p.waitForTimeout(2000);
  ok((await p.textContent('.visite-compteur')) === avant, 'voix : pause respectée');
  await p.click('.visite-bulle button:has-text("Reprendre")');
  // Couper la voix → minuteur
  await p.click('.bouton-voix');
  ok((await p.getAttribute('.bouton-voix', 'aria-pressed')) === 'false', 'voix : coupable');
  const n = (await p.evaluate(() => window.__dits.length));
  await p.waitForTimeout(2500);
  ok((await p.evaluate(() => window.__dits.length)) === n, 'voix coupée : plus rien n\'est dit');
  await p.click('.bouton-voix');
  await p.waitForTimeout(300);
  ok((await p.evaluate(() => window.__dits.length)) === n + 1, 'voix réactivée : l\'étape est relue');
  // Navigation manuelle relit l'étape suivante
  await p.click('.visite-bulle button:has-text("Suivant")');
  await p.waitForTimeout(200);
  const derniers = await p.evaluate(() => window.__dits.slice(-1)[0].texte);
  ok(derniers.length > 20, 'Suivant : nouvelle phrase dite');
  // Vitesse : 1× → 1,25×, transmise à la voix, mémorisée
  ok((await p.textContent('.bouton-vitesse')) === '1×', 'vitesse : 1× par défaut');
  await p.click('.bouton-vitesse');
  await p.waitForTimeout(200);
  ok((await p.textContent('.bouton-vitesse')) === '1,25×', 'vitesse : 1,25× au clic');
  const rate = await p.evaluate(() => window.__dits.slice(-1)[0].rate);
  ok(Math.abs(rate - 1.275) < 0.001, 'vitesse : transmise à la voix (' + rate + ')');
  await p.keyboard.press('-');
  ok((await p.textContent('.bouton-vitesse')) === '1×', 'vitesse : touche - pour ralentir');
  await p.keyboard.press('+'); await p.keyboard.press('+');
  ok((await p.textContent('.bouton-vitesse')) === '1,5×', 'vitesse : touche + pour accélérer');
  ok((await p.evaluate(() => localStorage.getItem('pole-carriere-cube:vitesse-demo'))) === '1.5', 'vitesse : mémorisée');
  await p.click('.bouton-vitesse');
  ok((await p.textContent('.bouton-vitesse')) === '0,75×', 'vitesse : 0,75× après 1,5×');
  await p.click('.bouton-vitesse');
  // Aller jusqu'au bout seul
  await p.waitForTimeout(13000);
  ok(!(await p.locator('.visite').count()), 'la démo commentée se termine seule');
  ok(new Set((await p.evaluate(() => window.__dits)).map(d => d.texte)).size === 11, 'les 11 étapes ont été commentées');
  // Échap coupe la voix
  await p.click('.barre-pied .bouton-demo'); await p.waitForTimeout(300);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok(!(await p.locator('.visite').count()), 'Échap ferme la démo');
  console.log('erreurs JS:', JSON.stringify(errs));
  await b.close();
})();
