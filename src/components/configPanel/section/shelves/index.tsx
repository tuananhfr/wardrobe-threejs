import React, { useState, useEffect, useRef } from "react";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";
import { useWardrobeShelves } from "@/hooks/useWardrobeShelves";
import { useUndoRedo } from "@/context/WardrobeContext";

const ShelvesSection: React.FC = () => {
  const { config, updateConfig } = useWardrobeConfig();
  const { updateConfigWithHistoryDebounced } = useUndoRedo();

  const {
    getColumnShelves,
    setShelfCount,
    setShelfCountForMultipleColumns,
    getShelfSpacingAnalysis,

    MIN_SHELF_SPACING,
  } = useWardrobeShelves();

  // Track previous accordionOpen to detect actual changes
  const prevAccordionOpenRef = useRef<string | null>(null);

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

  // Handle Angle AB selection (treats A-last and B-first as one column)
  const handleAngleABClick = () => {
    if (config.selectedColumnId === "angle-ab") {
      // Deselect if already selected
      updateConfig("selectedColumnId", null);
    } else {
      // Select Angle AB as a single column
      updateConfig("selectedColumnId", "angle-ab");
    }
  };

  // Handle Angle AC selection (treats A-first and C-first as one column)
  const handleAngleACClick = () => {
    if (config.selectedColumnId === "angle-ac") {
      // Deselect if already selected
      updateConfig("selectedColumnId", null);
    } else {
      // Select Angle AC as a single column
      updateConfig("selectedColumnId", "angle-ac");
    }
  };

  // Check if Angle AB button should be shown
  const shouldShowAngleAB = () => {
    const sectionA = config.wardrobeType.sections.sectionA;
    const sectionB = config.wardrobeType.sections.sectionB;

    return (
      (config.wardrobeType.id === "Angle" ||
        config.wardrobeType.id === "Forme U") &&
      sectionA &&
      sectionB &&
      sectionA.columns.length > 0 &&
      sectionB.columns.length > 0
    );
  };

  // Check if Angle AC button should be shown
  const shouldShowAngleAC = () => {
    const sectionA = config.wardrobeType.sections.sectionA;
    const sectionC = config.wardrobeType.sections.sectionC;

    return (
      config.wardrobeType.id === "Forme U" &&
      sectionA &&
      sectionC &&
      sectionA.columns.length > 0 &&
      sectionC.columns.length > 0
    );
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

  // Get all available columns for selection (excluding A-last and B-first for Angle type)
  const getAllColumns = () => {
    const columns: Array<{
      id: string;
      sectionKey: SectionKey;
      sectionName: string;
      columnIndex: number;
      width: number;
    }> = [];

    // For Angle type, we need to organize columns by section and insert Angle AB in the middle
    if (config.wardrobeType.id === "Angle") {
      const sectionA = config.wardrobeType.sections.sectionA;
      const sectionB = config.wardrobeType.sections.sectionB;

      if (sectionA && sectionB) {
        // Add section A columns (excluding the last one - A-last)
        sectionA.columns.forEach((column, index) => {
          const isALastColumn = index === sectionA.columns.length - 1;
          if (!isALastColumn) {
            columns.push({
              id: column.id,
              sectionKey: "sectionA" as SectionKey,
              sectionName: "A",
              columnIndex: index,
              width: column.width,
            });
          }
        });

        // Add section B columns (excluding the first one - B-first)
        sectionB.columns.forEach((column, index) => {
          const isBFirstColumn = index === 0;
          if (!isBFirstColumn) {
            columns.push({
              id: column.id,
              sectionKey: "sectionB" as SectionKey,
              sectionName: "B",
              columnIndex: index,
              width: column.width,
            });
          }
        });
      }
    }
    // For Forme U type, we need to organize columns by section and insert Angle AB and Angle AC
    else if (config.wardrobeType.id === "Forme U") {
      const sectionA = config.wardrobeType.sections.sectionA;
      const sectionB = config.wardrobeType.sections.sectionB;
      const sectionC = config.wardrobeType.sections.sectionC;

      if (sectionA && sectionB && sectionC) {
        // Add section A columns (excluding the first and last ones)
        sectionA.columns.forEach((column, index) => {
          const isAFirstColumn = index === 0;
          const isALastColumn = index === sectionA.columns.length - 1;
          if (!isAFirstColumn && !isALastColumn) {
            columns.push({
              id: column.id,
              sectionKey: "sectionA" as SectionKey,
              sectionName: "A",
              columnIndex: index,
              width: column.width,
            });
          }
        });

        // Add section B columns (excluding the last one)
        sectionB.columns.forEach((column, index) => {
          const isBLastColumn = index === sectionB.columns.length - 1;
          if (!isBLastColumn) {
            columns.push({
              id: column.id,
              sectionKey: "sectionB" as SectionKey,
              sectionName: "B",
              columnIndex: index,
              width: column.width,
            });
          }
        });

        // Add section C columns (excluding the first one)
        sectionC.columns.forEach((column, index) => {
          const isCFirstColumn = index === 0;
          if (!isCFirstColumn) {
            columns.push({
              id: column.id,
              sectionKey: "sectionC" as SectionKey,
              sectionName: "C",
              columnIndex: index,
              width: column.width,
            });
          }
        });
      }
    } else {
      // For non-Angle types, use the original logic
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
    }

    return columns;
  };

  const selectedColumnData = getSelectedColumnData();
  const allColumns = getAllColumns();

  // Tính số kệ tối đa dựa trên chiều cao khả dụng và khoảng cách tối thiểu
  const computeMaxShelves = () => {
    const totalHeight = config.height; // cm
    const baseBar = config.baseBarHeight; // cm
    const thickness = config.thickness; // cm (dùng cho sol + plafond + mỗi kệ)
    const minGap = MIN_SHELF_SPACING; // cm

    let count = 0;
    while (true) {
      const needed =
        baseBar + 2 * thickness + count * thickness + (count + 1) * minGap;
      if (needed <= totalHeight) {
        count++;
      } else {
        break;
      }
    }
    return count; // số kệ tối đa thoả điều kiện min gap
  };

  const maxShelves = computeMaxShelves();

  // Local state for Angle AB shelf count
  const [angleABShelfCount, setAngleABShelfCount] = useState<number>(0);
  const [angleACShelfCount, setAngleACShelfCount] = useState<number>(0);
  const [isUserChanging, setIsUserChanging] = useState<boolean>(false);

  // Sync local state with actual data when Angle AB is selected
  useEffect(() => {
    if (config.selectedColumnId === "angle-ab") {
      const sectionA = config.wardrobeType.sections.sectionA;
      const sectionB = config.wardrobeType.sections.sectionB;

      if (sectionA && sectionB) {
        const aFirstColumn = sectionA.columns[0];

        if (aFirstColumn) {
          const aColumnShelves = getColumnShelves("sectionA", aFirstColumn.id);
          const actualCount = aColumnShelves?.shelves?.length || 0;
          // Only sync if local state is 0 (initial state) and actual count is different
          if (
            !isUserChanging &&
            actualCount !== angleABShelfCount &&
            (angleABShelfCount === 0 || actualCount >= 0)
          ) {
            setAngleABShelfCount(actualCount);
          }
        }
      }
    }
  }, [
    config.selectedColumnId,
    config.wardrobeType.sections,
    isUserChanging,
    angleABShelfCount,
  ]);

  // Sync local state with actual data when Angle AC is selected
  useEffect(() => {
    if (config.selectedColumnId === "angle-ac") {
      const sectionA = config.wardrobeType.sections.sectionA;
      const sectionC = config.wardrobeType.sections.sectionC;

      if (sectionA && sectionC) {
        const aLastColumn = sectionA.columns[sectionA.columns.length - 1];
        if (aLastColumn) {
          const aColumnShelves = getColumnShelves("sectionA", aLastColumn.id);
          const actualCount = aColumnShelves?.shelves?.length || 0;
          // Only sync if local state is 0 (initial state) and actual count is different
          if (
            !isUserChanging &&
            actualCount !== angleACShelfCount &&
            (angleACShelfCount === 0 || actualCount >= 0)
          ) {
            setAngleACShelfCount(actualCount);
          }
        }
      }
    }
  }, [
    config.selectedColumnId,
    config.wardrobeType.sections,
    isUserChanging,
    angleACShelfCount,
  ]);

  // Reset local state when switching away from Angle AB or Angle AC
  useEffect(() => {
    if (
      config.selectedColumnId !== "angle-ab" &&
      config.selectedColumnId !== "angle-ac"
    ) {
      setAngleABShelfCount(0);
      setAngleACShelfCount(0);
      setIsUserChanging(false);
    }
  }, [config.selectedColumnId]);

  // Reset selection and hover when accordion changes
  useEffect(() => {
    const currentAccordionOpen = config.accordionOpen;
    const prevAccordionOpen = prevAccordionOpenRef.current;

    // Only reset when accordion actually changes to a different one
    if (
      prevAccordionOpen !== null &&
      prevAccordionOpen !== currentAccordionOpen &&
      prevAccordionOpen !== "" &&
      currentAccordionOpen !== ""
    ) {
      // Reset selected column when switching to a different accordion
      if (config.selectedColumnId) {
        updateConfig("selectedColumnId", null);
      }
      // Reset hovered column when switching to a different accordion
      if (config.hoveredColumnId) {
        updateConfig("hoveredColumnId", null);
      }
    }

    // Update the previous accordion open reference
    prevAccordionOpenRef.current = currentAccordionOpen;
  }, [config.accordionOpen, updateConfig]);

  // Get Angle AB data when selected as a single column
  const getAngleABData = () => {
    if (config.selectedColumnId !== "angle-ab" || !isEtagereOpen) return null;

    const sectionA = config.wardrobeType.sections.sectionA;
    const sectionB = config.wardrobeType.sections.sectionB;

    if (!sectionA || !sectionB) return null;

    let aColumnIndex: number;
    let bColumnIndex: number;

    if (config.wardrobeType.id === "Angle") {
      // For Angle type: A-last and B-first
      aColumnIndex = sectionA.columns.length - 1;
      bColumnIndex = 0;
    } else if (config.wardrobeType.id === "Forme U") {
      // For Forme U type: A-first and B-last
      aColumnIndex = 0;
      bColumnIndex = sectionB.columns.length - 1;
    } else {
      return null;
    }

    const aColumn = sectionA.columns[aColumnIndex];
    const bColumn = sectionB.columns[bColumnIndex];

    return {
      aColumn: {
        sectionKey: "sectionA" as SectionKey,
        sectionName: "A",
        column: aColumn,
        columnIndex: aColumnIndex,
      },
      bColumn: {
        sectionKey: "sectionB" as SectionKey,
        sectionName: "B",
        column: bColumn,
        columnIndex: bColumnIndex,
      },
    };
  };

  // Get Angle AC data when selected as a single column
  const getAngleACData = () => {
    if (config.selectedColumnId !== "angle-ac" || !isEtagereOpen) return null;

    const sectionA = config.wardrobeType.sections.sectionA;
    const sectionC = config.wardrobeType.sections.sectionC;

    if (!sectionA || !sectionC) return null;

    const aLastColumnIndex = sectionA.columns.length - 1;
    const cFirstColumnIndex = 0;

    const aLastColumn = sectionA.columns[aLastColumnIndex];
    const cFirstColumn = sectionC.columns[cFirstColumnIndex];

    return {
      aColumn: {
        sectionKey: "sectionA" as SectionKey,
        sectionName: "A",
        column: aLastColumn,
        columnIndex: aLastColumnIndex,
      },
      cColumn: {
        sectionKey: "sectionC" as SectionKey,
        sectionName: "C",
        column: cFirstColumn,
        columnIndex: cFirstColumnIndex,
      },
    };
  };

  const renderColumnShelves = (
    sectionKey: SectionKey,
    sectionName: string,
    column: WardrobeColumn,
    columnIndex: number
  ) => {
    const columnShelves = getColumnShelves(sectionKey, column.id);
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
                max={maxShelves}
                onChange={(e) => {
                  const raw = parseInt(e.target.value) || 0;
                  const newCount = Math.min(Math.max(0, raw), maxShelves);
                  setShelfCount(sectionKey, column.id, newCount);
                }}
              />
              <span className="input-group-text">étagères</span>
            </div>
            <small className="text-muted">
              Ajustez le nombre d'étagères pour cette colonne (0-
              {maxShelves - 1})
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

                    updateConfigWithHistoryDebounced("wardrobeType", {
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
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderAngleABShelves = (angleData: {
    aColumn: {
      sectionKey: SectionKey;
      sectionName: string;
      column: WardrobeColumn;
      columnIndex: number;
    };
    bColumn: {
      sectionKey: SectionKey;
      sectionName: string;
      column: WardrobeColumn;
      columnIndex: number;
    };
  }) => {
    // Get shelves data for both columns
    const bColumnShelves = getColumnShelves(
      angleData.bColumn.sectionKey,
      angleData.bColumn.column.id
    );

    const spacingAnalysis = getShelfSpacingAnalysis(
      angleData.bColumn.sectionKey,
      angleData.bColumn.column.id
    );
    const totalHeight = config.height - config.baseBarHeight;

    // Use B column as primary for display, but ensure both columns are synchronized
    const primaryShelves = bColumnShelves;

    // Use local state for display, fallback to actual data
    const bShelfCount = bColumnShelves?.shelves?.length || 0;
    const displayShelfCount =
      isUserChanging || angleABShelfCount > 0 ? angleABShelfCount : bShelfCount;

    return (
      <div className="card border-primary">
        <div className="card-header bg-primary bg-opacity-10">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Angle AB</h6>
            <div className="d-flex gap-2 align-items-center">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  updateConfig("selectedColumnId", null);
                }}
                title="Désélectionner"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {/* Shelf Count Control - applies to both columns */}
          <div className="mb-3">
            <label className="form-label">
              <strong>Nombre d'étagères:</strong>
            </label>
            <div className="input-group w-100">
              <input
                type="number"
                className="form-control"
                value={displayShelfCount}
                min={0}
                max={maxShelves}
                onChange={(e) => {
                  const raw = parseInt(e.target.value) || 0;
                  const newCount = Math.min(Math.max(0, raw), maxShelves);

                  // Update local state immediately for responsive UI
                  setIsUserChanging(true);
                  setAngleABShelfCount(newCount);

                  // Use function to update both columns in single transaction
                  setShelfCountForMultipleColumns([
                    {
                      sectionKey: angleData.aColumn.sectionKey,
                      columnId: angleData.aColumn.column.id,
                      newCount: newCount,
                    },
                    {
                      sectionKey: angleData.bColumn.sectionKey,
                      columnId: angleData.bColumn.column.id,
                      newCount: newCount,
                    },
                  ]);

                  // Reset user changing flag after a delay
                  setTimeout(() => {
                    setIsUserChanging(false);
                  }, 500);
                }}
              />
              <span className="input-group-text">étagères</span>
            </div>
            <small className="text-muted">
              Ajustez le nombre d'étagères pour cette colonne (0-
              {maxShelves - 1})
            </small>
          </div>

          {/* Shelves List - only show if shelves exist */}
          {displayShelfCount > 0 ? (
            <div>
              {/* Shelves List */}
              <div className="mb-3">
                <h6>Espacements des étagères:</h6>
                <div className="mb-2">
                  <small className="text-muted">
                    Configurez les espacements entre les éléments (sol → étagère
                    → étagère → plafond) - appliqué aux deux colonnes
                  </small>
                </div>
                {primaryShelves!.spacings.map((spacing, index) => {
                  const isLastSpacing =
                    index === primaryShelves!.spacings.length - 1;

                  // Labels pour les espacements
                  let fromLabel, toLabel;
                  if (index === 0) {
                    fromLabel = "Sol";
                    toLabel = "Étagère 1";
                  } else if (isLastSpacing) {
                    fromLabel = `Étagère ${primaryShelves!.shelves.length}`;
                    toLabel = "Plafond";
                  } else {
                    fromLabel = `Étagère ${index}`;
                    toLabel = `Étagère ${index + 1}`;
                  }

                  // Fix handleSpacingChange trong renderAngleABShelves:

                  const handleSpacingChange = (newSpacing: number) => {
                    // Get both sections first
                    const sectionA = config.wardrobeType.sections.sectionA;
                    const sectionB = config.wardrobeType.sections.sectionB;

                    if (!sectionA || !sectionB) {
                      console.error("Missing sections");
                      return;
                    }

                    // Update both columns' spacings in memory first
                    const updatedSections = {
                      ...config.wardrobeType.sections,
                    };

                    // Helper function to update spacing for one column
                    const updateSpacingForColumn = (
                      section: WardrobeSection,

                      columnId: string
                    ): WardrobeSection => {
                      const currentColumn = section.columns.find(
                        (col) => col.id === columnId
                      );
                      if (!currentColumn?.shelves?.spacings) return section;

                      const currentSpacings = [
                        ...currentColumn.shelves.spacings,
                      ];
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

                      // Return updated section
                      const updatedColumns = section.columns.map((col) => {
                        if (col.id === columnId && col.shelves) {
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

                      return {
                        ...section,
                        columns: updatedColumns,
                      };
                    };

                    // Update both sections

                    updatedSections.sectionA = updateSpacingForColumn(
                      sectionA,

                      angleData.aColumn.column.id
                    );

                    updatedSections.sectionB = updateSpacingForColumn(
                      sectionB,

                      angleData.bColumn.column.id
                    );

                    // Single config update for both columns
                    updateConfigWithHistoryDebounced("wardrobeType", {
                      ...config.wardrobeType,
                      sections: updatedSections,
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

  const renderAngleACShelves = (angleData: {
    aColumn: {
      sectionKey: SectionKey;
      sectionName: string;
      column: WardrobeColumn;
      columnIndex: number;
    };
    cColumn: {
      sectionKey: SectionKey;
      sectionName: string;
      column: WardrobeColumn;
      columnIndex: number;
    };
  }) => {
    // Get shelves data for both columns
    const cColumnShelves = getColumnShelves(
      angleData.cColumn.sectionKey,
      angleData.cColumn.column.id
    );

    const spacingAnalysis = getShelfSpacingAnalysis(
      angleData.cColumn.sectionKey,
      angleData.cColumn.column.id
    );
    const totalHeight = config.height - config.baseBarHeight;

    // Use C column as primary for display, but ensure both columns are synchronized
    const primaryShelves = cColumnShelves;

    // Use local state for display, fallback to actual data
    const cShelfCount = cColumnShelves?.shelves?.length || 0;
    const displayShelfCount =
      isUserChanging || angleACShelfCount > 0 ? angleACShelfCount : cShelfCount;

    return (
      <div className="card border-primary">
        <div className="card-header bg-primary bg-opacity-10">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Angle AC</h6>
            <div className="d-flex gap-2 align-items-center">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  updateConfig("selectedColumnId", null);
                }}
                title="Désélectionner"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {/* Shelf Count Control - applies to both columns */}
          <div className="mb-3">
            <label className="form-label">
              <strong>Nombre d'étagères:</strong>
            </label>
            <div className="input-group w-100">
              <input
                type="number"
                className="form-control"
                value={displayShelfCount}
                min={0}
                max={maxShelves}
                onChange={(e) => {
                  const raw = parseInt(e.target.value) || 0;
                  const newCount = Math.min(Math.max(0, raw), maxShelves);

                  // Update local state immediately for responsive UI
                  setIsUserChanging(true);
                  setAngleACShelfCount(newCount);

                  // Use new function to update both columns in single transaction
                  setShelfCountForMultipleColumns([
                    {
                      sectionKey: angleData.aColumn.sectionKey,
                      columnId: angleData.aColumn.column.id,
                      newCount: newCount,
                    },
                    {
                      sectionKey: angleData.cColumn.sectionKey,
                      columnId: angleData.cColumn.column.id,
                      newCount: newCount,
                    },
                  ]);

                  // Reset user changing flag after a delay
                  setTimeout(() => {
                    setIsUserChanging(false);
                  }, 500);
                }}
              />
              <span className="input-group-text">étagères</span>
            </div>
            <small className="text-muted">
              Ajustez le nombre d'étagères pour cette colonne (0-
              {maxShelves - 1})
            </small>
          </div>

          {/* Shelves List - only show if shelves exist */}
          {displayShelfCount > 0 ? (
            <div>
              {/* Shelves List */}
              <div className="mb-3">
                <h6>Espacements des étagères:</h6>
                <div className="mb-2">
                  <small className="text-muted">
                    Configurez les espacements entre les éléments (sol → étagère
                    → étagère → plafond) - appliqué aux deux colonnes
                  </small>
                </div>
                {primaryShelves!.spacings.map((spacing, index) => {
                  const isLastSpacing =
                    index === primaryShelves!.spacings.length - 1;

                  // Labels pour les espacements
                  let fromLabel, toLabel;
                  if (index === 0) {
                    fromLabel = "Sol";
                    toLabel = "Étagère 1";
                  } else if (isLastSpacing) {
                    fromLabel = `Étagère ${primaryShelves!.shelves.length}`;
                    toLabel = "Plafond";
                  } else {
                    fromLabel = `Étagère ${index}`;
                    toLabel = `Étagère ${index + 1}`;
                  }

                  // Fix handleSpacingChange trong renderAngleACShelves:

                  const handleSpacingChange = (newSpacing: number) => {
                    // Get both sections first
                    const sectionA = config.wardrobeType.sections.sectionA;
                    const sectionC = config.wardrobeType.sections.sectionC;

                    if (!sectionA || !sectionC) {
                      console.error("Missing sections");
                      return;
                    }

                    // Update both columns' spacings in memory first
                    const updatedSections = {
                      ...config.wardrobeType.sections,
                    };

                    // Helper function to update spacing for one column
                    const updateSpacingForColumn = (
                      section: WardrobeSection,

                      columnId: string
                    ): WardrobeSection => {
                      const currentColumn = section.columns.find(
                        (col) => col.id === columnId
                      );
                      if (!currentColumn?.shelves?.spacings) return section;

                      const currentSpacings = [
                        ...currentColumn.shelves.spacings,
                      ];
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

                      // Return updated section
                      const updatedColumns = section.columns.map((col) => {
                        if (col.id === columnId && col.shelves) {
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

                      return {
                        ...section,
                        columns: updatedColumns,
                      };
                    };

                    // Update both sections

                    updatedSections.sectionA = updateSpacingForColumn(
                      sectionA,

                      angleData.aColumn.column.id
                    );

                    updatedSections.sectionC = updateSpacingForColumn(
                      sectionC,

                      angleData.cColumn.column.id
                    );

                    // Single config update for both columns
                    updateConfigWithHistoryDebounced("wardrobeType", {
                      ...config.wardrobeType,
                      sections: updatedSections,
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
                {/* Render buttons in the correct order for Angle type */}
                {config.wardrobeType.id === "Angle" ? (
                  <>
                    {/* Section A columns */}
                    {allColumns
                      .filter((column) => column.sectionName === "A")
                      .map((column) => (
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

                    {/* Angle AB button - positioned between A and B sections */}
                    {shouldShowAngleAB() && (
                      <button
                        className={`btn btn-sm ${
                          config.selectedColumnId === "angle-ab"
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        onClick={handleAngleABClick}
                      >
                        Angle AB
                      </button>
                    )}

                    {/* Section B columns */}
                    {allColumns
                      .filter((column) => column.sectionName === "B")
                      .map((column) => (
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
                  </>
                ) : config.wardrobeType.id === "Forme U" ? (
                  <>
                    {/* Section B columns */}
                    {allColumns
                      .filter((column) => column.sectionName === "B")
                      .map((column) => (
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

                    {/* Angle AB button - positioned between B and A sections */}
                    {shouldShowAngleAB() && (
                      <button
                        className={`btn btn-sm ${
                          config.selectedColumnId === "angle-ab"
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        onClick={handleAngleABClick}
                      >
                        Angle AB
                      </button>
                    )}

                    {/* Section A columns */}
                    {allColumns
                      .filter((column) => column.sectionName === "A")
                      .map((column) => (
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

                    {/* Angle AC button - positioned between A and C sections */}
                    {shouldShowAngleAC() && (
                      <button
                        className={`btn btn-sm ${
                          config.selectedColumnId === "angle-ac"
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        onClick={handleAngleACClick}
                      >
                        Angle AC
                      </button>
                    )}

                    {/* Section C columns */}
                    {allColumns
                      .filter((column) => column.sectionName === "C")
                      .map((column) => (
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
                  </>
                ) : (
                  /* For non-Angle types, render all columns normally */
                  <>
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
                  </>
                )}

                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    updateConfig("selectedColumnId", null);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Show selected column config or selection prompt */}
          {(() => {
            const angleABData = getAngleABData();
            const angleACData = getAngleACData();
            if (angleABData) {
              return renderAngleABShelves(angleABData);
            } else if (angleACData) {
              return renderAngleACShelves(angleACData);
            } else if (selectedColumnData) {
              return renderColumnShelves(
                selectedColumnData.sectionKey,
                selectedColumnData.sectionName,
                selectedColumnData.column,
                selectedColumnData.columnIndex
              );
            } else {
              return renderSelectionPrompt();
            }
          })()}
        </div>
      </div>
    </div>
  );
};

export default ShelvesSection;
