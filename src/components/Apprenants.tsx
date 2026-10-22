import { useMemo, useState } from "react";
import type { Apprenant, Statut } from "../types";
import { STATUTS, formatDate, raisonRelance } from "../lib";
import { Pastille } from "./Pastille";

interface Props {
  apprenants: Apprenant[];
  ouvrir: (id: string) => void;
}

export function Apprenants({ apprenants, ouvrir }: Props) {
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState<Statut | "tous">("tous");
  const [promo, setPromo] = useState("toutes");
  const [seulementRelances, setSeulementRelances] = useState(false);

  const promos = useMemo(() => [...new Set(apprenants.map((a) => a.promo))], [apprenants]);

  const liste = apprenants.filter((a) => {
    const texte = `${a.prenom} ${a.nom} ${a.posteVise} ${a.entreprise ?? ""}`.toLowerCase();
    return (
      texte.includes(recherche.trim().toLowerCase()) &&
      (statut === "tous" || a.statut === statut) &&
      (promo === "toutes" || a.promo === promo) &&
      (!seulementRelances || raisonRelance(a) !== null)
    );
  });

  return (
    <section aria-labelledby="titre-apprenants">
      <header className="entete-page">
        <h1 id="titre-apprenants">Apprenants</h1>
        <p className="sous-titre">
          {liste.length} sur {apprenants.length} affichés
        </p>
      </header>

      <div className="filtres">
        <label className="champ champ-large">
          <span>Rechercher</span>
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Nom, poste visé, entreprise"
          />
        </label>
        <label className="champ">
          <span>Statut</span>
          <select value={statut} onChange={(e) => setStatut(e.target.value as Statut | "tous")}>
            <option value="tous">Tous</option>
            {STATUTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.libelle}
              </option>
            ))}
          </select>
        </label>
        <label className="champ">
          <span>Promo</span>
          <select value={promo} onChange={(e) => setPromo(e.target.value)}>
            <option value="toutes">Toutes</option>
            {promos.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="case">
          <input type="checkbox" checked={seulementRelances} onChange={(e) => setSeulementRelances(e.target.checked)} />
          À relancer uniquement
        </label>
      </div>

      {liste.length === 0 ? (
        <p className="vide">Aucun apprenant ne correspond. Élargissez les filtres.</p>
      ) : (
        <div className="tableau-defile">
          <table className="tableau">
            <thead>
              <tr>
                <th scope="col">Apprenant</th>
                <th scope="col">Statut</th>
                <th scope="col">Poste visé</th>
                <th scope="col">Dernier contact</th>
                <th scope="col">Prochaine action</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((a) => {
                const relance = raisonRelance(a);
                return (
                  <tr key={a.id} onClick={() => ouvrir(a.id)}>
                    <td>
                      <button className="lien-ligne" onClick={(e) => { e.stopPropagation(); ouvrir(a.id); }}>
                        {a.prenom} {a.nom}
                      </button>
                      <span className="secondaire">{a.promo}</span>
                    </td>
                    <td>
                      <Pastille statut={a.statut} />
                    </td>
                    <td>{a.entreprise ? `${a.posteVise} chez ${a.entreprise}` : a.posteVise}</td>
                    <td className={relance ? "texte-alerte" : ""}>
                      {formatDate(a.dernierContact)}
                      {relance && <span className="secondaire">{relance}</span>}
                    </td>
                    <td>
                      {a.prochaineAction ? (
                        <>
                          {a.prochaineAction.libelle}
                          <span className="secondaire">{formatDate(a.prochaineAction.date)}</span>
                        </>
                      ) : (
                        <span className="secondaire">Aucune</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
