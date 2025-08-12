import React, { useEffect, useState, useRef } from "react";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";
import facades from "@/assets/images/facades.svg";
import door from "@/assets/images/door.svg";
import drawer from "@/assets/images/drawer.svg";

import empty from "@/assets/images/empty.svg";
import doubleSwingDoor from "@/assets/images/door_both.svg";
import leftDoor from "@/assets/images/left.svg";
import rightDoor from "@/assets/images/right.svg";

const DoorsDrawersSection: React.FC = () => {
  const { config, updateConfig } = useWardrobeConfig();

  // State for tooltip
  const [hoveredButton, setHoveredButton] = useState<{
    type: string;
    x: number;
    y: number;
  } | null>(null);

  // Track previous accordionOpen to detect actual changes
  const prevAccordionOpenRef = useRef<string | null>(null);

  // Check if doors drawers accordion is open
  const isDoorsDrawersOpen = config.accordionOpen === "collapseDoorsDrawers";

  // Handle accordion toggle
  const handleAccordionToggle = () => {
    const newState = isDoorsDrawersOpen ? "" : "collapseDoorsDrawers";
    updateConfig("accordionOpen", newState);

    // Clear selection when closing accordion
    if (isDoorsDrawersOpen) {
      updateConfig("selectedColumnId", null);
      updateConfig("selectedSpacingId", null);
      updateConfig("selectedDoorsDrawersType", null);
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

  // Check if drawer button should be disabled
  const isDrawerDisabled = (): boolean => {
    if (!config.selectedSpacingId) return false;

    const spacingHeight = getSpacingHeight(config.selectedSpacingId);
    if (spacingHeight === null) return false;

    // Disable if spacing height is less than 60cm
    return spacingHeight < 60;
  };

  // Update selected doors drawers type based on selected spacing
  useEffect(() => {
    if (config.selectedSpacingId) {
      const doorsDrawersType =
        config.doorsDrawersConfig[config.selectedSpacingId];
      if (doorsDrawersType) {
        updateConfig("selectedDoorsDrawersType", doorsDrawersType);
      } else {
        updateConfig("selectedDoorsDrawersType", null);
      }
    } else {
      updateConfig("selectedDoorsDrawersType", null);
    }
  }, [config.selectedSpacingId, config.doorsDrawersConfig]);

  // NEW LOGIC: Update selected doors drawers type when drawer is removed due to small spacing
  useEffect(() => {
    if (config.selectedSpacingId) {
      const spacingHeight = getSpacingHeight(config.selectedSpacingId);
      const currentDoorsDrawers =
        config.doorsDrawersConfig[config.selectedSpacingId];

      // If spacing is too small and has drawer, remove it and set to door
      if (
        spacingHeight !== null &&
        spacingHeight < 60 &&
        currentDoorsDrawers === "drawer"
      ) {
        // Remove drawer from config
        const updatedConfig = { ...config.doorsDrawersConfig };
        delete updatedConfig[config.selectedSpacingId];

        // Update config
        updateConfig("doorsDrawersConfig", updatedConfig);

        // Update selected doors drawers type to null (force reselect)
        updateConfig("selectedDoorsDrawersType", null as any);
      }
    }
  }, [config.selectedSpacingId, config.doorsDrawersConfig]);

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
      // Reset selected spacing when switching to a different accordion
      if (config.selectedSpacingId) {
        updateConfig("selectedSpacingId", null);
      }
      // Reset hovered column when switching to a different accordion
      if (config.hoveredColumnId) {
        updateConfig("hoveredColumnId", null);
      }
      // Reset hovered spacing when switching to a different accordion
      if (config.hoveredSpacingId) {
        updateConfig("hoveredSpacingId", null);
      }
      // Reset selected doors drawers type when switching to a different accordion
      if (config.selectedDoorsDrawersType) {
        updateConfig("selectedDoorsDrawersType", null);
      }
    }

    // Update the previous accordion open reference
    prevAccordionOpenRef.current = currentAccordionOpen;
  }, [config.accordionOpen, updateConfig]);

  // Handle doors drawers type selection
  const handleDoorsDrawersTypeSelect = (
    type:
      | "vide"
      | "leftDoor"
      | "rightDoor"
      | "drawer"
      | "doubleSwingDoor"
      | "slidingDoor"
      | "slidingMirrorDoor"
  ) => {
    // Prevent selecting drawer if spacing is too small
    if (type === "drawer" && isDrawerDisabled()) {
      return;
    }

    if (type === "vide") {
      updateConfig("selectedDoorsDrawersType", null);
      if (config.selectedSpacingId) {
        const updated = { ...config.doorsDrawersConfig } as any;
        delete updated[config.selectedSpacingId];
        updateConfig("doorsDrawersConfig", updated);
      }
      return;
    }

    updateConfig("selectedDoorsDrawersType", type as any);

    // Save doors drawers configuration for the selected spacing
    if (config.selectedSpacingId) {
      updateConfig("doorsDrawersConfig", {
        ...config.doorsDrawersConfig,
        [config.selectedSpacingId]: type as any,
      });
    }
  };

  // Handle tooltip display - chỉ cho disabled button
  const handleDrawerMouseEnter = (event: React.MouseEvent) => {
    if (isDrawerDisabled()) {
      const rect = event.currentTarget.getBoundingClientRect();
      setHoveredButton({
        type: "drawer",
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    }
  };

  const handleDrawerMouseLeave = () => {
    setHoveredButton(null);
  };

  const renderSelectionPrompt = () => (
    <div className="text-center py-5">
      <p className="text-secondary">
        Cliquez sur un des casiers pour ajouter une porte ou un tiroir.
      </p>
      <div className="mt-4">
        <div style={{ minHeight: "200px" }}>
          <img src={facades} alt="facades" />
        </div>
      </div>
      <p className="text-secondary">
        Pour ajouter une porte sur plusieurs casiers, cliquer-glisser
        verticalement votre souris sur les casiers concernés.
      </p>
    </div>
  );

  const renderDoorsDrawersTypeButtons = () => {
    const drawerDisabled = isDrawerDisabled();
    const spacingHeight = config.selectedSpacingId
      ? getSpacingHeight(config.selectedSpacingId)
      : null;

    return (
      <div className="p-4">
        <h6 className="mb-3">Choisir le type de porte ou tiroir</h6>
        <div className="row g-3">
          {/* Vide */}
          <div className="col-6">
            <button
              className="btn w-100 p-3"
              onClick={() => handleDoorsDrawersTypeSelect("vide")}
              style={{
                height: "120px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${
                  config.selectedDoorsDrawersType === null
                    ? "#0d6efd"
                    : "#dee2e6"
                }`,
                backgroundColor: "transparent",
              }}
            >
              <div className="mb-2" style={{ fontSize: "2rem" }}>
                <img src={empty} alt="Vide" style={{ width: 40, height: 40 }} />
              </div>
              <span
                className={`fw-bold ${
                  config.selectedDoorsDrawersType === null ? "text-primary" : ""
                }`}
              >
                Vide
              </span>
            </button>
          </div>

          {/* Porte Gauche */}
          <div className="col-6">
            <button
              className="btn w-100 p-3"
              onClick={() => handleDoorsDrawersTypeSelect("leftDoor")}
              style={{
                height: "120px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${
                  config.selectedDoorsDrawersType === "leftDoor"
                    ? "#0d6efd"
                    : "#dee2e6"
                }`,
                backgroundColor: "transparent",
              }}
            >
              <div className="mb-2" style={{ fontSize: "2rem" }}>
                <img
                  src={leftDoor}
                  alt="Porte Gauche"
                  style={{ width: 40, height: 40 }}
                />
              </div>
              <span
                className={`fw-bold ${
                  config.selectedDoorsDrawersType === "leftDoor"
                    ? "text-primary"
                    : ""
                }`}
              >
                Porte Gauche
              </span>
            </button>
          </div>

          {/* Porte Droite */}
          <div className="col-6">
            <button
              className="btn w-100 p-3"
              onClick={() => handleDoorsDrawersTypeSelect("rightDoor")}
              style={{
                height: "120px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${
                  config.selectedDoorsDrawersType === "rightDoor"
                    ? "#0d6efd"
                    : "#dee2e6"
                }`,
                backgroundColor: "transparent",
              }}
            >
              <div className="mb-2" style={{ fontSize: "2rem" }}>
                <img
                  src={rightDoor}
                  alt="Porte Droite"
                  style={{ width: 40, height: 40 }}
                />
              </div>
              <span
                className={`fw-bold ${
                  config.selectedDoorsDrawersType === "rightDoor"
                    ? "text-primary"
                    : ""
                }`}
              >
                Porte Droite
              </span>
            </button>
          </div>

          {/* Tiroir */}
          <div className="col-6">
            <div
              onMouseEnter={handleDrawerMouseEnter}
              onMouseLeave={handleDrawerMouseLeave}
              style={{ position: "relative" }}
            >
              <button
                className={`btn w-100 p-3 ${drawerDisabled ? "disabled" : ""}`}
                onClick={() => handleDoorsDrawersTypeSelect("drawer")}
                disabled={drawerDisabled}
                style={{
                  height: "120px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${
                    config.selectedDoorsDrawersType === "drawer"
                      ? "#0d6efd"
                      : "#dee2e6"
                  }`,
                  backgroundColor: drawerDisabled ? "#f8f9fa" : "transparent",
                  opacity: drawerDisabled ? 0.6 : 1,
                  cursor: drawerDisabled ? "not-allowed" : "pointer",
                }}
              >
                <div className="mb-2" style={{ fontSize: "2rem" }}>
                  <img
                    src={drawer}
                    alt="Tiroir"
                    style={{
                      width: 40,
                      height: 40,
                      opacity: drawerDisabled ? 0.5 : 1,
                    }}
                  />
                </div>
                <span
                  className={`fw-bold ${
                    config.selectedDoorsDrawersType === "drawer"
                      ? "text-primary"
                      : drawerDisabled
                      ? "text-muted"
                      : ""
                  }`}
                >
                  Tiroir
                </span>
              </button>
            </div>
          </div>

          {/* Porte double battant */}
          <div className="col-6">
            <button
              className="btn w-100 p-3"
              onClick={() => handleDoorsDrawersTypeSelect("doubleSwingDoor")}
              style={{
                height: "120px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${
                  config.selectedDoorsDrawersType === "doubleSwingDoor"
                    ? "#0d6efd"
                    : "#dee2e6"
                }`,
                backgroundColor: "transparent",
              }}
            >
              <div className="mb-2" style={{ fontSize: "2rem" }}>
                <img
                  src={doubleSwingDoor}
                  alt="Porte double battant"
                  style={{ width: 40, height: 40 }}
                />
              </div>
              <span
                className={`fw-bold ${
                  config.selectedDoorsDrawersType === "doubleSwingDoor"
                    ? "text-primary"
                    : ""
                }`}
              >
                Porte double battant
              </span>
            </button>
          </div>

          {/* Porte coulissante */}
          <div className="col-6">
            <button
              className="btn w-100 p-3"
              onClick={() => handleDoorsDrawersTypeSelect("slidingDoor")}
              style={{
                height: "120px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${
                  config.selectedDoorsDrawersType === "slidingDoor"
                    ? "#0d6efd"
                    : "#dee2e6"
                }`,
                backgroundColor: "transparent",
              }}
            >
              <div className="mb-2" style={{ fontSize: "2rem" }}>
                {/* placeholder */}
                <img
                  src={door}
                  alt="Porte coulissante"
                  style={{ width: 40, height: 40 }}
                />
              </div>
              <span
                className={`fw-bold ${
                  config.selectedDoorsDrawersType === "slidingDoor"
                    ? "text-primary"
                    : ""
                }`}
              >
                Porte coulissante
              </span>
            </button>
          </div>

          {/* Porte coulissante en miroir */}
          <div className="col-6">
            <button
              className="btn w-100 p-3"
              onClick={() => handleDoorsDrawersTypeSelect("slidingMirrorDoor")}
              style={{
                height: "120px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${
                  config.selectedDoorsDrawersType === "slidingMirrorDoor"
                    ? "#0d6efd"
                    : "#dee2e6"
                }`,
                backgroundColor: "transparent",
              }}
            >
              <div className="mb-2" style={{ fontSize: "2rem" }}>
                {/* placeholder */}
                <img
                  src={door}
                  alt="Porte coulissante en miroir"
                  style={{ width: 40, height: 40 }}
                />
              </div>
              <span
                className={`fw-bold ${
                  config.selectedDoorsDrawersType === "slidingMirrorDoor"
                    ? "text-primary"
                    : ""
                }`}
              >
                Porte coulissante en miroir
              </span>
            </button>
          </div>
        </div>

        {/* Tooltip - message đơn giản như alert */}
        {hoveredButton && drawerDisabled && (
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
                <p>❌ &lt; 60 cm de hauteur (courant {spacingHeight} cm)</p>
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="accordion-item">
      <h2 className="accordion-header" id="headingDoorsDrawers">
        <button
          className="accordion-button collapsed"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#collapseDoorsDrawers"
          aria-expanded={isDoorsDrawersOpen}
          aria-controls="collapseDoorsDrawers"
          onClick={handleAccordionToggle}
        >
          7. Ajouter des portes & des tiroirs
        </button>
      </h2>
      <div
        id="collapseDoorsDrawers"
        className={`accordion-collapse collapse ${
          isDoorsDrawersOpen ? "show" : ""
        }`}
        aria-labelledby="headingDoorsDrawers"
        data-bs-parent="#configAccordion"
      >
        <div className="accordion-body">
          {config.selectedSpacingId
            ? renderDoorsDrawersTypeButtons()
            : renderSelectionPrompt()}
        </div>
      </div>
    </div>
  );
};

export default DoorsDrawersSection;
