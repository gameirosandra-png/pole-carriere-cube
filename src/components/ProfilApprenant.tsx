import { useState } from "react";
import type { Apprenant, QuestionPole } from "../types";
import { formatDate } from "../dates";
import { libelleEtape } from "../dossier";
import { pointsAttention, repondreQuestion, resumeQuestionnaire } from "../accompagnement/questionnaire";

type Maj = (f: (a: Apprenant) => Apprenant) => void;

/** Dans la fiche : ce que l'apprenant a dit de lui dans le questionnaire. */
export function ProfilApprenant({ apprenant: a }: { apprenant: Apprenant }) {
  const q = a.questionnaire;
  if (!q) {
    return (
      <p className="vide">
        Questionnaire pas encore rempli. L'apprenant le trouve dans son espace : à lui demander avant la séance 1.
      </p>
    );
  }
  const attention = pointsAttention(q);
  return (
    <div className="profil">
      <p className="secondaire">Questionnaire rempli par l'apprenant · {formatDate(q.rempliLe)}</p>
      <dl className="profil-liste">
        {resumeQuestionnaire(q).map((l) => (
          <div key={l.libelle}>
            <dt>{l.libelle}</dt>
            <dd>{l.valeur}</dd>
          </div>
        ))}
      </dl>
      {attention.length > 0 && (
        <ul className="points-attention" aria-label="Points d'attention">
          {attention.map((p) => (
            <li key={p.texte}>
              {p.texte}
              {p.seance && <span className="secondaire"> ({libelleEtape(p.seance)})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Dans la fiche : les questions posées par l'apprenant, avec réponse sur place. */
export function QuestionsApprenant({ apprenant: a, maj }: { apprenant: Apprenant; maj: Maj }) {
  const questions = [...(a.questions ?? [])].reverse();
  if (!questions.length) return <p className="vide">Aucune question posée depuis son espace.</p>;
  return (
    <ul className="fil-questions">
      {questions.map((q) => (
        <QuestionAvecReponse key={q.id} question={q} repondre={(t) => maj((x) => repondreQuestion(x, q.id, t))} />
      ))}
    </ul>
  );
}

function QuestionAvecReponse({ question: q, repondre }: { question: QuestionPole; repondre: (t: string) => void }) {
  const [texte, setTexte] = useState("");
  return (
    <li>
      <p className="fil-question">
        <span className="secondaire">{formatDate(q.date)} · </span>
        {q.texte}
      </p>
      {q.reponse ? (
        <p className="fil-reponse">
          <strong>Réponse du {formatDate(q.reponduLe ?? q.date)} :</strong> {q.reponse}
        </p>
      ) : (
        <form
          className="reponse-saisie"
          onSubmit={(e) => {
            e.preventDefault();
            if (texte.trim()) repondre(texte);
          }}
        >
          <label className="champ">
            <span className="visuellement-cache">Votre réponse</span>
            <textarea rows={2} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Votre réponse" />
          </label>
          <button className="bouton" type="submit" disabled={!texte.trim()}>
            Répondre
          </button>
        </form>
      )}
    </li>
  );
}
