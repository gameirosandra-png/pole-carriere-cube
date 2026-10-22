// Shortlist : le message envoyé à une entreprise partenaire pour lui présenter
// jusqu'à 3 profils, chacun avec le lien de sa fiche candidat. Fonctions pures, testées.

import type { Apprenant, Entreprise, Offre } from "../types";
import { ficheCandidat, lienFiche } from "./ficheCandidat";

export const TAILLE_SHORTLIST = 3;

export function messageShortlist(entreprise: Entreprise, offre: Offre, profils: Apprenant[], origine: string) {
  const choisis = profils.slice(0, TAILLE_SHORTLIST);
  const pluriel = choisis.length > 1;
  const sujet = `${choisis.length} profil${pluriel ? "s" : ""} pour votre offre « ${offre.titre} »`;
  const blocs = choisis.map((a, i) => {
    const f = ficheCandidat(a);
    const accroche = f.parcoursAvant ? `Avant sa reconversion : ${f.parcoursAvant}.` : "";
    return [`${i + 1}. ${f.prenom} ${f.initiale}. · ${f.posteVise}`, accroche, f.disponibilite, `Sa fiche : ${lienFiche(a, origine)}`]
      .filter(Boolean)
      .join("\n");
  });
  const corps = [
    "Bonjour,",
    "",
    `Suite à votre offre « ${offre.titre} » (${offre.contrat}), voici ${pluriel ? `les ${choisis.length} profils` : "le profil"} que le pôle carrière vous recommande. ${pluriel ? "Chacun a" : "Il a"} suivi notre parcours d'accompagnement : CV, portfolio, pitch et entretiens blancs.`,
    "",
    ...blocs.flatMap((b) => [b, ""]),
    `Je vous propose un échange de 15 minutes cette semaine pour organiser les entretiens${pluriel ? " avec ceux qui vous intéressent" : ""}.`,
    "",
    "Bien à vous,",
    "Le pôle carrière",
  ];
  return { sujet, corps: corps.join("\n"), entreprise: entreprise.nom };
}

export const lienMailto = (sujet: string, corps: string) =>
  `mailto:?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
