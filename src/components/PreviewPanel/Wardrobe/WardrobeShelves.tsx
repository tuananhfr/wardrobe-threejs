// src/components/Wardrobe/WardrobeShelves.tsx
import React from "react";
import * as THREE from "three";

interface WardrobeShelvesProps {
  width: number;
  height: number;
  depth: number;
  thickness: number;
  leftSectionWidth: number;
  rightSectionWidth: number;
  texture: THREE.Texture;
}

const WardrobeShelves: React.FC<WardrobeShelvesProps> = ({
  width,
  height,
  depth,
  thickness,
  leftSectionWidth,
  rightSectionWidth,
  texture,
}) => {
  return (
    <group>
      {/* Shelves - left section */}
      {Array.from({ length: 3 }, (_, i) => (
        <mesh
          key={`left-shelf-${i}`}
          position={[
            -leftSectionWidth / 2 - thickness / 2,
            height / 2 - thickness - ((i + 1) * (height - 2 * thickness)) / 4,
            0,
          ]}
          castShadow
        >
          <boxGeometry
            args={[leftSectionWidth, thickness, depth - thickness]}
          />
          <meshStandardMaterial map={texture} />
        </mesh>
      ))}

      {/* Shelves - right section */}
      {Array.from({ length: 2 }, (_, i) => (
        <mesh
          key={`right-shelf-${i}`}
          position={[
            rightSectionWidth / 2 + thickness / 2,
            height / 2 - thickness - ((i + 1) * (height - 2 * thickness)) / 3,
            0,
          ]}
          castShadow
        >
          <boxGeometry
            args={[rightSectionWidth, thickness, depth - thickness]}
          />
          <meshStandardMaterial map={texture} />
        </mesh>
      ))}
    </group>
  );
};

export default WardrobeShelves;
