// src/components/ConfigPanel/DimensionSection.tsx
import React, { useEffect } from "react";
import DimensionControl from "../section/DimensionControl";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";

const DimensionSection: React.FC = () => {
  const {
    config,
    updateConfig,
    handleSectionWidthChange,
    handleUpdateSection,
    handleHeightChange,
  } = useWardrobeConfig();

  // Check if étagère accordion is open
  const isDimensionOpen = config.accordionOpen === "collapseRedimension";

  // Handle accordion toggle
  const handleAccordionToggle = () => {
    const newState = isDimensionOpen ? "" : "collapseRedimension";
    updateConfig("accordionOpen", newState);
  };
  useEffect(() => {
    let isManualClose = true; // Track if close is manual or auto-close

    const handlerShown = (event: Event) => {
      const target = (event.target as HTMLElement).closest(
        ".accordion-collapse"
      );
      if (!target) return;

      // Mark that next closes will be auto-closes (not manual)
      isManualClose = false;

      // Only handle section accordions when opened
      switch (target.id) {
        case "collapseSectionA":
          updateConfig("showSections", "sectionA");
          break;
        case "collapseSectionB":
          updateConfig("showSections", "sectionB");
          break;
        case "collapseSectionC":
          updateConfig("showSections", "sectionC");
          break;
        // Don't handle other accordions - keep current showSections value
      }

      // Reset flag after a small delay to allow for auto-closes
      setTimeout(() => {
        isManualClose = true;
      }, 50);
    };

    const handlerHidden = (event: Event) => {
      const target = (event.target as HTMLElement).closest(
        ".accordion-collapse"
      );
      if (!target) return;

      // If main Redimension accordion is closed, always reset showSections
      if (target.id === "collapseRedimension") {
        updateConfig("showSections", "");
        return;
      }

      // Only reset if it's a manual close (not auto-close from opening another section)
      if (
        isManualClose &&
        ["collapseSectionA", "collapseSectionB", "collapseSectionC"].includes(
          target.id
        )
      ) {
        updateConfig("showSections", "");
      }
    };

    // Listen to all accordion events in the document
    document.addEventListener("shown.bs.collapse", handlerShown);
    document.addEventListener("hidden.bs.collapse", handlerHidden);

    return () => {
      document.removeEventListener("shown.bs.collapse", handlerShown);
      document.removeEventListener("hidden.bs.collapse", handlerHidden);
    };
  }, [updateConfig]);

  return (
    <div className="accordion-item">
      <h2 className="accordion-header" id="headingRedimension">
        <button
          className="accordion-button collapsed"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#collapseRedimension"
          aria-controls="collapseRedimension"
          onClick={handleAccordionToggle}
          aria-expanded={isDimensionOpen}
        >
          2. Redimension
        </button>
      </h2>
      <div
        id="collapseRedimension"
        className="accordion-collapse collapse"
        aria-labelledby="headingRedimension"
        data-bs-parent="#configAccordion"
      >
        <div className="accordion-body">
          <div className="text-secondary mb-3">
            Ajustez les dimensions de votre dressing.
          </div>

          {/* Height Control */}
          <DimensionControl
            label="Hauteur"
            value={config.height}
            min={40}
            max={275}
            step={1}
            onChange={(value) => handleHeightChange(value)}
          />

          {/* Nested Accordion for Sections */}
          <div className="accordion" id="sectionsAccordion">
            {/* Section A */}
            {config.wardrobeType.sections.sectionA && (
              <div className="accordion-item">
                <h2 className="accordion-header" id="headingSectionA">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseSectionA"
                    aria-expanded="false"
                    aria-controls="collapseSectionA"
                  >
                    Section A
                  </button>
                </h2>
                <div
                  id="collapseSectionA"
                  className="accordion-collapse collapse"
                  aria-labelledby="headingSectionA"
                  data-bs-parent="#sectionsAccordion"
                >
                  <div className="accordion-body">
                    <DimensionControl
                      label="Largeur"
                      value={config.wardrobeType.sections.sectionA.width}
                      min={
                        config.wardrobeType.id === "Angle" &&
                        config.wardrobeType.sections.sectionB
                          ? config.wardrobeType.sections.sectionB.depth + 30
                          : config.wardrobeType.id === "Forme U" &&
                            config.wardrobeType.sections.sectionB &&
                            config.wardrobeType.sections.sectionC
                          ? config.wardrobeType.sections.sectionB.depth +
                            config.wardrobeType.sections.sectionC.depth +
                            30
                          : 36
                      }
                      max={600}
                      step={1}
                      onChange={(value) =>
                        handleSectionWidthChange("sectionA", value)
                      }
                    />

                    <DimensionControl
                      label="Profondeur"
                      value={config.wardrobeType.sections.sectionA.depth}
                      min={20}
                      max={110}
                      step={1}
                      onChange={(value) =>
                        handleUpdateSection("sectionA", { depth: value })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section B */}
            {config.wardrobeType.sections.sectionB && (
              <div className="accordion-item">
                <h2 className="accordion-header" id="headingSectionB">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseSectionB"
                    aria-expanded="false"
                    aria-controls="collapseSectionB"
                  >
                    Section B
                  </button>
                </h2>
                <div
                  id="collapseSectionB"
                  className="accordion-collapse collapse"
                  aria-labelledby="headingSectionB"
                  data-bs-parent="#sectionsAccordion"
                >
                  <div className="accordion-body">
                    <DimensionControl
                      label="Largeur"
                      value={config.wardrobeType.sections.sectionB.width}
                      min={36}
                      max={600}
                      step={1}
                      onChange={(value) =>
                        handleSectionWidthChange("sectionB", value)
                      }
                    />

                    <DimensionControl
                      label="Profondeur"
                      value={config.wardrobeType.sections.sectionB.depth}
                      min={20}
                      max={110}
                      step={1}
                      onChange={(value) => {
                        if (
                          config.wardrobeType.id === "Angle" &&
                          config.wardrobeType.sections.sectionA
                        ) {
                          const minWidthA = value + 30;
                          const currentWidthA =
                            config.wardrobeType.sections.sectionA.width;
                          if (currentWidthA < minWidthA) {
                            // Cập nhật cả 2 cùng lúc
                            const newSections = {
                              ...config.wardrobeType.sections,
                              sectionB: {
                                ...config.wardrobeType.sections.sectionB!,
                                depth: value,
                              },
                              sectionA: {
                                ...config.wardrobeType.sections.sectionA!,
                                width: minWidthA,
                              },
                            };
                            updateConfig("wardrobeType", {
                              ...config.wardrobeType,
                              sections: newSections,
                            });
                          } else {
                            handleUpdateSection("sectionB", { depth: value });
                          }
                        } else if (
                          config.wardrobeType.id === "Forme U" &&
                          config.wardrobeType.sections.sectionA &&
                          config.wardrobeType.sections.sectionC
                        ) {
                          const minWidthA =
                            value +
                            config.wardrobeType.sections.sectionC.depth +
                            30;
                          const currentWidthA =
                            config.wardrobeType.sections.sectionA.width;
                          if (currentWidthA < minWidthA) {
                            // Cập nhật cả 2 cùng lúc
                            const newSections = {
                              ...config.wardrobeType.sections,
                              sectionB: {
                                ...config.wardrobeType.sections.sectionB!,
                                depth: value,
                              },
                              sectionA: {
                                ...config.wardrobeType.sections.sectionA!,
                                width: minWidthA,
                              },
                            };
                            updateConfig("wardrobeType", {
                              ...config.wardrobeType,
                              sections: newSections,
                            });
                          } else {
                            handleUpdateSection("sectionB", { depth: value });
                          }
                        } else {
                          handleUpdateSection("sectionB", { depth: value });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section C */}
            {config.wardrobeType.sections.sectionC && (
              <div className="accordion-item">
                <h2 className="accordion-header" id="headingSectionC">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseSectionC"
                    aria-expanded="false"
                    aria-controls="collapseSectionC"
                  >
                    Section C
                  </button>
                </h2>
                <div
                  id="collapseSectionC"
                  className="accordion-collapse collapse"
                  aria-labelledby="headingSectionC"
                  data-bs-parent="#sectionsAccordion"
                >
                  <div className="accordion-body">
                    <DimensionControl
                      label="Largeur"
                      value={config.wardrobeType.sections.sectionC.width}
                      min={36}
                      max={600}
                      step={1}
                      onChange={(value) =>
                        handleSectionWidthChange("sectionC", value)
                      }
                    />

                    <DimensionControl
                      label="Profondeur"
                      value={config.wardrobeType.sections.sectionC.depth}
                      min={20}
                      max={110}
                      step={1}
                      onChange={(value) => {
                        if (
                          config.wardrobeType.id === "Forme U" &&
                          config.wardrobeType.sections.sectionA &&
                          config.wardrobeType.sections.sectionB
                        ) {
                          const minWidthA =
                            config.wardrobeType.sections.sectionB.depth +
                            value +
                            30;
                          const currentWidthA =
                            config.wardrobeType.sections.sectionA.width;
                          if (currentWidthA < minWidthA) {
                            // Cập nhật cả 2 cùng lúc
                            const newSections = {
                              ...config.wardrobeType.sections,
                              sectionC: {
                                ...config.wardrobeType.sections.sectionC!,
                                depth: value,
                              },
                              sectionA: {
                                ...config.wardrobeType.sections.sectionA!,
                                width: minWidthA,
                              },
                            };
                            updateConfig("wardrobeType", {
                              ...config.wardrobeType,
                              sections: newSections,
                            });
                          } else {
                            handleUpdateSection("sectionC", { depth: value });
                          }
                        } else {
                          handleUpdateSection("sectionC", { depth: value });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DimensionSection;
