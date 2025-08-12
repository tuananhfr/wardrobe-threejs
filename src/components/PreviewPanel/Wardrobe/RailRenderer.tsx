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

  // Get all spacing IDs that have "trigle" equipment for this section
  const trigleSpacingIds = Object.entries(config.internalEquipmentConfig)
    .filter(([spacingId, equipmentType]) => {
      return equipmentType === "trigle" && spacingId.startsWith(sectionName);
    })
    .map(([spacingId]) => spacingId);

  // Don't render if no trigle equipment is configured for this section
  if (trigleSpacingIds.length === 0) {
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

  // Render all rails for configured trigle equipment
  const renderRails = () => {
    return trigleSpacingIds.map((spacingId) => {
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

        // Position rail 20cm from center of spacing
        const railY = worldY - 0.2; // 20cm above center of spacing

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
    });
  };

  return <>{renderRails()}</>;
};

export default RailRenderer;
