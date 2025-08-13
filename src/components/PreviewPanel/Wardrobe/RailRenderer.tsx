import React from "react";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";

interface RailRendererProps {
  sectionName: string;
  sectionData: WardrobeSection;
  height: number;
  baseBarHeight: number;
  thickness: number;
}

const RailRenderer: React.FC<RailRendererProps> = ({
  sectionName,
  sectionData,
  height,
  baseBarHeight,
  thickness,
}) => {
  const { config } = useWardrobeConfig();

  // Get all spacing IDs that have rail equipment for this section
  const railSpacingIds = Object.entries(config.internalEquipmentConfig)
    .filter(([spacingId, equipmentType]) => {
      return (
        (equipmentType === "trigle" ||
          equipmentType === "penderieEscamotable" ||
          equipmentType === "doubleRail") &&
        spacingId.startsWith(sectionName)
      );
    })
    .map(([spacingId, equipmentType]) => ({ spacingId, equipmentType }));

  // Don't render if no rail equipment is configured for this section
  if (railSpacingIds.length === 0) {
    return null;
  }

  // Parse selected spacing ID to get column info
  const parseSpacingId = (spacingId: string) => {
    const parts = spacingId.split("-");

    // Handle format: "sectionA-col-1-spacing-3"
    let columnId: string;
    let spacingIndex: number;

    if (parts.length === 5 && parts[1] === "col" && parts[3] === "spacing") {
      // Format: "sectionA-col-1-spacing-3"
      columnId = `${parts[0]}-${parts[1]}-${parts[2]}`; // "sectionA-col-1"
      spacingIndex = parseInt(parts[4]); // 3
    } else {
      // Fallback to old format: "columnId-spacing-index"
      columnId = parts[0];
      spacingIndex = parseInt(parts[2]);
    }

    // Find column in this section
    let foundColumn: any = null;
    let foundColumnIndex: number = -1;

    if (sectionData && sectionData.columns) {
      const columnIndex = sectionData.columns.findIndex(
        (col: any) => col.id === columnId
      );
      if (columnIndex !== -1) {
        foundColumn = sectionData.columns[columnIndex];
        foundColumnIndex = columnIndex;
      }
    }
    return { foundColumn, foundColumnIndex, spacingIndex };
  };

  // Render all rails for configured rail equipment
  const renderRails = () => {
    return railSpacingIds.map(({ spacingId, equipmentType }) => {
      const { foundColumn, foundColumnIndex, spacingIndex } =
        parseSpacingId(spacingId);

      if (!foundColumn) {
        return null;
      }

      // Calculate rail position
      const getRailPosition = () => {
        // Calculate column X position (same logic as InternalEquipmentSpacingHighlights)
        // Sections are already converted to meters
        let startX = -sectionData.width / 2 + thickness;

        for (let i = 0; i < foundColumnIndex; i++) {
          const colWidth = sectionData.columns[i].width; // Already in meters
          startX += colWidth + thickness;
        }
        const columnX = startX + foundColumn.width / 2; // Already in meters

        // Calculate rail Y position - 10cm from shelf or plafond
        const spacings = foundColumn.shelves?.spacings || [];
        if (spacings.length === 0) {
          // If no spacings, place rail 20cm from plafond
          const railY = height / 2 - 0.2; // 20cm from plafond
          const result = {
            x: columnX,
            y: railY,
            width: foundColumn.width, // Already in meters
            depth: sectionData.depth, // Already in meters
          };
          return result;
        }

        // Calculate position based on spacing - same logic as InternalEquipmentSpacingHighlights
        let currentY = baseBarHeight * 100; // Keep in cm for calculation
        for (let i = 0; i < spacingIndex; i++) {
          const spacing = spacings[i];
          currentY += spacing.spacing + thickness * 100; // Add spacing + thickness
        }

        // Get current spacing
        const spacing = spacings[spacingIndex];
        const spacingHeightCm = spacing.spacing;

        // Calculate center of spacing (same as highlight)
        const worldY =
          (currentY + spacingHeightCm) / 100 - height / 2 + 2 * thickness;

        // Position rail based on equipment type
        let railY;
        if (equipmentType === "doubleRail") {
          // For doubleRail: use spacing position (will render both rails at fixed positions)
          railY = worldY - 0.2;
        } else {
          // For regular rails: 20cm above center of spacing
          railY = worldY - 0.2;
        }

        const result = {
          x: columnX,
          y: railY,
          width: foundColumn.width, // Already in meters
          depth: sectionData.depth, // Already in meters
        };
        return result;
      };

      const railPosition = getRailPosition();

      if (!railPosition) {
        return null;
      }

      // Render different rail types based on equipment type
      if (equipmentType === "penderieEscamotable") {
        return (
          <group key={spacingId} position={[railPosition.x, railPosition.y, 0]}>
            {/* Main rail cylinder - same as regular rail */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry
                args={[0.02, 0.02, railPosition.width - 0.18, 8]}
              />
              <meshStandardMaterial
                color="#000000"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Rail brackets (left and right) - same as regular rail */}
            {/* Left bracket */}
            <mesh
              position={[-(railPosition.width / 2 - 0.02 - thickness), 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
              <meshStandardMaterial color="#696969" />
            </mesh>

            {/* Right bracket */}
            <mesh
              position={[railPosition.width / 2 - 0.02 - thickness, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
              <meshStandardMaterial color="#696969" />
            </mesh>

            {/* Vertical extension bars - 50cm long from each bracket */}
            {/* Left vertical bar */}
            <mesh
              position={[
                -(railPosition.width / 2 - 0.02 - thickness),
                -0.25,
                0,
              ]}
              rotation={[0, 0, 0]}
            >
              <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
              <meshStandardMaterial
                color="#2c3e50"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Right vertical bar */}
            <mesh
              position={[railPosition.width / 2 - 0.02 - thickness, -0.25, 0]}
              rotation={[0, 0, 0]}
            >
              <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
              <meshStandardMaterial
                color="#2c3e50"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Center vertical bar - from middle of rail */}
            <mesh position={[0, -0.25, 0]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.5, 8]} />
              <meshStandardMaterial
                color="#2c3e50"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Base blocks for side supports */}
            {/* Left base block */}
            <mesh
              position={[-(railPosition.width / 2 - 0.02 - thickness), -0.5, 0]}
              rotation={[0, 0, 0]}
            >
              <boxGeometry args={[0.08, 0.12, 0.08]} />
              <meshStandardMaterial
                color="#2c3e50"
                metalness={0.6}
                roughness={0.3}
              />
            </mesh>

            {/* Right base block */}
            <mesh
              position={[railPosition.width / 2 - 0.02 - thickness, -0.5, 0]}
              rotation={[0, 0, 0]}
            >
              <boxGeometry args={[0.08, 0.12, 0.08]} />
              <meshStandardMaterial
                color="#2c3e50"
                metalness={0.6}
                roughness={0.3}
              />
            </mesh>
          </group>
        );
      } else if (equipmentType === "trigle") {
        // Regular trigle rail
        return (
          <group key={spacingId} position={[railPosition.x, railPosition.y, 0]}>
            {/* Rail cylinder */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry
                args={[0.02, 0.02, railPosition.width - 0.18, 8]}
              />
              <meshStandardMaterial
                color="#000000"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Rail brackets (left and right) - rotated to be horizontal */}
            {/* Left bracket */}
            <mesh
              position={[-(railPosition.width / 2 - 0.02 - thickness), 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
              <meshStandardMaterial color="#696969" />
            </mesh>

            {/* Right bracket */}
            <mesh
              position={[railPosition.width / 2 - 0.02 - thickness, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
              <meshStandardMaterial color="#696969" />
            </mesh>
          </group>
        );
      } else if (equipmentType === "doubleRail") {
        // Double rail system - escamotable on top, regular on bottom
        return (
          <group key={spacingId}>
            {/* Top rail - escamotable at height - 20cm */}
            <group position={[railPosition.x, height / 2 - 0.2, 0]}>
              {/* Main rail cylinder */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry
                  args={[0.02, 0.02, railPosition.width - 0.18, 8]}
                />
                <meshStandardMaterial
                  color="#000000"
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>

              {/* Rail brackets */}
              <mesh
                position={[-(railPosition.width / 2 - 0.02 - thickness), 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
                <meshStandardMaterial color="#696969" />
              </mesh>

              <mesh
                position={[railPosition.width / 2 - 0.02 - thickness, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
                <meshStandardMaterial color="#696969" />
              </mesh>

              {/* Vertical extension bars - 50cm long from each bracket */}
              <mesh
                position={[
                  -(railPosition.width / 2 - 0.02 - thickness),
                  -0.25,
                  0,
                ]}
                rotation={[0, 0, 0]}
              >
                <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
                <meshStandardMaterial
                  color="#2c3e50"
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>

              <mesh
                position={[railPosition.width / 2 - 0.02 - thickness, -0.25, 0]}
                rotation={[0, 0, 0]}
              >
                <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
                <meshStandardMaterial
                  color="#2c3e50"
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>

              {/* Center vertical bar */}
              <mesh position={[0, -0.25, 0]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.5, 8]} />
                <meshStandardMaterial
                  color="#2c3e50"
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>

              {/* Base blocks */}
              <mesh
                position={[
                  -(railPosition.width / 2 - 0.02 - thickness),
                  -0.5,
                  0,
                ]}
                rotation={[0, 0, 0]}
              >
                <boxGeometry args={[0.08, 0.12, 0.08]} />
                <meshStandardMaterial
                  color="#2c3e50"
                  metalness={0.6}
                  roughness={0.3}
                />
              </mesh>

              <mesh
                position={[railPosition.width / 2 - 0.02 - thickness, -0.5, 0]}
                rotation={[0, 0, 0]}
              >
                <boxGeometry args={[0.08, 0.12, 0.08]} />
                <meshStandardMaterial
                  color="#2c3e50"
                  metalness={0.6}
                  roughness={0.3}
                />
              </mesh>
            </group>

            {/* Bottom rail - regular at 0 - 20cm */}
            <group position={[railPosition.x, -0.2, 0]}>
              {/* Rail cylinder */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry
                  args={[0.02, 0.02, railPosition.width - 0.18, 8]}
                />
                <meshStandardMaterial
                  color="#000000"
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>

              {/* Rail brackets */}
              <mesh
                position={[-(railPosition.width / 2 - 0.02 - thickness), 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
                <meshStandardMaterial color="#696969" />
              </mesh>

              <mesh
                position={[railPosition.width / 2 - 0.02 - thickness, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
                <meshStandardMaterial color="#696969" />
              </mesh>
            </group>
          </group>
        );
      }
    });
  };

  return <>{renderRails()}</>;
};

export default RailRenderer;
