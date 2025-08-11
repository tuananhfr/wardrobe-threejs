import React from "react";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";

interface RailRendererProps {
  sections: {
    sectionA: WardrobeSection;
    sectionB?: WardrobeSection;
    sectionC?: WardrobeSection;
  };
  height: number;
  baseBarHeight: number;
  thickness: number;
}

const RailRenderer: React.FC<RailRendererProps> = ({
  sections,
  height,
  baseBarHeight,
  thickness,
}) => {
  const { config } = useWardrobeConfig();

  // Get all spacing IDs that have "trigle" equipment
  const trigleSpacingIds = Object.entries(config.internalEquipmentConfig)
    .filter(([equipmentType]) => equipmentType === "trigle")
    .map(([spacingId]) => spacingId);

  // Don't render if no trigle equipment is configured
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

    // Find which section and column this belongs to
    let foundColumn: any = null;
    let foundSection: string = "";
    let foundColumnIndex: number = -1;

    Object.entries(sections).forEach(([sectionKey, section]) => {
      if (section && section.columns) {
        const columnIndex = section.columns.findIndex(
          (col: any) => col.id === columnId
        );
        if (columnIndex !== -1) {
          foundColumn = section.columns[columnIndex];
          foundSection = sectionKey;
          foundColumnIndex = columnIndex;
        }
      }
    });

    return { foundColumn, foundSection, foundColumnIndex, spacingIndex };
  };

  // Render all rails for configured trigle equipment
  const renderRails = () => {
    return trigleSpacingIds.map((spacingId) => {
      const { foundColumn, foundSection, foundColumnIndex, spacingIndex } =
        parseSpacingId(spacingId);

      if (!foundColumn) return null;

      // Calculate rail position
      const getRailPosition = () => {
        const section = sections[foundSection as keyof typeof sections];
        if (!section) return null;

        // Calculate column X position (same logic as InternalEquipmentSpacingHighlights)
        // Sections are already converted to meters
        let startX = -section.width / 2 + thickness;

        for (let i = 0; i < foundColumnIndex; i++) {
          const colWidth = section.columns[i].width; // Already in meters
          startX += colWidth + thickness;
        }
        const columnX = startX + foundColumn.width / 2; // Already in meters

        // Calculate rail Y position - 10cm from shelf or plafond
        const spacings = foundColumn.shelves?.spacings || [];
        if (spacings.length === 0) {
          // If no spacings, place rail 20cm from plafond
          const railY = height / 2 - 0.2; // 20cm from plafond
          return {
            x: columnX,
            y: railY,
            width: foundColumn.width, // Already in meters
            depth: section.depth, // Already in meters
          };
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

        return {
          x: columnX,
          y: railY,
          width: foundColumn.width, // Already in meters
          depth: section.depth, // Already in meters
        };
      };

      const railPosition = getRailPosition();

      if (!railPosition) return null;

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
