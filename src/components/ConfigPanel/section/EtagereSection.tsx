// src/components/ConfigPanel/section/EtagereSection.tsx (Completely Clean)
import React from "react";
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

  // Check if étagère accordion is open
  const isEtagereOpen = config.accordionOpen === "collapseEtageres";

  // Handle accordion toggle
  const handleAccordionToggle = () => {
    const newState = isEtagereOpen ? "" : "collapseEtageres";
    updateConfig("accordionOpen", newState);

    // Clear selection when closing accordion
    if (isEtagereOpen && config.selectedColumnId) {
      updateConfig("selectedColumnId", null);
    }
  };

  // Handle column click
  const handleColumnClick = (columnId: string) => {
    if (config.selectedColumnId === columnId) {
      // Deselect if already selected
      updateConfig("selectedColumnId", null);
    } else {
      // Select new column
      updateConfig("selectedColumnId", columnId);
    }
  };

  // Get selected column data
  const getSelectedColumnData = () => {
    if (!config.selectedColumnId || !isEtagereOpen) return null;

    for (const [sectionKey, section] of Object.entries(
      config.wardrobeType.sections
    )) {
      if (!section) continue;

      const columnIndex = section.columns.findIndex(
        (col) => col.id === config.selectedColumnId
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

  // Get all available columns for selection
  const getAllColumns = () => {
    const columns: Array<{
      id: string;
      sectionKey: SectionKey;
      sectionName: string;
      columnIndex: number;
      width: number;
    }> = [];

    Object.entries(config.wardrobeType.sections).forEach(
      ([sectionKey, section]) => {
        if (!section) return;

        section.columns.forEach((column, index) => {
          columns.push({
            id: column.id,
            sectionKey: sectionKey as SectionKey,
            sectionName:
              sectionKey === "sectionA"
                ? "A"
                : sectionKey === "sectionB"
                ? "B"
                : "C",
            columnIndex: index,
            width: column.width,
          });
        });
      }
    );

    return columns;
  };

  const selectedColumnData = getSelectedColumnData();
  const allColumns = getAllColumns();

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
      // Not needed anymore - using input control
    };

    const handleAddShelf = () => {
      // Not needed anymore - using input control
    };

    const handleRemoveShelf = (shelfId: string) => {
      // Not needed anymore - using input control
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
      <div className="card border-primary">
        <div className="card-header bg-primary bg-opacity-10">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">
              Section {sectionName} - Colonne {columnIndex + 1}
            </h6>
            <div className="d-flex gap-2 align-items-center">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => handleColumnClick(column.id)}
                title="Désélectionner"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {/* Shelf Count Control */}
          <div className="mb-3">
            <label className="form-label">
              <strong>Nombre d'étagères:</strong>
            </label>
            <div className="input-group w-100">
              <input
                type="number"
                className="form-control"
                value={columnShelves?.shelves?.length || 0}
                min={0}
                max={10}
                onChange={(e) => {
                  const newCount = parseInt(e.target.value) || 0;
                  const currentCount = columnShelves?.shelves?.length || 0;

                  if (newCount > currentCount) {
                    // Add shelves
                    for (let i = currentCount; i < newCount; i++) {
                      addShelfToColumn(sectionKey, column.id);
                    }
                  } else if (newCount < currentCount) {
                    // Remove shelves (from the end)
                    const shelvesToRemove = columnShelves!.shelves
                      .sort((a, b) => a.position - b.position)
                      .slice(newCount);

                    shelvesToRemove.forEach((shelf) => {
                      removeShelfFromColumn(sectionKey, column.id, shelf.id);
                    });
                  }
                }}
              />
              <span className="input-group-text">étagères</span>
            </div>
            <small className="text-muted">
              Ajustez le nombre d'étagères pour cette colonne (0-10)
            </small>
          </div>

          {/* Shelves List - only show if shelves exist */}
          {columnShelves?.shelves?.length &&
            columnShelves.shelves.length > 0 && (
              <div>
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
                            {!spacing.isValid &&
                              ` (min: ${MIN_SHELF_SPACING}cm)`}
                            {spacing.isOptimal && " ✓"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* No shelves message */}
          {(!columnShelves?.shelves?.length ||
            columnShelves.shelves.length === 0) && (
            <div className="text-center py-3">
              <p className="text-muted mb-0">
                <em>
                  Aucune étagère configurée. Utilisez le champ ci-dessus pour en
                  ajouter.
                </em>
              </p>
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

      {/* Quick Column Selection Grid */}
      <div className="mt-4">
        <h6 className="text-muted mb-3">🎯 Sélection rapide:</h6>
        <div className="row g-2">
          {allColumns.map((column) => {
            const shelves = getColumnShelves(column.sectionKey, column.id);
            const shelvesCount = shelves?.shelves?.length || 0;

            return (
              <div key={column.id} className="col-auto">
                <button
                  type="button"
                  className={`btn btn-outline-primary btn-sm ${
                    config.selectedColumnId === column.id ? "active" : ""
                  }`}
                  onClick={() => handleColumnClick(column.id)}
                  title={`Section ${column.sectionName} - Colonne ${
                    column.columnIndex + 1
                  }`}
                >
                  <div className="text-center">
                    <div>
                      <strong>
                        {column.sectionName}-{column.columnIndex + 1}
                      </strong>
                    </div>
                    <small className="text-muted">
                      {column.width}cm
                      {shelvesCount > 0 && (
                        <>
                          <br />
                          {shelvesCount} étagères
                        </>
                      )}
                    </small>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

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

          {/* Manual column selection for testing */}
          {isEtagereOpen && (
            <div className="mb-3">
              <div className="d-flex gap-2 flex-wrap">
                {allColumns.map((column) => (
                  <button
                    key={column.id}
                    className={`btn btn-sm ${
                      config.selectedColumnId === column.id
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => handleColumnClick(column.id)}
                  >
                    {column.sectionName} - Col {column.columnIndex + 1}
                  </button>
                ))}
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => updateConfig("selectedColumnId", null)}
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
        </div>
      </div>
    </div>
  );
};

export default EtagereSection;
