import { useState } from "react";
import type { Apprenant, Entreprise, Note, Statut } from "../types";
import { STATUTS, changerStatut, estInsere, raisonRelance } from "../regles";
import { aujourdhui, formatDate } from "../dates";
import { nouvelId } from "../store";
import { Pastille } from "./Pastille";
import { Panneau } from "./Panneau";
import { ChecklistDossier } from "./ChecklistDossier";
import { cocherEtape } from "../dossier";
import { PreparationRdv } from "./PreparationRdv";
import { AtelierCV } from "./ateliers/AtelierCV";
import { AtelierPortfolio } from "./ateliers/AtelierPortfolio";
import { AtelierSalaire } from "./ateliers/AtelierSalaire";
import { AtelierConvaincre } from "./ateliers/AtelierConvaincre";
import { OngletFicheCandidat } from "./FicheCandidat";
import { Progression } from "./Progression";
import { enregistrerPoint } from "../accompagnement/progression";

type Onglet = "suivi" | "cv" | "portfolio" | "salaire" | "convaincre" | "candidat";

const ONGLETS: { id: Onglet; libelle: string }[] = [
  { id: "suivi", libelle: "Suivi" },
  { id: "cv", libelle: "CV" },
  { id: "portfolio", libelle: "Portfolio" },
  { id: "salaire", libelle: "Salaire" },
  { id: "convaincre", libelle: "Convaincre" },
  { id: "candidat", libelle: "Fiche candidat" },
];

interface Props {
  apprenant: Apprenant;
  entreprises: Entreprise[];
  maj: (f: (a: Apprenant) => Apprenant) => void;
  supprimer: () => void;
  supprimerNote: (noteId: string) => void;
  fermer: () => void;
}

export function FicheApprenant({ apprenant: a, entreprises, maj, supprimer, supprimerNote, fermer }: Props) {
  const [note, setNote] = useState("");
  const [onglet, setOnglet] = useState<Onglet>("suivi");

  // Les ateliers notés (CV, simulation) relèvent le score du jour pour la courbe de progression.
  const majNote = (f: (a: Apprenant) => Apprenant) => maj((x) => enregistrerPoint(f(x)));

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

      <div className="onglets" role="tablist" aria-label="Accompagnement de l'apprenant">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            role="tab"
            id={`onglet-${o.id}`}
            aria-selected={onglet === o.id}
            aria-controls={`panneau-${o.id}`}
            className={onglet === o.id ? "onglet actif" : "onglet"}
            onClick={() => setOnglet(o.id)}
          >
            {o.libelle}
          </button>
        ))}
      </div>

      {onglet === "cv" && (
        <div role="tabpanel" id="panneau-cv" aria-labelledby="onglet-cv">
          <AtelierCV apprenant={a} maj={majNote} />
        </div>
      )}
      {onglet === "portfolio" && (
        <div role="tabpanel" id="panneau-portfolio" aria-labelledby="onglet-portfolio">
          <AtelierPortfolio apprenant={a} maj={maj} />
        </div>
      )}
      {onglet === "salaire" && (
        <div role="tabpanel" id="panneau-salaire" aria-labelledby="onglet-salaire">
          <AtelierSalaire apprenant={a} maj={maj} />
        </div>
      )}
      {onglet === "convaincre" && (
        <div role="tabpanel" id="panneau-convaincre" aria-labelledby="onglet-convaincre">
          <AtelierConvaincre apprenant={a} maj={majNote} />
        </div>
      )}

      {onglet === "candidat" && (
        <div role="tabpanel" id="panneau-candidat" aria-labelledby="onglet-candidat">
          <OngletFicheCandidat apprenant={a} />
        </div>
      )}

      {onglet === "suivi" && (
        <div role="tabpanel" id="panneau-suivi" aria-labelledby="onglet-suivi">
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

            <label className="champ">
              <span>Parcours avant la formation</span>
              <input
                value={a.parcoursAvant ?? ""}
                placeholder="Ex. 8 ans dans la logistique"
                onChange={(e) => maj((x) => ({ ...x, parcoursAvant: e.target.value }))}
              />
            </label>
            <label className="champ">
              <span>Années d'expérience avant</span>
              <input
                type="number"
                min={0}
                max={45}
                value={a.anneesExperience ?? ""}
                onChange={(e) =>
                  maj((x) => ({ ...x, anneesExperience: e.target.value === "" ? undefined : Number(e.target.value) }))
                }
              />
            </label>

            {estInsere(a) && (
              <>
                <label className="champ">
                  <span>{a.statut === "freelance" ? "Premier client" : "Entreprise"}</span>
                  <input
                    value={a.entreprise ?? ""}
                    onChange={(e) => maj((x) => ({ ...x, entreprise: e.target.value }))}
                  />
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
            <button
              className="bouton bouton-discret"
              onClick={() => maj((x) => ({ ...x, dernierContact: aujourdhui() }))}
            >
              Noter un contact aujourd'hui
            </button>
          </div>
          <p className="secondaire">Dernier contact : {formatDate(a.dernierContact)}</p>

          <h3 className="fiche-titre">Préparer le rendez-vous</h3>
          <PreparationRdv key={a.id} apprenant={a} entreprises={entreprises} />

          <h3 className="fiche-titre">Progression</h3>
          <Progression apprenant={a} />

          <h3 className="fiche-titre">Parcours d'accompagnement</h3>
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
                <NoteSuivi
                  key={n.id}
                  note={n}
                  modifier={(texte) =>
                    maj((x) => ({ ...x, notes: x.notes.map((y) => (y.id === n.id ? { ...y, texte } : y)) }))
                  }
                  supprimer={() => supprimerNote(n.id)}
                />
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="zone-suppression">
        <button className="bouton-danger" onClick={supprimer}>
          Supprimer la fiche
        </button>
      </div>
    </Panneau>
  );
}

/** Une note de suivi, modifiable sur place et supprimable (avec annulation). */
function NoteSuivi({
  note,
  modifier,
  supprimer,
}: {
  note: Note;
  modifier: (texte: string) => void;
  supprimer: () => void;
}) {
  const [edition, setEdition] = useState(false);
  const [texte, setTexte] = useState(note.texte);

  return (
    <li>
      <time dateTime={note.date}>{formatDate(note.date)}</time>
      {edition ? (
        <div className="note-edition">
          <textarea
            rows={3}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            aria-label="Modifier la note"
            autoFocus
          />
          <div className="actions">
            <button
              className="bouton"
              disabled={!texte.trim()}
              onClick={() => {
                modifier(texte.trim());
                setEdition(false);
              }}
            >
              Enregistrer
            </button>
            <button
              className="bouton bouton-discret"
              onClick={() => {
                setTexte(note.texte);
                setEdition(false);
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p>{note.texte}</p>
          <div className="note-actions">
            <button className="bouton-texte" onClick={() => setEdition(true)}>
              Modifier
            </button>
            <button className="bouton-texte texte-alerte" onClick={supprimer}>
              Supprimer
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
