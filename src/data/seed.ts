import type { Apprenant, Donnees, EtapeDossier } from "../types";
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

  const donnees: Donnees = {
    apprenants: [
      {
        id: "a1",
        prenom: "Inès",
        nom: "Moreau",
        promo: A,
        finFormation: finA,
        statut: "poste",
        posteVise: "Product Builder",
        dernierContact: j(-22),
        dateInsertion: apres(finA, 38),
        entreprise: "Nova Santé",
        notes: [
          {
            id: "n1",
            date: apres(finA, 38),
            texte: "Signature CDI chez Nova Santé, outillage interne Airtable + Make.",
          },
        ],
      },
      {
        id: "a2",
        prenom: "Karim",
        nom: "Benali",
        promo: A,
        finFormation: finA,
        statut: "freelance",
        posteVise: "Automatisation no-code",
        dernierContact: j(-40),
        dateInsertion: apres(finA, 24),
        entreprise: "Deux TPE locales",
        notes: [{ id: "n2", date: apres(finA, 24), texte: "Lancé en freelance, 2 clients TPE dès le premier mois." }],
      },
      {
        id: "a3",
        prenom: "Julie",
        nom: "Faure",
        promo: A,
        finFormation: finA,
        statut: "poste",
        posteVise: "Chef de projet digital",
        dernierContact: j(-55),
        dateInsertion: apres(finA, 80),
        entreprise: "Atelier Merlin",
        notes: [],
      },
      {
        id: "a4",
        prenom: "Thomas",
        nom: "Girard",
        promo: A,
        finFormation: finA,
        statut: "recherche",
        posteVise: "Product Ops",
        dernierContact: j(-34),
        prochaineAction: { libelle: "Atelier pitch + relecture portfolio", date: j(2) },
        notes: [
          {
            id: "n3",
            date: j(-34),
            texte: "Démotivé après deux refus. Revoir le portfolio : projets peu mis en valeur.",
          },
        ],
      },
      {
        id: "a5",
        prenom: "Leïla",
        nom: "Haddad",
        promo: A,
        finFormation: finA,
        statut: "poste",
        posteVise: "Product Builder",
        dernierContact: j(-104),
        dateInsertion: apres(finA, 59),
        entreprise: "Kairos RH",
        notes: [],
      },
      {
        id: "a6",
        prenom: "Maxime",
        nom: "Roux",
        promo: A,
        finFormation: finA,
        statut: "poste",
        posteVise: "Développeur no-code",
        dernierContact: j(-50),
        dateInsertion: apres(finA, 101),
        entreprise: "Fleurus Logistique",
        notes: [],
      },

      {
        id: "a7",
        prenom: "Camille",
        nom: "Petit",
        promo: B,
        finFormation: finB,
        statut: "entretiens",
        posteVise: "Product Builder",
        dernierContact: j(-2),
        prochaineAction: { libelle: "Préparer 2e entretien Kairos RH", date: j(1) },
        notes: [
          { id: "n4", date: j(-2), texte: "2e entretien cette semaine. Travailler la démo de son app de réservation." },
        ],
      },
      {
        id: "a8",
        prenom: "Yanis",
        nom: "Lambert",
        promo: B,
        finFormation: finB,
        statut: "recherche",
        posteVise: "Automatisation no-code",
        dernierContact: j(-27),
        notes: [
          {
            id: "n5",
            date: j(-27),
            texte: "Hésite entre CDI et freelance. Proposer un point avec Karim (promo précédente).",
          },
        ],
      },
      {
        id: "a9",
        prenom: "Sarah",
        nom: "Nguyen",
        promo: B,
        finFormation: finB,
        statut: "poste",
        posteVise: "Product Owner junior",
        dernierContact: j(-21),
        dateInsertion: apres(finB, 74),
        entreprise: "Nova Santé",
        notes: [],
      },
      {
        id: "a10",
        prenom: "Hugo",
        nom: "Martin",
        promo: B,
        finFormation: finB,
        statut: "recherche",
        posteVise: "Product Builder",
        dernierContact: j(-12),
        prochaineAction: { libelle: "Relancer après candidature Atelier Merlin", date: j(-1) },
        notes: [],
      },
      {
        id: "a11",
        prenom: "Nadia",
        nom: "Belkacem",
        promo: B,
        finFormation: finB,
        statut: "entretiens",
        posteVise: "Chef de projet digital",
        dernierContact: j(-7),
        prochaineAction: { libelle: "Débrief entretien Fleurus", date: j(5) },
        notes: [],
      },
      {
        id: "a12",
        prenom: "Romain",
        nom: "Dupuis",
        promo: B,
        finFormation: finB,
        statut: "freelance",
        posteVise: "Automatisation no-code",
        dernierContact: j(-17),
        dateInsertion: apres(finB, 52),
        entreprise: "Cabinet comptable",
        notes: [],
      },
      {
        id: "a13",
        prenom: "Emma",
        nom: "Lefèvre",
        promo: B,
        finFormation: finB,
        statut: "recherche",
        posteVise: "Product Ops",
        dernierContact: j(-42),
        notes: [{ id: "n6", date: j(-42), texte: "Pas de nouvelles depuis le dernier atelier CV." }],
      },

      {
        id: "a14",
        prenom: "Lucas",
        nom: "Bernard",
        promo: C,
        finFormation: finC,
        statut: "formation",
        posteVise: "Product Builder",
        dernierContact: j(-8),
        prochaineAction: { libelle: "Atelier LinkedIn (groupe)", date: j(14) },
        notes: [],
      },
      {
        id: "a15",
        prenom: "Chloé",
        nom: "Garnier",
        promo: C,
        finFormation: finC,
        statut: "formation",
        posteVise: "Product Owner junior",
        dernierContact: j(-8),
        prochaineAction: { libelle: "Atelier LinkedIn (groupe)", date: j(14) },
        notes: [],
      },
      {
        id: "a16",
        prenom: "Mehdi",
        nom: "Rahmani",
        promo: C,
        finFormation: finC,
        statut: "formation",
        posteVise: "Automatisation no-code",
        dernierContact: j(-8),
        prochaineAction: { libelle: "Atelier LinkedIn (groupe)", date: j(14) },
        notes: [],
      },
    ],
    entreprises: [
      {
        id: "e1",
        nom: "Nova Santé",
        secteur: "Santé",
        contact: "Responsable RH",
        offres: [
          {
            id: "o1",
            titre: "Product Builder outils internes",
            contrat: "CDI",
            ouverte: false,
            candidats: ["a1", "a9"],
          },
          { id: "o2", titre: "Alternant automatisation", contrat: "Alternance", ouverte: true, candidats: [] },
        ],
      },
      {
        id: "e2",
        nom: "Kairos RH",
        secteur: "Cabinet de recrutement",
        contact: "CEO",
        offres: [{ id: "o3", titre: "Product Builder", contrat: "CDI", ouverte: true, candidats: ["a7"] }],
      },
      {
        id: "e3",
        nom: "Atelier Merlin",
        secteur: "Agence digitale",
        contact: "Directrice de production",
        offres: [{ id: "o4", titre: "Chef de projet no-code", contrat: "CDD", ouverte: true, candidats: ["a10"] }],
      },
      {
        id: "e4",
        nom: "Fleurus Logistique",
        secteur: "Logistique",
        contact: "DSI",
        offres: [
          { id: "o5", titre: "Développeur no-code", contrat: "CDI", ouverte: true, candidats: ["a11"] },
          { id: "o6", titre: "Mission automatisation entrepôt", contrat: "Freelance", ouverte: true, candidats: [] },
        ],
      },
    ],
  };

  // Avancement du parcours de chaque apprenant (séances faites, dans l'ordre).
  const TOUTES: EtapeDossier[] = ["rdvObjectif", "cv", "portfolio", "linkedin", "pitch", "simulation", "negociation"];
  const etapes: Record<string, EtapeDossier[]> = {
    a4: ["rdvObjectif", "cv", "linkedin", "pitch"],
    a7: TOUTES,
    a8: ["rdvObjectif", "cv"],
    a10: ["rdvObjectif", "cv", "portfolio", "linkedin", "pitch"],
    a11: TOUTES,
    a13: ["rdvObjectif"],
    a14: ["rdvObjectif", "cv"],
    a15: ["rdvObjectif", "cv", "portfolio", "linkedin"],
    a16: ["rdvObjectif"],
  };

  // Parcours d'avant la reconversion : l'atout que l'accompagnement aide à valoriser.
  const profils: Record<string, Pick<Apprenant, "parcoursAvant" | "anneesExperience">> = {
    a4: { parcoursAvant: "6 ans comme assistant logistique", anneesExperience: 6 },
    a7: { parcoursAvant: "5 ans dans l'hôtellerie", anneesExperience: 5 },
    a8: { parcoursAvant: "3 ans en cabinet comptable", anneesExperience: 3 },
    a10: { parcoursAvant: "8 ans dans la grande distribution, dont 3 comme chef de rayon", anneesExperience: 8 },
    a11: { parcoursAvant: "4 ans en agence événementielle", anneesExperience: 4 },
    a13: { parcoursAvant: "2 ans au service client d'un opérateur", anneesExperience: 2 },
    a14: { parcoursAvant: "7 ans dans l'enseignement", anneesExperience: 7 },
    a15: { parcoursAvant: "4 ans en ressources humaines", anneesExperience: 4 },
    a16: { parcoursAvant: "5 ans dans la vente", anneesExperience: 5 },
  };

  const tout = { probleme: true, solution: true, outils: true, demo: true, resultat: true };
  const accompagnements: Record<string, Apprenant["accompagnement"]> = {
    a10: {
      cv: {
        notes: { titre: 2, accroche: 1, projets: 2, resultats: 0, competences: 2, lisibilite: 1 },
        accrocheAvant: "Chef de rayon en reconversion, motivé et polyvalent, à la recherche d'un nouveau défi.",
        accrocheApres:
          "Product Builder no-code : je conçois des outils internes qui font gagner du temps aux équipes terrain. 8 ans en grande distribution, 3 projets livrés avec Airtable, Make et Lovable.",
      },
      portfolio: [
        { id: "p1", nom: "Suivi des ruptures en magasin", lien: "", criteres: tout },
        {
          id: "p2",
          nom: "Planning des équipes du week-end",
          criteres: { probleme: true, solution: true, outils: true, demo: true },
        },
        { id: "p3", nom: "Formulaire de retours clients", criteres: { solution: true, outils: true } },
      ],
      salaire: { poste: "productBuilder", zone: "idf", contrat: "salarie" },
      convaincre: {
        motivation: "dans le retail, pour outiller les équipes terrain que je connais bien.",
        simulation: { clarte: 3, star: 2, exemples: 3, posture: 3, questions: 2 },
      },
      historique: [
        { date: j(-30), cv: 33, simulation: null },
        { date: j(-16), cv: 50, simulation: 45 },
        { date: j(-3), cv: 67, simulation: 65 },
      ],
    },
    a4: {
      cv: { notes: { titre: 1, accroche: 0, projets: 1, resultats: 0 } },
      portfolio: [{ id: "p4", nom: "Tableau de suivi des livraisons", criteres: { probleme: true, outils: true } }],
      historique: [
        { date: j(-35), cv: 13, simulation: null },
        { date: j(-20), cv: 25, simulation: null },
      ],
    },
    a7: {
      cv: { notes: { titre: 2, accroche: 2, projets: 2, resultats: 2, competences: 2, lisibilite: 2 } },
      portfolio: [
        { id: "p5", nom: "App de réservation pour un hôtel", criteres: tout },
        { id: "p6", nom: "Automatisation des check-in", criteres: tout },
      ],
      salaire: { poste: "productBuilder", zone: "idf", contrat: "salarie" },
      convaincre: { simulation: { clarte: 4, star: 3, exemples: 4, posture: 3, questions: 3 } },
      historique: [
        { date: j(-60), cv: 42, simulation: null },
        { date: j(-40), cv: 83, simulation: 60 },
        { date: j(-25), cv: 100, simulation: 85 },
      ],
    },
  };

  // Questionnaire « Faisons connaissance », rempli avant la séance 1.
  const questionnaires: Record<string, Apprenant["questionnaire"]> = {
    a10: {
      rempliLe: j(-44),
      parcoursAvant: "8 ans dans la grande distribution, dont 3 comme chef de rayon",
      anneesExperience: 8,
      posteVise: "Product Builder",
      secteurs: "retail, logistique",
      contrat: "cdi",
      zone: "idf",
      teletravail: "hybride",
      pointsForts: "Le terrain, l'animation d'équipe, le sens du client",
      inquietudes: ["entretien", "salaire"],
      motivation: "dans le retail, pour outiller les équipes terrain que je connais bien.",
    },
    a14: {
      rempliLe: j(-10),
      parcoursAvant: "7 ans dans l'enseignement",
      anneesExperience: 7,
      posteVise: "Product Builder",
      secteurs: "edtech, formation",
      contrat: "alternance",
      zone: "regions",
      teletravail: "hybride",
      disponibleLe: finC,
      pointsForts: "La pédagogie : expliquer simplement des choses compliquées",
      inquietudes: ["confiance", "reseau", "salaire"],
      motivation: "dans l'edtech, pour créer les outils dont j'aurais rêvé quand j'enseignais.",
    },
  };

  // Boîte à questions : ce que les apprenants ont demandé au pôle.
  const questionsPole: Record<string, Apprenant["questions"]> = {
    a4: [
      {
        id: "qp3",
        date: j(-9),
        texte: "Faut-il mettre mes projets de formation en haut du CV ?",
        reponse: "Oui : 2 ou 3 projets en haut, avant l'expérience, avec le lien vers ton portfolio.",
        reponduLe: j(-8),
      },
    ],
    a14: [{ id: "qp1", date: j(-2), texte: "L'atelier LinkedIn sera-t-il enregistré ? Je travaille ce soir-là." }],
    a15: [
      { id: "qp2", date: j(-1), texte: "Peut-on viser un poste de Product Owner sans expérience tech avant la formation ?" },
    ],
  };

  const enrichir = (a: Apprenant): Apprenant => {
    // Les apprenants insérés ont un parcours complet, bouclé avant leur embauche.
    const faites = a.dateInsertion ? TOUTES : (etapes[a.id] ?? []);
    const debut = a.dateInsertion ? ajouterJours(a.dateInsertion, -40) : j(-45);
    return {
      ...a,
      ...profils[a.id],
      accompagnement:
        a.id === "a14"
          ? { convaincre: { motivation: questionnaires.a14?.motivation } }
          : accompagnements[a.id],
      questionnaire: questionnaires[a.id],
      questions: questionsPole[a.id],
      dossier: Object.fromEntries(faites.map((e, i) => [e, ajouterJours(debut, i * 5)])),
    };
  };

  return {
    ...donnees,
    apprenants: donnees.apprenants.map(enrichir),
    ateliers: [
      {
        id: "at1",
        theme: "portfolio",
        titre: "Raconter un projet dans son portfolio",
        date: j(2),
        heure: "18:00",
        places: 8,
        inscrits: ["a4", "a15"],
      },
      {
        id: "at2",
        theme: "negociation",
        titre: "Négocier son premier salaire",
        date: j(5),
        heure: "12:30",
        places: 10,
        inscrits: ["a10"],
      },
      {
        id: "at3",
        theme: "simulation",
        titre: "Entretiens blancs en binôme",
        date: j(9),
        heure: "18:00",
        places: 6,
        inscrits: [],
      },
      {
        id: "at4",
        theme: "linkedin",
        titre: "Un profil LinkedIn qui attire les recruteurs",
        date: j(14),
        heure: "18:30",
        places: 12,
        inscrits: ["a14", "a15", "a16"],
      },
    ],
  };
}
