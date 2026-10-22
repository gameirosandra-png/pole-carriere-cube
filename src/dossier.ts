// Checklist du dossier de candidature : ce qui doit être prêt avant
// de proposer un apprenant à une entreprise. Fonctions pures, testées dans dossier.test.ts.

import type { Apprenant, EtapeDossier } from "./types";
import { aujourdhui } from "./dates";
import { estInsere } from "./regles";

export interface DefinitionEtape {
  id: EtapeDossier;
  libelle: string;
  aide: string;
  /** Qui coche l'étape : l'apprenant lui-même, ou l'équipe après vérification. */
  par: "apprenant" | "equipe";
}

/** Le parcours d'accompagnement, dans l'ordre des séances. */
export const ETAPES_DOSSIER: DefinitionEtape[] = [
  {
    id: "rdvObjectif",
    libelle: "Séance 1 · Bilan et objectif",
    aide: "Clarifier le poste visé, les atouts du parcours d'avant, le calendrier de recherche.",
    par: "equipe",
  },
  {
    id: "cv",
    libelle: "Séance 2 · Atelier CV",
    aide: "Revoir le CV sur 6 critères et réécrire l'accroche.",
    par: "equipe",
  },
  {
    id: "portfolio",
    libelle: "Séance 3 · Atelier portfolio",
    aide: "Au moins deux projets présentables : problème, solution, outils, démo, résultat.",
    par: "apprenant",
  },
  {
    id: "linkedin",
    libelle: "Séance 4 · Profil LinkedIn",
    aide: "Titre, résumé et projets alignés avec le poste visé.",
    par: "apprenant",
  },
  {
    id: "pitch",
    libelle: "Séance 5 · Pitch de 2 minutes",
    aide: "Se présenter avec conviction : parcours, preuve, projet.",
    par: "equipe",
  },
  {
    id: "simulation",
    libelle: "Séance 6 · Simulation d'entretien",
    aide: "Un entretien blanc noté, avec un retour concret.",
    par: "equipe",
  },
  {
    id: "negociation",
    libelle: "Séance 7 · Négociation salariale",
    aide: "Fixer sa prétention à partir du marché et préparer ses arguments.",
    par: "equipe",
  },
];

export const libelleEtape = (id: EtapeDossier) => ETAPES_DOSSIER.find((e) => e.id === id)?.libelle ?? id;

export const etapeFaite = (a: Apprenant, id: EtapeDossier) => Boolean(a.dossier?.[id]);

export interface Completude {
  faites: number;
  total: number;
  pourcentage: number;
}

export function completude(a: Apprenant): Completude {
  const total = ETAPES_DOSSIER.length;
  const faites = ETAPES_DOSSIER.filter((e) => etapeFaite(a, e.id)).length;
  return { faites, total, pourcentage: Math.round((faites / total) * 100) };
}

/** Un dossier est prêt quand toutes les étapes sont faites. */
export const pretAProposer = (a: Apprenant) => completude(a).faites === ETAPES_DOSSIER.length;

/** Première étape non faite, dans l'ordre conseillé. */
export const prochaineEtape = (a: Apprenant) => ETAPES_DOSSIER.find((e) => !etapeFaite(a, e.id)) ?? null;

/** Coche ou décoche une étape. Cocher compte comme un contact avec le pôle. */
export function cocherEtape(a: Apprenant, id: EtapeDossier, faite: boolean, today = aujourdhui()): Apprenant {
  const dossier = { ...a.dossier };
  if (faite) dossier[id] = dossier[id] ?? today;
  else delete dossier[id];
  return { ...a, dossier, dernierContact: faite ? today : a.dernierContact };
}

/** Les apprenants dont on prépare le dossier : ni encore insérés, ni déjà partis. */
export const enAccompagnement = (apprenants: Apprenant[]) => apprenants.filter((a) => !estInsere(a));

export interface IndicateursDossier {
  base: number;
  prets: number;
  completudeMoyenne: number | null;
  parEtape: { etape: DefinitionEtape; faites: number; pourcentage: number }[];
}

/** KPI de préparation, calculés sur les apprenants en accompagnement. */
export function indicateursDossier(apprenants: Apprenant[]): IndicateursDossier {
  const suivis = enAccompagnement(apprenants);
  const base = suivis.length;
  const pct = (n: number) => (base ? Math.round((n / base) * 100) : 0);
  return {
    base,
    prets: suivis.filter(pretAProposer).length,
    completudeMoyenne: base ? Math.round(suivis.reduce((s, a) => s + completude(a).pourcentage, 0) / base) : null,
    parEtape: ETAPES_DOSSIER.map((etape) => {
      const faites = suivis.filter((a) => etapeFaite(a, etape.id)).length;
      return { etape, faites, pourcentage: pct(faites) };
    }),
  };
}
