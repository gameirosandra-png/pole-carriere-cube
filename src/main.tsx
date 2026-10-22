import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { PageFicheCandidat } from "./components/FicheCandidat";
import { lireFicheDepuisHash } from "./accompagnement/ficheCandidat";
import { SimulateurFreelance } from "./components/SimulateurFreelance";
import "./styles.css";

// Un lien de fiche candidat (#candidat=…) ouvre la fiche seule, sans l'outil interne.
const ficheCandidat = window.location.hash.startsWith("#candidat=");
// #simulateur-freelance : le simulateur seul, comme un module à intégrer (page de l'école, iframe).
const simulateurSeul = window.location.hash === "#simulateur-freelance";

// Un autre lien de fiche collé dans le même onglet : on recharge pour l'afficher.
window.addEventListener("hashchange", () => {
  if (ficheCandidat || simulateurSeul || window.location.hash.startsWith("#candidat=") || window.location.hash === "#simulateur-freelance")
    window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {ficheCandidat ? (
      <PageFicheCandidat fiche={lireFicheDepuisHash(window.location.hash)} />
    ) : simulateurSeul ? (
      <main className="page-simulateur">
        <p className="fc-sur-titre">Pôle carrière · outil apprenant</p>
        <h1>Simulateur freelance</h1>
        <p className="secondaire">Je veux tant dans ma poche chaque mois : quel TJM, combien de jours, combien de missions ?</p>
        <SimulateurFreelance />
      </main>
    ) : (
      <App />
    )}
  </StrictMode>,
);
