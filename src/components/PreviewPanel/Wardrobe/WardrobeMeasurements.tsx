// src/components/Wardrobe/WardrobeMeasurements.tsx
import React from "react";

interface WardrobeMeasurementsProps {
  width: number;
  height: number;
  depth: number;
}

const WardrobeMeasurements: React.FC<WardrobeMeasurementsProps> = ({
  width,
  height,
  depth,
}) => {
  return (
    <group>
      {/* Width measurement */}
      <mesh position={[0, height / 2 + 0.2, 0]}>
        <planeGeometry args={[0.5, 0.1]} />
        <meshBasicMaterial color="blue" transparent opacity={0.8} />
      </mesh>

      {/* Height measurement */}
      <mesh position={[width / 2 + 0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[0.5, 0.1]} />
        <meshBasicMaterial color="blue" transparent opacity={0.8} />
      </mesh>

      {/* Depth measurement */}
      <mesh position={[0, 0, depth / 2 + 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 0.1]} />
        <meshBasicMaterial color="green" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

export default WardrobeMeasurements;
