import { describe, expect, it } from "vitest";
import type { Apprenant } from "./types";
import { ETAPES_DOSSIER, cocherEtape, completude, indicateursDossier, pretAProposer, prochaineEtape } from "./dossier";
import { creerDonneesDemo } from "./data/seed";

const TODAY = "2026-10-22";
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

describe("checklist du dossier", () => {
  it("calcule la complétude, y compris sans dossier", () => {
    expect(completude(apprenant({})).pourcentage).toBe(0);
    expect(completude(apprenant({ dossier: { rdvObjectif: "2026-10-01", cvEnvoye: "2026-10-02" } })).faites).toBe(2);
    expect(completude(apprenant({ dossier: TOUT })).pourcentage).toBe(100);
  });

  it("n'est prêt à proposer qu'avec toutes les étapes", () => {
    const presque = { ...TOUT };
    delete presque.simulation;
    expect(pretAProposer(apprenant({ dossier: presque }))).toBe(false);
    expect(pretAProposer(apprenant({ dossier: TOUT }))).toBe(true);
  });

  it("propose la première étape manquante dans l'ordre conseillé", () => {
    expect(prochaineEtape(apprenant({}))?.id).toBe("rdvObjectif");
    expect(prochaineEtape(apprenant({ dossier: { rdvObjectif: "2026-10-01" } }))?.id).toBe("cvEnvoye");
    expect(prochaineEtape(apprenant({ dossier: TOUT }))).toBeNull();
  });

  it("date l'étape cochée, garde sa date d'origine et compte comme un contact", () => {
    const a = cocherEtape(apprenant({}), "linkedin", true, TODAY);
    expect(a.dossier?.linkedin).toBe(TODAY);
    expect(a.dernierContact).toBe(TODAY);
    expect(cocherEtape(a, "linkedin", true, "2026-12-01").dossier?.linkedin).toBe(TODAY);
  });

  it("retire l'étape décochée sans toucher au dernier contact", () => {
    const a = cocherEtape(apprenant({ dossier: { linkedin: "2026-09-01" } }), "linkedin", false, TODAY);
    expect(a.dossier?.linkedin).toBeUndefined();
    expect(a.dernierContact).toBe("2026-10-01");
  });
});

describe("indicateurs de préparation", () => {
  it("se calculent sur les seuls apprenants en accompagnement", () => {
    const ind = indicateursDossier([
      apprenant({ id: "1", dossier: TOUT }),
      apprenant({ id: "2", dossier: { rdvObjectif: "2026-10-01" } }),
      apprenant({ id: "3", statut: "poste", dateInsertion: "2026-09-01" }), // inséré : exclu
    ]);
    expect(ind.base).toBe(2);
    expect(ind.prets).toBe(1);
    expect(ind.parEtape[0].pourcentage).toBe(100); // rdvObjectif : 2 sur 2
    expect(ind.parEtape[6].pourcentage).toBe(50); // simulation : 1 sur 2
  });

  it("donnent des chiffres stables sur la démo", () => {
    const ind = indicateursDossier(creerDonneesDemo(TODAY).apprenants);
    expect(ind.base).toBe(9);
    expect(ind.prets).toBe(2);
  });
});
