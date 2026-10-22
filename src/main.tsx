import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { PageFicheCandidat } from "./components/FicheCandidat";
import { lireFicheDepuisHash } from "./accompagnement/ficheCandidat";
import "./styles.css";

// Un lien de fiche candidat (#candidat=…) ouvre la fiche seule, sans l'outil interne.
const ficheCandidat = window.location.hash.startsWith("#candidat=");

// Un autre lien de fiche collé dans le même onglet : on recharge pour l'afficher.
window.addEventListener("hashchange", () => {
  if (ficheCandidat || window.location.hash.startsWith("#candidat=")) window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {ficheCandidat ? <PageFicheCandidat fiche={lireFicheDepuisHash(window.location.hash)} /> : <App />}
  </StrictMode>,
);
