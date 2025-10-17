import React from "react";
import * as THREE from "three";

interface WardrobeFrameProps {
  width: number;
  height: number;
  depth: number;
  thickness: number;
  texture: THREE.Texture;
}

const WardrobeFrame: React.FC<WardrobeFrameProps> = ({
  width,
  height,
  depth,
  thickness,
  texture,
}) => {
  return (
    <group>
      {/* Left side */}
      <mesh position={[-width / 2 + thickness / 2, 0, 0]} castShadow>
        <boxGeometry args={[thickness, height, depth]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Right side */}
      <mesh position={[width / 2 - thickness / 2, 0, 0]} castShadow>
        <boxGeometry args={[thickness, height, depth]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Top */}
      <mesh position={[0, height / 2 - thickness / 2, 0]} castShadow>
        <boxGeometry args={[width, thickness, depth]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Bottom */}
      <mesh position={[0, -height / 2 + thickness / 2, 0]} castShadow>
        <boxGeometry args={[width, thickness, depth]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Back panel */}
      <mesh position={[0, 0, -depth / 2 + thickness / 4]} castShadow>
        <boxGeometry
          args={[width - 2 * thickness, height - 2 * thickness, thickness / 2]}
        />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Vertical divider (middle) */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry
          args={[thickness, height - 2 * thickness, depth - thickness]}
        />
        <meshStandardMaterial map={texture} />
      </mesh>
    </group>
  );
};

export default WardrobeFrame;
