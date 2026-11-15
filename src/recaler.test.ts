import { describe, expect, it } from "vitest";
import { creerDonneesDemo } from "./data/seed";
import { recalerDonnees } from "./recaler";

describe("recalerDonnees", () => {
  it("donne les mêmes dates qu'une démo créée le jour même", () => {
    const anciennes = creerDonneesDemo("2026-10-20");
    const recalees = recalerDonnees(anciennes, "2026-10-20", "2026-11-18");
    expect(recalees).toEqual(creerDonneesDemo("2026-11-18"));
  });

  it("garde un nom de promo renommé à la main", () => {
    const anciennes = creerDonneesDemo("2026-10-20");
    anciennes.apprenants[0].promo = "Promo pionnière";
    const recalees = recalerDonnees(anciennes, "2026-10-20", "2026-11-18");
    expect(recalees.apprenants[0].promo).toBe("Promo pionnière");
  });

  it("ne change rien le jour même", () => {
    const d = creerDonneesDemo("2026-11-18");
    expect(recalerDonnees(d, "2026-11-18", "2026-11-18")).toBe(d);
  });
});
