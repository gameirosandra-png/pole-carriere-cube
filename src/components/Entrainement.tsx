import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Apprenant } from "../types";
import { formatChrono, genererPitch, tirerQuestions } from "../accompagnement/convaincre";

const DUREE = 120;
const NB_QUESTIONS = 5;

type Mode = "questions" | "pitch";

/** Entraînement à l'oral en plein écran : 5 questions tirées au hasard, 2 minutes chacune. */
export function Entrainement({ apprenant, fermer }: { apprenant: Apprenant; fermer: () => void }) {
  const [mode, setMode] = useState<Mode>("questions");
  const [questions, setQuestions] = useState(() => tirerQuestions(NB_QUESTIONS));
  const [index, setIndex] = useState(0);
  const [reste, setReste] = useState(DUREE);
  const [enCours, setEnCours] = useState(false);
  const [fini, setFini] = useState(false);
  const cadre = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cadre.current?.focus();
    // Échap ne ferme que l'entraînement, pas la fiche qui est dessous.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      fermer();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [fermer]);

  useEffect(() => {
    if (!enCours) return;
    const t = setInterval(() => setReste((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [enCours]);

  useEffect(() => {
    if (reste === 0) setEnCours(false);
  }, [reste]);

  const recommencer = (m: Mode) => {
    setMode(m);
    setQuestions(tirerQuestions(NB_QUESTIONS));
    setIndex(0);
    setReste(DUREE);
    setEnCours(false);
    setFini(false);
  };

  const suivante = () => {
    if (mode === "pitch" || index === questions.length - 1) {
      setEnCours(false);
      setFini(true);
      return;
    }
    setIndex(index + 1);
    setReste(DUREE);
    setEnCours(true);
  };

  const urgence = reste <= 15;

  return createPortal(
    <div className="entrainement" role="dialog" aria-modal="true" aria-labelledby="entrainement-titre">
      <div className="entrainement-cadre" ref={cadre} tabIndex={-1}>
        <header className="entrainement-tete">
          <div className="entrainement-modes" role="group" aria-label="Type d'entraînement">
            <button className={mode === "questions" ? "actif" : ""} onClick={() => recommencer("questions")}>
              Questions d'entretien
            </button>
            <button className={mode === "pitch" ? "actif" : ""} onClick={() => recommencer("pitch")}>
              Mon pitch
            </button>
          </div>
          <button className="entrainement-fermer" onClick={fermer} aria-label="Quitter l'entraînement">
            ×
          </button>
        </header>

        {fini ? (
          <div className="entrainement-corps">
            <p className="entrainement-compteur">Bravo {apprenant.prenom}</p>
            <h2 id="entrainement-titre" className="entrainement-question">
              {mode === "pitch" ? "Pitch répété." : `${questions.length} questions travaillées.`}
            </h2>
            <p className="entrainement-aide">
              Note ce qui a bloqué et rejoue la question la plus difficile. La régularité compte plus que la
              perfection.
            </p>
            <button className="bouton bouton-cta" onClick={() => recommencer(mode)}>
              Recommencer
            </button>
          </div>
        ) : (
          <div className="entrainement-corps">
            <p className="entrainement-compteur">
              {mode === "pitch" ? "Pitch de 2 minutes" : `Question ${index + 1} / ${questions.length}`}
            </p>
            {mode === "pitch" ? (
              <>
                <h2 id="entrainement-titre" className="visuellement-cache">
                  Répéter mon pitch
                </h2>
                <ol className="entrainement-pitch">
                  {genererPitch(apprenant).map((p) => (
                    <li key={p.titre}>
                      <strong>
                        {p.titre} · {p.duree}
                      </strong>
                      <span>{p.texte}</span>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <h2 id="entrainement-titre" className="entrainement-question">
                {questions[index]}
              </h2>
            )}
            <p
              className={urgence ? "entrainement-chrono urgence" : "entrainement-chrono"}
              aria-live={urgence ? "polite" : "off"}
            >
              {formatChrono(reste)}
            </p>
            <div className="entrainement-actions">
              {reste > 0 && (
                <button className="bouton bouton-cta" onClick={() => setEnCours(!enCours)}>
                  {enCours ? "Pause" : reste === DUREE ? "Lancer le chrono" : "Reprendre"}
                </button>
              )}
              <button className="bouton" onClick={suivante}>
                {mode === "pitch" || index === questions.length - 1 ? "Terminer" : "Question suivante"}
              </button>
            </div>
            <p className="entrainement-aide">
              {mode === "pitch"
                ? "Lis une fois, puis répète sans regarder. Vise 2 minutes, pas plus."
                : "Réponds à voix haute : situation, action, résultat. Arrête-toi avant la fin du chrono."}
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
