import type { Donnees } from "../types";
import { ajouterJours, aujourdhui, formatMois } from "../dates";

// Données fictives : aucune personne réelle.
// Toutes les dates sont calculées à partir du jour où la démo est ouverte,
// pour que les indicateurs restent crédibles quelle que soit la date de visite.

export function creerDonneesDemo(today = aujourdhui()): Donnees {
  const j = (decalage: number) => ajouterJours(today, decalage);

  // Trois promos : fenêtre de 6 mois close, fenêtre en cours, encore en formation.
  const finA = j(-210);
  const finB = j(-118);
  const finC = j(57);
  const promo = (fin: string) => `Promo ${formatMois(fin)}`;
  const A = promo(finA);
  const B = promo(finB);
  const C = promo(finC);
  const apres = (fin: string, jours: number) => ajouterJours(fin, jours);

  return {
    apprenants: [
      { id: "a1", prenom: "Inès", nom: "Moreau", promo: A, finFormation: finA, statut: "poste", posteVise: "Product Builder", dernierContact: j(-22), dateInsertion: apres(finA, 38), entreprise: "Nova Santé", notes: [{ id: "n1", date: apres(finA, 38), texte: "Signature CDI chez Nova Santé, outillage interne Airtable + Make." }] },
      { id: "a2", prenom: "Karim", nom: "Benali", promo: A, finFormation: finA, statut: "freelance", posteVise: "Automatisation no-code", dernierContact: j(-40), dateInsertion: apres(finA, 24), entreprise: "Deux TPE locales", notes: [{ id: "n2", date: apres(finA, 24), texte: "Lancé en freelance, 2 clients TPE dès le premier mois." }] },
      { id: "a3", prenom: "Julie", nom: "Faure", promo: A, finFormation: finA, statut: "poste", posteVise: "Chef de projet digital", dernierContact: j(-55), dateInsertion: apres(finA, 80), entreprise: "Atelier Merlin", notes: [] },
      { id: "a4", prenom: "Thomas", nom: "Girard", promo: A, finFormation: finA, statut: "recherche", posteVise: "Product Ops", dernierContact: j(-34), prochaineAction: { libelle: "Atelier pitch + relecture portfolio", date: j(2) }, notes: [{ id: "n3", date: j(-34), texte: "Démotivé après deux refus. Revoir le portfolio : projets peu mis en valeur." }] },
      { id: "a5", prenom: "Leïla", nom: "Haddad", promo: A, finFormation: finA, statut: "poste", posteVise: "Product Builder", dernierContact: j(-104), dateInsertion: apres(finA, 59), entreprise: "Kairos RH", notes: [] },
      { id: "a6", prenom: "Maxime", nom: "Roux", promo: A, finFormation: finA, statut: "poste", posteVise: "Développeur no-code", dernierContact: j(-50), dateInsertion: apres(finA, 101), entreprise: "Fleurus Logistique", notes: [] },

      { id: "a7", prenom: "Camille", nom: "Petit", promo: B, finFormation: finB, statut: "entretiens", posteVise: "Product Builder", dernierContact: j(-2), prochaineAction: { libelle: "Préparer 2e entretien Kairos RH", date: j(1) }, notes: [{ id: "n4", date: j(-2), texte: "2e entretien cette semaine. Travailler la démo de son app de réservation." }] },
      { id: "a8", prenom: "Yanis", nom: "Lambert", promo: B, finFormation: finB, statut: "recherche", posteVise: "Automatisation no-code", dernierContact: j(-27), notes: [{ id: "n5", date: j(-27), texte: "Hésite entre CDI et freelance. Proposer un point avec Karim (promo précédente)." }] },
      { id: "a9", prenom: "Sarah", nom: "Nguyen", promo: B, finFormation: finB, statut: "poste", posteVise: "Product Owner junior", dernierContact: j(-21), dateInsertion: apres(finB, 74), entreprise: "Nova Santé", notes: [] },
      { id: "a10", prenom: "Hugo", nom: "Martin", promo: B, finFormation: finB, statut: "recherche", posteVise: "Product Builder", dernierContact: j(-12), prochaineAction: { libelle: "Relancer après candidature Atelier Merlin", date: j(-1) }, notes: [] },
      { id: "a11", prenom: "Nadia", nom: "Belkacem", promo: B, finFormation: finB, statut: "entretiens", posteVise: "Chef de projet digital", dernierContact: j(-7), prochaineAction: { libelle: "Débrief entretien Fleurus", date: j(5) }, notes: [] },
      { id: "a12", prenom: "Romain", nom: "Dupuis", promo: B, finFormation: finB, statut: "freelance", posteVise: "Automatisation no-code", dernierContact: j(-17), dateInsertion: apres(finB, 52), entreprise: "Cabinet comptable", notes: [] },
      { id: "a13", prenom: "Emma", nom: "Lefèvre", promo: B, finFormation: finB, statut: "recherche", posteVise: "Product Ops", dernierContact: j(-42), notes: [{ id: "n6", date: j(-42), texte: "Pas de nouvelles depuis le dernier atelier CV." }] },

      { id: "a14", prenom: "Lucas", nom: "Bernard", promo: C, finFormation: finC, statut: "formation", posteVise: "Product Builder", dernierContact: j(-8), prochaineAction: { libelle: "Atelier LinkedIn (groupe)", date: j(14) }, notes: [] },
      { id: "a15", prenom: "Chloé", nom: "Garnier", promo: C, finFormation: finC, statut: "formation", posteVise: "Product Owner junior", dernierContact: j(-8), prochaineAction: { libelle: "Atelier LinkedIn (groupe)", date: j(14) }, notes: [] },
      { id: "a16", prenom: "Mehdi", nom: "Rahmani", promo: C, finFormation: finC, statut: "formation", posteVise: "Automatisation no-code", dernierContact: j(-8), prochaineAction: { libelle: "Atelier LinkedIn (groupe)", date: j(14) }, notes: [] },
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
}
