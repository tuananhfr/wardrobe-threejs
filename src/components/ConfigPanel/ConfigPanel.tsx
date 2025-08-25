// src/components/ConfigPanel/ConfigPanel.tsx
import React from "react";

import { useConfig } from "../../components/context/WardrobeContext";
import WardrobeTypeSelector from "./section/WardrobeTypeSelector";
import DimensionSection from "./section/DimensionSection";
import DimensionControl from "./section/DimensionControl";
import ColumnsSection from "./section/ColumnsSection";
import MainSelector from "./section/MainSelector";
import TextureSelector from "./section/TextureSelector";
import LEDColorSelector from "./section/LEDColorSelector";
import EtagereSection from "./section/EtagereSection";
import InternalEquipmentSection from "./section/InternalEquipmentSection";
import DoorsDrawersSection from "./section/DoorsDrawersSection";

const ConfigPanel: React.FC = () => {
  const { config, updateConfig, batchUpdate } = useConfig();

  // Generic accordion handler
  const createAccordionHandler = (accordionId: string) => {
    const isOpen = config.accordionOpen === accordionId;

    const handleToggle = () => {
      const newState = isOpen ? "" : accordionId;
      updateConfig("accordionOpen", newState);

      // Reset all states when switching to any accordion (including textures)
      if (!isOpen) {
        // When opening any accordion, reset all selection states
        batchUpdate({
          selectedSpacingIds: [],
          selectedSpacingId: null,
          hoveredSpacingId: null,
          selectedColumnId: null,
          hoveredColumnId: null,
          selectedDoorsDrawersType: null,
          selectedInternalEquipmentType: null,
        });
      }

      // Reset activeView when switching to textures accordion to ensure no button is selected by default
      if (!isOpen && accordionId === "collapseTextures") {
        batchUpdate({
          activeView: "entier",
        });
      }

      // Reset activeView when switching away from textures accordion
      if (isOpen && accordionId === "collapseTextures") {
        batchUpdate({
          activeView: "entier",
        });
      }
    };

    return { isOpen, handleToggle };
  };

  // Create handlers for each accordion
  const typeAccordion = createAccordionHandler("collapseType");

  const socleAccordion = createAccordionHandler("collapseSocle");

  const texturesAccordion = createAccordionHandler("collapseTextures");

  return (
    <div className="accordion" id="configAccordion">
      {/* 1. Type d'implantation */}
      <div className="accordion-item">
        <h2 className="accordion-header">
          <button
            className={`accordion-button ${
              !typeAccordion.isOpen ? "collapsed" : ""
            }`}
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseType"
            aria-expanded={typeAccordion.isOpen}
            aria-controls="collapseType"
            onClick={typeAccordion.handleToggle}
          >
            1. Type d'implantation
          </button>
        </h2>
        <div
          id="collapseType"
          className={`accordion-collapse collapse ${
            typeAccordion.isOpen ? "show" : ""
          }`}
          data-bs-parent="#configAccordion"
        >
          <div className="accordion-body">
            <div className="text-secondary mb-3">
              Sélectionnez le type de bois pour votre panneau.
            </div>
            <WardrobeTypeSelector />
          </div>
        </div>
      </div>

      {/* 2. Redimension */}
      <DimensionSection />

      {/* 3. Ajuster le socle */}
      <div className="accordion-item">
        <h2 className="accordion-header" id="headingSocle">
          <button
            className={`accordion-button ${
              !socleAccordion.isOpen ? "collapsed" : ""
            }`}
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseSocle"
            aria-expanded={socleAccordion.isOpen}
            aria-controls="collapseSocle"
            onClick={socleAccordion.handleToggle}
          >
            3. Ajuster le socle
          </button>
        </h2>
        <div
          id="collapseSocle"
          className={`accordion-collapse collapse ${
            socleAccordion.isOpen ? "show" : ""
          }`}
          aria-labelledby="headingSocle"
          data-bs-parent="#configAccordion"
        >
          <div className="accordion-body">
            <div className="text-secondary mb-3">
              Pour assurer la stabilité de votre armoire, elle sera fabriquée
              avec un socle.
            </div>

            <DimensionControl
              label="Adapter la barre de socle"
              value={config.baseBarHeight}
              min={7}
              max={14}
              step={1}
              onChange={(value) => updateConfig("baseBarHeight", value)}
            />
          </div>
        </div>
      </div>

      {/* 4. Colonnes */}
      <ColumnsSection />

      {/* 5. Étagères */}
      <EtagereSection />

      {/* 6. internal equipment */}
      <InternalEquipmentSection />

      {/* 7. doors & drawers */}
      <DoorsDrawersSection />

      {/* n. Sélection & Textures */}
      <div className="accordion-item">
        <h2 className="accordion-header" id="headingTextures">
          <button
            className={`accordion-button ${
              !texturesAccordion.isOpen ? "collapsed" : ""
            }`}
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseTextures"
            aria-expanded={texturesAccordion.isOpen}
            aria-controls="collapseTextures"
            onClick={texturesAccordion.handleToggle}
          >
            8. Sélection & Textures
          </button>
        </h2>
        <div
          id="collapseTextures"
          className={`accordion-collapse collapse ${
            texturesAccordion.isOpen ? "show" : ""
          }`}
          aria-labelledby="headingTextures"
          data-bs-parent="#configAccordion"
        >
          <div className="accordion-body">
            <MainSelector activeOption={config.activeView} />
            {config.activeView === "led" && <LEDColorSelector />}
            {config.activeView === "test" && <TextureSelector type="test" />}
            {config.activeView === "tablette" && (
              <TextureSelector type="tablette" />
            )}
            {config.activeView === "facades" && (
              <TextureSelector type="facades" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
