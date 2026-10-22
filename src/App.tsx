import { useCallback, useState } from "react";
import { useDonnees } from "./store";
import { TableauDeBord } from "./components/TableauDeBord";
import { Apprenants } from "./components/Apprenants";
import { Entreprises } from "./components/Entreprises";
import { EspaceApprenant } from "./components/EspaceApprenant";
import { FicheApprenant } from "./components/FicheApprenant";

type Vue = "tdb" | "apprenants" | "entreprises" | "espace";

const VUES: { id: Vue; libelle: string }[] = [
  { id: "tdb", libelle: "Tableau de bord" },
  { id: "apprenants", libelle: "Apprenants" },
  { id: "entreprises", libelle: "Entreprises & offres" },
  { id: "espace", libelle: "Espace apprenant" },
];

export default function App() {
  const { donnees, setDonnees, majApprenant, ajouterApprenant, supprimerApprenant, reinitialiser } = useDonnees();
  const [vue, setVue] = useState<Vue>("tdb");
  const [ficheId, setFicheId] = useState<string | null>(null);

  const fermer = useCallback(() => setFicheId(null), []);
  const ouverte = donnees.apprenants.find((a) => a.id === ficheId);

  return (
    <div className="app">
      <aside className="barre">
        <div className="marque">
          <span className="marque-logo" aria-hidden="true">
            PC
          </span>
          <span>
            Pôle carrière
            <small>pour l'École Cube · MVP</small>
          </span>
        </div>
        <nav aria-label="Navigation principale">
          {VUES.map((v) => (
            <button
              key={v.id}
              className={vue === v.id ? "nav-lien actif" : "nav-lien"}
              aria-current={vue === v.id ? "page" : undefined}
              onClick={() => setVue(v.id)}
            >
              {v.libelle}
            </button>
          ))}
        </nav>
        <div className="barre-pied">
          <p>Démo indépendante, non affiliée à l'École Cube. Données fictives, enregistrées dans votre navigateur.</p>
          <button className="bouton-texte" onClick={() => confirm("Revenir aux données de démo ?") && reinitialiser()}>
            Réinitialiser la démo
          </button>
          <a className="bouton-texte" href="https://github.com/gameirosandra-png/pole-carriere-cube">
            Voir le code sur GitHub
          </a>
        </div>
      </aside>

      <main className="contenu">
        {vue === "tdb" && <TableauDeBord apprenants={donnees.apprenants} ouvrir={setFicheId} />}
        {vue === "apprenants" && (
          <Apprenants apprenants={donnees.apprenants} ouvrir={setFicheId} ajouter={ajouterApprenant} />
        )}
        {vue === "entreprises" && <Entreprises donnees={donnees} setDonnees={setDonnees} ouvrir={setFicheId} />}
        {vue === "espace" && (
          <EspaceApprenant apprenants={donnees.apprenants} entreprises={donnees.entreprises} maj={majApprenant} />
        )}
      </main>

      {ouverte && (
        <FicheApprenant
          apprenant={ouverte}
          entreprises={donnees.entreprises}
          maj={(f) => majApprenant(ouverte.id, f)}
          supprimer={() => {
            supprimerApprenant(ouverte.id);
            setFicheId(null);
          }}
          fermer={fermer}
        />
      )}
    </div>
  );
}
