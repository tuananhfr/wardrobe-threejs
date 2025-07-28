import React, { useMemo } from "react";
import * as THREE from "three";
import SectionFrame from "./SectionFrame";
import SectionColumns from "./SectionColumns";

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
}

const AngleWardrobe: React.FC<AngleWardrobeProps> = ({
  sections,
  thickness,
  height,
  baseBarHeight,
  texture,
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

      {/* Section B */}
      <group position={sectionBPosition} rotation={[0, -Math.PI / 2, 0]}>
        <SectionFrame
          sectionData={sections.sectionB}
          height={height}
          baseBarHeight={baseBarHeight}
          position={[0, 0, 0]}
          thickness={thickness}
          texture={texture}
          hideLeftSide={true}
          backPanelWidth={sections.sectionB.width - thickness}
          backPanelOffsetX={-thickness / 2}
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
    </group>
  );
};

export default AngleWardrobe;
