import { useEffect } from "react";
import { Text } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";

interface ShelvesColumnHighlightsProps {
  sectionName: string;
  sectionData: WardrobeSection;
  position: [number, number, number];
  height: number;
  baseBarHeight: number;
  thickness: number;
}

const ShelvesColumnHighlights: React.FC<ShelvesColumnHighlightsProps> = ({
  sectionName,
  sectionData,
  position,
  height,
  baseBarHeight,
  thickness,
}) => {
  const { config, updateConfig } = useWardrobeConfig();
  // Use global state instead of local state for hover
  const hoveredColumn = config.hoveredColumnId || null;

  // Helper function to set global hover state
  const setHoveredColumn = (columnId: string | null) => {
    updateConfig("hoveredColumnId", columnId);
  };

  const width = sectionData.width;
  const depth = sectionData.depth;

  // Check if we're in the right mode for highlighting
  const isEtagereMode = config.accordionOpen === "collapseEtageres";
  const selectedColumnId = config.selectedColumnId;

  // Only show highlights when in étagère mode
  const shouldShowHighlights = isEtagereMode;

  // Check if Angle AB or Angle AC is selected
  const isAngleABSelected = selectedColumnId === "angle-ab";
  const isAngleACSelected = selectedColumnId === "angle-ac";

  // Don't early-return here to keep hooks order stable

  // Reset when étagère mode is disabled
  useEffect(() => {
    if (!shouldShowHighlights) {
      setHoveredColumn(null);
      document.body.style.cursor = "auto";
      // Reset selected column when closing accordion
      updateConfig("selectedColumnId", null);
    }
  }, [shouldShowHighlights, updateConfig]);

  // Helper function to get column X position
  const getColumnXPosition = (colIndex: number) => {
    let startX = -width / 2 + thickness;
    for (let i = 0; i < colIndex; i++) {
      startX += sectionData.columns[i].width + thickness;
    }
    return startX;
  };

  // Generate column positions
  const getColumnPositions = () => {
    const positions = [];

    for (let i = 0; i < sectionData.columns.length; i++) {
      const column = sectionData.columns[i];
      const colWidth = column.width;
      const colHeight = height - baseBarHeight - 2 * thickness;
      const startX = getColumnXPosition(i);

      // Center X position of column
      const centerX = startX + colWidth / 2;

      // Check if this column should be highlighted for Angle AB or Angle AC
      const isALastColumn =
        sectionName === "sectionA" && i === sectionData.columns.length - 1;
      const isBFirstColumn = sectionName === "sectionB" && i === 0;
      const isBLastColumn =
        sectionName === "sectionB" && i === sectionData.columns.length - 1;
      const isCFirstColumn = sectionName === "sectionC" && i === 0;
      const isAFirstColumn = sectionName === "sectionA" && i === 0;

      // Conditional logic for Angle AB based on wardrobe type
      let isAngleABColumn = false;
      if (config.wardrobeType.id === "Angle") {
        // For Angle type: A-last and B-first
        isAngleABColumn = isALastColumn || isBFirstColumn;
      } else if (config.wardrobeType.id === "Forme U") {
        // For Forme U type: B-last and A-first
        isAngleABColumn = isBLastColumn || isAFirstColumn;
      }

      const isAngleACColumn = isCFirstColumn || isALastColumn;

      positions.push({
        col: i,
        columnId: column.id,
        x: centerX,
        y: 0,
        iconY: 0,
        width: colWidth,
        height: colHeight,
        shelvesCount: column.shelves?.spacings?.length || 0,
        isAngleABColumn,
        isAngleACColumn,
      });
    }

    return positions;
  };

  const columnPositions = getColumnPositions();

  // Handle column click
  const handleColumnClick = (columnId: string) => {
    // Check if this is an Angle AB column
    const isBLastColumn =
      sectionName === "sectionB" &&
      columnId === sectionData.columns[sectionData.columns.length - 1]?.id;
    const isAFirstColumn =
      sectionName === "sectionA" && columnId === sectionData.columns[0]?.id;
    const isALastColumn =
      sectionName === "sectionA" &&
      columnId === sectionData.columns[sectionData.columns.length - 1]?.id;
    const isBFirstColumn =
      sectionName === "sectionB" && columnId === sectionData.columns[0]?.id;

    // Conditional logic for Angle AB based on wardrobe type
    let isAngleABColumn = false;
    if (config.wardrobeType.id === "Angle") {
      // For Angle type: A-last and B-first
      isAngleABColumn = isALastColumn || isBFirstColumn;
    } else if (config.wardrobeType.id === "Forme U") {
      // For Forme U type: B-last and A-first
      isAngleABColumn = isBLastColumn || isAFirstColumn;
    }

    // Check if this is an Angle AC column
    const isCFirstColumn =
      sectionName === "sectionC" && columnId === sectionData.columns[0]?.id;
    const isAngleACColumn = isCFirstColumn || isALastColumn;

    // If this is an Angle AB column and we're in Angle or Forme U wardrobe type
    if (
      isAngleABColumn &&
      (config.wardrobeType.id === "Angle" ||
        config.wardrobeType.id === "Forme U")
    ) {
      if (selectedColumnId === "angle-ab") {
        // Deselect if already selected
        updateConfig("selectedColumnId", null);
      } else {
        // Select Angle AB
        updateConfig("selectedColumnId", "angle-ab");
      }
    }
    // If this is an Angle AC column and we're in Forme U wardrobe type
    else if (isAngleACColumn && config.wardrobeType.id === "Forme U") {
      if (selectedColumnId === "angle-ac") {
        // Deselect if already selected
        updateConfig("selectedColumnId", null);
      } else {
        // Select Angle AC
        updateConfig("selectedColumnId", "angle-ac");
      }
    } else {
      // Normal column selection
      if (selectedColumnId === columnId) {
        // Deselect if already selected
        updateConfig("selectedColumnId", null);
      } else {
        // Select new column
        updateConfig("selectedColumnId", columnId);
      }
    }
  };

  // Handle pointer move for hover detection
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    const x = event.point.x;
    let hoveredCol = null;

    // Check which column the pointer is over
    for (let i = 0; i < columnPositions.length; i++) {
      const pos = columnPositions[i];

      // Adjust hit detection for Angle AB columns when selected (conditional based on wardrobe type)
      let hitTestWidth = pos.width;
      let hitTestX = pos.x;

      if (isAngleABSelected && pos.isAngleABColumn) {
        if (config.wardrobeType.id === "Angle") {
          // For Angle type: adjust A-last column
          if (sectionName === "sectionA") {
            hitTestWidth = pos.width + 2 * thickness;
            hitTestX = pos.x - thickness;
          }
        } else if (config.wardrobeType.id === "Forme U") {
          // For Forme U type: adjust B-last column
          if (sectionName === "sectionB") {
            hitTestWidth = pos.width + 2 * thickness;
            hitTestX = pos.x + thickness;
          }
        }
      }

      // Adjust hit detection for C-col-1 when Angle AC is selected
      if (
        isAngleACSelected &&
        sectionName === "sectionC" &&
        pos.isAngleACColumn
      ) {
        hitTestWidth = pos.width + 2 * thickness;
        hitTestX = pos.x - thickness;
      }

      const halfWidth = hitTestWidth / 2;
      const columnStartX = hitTestX - halfWidth;
      const columnEndX = hitTestX + halfWidth;

      if (x >= columnStartX && x <= columnEndX) {
        hoveredCol = i;
        break;
      }
    }

    // Special handling for Angle AB and Angle AC hover
    let finalHoveredState: number | string | null = null;

    if (hoveredCol !== null) {
      // Create unique identifier for this specific column
      const columnIdentifier = `${sectionName}-${hoveredCol}`;

      if (config.wardrobeType.id === "Angle") {
        const hoveredPosition = columnPositions[hoveredCol];

        // If hovering over an Angle AB column, set special hover state
        if (hoveredPosition.isAngleABColumn) {
          finalHoveredState = "angle-ab";
        } else {
          finalHoveredState = columnIdentifier;
        }
      } else if (config.wardrobeType.id === "Forme U") {
        const hoveredPosition = columnPositions[hoveredCol];

        // If hovering over an Angle AB column, set special hover state
        if (hoveredPosition.isAngleABColumn) {
          finalHoveredState = "angle-ab";
        } else if (hoveredPosition.isAngleACColumn) {
          finalHoveredState = "angle-ac";
        } else {
          finalHoveredState = columnIdentifier;
        }
      } else {
        finalHoveredState = columnIdentifier;
      }
    }

    if (finalHoveredState !== hoveredColumn) {
      setHoveredColumn(finalHoveredState);
      document.body.style.cursor =
        finalHoveredState !== null ? "pointer" : "auto";
    }
  };

  // Handle pointer leave
  const handlePointerLeave = () => {
    setHoveredColumn(null);
    document.body.style.cursor = "auto";
  };

  // Don't render if not in the right mode - AFTER all hooks
  if (!shouldShowHighlights) {
    return null;
  }

  return (
    <group
      position={position}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Column highlights */}
      {columnPositions.map((pos, index) => {
        const isSelected = selectedColumnId === pos.columnId;
        // Handle both number index and "angle-ab"/"angle-ac" string hover
        const isDirectlyHovered = hoveredColumn === `${sectionName}-${index}`;
        const isAngleABHovered =
          hoveredColumn === "angle-ab" && pos.isAngleABColumn;
        const isAngleACHovered =
          hoveredColumn === "angle-ac" && pos.isAngleACColumn;
        const isHovered =
          isDirectlyHovered || isAngleABHovered || isAngleACHovered;
        const isAngleABHighlighted = isAngleABSelected && pos.isAngleABColumn;
        const isAngleACHighlighted = isAngleACSelected && pos.isAngleACColumn;

        // Conditional visual adjustments based on wardrobe type
        let highlightWidth = pos.width;
        let highlightX = pos.x;

        if (isAngleABSelected && pos.isAngleABColumn) {
          if (config.wardrobeType.id === "Angle") {
            // For Angle type: extend A-last column
            if (sectionName === "sectionA") {
              highlightWidth = pos.width + 2 * thickness;
              highlightX = pos.x - thickness; // Shift left for A-last
            }
          } else if (config.wardrobeType.id === "Forme U") {
            // For Forme U type: extend B-last column
            if (sectionName === "sectionB") {
              highlightWidth = pos.width + 2 * thickness;
              highlightX = pos.x + thickness; // Shift right for B-last
            }
          }
        }

        if (
          isAngleACSelected &&
          sectionName === "sectionC" &&
          pos.isAngleACColumn
        ) {
          highlightWidth = pos.width + 2 * thickness; // Extend width for C-col-1
          highlightX = pos.x - thickness; // Shift left for C-col-1
        }

        // Determine highlight state and color
        let shouldShowHighlight = false;
        let highlightColor = "#E6E6FA"; // Default
        let opacity = 0;

        if (isAngleABHighlighted || isAngleACHighlighted) {
          // Both A-cuối/A-đầu and B-đầu/C-đầu are highlighted when Angle AB/AC selected
          shouldShowHighlight = true;
          highlightColor = isHovered ? "#d4edda" : "#e6f7f9"; // Green when hovered, blue when selected
          opacity = 0.6;
        } else if (isSelected) {
          // Normal column selected
          shouldShowHighlight = true;
          highlightColor = "#e6f7f9"; // Blue
          opacity = 0.6;
        } else if (isHovered) {
          // Handle Angle AB/AC hover and normal hover
          shouldShowHighlight = true;
          if (
            (hoveredColumn === "angle-ab" && pos.isAngleABColumn) ||
            (hoveredColumn === "angle-ac" && pos.isAngleACColumn)
          ) {
            // Hovering over Angle AB/AC columns - use special color
            highlightColor = "#f8f9fa"; // Light gray for Angle AB/AC hover
            opacity = 0.5;
          } else {
            // Just normal hovered (not selected or part of Angle AB/AC)
            highlightColor = "#f8f9fa"; // Light gray
            opacity = 0.4; // Lighter opacity for hover
          }
        }

        return (
          <mesh
            key={`etagere-highlight-${pos.columnId}`}
            position={[highlightX, pos.y, 0]} // Use adjusted X position
            onClick={(e) => {
              handleColumnClick(pos.columnId);
              e.stopPropagation();
            }}
          >
            <boxGeometry
              args={[highlightWidth, pos.height, depth - 2 * thickness]} // Use adjusted width
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
      {columnPositions.map((pos, index) => {
        const isSelected = selectedColumnId === pos.columnId;
        // Handle both number index and "angle-ab"/"angle-ac" string hover
        const isDirectlyHovered = hoveredColumn === `${sectionName}-${index}`;
        const isAngleABHovered =
          hoveredColumn === "angle-ab" && pos.isAngleABColumn;
        const isAngleACHovered =
          hoveredColumn === "angle-ac" && pos.isAngleACColumn;
        const isHovered =
          isDirectlyHovered || isAngleABHovered || isAngleACHovered;
        const isAngleABHighlighted = isAngleABSelected && pos.isAngleABColumn;
        const isAngleACHighlighted = isAngleACSelected && pos.isAngleACColumn;

        // Hide icon for section A column when Angle AB is selected (conditional based on wardrobe type)
        if (
          isAngleABSelected &&
          sectionName === "sectionA" &&
          pos.isAngleABColumn
        ) {
          if (config.wardrobeType.id === "Angle") {
            // For Angle type: hide A-last column
            return null; // Don't show icon for A-last when Angle AB selected
          } else if (config.wardrobeType.id === "Forme U") {
            // For Forme U type: hide A-first column
            return null; // Don't show icon for A-first when Angle AB selected
          }
        }

        // Hide icon for section A last column when Angle AC is selected
        if (
          isAngleACSelected &&
          sectionName === "sectionA" &&
          pos.isAngleACColumn
        ) {
          return null; // Don't show icon for A-cuối when Angle AC selected
        }

        // Hide icon for section A column when Angle AB is hovered (conditional based on wardrobe type)
        if (
          hoveredColumn === "angle-ab" &&
          sectionName === "sectionA" &&
          pos.isAngleABColumn
        ) {
          if (config.wardrobeType.id === "Angle") {
            // For Angle type: hide A-last column
            return null; // Don't show icon for A-last when Angle AB hovered
          } else if (config.wardrobeType.id === "Forme U") {
            // For Forme U type: hide A-first column
            return null; // Don't show icon for A-first when Angle AB hovered
          }
        }

        // Hide icon for section A last column when Angle AC is hovered
        if (
          hoveredColumn === "angle-ac" &&
          sectionName === "sectionA" &&
          pos.isAngleACColumn
        ) {
          return null; // Don't show icon for A-cuối when Angle AC hovered
        }

        // Show icon conditions - include Angle AB/AC hover
        const shouldShowIcon =
          isHovered ||
          isSelected ||
          isAngleABHighlighted ||
          isAngleACHighlighted;
        if (!shouldShowIcon) return null;

        // Adjust icon position for Angle AB columns when selected (conditional based on wardrobe type)
        let adjustedX = pos.x;
        if (isAngleABSelected && pos.isAngleABColumn) {
          if (config.wardrobeType.id === "Angle") {
            // For Angle type: adjust A-last column
            if (sectionName === "sectionA") {
              adjustedX = pos.x - thickness; // Shift left for A-last
            }
          } else if (config.wardrobeType.id === "Forme U") {
            // For Forme U type: adjust B-last column
            if (sectionName === "sectionB") {
              adjustedX = pos.x + thickness; // Shift right for B-last
            }
          }
        }

        // Adjust icon position for section C first column when Angle AC is selected
        if (
          isAngleACSelected &&
          sectionName === "sectionC" &&
          pos.isAngleACColumn
        ) {
          adjustedX = pos.x - thickness; // Shift icon to center of extended highlight
        }

        // Determine icon properties
        let iconColor = "#4169E1"; // Default blue
        let iconText = "+"; // Default plus

        if (isAngleABHighlighted) {
          // B-cuối column when Angle AB selected (A-1 won't reach here due to return null above)
          iconColor = isHovered ? "#28a745" : "#20c997"; // Darker green when hovered, teal when just selected
          iconText = "✓";
        } else if (isAngleACHighlighted) {
          // C-1 column when Angle AC selected (A-cuối won't reach here due to return null above)
          iconColor = isHovered ? "#28a745" : "#20c997"; // Darker green when hovered, teal when just selected
          iconText = "✓";
        } else if (isSelected) {
          // Normal selected column
          iconColor = "green";
          iconText = "✓";
        } else if (isHovered) {
          // Handle Angle AB/AC hover and normal hover
          if (
            (hoveredColumn === "angle-ab" && pos.isAngleABColumn) ||
            (hoveredColumn === "angle-ac" && pos.isAngleACColumn)
          ) {
            // Hovering over Angle AB/AC columns
            iconColor = "#6c757d"; // Gray for Angle AB/AC hover
            iconText = "+";
          } else {
            // Just normal hovered (not selected)
            iconColor = "#4169E1";
            iconText = "+";
          }
        }

        return (
          <group
            key={`etagere-icon-${pos.columnId}`}
            position={[adjustedX, pos.iconY, depth / 2 + 0.01]}
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

export default ShelvesColumnHighlights;
