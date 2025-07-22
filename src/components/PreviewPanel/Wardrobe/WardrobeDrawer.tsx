// src/components/Wardrobe/WardrobeDrawer.tsx
import React, { useRef } from "react";
import * as THREE from "three";

interface WardrobeDrawerProps {
  width: number;
  height: number;
  depth: number;
  thickness: number;
  leftSectionWidth: number;
  texture: THREE.Texture;
}

const WardrobeDrawer: React.FC<WardrobeDrawerProps> = ({
  width,
  height,
  depth,
  thickness,
  leftSectionWidth,
  texture,
}) => {
  const drawerRef = useRef<THREE.Group>(null);

  const drawerHeight = (height - 2 * thickness) / 4 - thickness;

  return (
    <group
      ref={drawerRef}
      position={[
        -leftSectionWidth / 2 - thickness / 2,
        height / 2 - thickness - (1.5 * (height - 2 * thickness)) / 4,
        0,
      ]}
    >
      {/* Drawer box */}
      <mesh userData={{ type: "drawer", id: "drawer" }} castShadow>
        <boxGeometry
          args={[leftSectionWidth - 0.02, drawerHeight, depth - 0.1]}
        />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Drawer handle */}
      <mesh
        position={[0, 0, (depth - 0.1) / 2 + 0.01]}
        userData={{ type: "drawer", id: "drawer" }}
      >
        <boxGeometry args={[0.1, 0.02, 0.02]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </group>
  );
};

export default WardrobeDrawer;
