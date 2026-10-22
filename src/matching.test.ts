import { describe, expect, it } from "vitest";
import type { Apprenant, Offre } from "./types";
import { motsCles, scorer, suggerer } from "./matching";
import { ETAPES_DOSSIER } from "./dossier";

const TOUT = Object.fromEntries(ETAPES_DOSSIER.map((e) => [e.id, "2026-10-01"]));

const apprenant = (champs: Partial<Apprenant>): Apprenant => ({
  id: "x",
  prenom: "Test",
  nom: "Test",
  promo: "Promo test",
  finFormation: "2026-06-26",
  statut: "recherche",
  posteVise: "Product Builder",
  dernierContact: "2026-10-01",
  notes: [],
  ...champs,
});

const offre = (champs: Partial<Offre>): Offre => ({
  id: "o",
  titre: "Product Builder",
  contrat: "CDI",
  ouverte: true,
  candidats: [],
  ...champs,
});

describe("motsCles", () => {
  it("ignore la casse, les accents et les mots vides", () => {
    expect(motsCles("Chef de Projet Digital").join(",")).toBe("chef,projet,digital");
    expect(motsCles("Développeur no-code").join(",")).toBe("developpeur,no-code");
  });
});

describe("scorer", () => {
  it("donne 100 à un candidat idéal", () => {
    const s = scorer(apprenant({ dossier: TOUT }), offre({}));
    expect(s.score).toBe(100);
    expect(s.raisons.join(" | ")).toBe("Dossier prêt | Vise « Product Builder » | Disponible, en recherche");
  });

  it("compte le recouvrement partiel entre poste visé et offre", () => {
    const s = scorer(apprenant({ posteVise: "Chef de projet digital" }), offre({ titre: "Chef de projet no-code" }));
    // 2 mots sur 3 en commun → 23 points sur 35, + 25 disponibilité, + 0 dossier
    expect(s.score).toBe(48);
  });

  it("favorise les apprenants en formation pour une alternance", () => {
    const enFormation = apprenant({ statut: "formation" });
    expect(scorer(enFormation, offre({ contrat: "Alternance" })).score).toBeGreaterThan(
      scorer(enFormation, offre({ contrat: "CDI" })).score,
    );
  });
});

describe("suggerer", () => {
  it("écarte les insérés et les candidats déjà proposés, puis trie par score", () => {
    const liste = [
      apprenant({ id: "pret", nom: "A", dossier: TOUT }),
      apprenant({ id: "debut", nom: "B" }),
      apprenant({ id: "deja", nom: "C", dossier: TOUT }),
      apprenant({ id: "insere", nom: "D", statut: "poste", dateInsertion: "2026-09-01", dossier: TOUT }),
    ];
    const ids = suggerer(liste, offre({ candidats: ["deja"] })).map((s) => s.apprenant.id);
    expect(ids.join(",")).toBe("pret,debut");
  });
});
