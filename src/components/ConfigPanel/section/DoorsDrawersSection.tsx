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
  const { 
    config, 
    updateConfig, 
    updateDoorsDrawersConfig,
    createOrUpdateGroup,
    areSpacingsConsecutiveInSameColumn 
  } = useWardrobeConfig();

  // State for tooltip
  const [hoveredButton, setHoveredButton] = useState<{
    type: string;
    x: number;
    y: number;
  } | null>(null);

  // State for sliding door tooltip
  const [hoveredSlidingDoor, setHoveredSlidingDoor] = useState<{
    type: string;
    x: number;
    y: number;
  } | null>(null);

  // Track previous accordionOpen to detect actual changes
  const prevAccordionOpenRef = useRef<string | null>(null);
  const justSelectedDrawerRef = useRef(false);

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

  // Get spacing width from selectedSpacingId
  const getSpacingWidth = (spacingId: string): number | null => {
    if (!spacingId) return null;

    // Parse spacingId format: "sectionA-col-1-spacing-3"
    const parts = spacingId.split("-");
    if (parts.length < 4) return null;

    // Extract column ID
    let columnId: string;

    if (parts.length === 5 && parts[1] === "col" && parts[3] === "spacing") {
      // Format: "sectionA-col-1-spacing-3"
      columnId = `${parts[0]}-${parts[1]}-${parts[2]}`; // "sectionA-col-1"
    } else {
      // Fallback to old format: "columnId-spacing-index"
      columnId = parts[0];
    }

    // Find the column in sections
    for (const [, section] of Object.entries(config.wardrobeType.sections)) {
      if (section && section.columns) {
        const column = section.columns.find((col: any) => col.id === columnId);
        if (column) {
          // Return column width (spacing width = column width)
          return column.width;
        }
      }
    }

    return null;
  };

  // Helper function to get section name from spacingId
  const getSectionNameFromSpacingId = (spacingId: string): string => {
    const parts = spacingId.split("-");
    if (parts.length >= 1) {
      return parts[0]; // "sectionA", "sectionB", etc.
    }
    return "";
  };

  // Helper function to get all spacingIds in the same section
  const getSpacingIdsInSection = (sectionName: string): string[] => {
    const spacingIds: string[] = [];

    for (const [sectionKey, section] of Object.entries(
      config.wardrobeType.sections
    )) {
      if (sectionKey === sectionName && section && section.columns) {
        section.columns.forEach((column: any) => {
          const spacings = column.shelves?.spacings || [];

          if (spacings.length === 0) {
            spacingIds.push(`${column.id}-spacing-0`);
          } else {
            for (let i = 0; i < spacings.length; i++) {
              spacingIds.push(`${column.id}-spacing-${i}`);
            }
          }
        });
      }
    }

    return spacingIds;
  };

  // Helper function to check if section has sliding door
  const getSectionSlidingDoorType = (sectionName: string): string | null => {
    const sectionSpacingIds = getSpacingIdsInSection(sectionName);

    for (const spacingId of sectionSpacingIds) {
      const doorType = config.doorsDrawersConfig[spacingId];
      if (
        doorType === "slidingDoor" ||
        doorType === "slidingMirrorDoor" ||
        doorType === "slidingGlassDoor"
      ) {
        return doorType;
      }
    }

    return null;
  };

  // Get the height from floor to the shelf below the selected spacing
  const getShelfBelowHeight = (spacingId: string): number | null => {
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

          // If this is the last spacing, there's no shelf below
          if (spacingIndex >= spacings.length - 1) {
            return null;
          }

          // Calculate height from floor to the shelf below this spacing
          let heightFromFloor = config.baseBarHeight + config.thickness; // Start from base bar + thickness

          // Add heights of all spacings up to the shelf below
          for (let i = 0; i <= spacingIndex + 1; i++) {
            if (i < spacings.length) {
              heightFromFloor += spacings[i].spacing;
            }
          }

          return heightFromFloor;
        }
      }
    }

    return null;
  };

  // Check if drawer button should be disabled
  const isDrawerDisabled = (): boolean => {
    if (!config.selectedSpacingId) return false;

    // Check if multiple spacings are selected
    const selectedSpacings = config.selectedSpacingIds || [];
    if (selectedSpacings.length > 1) {
      return true; // Disable drawer when multiple spacings are selected
    }

    const spacingHeight = getSpacingHeight(config.selectedSpacingId);
    if (spacingHeight === null) return false;

    // Check if shelf below is too high (> 100cm)
    const shelfBelowHeight = getShelfBelowHeight(config.selectedSpacingId);
    if (shelfBelowHeight !== null && shelfBelowHeight > 100) {
      return true; // Disable drawer when shelf below is too high
    }

    // Disable if spacing height is not between 10-60cm (mở rộng range)
    return spacingHeight < 10 || spacingHeight > 60;
  };

  // Check if double swing door button should be disabled
  const isDoubleSwingDoorDisabled = (): boolean => {
    if (!config.selectedSpacingId) return false;

    const spacingWidth = getSpacingWidth(config.selectedSpacingId);
    if (spacingWidth === null) return false;

    // Disable if spacing width is not between 40-109cm
    return spacingWidth < 40 || spacingWidth > 109;
  };

  // Check if left/right door button should be disabled
  const isLeftRightDoorDisabled = (): boolean => {
    if (!config.selectedSpacingId) return false;

    const spacingWidth = getSpacingWidth(config.selectedSpacingId);
    if (spacingWidth === null) return false;

    // Disable if spacing width is not between 26-60cm
    return spacingWidth < 26 || spacingWidth > 60;
  };

  // Update selected doors drawers type based on selected spacing
  useEffect(() => {
    console.log(
      "useEffect triggered - selectedSpacingId:",
      config.selectedSpacingId
    );
    console.log("current doorsDrawersConfig:", config.doorsDrawersConfig);

    if (config.selectedSpacingId) {
      // First, check if the selected spacing has a specific configuration
      const doorsDrawersType =
        config.doorsDrawersConfig[config.selectedSpacingId];
      console.log("Found doorsDrawersType for spacing:", doorsDrawersType);

      if (doorsDrawersType) {
        console.log("Setting selectedDoorsDrawersType to:", doorsDrawersType);
        updateConfig("selectedDoorsDrawersType", doorsDrawersType);
        return; // Don't override user's choice
      }

      // If no specific configuration exists, check if user explicitly chose "vide" (null)
      if (config.selectedDoorsDrawersType === null) {
        console.log("User chose vide, keeping null");
        return; // Don't override user's choice of "vide"
      }

      // Only apply sliding door logic if no specific configuration exists and user didn't choose vide
      const sectionName = getSectionNameFromSpacingId(config.selectedSpacingId);
      const sectionSlidingDoorType = getSectionSlidingDoorType(sectionName);

      // If section has sliding door, show it regardless of current spacing
      if (sectionSlidingDoorType) {
        console.log(
          "Section has sliding door, setting to:",
          sectionSlidingDoorType
        );
        updateConfig("selectedDoorsDrawersType", sectionSlidingDoorType as any);
        return;
      }

      // No configuration found
      console.log("No config found, setting to null");
      updateConfig("selectedDoorsDrawersType", null);
    } else {
      updateConfig("selectedDoorsDrawersType", null);
    }
  }, [config.selectedSpacingId, config.doorsDrawersConfig]); // Restore dependency

  // NEW LOGIC: Update selected doors drawers type when doors/drawers are removed due to unsuitable dimensions
  useEffect(() => {
    if (config.selectedSpacingId) {
      const spacingHeight = getSpacingHeight(config.selectedSpacingId);
      const spacingWidth = getSpacingWidth(config.selectedSpacingId);
      const currentDoorsDrawers =
        config.doorsDrawersConfig[config.selectedSpacingId];

      let shouldRemove = false;

      // Check if double swing door should be removed
      if (
        spacingWidth !== null &&
        (spacingWidth < 40 || spacingWidth > 109) &&
        (currentDoorsDrawers === "doubleSwingDoor" ||
          currentDoorsDrawers === "doubleSwingDoorVerre")
      ) {
        shouldRemove = true;
      }

      // Check if left/right door should be removed
      if (
        spacingWidth !== null &&
        (spacingWidth < 26 || spacingWidth > 60) &&
        (currentDoorsDrawers === "leftDoor" ||
          currentDoorsDrawers === "leftDoorVerre" ||
          currentDoorsDrawers === "rightDoor" ||
          currentDoorsDrawers === "rightDoorVerre")
      ) {
        shouldRemove = true;
      }

      // Check if drawer should be removed - but be more lenient
      if (
        spacingHeight !== null &&
        (spacingHeight < 10 || spacingHeight > 60) &&
        (currentDoorsDrawers === "drawer" ||
          currentDoorsDrawers === "drawerVerre") &&
        !justSelectedDrawerRef.current // Don't remove if user just selected it
      ) {
        shouldRemove = true;
      }

      if (shouldRemove) {
        // Remove from config using grouped doors logic
        updateDoorsDrawersConfig(config.selectedSpacingId, null);

        // Update selected doors drawers type to null (force reselect)
        updateConfig("selectedDoorsDrawersType", null as any);
      }
    }
  }, [config.selectedSpacingId, config.doorsDrawersConfig]);

  // GLOBAL LOGIC: Remove all incompatible doors/drawers when dimensions change
  useEffect(() => {
    // Check all configured spacings
    Object.keys(config.doorsDrawersConfig).forEach((spacingId) => {
      const doorsDrawersType = config.doorsDrawersConfig[spacingId];
      const spacingHeight = getSpacingHeight(spacingId);
      const spacingWidth = getSpacingWidth(spacingId);

      let shouldRemove = false;

      // Check if double swing door should be removed
      if (
        spacingWidth !== null &&
        (spacingWidth < 40 || spacingWidth > 109) &&
        (doorsDrawersType === "doubleSwingDoor" ||
          doorsDrawersType === "doubleSwingDoorVerre")
      ) {
        shouldRemove = true;
      }

      // Check if left/right door should be removed
      if (
        spacingWidth !== null &&
        (spacingWidth < 26 || spacingWidth > 60) &&
        (doorsDrawersType === "leftDoor" ||
          doorsDrawersType === "leftDoorVerre" ||
          doorsDrawersType === "rightDoor" ||
          doorsDrawersType === "rightDoorVerre")
      ) {
        shouldRemove = true;
      }

      // Check if drawer should be removed - but be more lenient
      if (
        spacingHeight !== null &&
        (spacingHeight < 10 || spacingHeight > 60) &&
        (doorsDrawersType === "drawer" || doorsDrawersType === "drawerVerre") &&
        !justSelectedDrawerRef.current // Don't remove if user just selected it
      ) {
        shouldRemove = true;
      }

      if (shouldRemove) {
        // Use grouped doors logic to remove
        updateDoorsDrawersConfig(spacingId, null);
      }
    });

    // Clear selected type if it was removed
    if (
      config.selectedSpacingId &&
      !config.doorsDrawersConfig[config.selectedSpacingId]
    ) {
      updateConfig("selectedDoorsDrawersType", null as any);
    }
  }, [
    config.wardrobeType,
    config.height,
    config.baseBarHeight,
    config.thickness,
  ]);

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
      | "leftDoorVerre"
      | "rightDoor"
      | "rightDoorVerre"
      | "drawer"
      | "drawerVerre"
      | "doubleSwingDoor"
      | "doubleSwingDoorVerre"
      | "slidingDoor"
      | "slidingMirrorDoor"
      | "slidingGlassDoor"
  ) => {
    // Set flag to prevent immediate removal of newly selected drawer
    if (type === "drawer" || type === "drawerVerre") {
      justSelectedDrawerRef.current = true;
      // Reset flag after a short delay
      setTimeout(() => {
        justSelectedDrawerRef.current = false;
      }, 1000);
    }

    // Prevent selecting drawer if spacing height is not suitable
    if ((type === "drawer" || type === "drawerVerre") && isDrawerDisabled()) {
      console.log("Drawer selection prevented - height not suitable");
      return;
    }

    // Prevent selecting double swing door if spacing width is not suitable
    if (
      (type === "doubleSwingDoor" || type === "doubleSwingDoorVerre") &&
      isDoubleSwingDoorDisabled()
    ) {
      return;
    }

    // Prevent selecting left/right door if spacing width is not suitable
    if (
      (type === "leftDoor" ||
        type === "leftDoorVerre" ||
        type === "rightDoor" ||
        type === "rightDoorVerre") &&
      isLeftRightDoorDisabled()
    ) {
      return;
    }

    if (type === "vide") {
      console.log("Selecting vide for spacing:", config.selectedSpacingId);
      updateConfig("selectedDoorsDrawersType", null);

      // Chỉ áp dụng vide cho các spacing đang được chọn (hoặc spacing hiện tại)
      const selectedSpacings = config.selectedSpacingIds || [];
      const targetSpacings =
        selectedSpacings.length > 0
          ? selectedSpacings
          : config.selectedSpacingId
          ? [config.selectedSpacingId]
          : [];

      if (targetSpacings.length > 0) {
        // Sử dụng grouped doors logic để xóa config
        targetSpacings.forEach((spacingId) => {
          updateDoorsDrawersConfig(spacingId, null);
        });
      }
      return;
    }

    updateConfig("selectedDoorsDrawersType", type as any);

    // Save doors drawers configuration for the selected spacings
    const selectedSpacings = config.selectedSpacingIds || [];
    const hasMultipleSelected = selectedSpacings.length > 0;
    const targetSpacings = hasMultipleSelected
      ? selectedSpacings
      : config.selectedSpacingId
      ? [config.selectedSpacingId]
      : [];

    if (targetSpacings.length > 0) {
      // If selecting sliding door, apply to all spacings in section
      if (
        type === "slidingDoor" ||
        type === "slidingMirrorDoor" ||
        type === "slidingGlassDoor"
      ) {
        // Get all sections that contain selected spacings
        const sectionsToUpdate = new Set<string>();
        targetSpacings.forEach((spacingId) => {
          const sectionName = getSectionNameFromSpacingId(spacingId);
          sectionsToUpdate.add(sectionName);
        });

        // Apply sliding door to all spacings in affected sections
        sectionsToUpdate.forEach((sectionName) => {
          const sectionSpacingIds = getSpacingIdsInSection(sectionName);

          // Clear all other door types in the section
          sectionSpacingIds.forEach((spacingId) => {
            updateDoorsDrawersConfig(spacingId, null);
          });

          // Apply sliding door to all spacings in section
          sectionSpacingIds.forEach((spacingId) => {
            updateDoorsDrawersConfig(spacingId, type);
          });
        });
      } else {
        // If selecting other door types, check if we should create a group
        if (hasMultipleSelected && areSpacingsConsecutiveInSameColumn(targetSpacings)) {
          // Create group for multiple selected spacings
          createOrUpdateGroup(targetSpacings, type);
          
          // Apply door type to all spacings in group
          targetSpacings.forEach((spacingId) => {
            updateDoorsDrawersConfig(spacingId, type);
          });
        } else {
          // Single selection or non-consecutive spacings
          targetSpacings.forEach((spacingId) => {
            if (spacingId) {
              // Remove sliding doors from the section first
              const sectionName = getSectionNameFromSpacingId(spacingId);
              const sectionSpacingIds = getSpacingIdsInSection(sectionName);

              sectionSpacingIds.forEach((sectionSpacingId) => {
                const currentType = config.doorsDrawersConfig[sectionSpacingId];
                if (
                  currentType === "slidingDoor" ||
                  currentType === "slidingMirrorDoor" ||
                  currentType === "slidingGlassDoor"
                ) {
                  updateDoorsDrawersConfig(sectionSpacingId, null);
                }
              });

              // Apply new door type to this spacing
              updateDoorsDrawersConfig(spacingId, type);
            }
          });
        }
      }
    }
  };

  // Handle tooltip display - chỉ cho disabled button
  const handleDisabledButtonMouseEnter = (
    event: React.MouseEvent,
    type: string
  ) => {
    let isDisabled = false;

    if ((type === "drawer" || type === "drawerVerre") && isDrawerDisabled()) {
      isDisabled = true;
    } else if (
      (type === "doubleSwingDoor" || type === "doubleSwingDoorVerre") &&
      isDoubleSwingDoorDisabled()
    ) {
      isDisabled = true;
    } else if (
      (type === "leftDoor" ||
        type === "leftDoorVerre" ||
        type === "rightDoor" ||
        type === "rightDoorVerre") &&
      isLeftRightDoorDisabled()
    ) {
      isDisabled = true;
    }

    if (isDisabled) {
      const rect = event.currentTarget.getBoundingClientRect();
      setHoveredButton({
        type,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    }
  };

  const handleDisabledButtonMouseLeave = () => {
    setHoveredButton(null);
  };

  // Handle tooltip display for sliding doors
  const handleSlidingDoorMouseEnter = (
    event: React.MouseEvent,
    type: string
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredSlidingDoor({
      type,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleSlidingDoorMouseLeave = () => {
    setHoveredSlidingDoor(null);
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
                style={{ fontSize: "12px", paddingBottom: "8px" }}
              >
                Vide
              </span>
            </button>
          </div>

          {/* Porte Gauche (Bois) */}
          <div className="col-6">
            <div
              onMouseEnter={(e) =>
                handleDisabledButtonMouseEnter(e, "leftDoor")
              }
              onMouseLeave={handleDisabledButtonMouseLeave}
              style={{ position: "relative" }}
            >
              <button
                className={`btn w-100 p-3 ${
                  isLeftRightDoorDisabled() ? "disabled" : ""
                }`}
                onClick={() => handleDoorsDrawersTypeSelect("leftDoor")}
                disabled={isLeftRightDoorDisabled()}
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
                  backgroundColor: isLeftRightDoorDisabled()
                    ? "#f8f9fa"
                    : "transparent",
                  opacity: isLeftRightDoorDisabled() ? 0.6 : 1,
                  cursor: isLeftRightDoorDisabled() ? "not-allowed" : "pointer",
                }}
              >
                <div className="mb-2" style={{ fontSize: "2rem" }}>
                  <img
                    src={leftDoor}
                    alt="Porte Gauche"
                    style={{
                      width: 40,
                      height: 40,
                      opacity: isLeftRightDoorDisabled() ? 0.5 : 1,
                    }}
                  />
                </div>
                <span
                  className={`fw-bold ${
                    config.selectedDoorsDrawersType === "leftDoor"
                      ? "text-primary"
                      : isLeftRightDoorDisabled()
                      ? "text-muted"
                      : ""
                  }`}
                  style={{ fontSize: "12px", paddingBottom: "8px" }}
                >
                  Porte Gauche
                </span>
              </button>
            </div>
          </div>

          {/* Porte Gauche en Verre */}
          <div className="col-6">
            <div
              onMouseEnter={(e) =>
                handleDisabledButtonMouseEnter(e, "leftDoorVerre")
              }
              onMouseLeave={handleDisabledButtonMouseLeave}
              style={{ position: "relative" }}
            >
              <button
                className={`btn w-100 p-3 ${
                  isLeftRightDoorDisabled() ? "disabled" : ""
                }`}
                onClick={() => handleDoorsDrawersTypeSelect("leftDoorVerre")}
                disabled={isLeftRightDoorDisabled()}
                style={{
                  height: "120px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${
                    config.selectedDoorsDrawersType === "leftDoorVerre"
                      ? "#0d6efd"
                      : "#dee2e6"
                  }`,
                  backgroundColor: isLeftRightDoorDisabled()
                    ? "#f8f9fa"
                    : "transparent",
                  opacity: isLeftRightDoorDisabled() ? 0.6 : 1,
                  cursor: isLeftRightDoorDisabled() ? "not-allowed" : "pointer",
                }}
              >
                <div className="mb-2" style={{ fontSize: "2rem" }}>
                  <img
                    src={leftDoor}
                    alt="Porte Gauche en Verre"
                    style={{
                      width: 40,
                      height: 40,
                      opacity: isLeftRightDoorDisabled() ? 0.5 : 1,
                    }}
                  />
                </div>
                <span
                  className={`fw-bold ${
                    config.selectedDoorsDrawersType === "leftDoorVerre"
                      ? "text-primary"
                      : isLeftRightDoorDisabled()
                      ? "text-muted"
                      : ""
                  }`}
                  style={{ fontSize: "12px", paddingBottom: "8px" }}
                >
                  Porte Gauche en Verre
                </span>
              </button>
            </div>
          </div>

          {/* Porte Droite (Bois) */}
          <div className="col-6">
            <div
              onMouseEnter={(e) =>
                handleDisabledButtonMouseEnter(e, "rightDoor")
              }
              onMouseLeave={handleDisabledButtonMouseLeave}
              style={{ position: "relative" }}
            >
              <button
                className={`btn w-100 p-3 ${
                  isLeftRightDoorDisabled() ? "disabled" : ""
                }`}
                onClick={() => handleDoorsDrawersTypeSelect("rightDoor")}
                disabled={isLeftRightDoorDisabled()}
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
                  backgroundColor: isLeftRightDoorDisabled()
                    ? "#f8f9fa"
                    : "transparent",
                  opacity: isLeftRightDoorDisabled() ? 0.6 : 1,
                  cursor: isLeftRightDoorDisabled() ? "not-allowed" : "pointer",
                }}
              >
                <div className="mb-2" style={{ fontSize: "2rem" }}>
                  <img
                    src={rightDoor}
                    alt="Porte Droite"
                    style={{
                      width: 40,
                      height: 40,
                      opacity: isLeftRightDoorDisabled() ? 0.5 : 1,
                    }}
                  />
                </div>
                <span
                  className={`fw-bold ${
                    config.selectedDoorsDrawersType === "rightDoor"
                      ? "text-primary"
                      : isLeftRightDoorDisabled()
                      ? "text-muted"
                      : ""
                  }`}
                  style={{ fontSize: "12px", paddingBottom: "8px" }}
                >
                  Porte Droite
                </span>
              </button>
            </div>
          </div>

          {/* Porte Droite en Verre */}
          <div className="col-6">
            <div
              onMouseEnter={(e) =>
                handleDisabledButtonMouseEnter(e, "rightDoorVerre")
              }
              onMouseLeave={handleDisabledButtonMouseLeave}
              style={{ position: "relative" }}
            >
              <button
                className={`btn w-100 p-3 ${
                  isLeftRightDoorDisabled() ? "disabled" : ""
                }`}
                onClick={() => handleDoorsDrawersTypeSelect("rightDoorVerre")}
                disabled={isLeftRightDoorDisabled()}
                style={{
                  height: "120px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${
                    config.selectedDoorsDrawersType === "rightDoorVerre"
                      ? "#0d6efd"
                      : "#dee2e6"
                  }`,
                  backgroundColor: isLeftRightDoorDisabled()
                    ? "#f8f9fa"
                    : "transparent",
                  opacity: isLeftRightDoorDisabled() ? 0.6 : 1,
                  cursor: isLeftRightDoorDisabled() ? "not-allowed" : "pointer",
                }}
              >
                <div className="mb-2" style={{ fontSize: "2rem" }}>
                  <img
                    src={rightDoor}
                    alt="Porte Droite en Verre"
                    style={{
                      width: 40,
                      height: 40,
                      opacity: isLeftRightDoorDisabled() ? 0.5 : 1,
                    }}
                  />
                </div>
                <span
                  className={`fw-bold ${
                    config.selectedDoorsDrawersType === "rightDoorVerre"
                      ? "text-primary"
                      : isLeftRightDoorDisabled()
                      ? "text-muted"
                      : ""
                  }`}
                  style={{ fontSize: "12px", paddingBottom: "8px" }}
                >
                  Porte Droite en Verre
                </span>
              </button>
            </div>
          </div>

          {/* Tiroir (Bois) */}
          <div className="col-6">
            <div
              onMouseEnter={(e) => handleDisabledButtonMouseEnter(e, "drawer")}
              onMouseLeave={handleDisabledButtonMouseLeave}
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
                  style={{ fontSize: "12px", paddingBottom: "8px" }}
                >
                  Tiroir
                </span>
              </button>
            </div>
          </div>

          {/* Tiroir en Verre */}
          <div className="col-6">
            <div
              onMouseEnter={(e) =>
                handleDisabledButtonMouseEnter(e, "drawerVerre")
              }
              onMouseLeave={handleDisabledButtonMouseLeave}
              style={{ position: "relative" }}
            >
              <button
                className={`btn w-100 p-3 ${drawerDisabled ? "disabled" : ""}`}
                onClick={() => handleDoorsDrawersTypeSelect("drawerVerre")}
                disabled={drawerDisabled}
                style={{
                  height: "120px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${
                    config.selectedDoorsDrawersType === "drawerVerre"
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
                    alt="Tiroir en Verre"
                    style={{
                      width: 40,
                      height: 40,
                      opacity: drawerDisabled ? 0.5 : 1,
                    }}
                  />
                </div>
                <span
                  className={`fw-bold ${
                    config.selectedDoorsDrawersType === "drawerVerre"
                      ? "text-primary"
                      : drawerDisabled
                      ? "text-muted"
                      : ""
                  }`}
                  style={{ fontSize: "12px", paddingBottom: "8px" }}
                >
                  Tiroir en Verre
                </span>
              </button>
            </div>
          </div>

          {/* Porte double battant (Bois) */}
          <div className="col-6">
            <div
              onMouseEnter={(e) =>
                handleDisabledButtonMouseEnter(e, "doubleSwingDoor")
              }
              onMouseLeave={handleDisabledButtonMouseLeave}
              style={{ position: "relative" }}
            >
              <button
                className={`btn w-100 p-3 ${
                  isDoubleSwingDoorDisabled() ? "disabled" : ""
                }`}
                onClick={() => handleDoorsDrawersTypeSelect("doubleSwingDoor")}
                disabled={isDoubleSwingDoorDisabled()}
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
                  backgroundColor: isDoubleSwingDoorDisabled()
                    ? "#f8f9fa"
                    : "transparent",
                  opacity: isDoubleSwingDoorDisabled() ? 0.6 : 1,
                  cursor: isDoubleSwingDoorDisabled()
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                <div className="mb-2" style={{ fontSize: "2rem" }}>
                  <img
                    src={doubleSwingDoor}
                    alt="Porte double battant"
                    style={{
                      width: 40,
                      height: 40,
                      opacity: isDoubleSwingDoorDisabled() ? 0.5 : 1,
                    }}
                  />
                </div>
                <span
                  className={`fw-bold ${
                    config.selectedDoorsDrawersType === "doubleSwingDoor"
                      ? "text-primary"
                      : isDoubleSwingDoorDisabled()
                      ? "text-muted"
                      : ""
                  }`}
                  style={{ fontSize: "12px", paddingBottom: "8px" }}
                >
                  Porte double battant
                </span>
              </button>
            </div>
          </div>

          {/* Porte double battant en Verre */}
          <div className="col-6">
            <div
              onMouseEnter={(e) =>
                handleDisabledButtonMouseEnter(e, "doubleSwingDoorVerre")
              }
              onMouseLeave={handleDisabledButtonMouseLeave}
              style={{ position: "relative" }}
            >
              <button
                className={`btn w-100 p-3 ${
                  isDoubleSwingDoorDisabled() ? "disabled" : ""
                }`}
                onClick={() =>
                  handleDoorsDrawersTypeSelect("doubleSwingDoorVerre")
                }
                disabled={isDoubleSwingDoorDisabled()}
                style={{
                  height: "120px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${
                    config.selectedDoorsDrawersType === "doubleSwingDoorVerre"
                      ? "#0d6efd"
                      : "#dee2e6"
                  }`,
                  backgroundColor: isDoubleSwingDoorDisabled()
                    ? "#f8f9fa"
                    : "transparent",
                  opacity: isDoubleSwingDoorDisabled() ? 0.6 : 1,
                  cursor: isDoubleSwingDoorDisabled()
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                <div className="mb-2" style={{ fontSize: "2rem" }}>
                  <img
                    src={doubleSwingDoor}
                    alt="Porte double battant en Verre"
                    style={{
                      width: 40,
                      height: 40,
                      opacity: isDoubleSwingDoorDisabled() ? 0.5 : 1,
                    }}
                  />
                </div>
                <span
                  className={`fw-bold ${
                    config.selectedDoorsDrawersType === "doubleSwingDoorVerre"
                      ? "text-primary"
                      : isDoubleSwingDoorDisabled()
                      ? "text-muted"
                      : ""
                  }`}
                  style={{ fontSize: "12px", paddingBottom: "8px" }}
                >
                  Porte double battant en Verre
                </span>
              </button>
            </div>
          </div>

          {/* Porte coulissante */}
          <div className="col-6">
            <div
              onMouseEnter={(e) =>
                handleSlidingDoorMouseEnter(e, "slidingDoor")
              }
              onMouseLeave={handleSlidingDoorMouseLeave}
              style={{ position: "relative" }}
            >
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
                  style={{ fontSize: "12px", paddingBottom: "8px" }}
                >
                  Porte coulissante
                </span>
              </button>
            </div>
          </div>

          {/* Porte coulissante en miroir */}
          <div className="col-6">
            <div
              onMouseEnter={(e) =>
                handleSlidingDoorMouseEnter(e, "slidingMirrorDoor")
              }
              onMouseLeave={handleSlidingDoorMouseLeave}
              style={{ position: "relative" }}
            >
              <button
                className="btn w-100 p-3"
                onClick={() =>
                  handleDoorsDrawersTypeSelect("slidingMirrorDoor")
                }
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
                  style={{ fontSize: "12px", paddingBottom: "8px" }}
                >
                  Porte coulissante en miroir
                </span>
              </button>
            </div>
          </div>

          {/* Porte coulissante en verre */}
          <div className="col-6">
            <div
              onMouseEnter={(e) =>
                handleSlidingDoorMouseEnter(e, "slidingGlassDoor")
              }
              onMouseLeave={handleSlidingDoorMouseLeave}
              style={{ position: "relative" }}
            >
              <button
                className="btn w-100 p-3"
                onClick={() => handleDoorsDrawersTypeSelect("slidingGlassDoor")}
                style={{
                  height: "120px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${
                    config.selectedDoorsDrawersType === "slidingGlassDoor"
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
                    alt="Porte coulissante en verre"
                    style={{ width: 40, height: 40 }}
                  />
                </div>
                <span
                  className={`fw-bold ${
                    config.selectedDoorsDrawersType === "slidingGlassDoor"
                      ? "text-primary"
                      : ""
                  }`}
                  style={{ fontSize: "12px", paddingBottom: "8px" }}
                >
                  Porte coulissante en verre
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Tooltip - message đơn giản như alert */}
        {hoveredButton && (
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
                  Cette façade est compatible avec des dimensions de casier de :
                </p>
                {hoveredButton.type === "drawer" && (
                  <p>
                    {(() => {
                      const selectedSpacings = config.selectedSpacingIds || [];
                      if (selectedSpacings.length > 1) {
                        return "❌ La façade sélectionnée ne peut pas être installée sur plusieurs casiers";
                      }

                      const shelfBelowHeight = getShelfBelowHeight(
                        config.selectedSpacingId || ""
                      );
                      if (shelfBelowHeight !== null && shelfBelowHeight > 100) {
                        return `❌ L'étagère en dessous est trop haute (${shelfBelowHeight} cm depuis le sol > 100 cm)`;
                      }

                      return `❌ 10-60 cm de hauteur (courant ${getSpacingHeight(
                        config.selectedSpacingId || ""
                      )} cm)`;
                    })()}
                  </p>
                )}
                {hoveredButton.type === "drawerVerre" && (
                  <p>
                    {(() => {
                      const selectedSpacings = config.selectedSpacingIds || [];
                      if (selectedSpacings.length > 1) {
                        return "❌ La façade sélectionnée ne peut pas être installée sur plusieurs casiers";
                      }

                      const shelfBelowHeight = getShelfBelowHeight(
                        config.selectedSpacingId || ""
                      );
                      if (shelfBelowHeight !== null && shelfBelowHeight > 100) {
                        return `❌ L'étagère en dessous est trop haute (${shelfBelowHeight} cm depuis le sol > 100 cm)`;
                      }

                      return `❌ 10-60 cm de hauteur (courant ${getSpacingHeight(
                        config.selectedSpacingId || ""
                      )} cm)`;
                    })()}
                  </p>
                )}
                {hoveredButton.type === "doubleSwingDoor" && (
                  <p>
                    ❌ 40-109 cm de largeur (courant{" "}
                    {getSpacingWidth(config.selectedSpacingId || "")} cm)
                  </p>
                )}
                {(hoveredButton.type === "leftDoor" ||
                  hoveredButton.type === "rightDoor") && (
                  <p>
                    ❌ 26-60 cm de largeur (courant{" "}
                    {getSpacingWidth(config.selectedSpacingId || "")} cm)
                  </p>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Tooltip cho cửa kéo - đơn giản không có tiêu đề */}
        {hoveredSlidingDoor && (
          <div
            className="position-fixed bg-white text-dark p-2 rounded shadow-lg border"
            style={{
              left: hoveredSlidingDoor.x - 150,
              top: hoveredSlidingDoor.y - 40,
              zIndex: 9999,
              pointerEvents: "none",
              minWidth: "300px",
              fontSize: "14px",
            }}
          >
            <div className="d-flex align-items-center">
              <i className="bi bi-exclamation-triangle me-2 text-warning"></i>
              <span>
                La porte coulissante couvre toute la section (sauf Angle)
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

      {/* Section chọn tay nắm - chỉ hiển thị cho porte (không phải tiroir hoặc cửa kéo) */}
      {isDoorsDrawersOpen &&
        config.selectedSpacingId &&
        config.selectedDoorsDrawersType &&
        config.selectedDoorsDrawersType !== "vide" &&
        config.selectedDoorsDrawersType !== "drawer" &&
        config.selectedDoorsDrawersType !== "drawerVerre" &&
        config.selectedDoorsDrawersType !== "slidingDoor" &&
        config.selectedDoorsDrawersType !== "slidingMirrorDoor" &&
        config.selectedDoorsDrawersType !== "slidingGlassDoor" && (
          <div className="mt-4">
            <h6 className="mb-3">Choisir le type de poignée</h6>
            <div className="row g-2">
              {/* Không có tay nắm */}
              <div className="col-3">
                <button
                  className={`btn w-100 p-2 ${
                    ((config.selectedSpacingId &&
                      config.handleConfig[config.selectedSpacingId]) ||
                      config.handleType) === "none"
                      ? "btn-primary"
                      : "btn-outline-secondary"
                  }`}
                  onClick={() => {
                    if (config.selectedSpacingId) {
                      const updatedConfig = { ...config.handleConfig };
                      updatedConfig[config.selectedSpacingId] = "none";
                      updateConfig("handleConfig", updatedConfig);
                      updateConfig("handleType", "none");
                    }
                  }}
                  style={{ height: "80px", fontSize: "12px" }}
                >
                  <div className="mb-1">
                    <i
                      className="bi bi-circle"
                      style={{ fontSize: "1.5rem" }}
                    ></i>
                  </div>
                  <span>Aucune</span>
                </button>
              </div>

              {/* Tay nắm tròn */}
              <div className="col-3">
                <button
                  className={`btn w-100 p-2 ${
                    ((config.selectedSpacingId &&
                      config.handleConfig[config.selectedSpacingId]) ||
                      config.handleType) === "round"
                      ? "btn-primary"
                      : "btn-outline-secondary"
                  }`}
                  onClick={() => {
                    if (config.selectedSpacingId) {
                      const updatedConfig = { ...config.handleConfig };
                      updatedConfig[config.selectedSpacingId] = "round";
                      updateConfig("handleConfig", updatedConfig);
                      updateConfig("handleType", "round");
                    }
                  }}
                  style={{ height: "80px", fontSize: "12px" }}
                >
                  <div className="mb-1">
                    <i
                      className="bi bi-circle-fill"
                      style={{ fontSize: "1.5rem" }}
                    ></i>
                  </div>
                  <span>Ronde</span>
                </button>
              </div>

              {/* Tay nắm thanh */}
              <div className="col-3">
                <button
                  className={`btn w-100 p-2 ${
                    ((config.selectedSpacingId &&
                      config.handleConfig[config.selectedSpacingId]) ||
                      config.handleType) === "bar"
                      ? "btn-primary"
                      : "btn-outline-secondary"
                  }`}
                  onClick={() => {
                    if (config.selectedSpacingId) {
                      const updatedConfig = { ...config.handleConfig };
                      updatedConfig[config.selectedSpacingId] = "bar";
                      updateConfig("handleConfig", updatedConfig);
                      updateConfig("handleType", "bar");
                    }
                  }}
                  style={{ height: "80px", fontSize: "12px" }}
                >
                  <div className="mb-1">
                    <i
                      className="bi bi-dash"
                      style={{ fontSize: "1.5rem" }}
                    ></i>
                  </div>
                  <span>Barre</span>
                </button>
              </div>

              {/* Tay nắm lõm */}
              <div className="col-3">
                <button
                  className={`btn w-100 p-2 ${
                    ((config.selectedSpacingId &&
                      config.handleConfig[config.selectedSpacingId]) ||
                      config.handleType) === "recessed"
                      ? "btn-primary"
                      : "btn-outline-secondary"
                  }`}
                  onClick={() => {
                    if (config.selectedSpacingId) {
                      const updatedConfig = { ...config.handleConfig };
                      updatedConfig[config.selectedSpacingId] = "recessed";
                      updateConfig("handleConfig", updatedConfig);
                      updateConfig("handleType", "recessed");
                    }
                  }}
                  style={{ height: "80px", fontSize: "12px" }}
                >
                  <div className="mb-1">
                    <i
                      className="bi bi-square"
                      style={{ fontSize: "1.5rem" }}
                    ></i>
                  </div>
                  <span>Encastrée</span>
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default DoorsDrawersSection;
