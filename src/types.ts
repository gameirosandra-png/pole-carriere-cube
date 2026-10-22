// Modèle de données du pôle carrière.
// Un apprenant passe par des statuts successifs, de la formation jusqu'à l'emploi.

export type Statut =
  | "formation"   // encore en formation
  | "recherche"   // diplômé, en recherche active
  | "entretiens"  // au moins un process de recrutement en cours
  | "poste"       // en poste (CDI, CDD, alternance)
  | "freelance";  // lancé en indépendant

export interface Note {
  id: string;
  date: string; // ISO yyyy-mm-dd
  texte: string;
}

export interface Apprenant {
  id: string;
  prenom: string;
  nom: string;
  promo: string;          // ex. "Promo juin 2026"
  finFormation: string;   // ISO
  statut: Statut;
  posteVise: string;
  dernierContact: string; // ISO
  prochaineAction?: { libelle: string; date: string };
  dateInsertion?: string; // ISO, renseignée quand statut = poste | freelance
  entreprise?: string;
  notes: Note[];
}

export type TypeContrat = "CDI" | "CDD" | "Alternance" | "Freelance";

export interface Offre {
  id: string;
  titre: string;
  contrat: TypeContrat;
  ouverte: boolean;
  candidats: string[]; // ids d'apprenants mis en relation
}

export interface Entreprise {
  id: string;
  nom: string;
  secteur: string;
  contact: string;
  offres: Offre[];
}

export interface Donnees {
  apprenants: Apprenant[];
  entreprises: Entreprise[];
}
