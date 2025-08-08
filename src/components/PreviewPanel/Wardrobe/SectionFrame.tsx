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

  return (
    <group position={position}>
      {/* Left side */}
      {!hideLeftSide && (
        <mesh position={[-width / 2 + thickness / 2, 0, 0]} castShadow>
          <boxGeometry args={[thickness, height - baseBarHeight, depth]} />
          <meshStandardMaterial map={texture} color="white" />
        </mesh>
      )}

      {/* Right side */}
      {!hideRightSide && (
        <mesh position={[width / 2 - thickness / 2, 0, 0]} castShadow>
          <boxGeometry args={[thickness, height - baseBarHeight, depth]} />
          <meshStandardMaterial map={texture} color="white" />
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
          <meshStandardMaterial map={texture} color="white" />
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
          <meshStandardMaterial map={texture} color="white" />
        </mesh>
      ) : (
        <mesh
          position={[0, height / 2 - baseBarHeight / 2 - thickness / 2, 0]}
          castShadow
        >
          <boxGeometry args={[width - 2 * thickness, thickness, depth]} />
          <meshStandardMaterial map={texture} color="white" />
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
          <meshStandardMaterial map={texture} color="white" />
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
          <meshStandardMaterial map={texture} color="white" />
        </mesh>
      ) : (
        <mesh
          position={[0, -height / 2 + baseBarHeight / 2 + thickness / 2, 0]}
          castShadow
        >
          <boxGeometry args={[width - 2 * thickness, thickness, depth]} />
          <meshStandardMaterial map={texture} color="white" />
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
        <meshStandardMaterial map={texture} color="white" />
      </mesh>

      {/* Highlight overlay khi active */}
      {isActive && (
        <>
          {/* Left side highlight */}
          {!hideLeftSide && (
            <mesh position={[-width / 2 + thickness / 2, 0, 0]}>
              <boxGeometry args={[thickness, height - baseBarHeight, depth]} />
              <meshBasicMaterial
                color="#e6f7f9"
                transparent
                opacity={0.6}
                depthWrite={false}
                depthTest={false}
              />
            </mesh>
          )}

          {/* Right side highlight */}
          {!hideRightSide && (
            <mesh position={[width / 2 - thickness / 2, 0, 0]}>
              <boxGeometry args={[thickness, height - baseBarHeight, depth]} />
              <meshBasicMaterial
                color="#e6f7f9"
                transparent
                opacity={0.6}
                depthWrite={false}
                depthTest={false}
              />
            </mesh>
          )}

          {/* Top highlight */}
          {hideLeftSide ? (
            <mesh
              position={[
                -thickness / 2,
                height / 2 - baseBarHeight / 2 - thickness / 2,
                0,
              ]}
            >
              <boxGeometry args={[width - thickness, thickness, depth]} />
              <meshBasicMaterial
                color="#e6f7f9"
                transparent
                opacity={0.6}
                depthWrite={false}
                depthTest={false}
              />
            </mesh>
          ) : hideRightSide ? (
            <mesh
              position={[
                thickness / 2,
                height / 2 - baseBarHeight / 2 - thickness / 2,
                0,
              ]}
            >
              <boxGeometry args={[width - thickness, thickness, depth]} />
              <meshBasicMaterial
                color="#e6f7f9"
                transparent
                opacity={0.6}
                depthWrite={false}
                depthTest={false}
              />
            </mesh>
          ) : (
            <mesh
              position={[0, height / 2 - baseBarHeight / 2 - thickness / 2, 0]}
            >
              <boxGeometry args={[width - 2 * thickness, thickness, depth]} />
              <meshBasicMaterial
                color="#e6f7f9"
                transparent
                opacity={0.6}
                depthWrite={false}
                depthTest={false}
              />
            </mesh>
          )}

          {/* Bottom highlight */}
          {hideLeftSide ? (
            <mesh
              position={[
                -thickness / 2,
                -height / 2 + baseBarHeight / 2 + thickness / 2,
                0,
              ]}
            >
              <boxGeometry args={[width - thickness, thickness, depth]} />
              <meshBasicMaterial
                color="#e6f7f9"
                transparent
                opacity={0.6}
                depthWrite={false}
                depthTest={false}
              />
            </mesh>
          ) : hideRightSide ? (
            <mesh
              position={[
                thickness / 2,
                -height / 2 + baseBarHeight / 2 + thickness / 2,
                0,
              ]}
            >
              <boxGeometry args={[width - thickness, thickness, depth]} />
              <meshBasicMaterial
                color="#e6f7f9"
                transparent
                opacity={0.6}
                depthWrite={false}
                depthTest={false}
              />
            </mesh>
          ) : (
            <mesh
              position={[0, -height / 2 + baseBarHeight / 2 + thickness / 2, 0]}
            >
              <boxGeometry args={[width - 2 * thickness, thickness, depth]} />
              <meshBasicMaterial
                color="#e6f7f9"
                transparent
                opacity={0.6}
                depthWrite={false}
                depthTest={false}
              />
            </mesh>
          )}

          {/* Back panel highlight */}
          <mesh
            position={[backPanelOffsetX || 0, 0, -depth / 2 + thickness / 2]}
          >
            <boxGeometry
              args={[
                actualBackPanelWidth,
                height - 2 * thickness - baseBarHeight,
                thickness,
              ]}
            />
            <meshBasicMaterial
              color="#e6f7f9"
              transparent
              opacity={0.6}
              depthWrite={false}
              depthTest={false}
            />
          </mesh>
        </>
      )}
    </group>
  );
};

export default SectionFrame;
