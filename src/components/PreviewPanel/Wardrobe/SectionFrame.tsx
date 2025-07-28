// src/components/Wardrobe/SectionFrame.tsx
import React from "react";
import * as THREE from "three";

interface SectionFrameProps {
  sectionData: WardrobeSection;
  position: [number, number, number];
  height: number;
  baseBarHeight: number;
  thickness: number;
  texture: THREE.Texture;
  hideLeftSide?: boolean;
  hideRightSide?: boolean;
  backPanelWidth?: number;
  backPanelOffsetX?: number;
}

const SectionFrame: React.FC<SectionFrameProps> = ({
  sectionData,
  position,
  height,
  baseBarHeight,
  thickness,
  texture,
  hideLeftSide = false,
  hideRightSide = false,
  backPanelWidth,
  backPanelOffsetX,
}) => {
  const width = sectionData.width;

  const depth = sectionData.depth;

  const actualBackPanelWidth = backPanelWidth
    ? backPanelWidth
    : width - 2 * thickness;

  return (
    <group position={position}>
      {/* Left side */}
      {!hideLeftSide && (
        <mesh position={[-width / 2 + thickness / 2, 0, 0]} castShadow>
          <boxGeometry args={[thickness, height - baseBarHeight, depth]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      )}

      {/* Right side */}
      {!hideRightSide && (
        <mesh position={[width / 2 - thickness / 2, 0 / 2, 0]} castShadow>
          <boxGeometry args={[thickness, height - baseBarHeight, depth]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      )}

      {/* Top */}

      {hideLeftSide ? (
        // Khi ẩn bên trái - top mesh dịch sang phải
        <mesh
          position={[
            -thickness / 2,
            height / 2 - baseBarHeight / 2 - thickness / 2,
            0,
          ]}
          castShadow
        >
          <boxGeometry args={[width - thickness, thickness, depth]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      ) : hideRightSide ? (
        // Khi ẩn bên phải - top mesh dịch sang trái
        <mesh
          position={[
            thickness / 2,
            height / 2 - baseBarHeight / 2 - thickness / 2,
            0,
          ]}
          castShadow
        >
          <boxGeometry args={[width - thickness, thickness, depth]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      ) : (
        // Trường hợp bình thường - top mesh ở giữa
        <mesh
          position={[0, height / 2 - baseBarHeight / 2 - thickness / 2, 0]}
          castShadow
        >
          <boxGeometry args={[width - 2 * thickness, thickness, depth]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      )}

      {/* Bottom */}
      {/* Bottom - chỉ render 1 mesh dựa trên điều kiện */}
      {hideLeftSide ? (
        // Khi ẩn bên trái - bottom mesh dịch sang phải
        <mesh
          position={[
            -thickness / 2,
            -height / 2 + baseBarHeight / 2 + thickness / 2,
            0,
          ]}
          castShadow
        >
          <boxGeometry args={[width - thickness, thickness, depth]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      ) : hideRightSide ? (
        // Khi ẩn bên phải - bottom mesh dịch sang trái
        <mesh
          position={[
            thickness / 2,
            -height / 2 + baseBarHeight / 2 + thickness / 2,
            0,
          ]}
          castShadow
        >
          <boxGeometry args={[width - thickness, thickness, depth]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      ) : (
        // Trường hợp bình thường - bottom mesh ở giữa
        <mesh
          position={[0, -height / 2 + baseBarHeight / 2 + thickness / 2, 0]}
          castShadow
        >
          <boxGeometry args={[width - 2 * thickness, thickness, depth]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      )}

      {/* Back panel */}
      <mesh
        position={[backPanelOffsetX || 0, 0, -depth / 2 + thickness / 2]}
        castShadow
      >
        <boxGeometry
          args={[
            actualBackPanelWidth,
            height - 2 * thickness - baseBarHeight,
            thickness,
          ]}
        />
        <meshStandardMaterial map={texture} />
      </mesh>
    </group>
  );
};

export default SectionFrame;
