import type { Accompagnement, Apprenant } from "../../types";

export interface PropsAtelier {
  apprenant: Apprenant;
  maj: (f: (a: Apprenant) => Apprenant) => void;
}

/** Met à jour une partie de l'accompagnement d'un apprenant. */
export const avecAccompagnement =
  <K extends keyof Accompagnement>(cle: K, f: (actuel: Accompagnement[K]) => Accompagnement[K]) =>
  (a: Apprenant): Apprenant => ({
    ...a,
    accompagnement: { ...a.accompagnement, [cle]: f(a.accompagnement?.[cle]) },
  });
