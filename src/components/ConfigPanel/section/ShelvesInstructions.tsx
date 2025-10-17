import React from "react";

interface ShelvesInstructionsProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

const ShelvesInstructions: React.FC<ShelvesInstructionsProps> = ({
  onClose,
  showCloseButton = false,
}) => {
  return (
    <div className="card border-primary">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h6 className="mb-0">
          <span className="me-2">🎯</span>
          Comment configurer les étagères
        </h6>
        {showCloseButton && onClose && (
          <button
            type="button"
            className="btn btn-sm btn-outline-light"
            onClick={onClose}
          >
            ✕
          </button>
        )}
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <h6 className="text-primary">📋 Étapes :</h6>
            <ol className="small">
              <li className="mb-2">
                <strong>Regardez le modèle 3D</strong>
                <br />
                <span className="text-muted">
                  Les colonnes sont maintenant surlignées en bleu clair
                </span>
              </li>
              <li className="mb-2">
                <strong>Cliquez sur une colonne</strong>
                <br />
                <span className="text-muted">
                  La colonne sélectionnée devient bleue avec contour doré
                </span>
              </li>
              <li className="mb-2">
                <strong>Configurez les étagères</strong>
                <br />
                <span className="text-muted">
                  Le panneau affichera les options de configuration
                </span>
              </li>
              <li className="mb-2">
                <strong>Ajustez les positions</strong>
                <br />
                <span className="text-muted">
                  Utilisez les sliders ou saisissez les valeurs
                </span>
              </li>
            </ol>
          </div>
          <div className="col-md-6">
            <h6 className="text-success">✨ Astuces :</h6>
            <ul className="small">
              <li className="mb-2">
                <strong>Survol des colonnes :</strong>
                <br />
                <span className="text-muted">
                  Passez la souris pour voir les informations
                </span>
              </li>
              <li className="mb-2">
                <strong>Espacement minimum :</strong>
                <br />
                <span className="text-muted">10cm entre chaque étagère</span>
              </li>
              <li className="mb-2">
                <strong>Thanh treo automatique :</strong>
                <br />
                <span className="text-muted">
                  Apparaît dans le plus grand espace libre (50cm)
                </span>
              </li>
              <li className="mb-2">
                <strong>Redistribution :</strong>
                <br />
                <span className="text-muted">
                  Bouton "⚖️" pour répartir uniformément
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-3 p-2 bg-light rounded">
          <small className="text-muted d-flex align-items-center">
            <span className="me-2">💡</span>
            <strong>Astuce :</strong> Les étagères apparaissent en temps réel
            dans le modèle 3D avec les informations de distance lorsque vous
            sélectionnez une colonne.
          </small>
        </div>
      </div>
    </div>
  );
};

export default ShelvesInstructions;
