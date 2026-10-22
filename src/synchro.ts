// Synchronisation avec la base partagée : on compare l'état déjà enregistré à l'état
// de l'app, et on n'envoie que les documents ajoutés, modifiés ou supprimés.
// Fonction pure, testée dans synchro.test.ts.

import type { Donnees } from "./types";

interface AvecId {
  id: string;
}

export interface Changements<T> {
  aEcrire: T[];
  aSupprimer: string[];
}

export function comparer<T extends AvecId>(avant: T[], apres: T[]): Changements<T> {
  const anciens = new Map(avant.map((x) => [x.id, JSON.stringify(x)]));
  const nouveauxIds = new Set(apres.map((x) => x.id));
  return {
    aEcrire: apres.filter((x) => anciens.get(x.id) !== JSON.stringify(x)),
    aSupprimer: avant.filter((x) => !nouveauxIds.has(x.id)).map((x) => x.id),
  };
}

export function changementsDonnees(avant: Donnees, apres: Donnees) {
  const apprenants = comparer(avant.apprenants, apres.apprenants);
  const entreprises = comparer(avant.entreprises, apres.entreprises);
  const vide =
    !apprenants.aEcrire.length &&
    !apprenants.aSupprimer.length &&
    !entreprises.aEcrire.length &&
    !entreprises.aSupprimer.length;
  return { apprenants, entreprises, vide };
}
