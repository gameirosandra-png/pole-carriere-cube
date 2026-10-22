// Suggestion de candidats pour une offre. Le score (sur 100) additionne trois critères
// transparents, et chaque critère produit une raison lisible par l'équipe.
// Fonctions pures, testées dans matching.test.ts.

import type { Apprenant, Offre } from "./types";
import { completude, pretAProposer } from "./dossier";
import { estInsere } from "./regles";

export const POIDS = { dossier: 40, poste: 35, disponibilite: 25 } as const;

const MOTS_VIDES = new Set([
  "de",
  "du",
  "des",
  "la",
  "le",
  "les",
  "et",
  "en",
  "pour",
  "chez",
  "un",
  "une",
  "junior",
  "senior",
]);

/** « Chef de projet No-Code » → ["chef", "projet", "no-code"] (minuscules, sans accents ni mots vides). */
export function motsCles(texte: string): string[] {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9-]+/)
    .filter((m) => m.length > 1 && !MOTS_VIDES.has(m));
}

export interface Suggestion {
  apprenant: Apprenant;
  score: number;
  raisons: string[];
}

export function scorer(a: Apprenant, offre: Offre): Suggestion {
  const raisons: string[] = [];

  // 1. Dossier : proportionnel à la complétude.
  const c = completude(a);
  const scoreDossier = Math.round((c.faites / c.total) * POIDS.dossier);
  raisons.push(pretAProposer(a) ? "Parcours bouclé" : `Parcours ${c.faites}/${c.total}`);

  // 2. Poste visé : part des mots du poste visé qu'on retrouve dans l'intitulé de l'offre.
  const vises = motsCles(a.posteVise);
  const offreMots = new Set(motsCles(offre.titre));
  const communs = vises.filter((m) => offreMots.has(m));
  const scorePoste = vises.length ? Math.round((communs.length / vises.length) * POIDS.poste) : 0;
  if (communs.length) raisons.push(`Vise « ${a.posteVise} »`);

  // 3. Disponibilité : qui peut démarrer, et sous quelle forme.
  let scoreDispo = 0;
  if (a.statut === "recherche") {
    scoreDispo = POIDS.disponibilite;
    raisons.push("Disponible, en recherche");
  } else if (a.statut === "entretiens") {
    scoreDispo = 15;
    raisons.push("Déjà en process ailleurs");
  } else if (a.statut === "formation") {
    scoreDispo = offre.contrat === "Alternance" ? POIDS.disponibilite : 5;
    raisons.push(offre.contrat === "Alternance" ? "En formation : idéal en alternance" : "Encore en formation");
  }

  // Contrat souhaité (questionnaire) : une offre hors de ses souhaits passe après.
  const souhait = a.questionnaire?.contrat;
  if (souhait && souhait !== "ouvert") {
    const compatible =
      (souhait === "cdi" && (offre.contrat === "CDI" || offre.contrat === "CDD")) ||
      (souhait === "alternance" && offre.contrat === "Alternance") ||
      (souhait === "freelance" && offre.contrat === "Freelance");
    if (compatible) raisons.push("Contrat souhaité");
    else {
      scoreDispo = Math.min(scoreDispo, 5);
      raisons.push(`Préfère ${souhait === "cdi" ? "un CDI" : souhait === "alternance" ? "l'alternance" : "le freelance"}`);
    }
  }

  return { apprenant: a, score: scoreDossier + scorePoste + scoreDispo, raisons };
}

/** Les meilleurs candidats pour une offre, hors apprenants insérés ou déjà proposés. */
export function suggerer(apprenants: Apprenant[], offre: Offre, nombre = 3): Suggestion[] {
  return apprenants
    .filter((a) => !estInsere(a) && !offre.candidats.includes(a.id))
    .map((a) => scorer(a, offre))
    .sort((x, y) => y.score - x.score || x.apprenant.nom.localeCompare(y.apprenant.nom))
    .slice(0, nombre);
}
