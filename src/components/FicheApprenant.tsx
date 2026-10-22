import { useState } from "react";
import type { Apprenant, Entreprise, Statut } from "../types";
import { STATUTS, changerStatut, estInsere, raisonRelance } from "../regles";
import { aujourdhui, formatDate } from "../dates";
import { nouvelId } from "../store";
import { Pastille } from "./Pastille";
import { Panneau } from "./Panneau";
import { ChecklistDossier } from "./ChecklistDossier";
import { cocherEtape } from "../dossier";

interface Props {
  apprenant: Apprenant;
  entreprises: Entreprise[];
  maj: (f: (a: Apprenant) => Apprenant) => void;
  supprimer: () => void;
  fermer: () => void;
}

export function FicheApprenant({ apprenant: a, entreprises, maj, supprimer, fermer }: Props) {
  const [note, setNote] = useState("");

  const majStatut = (statut: Statut) => maj((x) => changerStatut(x, statut));

  const ajouterNote = () => {
    const texte = note.trim();
    if (!texte) return;
    maj((x) => ({
      ...x,
      dernierContact: aujourdhui(),
      notes: [{ id: nouvelId(), date: aujourdhui(), texte }, ...x.notes],
    }));
    setNote("");
  };

  const misesEnRelation = entreprises.flatMap((e) =>
    e.offres.filter((o) => o.candidats.includes(a.id)).map((o) => ({ entreprise: e.nom, offre: o })),
  );

  const relance = raisonRelance(a);

  return (
    <Panneau titreId="fiche-nom" fermer={fermer}>
      <header className="fiche-entete">
        <div>
          <h2 id="fiche-nom">
            {a.prenom} {a.nom}
          </h2>
          <p className="secondaire">
            {a.promo} · fin de formation le {formatDate(a.finFormation)}
          </p>
        </div>
        <button className="bouton-fermer" onClick={fermer} aria-label="Fermer la fiche">
          ×
        </button>
      </header>

      <div className="fiche-statut">
        <Pastille statut={a.statut} />
        {relance && <span className="texte-alerte">{relance}</span>}
      </div>

      <div className="grille-champs">
        <label className="champ">
          <span>Statut</span>
          <select value={a.statut} onChange={(e) => majStatut(e.target.value as Statut)}>
            {STATUTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.libelle}
              </option>
            ))}
          </select>
        </label>
        <label className="champ">
          <span>Poste visé</span>
          <input value={a.posteVise} onChange={(e) => maj((x) => ({ ...x, posteVise: e.target.value }))} />
        </label>

        {estInsere(a) && (
          <>
            <label className="champ">
              <span>{a.statut === "freelance" ? "Premier client" : "Entreprise"}</span>
              <input value={a.entreprise ?? ""} onChange={(e) => maj((x) => ({ ...x, entreprise: e.target.value }))} />
            </label>
            <label className="champ">
              <span>Date d'insertion</span>
              <input
                type="date"
                value={a.dateInsertion ?? ""}
                onChange={(e) => maj((x) => ({ ...x, dateInsertion: e.target.value }))}
              />
            </label>
          </>
        )}
      </div>

      <h3 className="fiche-titre">Prochaine action</h3>
      <div className="grille-champs">
        <label className="champ">
          <span>Action</span>
          <input
            value={a.prochaineAction?.libelle ?? ""}
            placeholder="Ex. relecture du CV"
            onChange={(e) =>
              maj((x) => ({
                ...x,
                prochaineAction: { libelle: e.target.value, date: x.prochaineAction?.date ?? aujourdhui() },
              }))
            }
          />
        </label>
        <label className="champ">
          <span>Prévue le</span>
          <input
            type="date"
            value={a.prochaineAction?.date ?? ""}
            onChange={(e) =>
              maj((x) => ({
                ...x,
                prochaineAction: { libelle: x.prochaineAction?.libelle ?? "", date: e.target.value },
              }))
            }
          />
        </label>
      </div>
      <div className="actions">
        <button
          className="bouton"
          onClick={() => maj((x) => ({ ...x, prochaineAction: undefined, dernierContact: aujourdhui() }))}
          disabled={!a.prochaineAction}
        >
          Marquer l'action comme faite
        </button>
        <button className="bouton bouton-discret" onClick={() => maj((x) => ({ ...x, dernierContact: aujourdhui() }))}>
          Noter un contact aujourd'hui
        </button>
      </div>
      <p className="secondaire">Dernier contact : {formatDate(a.dernierContact)}</p>

      <h3 className="fiche-titre">Dossier de candidature</h3>
      <ChecklistDossier apprenant={a} mode="equipe" cocher={(id, faite) => maj((x) => cocherEtape(x, id, faite))} />

      <h3 className="fiche-titre">Mises en relation</h3>
      {misesEnRelation.length === 0 ? (
        <p className="vide">Aucune offre proposée. Proposez-en une depuis l'onglet Entreprises & offres.</p>
      ) : (
        <ul className="liste-simple">
          {misesEnRelation.map(({ entreprise, offre }) => (
            <li key={offre.id}>
              <strong>{offre.titre}</strong> chez {entreprise} · {offre.contrat}
              {!offre.ouverte && <span className="secondaire"> (pourvue)</span>}
            </li>
          ))}
        </ul>
      )}

      <h3 className="fiche-titre">Notes de suivi</h3>
      <div className="note-saisie">
        <label className="champ">
          <span>Nouvelle note</span>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ce qui s'est dit au dernier échange"
          />
        </label>
        <button className="bouton" onClick={ajouterNote} disabled={!note.trim()}>
          Ajouter la note
        </button>
      </div>
      {a.notes.length === 0 ? (
        <p className="vide">Aucune note pour l'instant.</p>
      ) : (
        <ol className="notes">
          {a.notes.map((n) => (
            <li key={n.id}>
              <time dateTime={n.date}>{formatDate(n.date)}</time>
              <p>{n.texte}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="zone-suppression">
        <button
          className="bouton-danger"
          onClick={() => {
            if (confirm(`Supprimer définitivement la fiche de ${a.prenom} ${a.nom} ?`)) supprimer();
          }}
        >
          Supprimer la fiche
        </button>
      </div>
    </Panneau>
  );
}
