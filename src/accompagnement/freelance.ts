// Simulateur freelance : « je veux X € net par mois, quel TJM, combien de jours, combien de missions ? »
// et l'inverse : « à ce TJM, combien je gagne ? ». Régime micro-entreprise, activité libérale (BNC).
// Information indicative, pas un conseil juridique ou fiscal. Fonctions pures, testées.

import type { PosteReference } from "../types";
import { referencePoste } from "./salaire";

/** Paramètres 2026 de la micro-entreprise pour une activité libérale non réglementée (SSI). */
export const MICRO_2026 = {
  /** Cotisations sociales, en part du chiffre d'affaires. */
  cotisations: 0.256,
  /** Contribution à la formation professionnelle. */
  cfp: 0.002,
  /** Option impôt sur le revenu payé au fil du chiffre d'affaires (sous condition de revenus du foyer). */
  versementLiberatoire: 0.022,
  /** Plafond de chiffre d'affaires annuel pour rester en micro-entreprise (prestations de services). */
  plafondCA: 83_600,
  /** Au-delà, il faut facturer la TVA (franchise en base, prestations de services). */
  seuilTVA: 37_500,
  verifieLe: "2026-10-23",
  sources: [
    { nom: "LégiSocial · cotisations des auto-entrepreneurs 2026", url: "https://www.legisocial.fr/reperes-sociaux/cotisations-sociales-auto-entrepreneurs-2026.html" },
    { nom: "Swim Legal · taux auto-entrepreneur 2026", url: "https://www.swim.legal/blog/taux-autoentrepreneur-2026-cotisations-impots" },
    { nom: "L-Expert-Comptable · seuils micro-entreprise 2026", url: "https://www.l-expert-comptable.com/a/nouveaux-seuils-micro-entreprise-2026.html" },
    { nom: "Urssaf · évolution des taux (référence officielle)", url: "https://www.urssaf.fr/accueil/actualites/taux-cotisations-autoentrepeneur.html" },
  ],
} as const;

/** Jours fériés tombant un jour de semaine, en moyenne sur l'année (France). */
export const JOURS_FERIES_OUVRES = 8;

export interface HypothesesFreelance {
  /** Ce qui reste chaque mois, après cotisations, frais (et impôt si versement libératoire). */
  netMensuel: number;
  joursParSemaine: number;
  semainesConges: number;
  /** Part du temps de travail facturée au client, de 0 à 1 (le reste : prospection, admin, formation). */
  tauxFacturation: number;
  heuresParJour: number;
  fraisMensuels: number;
  /** Durée typique d'une mission, en jours facturés. */
  dureeMission: number;
  versementLiberatoire: boolean;
  /** Taux de cotisations sociales, modifiable si la règle change. */
  tauxCotisations: number;
}

export const HYPOTHESES_DEFAUT: HypothesesFreelance = {
  netMensuel: 3000,
  joursParSemaine: 5,
  semainesConges: 5,
  tauxFacturation: 0.7,
  heuresParJour: 7,
  fraisMensuels: 150,
  dureeMission: 10,
  versementLiberatoire: false,
  tauxCotisations: MICRO_2026.cotisations,
};

/** Part du chiffre d'affaires prélevée : cotisations, formation, et impôt si versement libératoire. */
export const tauxPreleve = (h: HypothesesFreelance) =>
  h.tauxCotisations + MICRO_2026.cfp + (h.versementLiberatoire ? MICRO_2026.versementLiberatoire : 0);

export function joursFacturablesAn(h: HypothesesFreelance): number {
  const travailles = (52 - h.semainesConges) * h.joursParSemaine - (JOURS_FERIES_OUVRES * h.joursParSemaine) / 5;
  return Math.max(0, Math.round(travailles * h.tauxFacturation));
}

export interface Simulation {
  tjm: number;
  tauxHoraire: number;
  caAnnuel: number;
  caMensuel: number;
  netMensuel: number;
  joursFacturablesAn: number;
  joursFacturesMois: number;
  missionsParMois: number;
  /** Ventilation annuelle du chiffre d'affaires. */
  repartition: { cotisations: number; impot: number; frais: number; net: number };
  depassePlafond: boolean;
  depasseTVA: boolean;
}

function construire(h: HypothesesFreelance, tjm: number, caAnnuel: number): Simulation {
  const jours = joursFacturablesAn(h);
  const cotisations = caAnnuel * (h.tauxCotisations + MICRO_2026.cfp);
  const impot = h.versementLiberatoire ? caAnnuel * MICRO_2026.versementLiberatoire : 0;
  const frais = h.fraisMensuels * 12;
  const net = caAnnuel - cotisations - impot - frais;
  return {
    tjm,
    tauxHoraire: h.heuresParJour ? Math.round(tjm / h.heuresParJour) : 0,
    caAnnuel: Math.round(caAnnuel),
    caMensuel: Math.round(caAnnuel / 12),
    netMensuel: Math.round(net / 12),
    joursFacturablesAn: jours,
    joursFacturesMois: Math.round((jours / 12) * 10) / 10,
    missionsParMois: h.dureeMission ? Math.round((jours / 12 / h.dureeMission) * 10) / 10 : 0,
    repartition: {
      cotisations: Math.round(cotisations),
      impot: Math.round(impot),
      frais,
      net: Math.round(net),
    },
    depassePlafond: caAnnuel > MICRO_2026.plafondCA,
    depasseTVA: caAnnuel > MICRO_2026.seuilTVA,
  };
}

/** « Je vise X € net par mois » → le TJM à facturer (arrondi à la dizaine supérieure). */
export function simulerDepuisRevenu(h: HypothesesFreelance): Simulation {
  const jours = joursFacturablesAn(h);
  const caBrut = ((h.netMensuel + h.fraisMensuels) * 12) / (1 - tauxPreleve(h));
  const tjm = jours ? Math.ceil(caBrut / jours / 10) * 10 : 0;
  return construire(h, tjm, tjm * jours);
}

/** « Je facture X € par jour » → ce qui me reste chaque mois. */
export function simulerDepuisTjm(h: HypothesesFreelance, tjm: number): Simulation {
  return construire(h, tjm, tjm * joursFacturablesAn(h));
}

/** Où se situe ce TJM par rapport au marché junior du poste visé. */
export function positionMarche(tjm: number, poste: PosteReference) {
  const ref = referencePoste(poste);
  const position: "sous" | "dans" | "au-dessus" = tjm < ref.tjmMin ? "sous" : tjm > ref.tjmMax ? "au-dessus" : "dans";
  return { position, min: ref.tjmMin, max: ref.tjmMax, libelle: ref.libelle };
}

export const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;
