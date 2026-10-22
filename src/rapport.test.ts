import { describe, expect, it } from "vitest";
import { funnelInsertion, goulot, statsParPromo } from "./rapport";
import { creerDonneesDemo } from "./data/seed";

const TODAY = "2026-10-22";
const demo = () => creerDonneesDemo(TODAY).apprenants;

describe("funnelInsertion", () => {
  it("part des apprenants sortis de formation et décroît à chaque étape", () => {
    const f = funnelInsertion(demo(), TODAY);
    expect(f.map((e) => e.effectif).join(",")).toBe("13,9,9,7");
    for (let k = 1; k < f.length; k++) expect(f[k].effectif <= f[k - 1].effectif).toBe(true);
    expect(f[3].pourcentage).toBe(54);
  });

  it("calcule les pertes et repère le goulot d'étranglement", () => {
    const f = funnelInsertion(demo(), TODAY);
    expect(f[1].perte).toBe(4);
    expect(goulot(f)?.id).toBe("dossier");
  });

  it("reste vide sans apprenant sorti", () => {
    const f = funnelInsertion([], TODAY);
    expect(f[0].effectif).toBe(0);
    expect(goulot(f)).toBeNull();
  });
});

describe("statsParPromo", () => {
  it("trie les promos de la plus ancienne à la plus récente", () => {
    const s = statsParPromo(demo(), TODAY);
    expect(s).toHaveLength(3);
    expect(s[0].tauxSixMois).toBe(83);
    expect(s[1].tauxSixMois).toBeNull(); // fenêtre de 6 mois encore ouverte
    expect(s[2].enFormation).toBe(true);
    expect(s[0].insertes + s[0].enCours).toBe(s[0].effectif);
  });
});
