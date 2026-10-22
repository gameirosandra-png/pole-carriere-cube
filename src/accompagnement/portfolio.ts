// Atelier « Portfolio » : chaque projet est évalué sur 5 critères qu'un recruteur regarde.
// Fonctions pures, testées dans accompagnement.test.ts.

import type { CriterePortfolio, ProjetPortfolio } from "../types";

export const CRITERES_PORTFOLIO: { id: CriterePortfolio; libelle: string; question: string }[] = [
  { id: "probleme", libelle: "Problème", question: "Le besoin de départ est-il clair, avec un vrai utilisateur ?" },
  { id: "solution", libelle: "Solution", question: "Comprend-on ce que fait l'outil en une phrase ?" },
  {
    id: "outils",
    libelle: "Outils",
    question: "Les outils (Airtable, Make, Lovable…) et les choix sont-ils expliqués ?",
  },
  { id: "demo", libelle: "Démo", question: "Y a-t-il un lien, une vidéo ou des captures pour le voir tourner ?" },
  { id: "resultat", libelle: "Résultat", question: "Un résultat chiffré ou un retour utilisateur est-il présenté ?" },
];

/** Un projet est « solide » à partir de 4 critères sur 5. */
export const SEUIL_PROJET_SOLIDE = 4;

export const scoreProjet = (p: ProjetPortfolio) => CRITERES_PORTFOLIO.filter((c) => p.criteres[c.id]).length;

export function scorePortfolio(projets: ProjetPortfolio[]) {
  const scores = projets.map((p) => ({ projet: p, score: scoreProjet(p) }));
  const meilleur = scores.reduce<(typeof scores)[number] | null>((m, x) => (!m || x.score > m.score ? x : m), null);
  return {
    projets: scores,
    projetsSolides: scores.filter((x) => x.score >= SEUIL_PROJET_SOLIDE).length,
    /** Le projet à mettre en avant en premier. */
    phare: meilleur && meilleur.score > 0 ? meilleur.projet : null,
    /** Critère le plus souvent manquant : la priorité de l'atelier. */
    aTravailler:
      CRITERES_PORTFOLIO.map((c) => ({ critere: c, manquants: projets.filter((p) => !p.criteres[c.id]).length }))
        .filter((x) => x.manquants > 0)
        .sort((x, y) => y.manquants - x.manquants)[0]?.critere ?? null,
  };
}

/** Modèle de fiche projet, à copier dans le portfolio de l'apprenant. */
export const MODELE_FICHE_PROJET = `Nom du projet — une phrase qui dit ce qu'il fait

Le problème : qui avait besoin de quoi, et pourquoi c'était pénible avant.
La solution : ce que j'ai construit, en une ou deux phrases.
Les outils : Airtable / Make / Lovable… et pourquoi ces choix.
La démo : lien, vidéo de 60 secondes ou 3 captures.
Le résultat : un chiffre (temps gagné, erreurs évitées, utilisateurs) ou un retour client.`;
