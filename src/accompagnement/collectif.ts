// Ateliers collectifs et agenda de la semaine. Fonctions pures, testées.

import type { Apprenant, AtelierCollectif, EtapeDossier } from "../types";
import { ajouterJours, aujourdhui } from "../dates";
import { ETAPES_DOSSIER, enAccompagnement, etapeFaite } from "../dossier";

export const THEMES_ATELIER: { id: EtapeDossier; libelle: string }[] = ETAPES_DOSSIER.filter(
  (e) => e.id !== "rdvObjectif",
).map((e) => ({ id: e.id, libelle: e.libelle.replace(/^Séance \d · /, "") }));

export const libelleTheme = (id: EtapeDossier) => THEMES_ATELIER.find((t) => t.id === id)?.libelle ?? id;

/** Apprenants à inviter : en accompagnement, séance du thème pas encore faite, pas déjà inscrits. */
export function aInviter(atelier: AtelierCollectif, apprenants: Apprenant[]): Apprenant[] {
  return enAccompagnement(apprenants).filter((a) => !etapeFaite(a, atelier.theme) && !atelier.inscrits.includes(a.id));
}

export const placesRestantes = (atelier: AtelierCollectif) => Math.max(0, atelier.places - atelier.inscrits.length);

export interface EvenementSemaine {
  date: string;
  type: "rdv" | "atelier";
  titre: string;
  detail: string;
  /** Apprenant concerné (rendez-vous individuel). */
  apprenantId?: string;
  enRetard: boolean;
}

/**
 * L'agenda du pôle pour les 7 prochains jours : rendez-vous individuels (prochaines actions)
 * et ateliers collectifs, plus les actions en retard à rattraper en tête.
 */
export function agendaSemaine(
  apprenants: Apprenant[],
  ateliers: AtelierCollectif[],
  today = aujourdhui(),
): EvenementSemaine[] {
  const fin = ajouterJours(today, 7);
  const rdv: EvenementSemaine[] = apprenants
    .filter((a) => a.prochaineAction && a.prochaineAction.date <= fin)
    .map((a) => ({
      date: a.prochaineAction!.date,
      type: "rdv" as const,
      titre: `${a.prenom} ${a.nom}`,
      detail: a.prochaineAction!.libelle,
      apprenantId: a.id,
      enRetard: a.prochaineAction!.date < today,
    }));
  const collectifs: EvenementSemaine[] = ateliers
    .filter((x) => x.date >= today && x.date <= fin)
    .map((x) => ({
      date: x.date,
      type: "atelier" as const,
      titre: x.titre,
      detail: `${x.heure} · ${x.inscrits.length}/${x.places} inscrits`,
      enRetard: false,
    }));
  return [...rdv, ...collectifs].sort(
    (x, y) => Number(y.enRetard) - Number(x.enRetard) || x.date.localeCompare(y.date) || x.titre.localeCompare(y.titre),
  );
}
