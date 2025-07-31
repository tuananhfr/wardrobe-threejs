// src/components/Wardrobe/SectionFrame.tsx
import React from "react";
import * as THREE from "three";

interface SectionFrameProps {
  sectionName: string;
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
  showSections: string;
}

const SectionFrame: React.FC<SectionFrameProps> = ({
  sectionName,
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
  showSections,
}) => {
  const width = sectionData.width;
  const depth = sectionData.depth;
  const actualBackPanelWidth = backPanelWidth
    ? backPanelWidth
    : width - 2 * thickness;

  // Kiểm tra xem section này có đang bật không
  const isActive = showSections === sectionName;

  // Màu sắc tùy theo có bật hay không
  const materialColor = isActive ? "black" : "white";

  return (
    <group position={position}>
      {/* Left side */}
      {!hideLeftSide && (
        <mesh position={[-width / 2 + thickness / 2, 0, 0]} castShadow>
          <boxGeometry args={[thickness, height - baseBarHeight, depth]} />
          <meshStandardMaterial map={texture} color={"red"} />
        </mesh>
      )}

      {/* Right side */}
      {!hideRightSide && (
        <mesh position={[width / 2 - thickness / 2, 0, 0]} castShadow>
          <boxGeometry args={[thickness, height - baseBarHeight, depth]} />
          <meshStandardMaterial map={texture} color={materialColor} />
        </mesh>
      )}

      {/* Top */}
      {hideLeftSide ? (
        <mesh
          position={[
            -thickness / 2,
            height / 2 - baseBarHeight / 2 - thickness / 2,
            0,
          ]}
          castShadow
        >
          <boxGeometry args={[width - thickness, thickness, depth]} />
          <meshStandardMaterial map={texture} color={materialColor} />
        </mesh>
      ) : hideRightSide ? (
        <mesh
          position={[
            thickness / 2,
            height / 2 - baseBarHeight / 2 - thickness / 2,
            0,
          ]}
          castShadow
        >
          <boxGeometry args={[width - thickness, thickness, depth]} />
          <meshStandardMaterial map={texture} color={materialColor} />
        </mesh>
      ) : (
        <mesh
          position={[0, height / 2 - baseBarHeight / 2 - thickness / 2, 0]}
          castShadow
        >
          <boxGeometry args={[width - 2 * thickness, thickness, depth]} />
          <meshStandardMaterial map={texture} color={materialColor} />
        </mesh>
      )}

      {/* Bottom */}
      {hideLeftSide ? (
        <mesh
          position={[
            -thickness / 2,
            -height / 2 + baseBarHeight / 2 + thickness / 2,
            0,
          ]}
          castShadow
        >
          <boxGeometry args={[width - thickness, thickness, depth]} />
          <meshStandardMaterial map={texture} color={materialColor} />
        </mesh>
      ) : hideRightSide ? (
        <mesh
          position={[
            thickness / 2,
            -height / 2 + baseBarHeight / 2 + thickness / 2,
            0,
          ]}
          castShadow
        >
          <boxGeometry args={[width - thickness, thickness, depth]} />
          <meshStandardMaterial map={texture} color={materialColor} />
        </mesh>
      ) : (
        <mesh
          position={[0, -height / 2 + baseBarHeight / 2 + thickness / 2, 0]}
          castShadow
        >
          <boxGeometry args={[width - 2 * thickness, thickness, depth]} />
          <meshStandardMaterial map={texture} color={materialColor} />
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
        <meshStandardMaterial map={texture} color={materialColor} />
      </mesh>
    </group>
  );
};

export default SectionFrame;
