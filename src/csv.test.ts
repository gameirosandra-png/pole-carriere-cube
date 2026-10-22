import { describe, expect, it } from "vitest";
import { versCsv } from "./csv";

describe("versCsv", () => {
  it("sépare les colonnes par des points-virgules", () => {
    expect(versCsv([["a", 1, null]])).toBe("a;1;");
  });

  it("protège les valeurs contenant un séparateur, un guillemet ou un retour à la ligne", () => {
    expect(versCsv([['Dit "oui"; ok', "ligne\nsuivante"]])).toBe('"Dit ""oui""; ok";"ligne\nsuivante"');
  });
});
