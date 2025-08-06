// src/components/ConfigPanel/ConfigPanel.tsx
import React from "react";

import { useWardrobeConfig } from "../../hooks/useWardrobeConfig";
import WardrobeTypeSelector from "./section/WardrobeTypeSelector";
import DimensionSection from "./section/DimensionSection";
import DimensionControl from "./section/DimensionControl";
import ColumnsSection from "./section/ColumnsSection";
import SelectorButtons from "./section/SelectorButtons";
import TextureSelector from "./section/TextureSelector";
import EtagereSection from "./section/EtagereSection";

const ConfigPanel: React.FC = () => {
  const { config, updateConfig } = useWardrobeConfig();
  console.log(
    config.wardrobeType.sections.sectionA.columns[0].shelves?.spacings
  );
  const selectorOptions = ["Entière", "test"];
  const handleActiveViewChange = (value: string) => {
    updateConfig("activeView", value);
  };

  return (
    <div className="accordion" id="configAccordion">
      {/* 1. Type d'implantation */}
      <div className="accordion-item">
        <h2 className="accordion-header">
          <button
            className="accordion-button"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseType"
            aria-expanded="true"
            aria-controls="collapseType"
          >
            1. Type d'implantation
          </button>
        </h2>
        <div
          id="collapseType"
          className="accordion-collapse collapse show"
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
            className="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseSocle"
            aria-expanded="false"
            aria-controls="collapseSocle"
          >
            3. Ajuster le socle
          </button>
        </h2>
        <div
          id="collapseSocle"
          className="accordion-collapse collapse"
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

      {/* n. Sélection & Textures */}
      <div className="accordion-item">
        <h2 className="accordion-header" id="headingTextures">
          <button
            className="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseTextures"
            aria-expanded="false"
            aria-controls="collapseTextures"
          >
            n. Sélection & Textures
          </button>
        </h2>
        <div
          id="collapseTextures"
          className="accordion-collapse collapse"
          aria-labelledby="headingTextures"
          data-bs-parent="#configAccordion"
        >
          <div className="accordion-body">
            <SelectorButtons
              options={selectorOptions}
              activeOption={config.activeView}
              onChange={handleActiveViewChange}
            />
            <TextureSelector />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
