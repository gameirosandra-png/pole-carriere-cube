// Indicateurs de pilotage : entonnoir d'insertion et statistiques par promo.
// Fonctions pures, testées dans rapport.test.ts.

import type { Apprenant } from "./types";
import { aujourdhui, joursEntre } from "./dates";
import { calculerIndicateurs, estInsere } from "./regles";
import { pretAProposer } from "./dossier";

export interface EtapeFunnel {
  id: "sortis" | "dossier" | "entretiens" | "insertion";
  libelle: string;
  effectif: number;
  /** Part de l'étape de départ (apprenants sortis de formation). */
  pourcentage: number;
  /** Nombre d'apprenants perdus depuis l'étape précédente. */
  perte: number;
}

/**
 * Niveau atteint par un apprenant sorti de formation. Les niveaux sont cumulatifs :
 * un apprenant en poste a forcément franchi les étapes d'avant, même si son dossier
 * n'a pas été coché dans l'outil. L'entonnoir est donc toujours décroissant.
 */
function niveau(a: Apprenant): number {
  if (estInsere(a)) return 3;
  if (a.statut === "entretiens") return 2;
  if (pretAProposer(a)) return 1;
  return 0;
}

const ETAPES: { id: EtapeFunnel["id"]; libelle: string }[] = [
  { id: "sortis", libelle: "Sortis de formation" },
  { id: "dossier", libelle: "Dossier prêt" },
  { id: "entretiens", libelle: "En entretiens ou au-delà" },
  { id: "insertion", libelle: "En poste ou freelance" },
];

export function funnelInsertion(apprenants: Apprenant[], today = aujourdhui()): EtapeFunnel[] {
  const sortis = apprenants.filter((a) => a.finFormation <= today);
  const base = sortis.length;
  const effectifs = ETAPES.map((_, k) => sortis.filter((a) => niveau(a) >= k).length);
  return ETAPES.map((e, k) => ({
    ...e,
    effectif: effectifs[k],
    pourcentage: base ? Math.round((effectifs[k] / base) * 100) : 0,
    perte: k === 0 ? 0 : effectifs[k - 1] - effectifs[k],
  }));
}

/** L'étape (hors départ) où l'on perd le plus d'apprenants : là où agir en priorité. */
export function goulot(funnel: EtapeFunnel[]): EtapeFunnel | null {
  const candidates = funnel.slice(1).filter((e) => e.perte > 0);
  return candidates.reduce<EtapeFunnel | null>((max, e) => (!max || e.perte > max.perte ? e : max), null);
}

export interface StatsPromo {
  promo: string;
  finFormation: string;
  effectif: number;
  insertes: number;
  enCours: number;
  /** null tant que la fenêtre de 6 mois n'est pas close pour la promo. */
  tauxSixMois: number | null;
  delaiMoyen: number | null;
  enFormation: boolean;
}

export function statsParPromo(apprenants: Apprenant[], today = aujourdhui()): StatsPromo[] {
  const promos = [...new Set(apprenants.map((a) => a.promo))];
  return promos
    .map((promo) => {
      const membres = apprenants.filter((a) => a.promo === promo);
      const finFormation = membres.reduce((min, a) => (a.finFormation < min ? a.finFormation : min), "9999-12-31");
      const ind = calculerIndicateurs(membres, today);
      const insertes = membres.filter(estInsere).length;
      return {
        promo,
        finFormation,
        effectif: membres.length,
        insertes,
        enCours: membres.length - insertes,
        tauxSixMois: ind.tauxSixMois,
        delaiMoyen: ind.delaiMoyen,
        enFormation: joursEntre(today, finFormation) > 0,
      };
    })
    .sort((x, y) => x.finFormation.localeCompare(y.finFormation));
}
