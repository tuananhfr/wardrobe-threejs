// src/components/Wardrobe/types/LinearWardrobe.tsx
import React from "react";
import * as THREE from "three";
import SectionFrame from "./SectionFrame";
import SectionColumns from "./SectionColumns";

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
}

const LinearWardrobe: React.FC<LinearWardrobeProps> = ({
  sections,
  height,
  baseBarHeight,
  thickness,
  texture,
}) => {
  return (
    <group>
      {/* Section A Frame */}
      <SectionFrame
        sectionData={sections.sectionA}
        height={height}
        baseBarHeight={baseBarHeight}
        position={[0, 0, 0]}
        thickness={thickness}
        texture={texture}
      />

      {/* Section A Columns */}
      <SectionColumns
        sectionData={sections.sectionA}
        height={height}
        baseBarHeight={baseBarHeight}
        position={[0, 0, 0]}
        thickness={thickness}
        texture={texture}
      />
    </group>
  );
};

export default LinearWardrobe;
