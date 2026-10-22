import { describe, expect, it } from "vitest";
import { changementsDonnees, comparer } from "./synchro";
import { creerDonneesDemo } from "./data/seed";

describe("comparer", () => {
  it("détecte ajouts, modifications et suppressions", () => {
    const avant = [
      { id: "a", v: 1 },
      { id: "b", v: 1 },
      { id: "c", v: 1 },
    ];
    const apres = [
      { id: "a", v: 1 }, // inchangé
      { id: "b", v: 2 }, // modifié
      { id: "d", v: 1 }, // ajouté
    ];
    const c = comparer(avant, apres);
    expect(c.aEcrire.map((x) => x.id).join(",")).toBe("b,d");
    expect(c.aSupprimer.join(",")).toBe("c");
  });
});

describe("changementsDonnees", () => {
  it("ne signale rien quand rien n'a changé", () => {
    const d = creerDonneesDemo("2026-10-22");
    expect(changementsDonnees(d, structuredClone(d)).vide).toBe(true);
  });

  it("n'envoie que la fiche modifiée", () => {
    const d = creerDonneesDemo("2026-10-22");
    const apres = {
      ...d,
      apprenants: d.apprenants.map((a) => (a.id === "a4" ? { ...a, posteVise: "Product Builder" } : a)),
    };
    const c = changementsDonnees(d, apres);
    expect(c.apprenants.aEcrire).toHaveLength(1);
    expect(c.entreprises.aEcrire).toHaveLength(0);
    expect(c.vide).toBe(false);
  });

  it("envoie tout au premier remplissage d'une base vide", () => {
    const d = creerDonneesDemo("2026-10-22");
    const c = changementsDonnees({ apprenants: [], entreprises: [] }, d);
    expect(c.apprenants.aEcrire).toHaveLength(16);
    expect(c.entreprises.aEcrire).toHaveLength(4);
  });
});
