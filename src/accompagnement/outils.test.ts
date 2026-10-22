import { describe, expect, it } from "vitest";
import { creerDonneesDemo } from "../data/seed";
import { enregistrerPoint, gainMoyenCV, progression } from "./progression";
import { ficheCandidat, lienFiche, lireFicheDepuisHash } from "./ficheCandidat";
import { messageShortlist, lienMailto } from "./shortlist";
import { relancesAuto } from "./relances";
import { formatChrono, QUESTIONS_ENTRAINEMENT, tirerQuestions } from "./convaincre";
import { dureeEstimeeMs, libelleVitesse, scoreVoix, vitesseSuivante } from "../narration";
import { appliquerQuestionnaire, pointsAttention, poserQuestion, questionsEnAttente, repondreQuestion, resumeQuestionnaire } from "./questionnaire";
import { scorer } from "../matching";

const TODAY = "2026-10-22";
const demo = creerDonneesDemo(TODAY);
const parId = (id: string) => demo.apprenants.find((a) => a.id === id)!;
const hugo = parId("a10");

describe("progression", () => {
  it("mesure le gain entre le premier et le dernier relevé", () => {
    const p = progression(hugo);
    expect(p.cv?.debut).toBe(33);
    expect(p.cv?.fin).toBe(67);
    expect(p.cv?.gain).toBe(34);
    expect(p.simulation?.gain).toBe(20);
  });

  it("n'ajoute un point que si un score change, un seul par jour", () => {
    expect(enregistrerPoint(hugo, TODAY)).toBe(hugo);
    const mieux = { ...hugo, accompagnement: { ...hugo.accompagnement, cv: { notes: { ...hugo.accompagnement!.cv!.notes, resultats: 2 as const } } } };
    const un = enregistrerPoint(mieux, TODAY);
    expect(un.accompagnement?.historique?.length).toBe(4);
    expect(un.accompagnement?.historique?.[3].cv).toBe(83);
    const encore = { ...un, accompagnement: { ...un.accompagnement, cv: { notes: { ...un.accompagnement!.cv!.notes, accroche: 2 as const } } } };
    expect(enregistrerPoint(encore, TODAY).accompagnement?.historique?.length).toBe(4);
  });

  it("calcule le gain moyen de la cohorte", () => {
    const g = gainMoyenCV(demo.apprenants);
    expect(g?.effectif).toBe(3);
    expect(g?.gain).toBe(35); // (34 + 12 + 58) / 3
  });
});

describe("fiche candidat", () => {
  it("ne garde que ce qu'un recruteur doit voir", () => {
    const f = ficheCandidat(hugo);
    expect(f.initiale).toBe("M");
    expect(f.projets[0].nom).toBe("Suivi des ruptures en magasin");
    expect(f.projets[0].phare).toBe(true);
    expect(f.presentation.some((t) => t.includes("["))).toBe(false);
    expect(JSON.stringify(f).includes("k€")).toBe(false);
  });

  it("fait l'aller-retour par le lien, accents compris", () => {
    const f = ficheCandidat(hugo);
    const lien = lienFiche(hugo, "https://exemple.fr");
    expect(lien.length < 700).toBe(true);
    const lu = lireFicheDepuisHash(lien.slice("https://exemple.fr/".length));
    expect(JSON.stringify(lu)).toBe(JSON.stringify(f));
    expect(lireFicheDepuisHash("#candidat=abime")).toBeNull();
    expect(lireFicheDepuisHash("#autre")).toBeNull();
  });
});

describe("shortlist", () => {
  it("présente au plus 3 profils avec le lien de leur fiche", () => {
    const e = demo.entreprises[0];
    const o = e.offres[0];
    const m = messageShortlist(e, o, demo.apprenants.slice(0, 5), "https://exemple.fr");
    expect(m.sujet.startsWith("3 profils")).toBe(true);
    expect(m.corps.split("#candidat=").length - 1).toBe(3);
    expect(lienMailto(m.sujet, m.corps).length < 2000).toBe(true);
    expect(lienMailto("a b", "c").startsWith("mailto:?subject=a%20b")).toBe(true);
  });
});

describe("relances automatiques", () => {
  it("rappelle l'atelier aux inscrits et relance les silencieux", () => {
    const r = relancesAuto(demo.apprenants, demo.ateliers ?? [], TODAY);
    const rappels = r.filter((x) => x.type === "atelier");
    expect(rappels.map((x) => x.apprenantId).join(",")).toBe("a4,a15");
    expect(rappels[0].objet.includes("Raconter un projet")).toBe(true);
    const silences = r.filter((x) => x.type === "silence");
    expect(silences.length > 0).toBe(true);
    expect(silences.every((x) => x.message.includes("jours"))).toBe(true);
  });
});

describe("entraînement", () => {
  it("tire des questions différentes et formate le chrono", () => {
    const q = tirerQuestions(5, () => 0.3);
    expect(new Set(q).size).toBe(5);
    expect(q.every((x) => QUESTIONS_ENTRAINEMENT.includes(x))).toBe(true);
    expect(formatChrono(120)).toBe("2:00");
    expect(formatChrono(65)).toBe("1:05");
  });
});

describe("narration de la démo", () => {
  it("préfère une voix française neuronale", () => {
    const voix = [
      { name: "Google US English", lang: "en-US" },
      { name: "Amélie", lang: "fr-CA" },
      { name: "Microsoft Denise Online (Natural) - French (France)", lang: "fr-FR" },
      { name: "Google français", lang: "fr-FR" },
    ];
    const triees = [...voix].sort((a, b) => scoreVoix(b) - scoreVoix(a));
    expect(triees[0].name.startsWith("Microsoft Denise")).toBe(true);
    expect(scoreVoix(voix[0])).toBe(-1);
  });

  it("estime la durée de lecture", () => {
    expect(dureeEstimeeMs("un deux")).toBe(5000);
    expect(dureeEstimeeMs(Array(26).fill("mot").join(" "))).toBe(10000);
  });
});

describe("questionnaire « Faisons connaissance »", () => {
  const mehdi = parId("a16");

  it("remplit la fiche, le pitch et l'atelier salaire", () => {
    const a = appliquerQuestionnaire(
      mehdi,
      {
        parcoursAvant: "5 ans dans la vente",
        anneesExperience: 5,
        posteVise: "Automatisation no-code",
        contrat: "freelance",
        zone: "regions",
        inquietudes: ["salaire", "confiance"],
        motivation: "pour des PME qui perdent du temps sur la saisie.",
      },
      TODAY,
    );
    expect(a.questionnaire?.rempliLe).toBe(TODAY);
    expect(a.accompagnement?.salaire?.contrat).toBe("freelance");
    expect(a.accompagnement?.salaire?.zone).toBe("regions");
    expect(a.accompagnement?.salaire?.poste).toBe("automatisation");
    expect(a.accompagnement?.convaincre?.motivation).toBe("pour des PME qui perdent du temps sur la saisie.");
    expect(a.notes[0].texte.includes("Questionnaire")).toBe(true);
    expect(pointsAttention(a.questionnaire).map((p) => p.seance).join(",")).toBe("negociation,");
  });

  it("ne remplace pas ce que l'équipe a saisi par une réponse vide", () => {
    const hugo2 = appliquerQuestionnaire(hugo, { posteVise: "  ", motivation: "" }, TODAY);
    expect(hugo2.posteVise).toBe("Product Builder");
    expect(hugo2.accompagnement?.convaincre?.motivation).toBe(hugo.accompagnement?.convaincre?.motivation);
    expect(hugo2.notes.length).toBe(hugo.notes.length); // déjà rempli : pas de nouvelle note
  });

  it("résume les réponses pour la fiche", () => {
    const r = resumeQuestionnaire(parId("a14").questionnaire!);
    expect(r.find((l) => l.libelle === "Cherche")?.valeur).toBe("Alternance · en régions · hybride");
  });

  it("baisse le score des offres hors du contrat souhaité", () => {
    const lucas = parId("a14");
    const alternance = scorer(lucas, { id: "o", titre: "Product Builder", contrat: "Alternance", ouverte: true, candidats: [] });
    const cdi = scorer(lucas, { id: "o", titre: "Product Builder", contrat: "CDI", ouverte: true, candidats: [] });
    expect(alternance.raisons.includes("Contrat souhaité")).toBe(true);
    expect(cdi.raisons.includes("Préfère l'alternance")).toBe(true);
    expect(alternance.score > cdi.score).toBe(true);
  });
});

describe("boîte à questions", () => {
  it("pose, liste et répond", () => {
    const attente = questionsEnAttente(demo.apprenants);
    expect(attente.map((x) => x.question.id).join(",")).toBe("qp1,qp2");
    const lucas = repondreQuestion(parId("a14"), "qp1", " Oui, le replay sera dans ton espace. ", TODAY);
    expect(lucas.questions?.[0].reponse).toBe("Oui, le replay sera dans ton espace.");
    const avec = poserQuestion(parId("a16"), "Une question ?", "x", TODAY);
    expect(avec.questions?.length).toBe(1);
    expect(avec.dernierContact).toBe(TODAY);
  });
});

describe("vitesse de la démo", () => {
  it("tourne en boucle sur les vitesses proposées", () => {
    expect(vitesseSuivante(1)).toBe(1.25);
    expect(vitesseSuivante(1.5)).toBe(0.75);
    expect(libelleVitesse(1.25)).toBe("1,25×");
  });
});
