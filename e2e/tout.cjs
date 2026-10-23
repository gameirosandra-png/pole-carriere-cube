// Lance toutes les vérifications de bout en bout, l'une après l'autre.
// Prérequis : l'app servie (npm run build && npm run preview), Playwright installé :
//   npm i -D playwright && npx playwright install chromium
// Puis : npm run e2e   (ou URL=https://… npm run e2e pour viser un autre déploiement)
const { execFileSync } = require('child_process');
const path = require('path');
const suites = ['base', 'dossier', 'wow', 'accomp', 'plus', 'voix', 'questionnaire', 'freelance', 'adn', 'ia'];
let ok = 0, ko = 0;
for (const s of suites) {
  const sortie = execFileSync(process.execPath, [path.join(__dirname, `${s}.cjs`)], { encoding: 'utf8', env: process.env });
  const reussis = (sortie.match(/✓/g) || []).length, rates = (sortie.match(/✗/g) || []).length;
  ok += reussis; ko += rates;
  console.log(`${rates ? '✗' : '✓'} ${s} : ${reussis} vérifications${rates ? `, ${rates} en échec` : ''}`);
  if (rates) console.log(sortie.split('\n').filter((l) => l.startsWith('✗')).join('\n'));
}
console.log(`\n${ok} vérifications réussies, ${ko} en échec`);
process.exit(ko ? 1 : 0);
