// src/components/ConfigPanel/section/EtagereSection.tsx (From Your File with Fixed Logic)
import React from "react";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";
import { useWardrobeShelves } from "@/hooks/useWardrobeShelves";

const EtagereSection: React.FC = () => {
  const { config, updateConfig } = useWardrobeConfig();
  const {
    getColumnShelves,
    setShelfCount,

    getShelfSpacingAnalysis,

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
                  setShelfCount(sectionKey, column.id, newCount);
                }}
              />
              <span className="input-group-text">étagères</span>
            </div>
            <small className="text-muted">
              Ajustez le nombre d'étagères pour cette colonne (0-10)
            </small>
          </div>

          {/* Shelves List - only show if shelves exist */}
          {(columnShelves?.shelves?.length || 0) > 0 ? (
            <div>
              {/* Shelves List */}
              <div className="mb-3">
                <h6>Espacements des étagères:</h6>
                <div className="mb-2">
                  <small className="text-muted">
                    Configurez les espacements entre les éléments (sol → étagère
                    → étagère → plafond)
                  </small>
                </div>
                {columnShelves!.spacings.map((spacing, index) => {
                  const isLastSpacing =
                    index === columnShelves!.spacings.length - 1;

                  // Labels pour les espacements
                  let fromLabel, toLabel;
                  if (index === 0) {
                    fromLabel = "Sol";
                    toLabel = "Étagère 1";
                  } else if (isLastSpacing) {
                    fromLabel = `Étagère ${columnShelves!.shelves.length}`;
                    toLabel = "Plafond";
                  } else {
                    fromLabel = `Étagère ${index}`;
                    toLabel = `Étagère ${index + 1}`;
                  }

                  const handleSpacingChange = (newSpacing: number) => {
                    // Get current section data
                    const section = config.wardrobeType.sections[sectionKey];
                    if (!section) return;

                    const currentColumn = section.columns.find(
                      (col) => col.id === column.id
                    );
                    if (!currentColumn?.shelves?.spacings) return;

                    const currentSpacings = [...currentColumn.shelves.spacings];
                    const oldSpacing = currentSpacings[index].spacing;
                    const spacingDiff = newSpacing - oldSpacing;

                    // Update current spacing
                    currentSpacings[index] = {
                      ...currentSpacings[index],
                      spacing: newSpacing,
                    };

                    let adjustmentApplied = false;
                    let finalCurrentSpacing = newSpacing;

                    // Try to adjust NEXT spacing first (forward adjustment)
                    if (index < currentSpacings.length - 1) {
                      const nextIndex = index + 1;
                      const nextSpacing = currentSpacings[nextIndex].spacing;
                      const newNextSpacing = nextSpacing - spacingDiff;

                      if (newNextSpacing >= MIN_SHELF_SPACING) {
                        // Can adjust next spacing
                        currentSpacings[nextIndex] = {
                          ...currentSpacings[nextIndex],
                          spacing: newNextSpacing,
                        };
                        adjustmentApplied = true;
                      } else {
                        // Next spacing would be too small, limit current increase
                        const maxAllowedIncrease =
                          nextSpacing - MIN_SHELF_SPACING;
                        finalCurrentSpacing = oldSpacing + maxAllowedIncrease;
                        currentSpacings[index] = {
                          ...currentSpacings[index],
                          spacing: finalCurrentSpacing,
                        };
                        currentSpacings[nextIndex] = {
                          ...currentSpacings[nextIndex],
                          spacing: MIN_SHELF_SPACING,
                        };
                        adjustmentApplied = true;
                      }
                    }

                    // If no next spacing available or couldn't adjust next, try PREVIOUS spacing (backward adjustment)
                    if (!adjustmentApplied && index > 0) {
                      const prevIndex = index - 1;
                      const prevSpacing = currentSpacings[prevIndex].spacing;
                      const newPrevSpacing = prevSpacing - spacingDiff;

                      if (newPrevSpacing >= MIN_SHELF_SPACING) {
                        // Can adjust previous spacing
                        currentSpacings[prevIndex] = {
                          ...currentSpacings[prevIndex],
                          spacing: newPrevSpacing,
                        };
                        adjustmentApplied = true;
                      } else {
                        // Previous spacing would be too small, limit current increase
                        const maxAllowedIncrease =
                          prevSpacing - MIN_SHELF_SPACING;
                        finalCurrentSpacing = oldSpacing + maxAllowedIncrease;
                        currentSpacings[index] = {
                          ...currentSpacings[index],
                          spacing: finalCurrentSpacing,
                        };
                        currentSpacings[prevIndex] = {
                          ...currentSpacings[prevIndex],
                          spacing: MIN_SHELF_SPACING,
                        };
                        adjustmentApplied = true;
                      }
                    }

                    // Update config with new spacings
                    const updatedColumns = section.columns.map((col) => {
                      if (col.id === column.id && col.shelves) {
                        return {
                          ...col,
                          shelves: {
                            ...col.shelves,
                            spacings: currentSpacings,
                          },
                        };
                      }
                      return col;
                    });

                    updateConfig("wardrobeType", {
                      ...config.wardrobeType,
                      sections: {
                        ...config.wardrobeType.sections,
                        [sectionKey]: {
                          ...section,
                          columns: updatedColumns,
                        },
                      },
                    });
                  };

                  return (
                    <div
                      key={`spacing-${index}`}
                      className="mb-3 p-2 border rounded"
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label mb-0">
                          <strong>
                            {fromLabel} → {toLabel}
                          </strong>
                          <small className="text-muted ms-2">
                            ({isLastSpacing ? "vers le haut" : "espacement"})
                          </small>
                        </label>
                      </div>

                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          value={spacing}
                          min={MIN_SHELF_SPACING}
                          max={totalHeight - 50} // Leave some room
                          step={1}
                          onChange={(e) => {
                            const newSpacing =
                              parseInt(e.target.value) || MIN_SHELF_SPACING;
                            handleSpacingChange(
                              Math.max(MIN_SHELF_SPACING, newSpacing)
                            );
                          }}
                        />
                        <span className="input-group-text">cm</span>
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
          ) : null}
        </div>
      </div>
    );
  };

  const renderSelectionPrompt = () => (
    <div className="text-center py-5">
      <h5 className="text-muted mb-3">Sélectionnez une colonne</h5>
      <p className="text-secondary">
        Cliquez sur une colonne dans le modèle 3D pour configurer ses étagères.
      </p>
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
