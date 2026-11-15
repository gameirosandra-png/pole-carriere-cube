import type { Donnees } from "./types";
import { ajouterJours, formatMois, joursEntre } from "./dates";

// Les données de démo sont enregistrées dans le navigateur. Revenu quelques semaines plus tard,
// le visiteur verrait tous les rendez-vous « en retard » et aucun atelier à venir.
// On décale donc toutes les dates du nombre de jours écoulés depuis le dernier passage,
// en gardant les modifications faites dans la démo.

const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

function decaler<T>(valeur: T, jours: number): T {
  if (typeof valeur === "string") return (DATE_ISO.test(valeur) ? ajouterJours(valeur, jours) : valeur) as T;
  if (Array.isArray(valeur)) return valeur.map((v) => decaler(v, jours)) as T;
  if (valeur && typeof valeur === "object") {
    return Object.fromEntries(Object.entries(valeur).map(([k, v]) => [k, decaler(v, jours)])) as T;
  }
  return valeur;
}

/** Recale des données de démo enregistrées le `enregistreLe` sur la date `today`. */
export function recalerDonnees(donnees: Donnees, enregistreLe: string, today: string): Donnees {
  const jours = joursEntre(enregistreLe, today);
  if (jours <= 0) return donnees;
  const decalees = decaler(donnees, jours);
  return {
    ...decalees,
    // Le nom de promo suit le mois de fin de formation (« Promo juin 2026 »), s'il n'a pas été renommé.
    apprenants: decalees.apprenants.map((a, i) => {
      const avant = donnees.apprenants[i];
      return avant && avant.promo === `Promo ${formatMois(avant.finFormation)}`
        ? { ...a, promo: `Promo ${formatMois(a.finFormation)}` }
        : a;
    }),
  };
}
