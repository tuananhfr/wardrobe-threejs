// src/components/Wardrobe/DoorsDrawersHighlights.tsx
import { useEffect } from "react";
import { Text } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";

interface DoorsDrawersHighlightsProps {
  sectionName: string;
  sectionData: WardrobeSection;
  position: [number, number, number];
  height: number;
  baseBarHeight: number;
  thickness: number;
}

const DoorsDrawersHighlights: React.FC<DoorsDrawersHighlightsProps> = ({
  sectionName,
  sectionData,
  position,
  height,
  baseBarHeight,
  thickness,
}) => {
  const {
    config,
    updateConfig,
    getGroupMembersForSpacing,
    updateDoorsDrawersConfig,
  } = useWardrobeConfig();
  // Use global state for hover
  const hoveredSpacing = config.hoveredSpacingId || null;

  // Helper function to set global hover state
  const setHoveredSpacing = (spacingId: string | null) => {
    updateConfig("hoveredSpacingId", spacingId);
  };

  const width = sectionData.width;
  const depth = sectionData.depth;

  // Check if doors drawers mode is active
  const isDoorsDrawersMode = config.accordionOpen === "collapseDoorsDrawers";

  // Don't render if not in doors drawers mode
  if (!isDoorsDrawersMode) {
    return null;
  }

  // Reset when doors drawers mode is disabled
  useEffect(() => {
    if (!isDoorsDrawersMode) {
      setHoveredSpacing(null);
      document.body.style.cursor = "auto";
      // Reset all selected spacings when closing accordion
      updateConfig("selectedSpacingIds", []);
      updateConfig("selectedSpacingId", null);
      updateConfig("selectedDoorsDrawersType", null);
    }
  }, [isDoorsDrawersMode, updateConfig]);

  // Helper function to get column X position
  const getColumnXPosition = (colIndex: number) => {
    let startX = -width / 2 + thickness;
    for (let i = 0; i < colIndex; i++) {
      startX += sectionData.columns[i].width + thickness;
    }
    return startX;
  };

  // Xác định cột nào cần ẩn highlight theo loại tủ và section hiện tại
  const shouldSuppressColumn = (
    section: string,
    columnIndex: number,
    totalColumns: number
  ): boolean => {
    const typeId = config.wardrobeType.id;
    if (typeId === "Angle") {
      // Angle: ẩn A cột cuối và B cột 1 (index 0)
      if (section === "sectionA" && columnIndex === totalColumns - 1)
        return true;
      if (section === "sectionB" && columnIndex === 0) return true;
      return false;
    }
    if (typeId === "Forme U") {
      // Forme U: ẩn B cột cuối, A cột 1 và cột cuối, C cột 1
      if (section === "sectionA") {
        if (columnIndex === 0 || columnIndex === totalColumns - 1) return true;
      } else if (section === "sectionB") {
        if (columnIndex === totalColumns - 1) return true;
      } else if (section === "sectionC") {
        if (columnIndex === 0) return true;
      }
      return false;
    }
    return false;
  };

  // Helper function to check if spacing is neighbor of selected spacings
  const isNeighborOfSelected = (spacingId: string): boolean => {
    const selectedSpacings = config.selectedSpacingIds || [];
    if (selectedSpacings.length === 0) return false;

    // Parse spacingId to get columnId and spacingIndex
    const parts = spacingId.split("-");
    if (parts.length < 4) return false;

    let columnId: string;
    let spacingIndex: number;

    if (parts.length === 5 && parts[1] === "col" && parts[3] === "spacing") {
      columnId = `${parts[0]}-${parts[1]}-${parts[2]}`;
      spacingIndex = parseInt(parts[4]);
    } else {
      columnId = parts[0];
      spacingIndex = parseInt(parts[2]);
    }

    // Check if any selected spacing is in the same column and is a neighbor
    for (const selectedId of selectedSpacings) {
      const selectedParts = selectedId.split("-");
      if (selectedParts.length < 4) continue;

      let selectedColumnId: string;
      let selectedSpacingIndex: number;

      if (
        selectedParts.length === 5 &&
        selectedParts[1] === "col" &&
        selectedParts[3] === "spacing"
      ) {
        selectedColumnId = `${selectedParts[0]}-${selectedParts[1]}-${selectedParts[2]}`;
        selectedSpacingIndex = parseInt(selectedParts[4]);
      } else {
        selectedColumnId = selectedParts[0];
        selectedSpacingIndex = parseInt(selectedParts[2]);
      }

      // Same column and adjacent spacing
      if (
        selectedColumnId === columnId &&
        Math.abs(selectedSpacingIndex - spacingIndex) === 1
      ) {
        return true;
      }
    }

    return false;
  };

  // Generate spacing positions for all columns
  const getSpacingPositions = () => {
    const positions: Array<{
      spacingId: string;
      columnId: string;
      columnIndex: number;
      spacingIndex: number;
      x: number;
      y: number;
      width: number;
      height: number;
      spacing: number;
      isFullColumn: boolean;
    }> = [];

    for (let colIndex = 0; colIndex < sectionData.columns.length; colIndex++) {
      const column = sectionData.columns[colIndex];
      const colWidth = column.width;
      const colHeight = height - baseBarHeight - 2 * thickness;
      const startX = getColumnXPosition(colIndex);
      const totalColumns = sectionData.columns.length;

      // Bỏ qua cột bị chặn highlight theo yêu cầu
      if (shouldSuppressColumn(sectionName, colIndex, totalColumns)) {
        continue;
      }

      // Get shelf spacings for this column
      const spacings = column.shelves?.spacings || [];

      // If no spacings, create a default spacing for the entire column height
      if (spacings.length === 0) {
        const spacingId = `${column.id}-spacing-0`;
        positions.push({
          spacingId,
          columnId: column.id,
          columnIndex: colIndex,
          spacingIndex: 0,
          x: startX + colWidth / 2,
          y: 0,
          width: colWidth,
          height: colHeight,
          spacing: colHeight,
          isFullColumn: true,
        });
        continue;
      }

      // Calculate spacing heights and positions
      // spacings = [sol->shelf1, shelf1->shelf2, shelf2->shelf3, shelf3->plafond]
      // Each spacing represents the height of the gap
      let currentY = baseBarHeight * 100; // Keep in cm for calculation

      // Phần code cần sửa trong getSpacingPositions()

      for (
        let spacingIndex = 0;
        spacingIndex < spacings.length;
        spacingIndex++
      ) {
        const spacing = spacings[spacingIndex];

        // CHỈ lấy spacing thuần túy, không cộng thickness
        const spacingHeightCm = spacing.spacing; // Bỏ: + (thickness / 2) * 100

        // Convert to world units
        const spacingHeight = spacingHeightCm / 100; // Bỏ: + thickness

        // Convert position to world units - center of the spacing
        const worldY = (currentY + spacingHeightCm / 2) / 100 - height / 2;

        // Create unique spacing ID
        const spacingId = `${column.id}-spacing-${spacingIndex}`;

        positions.push({
          spacingId,
          columnId: column.id,
          columnIndex: colIndex,
          spacingIndex,
          x: startX + colWidth / 2,
          y: worldY,
          width: colWidth,
          height: spacingHeight, // Chỉ chiều cao spacing thuần túy
          spacing: spacingHeight,
          isFullColumn: false,
        });

        // Cập nhật currentY: cộng spacing + thickness để đến vị trí spacing tiếp theo
        currentY += spacingHeightCm + thickness * 100; // Thêm thickness vào currentY
      }
    }

    return positions;
  };

  const spacingPositions = getSpacingPositions();

  // Tìm nhóm cấu hình (các spacing liên tiếp cùng loại trong cùng cột) chứa spacingId
  // DEPRECATED: Sử dụng getGroupMembersForSpacing từ useWardrobeConfig thay thế
  const getConfiguredGroupForSpacing = (spacingId: string): string[] => {
    return getGroupMembersForSpacing(spacingId);
  };

  // Auto-update config when shelves change
  useEffect(() => {
    // Helper function to get spacing height
    const getSpacingHeight = (spacingId: string): number | null => {
      if (!spacingId) return null;

      // Parse spacingId format: "sectionA-col-1-spacing-3"
      const parts = spacingId.split("-");
      if (parts.length < 4) return null;

      // Extract column ID and spacing index
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

      // Find the column in sections
      for (const [, section] of Object.entries(config.wardrobeType.sections)) {
        if (section && section.columns) {
          const column = section.columns.find(
            (col: any) => col.id === columnId
          );
          if (column) {
            const spacings = column.shelves?.spacings || [];

            // If no spacings, return full column height
            if (spacings.length === 0) {
              return (
                config.height - config.baseBarHeight - 2 * config.thickness
              );
            }

            // Return spacing height if index exists
            if (spacingIndex >= 0 && spacingIndex < spacings.length) {
              return spacings[spacingIndex].spacing;
            }
          }
        }
      }

      return null;
    };

    // Check each column for shelf changes
    Object.entries(config.wardrobeType.sections).forEach(([, section]) => {
      if (section && section.columns) {
        section.columns.forEach((column) => {
          const columnSpacingId = `${column.id}-spacing-0`;
          const hasShelves =
            column.shelves?.spacings && column.shelves.spacings.length > 0;

          // If column has shelves and has column door/drawer config, move it to first spacing
          if (hasShelves && config.doorsDrawersConfig[columnSpacingId]) {
            const firstSpacingId = `${column.id}-spacing-0`;
            if (!config.doorsDrawersConfig[firstSpacingId]) {
              const doorType = config.doorsDrawersConfig[columnSpacingId];
              updateDoorsDrawersConfig(firstSpacingId, doorType);
              updateDoorsDrawersConfig(columnSpacingId, null);
            }
          }
          // If column has no shelves and has spacing door/drawer config, move it to column
          else if (!hasShelves && !config.doorsDrawersConfig[columnSpacingId]) {
            // Check if any spacing of this column has door/drawer config
            const columnSpacingIds = Object.keys(
              config.doorsDrawersConfig
            ).filter(
              (id) => id.startsWith(column.id) && id !== columnSpacingId
            );

            const hasSpacingDoorDrawer = columnSpacingIds.some(
              (id) => config.doorsDrawersConfig[id]
            );
            if (hasSpacingDoorDrawer) {
              // Get the first door/drawer config found
              const firstConfig = columnSpacingIds.find(
                (id) => config.doorsDrawersConfig[id]
              );
              if (firstConfig) {
                const doorType = config.doorsDrawersConfig[firstConfig];
                updateDoorsDrawersConfig(columnSpacingId, doorType);
                // Remove all spacing door/drawer configs for this column
                columnSpacingIds.forEach((id) => {
                  if (config.doorsDrawersConfig[id]) {
                    updateDoorsDrawersConfig(id, null);
                  }
                });
              }
            }
          }
        });
      }
    });

    // NEW LOGIC: Remove drawer from spacings that are too small (< 10cm or > 60cm)
    Object.keys(config.doorsDrawersConfig).forEach((spacingId) => {
      if (config.doorsDrawersConfig[spacingId] === "drawer") {
        const spacingHeight = getSpacingHeight(spacingId);
        if (
          spacingHeight !== null &&
          (spacingHeight < 10 || spacingHeight > 60)
        ) {
          // Remove drawer from spacing that's too small or too large using grouped doors logic
          updateDoorsDrawersConfig(spacingId, null);
        }
      }
    });
  }, [config.wardrobeType, config.doorsDrawersConfig, updateConfig]);

  // Handle spacing click with grouped doors logic
  const handleSpacingClick = (spacingId: string) => {
    const selectedSpacings = config.selectedSpacingIds || [];
    const isCurrentlySelected = selectedSpacings.includes(spacingId);
    const hasExistingConfig = config.doorsDrawersConfig[spacingId];

    if (isCurrentlySelected) {
      // Nếu spacing đã được chọn, click lại để bỏ chọn
      updateConfig("selectedSpacingIds", []);
      updateConfig("selectedSpacingId", null);
      updateConfig("selectedDoorsDrawersType", null);
    } else {
      // Nếu click vào spacing đã có config, chọn cả group
      if (hasExistingConfig) {
        const groupMembers = getGroupMembersForSpacing(spacingId);
        updateConfig("selectedSpacingIds", groupMembers);
        updateConfig("selectedSpacingId", spacingId);
        updateConfig(
          "selectedDoorsDrawersType",
          config.doorsDrawersConfig[spacingId] as any
        );
        return;
      }

      // Check if clicking on neighbor of selected spacings
      const isNeighbor = isNeighborOfSelected(spacingId);

      if (isNeighbor) {
        // Add to selected spacings
        const newSelectedSpacings = [...selectedSpacings, spacingId];
        updateConfig("selectedSpacingIds", newSelectedSpacings);
        updateConfig("selectedSpacingId", spacingId); // Keep for backward compatibility
      } else {
        // Clear all and select this spacing
        updateConfig("selectedSpacingIds", [spacingId]);
        updateConfig("selectedSpacingId", spacingId);
      }

      // Check if this spacing already has a configuration
      const existingType = config.doorsDrawersConfig[spacingId] || null;
      if (existingType) {
        updateConfig("selectedDoorsDrawersType", existingType as any);
      } else {
        // Reset selectedDoorsDrawersType when selecting a spacing without configuration
        updateConfig("selectedDoorsDrawersType", null);
      }
    }
  };

  // Handle pointer move for hover detection
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    const x = event.point.x;
    const y = event.point.y;
    let hoveredSpacingId = null;

    // Check which spacing the pointer is over
    for (const pos of spacingPositions) {
      const halfWidth = pos.width / 2;
      const halfHeight = pos.height / 2;

      const spacingStartX = pos.x - halfWidth;
      const spacingEndX = pos.x + halfWidth;
      const spacingStartY = pos.y - halfHeight;
      const spacingEndY = pos.y + halfHeight;

      if (
        x >= spacingStartX &&
        x <= spacingEndX &&
        y >= spacingStartY &&
        y <= spacingEndY
      ) {
        hoveredSpacingId = pos.spacingId;
        break;
      }
    }

    if (hoveredSpacingId !== hoveredSpacing) {
      setHoveredSpacing(hoveredSpacingId);
      document.body.style.cursor =
        hoveredSpacingId !== null ? "pointer" : "auto";
    }
  };

  // Handle pointer leave
  const handlePointerLeave = () => {
    setHoveredSpacing(null);
    document.body.style.cursor = "auto";
  };

  return (
    <group
      position={position}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Spacing highlights */}
      {spacingPositions.map((pos) => {
        const selectedSpacings = config.selectedSpacingIds || [];
        const isSelected = selectedSpacings.includes(pos.spacingId);
        const isHovered = hoveredSpacing === pos.spacingId;

        // Check if this spacing is part of a group that's selected or hovered
        const groupMembers = getGroupMembersForSpacing(pos.spacingId);
        const isGroupSelected = groupMembers.some((id) =>
          selectedSpacings.includes(id)
        );
        const isGroupHovered = groupMembers.some((id) => hoveredSpacing === id);

        // Determine highlight state and color
        let shouldShowHighlight = false;
        let highlightColor = "#e6f7f9"; // Blue like EtagereColumnHighlights
        let opacity = 0;

        if (isSelected || isGroupSelected) {
          shouldShowHighlight = true;
          highlightColor = "#e6f7f9"; // Blue for selected
          opacity = 0.6;
        } else if (isHovered || isGroupHovered) {
          shouldShowHighlight = true;
          highlightColor = "#f8f9fa"; // Light gray for hover
          opacity = 0.4;
        }

        return (
          <mesh
            key={`doors-drawers-spacing-${pos.spacingId}`}
            position={[pos.x, pos.y, 0]}
            onClick={(e) => {
              handleSpacingClick(pos.spacingId);
              e.stopPropagation();
            }}
          >
            <boxGeometry
              args={[pos.width, pos.height, depth - 2 * thickness]}
            />
            <meshBasicMaterial
              color={highlightColor}
              transparent
              opacity={shouldShowHighlight ? opacity : 0}
              depthWrite={false}
              depthTest={false}
            />
          </mesh>
        );
      })}

      {/* Icons and labels */}
      {spacingPositions.map((pos) => {
        const selectedSpacings = config.selectedSpacingIds || [];
        const isSelected = selectedSpacings.includes(pos.spacingId);
        const isHovered = hoveredSpacing === pos.spacingId;
        const isNeighbor = isNeighborOfSelected(pos.spacingId);

        // Check if this spacing is part of a group that's selected or hovered
        const groupMembers = getGroupMembersForSpacing(pos.spacingId);
        const isGroupSelected = groupMembers.some((id) =>
          selectedSpacings.includes(id)
        );
        const isGroupHovered = groupMembers.some((id) => hoveredSpacing === id);

        // Show icon when:
        // 1. Hovered (normal behavior)
        // 2. Selected (normal behavior)
        // 3. Part of a group that's selected or hovered
        const shouldShowIcon =
          isHovered || isSelected || isGroupHovered || isGroupSelected;
        if (!shouldShowIcon) return null;

        // Determine icon properties
        let iconColor = "#4169E1"; // Default blue
        let iconText = "+"; // Default plus

        if (isSelected || isGroupSelected) {
          iconColor = "green";
          iconText = "✓";
        } else if (isHovered || isGroupHovered) {
          iconColor = "#4169E1";
          iconText = "+";
        }

        return (
          <group
            key={`doors-drawers-icon-${pos.spacingId}`}
            position={[pos.x, pos.y, depth / 2 + 0.01]}
          >
            {/* Icon background */}
            <mesh>
              <circleGeometry args={[0.05, 32]} />
              <meshBasicMaterial color="white" transparent opacity={0.9} />
            </mesh>

            {/* Icon text */}
            <Text
              position={[0, 0, 0.01]}
              color={iconColor}
              fontSize={0.1}
              anchorX="center"
              anchorY="middle"
            >
              {iconText}
            </Text>
          </group>
        );
      })}
    </group>
  );
};

export default DoorsDrawersHighlights;
