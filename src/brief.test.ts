import { describe, expect, it } from "vitest";
import { briefSansIA, donneesPourBrief, lireBrief } from "./brief";
import { creerDonneesDemo } from "./data/seed";

const TODAY = "2026-10-22";
const demo = creerDonneesDemo(TODAY);
const hugo = demo.apprenants.find((a) => a.id === "a10")!;

describe("brief de rendez-vous", () => {
  it("n'envoie à l'IA que les champs utiles, dont les étapes manquantes", () => {
    const d = donneesPourBrief(hugo, demo.entreprises, TODAY);
    expect(d.etapesManquantes.join(",")).toBe("Simulation d'entretien réalisée");
    expect(d.offres[0]).toBe("Chef de projet no-code chez Atelier Merlin");
    expect(d.joursSansContact).toBe(12);
  });

  it("lit la réponse de l'IA en rubriques et puces", () => {
    const r = lireBrief(
      "Situation\n- En recherche\nPoints à travailler :\n- Portfolio\n- Pitch\nQuestions à poser\n- Où en es-tu ?",
    );
    expect(r).toHaveLength(3);
    expect(r[1].titre).toBe("Points à travailler");
    expect(r[1].points).toHaveLength(2);
  });

  it("propose un brief de secours sans IA", () => {
    const r = briefSansIA(hugo, demo.entreprises, TODAY);
    expect(r.map((x) => x.titre).join(",")).toBe("Situation,Points à travailler,Questions à poser");
    expect(r[0].points.some((p) => p.includes("action en retard"))).toBe(true);
    expect(r[1].points[0]).toBe("Avancer sur : simulation d'entretien réalisée");
  });
});
