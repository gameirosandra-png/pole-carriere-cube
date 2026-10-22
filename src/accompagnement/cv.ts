// Atelier « CV » : revue sur 6 critères, notés 0 (à retravailler), 1 (correct) ou 2 (solide).
// Les retours sont priorisés : on commence par les critères les plus faibles.
// Fonctions pures, testées dans accompagnement.test.ts.

import type { AtelierCV, CritereCV } from "../types";

export const CRITERES_CV: { id: CritereCV; libelle: string; conseil: string }[] = [
  {
    id: "titre",
    libelle: "Titre",
    conseil: "Mettre le poste visé en titre (« Product Builder No-Code »), pas l'ancien métier.",
  },
  {
    id: "accroche",
    libelle: "Accroche",
    conseil: "3 lignes : ce que je fais, la preuve, ce que j'apporte de mon parcours d'avant.",
  },
  {
    id: "projets",
    libelle: "Projets no-code",
    conseil: "Placer 2 à 3 projets en haut du CV, avant l'expérience, avec un lien vers le portfolio.",
  },
  {
    id: "resultats",
    libelle: "Résultats chiffrés",
    conseil: "Ajouter un chiffre par projet ou expérience : temps gagné, volume traité, utilisateurs.",
  },
  {
    id: "competences",
    libelle: "Compétences",
    conseil: "Regrouper les outils par usage (données, automatisation, interface) et citer le niveau.",
  },
  {
    id: "lisibilite",
    libelle: "Lisibilité",
    conseil: "Une page, une colonne principale, des verbes d'action ; lisible en 30 secondes.",
  },
];

export const NIVEAUX: { valeur: 0 | 1 | 2; libelle: string }[] = [
  { valeur: 0, libelle: "À retravailler" },
  { valeur: 1, libelle: "Correct" },
  { valeur: 2, libelle: "Solide" },
];

export function evaluerCV(atelier: AtelierCV | undefined) {
  const notes = atelier?.notes ?? {};
  const evalues = CRITERES_CV.filter((c) => notes[c.id] !== undefined);
  const points = evalues.reduce((s, c) => s + (notes[c.id] ?? 0), 0);
  return {
    evalues: evalues.length,
    total: CRITERES_CV.length,
    /** Score sur 100, calculé sur les critères déjà évalués. */
    score: evalues.length ? Math.round((points / (evalues.length * 2)) * 100) : null,
    /** Plan d'action : les critères évalués sous « solide », du plus faible au moins faible. */
    priorites: evalues.filter((c) => (notes[c.id] ?? 0) < 2).sort((x, y) => (notes[x.id] ?? 0) - (notes[y.id] ?? 0)),
    complet: evalues.length === CRITERES_CV.length,
  };
}
