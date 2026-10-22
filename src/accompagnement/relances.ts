// Relances automatiques : les messages que le pôle envoie sans y penser.
// - rappel aux inscrits d'un atelier collectif qui a lieu dans les 2 jours ;
// - message aux apprenants sans contact depuis plus de 14 jours.
// Fonctions pures, testées. L'envoi passe par /api/relances (scénario Make).

import type { Apprenant, AtelierCollectif } from "../types";
import { aujourdhui, formatDate, joursEntre } from "../dates";
import { estInsere, SEUIL_RELANCE_JOURS } from "../regles";
import { prochaineEtape } from "../dossier";

const minusculeInitiale = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

export interface RelanceAuto {
  type: "atelier" | "silence";
  apprenantId: string;
  destinataire: string;
  objet: string;
  message: string;
}

export function relancesAuto(apprenants: Apprenant[], ateliers: AtelierCollectif[], today = aujourdhui()): RelanceAuto[] {
  const parId = new Map(apprenants.map((a) => [a.id, a]));
  const rappels = ateliers
    .filter((at) => {
      const dans = joursEntre(today, at.date);
      return dans >= 1 && dans <= 2;
    })
    .flatMap((at) =>
      at.inscrits.flatMap((id) => {
        const a = parId.get(id);
        if (!a) return [];
        const quand = joursEntre(today, at.date) === 1 ? "demain" : `le ${formatDate(at.date)}`;
        return [
          {
            type: "atelier" as const,
            apprenantId: a.id,
            destinataire: `${a.prenom} ${a.nom}`,
            objet: `Rappel : atelier « ${at.titre} » ${quand}`,
            message: `Bonjour ${a.prenom}, on t'attend ${quand} à ${at.heure} pour l'atelier « ${at.titre} ». Si tu ne peux pas venir, dis-le-nous pour libérer ta place.`,
          },
        ];
      }),
    );

  const silences = apprenants
    .filter((a) => !estInsere(a) && a.statut !== "formation")
    .filter((a) => joursEntre(a.dernierContact, today) > SEUIL_RELANCE_JOURS)
    .map((a) => {
      const etape = prochaineEtape(a);
      return {
        type: "silence" as const,
        apprenantId: a.id,
        destinataire: `${a.prenom} ${a.nom}`,
        objet: "Où en es-tu dans ta recherche ?",
        message: `Bonjour ${a.prenom}, ça fait ${joursEntre(a.dernierContact, today)} jours qu'on ne s'est pas parlé. Où en es-tu ? ${
          etape ? `Prochaine étape de ton parcours : ${minusculeInitiale(etape.libelle.replace(/^Séance \d+ · /, ""))}.` : ""
        } Réponds en 1 minute depuis ton espace apprenant, ou réserve un créneau avec le pôle.`.replace(/\s+/g, " "),
      };
    });

  return [...rappels, ...silences];
}
