// Règles métier du pôle carrière. Fonctions pures, sans dépendance à React :
// elles sont couvertes par les tests de src/regles.test.ts.

import type { Apprenant, Statut } from "./types";
import { ajouterMois, aujourdhui, joursEntre } from "./dates";

export const STATUTS: { id: Statut; libelle: string }[] = [
  { id: "formation", libelle: "En formation" },
  { id: "recherche", libelle: "En recherche" },
  { id: "entretiens", libelle: "En entretiens" },
  { id: "poste", libelle: "En poste" },
  { id: "freelance", libelle: "Freelance" },
];

export const libelleStatut = (s: Statut) => STATUTS.find((x) => x.id === s)?.libelle ?? s;

/** Un apprenant est inséré s'il est en poste ou lancé en freelance. */
export const estInsere = (a: Pick<Apprenant, "statut">) => a.statut === "poste" || a.statut === "freelance";

export const SEUIL_RELANCE_JOURS = 14;
export const FENETRE_INSERTION_MOIS = 6;

/**
 * Raison pour laquelle un apprenant doit être relancé, ou null.
 * - action prévue dont la date est dépassée ;
 * - ou aucun contact depuis plus de SEUIL_RELANCE_JOURS (hors apprenants en formation).
 * Les apprenants insérés ne sont jamais à relancer.
 */
export function raisonRelance(a: Apprenant, today = aujourdhui()): string | null {
  if (estInsere(a)) return null;
  if (a.prochaineAction && a.prochaineAction.date < today) return "Action en retard";
  const silence = joursEntre(a.dernierContact, today);
  if (a.statut !== "formation" && silence > SEUIL_RELANCE_JOURS) return `Sans contact depuis ${silence} j`;
  return null;
}

export interface Indicateurs {
  /** % d'apprenants insérés dans les 6 mois, parmi ceux dont la fenêtre de 6 mois est terminée. */
  tauxSixMois: number | null;
  baseSixMois: number;
  /** Délai moyen, en jours, entre la fin de formation et l'insertion. */
  delaiMoyen: number | null;
  enEntretiens: number;
  aRelancer: Apprenant[];
}

export function calculerIndicateurs(apprenants: Apprenant[], today = aujourdhui()): Indicateurs {
  const fenetreClose = apprenants.filter((a) => ajouterMois(a.finFormation, FENETRE_INSERTION_MOIS) <= today);
  const insereDansLesTemps = fenetreClose.filter(
    (a) =>
      estInsere(a) &&
      a.dateInsertion !== undefined &&
      a.dateInsertion <= ajouterMois(a.finFormation, FENETRE_INSERTION_MOIS),
  );

  const delais = apprenants
    .filter((a) => estInsere(a) && a.dateInsertion)
    .map((a) => Math.max(0, joursEntre(a.finFormation, a.dateInsertion!)));

  return {
    tauxSixMois: fenetreClose.length ? Math.round((insereDansLesTemps.length / fenetreClose.length) * 100) : null,
    baseSixMois: fenetreClose.length,
    delaiMoyen: delais.length ? Math.round(delais.reduce((s, d) => s + d, 0) / delais.length) : null,
    enEntretiens: apprenants.filter((a) => a.statut === "entretiens").length,
    aRelancer: apprenants.filter((a) => raisonRelance(a, today) !== null),
  };
}

/**
 * Nouveau statut d'un apprenant. Tout changement compte comme un contact,
 * et l'insertion est datée au premier passage en poste ou en freelance.
 */
export function changerStatut(a: Apprenant, statut: Statut, today = aujourdhui()): Apprenant {
  if (statut === a.statut) return a;
  const insere = statut === "poste" || statut === "freelance";
  return {
    ...a,
    statut,
    dernierContact: today,
    dateInsertion: insere ? (a.dateInsertion ?? today) : undefined,
    entreprise: insere ? a.entreprise : undefined,
  };
}
