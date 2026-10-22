import type { Donnees } from "../types";

// Données fictives : aucune personne réelle.
// Trois promos pour illustrer le suivi à 6 mois.

const MARS = "2026-03-27";
const JUIN = "2026-06-26";
const DEC = "2026-12-18";

export const SEED: Donnees = {
  apprenants: [
    // Promo mars 2026 — sortie il y a plus de 6 mois
    { id: "a1", prenom: "Inès", nom: "Moreau", promo: "Promo mars 2026", finFormation: MARS, statut: "poste", posteVise: "Product Builder", dernierContact: "2026-09-30", dateInsertion: "2026-05-04", entreprise: "Nova Santé", notes: [{ id: "n1", date: "2026-05-04", texte: "Signature CDI chez Nova Santé, outillage interne Airtable + Make." }] },
    { id: "a2", prenom: "Karim", nom: "Benali", promo: "Promo mars 2026", finFormation: MARS, statut: "freelance", posteVise: "Automatisation no-code", dernierContact: "2026-09-12", dateInsertion: "2026-04-20", notes: [{ id: "n2", date: "2026-04-20", texte: "Lancé en freelance, 2 clients TPE dès le premier mois." }] },
    { id: "a3", prenom: "Julie", nom: "Faure", promo: "Promo mars 2026", finFormation: MARS, statut: "poste", posteVise: "Chef de projet digital", dernierContact: "2026-08-28", dateInsertion: "2026-06-15", entreprise: "Atelier Merlin", notes: [] },
    { id: "a4", prenom: "Thomas", nom: "Girard", promo: "Promo mars 2026", finFormation: MARS, statut: "recherche", posteVise: "Product Ops", dernierContact: "2026-09-18", prochaineAction: { libelle: "Atelier pitch + relecture portfolio", date: "2026-10-24" }, notes: [{ id: "n3", date: "2026-09-18", texte: "Démotivé après deux refus. Revoir le portfolio : projets peu mis en valeur." }] },
    { id: "a5", prenom: "Leïla", nom: "Haddad", promo: "Promo mars 2026", finFormation: MARS, statut: "poste", posteVise: "Product Builder", dernierContact: "2026-07-10", dateInsertion: "2026-05-25", entreprise: "Kairos RH", notes: [] },
    { id: "a6", prenom: "Maxime", nom: "Roux", promo: "Promo mars 2026", finFormation: MARS, statut: "poste", posteVise: "Développeur no-code", dernierContact: "2026-09-02", dateInsertion: "2026-07-06", entreprise: "Fleurus Logistique", notes: [] },

    // Promo juin 2026 — dans la fenêtre des 6 mois
    { id: "a7", prenom: "Camille", nom: "Petit", promo: "Promo juin 2026", finFormation: JUIN, statut: "entretiens", posteVise: "Product Builder", dernierContact: "2026-10-20", prochaineAction: { libelle: "Préparer 2e entretien Kairos RH", date: "2026-10-23" }, notes: [{ id: "n4", date: "2026-10-20", texte: "2e entretien jeudi. Travailler la démo de son app de réservation." }] },
    { id: "a8", prenom: "Yanis", nom: "Lambert", promo: "Promo juin 2026", finFormation: JUIN, statut: "recherche", posteVise: "Automatisation no-code", dernierContact: "2026-09-25", notes: [{ id: "n5", date: "2026-09-25", texte: "Hésite entre CDI et freelance. Proposer un point avec Karim (promo mars)." }] },
    { id: "a9", prenom: "Sarah", nom: "Nguyen", promo: "Promo juin 2026", finFormation: JUIN, statut: "poste", posteVise: "Product Owner junior", dernierContact: "2026-10-01", dateInsertion: "2026-09-08", entreprise: "Nova Santé", notes: [] },
    { id: "a10", prenom: "Hugo", nom: "Martin", promo: "Promo juin 2026", finFormation: JUIN, statut: "recherche", posteVise: "Product Builder", dernierContact: "2026-10-02", prochaineAction: { libelle: "Relancer après candidature Atelier Merlin", date: "2026-10-21" }, notes: [] },
    { id: "a11", prenom: "Nadia", nom: "Belkacem", promo: "Promo juin 2026", finFormation: JUIN, statut: "entretiens", posteVise: "Chef de projet digital", dernierContact: "2026-10-15", prochaineAction: { libelle: "Débrief entretien Fleurus", date: "2026-10-27" }, notes: [] },
    { id: "a12", prenom: "Romain", nom: "Dupuis", promo: "Promo juin 2026", finFormation: JUIN, statut: "freelance", posteVise: "Automatisation no-code", dernierContact: "2026-10-05", dateInsertion: "2026-08-17", notes: [] },
    { id: "a13", prenom: "Emma", nom: "Lefèvre", promo: "Promo juin 2026", finFormation: JUIN, statut: "recherche", posteVise: "Product Ops", dernierContact: "2026-09-10", notes: [{ id: "n6", date: "2026-09-10", texte: "Pas de nouvelles depuis le dernier atelier CV." }] },

    // Promo décembre 2026 — encore en formation
    { id: "a14", prenom: "Lucas", nom: "Bernard", promo: "Promo déc. 2026", finFormation: DEC, statut: "formation", posteVise: "Product Builder", dernierContact: "2026-10-14", prochaineAction: { libelle: "Atelier LinkedIn (groupe)", date: "2026-11-05" }, notes: [] },
    { id: "a15", prenom: "Chloé", nom: "Garnier", promo: "Promo déc. 2026", finFormation: DEC, statut: "formation", posteVise: "Product Owner junior", dernierContact: "2026-10-14", prochaineAction: { libelle: "Atelier LinkedIn (groupe)", date: "2026-11-05" }, notes: [] },
    { id: "a16", prenom: "Mehdi", nom: "Rahmani", promo: "Promo déc. 2026", finFormation: DEC, statut: "formation", posteVise: "Automatisation no-code", dernierContact: "2026-10-14", prochaineAction: { libelle: "Atelier LinkedIn (groupe)", date: "2026-11-05" }, notes: [] },
  ],
  entreprises: [
    { id: "e1", nom: "Nova Santé", secteur: "Santé", contact: "Responsable RH", offres: [
      { id: "o1", titre: "Product Builder outils internes", contrat: "CDI", ouverte: false, candidats: ["a1", "a9"] },
      { id: "o2", titre: "Alternant automatisation", contrat: "Alternance", ouverte: true, candidats: [] },
    ] },
    { id: "e2", nom: "Kairos RH", secteur: "Cabinet de recrutement", contact: "CEO", offres: [
      { id: "o3", titre: "Product Builder", contrat: "CDI", ouverte: true, candidats: ["a7"] },
    ] },
    { id: "e3", nom: "Atelier Merlin", secteur: "Agence digitale", contact: "Directrice de production", offres: [
      { id: "o4", titre: "Chef de projet no-code", contrat: "CDD", ouverte: true, candidats: ["a10"] },
    ] },
    { id: "e4", nom: "Fleurus Logistique", secteur: "Logistique", contact: "DSI", offres: [
      { id: "o5", titre: "Développeur no-code", contrat: "CDI", ouverte: true, candidats: ["a11"] },
      { id: "o6", titre: "Mission automatisation entrepôt", contrat: "Freelance", ouverte: true, candidats: [] },
    ] },
  ],
};
