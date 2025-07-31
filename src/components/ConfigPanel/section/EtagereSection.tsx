// src/components/ConfigPanel/section/EtagereSection.tsx (Simplified)
import React, { useState, useEffect } from "react";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";
import { useWardrobeShelves } from "@/hooks/useWardrobeShelves";

const EtagereSection: React.FC = () => {
  const { config, updateConfig } = useWardrobeConfig();
  const {
    getColumnShelves,
    initializeColumnShelves,
    addShelfToColumn,
    removeShelfFromColumn,
    moveShelf,
    redistributeShelvesEvenly,
    getShelfSpacingAnalysis,
    getShelfPositionRange,
    MIN_SHELF_SPACING,
  } = useWardrobeShelves();

  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

  // Check if étagère accordion is open
  const isEtagereOpen = config.accordionOpen === "collapseEtageres";

  // Update accordion state and selected column when section opens/closes
  useEffect(() => {
    if (isEtagereOpen) {
      // When étagère section opens, enable selection mode
      // Don't update selectedColumnId here to avoid loop
    } else {
      // When étagère section closes, clear selection
      setSelectedColumnId(null);
      // Don't call updateConfig here to avoid loop
    }
  }, [isEtagereOpen]); // Remove selectedColumnId and updateConfig from dependencies

  // Sync selectedColumnId with config (separate useEffect)
  useEffect(() => {
    if (selectedColumnId !== config.selectedColumnId) {
      updateConfig("selectedColumnId", selectedColumnId);
    }
  }, [selectedColumnId]); // Only depend on selectedColumnId

  // Handle accordion toggle
  const handleAccordionToggle = () => {
    const newState = isEtagereOpen ? "" : "collapseEtageres";
    updateConfig("accordionOpen", newState);
  };

  // Handle column click from 3D
  const handleColumnClick = (columnId: string) => {
    setSelectedColumnId(columnId);
    updateConfig("selectedColumnId", columnId);
  };

  // Get selected column data
  const getSelectedColumnData = () => {
    if (!selectedColumnId) return null;

    for (const [sectionKey, section] of Object.entries(
      config.wardrobeType.sections
    )) {
      if (!section) continue;

      const columnIndex = section.columns.findIndex(
        (col) => col.id === selectedColumnId
      );
      if (columnIndex !== -1) {
        return {
          sectionKey: sectionKey as SectionKey,
          sectionName:
            sectionKey === "sectionA"
              ? "A"
              : sectionKey === "sectionB"
              ? "B"
              : "C",
          column: section.columns[columnIndex],
          columnIndex,
        };
      }
    }
    return null;
  };

  const selectedColumnData = getSelectedColumnData();

  const renderColumnShelves = (
    sectionKey: SectionKey,
    sectionName: string,
    column: WardrobeColumn,
    columnIndex: number
  ) => {
    const columnShelves = getColumnShelves(sectionKey, column.id);
    const spacingAnalysis = getShelfSpacingAnalysis(sectionKey, column.id);
    const totalHeight = config.height - config.baseBarHeight;
    const hasNoShelves = !columnShelves || columnShelves.shelves.length === 0;

    const handleInitializeShelves = () => {
      initializeColumnShelves(sectionKey, column.id, 3);
    };

    const handleAddShelf = () => {
      addShelfToColumn(sectionKey, column.id);
    };

    const handleRemoveShelf = (shelfId: string) => {
      removeShelfFromColumn(sectionKey, column.id, shelfId);
    };

    const handleShelfPositionChange = (
      shelfId: string,
      newPosition: number
    ) => {
      moveShelf(sectionKey, column.id, shelfId, newPosition);
    };

    const handleRedistribute = () => {
      redistributeShelvesEvenly(sectionKey, column.id);
    };

    return (
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">
              📋 Section {sectionName} - Colonne {columnIndex + 1}
              <small className="text-muted ms-2">({column.width}cm)</small>
            </h6>
            <div className="d-flex gap-2 align-items-center">
              {columnShelves && (
                <small className="text-info">
                  {columnShelves.shelves.length} étagères
                </small>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSelectedColumnId(null)}
                title="Désélectionner"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {hasNoShelves ? (
            <div className="text-center py-4">
              <p className="text-muted mb-3">
                Aucune étagère configurée pour cette colonne
              </p>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleInitializeShelves}
              >
                Initialiser les étagères
              </button>
            </div>
          ) : (
            <div>
              {/* Column Info */}
              <div className="mb-3 p-2 bg-light rounded">
                <small className="text-muted">
                  <strong>Hauteur disponible:</strong> {totalHeight}cm
                  <br />
                  <strong>Étagères:</strong> {columnShelves!.shelves.length}
                  {spacingAnalysis && (
                    <>
                      <br />
                      <strong>Espacement moyen:</strong>{" "}
                      {spacingAnalysis.averageSpacing.toFixed(1)}cm
                      {!spacingAnalysis.hasValidSpacing && (
                        <span className="text-danger ms-2">
                          ⚠️ Espacement insuffisant
                        </span>
                      )}
                    </>
                  )}
                </small>
              </div>

              {/* Action Buttons */}
              <div className="mb-3 d-flex gap-2 flex-wrap">
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={handleAddShelf}
                >
                  + Ajouter étagère
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleRedistribute}
                  title="Redistribuer également"
                >
                  ⚖️ Redistribuer
                </button>
              </div>

              {/* Shelves List */}
              <div className="mb-3">
                <h6>Position des étagères:</h6>
                {columnShelves!.shelves
                  .sort((a, b) => b.position - a.position)
                  .map((shelf, index) => {
                    const range = getShelfPositionRange(
                      sectionKey,
                      column.id,
                      shelf.id
                    );
                    const distanceFromBottom = shelf.position;
                    const distanceFromTop = totalHeight - shelf.position;

                    return (
                      <div key={shelf.id} className="mb-3 p-2 border rounded">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label mb-0">
                            <strong>
                              Étagère {columnShelves!.shelves.length - index}
                            </strong>
                            <small className="text-muted ms-2">
                              (↑{distanceFromTop.toFixed(0)}cm / ↓
                              {distanceFromBottom.toFixed(0)}cm)
                            </small>
                          </label>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveShelf(shelf.id)}
                            title="Supprimer étagère"
                          >
                            🗑️
                          </button>
                        </div>

                        <div className="input-group">
                          <input
                            type="number"
                            className="form-control"
                            value={shelf.position}
                            min={range.min}
                            max={range.max}
                            step={1}
                            onChange={(e) => {
                              const newPos =
                                parseInt(e.target.value) || range.min;
                              handleShelfPositionChange(shelf.id, newPos);
                            }}
                          />
                          <span className="input-group-text">cm du sol</span>
                        </div>

                        <small className="text-muted">
                          Position valide: {range.min}cm - {range.max}cm
                        </small>

                        {/* Position Slider */}
                        <div className="mt-2">
                          <input
                            type="range"
                            className="form-range"
                            value={shelf.position}
                            min={range.min}
                            max={range.max}
                            step={1}
                            onChange={(e) => {
                              const newPos = parseInt(e.target.value);
                              handleShelfPositionChange(shelf.id, newPos);
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Spacing Analysis */}
              {spacingAnalysis && (
                <div className="mt-3">
                  <h6>Analyse des espacements:</h6>
                  <div className="small">
                    {spacingAnalysis.spacings.map((spacing, index) => (
                      <div
                        key={index}
                        className={`d-flex justify-content-between align-items-center py-1 px-2 mb-1 rounded ${
                          spacing.isValid
                            ? spacing.isOptimal
                              ? "bg-success bg-opacity-10"
                              : "bg-light"
                            : "bg-danger bg-opacity-10"
                        }`}
                      >
                        <span>
                          {index === 0
                            ? "Sol"
                            : `Étagère ${
                                spacingAnalysis.spacings.length - index
                              }`}
                          →
                          {index === spacingAnalysis.spacings.length - 1
                            ? "Plafond"
                            : `Étagère ${
                                spacingAnalysis.spacings.length - index - 1
                              }`}
                        </span>
                        <span
                          className={
                            spacing.isValid ? "text-success" : "text-danger"
                          }
                        >
                          {spacing.height.toFixed(1)}cm
                          {!spacing.isValid && ` (min: ${MIN_SHELF_SPACING}cm)`}
                          {spacing.isOptimal && " ✓"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSelectionPrompt = () => (
    <div className="text-center py-5">
      <div className="mb-3">
        <span style={{ fontSize: "3rem" }}>👆</span>
      </div>
      <h5 className="text-muted mb-3">Sélectionnez une colonne</h5>
      <p className="text-secondary">
        Cliquez sur une colonne dans le modèle 3D pour configurer ses étagères.
        <br />
        <small className="text-muted">
          Les colonnes sont surlignées en bleu clair et deviennent cliquables.
        </small>
      </p>

      {/* Quick stats */}
      <div className="mt-4 row text-center">
        {Object.entries(config.wardrobeType.sections).map(([key, section]) => {
          if (!section) return null;
          const sectionName =
            key === "sectionA" ? "A" : key === "sectionB" ? "B" : "C";
          const totalShelves = section.columns.reduce((total, col) => {
            return total + (col.shelves?.spacings?.length || 0);
          }, 0);

          return (
            <div key={key} className="col">
              <div className="card border-light">
                <div className="card-body py-2">
                  <h6 className="card-title mb-1">Section {sectionName}</h6>
                  <small className="text-muted">
                    {section.columns.length} colonnes
                    <br />
                    {totalShelves} étagères
                  </small>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="accordion-item">
      <h2 className="accordion-header" id="headingEtageres">
        <button
          className="accordion-button collapsed"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#collapseEtageres"
          aria-expanded={isEtagereOpen}
          aria-controls="collapseEtageres"
          onClick={handleAccordionToggle}
        >
          5. Étagères
          {isEtagereOpen && <span className="ms-2 text-success">🎯</span>}
        </button>
      </h2>
      <div
        id="collapseEtageres"
        className={`accordion-collapse collapse ${isEtagereOpen ? "show" : ""}`}
        aria-labelledby="headingEtageres"
        data-bs-parent="#configAccordion"
      >
        <div className="accordion-body">
          <div className="text-secondary mb-3">
            Configurez la position des étagères dans chaque colonne.
            L'espacement minimum entre les étagères est de {MIN_SHELF_SPACING}
            cm.
          </div>

          {/* Debug Status Panel */}
          <div className="alert alert-info mb-3">
            <small>
              <strong>🔧 Debug Status:</strong>
              <br />
              Mode étagères:{" "}
              <span className={isEtagereOpen ? "text-success" : "text-danger"}>
                {isEtagereOpen ? "✅ ACTIVÉ" : "❌ DÉSACTIVÉ"}
              </span>
              <br />
              Accordion: <code>{config.accordionOpen}</code>
              <br />
              Selected Column: <code>{selectedColumnId || "null"}</code>
              <br />
              Total Columns:{" "}
              {Object.values(config.wardrobeType.sections).reduce(
                (total, section) => total + (section?.columns.length || 0),
                0
              )}
            </small>
          </div>

          {/* Mode indicator */}
          {isEtagereOpen && (
            <div className="alert alert-success py-2 mb-3">
              <small>
                🎯 <strong>Mode étagères activé</strong> - Les colonnes sont
                maintenant cliquables dans le modèle 3D.
                <br />
                <em>
                  Vous devriez voir un cube vert dans le 3D et les colonnes
                  surlignées.
                </em>
              </small>
            </div>
          )}

          {/* Manual column selection for testing */}
          {isEtagereOpen && (
            <div className="mb-3">
              <h6>🧪 Test Manual Selection:</h6>
              <div className="d-flex gap-2 flex-wrap">
                {Object.entries(config.wardrobeType.sections).map(
                  ([sectionKey, section]) => {
                    if (!section) return null;
                    return section.columns.map((column, index) => (
                      <button
                        key={column.id}
                        className={`btn btn-sm ${
                          selectedColumnId === column.id
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        onClick={() => handleColumnClick(column.id)}
                      >
                        {sectionKey.replace("section", "")} - Col {index + 1}
                      </button>
                    ));
                  }
                )}
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setSelectedColumnId(null)}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Show selected column config or selection prompt */}
          {selectedColumnData
            ? renderColumnShelves(
                selectedColumnData.sectionKey,
                selectedColumnData.sectionName,
                selectedColumnData.column,
                selectedColumnData.columnIndex
              )
            : renderSelectionPrompt()}

          {/* Back button when column is selected */}
          {selectedColumnData && (
            <div className="mt-3 text-center">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setSelectedColumnId(null)}
              >
                ← Retour à la sélection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EtagereSection;
