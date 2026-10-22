import { useState, type FormEvent } from "react";
import type { Apprenant, Inquietude, Questionnaire } from "../types";
import { formatDate } from "../dates";
import { nouvelId } from "../store";
import {
  CONTRATS_SOUHAITES,
  INQUIETUDES,
  TELETRAVAIL,
  appliquerQuestionnaire,
  poserQuestion,
} from "../accompagnement/questionnaire";

type Maj = (f: (a: Apprenant) => Apprenant) => void;

/** « Faisons connaissance » : 5 minutes avant la séance 1, pour démarrer sur du concret. */
export function QuestionnaireApprenant({ apprenant: a, maj }: { apprenant: Apprenant; maj: Maj }) {
  const q = a.questionnaire;
  const [ouvert, setOuvert] = useState(false);
  const [merci, setMerci] = useState(false);

  if (!ouvert) {
    return (
      <div className={q ? "espace-carte questionnaire-appel fait" : "espace-carte questionnaire-appel"}>
        <div>
          <h2>Faisons connaissance</h2>
          <p className="secondaire">
            {merci
              ? "Merci ! Tes réponses sont dans ta fiche : on s'en sert pour préparer ta prochaine séance."
              : q
                ? `Tu as déjà répondu (le ${formatDate(q.rempliLe)}). Mets tes réponses à jour si ta situation change.`
                : "5 minutes pour nous dire qui tu es et ce que tu cherches. Ta première séance démarrera directement sur l'essentiel."}
          </p>
        </div>
        <button className={q ? "bouton bouton-discret" : "bouton bouton-cta"} onClick={() => setOuvert(true)}>
          {q ? "Modifier mes réponses" : "Répondre au questionnaire"}
        </button>
      </div>
    );
  }

  return (
    <FormulaireQuestionnaire
      apprenant={a}
      annuler={() => setOuvert(false)}
      enregistrer={(reponses) => {
        maj((x) => appliquerQuestionnaire(x, reponses));
        setOuvert(false);
        setMerci(true);
      }}
    />
  );
}

function FormulaireQuestionnaire({
  apprenant: a,
  annuler,
  enregistrer,
}: {
  apprenant: Apprenant;
  annuler: () => void;
  enregistrer: (q: Omit<Questionnaire, "rempliLe">) => void;
}) {
  const q = a.questionnaire;
  const [r, setR] = useState<Omit<Questionnaire, "rempliLe">>({
    parcoursAvant: q?.parcoursAvant ?? a.parcoursAvant ?? "",
    anneesExperience: q?.anneesExperience ?? a.anneesExperience,
    posteVise: q?.posteVise ?? a.posteVise,
    secteurs: q?.secteurs ?? "",
    contrat: q?.contrat,
    zone: q?.zone,
    teletravail: q?.teletravail,
    disponibleLe: q?.disponibleLe ?? "",
    pointsForts: q?.pointsForts ?? "",
    inquietudes: q?.inquietudes ?? [],
    motivation: q?.motivation ?? a.accompagnement?.convaincre?.motivation ?? "",
  });
  const champ = <K extends keyof typeof r>(cle: K, valeur: (typeof r)[K]) => setR((x) => ({ ...x, [cle]: valeur }));
  const basculer = (id: Inquietude) =>
    champ(
      "inquietudes",
      (r.inquietudes ?? []).includes(id) ? (r.inquietudes ?? []).filter((x) => x !== id) : [...(r.inquietudes ?? []), id],
    );

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    enregistrer({ ...r, disponibleLe: r.disponibleLe || undefined });
  };

  return (
    <form className="espace-carte questionnaire" onSubmit={envoyer} aria-labelledby="titre-questionnaire">
      <h2 id="titre-questionnaire">Faisons connaissance</h2>
      <p className="secondaire">Il n'y a pas de bonne réponse : c'est pour t'accompagner au plus près.</p>

      <fieldset>
        <legend>1. Ton parcours</legend>
        <div className="grille-champs">
          <label className="champ">
            <span>Ce que tu faisais avant la formation</span>
            <input
              value={r.parcoursAvant}
              onChange={(e) => champ("parcoursAvant", e.target.value)}
              placeholder="Ex. 8 ans dans la logistique, dont 3 comme chef d'équipe"
            />
          </label>
          <label className="champ">
            <span>Pendant combien d'années ?</span>
            <input
              type="number"
              min={0}
              max={45}
              value={r.anneesExperience ?? ""}
              onChange={(e) => champ("anneesExperience", e.target.value === "" ? undefined : Number(e.target.value))}
            />
          </label>
          <label className="champ champ-large">
            <span>Ce que tu fais bien, d'après toi ou tes collègues</span>
            <input
              value={r.pointsForts}
              onChange={(e) => champ("pointsForts", e.target.value)}
              placeholder="Ex. organiser, expliquer, résoudre les problèmes"
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>2. Ce que tu cherches</legend>
        <div className="grille-champs">
          <label className="champ">
            <span>Le poste que tu vises</span>
            <input value={r.posteVise} onChange={(e) => champ("posteVise", e.target.value)} />
          </label>
          <label className="champ">
            <span>Les secteurs qui t'attirent</span>
            <input
              value={r.secteurs}
              onChange={(e) => champ("secteurs", e.target.value)}
              placeholder="Ex. santé, retail, associatif"
            />
          </label>
        </div>
        <div className="choix-ligne" role="radiogroup" aria-label="Type de contrat">
          <span className="choix-titre">Contrat</span>
          {CONTRATS_SOUHAITES.map((c) => (
            <label key={c.id} className="pastille-choix">
              <input type="radio" name="contrat" checked={r.contrat === c.id} onChange={() => champ("contrat", c.id)} />
              {c.libelle}
            </label>
          ))}
        </div>
        <div className="choix-ligne" role="radiogroup" aria-label="Où travailler">
          <span className="choix-titre">Où</span>
          <label className="pastille-choix">
            <input type="radio" name="zone" checked={r.zone === "idf"} onChange={() => champ("zone", "idf")} />
            Île-de-France
          </label>
          <label className="pastille-choix">
            <input type="radio" name="zone" checked={r.zone === "regions"} onChange={() => champ("zone", "regions")} />
            En régions
          </label>
        </div>
        <div className="choix-ligne" role="radiogroup" aria-label="Télétravail">
          <span className="choix-titre">Rythme</span>
          {TELETRAVAIL.map((t) => (
            <label key={t.id} className="pastille-choix">
              <input
                type="radio"
                name="teletravail"
                checked={r.teletravail === t.id}
                onChange={() => champ("teletravail", t.id)}
              />
              {t.libelle}
            </label>
          ))}
        </div>
        <label className="champ champ-court">
          <span>Disponible à partir du</span>
          <input type="date" value={r.disponibleLe} onChange={(e) => champ("disponibleLe", e.target.value)} />
        </label>
      </fieldset>

      <fieldset>
        <legend>3. Ce qui t'inquiète dans ta recherche</legend>
        <p className="secondaire">Coche tout ce qui te concerne : on commencera par là.</p>
        <div className="choix-ligne">
          {INQUIETUDES.map((i) => (
            <label key={i.id} className="pastille-choix">
              <input type="checkbox" checked={(r.inquietudes ?? []).includes(i.id)} onChange={() => basculer(i.id)} />
              {i.libelle}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>4. Ce qui te motive</legend>
        <label className="champ">
          <span>Dans quel type d'entreprise, et pour faire quoi ? (une phrase suffit)</span>
          <textarea
            rows={2}
            value={r.motivation}
            onChange={(e) => champ("motivation", e.target.value)}
            placeholder="Ex. dans la santé, pour simplifier le quotidien des soignants"
          />
        </label>
      </fieldset>

      <div className="actions">
        <button className="bouton" type="submit">
          Envoyer mes réponses
        </button>
        <button className="bouton bouton-discret" type="button" onClick={annuler}>
          Plus tard
        </button>
      </div>
    </form>
  );
}

/** Boîte à questions : l'apprenant écrit au pôle et retrouve les réponses ici. */
export function BoiteQuestions({ apprenant: a, maj }: { apprenant: Apprenant; maj: Maj }) {
  const [texte, setTexte] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const questions = [...(a.questions ?? [])].reverse();

  return (
    <div className="espace-carte boite-questions">
      <h2>Une question pour le pôle ?</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!texte.trim()) return;
          maj((x) => poserQuestion(x, texte, nouvelId()));
          setTexte("");
          setEnvoye(true);
        }}
      >
        <label className="champ">
          <span className="visuellement-cache">Ta question</span>
          <textarea
            rows={2}
            value={texte}
            onChange={(e) => {
              setTexte(e.target.value);
              setEnvoye(false);
            }}
            placeholder="CV, entretiens, salaire, ateliers… pose ta question ici."
          />
        </label>
        <button className="bouton" type="submit" disabled={!texte.trim()}>
          Envoyer ma question
        </button>
        {envoye && (
          <p className="texte-succes" role="status">
            Question envoyée. La réponse s'affichera ici.
          </p>
        )}
      </form>
      {questions.length > 0 && (
        <ul className="fil-questions">
          {questions.map((q) => (
            <li key={q.id}>
              <p className="fil-question">
                <span className="secondaire">{formatDate(q.date)} · </span>
                {q.texte}
              </p>
              {q.reponse ? (
                <p className="fil-reponse">
                  <strong>Le pôle :</strong> {q.reponse}
                </p>
              ) : (
                <p className="secondaire fil-attente">En attente de réponse</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
