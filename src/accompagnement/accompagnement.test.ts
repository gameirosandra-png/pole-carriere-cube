import { describe, expect, it } from "vitest";
import type { Apprenant } from "../types";
import { creerDonneesDemo } from "../data/seed";
import { evaluerCV } from "./cv";
import { scorePortfolio } from "./portfolio";
import { calculerPretention, devinerPoste, referencePoste, scriptNegociation } from "./salaire";
import { evaluerSimulation, genererPitch, trousDansPitch } from "./convaincre";
import { aInviter, agendaSemaine, placesRestantes } from "./collectif";

const TODAY = "2026-10-22";
const demo = creerDonneesDemo(TODAY);
const parId = (id: string) => demo.apprenants.find((a) => a.id === id)!;
const hugo = parId("a10");

describe("atelier CV", () => {
  it("calcule le score sur les critères évalués et priorise les plus faibles", () => {
    const e = evaluerCV(hugo.accompagnement?.cv);
    expect(e.evalues).toBe(6);
    expect(e.score).toBe(67); // 8 points sur 12
    expect(e.priorites.map((c) => c.id).join(",")).toBe("resultats,accroche,lisibilite");
  });

  it("reste vide tant que rien n'est évalué", () => {
    expect(evaluerCV(undefined).score).toBeNull();
  });
});

describe("atelier portfolio", () => {
  it("repère le projet phare, les projets solides et le critère à travailler", () => {
    const s = scorePortfolio(hugo.accompagnement?.portfolio ?? []);
    expect(s.phare?.nom).toBe("Suivi des ruptures en magasin");
    expect(s.projetsSolides).toBe(2);
    expect(s.aTravailler?.id).toBe("resultat");
  });
});

describe("atelier salaire", () => {
  it("devine le poste de référence à partir du poste visé", () => {
    expect(devinerPoste("Chef de projet digital")).toBe("chefProjet");
    expect(devinerPoste("Product Owner junior")).toBe("productOwner");
    expect(devinerPoste("Automatisation no-code")).toBe("automatisation");
  });

  it("place la prétention dans la fourchette selon des atouts objectivables", () => {
    const p = calculerPretention(hugo, { poste: "productBuilder", zone: "idf", contrat: "salarie" });
    // 0,25 + IDF 0,20 + expérience 0,15 + 2 projets solides 0,10 = 0,70 → 35 000 + 0,7 × 10 000
    expect(p.annonce).toBe(42000);
    expect(p.plancher).toBe(38500);
    expect(p.facteurs).toHaveLength(3);
  });

  it("reste dans la fourchette et passe en TJM pour un freelance", () => {
    const debutant: Apprenant = { ...parId("a13"), accompagnement: undefined };
    const p = calculerPretention(debutant, { poste: "devNoCode", zone: "regions", contrat: "freelance" });
    expect(p.unite).toBe("€/jour");
    expect(p.annonce >= referencePoste("devNoCode").tjmMin).toBe(true);
    expect(p.annonce <= referencePoste("devNoCode").tjmMax).toBe(true);
  });

  it("produit un script qui cite la fourchette et la prétention", () => {
    const p = calculerPretention(hugo, { poste: "productBuilder", zone: "idf", contrat: "salarie" });
    const script = scriptNegociation(hugo, p).join(" ");
    expect(script.includes("35 k€")).toBe(true);
    expect(script.includes("42 k€")).toBe(true);
    expect(script.includes("Suivi des ruptures en magasin")).toBe(true);
  });
});

describe("atelier convaincre", () => {
  it("construit un pitch complet quand la fiche est remplie", () => {
    const pitch = genererPitch(hugo);
    expect(pitch).toHaveLength(4);
    expect(pitch[1].texte.includes("grande distribution")).toBe(true);
    expect(trousDansPitch(pitch)).toBe(4); // la preuve reste à détailler avec l'apprenant
  });

  it("signale les trous quand la fiche est vide", () => {
    const vierge: Apprenant = { ...parId("a13"), parcoursAvant: undefined, accompagnement: undefined };
    expect(trousDansPitch(genererPitch(vierge)) > 4).toBe(true);
  });

  it("note la simulation et pointe le critère à travailler", () => {
    const e = evaluerSimulation(hugo.accompagnement?.convaincre?.simulation);
    expect(e.score).toBe(65);
    expect(e.aTravailler?.id).toBe("star");
    expect(e.pretPourEntretien).toBe(false);
    expect(evaluerSimulation(parId("a7").accompagnement?.convaincre?.simulation).pretPourEntretien).toBe(true);
  });
});

describe("ateliers collectifs et agenda", () => {
  it("invite les apprenants dont la séance n'est pas faite", () => {
    const atelier = demo.ateliers!.find((x) => x.id === "at3")!; // simulation d'entretien
    const ids = aInviter(atelier, demo.apprenants).map((a) => a.id);
    expect(ids.includes("a10")).toBe(true); // Hugo n'a pas fait sa simulation
    expect(ids.includes("a7")).toBe(false); // Camille l'a faite
    expect(ids.includes("a1")).toBe(false); // Inès est en poste
    expect(placesRestantes(atelier)).toBe(6);
  });

  it("liste la semaine : retards d'abord, puis par date", () => {
    const agenda = agendaSemaine(demo.apprenants, demo.ateliers!, TODAY);
    expect(agenda[0].enRetard).toBe(true);
    expect(agenda[0].titre).toBe("Hugo Martin");
    expect(agenda.some((e) => e.type === "atelier" && e.titre.startsWith("Raconter"))).toBe(true);
    expect(agenda.some((e) => e.titre.startsWith("Un profil LinkedIn"))).toBe(false); // dans 14 jours
  });
});
