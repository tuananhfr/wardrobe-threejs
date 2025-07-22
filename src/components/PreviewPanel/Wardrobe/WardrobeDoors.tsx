// src/components/Wardrobe/WardrobeDoors.tsx
import React from "react";
import * as THREE from "three";

interface WardrobeDoorsProps {
  width: number;
  height: number;
  depth: number;
  thickness: number;
  leftSectionWidth: number;
  rightSectionWidth: number;
  texture: THREE.Texture;
}

const WardrobeDoors: React.FC<WardrobeDoorsProps> = ({
  width,
  height,
  depth,
  thickness,
  leftSectionWidth,
  rightSectionWidth,
  texture,
}) => {
  const createDoor = (
    doorWidth: number,
    doorHeight: number,
    x: number,
    y: number,
    z: number,
    doorId: string,
    isLeftHinge: boolean = true
  ) => {
    const offsetX = isLeftHinge ? doorWidth / 2 : -doorWidth / 2;
    const handleX = isLeftHinge ? doorWidth / 2 - 0.05 : -doorWidth / 2 + 0.05;

    return (
      <group
        key={doorId}
        position={[x + (isLeftHinge ? -offsetX : offsetX), y, z]}
      >
        {/* Door panel */}
        <mesh
          position={[offsetX, 0, 0]}
          userData={{ type: "door", id: doorId }}
          castShadow
        >
          <boxGeometry args={[doorWidth, doorHeight, thickness / 2]} />
          <meshStandardMaterial map={texture} />
        </mesh>

        {/* Door handle */}
        <mesh
          position={[handleX, 0, thickness / 4 + 0.01]}
          rotation={[0, 0, Math.PI / 2]}
          userData={{ type: "door", id: doorId }}
        >
          <cylinderGeometry args={[0.01, 0.01, 0.1]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      </group>
    );
  };

  const leftDoorWidth = leftSectionWidth / 2;
  const leftDoorHeight = (height - 2 * thickness) / 2 - thickness / 2;
  const rightDoorWidth = rightSectionWidth / 2;
  const rightDoorHeight = height - 2 * thickness;

  return (
    <group>
      {/* Left section doors */}
      {createDoor(
        leftDoorWidth,
        leftDoorHeight,
        -leftSectionWidth / 2 - thickness / 2 - leftDoorWidth / 2,
        height / 4,
        depth / 2 - thickness / 4,
        "leftTopLeft",
        true
      )}

      {createDoor(
        leftDoorWidth,
        leftDoorHeight,
        -leftSectionWidth / 2 - thickness / 2 + leftDoorWidth / 2,
        height / 4,
        depth / 2 - thickness / 4,
        "leftTopRight",
        false
      )}

      {createDoor(
        leftDoorWidth,
        leftDoorHeight,
        -leftSectionWidth / 2 - thickness / 2 - leftDoorWidth / 2,
        -height / 4,
        depth / 2 - thickness / 4,
        "leftBottomLeft",
        true
      )}

      {createDoor(
        leftDoorWidth,
        leftDoorHeight,
        -leftSectionWidth / 2 - thickness / 2 + leftDoorWidth / 2,
        -height / 4,
        depth / 2 - thickness / 4,
        "leftBottomRight",
        false
      )}

      {/* Right section doors */}
      {createDoor(
        rightDoorWidth,
        rightDoorHeight,
        rightSectionWidth / 2 + thickness / 2 - rightDoorWidth / 2,
        0,
        depth / 2 - thickness / 4,
        "rightLeft",
        true
      )}

      {createDoor(
        rightDoorWidth,
        rightDoorHeight,
        rightSectionWidth / 2 + thickness / 2 + rightDoorWidth / 2,
        0,
        depth / 2 - thickness / 4,
        "rightRight",
        false
      )}
    </group>
  );
};

export default WardrobeDoors;
