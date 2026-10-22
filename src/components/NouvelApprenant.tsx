import { useState, type FormEvent } from "react";
import type { Apprenant } from "../types";
import { aujourdhui, formatMois } from "../dates";
import { nouvelId } from "../store";
import { Panneau } from "./Panneau";

interface Props {
  promos: string[];
  ajouter: (a: Apprenant) => void;
  fermer: () => void;
}

/** Formulaire d'ajout d'un apprenant. Le statut initial dépend de la date de fin de formation. */
export function NouvelApprenant({ promos, ajouter, fermer }: Props) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [finFormation, setFinFormation] = useState("");
  const [promo, setPromo] = useState("");
  const [posteVise, setPosteVise] = useState("Product Builder");
  const [erreur, setErreur] = useState<string | null>(null);

  const enregistrer = (e: FormEvent) => {
    e.preventDefault();
    if (!prenom.trim() || !nom.trim() || !finFormation) {
      setErreur("Renseignez le prénom, le nom et la date de fin de formation.");
      return;
    }
    const today = aujourdhui();
    ajouter({
      id: nouvelId(),
      prenom: prenom.trim(),
      nom: nom.trim(),
      promo: promo.trim() || `Promo ${formatMois(finFormation)}`,
      finFormation,
      statut: finFormation > today ? "formation" : "recherche",
      posteVise: posteVise.trim(),
      dernierContact: today,
      notes: [],
    });
    fermer();
  };

  return (
    <Panneau titreId="titre-nouvel-apprenant" fermer={fermer}>
      <header className="fiche-entete">
        <h2 id="titre-nouvel-apprenant">Ajouter un apprenant</h2>
        <button className="bouton-fermer" onClick={fermer} aria-label="Fermer sans enregistrer">
          ×
        </button>
      </header>

      <form className="formulaire" onSubmit={enregistrer} noValidate>
        <div className="grille-champs">
          <label className="champ">
            <span>Prénom</span>
            <input value={prenom} onChange={(e) => setPrenom(e.target.value)} autoComplete="off" required />
          </label>
          <label className="champ">
            <span>Nom</span>
            <input value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="off" required />
          </label>
          <label className="champ">
            <span>Fin de formation</span>
            <input type="date" value={finFormation} onChange={(e) => setFinFormation(e.target.value)} required />
          </label>
          <label className="champ">
            <span>Promo</span>
            <input
              list="liste-promos"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="Déduite de la date si vide"
            />
            <datalist id="liste-promos">
              {promos.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </label>
          <label className="champ">
            <span>Poste visé</span>
            <input value={posteVise} onChange={(e) => setPosteVise(e.target.value)} />
          </label>
        </div>

        {erreur && (
          <p className="texte-alerte" role="alert">
            {erreur}
          </p>
        )}

        <div className="actions">
          <button className="bouton" type="submit">
            Ajouter l'apprenant
          </button>
          <button className="bouton bouton-discret" type="button" onClick={fermer}>
            Annuler
          </button>
        </div>
      </form>
    </Panneau>
  );
}
