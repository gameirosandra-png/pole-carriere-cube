import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

export type VueVisite = "tdb" | "apprenants" | "entreprises" | "espace" | "rapport";

interface Etape {
  vue: VueVisite;
  cible: string;
  titre: string;
  texte: string;
}

export const ETAPES_VISITE: Etape[] = [
  {
    vue: "tdb",
    cible: ".promos",
    titre: "Chaque carré est un apprenant",
    texte:
      "Une ligne par promo, une couleur par situation. Le point rouge signale quelqu'un à relancer. Cliquez sur un carré pour ouvrir sa fiche.",
  },
  {
    vue: "tdb",
    cible: ".chiffres",
    titre: "Les indicateurs clés, calculés automatiquement",
    texte: "Taux d'insertion à 6 mois, délai moyen, entretiens en cours, relances à faire : plus de tableur à tenir.",
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
    titre: "Des dossiers prêts avant d'être proposés",
    texte: "Chaque apprenant suit une checklist en 7 étapes. Ici, la progression de toute la cohorte, étape par étape.",
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
      "Chaque apprenant a son espace : son dossier, sa prochaine étape, ses offres. Ce qu'il coche met à jour le suivi de l'équipe.",
  },
  {
    vue: "rapport",
    cible: ".rapport-page",
    titre: "Le reporting en un clic",
    texte: "Un rapport d'une page, par promo, prêt à imprimer ou à enregistrer en PDF.",
  },
];

interface Props {
  changerVue: (v: VueVisite) => void;
  terminer: () => void;
}

/** Visite guidée : met en lumière chaque zone clé de l'app, écran par écran. */
export function VisiteGuidee({ changerVue, terminer }: Props) {
  const [index, setIndex] = useState(0);
  const [cadre, setCadre] = useState<DOMRect | null>(null);
  const bulle = useRef<HTMLDivElement>(null);
  const etape = ETAPES_VISITE[index];
  const derniere = index === ETAPES_VISITE.length - 1;

  const mesurer = useCallback(() => {
    const el = document.querySelector(etape.cible);
    setCadre(el ? el.getBoundingClientRect() : null);
  }, [etape.cible]);

  // À chaque étape : afficher le bon écran, centrer la zone, puis la mesurer.
  useLayoutEffect(() => {
    changerVue(etape.vue);
    let image = requestAnimationFrame(() => {
      image = requestAnimationFrame(() => {
        const el = document.querySelector(etape.cible);
        el?.scrollIntoView({ block: "center", behavior: "auto" });
        mesurer();
        bulle.current?.focus();
      });
    });
    return () => cancelAnimationFrame(image);
  }, [etape, changerVue, mesurer]);

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
  if (window.innerWidth >= 700 && cadre) {
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
          Visite guidée · {index + 1} / {ETAPES_VISITE.length}
        </p>
        <h2 id="visite-titre">{etape.titre}</h2>
        <p>{etape.texte}</p>
        <div className="visite-actions">
          <button className="bouton-texte" onClick={terminer}>
            Passer la visite
          </button>
          <span className="visite-nav">
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
