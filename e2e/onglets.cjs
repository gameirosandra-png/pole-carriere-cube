const { chromium } = require('playwright');
const URL = process.env.URL || 'http://127.0.0.1:4173/';
(async () => {
  const b = await chromium.launch();
  const ok = (c, m) => console.log(c ? '✓' : '✗', m);
  const ctx = await b.newContext();
  await ctx.addInitScript(() => localStorage.setItem('pole-carriere-cube:visite-vue', '1'));
  const a = await ctx.newPage(); const c = await ctx.newPage();
  await a.goto(URL); await c.goto(URL); await a.waitForTimeout(300);
  ok((await a.locator('.mode-connecte').count()) === 0, 'onglet 1 : démo locale');
  // Connexion dans l'onglet 2 (comme au retour du lien magique) : l'onglet 1 suit
  await c.evaluate(() => localStorage.setItem('pole-carriere-cube:session', JSON.stringify({ accessToken: 'x', refreshToken: 'y', expireA: Math.floor(Date.now() / 1000) + 3600, email: 'test@exemple.fr' })));
  await a.waitForTimeout(500);
  ok((await a.locator('.mode-connecte').count()) === 1, 'onglet 1 passe en mode équipe quand l\'onglet 2 se connecte');
  await c.evaluate(() => localStorage.removeItem('pole-carriere-cube:session'));
  await a.waitForTimeout(500);
  ok((await a.locator('.mode-connecte').count()) === 0, 'onglet 1 revient à la démo à la déconnexion');
  await b.close();
})();
