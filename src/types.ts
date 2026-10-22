// Modèle de données du pôle carrière.
// Un apprenant passe par des statuts successifs, de la formation jusqu'à l'emploi.

export type Statut =
  | "formation" // encore en formation
  | "recherche" // diplômé, en recherche active
  | "entretiens" // au moins un process de recrutement en cours
  | "poste" // en poste (CDI, CDD, alternance)
  | "freelance"; // lancé en indépendant

export interface Note {
  id: string;
  date: string; // ISO yyyy-mm-dd
  texte: string;
}

/**
 * Parcours d'accompagnement en 7 séances, à boucler avant de proposer l'apprenant à une entreprise.
 * (Les anciennes clés « cvEnvoye » et « cvValide » éventuellement présentes dans les données sont ignorées.)
 */
export type EtapeDossier =
  | "rdvObjectif" // séance 1 : bilan et objectif professionnel
  | "cv" // séance 2 : atelier CV
  | "portfolio" // séance 3 : atelier portfolio
  | "linkedin" // séance 4 : profil LinkedIn
  | "pitch" // séance 5 : pitch de présentation
  | "simulation" // séance 6 : simulation d'entretien
  | "negociation"; // séance 7 : préparation à la négociation salariale

/** Pour chaque séance terminée : la date à laquelle elle l'a été. */
export type Dossier = Partial<Record<EtapeDossier | string, string>>;

/* ---------- Ateliers individuels (dans la fiche) ---------- */

export type CritereCV = "titre" | "accroche" | "projets" | "resultats" | "competences" | "lisibilite";
/** 0 = à retravailler, 1 = correct, 2 = solide */
export type NoteCritere = 0 | 1 | 2;

export interface AtelierCV {
  notes: Partial<Record<CritereCV, NoteCritere>>;
  accrocheAvant?: string;
  accrocheApres?: string;
}

export type CriterePortfolio = "probleme" | "solution" | "outils" | "demo" | "resultat";

export interface ProjetPortfolio {
  id: string;
  nom: string;
  lien?: string;
  criteres: Partial<Record<CriterePortfolio, boolean>>;
}

export type PosteReference =
  | "productBuilder"
  | "devNoCode"
  | "automatisation"
  | "noCodeOps"
  | "chefProjet"
  | "productOwner";

export interface AtelierSalaire {
  poste: PosteReference;
  zone: "idf" | "regions";
  contrat: "salarie" | "freelance";
}

export type CritereEntretien = "clarte" | "star" | "exemples" | "posture" | "questions";

export interface AtelierConvaincre {
  motivation?: string;
  /** Notes de la dernière simulation, de 1 (à travailler) à 4 (excellent). */
  simulation?: Partial<Record<CritereEntretien, 1 | 2 | 3 | 4>>;
}

/** Scores relevés au fil des séances, pour mesurer la progression. */
export interface PointProgression {
  date: string; // ISO
  cv: number | null;
  simulation: number | null;
}

export interface Accompagnement {
  cv?: AtelierCV;
  portfolio?: ProjetPortfolio[];
  salaire?: AtelierSalaire;
  convaincre?: AtelierConvaincre;
  historique?: PointProgression[];
}

/* ---------- Questionnaire « Faisons connaissance » et questions au pôle ---------- */

export type Inquietude = "cv" | "portfolio" | "pitch" | "entretien" | "salaire" | "reseau" | "confiance";

export interface Questionnaire {
  /** Date à laquelle l'apprenant l'a rempli (ou mis à jour). */
  rempliLe: string;
  parcoursAvant?: string;
  anneesExperience?: number;
  posteVise?: string;
  secteurs?: string;
  contrat?: "cdi" | "alternance" | "freelance" | "ouvert";
  zone?: "idf" | "regions";
  teletravail?: "sur-site" | "hybride" | "complet";
  disponibleLe?: string; // ISO
  pointsForts?: string;
  inquietudes?: Inquietude[];
  motivation?: string;
}

export interface QuestionPole {
  id: string;
  date: string; // ISO
  texte: string;
  reponse?: string;
  reponduLe?: string;
}

export interface Apprenant {
  id: string;
  prenom: string;
  nom: string;
  promo: string; // ex. "Promo juin 2026"
  finFormation: string; // ISO
  statut: Statut;
  posteVise: string;
  dernierContact: string; // ISO
  prochaineAction?: { libelle: string; date: string };
  dateInsertion?: string; // ISO, renseignée quand statut = poste | freelance
  entreprise?: string;
  dossier?: Dossier;
  /** Parcours avant la formation, ex. « 8 ans dans la logistique » : un atout à valoriser. */
  parcoursAvant?: string;
  anneesExperience?: number;
  accompagnement?: Accompagnement;
  questionnaire?: Questionnaire;
  questions?: QuestionPole[];
  notes: Note[];
}

export type TypeContrat = "CDI" | "CDD" | "Alternance" | "Freelance";

export interface Offre {
  id: string;
  titre: string;
  contrat: TypeContrat;
  ouverte: boolean;
  candidats: string[]; // ids d'apprenants mis en relation
  /** Date du dernier envoi de la shortlist à l'entreprise. */
  shortlistEnvoyee?: string;
}

export interface Entreprise {
  id: string;
  nom: string;
  secteur: string;
  contact: string;
  offres: Offre[];
}

/* ---------- Ateliers collectifs ---------- */

export interface AtelierCollectif {
  id: string;
  theme: EtapeDossier;
  titre: string;
  date: string; // ISO
  heure: string; // "18:00"
  places: number;
  inscrits: string[]; // ids d'apprenants
}

export interface Donnees {
  apprenants: Apprenant[];
  entreprises: Entreprise[];
  /** Absent dans les données enregistrées avant cette version : traité comme une liste vide. */
  ateliers?: AtelierCollectif[];
}
