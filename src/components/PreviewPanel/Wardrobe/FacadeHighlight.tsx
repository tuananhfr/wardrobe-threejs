import React from "react";
import { Text } from "@react-three/drei";
import { useConfig } from "@/components/context/WardrobeContext";

interface FacadeHighlightProps {
  overlaySize: [number, number, number];
  overlayPosition: [number, number, number];
  iconPosition: [number, number, number];
  spacingId: string;
}

const FacadeHighlight: React.FC<FacadeHighlightProps> = ({
  overlaySize,
  overlayPosition,
  iconPosition,
  spacingId,
}) => {
  const { config } = useConfig();

  const inFacades =
    config.accordionOpen === "collapseTextures" &&
    config.activeView === "facades";

  const isHovered = config.hoveredFacadeSpacingId === spacingId;
  const isSelected = config.selectedFacadeSpacingIds.includes(spacingId);

  // Hiển thị overlay khi có hover hoặc selected
  const showOverlay = inFacades && (isHovered || isSelected);
  // Hiển thị icon khi ở chế độ facades (để người dùng biết có thể click)
  const showIcon = inFacades;

  return (
    <>
      {showOverlay && (
        <mesh position={overlayPosition}>
          <boxGeometry args={overlaySize} />
          <meshBasicMaterial
            color="#f8f9fa"
            transparent
            opacity={isSelected ? 0.6 : 0.4}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      )}

      {showIcon && (
        <group position={iconPosition}>
          <mesh>
            <circleGeometry args={[0.05, 32]} />
            <meshBasicMaterial color="white" transparent opacity={0.9} />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            color={isSelected ? "green" : "#4169E1"}
            fontSize={0.1}
            anchorX="center"
            anchorY="middle"
          >
            {isSelected ? "✓" : "+"}
          </Text>
        </group>
      )}
    </>
  );
};

export default FacadeHighlight;
