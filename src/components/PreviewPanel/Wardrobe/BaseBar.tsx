// src/components/Wardrobe/BaseBar.tsx
import React from "react";
import * as THREE from "three";

interface BaseBarProps {
  sections: {
    sectionA: { width: number; depth: number };
    sectionB?: { width: number; depth: number };
    sectionC?: { width: number; depth: number };
  };
  baseBarHeight: number;
  height: number;

  texture: THREE.Texture;
  wardrobeType: "Linéaire" | "Angle" | "Forme U";
}

const BaseBar: React.FC<BaseBarProps> = ({
  sections,
  baseBarHeight,
  height,

  texture,
  wardrobeType,
}) => {
  const renderBaseBar = () => {
    switch (wardrobeType) {
      case "Linéaire":
        // Chân tủ thẳng - chỉ section A
        return (
          <mesh position={[0, -height / 2, 0]} castShadow receiveShadow>
            <boxGeometry
              args={[
                sections.sectionA.width,
                baseBarHeight,
                sections.sectionA.depth,
              ]}
            />
            <meshStandardMaterial map={texture} />
          </mesh>
        );

      case "Angle":
        // Chân tủ hình L - section A và B
        if (!sections.sectionB) return null;

        return (
          <group>
            {/* Base cho Section A */}
            <mesh position={[0, -height / 2, 0]} castShadow receiveShadow>
              <boxGeometry
                args={[
                  sections.sectionA.width,
                  baseBarHeight,
                  sections.sectionA.depth,
                ]}
              />
              <meshStandardMaterial map={texture} />
            </mesh>

            {/* Base cho Section B - tính toán position như AngleWardrobe */}
            <mesh
              position={[
                sections.sectionA.width / 2 - sections.sectionB.depth / 2,
                -height / 2,
                sections.sectionA.depth / 2 + sections.sectionB.width / 2,
              ]}
              rotation={[0, -Math.PI / 2, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry
                args={[
                  sections.sectionB.width,
                  baseBarHeight,
                  sections.sectionB.depth,
                ]}
              />
              <meshStandardMaterial map={texture} />
            </mesh>
          </group>
        );

      case "Forme U":
        // Chân tủ hình U - section A, B và C
        if (!sections.sectionB || !sections.sectionC) return null;

        return (
          <group>
            {/* Base cho Section A */}
            <mesh position={[0, -height / 2, 0]} castShadow receiveShadow>
              <boxGeometry
                args={[
                  sections.sectionA.width,
                  baseBarHeight,
                  sections.sectionA.depth,
                ]}
              />
              <meshStandardMaterial map={texture} />
            </mesh>

            {/* Base cho Section B - position giống AngleWardrobe pattern */}
            <mesh
              position={[
                -sections.sectionA.width / 2 + sections.sectionB.depth / 2, // Tương tự AngleWardrobe nhưng bên trái
                -height / 2,
                sections.sectionA.depth / 2 + sections.sectionB.width / 2,
              ]}
              rotation={[0, -Math.PI / 2, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry
                args={[
                  sections.sectionB.width,
                  baseBarHeight,
                  sections.sectionB.depth,
                ]}
              />
              <meshStandardMaterial map={texture} />
            </mesh>

            {/* Base cho Section C - position giống AngleWardrobe */}
            <mesh
              position={[
                sections.sectionA.width / 2 - sections.sectionC.depth / 2, // Giống AngleWardrobe sectionB
                -height / 2,
                sections.sectionA.depth / 2 + sections.sectionC.width / 2,
              ]}
              rotation={[0, Math.PI / 2, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry
                args={[
                  sections.sectionC.width,
                  baseBarHeight,
                  sections.sectionC.depth,
                ]}
              />
              <meshStandardMaterial map={texture} />
            </mesh>
          </group>
        );
      default:
        return null;
    }
  };

  return <group>{renderBaseBar()}</group>;
};

export default BaseBar;
