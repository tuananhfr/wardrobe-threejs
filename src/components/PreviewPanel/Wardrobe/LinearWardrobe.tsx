// src/components/Wardrobe/LinearWardrobe.tsx (Updated - Working Version)
import React from "react";
import * as THREE from "three";
import SectionFrame from "./SectionFrame";
import SectionColumns from "./SectionColumns";
import SectionShelves from "./SectionShelves";
import EtagereColumnHighlights from "./EtagereColumnHighlights"; // New working component
import InternalEquipmentSpacingHighlights from "./InternalEquipmentSpacingHighlights";
import DoorsDrawersHighlights from "./DoorsDrawersHighlights";
import DoorsDrawersRenderer from "./DoorsDrawersRenderer";
import RailRenderer from "./RailRenderer";

interface LinearWardrobeProps {
  sections: {
    sectionA: WardrobeSection;
    sectionB?: WardrobeSection;
    sectionC?: WardrobeSection;
  };
  height: number;
  baseBarHeight: number;
  thickness: number;
  texture: THREE.Texture;
  showSections: string;
  ledColor: string;
}

const LinearWardrobe: React.FC<LinearWardrobeProps> = ({
  sections,
  height,
  baseBarHeight,
  thickness,
  texture,
  showSections,
  ledColor,
}) => {
  return (
    <group>
      {/* Section A Frame */}
      <SectionFrame
        sectionName="sectionA"
        sectionData={sections.sectionA}
        height={height}
        baseBarHeight={baseBarHeight}
        position={[0, 0, 0]}
        thickness={thickness}
        texture={texture}
        showSections={showSections}
        ledColor={ledColor}
      />

      {/* Section A Columns */}
      <SectionColumns
        sectionData={sections.sectionA}
        height={height}
        baseBarHeight={baseBarHeight}
        position={[0, 0, 0]}
        thickness={thickness}
        texture={texture}
        ledColor={ledColor}
      />

      {/* Section A Shelves */}
      <SectionShelves
        sectionName="sectionA"
        sectionData={sections.sectionA}
        height={height}
        baseBarHeight={baseBarHeight}
        position={[0, 0, 0]}
        thickness={thickness}
        texture={texture}
        showSections={showSections}
      />

      {/* Étagère Column Highlights - Based on working ColumnHighlights pattern */}
      <EtagereColumnHighlights
        sectionName="sectionA"
        sectionData={sections.sectionA}
        position={[0, 0, 0]}
        height={height}
        baseBarHeight={baseBarHeight}
        thickness={thickness}
      />

      {/* Internal Equipment Spacing Highlights - Always render for testing */}
      <InternalEquipmentSpacingHighlights
        sectionName="sectionA"
        sectionData={sections.sectionA}
        position={[0, 0, 0]}
        height={height}
        baseBarHeight={baseBarHeight}
        thickness={thickness}
      />

      {/* Doors and Drawers Highlights */}
      <DoorsDrawersHighlights
        sectionName="sectionA"
        sectionData={sections.sectionA}
        position={[0, 0, 0]}
        height={height}
        baseBarHeight={baseBarHeight}
        thickness={thickness}
      />

      {/* Doors and Drawers Renderer */}
      <DoorsDrawersRenderer
        sectionData={sections.sectionA}
        position={[0, 0, 0]}
        height={height}
        baseBarHeight={baseBarHeight}
        thickness={thickness}
        texture={texture}
      />

      {/* Rail Renderer for Section A */}
      <RailRenderer
        sectionName="sectionA"
        sectionData={sections.sectionA}
        height={height}
        baseBarHeight={baseBarHeight}
        thickness={thickness}
      />
    </group>
  );
};

export default LinearWardrobe;
