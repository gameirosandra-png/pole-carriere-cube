import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

export type VueVisite = "tdb" | "apprenants" | "ateliers" | "entreprises" | "espace" | "rapport";

interface Etape {
  vue: VueVisite;
  cible: string;
  titre: string;
  texte: string;
  /** Démo : fiche apprenant à ouvrir (null = la fermer, absent = ne rien changer). */
  fiche?: string | null;
  /** Démo : élément sur lequel cliquer avant de montrer la cible (ex. un onglet). */
  clic?: string;
}

export const ETAPES_VISITE: Etape[] = [
  {
    vue: "tdb",
    cible: ".semaine",
    titre: "D'abord, accompagner",
    texte:
      "La semaine du pôle en un coup d'œil : rendez-vous individuels, ateliers collectifs, et les actions en retard à rattraper en premier.",
  },
  {
    vue: "tdb",
    cible: ".promos",
    titre: "Chaque carré est un apprenant",
    texte:
      "Une ligne par promo, une couleur par situation, un point rouge pour qui relancer. Un clic ouvre la fiche, avec 4 ateliers : CV, portfolio, salaire et pitch.",
  },
  {
    vue: "tdb",
    cible: ".section-funnel",
    titre: "Où les apprenants décrochent",
    texte: "L'entonnoir montre combien franchissent chaque étape, et indique où concentrer l'effort du pôle.",
  },
  {
    vue: "tdb",
    cible: ".section-dossiers",
    titre: "Un parcours en 7 séances",
    texte:
      "Du bilan à la négociation salariale : la progression de toute la cohorte, séance par séance, pour savoir quel atelier organiser.",
  },
  {
    vue: "ateliers",
    cible: ".atelier-collectif",
    titre: "Des ateliers collectifs ciblés",
    texte:
      "Pour chaque atelier, l'outil propose d'inviter les apprenants dont la séance n'est pas encore faite. Un clic pour les inscrire.",
  },
  {
    vue: "entreprises",
    cible: ".offre:not(.offre-pourvue)",
    titre: "Le bon profil pour chaque offre",
    texte:
      "« Suggérer des candidats » classe les apprenants selon leur dossier, leur projet et leur disponibilité, en expliquant chaque score.",
  },
  {
    vue: "espace",
    cible: ".espace-page",
    titre: "L'apprenant acteur de son parcours",
    texte:
      "Chaque apprenant a son espace : ses séances, sa prochaine étape, ses offres. Ce qu'il coche met à jour le suivi de l'équipe.",
  },
  {
    vue: "rapport",
    cible: ".rapport-page",
    titre: "Le reporting en un clic",
    texte: "Un rapport d'une page, par promo, prêt à imprimer ou à enregistrer en PDF.",
  },
];

/** Démo automatique de 2 minutes : l'histoire d'Hugo, de la semaine du pôle jusqu'à l'entreprise. */
export const ETAPES_DEMO: Etape[] = [
  {
    vue: "tdb",
    fiche: null,
    cible: ".semaine",
    titre: "Lundi matin au pôle carrière",
    texte: "La semaine en un coup d'œil : rendez-vous, ateliers collectifs, et ce qui est en retard.",
  },
  {
    vue: "tdb",
    fiche: null,
    cible: ".relances-auto",
    titre: "Les relances sont déjà écrites",
    texte: "Rappels d'atelier et apprenants sans nouvelles : les messages sont prêts, un clic les envoie via Make.",
  },
  {
    vue: "tdb",
    fiche: null,
    cible: ".promos",
    titre: "Chaque carré est un apprenant",
    texte: "Une couleur par situation, un point rouge pour qui relancer. Suivons Hugo, en recherche d'emploi.",
  },
  {
    vue: "tdb",
    fiche: "a10",
    clic: "#onglet-suivi",
    cible: ".progression",
    titre: "L'effet de l'accompagnement, mesuré",
    texte:
      "Les scores CV et entretien sont relevés à chaque séance : la courbe montre ce que l'accompagnement a changé pour Hugo.",
  },
  {
    vue: "tdb",
    fiche: "a10",
    clic: "#onglet-cv",
    cible: ".atelier-resultat",
    titre: "Atelier CV",
    texte: "6 critères notés en séance, un score, et un plan d'action qui commence par le plus faible.",
  },
  {
    vue: "tdb",
    fiche: "a10",
    clic: "#onglet-salaire",
    cible: ".marche",
    titre: "Une prétention salariale argumentée",
    texte: "La fourchette du marché, sourcée, et le montant à annoncer selon ses atouts. Plus un plancher.",
  },
  {
    vue: "tdb",
    fiche: "a10",
    clic: "#onglet-convaincre",
    cible: ".appel-entrainement",
    titre: "S'entraîner à convaincre",
    texte: "Un pitch de 2 minutes construit depuis la fiche, et un mode entraînement chronométré en plein écran.",
  },
  {
    vue: "tdb",
    fiche: "a10",
    clic: "#onglet-candidat",
    cible: ".fiche-candidat",
    titre: "La fiche envoyée à l'entreprise",
    texte: "Une page propre, partageable par lien ou en PDF : pitch, projets, préparation. Sans données internes.",
  },
  {
    vue: "entreprises",
    fiche: null,
    cible: ".shortlist-ligne",
    titre: "La shortlist part en un clic",
    texte: "Depuis une offre : 3 profils, un mail prêt avec la fiche de chacun. Le pôle place, il ne fait pas que suivre.",
  },
  {
    vue: "espace",
    fiche: null,
    cible: ".boite-outils",
    titre: "L'apprenant avance seul",
    texte: "Dans son espace, Hugo retrouve son CV à corriger, son pitch, sa prétention, et s'entraîne à l'oral.",
  },
  {
    vue: "rapport",
    fiche: null,
    cible: ".rapport-page",
    titre: "Et la direction a ses chiffres",
    texte: "Taux d'insertion, délais, promo par promo : un rapport d'une page, prêt à imprimer.",
  },
];

const DUREE_ETAPE_MS = 11_000;

interface Props {
  changerVue: (v: VueVisite) => void;
  terminer: () => void;
  /** Démo automatique : les étapes s'enchaînent seules. */
  auto?: boolean;
  ouvrirFiche?: (id: string | null) => void;
}

/** Visite guidée : met en lumière chaque zone clé de l'app, écran par écran. */
export function VisiteGuidee({ changerVue, terminer, auto = false, ouvrirFiche }: Props) {
  const etapes = auto ? ETAPES_DEMO : ETAPES_VISITE;
  const [index, setIndex] = useState(0);
  const [cadre, setCadre] = useState<DOMRect | null>(null);
  const [fiche, setFiche] = useState<DOMRect | null>(null);
  const [pause, setPause] = useState(false);
  const [ecoule, setEcoule] = useState(0);
  const bulle = useRef<HTMLDivElement>(null);
  const etape = etapes[index];
  const derniere = index === etapes.length - 1;

  const mesurer = useCallback(() => {
    const el = document.querySelector(etape.cible);
    setCadre(el ? el.getBoundingClientRect() : null);
    const panneau = el?.closest(".fiche");
    setFiche(panneau ? panneau.getBoundingClientRect() : null);
  }, [etape.cible]);

  // À chaque étape : afficher le bon écran (et la bonne fiche), centrer la zone, puis la mesurer.
  useLayoutEffect(() => {
    changerVue(etape.vue);
    if (etape.fiche !== undefined) ouvrirFiche?.(etape.fiche);
    setEcoule(0);
    let minuteur = 0;
    let image = requestAnimationFrame(() => {
      image = requestAnimationFrame(() => {
        if (etape.clic) document.querySelector<HTMLElement>(etape.clic)?.click();
        minuteur = window.setTimeout(
          () => {
            const el = document.querySelector(etape.cible);
            el?.scrollIntoView({ block: "center", behavior: "auto" });
            mesurer();
            bulle.current?.focus();
          },
          etape.clic ? 60 : 0,
        );
      });
    });
    return () => {
      cancelAnimationFrame(image);
      clearTimeout(minuteur);
    };
  }, [etape, changerVue, mesurer, ouvrirFiche]);

  // Démo automatique : avance seule, sauf en pause.
  useEffect(() => {
    if (!auto || pause) return;
    const t = setInterval(() => setEcoule((e) => e + 200), 200);
    return () => clearInterval(t);
  }, [auto, pause]);

  useEffect(() => {
    if (!auto || ecoule < DUREE_ETAPE_MS) return;
    if (derniere) terminer();
    else setIndex((i) => i + 1);
  }, [auto, ecoule, derniere, terminer]);

  useEffect(() => {
    window.addEventListener("resize", mesurer);
    window.addEventListener("scroll", mesurer, true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") terminer();
      if (e.key === "ArrowRight" && !derniere) setIndex((i) => i + 1);
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", mesurer);
      window.removeEventListener("scroll", mesurer, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [mesurer, terminer, derniere]);

  // Bulle sous la zone s'il y a la place, sinon au-dessus ; collée en bas sur mobile.
  const marge = 12;
  const largeur = Math.min(360, window.innerWidth - 32);
  let style: CSSProperties = {};
  if (window.innerWidth >= 700 && cadre && fiche && fiche.left > largeur + 32) {
    // Zone dans la fiche apprenant : la bulle se place à gauche du panneau, sans le masquer.
    style = {
      top: Math.min(Math.max(16, cadre.top), window.innerHeight - 280),
      left: fiche.left - largeur - 16,
      width: largeur,
    };
  } else if (window.innerWidth >= 700 && cadre) {
    const enDessous = cadre.bottom + marge + 220 < window.innerHeight;
    const gauche = Math.min(Math.max(16, cadre.left), window.innerWidth - largeur - 16);
    style = enDessous
      ? { top: cadre.bottom + marge, left: gauche, width: largeur }
      : { top: Math.max(16, cadre.top - marge - 220), left: gauche, width: largeur };
  }

  return (
    <div className="visite" aria-live="polite">
      {cadre && (
        <div
          className="visite-projecteur"
          style={{ top: cadre.top - 6, left: cadre.left - 6, width: cadre.width + 12, height: cadre.height + 12 }}
        />
      )}
      <div
        className="visite-bulle"
        role="dialog"
        aria-modal="true"
        aria-labelledby="visite-titre"
        tabIndex={-1}
        ref={bulle}
        style={style}
      >
        <p className="visite-compteur">
          {auto ? "Démo" : "Visite guidée"} · {index + 1} / {etapes.length}
        </p>
        {auto && (
          <div className="visite-temps" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (ecoule / DUREE_ETAPE_MS) * 100)}%` }} />
          </div>
        )}
        <h2 id="visite-titre">{etape.titre}</h2>
        <p>{etape.texte}</p>
        <div className="visite-actions">
          <button className="bouton-texte" onClick={terminer}>
            {auto ? "Quitter la démo" : "Passer la visite"}
          </button>
          <span className="visite-nav">
            {auto && (
              <button className="bouton bouton-discret" onClick={() => setPause(!pause)}>
                {pause ? "Reprendre" : "Pause"}
              </button>
            )}
            {index > 0 && (
              <button className="bouton bouton-discret" onClick={() => setIndex(index - 1)}>
                Précédent
              </button>
            )}
            <button className="bouton" onClick={() => (derniere ? terminer() : setIndex(index + 1))}>
              {derniere ? "Terminer" : "Suivant"}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
