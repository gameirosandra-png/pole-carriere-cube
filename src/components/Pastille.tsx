import type { Statut } from "../types";
import { libelleStatut } from "../lib";

/** Pastille de statut : la couleur porte le sens, le libellé reste toujours visible. */
export function Pastille({ statut }: { statut: Statut }) {
  return (
    <span className={`pastille s-${statut}`}>
      <span className="pastille-point" aria-hidden="true" />
      {libelleStatut(statut)}
    </span>
  );
}
