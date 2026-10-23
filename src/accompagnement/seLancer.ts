// Se lancer en freelance : choisir son statut, créer son activité, facturer, décrocher sa première mission.
// Information générale, pas un conseil juridique ou fiscal. Règles vérifiées le 23 octobre 2026 (sources ci-dessous).
// Fonctions pures, testées.

import type { Apprenant, EtapeLancement, SeLancer, StatutJuridique } from "../types";
import { aujourdhui } from "../dates";

export const SOURCES_LANCEMENT = [
  { nom: "Service-public · compte bancaire du micro-entrepreneur", url: "https://entreprendre.service-public.gouv.fr/vosdroits/F35991" },
  { nom: "Dougs · ACRE et micro-entreprise (réforme 2026)", url: "https://www.dougs.fr/blog/acre-micro-entreprise/" },
  { nom: "Dougs · facturation électronique des auto-entrepreneurs", url: "https://www.dougs.fr/blog/facturation-electronique-auto-entrepreneur/" },
  { nom: "Guichet unique des formalités d'entreprises", url: "https://formalites.entreprises.gouv.fr" },
];

export interface DefinitionStatut {
  id: StatutJuridique;
  nom: string;
  pourQui: string;
  atouts: string;
  limites: string;
}

export const STATUTS_JURIDIQUES: DefinitionStatut[] = [
  {
    id: "micro",
    nom: "Micro-entreprise",
    pourQui: "Démarrer seul·e, tester son activité.",
    atouts:
      "Création gratuite en ligne ; cotisations égales à un pourcentage du chiffre d'affaires (25,6 % en libéral en 2026) ; comptabilité très simple ; patrimoine personnel protégé par défaut.",
    limites: "Chiffre d'affaires plafonné à 83 600 € ; aucune charge déductible ; protection sociale plus limitée.",
  },
  {
    id: "eiReel",
    nom: "Entreprise individuelle au réel",
    pourQui: "Une activité avec des frais importants à déduire.",
    atouts: "Cotisations et impôt calculés sur le bénéfice, frais déduits ; pas de société à créer.",
    limites: "Comptabilité complète : un expert-comptable est conseillé.",
  },
  {
    id: "eurl",
    nom: "EURL",
    pourQui: "Développer son activité, réinvestir, s'associer plus tard.",
    atouts: "Une société distincte de soi ; choix possible de l'impôt sur les sociétés ; cotisations du gérant souvent plus légères qu'en SASU.",
    limites: "Statuts, formalités et comptabilité plus lourds ; frais de création et de gestion.",
  },
  {
    id: "sasu",
    nom: "SASU",
    pourQui: "Se verser un salaire ou des dividendes, viser une activité plus importante.",
    atouts: "Président assimilé salarié : protection sociale proche des salariés (sans assurance chômage) ; grande souplesse.",
    limites: "Charges plus élevées sur la rémunération ; formalités et coût de gestion.",
  },
];

export interface DefinitionEtapeLancement {
  id: EtapeLancement;
  libelle: string;
  aide: string;
  lien?: string;
}

export const ETAPES_LANCEMENT: DefinitionEtapeLancement[] = [
  {
    id: "statut",
    libelle: "Choisir son statut",
    aide: "Comparer les statuts ci-dessus. En cas de doute, un rendez-vous avec un expert-comptable.",
  },
  {
    id: "immatriculation",
    libelle: "S'immatriculer sur le guichet unique",
    aide: "En ligne, gratuit pour une micro-entreprise. On reçoit ensuite son numéro SIRET.",
    lien: "https://formalites.entreprises.gouv.fr",
  },
  {
    id: "acre",
    libelle: "Demander l'ACRE, si éligible",
    aide: "Dans les 60 jours après la création, sur le site de l'Urssaf. Réduction de cotisations la première année (25 % pour les demandes depuis juillet 2026), pour certains profils : demandeurs d'emploi, moins de 26 ans…",
  },
  {
    id: "banque",
    libelle: "Ouvrir un compte bancaire dédié",
    aide: "Obligatoire si le chiffre d'affaires dépasse 10 000 € deux années de suite ; conseillé dès le départ pour séparer le pro du perso.",
    lien: "https://entreprendre.service-public.gouv.fr/vosdroits/F35991",
  },
  {
    id: "rcpro",
    libelle: "Souscrire une assurance RC Pro",
    aide: "Elle couvre les dommages causés chez un client ; beaucoup d'entreprises la demandent avant de signer.",
  },
  {
    id: "facturation",
    libelle: "Choisir son outil de devis et de facturation",
    aide: "Il doit savoir recevoir des factures électroniques (obligatoire depuis le 1er septembre 2026) et les émettre (obligatoire pour les micro-entreprises au 1er septembre 2027).",
  },
  {
    id: "devis",
    libelle: "Préparer ses modèles de devis, factures et CGV",
    aide: "Avec les mentions obligatoires ci-dessous, ses conditions de paiement et d'annulation.",
  },
  {
    id: "plateformes",
    libelle: "Créer ses profils sur les plateformes",
    aide: "Malt, Codeur.com, Comet… : un profil aligné sur son pitch, son portfolio et son TJM.",
  },
  {
    id: "premiereMission",
    libelle: "Décrocher sa première mission",
    aide: "Activer son réseau (métier d'avant, promo, école), proposer une mission courte et cadrée, demander un témoignage à la fin.",
  },
];

/** Mentions obligatoires d'une facture de micro-entrepreneur (prestations entre professionnels). */
export const MENTIONS_FACTURE = [
  "Nom et prénom suivis de « EI » (ou nom commercial), adresse, numéro SIRET",
  "Numéro de facture unique et chronologique, date d'émission",
  "Nom et adresse du client",
  "Désignation de la prestation, quantité ou nombre de jours, prix unitaire hors taxes, total",
  "« TVA non applicable, art. 293 B du CGI » tant que l'on est en franchise de TVA",
  "Date ou délai de paiement, taux des pénalités de retard",
  "Indemnité forfaitaire de 40 € pour frais de recouvrement (clients professionnels)",
];

export const avecLancement =
  (f: (l: SeLancer) => SeLancer) =>
  (a: Apprenant): Apprenant => ({
    ...a,
    accompagnement: { ...a.accompagnement, seLancer: f(a.accompagnement?.seLancer ?? {}) },
  });

export function cocherLancement(l: SeLancer, id: EtapeLancement, faite: boolean, today = aujourdhui()): SeLancer {
  const etapes = { ...l.etapes };
  if (faite) etapes[id] = etapes[id] ?? today;
  else delete etapes[id];
  return { ...l, etapes };
}

export function avancementLancement(l: SeLancer | undefined) {
  const faites = ETAPES_LANCEMENT.filter((e) => l?.etapes?.[e.id]).length;
  return {
    faites,
    total: ETAPES_LANCEMENT.length,
    prochaine: ETAPES_LANCEMENT.find((e) => !l?.etapes?.[e.id]) ?? null,
  };
}

/** L'apprenant vise-t-il le freelance (questionnaire ou statut) ? */
export const viseFreelance = (a: Apprenant) => a.questionnaire?.contrat === "freelance" || a.statut === "freelance";
