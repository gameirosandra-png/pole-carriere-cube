// Atelier « Salaire » : fourchette du marché, prétention argumentée et script de négociation.
// Les fourchettes viennent de sources publiques datées (voir SOURCES_SALAIRE) ; elles sont
// indicatives et à mettre à jour chaque année. Fonctions pures, testées dans salaire.test.ts.

import type { Apprenant, AtelierSalaire, PosteReference } from "../types";
import { completude } from "../dossier";
import { scorePortfolio } from "./portfolio";

export interface Source {
  id: string;
  titre: string;
  url: string;
  date: string;
}

export const SOURCES_SALAIRE: Source[] = [
  {
    id: "jedha",
    titre: "Jedha — Métiers du no-code : emploi, salaires et débouchés en 2026",
    url: "https://www.jedha.co/formation-ia/metiers-no-code-emploi-salaires-debouches",
    date: "2026",
  },
  {
    id: "emlyon",
    titre: "emlyon — Fiche métier chef de projet digital",
    url: "https://em-lyon.com/fr/etudiant/guides/metiers/chef-de-projet-digital",
    date: "2026",
  },
  {
    id: "elitek",
    titre: "Elitek — Salaire d'un Product Owner en France en 2026",
    url: "https://www.elitek.fr/post/product-owner-salaire-france-2026",
    date: "2026",
  },
  {
    id: "letudiant",
    titre: "L'Étudiant (d'après Michael Page) — Développeur no-code",
    url: "https://www.letudiant.fr/metiers/secteur/informatique-telecom-web/developpeur-no-code.html",
    date: "2026",
  },
  {
    id: "apec",
    titre: "Apec — Rémunération des cadres : la singularité francilienne",
    url: "https://corporate.apec.fr/files/live/sites/corporate/files/Nos%20%C3%A9tudes/pdf/Remuneration-cadres-singularite-francilienne.pdf",
    date: "2017",
  },
  {
    id: "codeur",
    titre: "Codeur.com — Tarif moyen des développeurs Bubble",
    url: "https://www.codeur.com/developpeur/bubble/tarif",
    date: "octobre 2026",
  },
];

export interface ReferencePoste {
  id: PosteReference;
  libelle: string;
  /** Salaire brut annuel junior (0-2 ans), France, en euros. */
  min: number;
  max: number;
  /** TJM freelance observé, en euros par jour. */
  tjmMin: number;
  tjmMax: number;
  sources: string[];
}

/**
 * Fourchettes junior retenues. Quand deux sources divergent, on garde la plus prudente
 * pour le bas de fourchette (un junior en reconversion démarre rarement au plafond).
 */
export const REFERENTIEL: ReferencePoste[] = [
  {
    id: "productBuilder",
    libelle: "Product Builder / No-Code Maker",
    min: 35000,
    max: 45000,
    tjmMin: 150,
    tjmMax: 400,
    sources: ["jedha", "codeur"],
  },
  {
    id: "devNoCode",
    libelle: "Développeur no-code",
    min: 30000,
    max: 41000,
    tjmMin: 150,
    tjmMax: 350,
    sources: ["jedha", "letudiant", "codeur"],
  },
  {
    id: "automatisation",
    libelle: "Spécialiste automatisation (Make, n8n)",
    min: 35000,
    max: 42000,
    tjmMin: 150,
    tjmMax: 400,
    sources: ["jedha", "codeur"],
  },
  {
    id: "noCodeOps",
    libelle: "No-Code Ops / RevOps",
    min: 40000,
    max: 48000,
    tjmMin: 200,
    tjmMax: 500,
    sources: ["jedha"],
  },
  {
    id: "chefProjet",
    libelle: "Chef de projet digital / no-code",
    min: 32000,
    max: 45000,
    tjmMin: 200,
    tjmMax: 450,
    sources: ["emlyon", "jedha"],
  },
  {
    id: "productOwner",
    libelle: "Product Owner junior",
    min: 38000,
    max: 45000,
    tjmMin: 250,
    tjmMax: 500,
    sources: ["elitek"],
  },
];

export const referencePoste = (id: PosteReference) => REFERENTIEL.find((r) => r.id === id) ?? REFERENTIEL[0];

/** Devine le poste de référence à partir du poste visé saisi dans la fiche. */
export function devinerPoste(posteVise: string): PosteReference {
  const p = posteVise.toLowerCase();
  if (p.includes("owner")) return "productOwner";
  if (p.includes("ops")) return "noCodeOps";
  if (p.includes("automatisation") || p.includes("automation")) return "automatisation";
  if (p.includes("chef de projet") || p.includes("projet")) return "chefProjet";
  if (p.includes("développeur") || p.includes("developpeur")) return "devNoCode";
  return "productBuilder";
}

export const ATELIER_SALAIRE_DEFAUT = (a: Apprenant): AtelierSalaire => ({
  poste: devinerPoste(a.posteVise),
  zone: "idf",
  contrat: "salarie",
});

const arrondir = (n: number, pas: number) => Math.round(n / pas) * pas;

export interface Pretention {
  reference: ReferencePoste;
  unite: "€ brut/an" | "€/jour";
  basMarche: number;
  hautMarche: number;
  /** Montant à annoncer. */
  annonce: number;
  /** En dessous, mieux vaut négocier autre chose (télétravail, formation, date de revue). */
  plancher: number;
  /** Position dans la fourchette, de 0 (bas) à 1 (haut), avec ce qui la justifie. */
  position: number;
  facteurs: string[];
}

/**
 * Prétention recommandée : on part du bas de fourchette (profil junior) et on monte
 * pour chaque atout objectivable. Règles volontairement simples et explicables à l'apprenant.
 */
export function calculerPretention(a: Apprenant, atelier: AtelierSalaire): Pretention {
  const reference = referencePoste(atelier.poste);
  const facteurs: string[] = [];
  let position = 0.25;

  if (atelier.zone === "idf") {
    position += 0.2;
    facteurs.push("Île-de-France : salaires environ 11 % plus élevés chez les jeunes cadres (Apec)");
  }
  if ((a.anneesExperience ?? 0) >= 5) {
    position += 0.15;
    facteurs.push(`${a.anneesExperience} ans d'expérience professionnelle avant la reconversion`);
  }
  if (completude(a).faites === completude(a).total) {
    position += 0.1;
    facteurs.push("Dossier complet : CV, portfolio, pitch et simulation validés");
  }
  const portfolio = scorePortfolio(a.accompagnement?.portfolio ?? []);
  if (portfolio.projetsSolides >= 2) {
    position += 0.1;
    facteurs.push(`${portfolio.projetsSolides} projets solides à montrer en entretien`);
  }
  position = Math.min(position, 0.85);

  const freelance = atelier.contrat === "freelance";
  const bas = freelance ? reference.tjmMin : reference.min;
  const haut = freelance ? reference.tjmMax : reference.max;
  const pas = freelance ? 10 : 500;
  const annonce = arrondir(bas + (haut - bas) * position, pas);
  const plancher = Math.max(bas, arrondir(annonce * 0.92, pas));

  return {
    reference,
    unite: freelance ? "€/jour" : "€ brut/an",
    basMarche: bas,
    hautMarche: haut,
    annonce,
    plancher,
    position,
    facteurs,
  };
}

export const formatMontant = (n: number, unite: Pretention["unite"]) =>
  unite === "€/jour" ? `${n} €/jour` : `${(n / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k€ brut/an`;

/** Script de négociation à répéter avec l'apprenant. */
export function scriptNegociation(a: Apprenant, p: Pretention): string[] {
  const projets = (a.accompagnement?.portfolio ?? []).filter((x) => x.nom).map((x) => x.nom);
  const preuve = projets.length
    ? `j'ai déjà livré ${projets.length > 1 ? "des projets concrets" : "un projet concret"}, comme ${projets[0]}`
    : "j'ai réalisé des projets concrets pendant ma formation";
  const atout = a.parcoursAvant ? `, et j'apporte ${a.parcoursAvant}` : "";
  return [
    `« Pour un poste de ${p.reference.libelle.toLowerCase()} à mon niveau, le marché se situe entre ${formatMontant(p.basMarche, p.unite)} et ${formatMontant(p.hautMarche, p.unite)}. »`,
    `« Au vu de ce que j'apporte (${preuve}${atout}), je vise ${formatMontant(p.annonce, p.unite)}. »`,
    "Puis se taire et laisser l'employeur répondre : le premier qui reparle après un chiffre cède souvent du terrain.",
    `Si la proposition est en dessous de ${formatMontant(p.plancher, p.unite)} : négocier autre chose (télétravail, budget formation, revue de salaire à 6 mois).`,
  ];
}
