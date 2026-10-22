import type { Apprenant } from "../types";
import { aujourdhui, formatDate, joursEntre } from "../dates";
import { questionsEnAttente } from "../accompagnement/questionnaire";

/** Tableau de bord : les questions des apprenants qui attendent une réponse. */
export function QuestionsATraiter({ apprenants, ouvrir }: { apprenants: Apprenant[]; ouvrir: (id: string) => void }) {
  const attente = questionsEnAttente(apprenants);
  const today = aujourdhui();

  return (
    <section className="questions-a-traiter" aria-labelledby="titre-questions">
      <h2 className="titre-section" id="titre-questions">
        Questions des apprenants {attente.length > 0 && <span className="compteur">{attente.length}</span>}
      </h2>
      {attente.length === 0 ? (
        <p className="vide">Aucune question en attente : tout le monde a sa réponse.</p>
      ) : (
        <ul className="relances">
          {attente.map(({ apprenant: a, question: q }) => {
            const age = joursEntre(q.date, today);
            return (
              <li key={q.id}>
                <button className="relance" onClick={() => ouvrir(a.id)}>
                  <span className="relance-nom">
                    {a.prenom} {a.nom}
                  </span>
                  <span className={age >= 2 ? "relance-raison" : "secondaire"}>
                    {age === 0 ? "Aujourd'hui" : age === 1 ? "Hier" : `Le ${formatDate(q.date)}`}
                  </span>
                  <span className="relance-action">« {q.texte} »</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
