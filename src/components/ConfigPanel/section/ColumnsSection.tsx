// src/components/ConfigPanel/ColumnsSection.tsx (Simplified)
import React, { useEffect } from "react";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";
import { useWardrobeColumns } from "@/hooks/useWardrobeColumns";

const ColumnsSection: React.FC = () => {
  const { config, refreshAllSections, getLShapeConstraints } =
    useWardrobeConfig();

  const {
    setColumnCount,
    handleUpdateColumnWidth,
    redistributeColumnsEvenly,
    getRemainingSpace,
    validateSection,
  } = useWardrobeColumns();
  useEffect(() => {
    refreshAllSections(); // ← Chỉ cần gọi thôi
  }, [config.wardrobeType.id]);
  const renderSectionColumns = (
    sectionKey: SectionKey,
    sectionName: string,
    section: WardrobeSection
  ) => {
    // Chỉ cần đọc từ config - constraints đã được auto-calculated!
    const minCols = section.minColumns;
    const maxCols = section.maxColumns;

    // Get space info for display
    const spaceInfo = getRemainingSpace(section, config.thickness);
    const validation = validateSection(section, config.thickness);

    const lshapeInfo = getLShapeConstraints(config.wardrobeType, sectionKey);

    // Helper function to get column constraints
    const getColumnConstraints = (columnIndex: number) => {
      const isLastColumn = columnIndex === section.columns.length - 1;
      const isFirstColumn = columnIndex === 0;

      if (lshapeInfo.isCornerSection) {
        // Check last column constraint
        if (
          (lshapeInfo.cornerType === "last" ||
            lshapeInfo.cornerType === "both") &&
          isLastColumn
        ) {
          return {
            min: lshapeInfo.minLastColumnWidth!,
            max: 120,
            note: `Entre ${lshapeInfo.minLastColumnWidth} et 120 cm (corner)`,
            isSpecial: true,
          };
        }

        // Check first column constraint
        if (
          (lshapeInfo.cornerType === "first" ||
            lshapeInfo.cornerType === "both") &&
          isFirstColumn
        ) {
          return {
            min: lshapeInfo.minFirstColumnWidth!,
            max: 120,
            note: `Entre ${lshapeInfo.minFirstColumnWidth} et 120 cm (corner)`,
            isSpecial: true,
          };
        }
      }

      // Normal column constraints
      return {
        min: 30,
        max: 120,
        note: "Entre 30 et 120 cm",
        isSpecial: false,
      };
    };

    // Handle column count change
    const handleColumnCountChange = (newCount: number) => {
      setColumnCount(sectionKey, newCount);
    };

    // Handle individual column width change với simple adjacent redistribution
    const handleColumnWidthChange = (columnId: string, newWidth: number) => {
      handleUpdateColumnWidth(sectionKey, columnId, newWidth);
    };

    return (
      <div className="accordion-item" key={sectionKey}>
        <h2 className="accordion-header" id={`headingColonnes${sectionName}`}>
          <button
            className="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target={`#collapseColonnes${sectionName}`}
            aria-expanded="false"
            aria-controls={`collapseColonnes${sectionName}`}
          >
            Section {sectionName} ({section.columns.length} colonnes)
            {!validation.isValid && (
              <span className="text-danger ms-2">⚠️</span>
            )}
          </button>
        </h2>
        <div
          id={`collapseColonnes${sectionName}`}
          className="accordion-collapse collapse"
          aria-labelledby={`headingColonnes${sectionName}`}
          data-bs-parent="#colonnesAccordion"
        >
          <div className="accordion-body">
            {/* Column Count Input */}
            <div className="mb-4">
              <label className="form-label">
                <strong>Nombre de colonnes:</strong>
              </label>
              <div className="d-flex align-items-center gap-2">
                <div className="input-group w-100">
                  <input
                    type="number"
                    className="form-control"
                    value={section.columns.length}
                    min={minCols}
                    max={maxCols}
                    onChange={(e) =>
                      handleColumnCountChange(
                        parseInt(e.target.value) || minCols
                      )
                    }
                  />
                  <span className="input-group-text">col</span>
                </div>
                {/* Auto redistribute button */}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => redistributeColumnsEvenly(sectionKey)}
                  title="Redistribuer largeurs également"
                >
                  ⚖️
                </button>
              </div>
              <small className="text-muted">
                Entre {minCols} et {maxCols}
              </small>
            </div>

            {/* Column Width Inputs */}
            <div className="mb-4">
              <h6 className="mb-3">Largeur des colonnes:</h6>
              {section.columns.map((column, index) => {
                const constraints = getColumnConstraints(index);
                const isLastColumn = index === section.columns.length - 1;
                const hasSpecialConstraint =
                  lshapeInfo.isCornerSection && isLastColumn;

                return (
                  <div key={column.id} className="mb-3">
                    <label className="form-label">Colonne {index + 1}:</label>
                    <div className="input-group w-100">
                      <input
                        type="number"
                        className={`form-control ${
                          column.width < constraints.min ||
                          column.width > constraints.max
                            ? "is-invalid"
                            : hasSpecialConstraint
                            ? "border-info"
                            : ""
                        }`}
                        value={column.width}
                        min={constraints.min}
                        max={constraints.max}
                        onChange={(e) =>
                          handleColumnWidthChange(
                            column.id,
                            parseInt(e.target.value) || constraints.min
                          )
                        }
                      />
                      <span className="input-group-text">cm</span>
                    </div>
                    <small className="text-muted">{constraints.note}</small>
                  </div>
                );
              })}
            </div>

            {/* Section Summary */}
            <div className="mt-3 p-2 bg-light rounded">
              <small className="text-muted">
                <strong>Résumé:</strong>
                <br />
                Largeur totale utilisée: {spaceInfo.totalUsed}cm /{" "}
                {section.width}cm
                <br />
                Espace restant: {spaceInfo.remaining}cm
                {spaceInfo.canAddMoreColumns && (
                  <>
                    <br />
                    💡 <em>Peut ajouter au moins 1 colonne de plus</em>
                  </>
                )}
              </small>
            </div>

            {/* Validation Messages */}
            {validation.errors.length > 0 && (
              <div className="alert alert-danger mt-3">
                <small>
                  ❌ Erreurs:
                  <ul className="mb-0 mt-1">
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </small>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="alert alert-warning mt-3">
                <small>
                  ⚠️ Avertissements:
                  <ul className="mb-0 mt-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </small>
              </div>
            )}

            {/* Success message */}
            {validation.isValid && validation.warnings.length === 0 && (
              <div className="alert alert-success mt-3">
                <small>✅ Configuration valide</small>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="accordion-item">
      <h2 className="accordion-header" id="headingColonnes">
        <button
          className="accordion-button collapsed"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#collapseColonnes"
          aria-expanded="false"
          aria-controls="collapseColonnes"
        >
          4. Colonnes
        </button>
      </h2>
      <div
        id="collapseColonnes"
        className="accordion-collapse collapse"
        aria-labelledby="headingColonnes"
        data-bs-parent="#configAccordion"
      >
        <div className="accordion-body">
          <div className="text-secondary mb-3">
            Configurez le nombre de colonnes et leur largeur individuelle.
          </div>

          {/* Nested Accordion for Sections Columns */}
          <div className="accordion" id="colonnesAccordion">
            {config.wardrobeType.sections.sectionA &&
              renderSectionColumns(
                "sectionA",
                "A",
                config.wardrobeType.sections.sectionA
              )}

            {config.wardrobeType.sections.sectionB &&
              renderSectionColumns(
                "sectionB",
                "B",
                config.wardrobeType.sections.sectionB
              )}

            {config.wardrobeType.sections.sectionC &&
              renderSectionColumns(
                "sectionC",
                "C",
                config.wardrobeType.sections.sectionC
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnsSection;
