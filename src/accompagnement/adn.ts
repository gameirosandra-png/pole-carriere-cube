// Méthode ADN : l'accompagnement signature du pôle, entre carrière et développement personnel.
// A comme Ancrer (forces, valeurs, ce que l'on garde de son métier d'avant, confiance),
// D comme Diriger (un cap, les freins à lever, les croyances à recadrer),
// N comme Narrer (les victoires qui nourrissent le récit de la reconversion).
// Fonctions pures, testées.

import type { Apprenant, EtapeDossier, FreinId, MethodeADN } from "../types";
import { aujourdhui } from "../dates";

export const PILIERS = [
  { lettre: "A", nom: "Ancrer", promesse: "Savoir sur quoi s'appuyer : ses forces, ses valeurs, ce que l'on garde de son métier d'avant." },
  { lettre: "D", nom: "Diriger", promesse: "Se donner un cap, et lever ce qui freine : peurs, croyances, plafonds." },
  { lettre: "N", nom: "Narrer", promesse: "Raconter sa reconversion avec fierté, preuves à l'appui." },
] as const;

export const VALEURS = [
  "Autonomie",
  "Utilité",
  "Transmission",
  "Créativité",
  "Sécurité",
  "Équilibre de vie",
  "Apprentissage",
  "Reconnaissance",
  "Liberté",
  "Impact",
  "Collectif",
  "Exigence",
];
export const MAX_VALEURS = 3;

export const METEO = [
  { note: 1, libelle: "Tempête" },
  { note: 2, libelle: "Pluie" },
  { note: 3, libelle: "Variable" },
  { note: 4, libelle: "Éclaircies" },
  { note: 5, libelle: "Grand soleil" },
] as const;

export const libelleMeteo = (note: number) => METEO.find((m) => m.note === note)?.libelle ?? "";

export interface Frein {
  id: FreinId;
  libelle: string;
  /** Ce que l'apprenant dit quand ce frein est là. */
  signe: string;
  /** Un exercice concret, à faire avant la prochaine séance. */
  exercice: string;
  /** Une reformulation à s'approprier. */
  recadrage: string;
  seance: EtapeDossier | null;
}

export const FREINS: Frein[] = [
  {
    id: "imposteur",
    libelle: "Syndrome de l'imposteur",
    signe: "« On va découvrir que je ne sais pas vraiment faire. »",
    exercice: "Lister 5 preuves concrètes (projets livrés, retours reçus, résultats) et les relire avant chaque entretien.",
    recadrage: "« J'ai déjà livré. Je ne sais pas tout, et personne ne sait tout. »",
    seance: "pitch",
  },
  {
    id: "plafondVerre",
    libelle: "Plafond de verre",
    signe: "« Ce genre de poste, ce n'est pas pour quelqu'un comme moi. »",
    exercice: "Trouver sur LinkedIn 3 personnes au parcours proche qui occupent le poste visé, et noter comment elles y sont arrivées.",
    recadrage: "« D'autres l'ont fait avec un parcours comme le mien. Je regarde comment. »",
    seance: "linkedin",
  },
  {
    id: "argent",
    libelle: "Peur de gagner de l'argent",
    signe: "« Je n'ose pas annoncer mon prix, j'ai peur de demander trop. »",
    exercice: "Annoncer sa prétention ou son TJM à voix haute 5 fois, puis en simulation, appuyé·e sur la fourchette du marché.",
    recadrage: "« Mon prix reflète ce que j'apporte et le marché, pas ma valeur en tant que personne. »",
    seance: "negociation",
  },
  {
    id: "legitimite",
    libelle: "Trop vieux, pas assez tech",
    signe: "« À mon âge, face à des profils plus jeunes et plus techniques… »",
    exercice: "Écrire 3 choses que son métier d'avant apporte et qu'un junior n'a pas : le terrain, les clients, la gestion d'équipe.",
    recadrage: "« Mon expérience est un avantage : je comprends les métiers que j'outille. »",
    seance: "rdvObjectif",
  },
  {
    id: "perfectionnisme",
    libelle: "Perfectionnisme",
    signe: "« J'enverrai mon portfolio quand il sera parfait. »",
    exercice: "Fixer une date d'envoi et publier une version suffisante. L'améliorer ensuite.",
    recadrage: "« Un projet montré vaut mieux que dix projets cachés. »",
    seance: "portfolio",
  },
  {
    id: "rejet",
    libelle: "Peur du rejet",
    signe: "« Je n'ose pas relancer, contacter, prospecter. »",
    exercice: "Viser 10 « non » cette semaine : chaque refus compte comme un pas de plus.",
    recadrage: "« Un refus concerne une offre, pas ma personne. »",
    seance: "simulation",
  },
  {
    id: "comparaison",
    libelle: "Comparaison aux autres",
    signe: "« Les autres de ma promo trouvent plus vite que moi. »",
    exercice: "Se comparer seulement à soi il y a un mois : relire son journal des victoires.",
    recadrage: "« Mon rythme n'est pas celui des autres. Je regarde le chemin parcouru. »",
    seance: null,
  },
];

export const frein = (id: FreinId) => FREINS.find((f) => f.id === id);

/** Met à jour la méthode ADN d'un apprenant. */
export const avecADN =
  (f: (adn: MethodeADN) => MethodeADN) =>
  (a: Apprenant): Apprenant => ({
    ...a,
    accompagnement: { ...a.accompagnement, adn: f(a.accompagnement?.adn ?? {}) },
  });

/** Note la météo du jour (une seule par jour : la dernière remplace). */
export function noterMeteo(adn: MethodeADN, note: 1 | 2 | 3 | 4 | 5, today = aujourdhui()): MethodeADN {
  const meteo = (adn.meteo ?? []).filter((m) => m.date !== today);
  return { ...adn, meteo: [...meteo, { date: today, note }].sort((x, y) => x.date.localeCompare(y.date)) };
}

/** Tendance de la confiance : la dernière météo, et une alerte si elle est basse ou en chute. */
export function tendanceConfiance(adn: MethodeADN | undefined) {
  const m = adn?.meteo ?? [];
  if (!m.length) return null;
  const derniere = m[m.length - 1].note;
  const precedente = m.length > 1 ? m[m.length - 2].note : null;
  return {
    derniere,
    evolution: precedente === null ? 0 : derniere - precedente,
    alerte: derniere <= 2 || (precedente !== null && precedente - derniere >= 2),
  };
}

/** Où en est chaque pilier. */
export function avancementADN(adn: MethodeADN | undefined) {
  const a = adn ?? {};
  const ancrer = Boolean(a.forces?.trim()) && (a.valeurs?.length ?? 0) > 0;
  const diriger = Boolean(a.cap?.trim()) && (a.croyances ?? []).some((c) => c.recadrage?.trim());
  const narrer = (a.victoires?.length ?? 0) >= 3;
  return { ancrer, diriger, narrer, faits: [ancrer, diriger, narrer].filter(Boolean).length };
}

/** Ce que l'équipe doit avoir en tête avant le rendez-vous. */
export function pointsAttentionADN(adn: MethodeADN | undefined): string[] {
  const points: string[] = [];
  const t = tendanceConfiance(adn);
  if (t?.alerte) points.push(`Confiance en baisse (météo : ${libelleMeteo(t.derniere).toLowerCase()}) : commencer par l'écouter`);
  for (const id of adn?.freins ?? []) {
    const f = frein(id);
    if (f) points.push(`Frein : ${f.libelle.toLowerCase()}. Exercice : ${f.exercice}`);
  }
  return points;
}
