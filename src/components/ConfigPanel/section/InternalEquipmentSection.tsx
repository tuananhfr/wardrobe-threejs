import React, { useEffect, useState } from "react";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";
import inner from "@/assets/images/inner.svg";
import empty from "@/assets/images/empty.svg";
import rail from "@/assets/images/rail.svg";

const InternalEquipmentSection: React.FC = () => {
  const { config, updateConfig } = useWardrobeConfig();

  // State for tooltip
  const [hoveredButton, setHoveredButton] = useState<{
    type: string;
    x: number;
    y: number;
  } | null>(null);

  // Check if internal equipment accordion is open
  const isInternalEquipmentOpen =
    config.accordionOpen === "collapseInternalEquipment";

  // Handle accordion toggle
  const handleAccordionToggle = () => {
    const newState = isInternalEquipmentOpen ? "" : "collapseInternalEquipment";
    updateConfig("accordionOpen", newState);

    // Clear selection when closing accordion
    if (isInternalEquipmentOpen) {
      updateConfig("selectedColumnId", null);
      updateConfig("selectedSpacingId", null);
      updateConfig("selectedInternalEquipmentType", null);
    }
  };

  // Get spacing height from selectedSpacingId
  const getSpacingHeight = (spacingId: string): number | null => {
    if (!spacingId) return null;

    // Parse spacingId format: "sectionA-col-1-spacing-3"
    const parts = spacingId.split("-");
    if (parts.length < 4) return null;

    // Extract column ID and spacing index
    let columnId: string;
    let spacingIndex: number;

    if (parts.length === 5 && parts[1] === "col" && parts[3] === "spacing") {
      // Format: "sectionA-col-1-spacing-3"
      columnId = `${parts[0]}-${parts[1]}-${parts[2]}`; // "sectionA-col-1"
      spacingIndex = parseInt(parts[4]); // 3
    } else {
      // Fallback to old format: "columnId-spacing-index"
      columnId = parts[0];
      spacingIndex = parseInt(parts[2]);
    }

    // Find the column in sections
    for (const [, section] of Object.entries(config.wardrobeType.sections)) {
      if (section && section.columns) {
        const column = section.columns.find((col: any) => col.id === columnId);
        if (column) {
          const spacings = column.shelves?.spacings || [];

          // If no spacings, return full column height
          if (spacings.length === 0) {
            return config.height - config.baseBarHeight - 2 * config.thickness;
          }

          // Return spacing height if index exists
          if (spacingIndex >= 0 && spacingIndex < spacings.length) {
            return spacings[spacingIndex].spacing;
          }
        }
      }
    }

    return null;
  };

  // Check if trigle button should be disabled
  const isTrigleDisabled = (): boolean => {
    if (!config.selectedSpacingId) return false;

    const spacingHeight = getSpacingHeight(config.selectedSpacingId);
    if (spacingHeight === null) return false;

    // Disable if spacing height is less than 80cm
    return spacingHeight < 80;
  };

  // Update selected equipment type based on selected spacing
  useEffect(() => {
    if (config.selectedSpacingId) {
      const equipmentType =
        config.internalEquipmentConfig[config.selectedSpacingId];
      if (equipmentType) {
        updateConfig("selectedInternalEquipmentType", equipmentType);
      } else {
        updateConfig("selectedInternalEquipmentType", null);
      }
    } else {
      updateConfig("selectedInternalEquipmentType", null);
    }
  }, [config.selectedSpacingId, config.internalEquipmentConfig]);

  // NEW LOGIC: Update selected equipment type when rail is removed due to small spacing
  useEffect(() => {
    if (config.selectedSpacingId) {
      const spacingHeight = getSpacingHeight(config.selectedSpacingId);
      const currentEquipment =
        config.internalEquipmentConfig[config.selectedSpacingId];

      // If spacing is too small and has trigle, remove it and set to vide
      if (
        spacingHeight !== null &&
        spacingHeight < 80 &&
        currentEquipment === "trigle"
      ) {
        // Remove trigle from config
        const updatedConfig = { ...config.internalEquipmentConfig };
        delete updatedConfig[config.selectedSpacingId];

        // Update config
        updateConfig("internalEquipmentConfig", updatedConfig);

        // Update selected equipment type to vide
        updateConfig("selectedInternalEquipmentType", "vide");
      }
    }
  }, [config.selectedSpacingId, config.internalEquipmentConfig]);

  // Reset selection and hover when accordion changes
  useEffect(() => {
    // Only reset when accordion changes to a different one, not when staying in the same accordion
    if (
      config.accordionOpen !== "collapseInternalEquipment" &&
      config.accordionOpen !== "collapseEtageres" &&
      config.accordionOpen !== ""
    ) {
      // Reset selected column when this accordion is not open
      if (config.selectedColumnId) {
        updateConfig("selectedColumnId", null);
      }
      // Reset selected spacing when this accordion is not open
      if (config.selectedSpacingId) {
        updateConfig("selectedSpacingId", null);
      }
      // Reset hovered column when this accordion is not open
      if (config.hoveredColumnId) {
        updateConfig("hoveredColumnId", null);
      }
      // Reset hovered spacing when this accordion is not open
      if (config.hoveredSpacingId) {
        updateConfig("hoveredSpacingId", null);
      }
      // Reset selected internal equipment type when this accordion is not open
      if (config.selectedInternalEquipmentType) {
        updateConfig("selectedInternalEquipmentType", null);
      }
    }
  }, [config.accordionOpen, updateConfig]);

  // Handle internal equipment type selection
  const handleEquipmentTypeSelect = (type: "vide" | "trigle") => {
    // Prevent selecting trigle if spacing is too small
    if (type === "trigle" && isTrigleDisabled()) {
      return;
    }

    updateConfig("selectedInternalEquipmentType", type);

    // Save equipment configuration for the selected spacing
    if (config.selectedSpacingId) {
      updateConfig("internalEquipmentConfig", {
        ...config.internalEquipmentConfig,
        [config.selectedSpacingId]: type,
      });
    }
  };

  // Handle tooltip display - chỉ cho disabled button
  const handleTrigleMouseEnter = (event: React.MouseEvent) => {
    if (isTrigleDisabled()) {
      const rect = event.currentTarget.getBoundingClientRect();
      setHoveredButton({
        type: "trigle",
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    }
  };

  const handleTrigleMouseLeave = () => {
    setHoveredButton(null);
  };

  const renderSelectionPrompt = () => (
    <div className="text-center py-5">
      <p className="text-secondary">
        Cliquez sur un des casiers pour découvrir les équipements intérieurs
        disponibles.
      </p>
      <div className="mt-4">
        <div style={{ minHeight: "200px" }}>
          <img src={inner} alt="inner" />
        </div>
      </div>
    </div>
  );

  const renderEquipmentTypeButtons = () => {
    const trigleDisabled = isTrigleDisabled();
    const spacingHeight = config.selectedSpacingId
      ? getSpacingHeight(config.selectedSpacingId)
      : null;

    return (
      <div className="p-4">
        <h6 className="mb-3">Choisir le type d'équipement interne</h6>
        <div className="row g-3">
          <div className="col-6">
            <button
              className="btn w-100 p-3"
              onClick={() => handleEquipmentTypeSelect("vide")}
              style={{
                height: "120px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${
                  config.selectedInternalEquipmentType === "vide"
                    ? "#0d6efd"
                    : "#dee2e6"
                }`,
                backgroundColor: "transparent",
              }}
            >
              <div className="mb-2" style={{ fontSize: "2rem" }}>
                <img
                  src={empty}
                  alt="Vide"
                  style={{ width: "40px", height: "40px" }}
                />
              </div>
              <span
                className={`fw-bold ${
                  config.selectedInternalEquipmentType === "vide"
                    ? "text-primary"
                    : ""
                }`}
              >
                Vide
              </span>
            </button>
          </div>
          <div className="col-6">
            <div
              onMouseEnter={handleTrigleMouseEnter}
              onMouseLeave={handleTrigleMouseLeave}
              style={{ position: "relative" }}
            >
              <button
                className={`btn w-100 p-3 ${trigleDisabled ? "disabled" : ""}`}
                onClick={() => handleEquipmentTypeSelect("trigle")}
                disabled={trigleDisabled}
                style={{
                  height: "120px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${
                    config.selectedInternalEquipmentType === "trigle"
                      ? "#0d6efd"
                      : "#dee2e6"
                  }`,
                  backgroundColor: trigleDisabled ? "#f8f9fa" : "transparent",
                  opacity: trigleDisabled ? 0.6 : 1,
                  cursor: trigleDisabled ? "not-allowed" : "pointer",
                }}
              >
                <div className="mb-2" style={{ fontSize: "2rem" }}>
                  <img
                    src={rail}
                    alt="Trigle"
                    style={{
                      width: "40px",
                      height: "40px",
                      opacity: trigleDisabled ? 0.5 : 1,
                    }}
                  />
                </div>
                <span
                  className={`fw-bold ${
                    config.selectedInternalEquipmentType === "trigle"
                      ? "text-primary"
                      : trigleDisabled
                      ? "text-muted"
                      : ""
                  }`}
                >
                  Trigle
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Tooltip - message đơn giản như alert */}
        {hoveredButton && trigleDisabled && (
          <div
            className="position-fixed bg-white text-dark p-3 rounded shadow-lg border"
            style={{
              left: hoveredButton.x - 175,
              top: hoveredButton.y - 80,
              zIndex: 9999,
              pointerEvents: "none",
              minWidth: "350px",
              fontSize: "14px",
            }}
          >
            <div className="d-flex align-items-center">
              <span>
                <p className="fw-bold">
                  Cette option est compatible avec des dimensions de casier de :
                </p>
                <p>❌ &lt; 80 cm de hauteur (courant {spacingHeight} cm)</p>
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="accordion-item">
      <h2 className="accordion-header" id="headingInternalEquipment">
        <button
          className="accordion-button collapsed"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#collapseInternalEquipment"
          aria-expanded={isInternalEquipmentOpen}
          aria-controls="collapseInternalEquipment"
          onClick={handleAccordionToggle}
        >
          6. Choisir les équipements internes
        </button>
      </h2>
      <div
        id="collapseInternalEquipment"
        className={`accordion-collapse collapse ${
          isInternalEquipmentOpen ? "show" : ""
        }`}
        aria-labelledby="headingInternalEquipment"
        data-bs-parent="#configAccordion"
      >
        <div className="accordion-body">
          {config.selectedSpacingId
            ? renderEquipmentTypeButtons()
            : renderSelectionPrompt()}
        </div>
      </div>
    </div>
  );
};

export default InternalEquipmentSection;
