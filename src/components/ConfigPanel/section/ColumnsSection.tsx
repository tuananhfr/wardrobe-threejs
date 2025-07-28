// src/components/ConfigPanel/ColumnsSection.tsx
import React from "react";
import DimensionControl from "../section/DimensionControl";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";
import { useWardrobeColumns } from "@/hooks/useWardrobeColumns";
import { useColumnSeparators } from "@/hooks/useColumnSeparators";

const ColumnsSection: React.FC = () => {
  const { config } = useWardrobeConfig();
  const {
    calculateMaxColumns,
    calculateMinColumns,
    handleUpdateColumnWidth,
    setColumnCount,
  } = useWardrobeColumns();
  const { calculateSeparators, getSeparatorRange, handleMoveSeparator } =
    useColumnSeparators();

  const renderSectionColumns = (
    sectionKey: SectionKey,
    sectionName: string,
    section: WardrobeSection
  ) => {
    const separators = calculateSeparators(section, config.thickness);
    const dynamicMaxColumns = calculateMaxColumns(
      section.width,
      config.thickness
    );
    const dynamicMinColumns = calculateMinColumns(
      section.width,
      config.thickness
    );

    const minCols = dynamicMinColumns;
    const maxCols = dynamicMaxColumns;

    console.log("dynamicMinColumns", dynamicMinColumns);
    console.log("dynamicMaxColumns", dynamicMaxColumns);

    // Handle column count change
    const handleColumnCountChange = (newCount: number) => {
      setColumnCount(sectionKey, newCount);
    };

    // Handle individual column width change
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
          </button>
        </h2>
        <div
          id={`collapseColonnes${sectionName}`}
          className="accordion-collapse collapse"
          aria-labelledby={`headingColonnes${sectionName}`}
          data-bs-parent="#colonnesAccordion"
        >
          <div className="accordion-body">
            {/* Column Constraints Info */}
            <div className="mb-3 p-2 bg-info text-dark rounded">
              <small>
                <strong>Contraintes:</strong> Min: {minCols} colonnes | Max:{" "}
                {maxCols} colonnes | Largeur/colonne: 30-120cm
              </small>
            </div>

            {/* Column Count Input */}
            <div className="mb-4">
              <label className="form-label">
                <strong>Nombre de colonnes:</strong>
              </label>
              <div className="input-group" style={{ width: "150px" }}>
                <input
                  type="number"
                  className="form-control"
                  value={section.columns.length}
                  min={minCols}
                  max={maxCols}
                  onChange={(e) =>
                    handleColumnCountChange(parseInt(e.target.value) || minCols)
                  }
                />
                <span className="input-group-text">col</span>
              </div>
              <small className="text-muted">
                Min: {minCols}, Max: {maxCols}
              </small>
            </div>

            {/* Column Width Inputs */}
            <div className="mb-4">
              <h6 className="mb-3">Largeur des colonnes:</h6>
              {section.columns.map((column, index) => (
                <div key={column.id} className="mb-3">
                  <label className="form-label">Colonne {index + 1}:</label>
                  <div className="input-group" style={{ width: "150px" }}>
                    <input
                      type="number"
                      className="form-control"
                      value={column.width}
                      min={30}
                      max={120}
                      onChange={(e) =>
                        handleColumnWidthChange(
                          column.id,
                          parseInt(e.target.value) || 30
                        )
                      }
                    />
                    <span className="input-group-text">cm</span>
                  </div>
                  <small className="text-muted">30-120cm</small>
                </div>
              ))}
            </div>

            {/* Column Layout Visualization */}
            <div className="mb-4 p-3 border rounded bg-light">
              <h6 className="mb-3">Aperçu du layout:</h6>
              <div
                className="d-flex align-items-center gap-1"
                style={{ fontSize: "12px" }}
              >
                {section.columns.map((column, index) => (
                  <React.Fragment key={column.id}>
                    {/* Column Block */}
                    <div
                      className="bg-primary text-white text-center py-2 px-1 rounded"
                      style={{
                        width: `${(column.width / section.width) * 100}%`,
                        minWidth: "40px",
                      }}
                    >
                      Col {index + 1}
                      <br />
                      {column.width}cm
                    </div>

                    {/* Separator (if not last column) */}
                    {index < section.columns.length - 1 && (
                      <div
                        className="bg-secondary"
                        style={{
                          width: `${(config.thickness / section.width) * 100}%`,
                          height: "30px",
                          minWidth: "2px",
                        }}
                        title={`Séparateur ${config.thickness}cm`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Separator Controls (Optional - nếu vẫn muốn giữ) */}
            {separators.length > 0 && (
              <div className="mb-4">
                <h6 className="mb-3">Position des séparateurs (optionnel):</h6>
                {separators.map((separator, index) => {
                  const range = getSeparatorRange(
                    section,
                    index,
                    config.thickness
                  );
                  const leftColumn = section.columns.find(
                    (col) => col.id === separator.leftColumnId
                  );
                  const rightColumn = section.columns.find(
                    (col) => col.id === separator.rightColumnId
                  );

                  return (
                    <div key={separator.id} className="mb-3 p-3 border rounded">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">Séparateur {index + 1}</h6>
                        <small className="text-muted">
                          Entre Col{leftColumn?.id} et Col{rightColumn?.id}
                        </small>
                      </div>

                      <DimensionControl
                        label={`Position (${leftColumn?.width}cm ← → ${rightColumn?.width}cm)`}
                        value={separator.position}
                        min={range.min}
                        max={range.max}
                        step={1}
                        onChange={(value) =>
                          handleMoveSeparator(sectionKey, index, value)
                        }
                      />

                      <div className="mt-1">
                        <small className="text-muted">
                          Range: {range.min}cm - {range.max}cm
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Section Summary */}
            <div className="mt-3 p-2 bg-light rounded">
              <small className="text-muted">
                <strong>Résumé:</strong>
                <br />
                Largeur totale utilisée:{" "}
                {(() => {
                  const columnsWidth = section.columns.reduce(
                    (sum, col) => sum + col.width,
                    0
                  );
                  const panelsWidth =
                    section.columns.length === 1
                      ? 2 * config.thickness // 1 column: chỉ left + right walls
                      : (section.columns.length + 1) * config.thickness; // n columns: (n+1) panels
                  return columnsWidth + panelsWidth;
                })()}
                cm / {section.width}cm
                <br />
                Espace restant:{" "}
                {(() => {
                  const columnsWidth = section.columns.reduce(
                    (sum, col) => sum + col.width,
                    0
                  );
                  const panelsWidth =
                    section.columns.length === 1
                      ? 2 * config.thickness // 1 column: chỉ left + right walls
                      : (section.columns.length + 1) * config.thickness; // n columns: (n+1) panels
                  const totalUsed = columnsWidth + panelsWidth;
                  return section.width - totalUsed;
                })()}
                cm
              </small>
            </div>

            {/* Validation Messages */}
            {section.columns.some(
              (col) => col.width < 30 || col.width > 120
            ) && (
              <div className="alert alert-warning mt-3">
                <small>
                  ⚠️ Certaines colonnes ont une largeur invalide (30-120cm
                  requis)
                </small>
              </div>
            )}

            {/* Total Width Validation */}
            {(() => {
              const columnsWidth = section.columns.reduce(
                (sum, col) => sum + col.width,
                0
              );
              const panelsWidth =
                section.columns.length === 1
                  ? 2 * config.thickness // 1 column: chỉ left + right walls
                  : (section.columns.length + 1) * config.thickness; // n columns: (n+1) panels
              const totalUsed = columnsWidth + panelsWidth;
              const remainingSpace = section.width - totalUsed;

              if (remainingSpace < 0) {
                return (
                  <div className="alert alert-danger mt-3">
                    <small>
                      ❌ Largeur totale dépasse la section de{" "}
                      {Math.abs(remainingSpace)}cm
                    </small>
                  </div>
                );
              }
              return null;
            })()}
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
