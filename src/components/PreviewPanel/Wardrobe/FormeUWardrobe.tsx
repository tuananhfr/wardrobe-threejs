import React, { useMemo } from "react";
import * as THREE from "three";
import SectionFrame from "./SectionFrame";
import SectionColumns from "./SectionColumns";

interface FormeUWardrobeProps {
  sections: {
    sectionA: WardrobeSection;
    sectionB?: WardrobeSection;
    sectionC?: WardrobeSection;
  };
  thickness: number;
  height: number;
  baseBarHeight: number;
  texture: THREE.Texture;
}

const FormeUWardrobe: React.FC<FormeUWardrobeProps> = ({
  sections,
  thickness,
  height,
  baseBarHeight,
  texture,
}) => {
  // Convert dimensions to meters và tính toán vị trí
  const calculations = useMemo(() => {
    if (!sections.sectionB || !sections.sectionC) {
      return null;
    }

    const sectionA = {
      width: sections.sectionA.width,
      depth: sections.sectionA.depth,
    };

    const sectionB = {
      width: sections.sectionB.width,
      depth: sections.sectionB.depth,
    };

    const sectionC = {
      width: sections.sectionC.width,
      depth: sections.sectionC.depth,
    };

    // Section A - phần giữa (ngang)
    const sectionAPosition: [number, number, number] = [
      0, // Căn giữa theo trục X
      0, // Căn giữa theo trục Y
      0, // Căn giữa theo trục Z
    ];

    // Section B - cánh trái (dọc)
    const sectionBPosition: [number, number, number] = [
      -sectionA.width / 2 + sectionB.depth / 2,
      0,
      sectionA.depth / 2 + sectionB.width / 2, // Về phía trước
    ];

    // Section C - cánh phải (dọc)
    const sectionCPosition: [number, number, number] = [
      sectionA.width / 2 - sectionC.depth / 2, // Bên phải section A
      0,
      sectionA.depth / 2 + sectionC.width / 2, // Về phía trước
    ];

    return {
      sectionA,
      sectionB,
      sectionC,
      sectionAPosition,
      sectionBPosition,
      sectionCPosition,
    };
  }, [sections, thickness]);

  // Early return sau khi gọi hooks
  if (!sections.sectionB || !sections.sectionC) {
    console.warn("FormeUWardrobe requires both sectionB and sectionC");
    return null;
  }

  if (!calculations) {
    return null;
  }

  const { sectionAPosition, sectionBPosition, sectionCPosition } = calculations;

  return (
    <group>
      {/* Section A - phần giữa ngang */}
      <SectionFrame
        sectionData={sections.sectionA}
        height={height}
        baseBarHeight={baseBarHeight}
        position={sectionAPosition}
        thickness={thickness}
        texture={texture}
      />

      {/* Section A Columns */}
      <SectionColumns
        sectionData={sections.sectionA}
        height={height}
        baseBarHeight={baseBarHeight}
        position={sectionAPosition}
        thickness={thickness}
        texture={texture}
      />

      {/* Section B - cánh trái */}
      <group position={sectionBPosition} rotation={[0, Math.PI / 2, 0]}>
        <SectionFrame
          sectionData={sections.sectionB}
          height={height}
          baseBarHeight={baseBarHeight}
          position={[0, 0, 0]}
          thickness={thickness}
          texture={texture}
          hideRightSide={true}
          backPanelWidth={sections.sectionB.width - thickness}
          backPanelOffsetX={thickness / 2}
        />

        {/* Section B Columns */}
        <SectionColumns
          sectionData={sections.sectionB}
          height={height}
          baseBarHeight={baseBarHeight}
          position={[0, 0, 0]}
          thickness={thickness}
          texture={texture}
        />
      </group>

      {/* Section C - cánh phải */}
      <group position={sectionCPosition} rotation={[0, -Math.PI / 2, 0]}>
        <SectionFrame
          sectionData={sections.sectionC}
          height={height}
          baseBarHeight={baseBarHeight}
          position={[0, 0, 0]}
          thickness={thickness}
          texture={texture}
          hideLeftSide={true}
          backPanelWidth={sections.sectionC.width - thickness}
          backPanelOffsetX={-thickness / 2}
        />

        {/* Section C Columns */}
        <SectionColumns
          sectionData={sections.sectionC}
          height={height}
          baseBarHeight={baseBarHeight}
          position={[0, 0, 0]}
          thickness={thickness}
          texture={texture}
        />
      </group>
    </group>
  );
};

export default FormeUWardrobe;
