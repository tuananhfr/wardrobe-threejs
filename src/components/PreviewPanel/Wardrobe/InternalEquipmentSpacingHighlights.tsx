// src/components/Wardrobe/InternalEquipmentSpacingHighlights.tsx
import { useEffect } from "react";
import { Text } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";

interface InternalEquipmentSpacingHighlightsProps {
  sectionName: string;
  sectionData: WardrobeSection;
  position: [number, number, number];
  height: number;
  baseBarHeight: number;
  thickness: number;
}

const InternalEquipmentSpacingHighlights: React.FC<
  InternalEquipmentSpacingHighlightsProps
> = ({
  sectionName,
  sectionData,
  position,
  height,
  baseBarHeight,
  thickness,
}) => {
  const { config, updateConfig } = useWardrobeConfig();
  // Use global state for hover
  const hoveredSpacing = config.hoveredSpacingId || null;

  // Helper function to set global hover state
  const setHoveredSpacing = (spacingId: string | null) => {
    updateConfig("hoveredSpacingId", spacingId);
  };

  const width = sectionData.width;
  const depth = sectionData.depth;

  // Check if we're in the right mode for highlighting
  const isInternalEquipmentMode =
    config.accordionOpen === "collapseInternalEquipment";

  // Only show highlights when in internal equipment mode
  const shouldShowHighlights = isInternalEquipmentMode;

  // ✅ DI CHUYỂN TẤT CẢ HOOKS LÊN TRÊN TRƯỚC KHI CÓ BẤT KỲ EARLY RETURN NÀO

  // Reset when internal equipment mode is disabled
  useEffect(() => {
    if (!shouldShowHighlights) {
      setHoveredSpacing(null);
      document.body.style.cursor = "auto";
      // Reset selected spacings when closing accordion
      updateConfig("selectedSpacingIds", []);
    }
  }, [shouldShowHighlights, updateConfig]);

  // Auto-update config when shelves change
  useEffect(() => {
    const updatedConfig = { ...config.internalEquipmentConfig };
    let hasChanges = false;

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

          // If column has shelves and has column rail config, move it to first spacing
          if (hasShelves && updatedConfig[columnSpacingId] === "trigle") {
            const firstSpacingId = `${column.id}-spacing-0`;
            if (updatedConfig[firstSpacingId] !== "trigle") {
              updatedConfig[firstSpacingId] = "trigle";
              delete updatedConfig[columnSpacingId];
              hasChanges = true;
            }
          }
          // If column has no shelves and has spacing rail config, move it to column
          else if (!hasShelves && updatedConfig[columnSpacingId] !== "trigle") {
            // Check if any spacing of this column has trigle config
            const columnSpacingIds = Object.keys(updatedConfig).filter(
              (id) => id.startsWith(column.id) && id !== columnSpacingId
            );

            const hasSpacingRail = columnSpacingIds.some(
              (id) => updatedConfig[id] === "trigle"
            );
            if (hasSpacingRail) {
              updatedConfig[columnSpacingId] = "trigle";
              // Remove all spacing rails for this column
              columnSpacingIds.forEach((id) => {
                if (updatedConfig[id] === "trigle") {
                  delete updatedConfig[id];
                }
              });
              hasChanges = true;
            }
          }
        });
      }
    });

    // NEW LOGIC: Remove rail from spacings that are too small (< 80cm)
    Object.keys(updatedConfig).forEach((spacingId) => {
      if (updatedConfig[spacingId] === "trigle") {
        const spacingHeight = getSpacingHeight(spacingId);
        if (spacingHeight !== null && spacingHeight < 80) {
          // Remove rail from spacing that's too small
          delete updatedConfig[spacingId];
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      updateConfig("internalEquipmentConfig", updatedConfig);
    }
  }, [config.wardrobeType, config.internalEquipmentConfig, updateConfig]);

  // ✅ CHỈ SAU KHI TẤT CẢ HOOKS ĐÃ ĐƯỢC GỌI, MỚI KIỂM TRA ĐIỀU KIỆN RETURN
  // Don't render if not in the right mode
  if (!shouldShowHighlights) {
    return null;
  }

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

  // Handle spacing click
  const handleSpacingClick = (spacingId: string) => {
    if (config.selectedSpacingId === spacingId) {
      // Deselect if already selected
      updateConfig("selectedSpacingId", null);
      updateConfig("selectedInternalEquipmentType", null);
    } else {
      // Select new spacing
      updateConfig("selectedSpacingId", spacingId);

      // Check if this spacing already has equipment configured
      const existingEquipment = config.internalEquipmentConfig[spacingId];
      if (existingEquipment) {
        // If equipment is already configured, use that
        updateConfig("selectedInternalEquipmentType", existingEquipment);
      } else {
        // If no equipment configured, default to "vide"
        updateConfig("selectedInternalEquipmentType", "vide");
        // Save rail configuration for this spacing
        updateConfig("internalEquipmentConfig", {
          ...config.internalEquipmentConfig,
          [spacingId]: "vide",
        });
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
        const isSelected = config.selectedSpacingId === pos.spacingId;
        const isHovered = hoveredSpacing === pos.spacingId;

        // Determine highlight state and color
        let shouldShowHighlight = false;
        let highlightColor = "#e6f7f9"; // Blue like EtagereColumnHighlights
        let opacity = 0;

        if (isSelected) {
          shouldShowHighlight = true;
          highlightColor = "#e6f7f9"; // Blue for selected
          opacity = 0.6;
        } else if (isHovered) {
          shouldShowHighlight = true;
          highlightColor = "#f8f9fa"; // Light gray for hover
          opacity = 0.4;
        }

        return (
          <mesh
            key={`internal-equipment-spacing-${pos.spacingId}`}
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
        const isSelected = config.selectedSpacingId === pos.spacingId;
        const isHovered = hoveredSpacing === pos.spacingId;

        // Show icon only when hovered or selected
        const shouldShowIcon = isHovered || isSelected;
        if (!shouldShowIcon) return null;

        // Determine icon properties based on whether it's a full column or spacing
        let iconColor = "#4169E1"; // Default blue
        let iconText = "+"; // Default plus like EtagereColumnHighlights

        if (isSelected) {
          iconColor = "green";
          iconText = "✓";
        } else if (isHovered) {
          iconColor = "#4169E1";
          iconText = "+";
        }

        return (
          <group
            key={`internal-equipment-icon-${pos.spacingId}`}
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

export default InternalEquipmentSpacingHighlights;
