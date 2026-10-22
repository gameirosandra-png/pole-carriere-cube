import { describe, expect, it } from "vitest";
import { ajouterJours, ajouterMois, aujourdhui, joursEntre } from "./dates";

describe("dates", () => {
  it("donne la date du jour locale, même juste avant minuit", () => {
    expect(aujourdhui(new Date(2026, 9, 22, 23, 59))).toBe("2026-10-22");
  });

  it("compte les jours entre deux dates, y compris au changement d'heure", () => {
    expect(joursEntre("2026-10-20", "2026-10-30")).toBe(10);
    expect(joursEntre("2026-03-28", "2026-03-30")).toBe(2);
    expect(joursEntre("2026-10-30", "2026-10-20")).toBe(-10);
  });

  it("ajoute des jours en changeant de mois et d'année", () => {
    expect(ajouterJours("2026-12-30", 3)).toBe("2027-01-02");
    expect(ajouterJours("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("ajoute des mois sans déborder sur le mois suivant", () => {
    expect(ajouterMois("2026-03-31", 6)).toBe("2026-09-30");
    expect(ajouterMois("2026-08-31", 6)).toBe("2027-02-28");
    expect(ajouterMois("2026-06-26", 6)).toBe("2026-12-26");
  });
});
