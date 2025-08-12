import React, { useMemo } from "react";
import * as THREE from "three";
import SectionFrame from "./SectionFrame";
import SectionColumns from "./SectionColumns";
import SectionShelves from "./SectionShelves";
import EtagereColumnHighlights from "./EtagereColumnHighlights";
import InternalEquipmentSpacingHighlights from "./InternalEquipmentSpacingHighlights";
import DoorsDrawersHighlights from "./DoorsDrawersHighlights";
import DoorsDrawersRenderer from "./DoorsDrawersRenderer";
import RailRenderer from "./RailRenderer";

interface AngleWardrobeProps {
  sections: {
    sectionA: WardrobeSection;
    sectionB?: WardrobeSection;
    sectionC?: WardrobeSection;
  };
  thickness: number;
  height: number;
  baseBarHeight: number;
  texture: THREE.Texture;
  showSections: string;
  ledColor: string;
}

const AngleWardrobe: React.FC<AngleWardrobeProps> = ({
  sections,
  thickness,
  height,
  baseBarHeight,
  texture,
  showSections,
  ledColor,
}) => {
  // Convert dimensions to meters và tính toán vị trí
  const calculations = useMemo(() => {
    if (!sections.sectionB) {
      return null;
    }
    const sectionA = {
      width: sections.sectionA.width,
      depth: sections.sectionA.depth,
      height: height,
    };

    const sectionB = {
      width: sections.sectionB.width,
      depth: sections.sectionB.depth,
      height: height,
    };

    // Tính toán vị trí để tạo hình chữ L đẹp
    // Section A nằm ngang (trục X chính)
    const sectionAPosition: [number, number, number] = [
      0, // Căn giữa theo trục X
      0, // Căn giữa theo trục Y
      0, // Căn giữa theo trục Z
    ];

    // Section B nằm dọc, tạo góc vuông với A ở góc phải-trước
    const sectionBPosition: [number, number, number] = [
      sectionA.width / 2 - sectionB.depth / 2,
      0, // Cùng độ cao với A
      sectionA.depth / 2 + sectionB.width / 2,
    ];

    return {
      sectionA,
      sectionB,
      sectionAPosition,
      sectionBPosition,
    };
  }, [sections, thickness]);

  // Early return sau khi gọi hooks
  if (!sections.sectionB) {
    console.warn("AngleWardrobe requires sectionB for L-shape");
    return null;
  }

  if (!calculations) {
    return null;
  }

  const { sectionAPosition, sectionBPosition } = calculations;

  return (
    <group>
      {/* Section A - phần ngang chính */}
      <SectionFrame
        sectionName="sectionA"
        sectionData={sections.sectionA}
        height={height}
        baseBarHeight={baseBarHeight}
        position={sectionAPosition}
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
        position={sectionAPosition}
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

      {/* Section B */}
      <group position={sectionBPosition} rotation={[0, -Math.PI / 2, 0]}>
        <SectionFrame
          sectionName="sectionB"
          sectionData={sections.sectionB}
          height={height}
          baseBarHeight={baseBarHeight}
          position={[0, 0, 0]}
          thickness={thickness}
          texture={texture}
          hideLeftSide={true}
          backPanelWidth={sections.sectionB.width - thickness}
          backPanelOffsetX={-thickness / 2}
          showSections={showSections}
          ledColor={ledColor}
        />

        {/* Section B Columns */}
        <SectionColumns
          sectionData={sections.sectionB}
          height={height}
          baseBarHeight={baseBarHeight}
          position={[0, 0, 0]}
          thickness={thickness}
          texture={texture}
          ledColor={ledColor}
        />

        {/* Section B Shelves */}
        <SectionShelves
          sectionName="sectionB"
          sectionData={sections.sectionB}
          height={height}
          baseBarHeight={baseBarHeight}
          position={[0, 0, 0]}
          thickness={thickness}
          texture={texture}
          showSections={showSections}
        />

        {/* Étagère Column Highlights - Based on working ColumnHighlights pattern */}
        <EtagereColumnHighlights
          sectionName="sectionB"
          sectionData={sections.sectionB}
          position={[0, 0, 0]}
          height={height}
          baseBarHeight={baseBarHeight}
          thickness={thickness}
        />

        <InternalEquipmentSpacingHighlights
          sectionName="sectionB"
          sectionData={sections.sectionB}
          position={[0, 0, 0]}
          height={height}
          baseBarHeight={baseBarHeight}
          thickness={thickness}
        />

        {/* Doors and Drawers Highlights */}
        <DoorsDrawersHighlights
          sectionName="sectionB"
          sectionData={sections.sectionB}
          position={[0, 0, 0]}
          height={height}
          baseBarHeight={baseBarHeight}
          thickness={thickness}
        />

        {/* Doors and Drawers Renderer */}
        <DoorsDrawersRenderer
          sectionData={sections.sectionB}
          position={[0, 0, 0]}
          height={height}
          baseBarHeight={baseBarHeight}
          thickness={thickness}
          texture={texture}
        />

        {/* Rail Renderer for Section B */}
        <RailRenderer
          sectionName="sectionB"
          sectionData={sections.sectionB}
          height={height}
          baseBarHeight={baseBarHeight}
          thickness={thickness}
        />
      </group>
    </group>
  );
};

export default AngleWardrobe;
