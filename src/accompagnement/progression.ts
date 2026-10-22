// Progression d'un apprenant : on relève les scores CV et simulation à chaque séance,
// pour montrer l'effet de l'accompagnement (avant / après). Fonctions pures, testées.

import type { Apprenant, PointProgression } from "../types";
import { aujourdhui } from "../dates";
import { evaluerCV } from "./cv";
import { evaluerSimulation } from "./convaincre";

/** Scores actuels de l'apprenant. */
export const scoresActuels = (a: Apprenant) => ({
  cv: evaluerCV(a.accompagnement?.cv).score,
  simulation: evaluerSimulation(a.accompagnement?.convaincre?.simulation).score,
});

/**
 * Ajoute (ou met à jour) le point du jour si un score a changé.
 * Un seul point par jour : plusieurs corrections dans la même séance ne comptent qu'une fois.
 */
export function enregistrerPoint(a: Apprenant, today = aujourdhui()): Apprenant {
  const { cv, simulation } = scoresActuels(a);
  if (cv === null && simulation === null) return a;
  const historique = a.accompagnement?.historique ?? [];
  const dernier = historique[historique.length - 1];
  if (dernier && dernier.cv === cv && dernier.simulation === simulation) return a;
  const point: PointProgression = { date: today, cv, simulation };
  const suite = dernier?.date === today ? [...historique.slice(0, -1), point] : [...historique, point];
  return { ...a, accompagnement: { ...a.accompagnement, historique: suite } };
}

export interface Evolution {
  debut: number;
  fin: number;
  /** Écart en points entre le premier et le dernier relevé. */
  gain: number;
  points: { date: string; valeur: number }[];
}

function evolution(historique: PointProgression[], cle: "cv" | "simulation"): Evolution | null {
  const points = historique.flatMap((p) => (p[cle] === null ? [] : [{ date: p.date, valeur: p[cle] as number }]));
  if (points.length < 2) return null;
  const debut = points[0].valeur;
  const fin = points[points.length - 1].valeur;
  return { debut, fin, gain: fin - debut, points };
}

export function progression(a: Apprenant) {
  const historique = a.accompagnement?.historique ?? [];
  return { cv: evolution(historique, "cv"), simulation: evolution(historique, "simulation") };
}

/** Gain moyen du score CV, sur les apprenants qui ont au moins deux relevés. */
export function gainMoyenCV(apprenants: Apprenant[]): { gain: number; effectif: number } | null {
  const gains = apprenants.map((a) => progression(a).cv?.gain).filter((g): g is number => g !== undefined);
  if (!gains.length) return null;
  return { gain: Math.round(gains.reduce((s, g) => s + g, 0) / gains.length), effectif: gains.length };
}
