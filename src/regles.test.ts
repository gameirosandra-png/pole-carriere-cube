import { describe, expect, it } from "vitest";
import type { Apprenant } from "./types";
import { calculerIndicateurs, changerStatut, raisonRelance } from "./regles";
import { creerDonneesDemo } from "./data/seed";

const TODAY = "2026-10-22";

const apprenant = (champs: Partial<Apprenant>): Apprenant => ({
  id: "x",
  prenom: "Test",
  nom: "Test",
  promo: "Promo test",
  finFormation: "2026-03-27",
  statut: "recherche",
  posteVise: "Product Builder",
  dernierContact: TODAY,
  notes: [],
  ...champs,
});

describe("raisonRelance", () => {
  it("signale une action dont la date est dépassée", () => {
    const a = apprenant({ prochaineAction: { libelle: "Relire le CV", date: "2026-10-21" } });
    expect(raisonRelance(a, TODAY)).toBe("Action en retard");
  });

  it("signale un silence de plus de 14 jours", () => {
    expect(raisonRelance(apprenant({ dernierContact: "2026-10-07" }), TODAY)).toBe("Sans contact depuis 15 j");
  });

  it("ne signale pas un silence de 14 jours pile", () => {
    expect(raisonRelance(apprenant({ dernierContact: "2026-10-08" }), TODAY)).toBeNull();
  });

  it("ne relance jamais un apprenant inséré", () => {
    const a = apprenant({ statut: "poste", dernierContact: "2026-01-01", dateInsertion: "2026-05-01" });
    expect(raisonRelance(a, TODAY)).toBeNull();
  });

  it("ne relance pas un apprenant en formation pour simple silence", () => {
    expect(raisonRelance(apprenant({ statut: "formation", dernierContact: "2026-09-01" }), TODAY)).toBeNull();
  });
});

describe("calculerIndicateurs", () => {
  it("calcule le taux à 6 mois sur les seules fenêtres closes", () => {
    const apprenants = [
      apprenant({ id: "1", statut: "poste", dateInsertion: "2026-05-01" }), // inséré à temps
      apprenant({ id: "2", statut: "freelance", dateInsertion: "2026-09-26" }), // inséré à temps (dernier jour)
      apprenant({ id: "3", statut: "poste", dateInsertion: "2026-10-01" }), // inséré trop tard
      apprenant({ id: "4", statut: "recherche" }), // pas inséré
      apprenant({ id: "5", finFormation: "2026-06-26", statut: "poste", dateInsertion: "2026-08-01" }), // fenêtre ouverte
    ];
    const ind = calculerIndicateurs(apprenants, TODAY);
    expect(ind.baseSixMois).toBe(4);
    expect(ind.tauxSixMois).toBe(50);
  });

  it("renvoie null quand aucune fenêtre de 6 mois n'est close", () => {
    const ind = calculerIndicateurs([apprenant({ finFormation: "2026-09-01" })], TODAY);
    expect(ind.tauxSixMois).toBeNull();
  });

  it("calcule le délai moyen d'insertion en jours", () => {
    const ind = calculerIndicateurs(
      [
        apprenant({ id: "1", finFormation: "2026-03-01", statut: "poste", dateInsertion: "2026-03-11" }),
        apprenant({ id: "2", finFormation: "2026-03-01", statut: "poste", dateInsertion: "2026-03-31" }),
      ],
      TODAY,
    );
    expect(ind.delaiMoyen).toBe(20);
  });
});

describe("changerStatut", () => {
  it("compte le changement comme un contact et date l'insertion", () => {
    const a = changerStatut(apprenant({ dernierContact: "2026-09-01" }), "poste", TODAY);
    expect(a.dernierContact).toBe(TODAY);
    expect(a.dateInsertion).toBe(TODAY);
  });

  it("garde la date d'insertion existante", () => {
    const a = changerStatut(apprenant({ statut: "poste", dateInsertion: "2026-05-01" }), "freelance", TODAY);
    expect(a.dateInsertion).toBe("2026-05-01");
  });

  it("efface l'insertion quand l'apprenant repart en recherche", () => {
    const a = changerStatut(
      apprenant({ statut: "poste", dateInsertion: "2026-05-01", entreprise: "Nova" }),
      "recherche",
      TODAY,
    );
    expect(a.dateInsertion).toBeUndefined();
    expect(a.entreprise).toBeUndefined();
  });
});

describe("données de démo", () => {
  it("restent cohérentes quelle que soit la date d'ouverture", () => {
    for (const jour of ["2026-10-22", "2027-03-15", "2028-01-01"]) {
      const ind = calculerIndicateurs(creerDonneesDemo(jour).apprenants, jour);
      expect(ind.tauxSixMois).toBe(83);
      expect(ind.aRelancer).toHaveLength(4);
    }
  });
});
