import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Narrateur, dureeEstimeeMs, libelleVitesse, vitesseSuivante } from "../narration";

const CLE_VITESSE = "pole-carriere-cube:vitesse-demo";
const vitesseEnregistree = () => {
  try {
    const v = Number(localStorage.getItem(CLE_VITESSE));
    return [0.75, 1, 1.25, 1.5].includes(v) ? v : 1;
  } catch {
    return 1;
  }
};

export type VueVisite = "tdb" | "adn" | "apprenants" | "ateliers" | "entreprises" | "espace" | "simulateur" | "rapport";

interface Etape {
  vue: VueVisite;
  cible: string;
  titre: string;
  texte: string;
  /** Démo : fiche apprenant à ouvrir (null = la fermer, absent = ne rien changer). */
  fiche?: string | null;
  /** Démo : élément sur lequel cliquer avant de montrer la cible (ex. un onglet). */
  clic?: string;
  /** Démo : le texte dit par la voix, écrit pour l'oral. */
  voix?: string;
  /** Démo : apprenant à afficher dans l'espace apprenant. */
  espace?: string;
  /** Démo : écran plein (ouverture ou fin de la vidéo) au lieu d'une zone de l'app. */
  carton?: "ouverture" | "fin";
  /** Durée sans voix, en ms (11 s par défaut). */
  duree?: number;
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
      "Chaque apprenant a son espace : un questionnaire pour faire connaissance, ses séances, ses offres, et une boîte à questions. Tout alimente le suivi de l'équipe.",
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
    cible: "",
    carton: "ouverture",
    duree: 5000,
    titre: "Le pôle carrière",
    texte: "Accompagner les apprenants d'une école no-code jusqu'à l'emploi.",
    voix:
      "Voici le pôle carrière : un outil pour accompagner les apprenants d'une école no-code jusqu'à l'emploi. Deux minutes pour en faire le tour.",
  },
  {
    vue: "tdb",
    fiche: null,
    cible: ".semaine",
    titre: "Lundi matin au pôle carrière",
    texte: "La semaine en un coup d'œil : rendez-vous, ateliers collectifs, et ce qui est en retard.",
    voix:
      "Lundi matin, en un coup d'œil : les rendez-vous de la semaine, les ateliers collectifs, et ce qui est en retard.",
  },
  {
    vue: "tdb",
    fiche: null,
    cible: ".relances-auto",
    titre: "Les relances sont déjà écrites",
    texte: "Rappels d'atelier et apprenants sans nouvelles : les messages sont prêts, un clic les envoie via Make.",
    voix:
      "Les relances sont déjà écrites : rappels d'atelier, et messages aux apprenants sans nouvelles depuis deux semaines. Un clic, et elles partent.",
  },
  {
    vue: "adn",
    fiche: null,
    cible: ".adn-cohorte",
    titre: "Ma méthode signature : ADN",
    texte: "Ancrer ses forces, Diriger son cap, Narrer sa reconversion. La météo de confiance de la cohorte et les freins à lever.",
    voix:
      "Au cœur de l'accompagnement, ma méthode signature, ADN : ancrer ses forces, diriger son cap, narrer sa reconversion. Ici, la confiance de toute la cohorte, et les freins à lever : syndrome de l'imposteur, plafond de verre, peur d'annoncer son prix.",
  },
  {
    vue: "tdb",
    fiche: "a10",
    clic: "#onglet-suivi",
    cible: ".progression",
    titre: "L'effet de l'accompagnement, mesuré",
    texte:
      "Les scores CV et entretien sont relevés à chaque séance : la courbe montre ce que l'accompagnement a changé pour Hugo.",
    voix:
      "Suivons Hugo, en recherche d'emploi. À chaque séance, ses scores de CV et d'entretien sont relevés : l'accompagnement a un effet mesurable.",
  },
  {
    vue: "tdb",
    fiche: "a10",
    clic: "#onglet-cv",
    cible: ".atelier-resultat",
    titre: "Atelier CV",
    texte: "6 critères notés en séance, un score, et un plan d'action qui commence par le plus faible.",
    voix:
      "Atelier CV : six critères notés pendant la séance, un score sur cent, et un plan d'action qui commence par le point le plus faible.",
  },
  {
    vue: "tdb",
    fiche: "a10",
    clic: "#onglet-salaire",
    cible: ".marche",
    titre: "Une prétention salariale argumentée",
    texte: "La fourchette du marché, sourcée, et le montant à annoncer selon ses atouts. Plus un plancher.",
    voix:
      "Pour le salaire, l'outil part de fourchettes de marché sourcées, et calcule le montant à annoncer selon les atouts d'Hugo. Avec un plancher à ne pas franchir.",
  },
  {
    vue: "tdb",
    fiche: "a10",
    clic: "#onglet-convaincre",
    cible: ".appel-entrainement",
    titre: "S'entraîner à convaincre",
    texte: "Un pitch de 2 minutes construit depuis la fiche, et un mode entraînement chronométré en plein écran.",
    voix:
      "Pour convaincre : un pitch de deux minutes, construit à partir de sa fiche, et un mode entraînement chronométré, en plein écran.",
  },
  {
    vue: "tdb",
    fiche: "a10",
    clic: "#onglet-candidat",
    cible: ".fiche-candidat",
    titre: "La fiche envoyée à l'entreprise",
    texte: "Une page propre, partageable par lien ou en PDF : pitch, projets, préparation. Sans données internes.",
    voix:
      "Voici la fiche envoyée à l'entreprise : son pitch, ses projets, sa préparation. Sans notes internes, ni salaire. Partageable par lien, ou en PDF.",
  },
  {
    vue: "entreprises",
    fiche: null,
    cible: ".shortlist-ligne",
    titre: "La shortlist part en un clic",
    texte: "Depuis une offre : 3 profils, un mail prêt avec la fiche de chacun. Le pôle place, il ne fait pas que suivre.",
    voix:
      "Côté entreprises, la shortlist part en un clic : trois profils, un mail prêt, avec la fiche de chacun. Le pôle ne fait pas que suivre : il place.",
  },
  {
    vue: "espace",
    espace: "a10",
    fiche: null,
    cible: ".boite-outils",
    titre: "L'apprenant avance seul",
    texte: "Dans son espace, Hugo retrouve sa méthode ADN, son CV à corriger, son pitch, et s'entraîne à l'oral.",
    voix:
      "Entre deux séances, Hugo avance seul. Dans son espace, il retrouve sa méthode ADN, son CV à corriger, son pitch, et il s'entraîne à l'oral.",
  },
  {
    vue: "simulateur",
    fiche: null,
    cible: ".simulateur-resultats",
    titre: "Et pour se lancer en freelance",
    texte: "« Je veux 3 000 € net par mois » : le TJM à facturer, les jours et les missions nécessaires, chiffres 2026 sourcés.",
    voix:
      "Et pour ceux qui se lancent en freelance, un simulateur : je veux trois mille euros net par mois. Il donne le TJM à facturer, les jours et les missions nécessaires, chiffres 2026 à l'appui.",
  },
  {
    vue: "espace",
    fiche: "a14",
    clic: "#onglet-suivi",
    cible: ".profil",
    titre: "Faire connaissance dès l'arrivée",
    texte: "Un questionnaire avant la séance 1 : objectifs, contraintes et inquiétudes remontent dans la fiche.",
    voix:
      "Dès son arrivée, chaque apprenant remplit un questionnaire pour faire connaissance. Ses objectifs et ses inquiétudes remontent dans sa fiche : la première séance démarre sur l'essentiel.",
  },
  {
    vue: "rapport",
    fiche: null,
    cible: ".rapport-page",
    titre: "Et la direction a ses chiffres",
    texte: "Taux d'insertion, délais, promo par promo : un rapport d'une page, prêt à imprimer.",
    voix:
      "Enfin, la direction a ses chiffres : taux d'insertion, délais, promo par promo. Un pôle carrière piloté, de l'accompagnement jusqu'à l'emploi.",
  },
  {
    vue: "rapport",
    fiche: null,
    cible: "",
    carton: "fin",
    duree: 8000,
    titre: "Sandra Gameiro",
    texte: "Product & Operations Builder · No-code et IA",
    voix:
      "Ce MVP a été construit en une journée avec Claude, et vérifié par plus de cent soixante-dix tests automatiques. Je suis Sandra Gameiro : je serais ravie de vous le présenter.",
  },
];

const DUREE_ETAPE_MS = 11_000;

interface Props {
  changerVue: (v: VueVisite) => void;
  terminer: () => void;
  /** Démo automatique : les étapes s'enchaînent seules. */
  auto?: boolean;
  ouvrirFiche?: (id: string | null) => void;
  choisirEspace?: (id: string | null) => void;
}

/** Visite guidée : met en lumière chaque zone clé de l'app, écran par écran. */
export function VisiteGuidee({ changerVue, terminer, auto = false, ouvrirFiche, choisirEspace }: Props) {
  const etapes = auto ? ETAPES_DEMO : ETAPES_VISITE;
  const [index, setIndex] = useState(0);
  const [cadre, setCadre] = useState<DOMRect | null>(null);
  const [fiche, setFiche] = useState<DOMRect | null>(null);
  const [pause, setPause] = useState(false);
  const [ecoule, setEcoule] = useState(0);
  const bulle = useRef<HTMLDivElement>(null);
  const etape = etapes[index];
  const derniere = index === etapes.length - 1;

  // Narration : la démo est commentée à voix haute, et avance quand la voix a fini.
  const narrateur = useRef<Narrateur | null>(null);
  narrateur.current ??= new Narrateur();
  const [voixActive, setVoixActive] = useState(true);
  const [voixDispo, setVoixDispo] = useState(true);
  const [nomVoix, setNomVoix] = useState("");
  const [vitesse, setVitesse] = useState(vitesseEnregistree);
  const changerVitesse = useCallback(
    (v: number) => {
      setVitesse(v);
      try {
        localStorage.setItem(CLE_VITESSE, String(v));
      } catch {
        /* préférence non mémorisée : sans conséquence */
      }
    },
    [],
  );
  const modeVoix = auto && voixActive && voixDispo;
  const texteVoix = etape.voix ?? etape.texte;
  // Durées exprimées en temps réel : à 1,5×, une étape dure 1,5 fois moins longtemps.
  const duree = modeVoix ? dureeEstimeeMs(texteVoix) : (etape.duree ?? DUREE_ETAPE_MS);

  const mesurer = useCallback(() => {
    const el = etape.cible ? document.querySelector(etape.cible) : null;
    setCadre(el ? el.getBoundingClientRect() : null);
    const panneau = el?.closest(".fiche");
    setFiche(panneau ? panneau.getBoundingClientRect() : null);
  }, [etape.cible]);

  // À chaque étape : afficher le bon écran (et la bonne fiche), centrer la zone, puis la mesurer.
  useLayoutEffect(() => {
    changerVue(etape.vue);
    if (etape.fiche !== undefined) ouvrirFiche?.(etape.fiche);
    if (etape.espace) choisirEspace?.(etape.espace);
    setEcoule(0);
    let minuteur = 0;
    let image = requestAnimationFrame(() => {
      image = requestAnimationFrame(() => {
        if (etape.clic) document.querySelector<HTMLElement>(etape.clic)?.click();
        minuteur = window.setTimeout(
          () => {
            const el = etape.cible ? document.querySelector(etape.cible) : null;
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
  }, [etape, changerVue, mesurer, ouvrirFiche, choisirEspace]);

  const avancer = useCallback(() => {
    if (derniere) terminer();
    else setIndex((i) => i + 1);
  }, [derniere, terminer]);

  // Démo automatique : le temps s'écoule, sauf en pause.
  useEffect(() => {
    if (!auto || pause) return;
    const t = setInterval(() => setEcoule((e) => e + 200 * vitesse), 200);
    return () => clearInterval(t);
  }, [auto, pause, vitesse]);

  // Sans voix : on avance au minuteur. Avec voix : à la fin de la phrase (filet de sécurité si elle ne finit jamais).
  useEffect(() => {
    if (!auto) return;
    if ((!modeVoix && ecoule >= duree) || (modeVoix && ecoule >= duree * 2 + 4000)) avancer();
  }, [auto, modeVoix, ecoule, duree, avancer]);

  // La phrase est finie : on passe à la suite après un court silence, sauf en pause.
  const [voixFinie, setVoixFinie] = useState(-1);
  useEffect(() => {
    if (!modeVoix) return;
    const n = narrateur.current!;
    let actif = true;
    n.dire(texteVoix, index, vitesse).then((fin) => {
      if (!actif) return;
      setNomVoix(n.nomVoix);
      if (fin === "fini") setVoixFinie(index);
      if (fin === "indisponible") setVoixDispo(false);
    });
    setNomVoix(n.nomVoix);
    return () => {
      actif = false;
      n.arreter();
    };
  }, [modeVoix, texteVoix, index, vitesse]);

  useEffect(() => {
    if (!modeVoix || pause || voixFinie !== index) return;
    const suite = window.setTimeout(avancer, 700 / vitesse);
    return () => clearTimeout(suite);
  }, [modeVoix, pause, voixFinie, index, avancer, vitesse]);

  useEffect(() => {
    if (pause) narrateur.current?.pause();
    else narrateur.current?.reprendre();
  }, [pause]);

  useEffect(() => () => narrateur.current?.arreter(), []);

  // Mode film : les commandes s'effacent quand la souris ne bouge plus, pour une capture propre.
  const [inactif, setInactif] = useState(false);
  useEffect(() => {
    if (!auto) return;
    let minuteur = window.setTimeout(() => setInactif(true), 2500);
    const bouge = () => {
      setInactif(false);
      clearTimeout(minuteur);
      minuteur = window.setTimeout(() => setInactif(true), 2500);
    };
    window.addEventListener("mousemove", bouge);
    window.addEventListener("keydown", bouge);
    return () => {
      clearTimeout(minuteur);
      window.removeEventListener("mousemove", bouge);
      window.removeEventListener("keydown", bouge);
    };
  }, [auto]);

  useEffect(() => {
    window.addEventListener("resize", mesurer);
    window.addEventListener("scroll", mesurer, true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") terminer();
      if (e.key === "ArrowRight" && !derniere) setIndex((i) => i + 1);
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (auto && e.key === " ") {
        e.preventDefault();
        setPause((p) => !p);
      }
      if (auto && (e.key === "+" || e.key === "=")) changerVitesse(Math.min(1.5, vitesse + 0.25));
      if (auto && (e.key === "-" || e.key === "_")) changerVitesse(Math.max(0.75, vitesse - 0.25));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", mesurer);
      window.removeEventListener("scroll", mesurer, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [mesurer, terminer, derniere, auto, vitesse, changerVitesse]);

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

  if (auto) {
    // Mode film : un bandeau de sous-titres en bas, l'interface reste visible.
    // Fiche apprenant ouverte : le bandeau se place à gauche du panneau.
    const avecFiche = fiche && fiche.left > 480 && window.innerWidth >= 700;
    const styleBandeau: CSSProperties = avecFiche
      ? { left: 16, width: fiche.left - 32 }
      : { left: "50%", transform: "translateX(-50%)", width: Math.min(880, window.innerWidth - 32) };
    return (
      <div className={inactif ? "visite film inactif" : "visite film"} aria-live="polite">
        {etape.carton && <Carton type={etape.carton} />}
        {cadre && !etape.carton && (
          <div
            className="visite-projecteur"
            style={{ top: cadre.top - 6, left: cadre.left - 6, width: cadre.width + 12, height: cadre.height + 12 }}
          />
        )}
        <div
          className="visite-bulle film-bandeau"
          role="dialog"
          aria-modal="true"
          aria-labelledby="visite-titre"
          tabIndex={-1}
          ref={bulle}
          style={styleBandeau}
        >
          <div className="film-tete">
            <p className="visite-compteur">
              Démo · {index + 1} / {etapes.length}
            </p>
            {modeVoix && nomVoix && <p className="visite-voix">Commentée par {nomVoix}</p>}
            <div className="film-commandes">
              {voixDispo && (
                <button
                  className="film-bouton bouton-voix"
                  aria-pressed={voixActive}
                  onClick={() => setVoixActive(!voixActive)}
                  title={voixActive ? "Couper la voix" : "Activer la voix"}
                >
                  {voixActive ? "Voix" : "Voix coupée"}
                </button>
              )}
              <button
                className="film-bouton bouton-vitesse"
                onClick={() => changerVitesse(vitesseSuivante(vitesse))}
                title="Changer la vitesse (touches + et -)"
                aria-label={`Vitesse ${libelleVitesse(vitesse)}, changer`}
              >
                {libelleVitesse(vitesse)}
              </button>
              <button className="film-bouton" onClick={() => setPause(!pause)}>
                {pause ? "Reprendre" : "Pause"}
              </button>
              {index > 0 && (
                <button className="film-bouton" onClick={() => setIndex(index - 1)}>
                  Précédent
                </button>
              )}
              <button className="film-bouton" onClick={() => (derniere ? terminer() : setIndex(index + 1))}>
                {derniere ? "Terminer" : "Suivant"}
              </button>
              <button className="film-bouton" onClick={terminer} aria-label="Quitter la démo" title="Quitter la démo">
                ×
              </button>
            </div>
          </div>
          {etape.carton ? (
            <h2 id="visite-titre" className="visuellement-cache">
              {etape.titre}
            </h2>
          ) : (
            <>
              <h2 id="visite-titre">{etape.titre}</h2>
              <p className="film-texte">{etape.texte}</p>
            </>
          )}
          <div className="visite-temps" aria-hidden="true">
            <span style={{ width: `${Math.min(modeVoix ? 98 : 100, (ecoule / duree) * 100)}%` }} />
          </div>
        </div>
      </div>
    );
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
          Visite guidée · {index + 1} / {etapes.length}
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

/** Écrans d'ouverture et de fin de la démo : ce qu'il faut savoir quand la vidéo circule sans vous. */
function Carton({ type }: { type: "ouverture" | "fin" }) {
  if (type === "ouverture") {
    return (
      <div className="film-carton">
        <img src="/logo.svg" alt="" width="72" height="72" />
        <p className="film-carton-sur-titre">MVP · démo commentée de 2 minutes</p>
        <p className="film-carton-titre">Le pôle carrière</p>
        <p className="film-carton-sous-titre">Accompagner les apprenants d'une école no-code jusqu'à l'emploi</p>
        <p className="film-carton-pied">Conçu par Sandra Gameiro · données fictives</p>
      </div>
    );
  }
  return (
    <div className="film-carton">
      <img src="/logo.svg" alt="" width="56" height="56" />
      <p className="film-carton-titre">Sandra Gameiro</p>
      <p className="film-carton-sous-titre">Product &amp; Operations Builder · No-code et IA</p>
      <p className="film-carton-preuve">Construit en une journée avec Claude · 170+ vérifications automatiques</p>
      <ul className="film-carton-liens">
        <li>
          <span>Démo</span> pole-carriere-cube.vercel.app
        </li>
        <li>
          <span>Code</span> github.com/gameirosandra-png/pole-carriere-cube
        </li>
        <li>
          <span>Contact</span> ladoucenaissance@gmail.com
        </li>
        <li>
          <span>LinkedIn</span> linkedin.com/in/sandra-gameiro
        </li>
      </ul>
      <p className="film-carton-pied">Démo indépendante, non affiliée à l'École Cube · données fictives</p>
    </div>
  );
}
