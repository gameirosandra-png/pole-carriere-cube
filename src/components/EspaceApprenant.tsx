import { useState, type FormEvent } from "react";
import type { Apprenant, Entreprise, Statut } from "../types";
import { STATUTS, changerStatut, estInsere } from "../regles";
import { aujourdhui, formatDate } from "../dates";
import { nouvelId } from "../store";
import { Pastille } from "./Pastille";

interface Props {
  apprenants: Apprenant[];
  entreprises: Entreprise[];
  maj: (id: string, f: (a: Apprenant) => Apprenant) => void;
}

/**
 * Ce que verrait un apprenant via son lien personnel : sa situation,
 * sa prochaine étape, les offres proposées, et un formulaire pour dire où il en est.
 * Chaque mise à jour alimente directement le suivi de l'équipe.
 */
export function EspaceApprenant({ apprenants, entreprises, maj }: Props) {
  const candidats = apprenants.filter((a) => a.statut !== "formation");
  const [id, setId] = useState(candidats[0]?.id ?? "");
  const a = apprenants.find((x) => x.id === id);

  return (
    <section aria-labelledby="titre-espace">
      <header className="entete-page">
        <h1 id="titre-espace">Espace apprenant</h1>
        <p className="sous-titre">
          Démo de la page que chaque apprenant recevrait par un lien personnel. Ses réponses mettent à jour le suivi
          de l'équipe sans relance manuelle.
        </p>
      </header>

      <label className="champ choix-demo">
        <span>Voir la page de</span>
        <select value={id} onChange={(e) => setId(e.target.value)}>
          {candidats.map((x) => (
            <option key={x.id} value={x.id}>
              {x.prenom} {x.nom}
            </option>
          ))}
        </select>
      </label>

      {a ? (
        <PageApprenant key={a.id} apprenant={a} entreprises={entreprises} maj={(f) => maj(a.id, f)} />
      ) : (
        <p className="vide">Aucun apprenant sorti de formation pour l'instant.</p>
      )}
    </section>
  );
}

function PageApprenant({
  apprenant: a,
  entreprises,
  maj,
}: {
  apprenant: Apprenant;
  entreprises: Entreprise[];
  maj: (f: (a: Apprenant) => Apprenant) => void;
}) {
  const [statut, setStatut] = useState<Statut>(a.statut);
  const [entreprise, setEntreprise] = useState(a.entreprise ?? "");
  const [message, setMessage] = useState("");
  const [envoye, setEnvoye] = useState(false);

  const offres = entreprises.flatMap((e) =>
    e.offres.filter((o) => o.candidats.includes(a.id)).map((o) => ({ entreprise: e.nom, offre: o })),
  );

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    const today = aujourdhui();
    const insere = statut === "poste" || statut === "freelance";
    maj((x) => {
      const suivant = changerStatut(x, statut, today);
      let texte = `Mise à jour par l'apprenant : ${STATUTS.find((s) => s.id === statut)?.libelle}`;
      if (insere && entreprise.trim()) texte += ` chez ${entreprise.trim()}`;
      if (message.trim()) texte += `. « ${message.trim()} »`;
      return {
        ...suivant,
        dernierContact: today,
        entreprise: insere ? entreprise.trim() || suivant.entreprise : undefined,
        notes: [{ id: nouvelId(), date: today, texte }, ...suivant.notes],
      };
    });
    setMessage("");
    setEnvoye(true);
  };

  return (
    <div className="espace">
      <div className="espace-carte">
        <h2>Bonjour {a.prenom}</h2>
        <p>
          Ta situation enregistrée : <Pastille statut={a.statut} />
          {estInsere(a) && a.entreprise && <> chez {a.entreprise}</>}
        </p>
        {a.prochaineAction ? (
          <p>
            Ta prochaine étape avec le pôle carrière : <strong>{a.prochaineAction.libelle}</strong>, le{" "}
            {formatDate(a.prochaineAction.date)}
          </p>
        ) : (
          <p>Aucun rendez-vous prévu. Réponds ci-dessous si tu as besoin d'un coup de pouce.</p>
        )}

        <h3 className="fiche-titre">Offres qu'on t'a proposées</h3>
        {offres.length === 0 ? (
          <p className="vide">Pas encore d'offre. Le pôle carrière t'en proposera selon ton projet.</p>
        ) : (
          <ul className="liste-simple">
            {offres.map(({ entreprise: nomEntreprise, offre }) => (
              <li key={offre.id}>
                {offre.titre} chez {nomEntreprise} ({offre.contrat}){!offre.ouverte && " · pourvue"}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form className="espace-carte" onSubmit={envoyer}>
        <h2>Où en es-tu ?</h2>
        <fieldset className="choix-statut">
          <legend className="secondaire">Ta situation aujourd'hui</legend>
          {STATUTS.filter((s) => s.id !== "formation").map((s) => (
            <label key={s.id} className="case">
              <input
                type="radio"
                name="statut"
                value={s.id}
                checked={statut === s.id}
                onChange={() => {
                  setStatut(s.id);
                  setEnvoye(false);
                }}
              />
              {s.libelle}
            </label>
          ))}
        </fieldset>

        {(statut === "poste" || statut === "freelance") && (
          <label className="champ">
            <span>{statut === "freelance" ? "Ton premier client" : "Ton entreprise"}</span>
            <input value={entreprise} onChange={(e) => setEntreprise(e.target.value)} />
          </label>
        )}

        <label className="champ">
          <span>Un message pour le pôle carrière (facultatif)</span>
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>

        <button className="bouton" type="submit">
          Envoyer ma mise à jour
        </button>
        {envoye && (
          <p className="texte-succes" role="status">
            Mise à jour envoyée. Elle apparaît dans ta fiche côté équipe.
          </p>
        )}
      </form>
    </div>
  );
}
