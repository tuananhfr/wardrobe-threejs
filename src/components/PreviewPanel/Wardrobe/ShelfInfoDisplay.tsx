// src/components/Wardrobe/ShelfInfoDisplay.tsx
import React from "react";
import { Text } from "@react-three/drei";

interface ShelfInfoDisplayProps {
  shelf: shelfSpacing;
  position: [number, number, number];
  columnWidth: number;
  isVisible: boolean;
  totalHeight: number;
}

const ShelfInfoDisplay: React.FC<ShelfInfoDisplayProps> = ({
  shelf,
  position,
  columnWidth,
  isVisible,
  totalHeight,
}) => {
  if (!isVisible) return null;

  const distanceFromBottom = shelf.spacing;
  const distanceFromTop = totalHeight * 100 - shelf.spacing; // Convert back to cm

  return (
    <group position={position}>
      {/* Height indicator line */}
      <mesh>
        <cylinderGeometry args={[0.001, 0.001, 0.3]} />
        <meshBasicMaterial color="yellow" />
      </mesh>

      {/* Text display */}
      <Text
        position={[columnWidth / 2 + 0.05, 0.1, 0]}
        fontSize={0.02}
        color="white"
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.002}
        outlineColor="black"
      >
        {`${distanceFromBottom.toFixed(0)}cm`}
      </Text>

      <Text
        position={[columnWidth / 2 + 0.05, 0.05, 0]}
        fontSize={0.015}
        color="lightgray"
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.001}
        outlineColor="black"
      >
        {`↑${distanceFromTop.toFixed(0)}cm | ↓${distanceFromBottom.toFixed(
          0
        )}cm`}
      </Text>

      {/* Small marker sphere */}
      <mesh position={[columnWidth / 2 + 0.02, 0, 0]}>
        <sphereGeometry args={[0.008]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
    </group>
  );
};

export default ShelfInfoDisplay;
