import { useCallback, useEffect, useState } from "react";
import { useDonnees } from "./store";
import { TableauDeBord } from "./components/TableauDeBord";
import { Apprenants } from "./components/Apprenants";
import { Entreprises } from "./components/Entreprises";
import { EspaceApprenant } from "./components/EspaceApprenant";
import { FicheApprenant } from "./components/FicheApprenant";
import { Rapport } from "./components/Rapport";
import { VisiteGuidee, type VueVisite } from "./components/VisiteGuidee";

type Vue = VueVisite;

const VUES: { id: Vue; libelle: string }[] = [
  { id: "tdb", libelle: "Tableau de bord" },
  { id: "apprenants", libelle: "Apprenants" },
  { id: "entreprises", libelle: "Entreprises & offres" },
  { id: "espace", libelle: "Espace apprenant" },
  { id: "rapport", libelle: "Rapport" },
];

const CLE_VISITE = "pole-carriere-cube:visite-vue";

const visiteDejaVue = () => {
  try {
    return localStorage.getItem(CLE_VISITE) === "1";
  } catch {
    return true; // stockage indisponible : on ne force pas la visite
  }
};

export default function App() {
  const {
    donnees,
    setDonnees,
    majApprenant,
    ajouterApprenant,
    supprimerApprenant,
    modifierAvecAnnulation,
    annulation,
    fermerAnnulation,
    reinitialiser,
  } = useDonnees();
  const [vue, setVue] = useState<Vue>("tdb");
  const [ficheId, setFicheId] = useState<string | null>(null);
  const [visite, setVisite] = useState(false);

  // Au premier passage, la visite guidée démarre seule.
  useEffect(() => {
    if (!visiteDejaVue()) setVisite(true);
  }, []);

  const fermer = useCallback(() => setFicheId(null), []);
  const lancerVisite = useCallback(() => {
    setFicheId(null);
    setVisite(true);
  }, []);
  const terminerVisite = useCallback(() => {
    setVisite(false);
    setVue("tdb");
    window.scrollTo({ top: 0 });
    try {
      localStorage.setItem(CLE_VISITE, "1");
    } catch {
      /* rien à faire */
    }
  }, []);

  const ouverte = donnees.apprenants.find((a) => a.id === ficheId);

  return (
    <div className="app">
      <aside className="barre">
        <div className="marque">
          <img className="marque-logo" src="/logo.svg" alt="" width="38" height="38" />
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
          <button className="bouton-visite" onClick={lancerVisite}>
            Visite guidée (1 min)
          </button>
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
        {vue === "tdb" && (
          <TableauDeBord apprenants={donnees.apprenants} ouvrir={setFicheId} lancerVisite={lancerVisite} />
        )}
        {vue === "apprenants" && (
          <Apprenants apprenants={donnees.apprenants} ouvrir={setFicheId} ajouter={ajouterApprenant} />
        )}
        {vue === "entreprises" && (
          <Entreprises
            donnees={donnees}
            setDonnees={setDonnees}
            modifierAvecAnnulation={modifierAvecAnnulation}
            ouvrir={setFicheId}
          />
        )}
        {vue === "espace" && (
          <EspaceApprenant apprenants={donnees.apprenants} entreprises={donnees.entreprises} maj={majApprenant} />
        )}
        {vue === "rapport" && <Rapport apprenants={donnees.apprenants} />}
      </main>

      {ouverte && (
        <FicheApprenant
          apprenant={ouverte}
          entreprises={donnees.entreprises}
          maj={(f) => majApprenant(ouverte.id, f)}
          supprimer={() => {
            setFicheId(null);
            supprimerApprenant(ouverte.id);
          }}
          supprimerNote={(noteId) =>
            modifierAvecAnnulation("Note supprimée", (d) => ({
              ...d,
              apprenants: d.apprenants.map((a) =>
                a.id === ouverte.id ? { ...a, notes: a.notes.filter((n) => n.id !== noteId) } : a,
              ),
            }))
          }
          fermer={fermer}
        />
      )}

      {annulation && (
        <div className="toast" role="status">
          <span>{annulation.message}</span>
          <button className="toast-annuler" onClick={annulation.annuler}>
            Annuler
          </button>
          <button className="toast-fermer" onClick={fermerAnnulation} aria-label="Fermer le message">
            ×
          </button>
        </div>
      )}

      {visite && <VisiteGuidee changerVue={setVue} terminer={terminerVisite} />}
    </div>
  );
}
