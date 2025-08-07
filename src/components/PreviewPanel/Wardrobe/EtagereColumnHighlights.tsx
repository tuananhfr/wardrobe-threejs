// src/components/Wardrobe/EtagereColumnHighlights.tsx - COMPLETE FIXED VERSION
import { useState, useEffect } from "react";
import { Text } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";

interface EtagereColumnHighlightsProps {
  sectionName: string;
  sectionData: WardrobeSection;
  position: [number, number, number];
  height: number;
  baseBarHeight: number;
  thickness: number;
}

const EtagereColumnHighlights: React.FC<EtagereColumnHighlightsProps> = ({
  sectionName,
  sectionData,
  position,
  height,
  baseBarHeight,
  thickness,
}) => {
  const { config, updateConfig } = useWardrobeConfig();
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

  const width = sectionData.width;
  const depth = sectionData.depth;

  // Check if étagère mode is active - AFTER hooks
  const isEtagereMode = config.accordionOpen === "collapseEtageres";
  const selectedColumnId = config.selectedColumnId;

  // Check if Angle AB is selected
  const isAngleABSelected = selectedColumnId === "angle-ab";

  // Reset when étagère mode is disabled
  useEffect(() => {
    if (!isEtagereMode) {
      setHoveredColumn(null);
      document.body.style.cursor = "auto";
    }
  }, [isEtagereMode]);

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

      // Check if this column should be highlighted for Angle AB
      const isALastColumn =
        sectionName === "sectionA" && i === sectionData.columns.length - 1;
      const isBFirstColumn = sectionName === "sectionB" && i === 0;
      const isAngleABColumn = isALastColumn || isBFirstColumn;

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
      });
    }

    return positions;
  };

  const columnPositions = getColumnPositions();

  // Handle column click
  const handleColumnClick = (columnId: string) => {
    // Check if this is an Angle AB column
    const isALastColumn =
      sectionName === "sectionA" &&
      columnId === sectionData.columns[sectionData.columns.length - 1]?.id;
    const isBFirstColumn =
      sectionName === "sectionB" && columnId === sectionData.columns[0]?.id;
    const isAngleABColumn = isALastColumn || isBFirstColumn;

    // If this is an Angle AB column and we're in Angle wardrobe type
    if (isAngleABColumn && config.wardrobeType.id === "Angle") {
      if (selectedColumnId === "angle-ab") {
        // Deselect if already selected
        updateConfig("selectedColumnId", null);
      } else {
        // Select Angle AB
        updateConfig("selectedColumnId", "angle-ab");
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

      // Adjust hit detection for B-col-1 when Angle AB is selected
      let hitTestWidth = pos.width;
      let hitTestX = pos.x;

      if (
        isAngleABSelected &&
        sectionName === "sectionB" &&
        pos.isAngleABColumn
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

    if (hoveredCol !== hoveredColumn) {
      setHoveredColumn(hoveredCol);
      document.body.style.cursor = hoveredCol !== null ? "pointer" : "auto";
    }
  };

  // Handle pointer leave
  const handlePointerLeave = () => {
    setHoveredColumn(null);
    document.body.style.cursor = "auto";
  };

  // Don't render if not in étagère mode - AFTER all hooks
  if (!isEtagereMode) {
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
        const isHovered = hoveredColumn === index;
        const isAngleABHighlighted = isAngleABSelected && pos.isAngleABColumn;

        // For B-col-1 when Angle AB: extend width and shift position, hide left edge
        // For A-col-cuối when Angle AB: keep normal width and position but highlight
        let highlightWidth = pos.width;
        let highlightX = pos.x;

        if (
          isAngleABSelected &&
          sectionName === "sectionB" &&
          pos.isAngleABColumn
        ) {
          highlightWidth = pos.width + 2 * thickness; // Extend width for B-col-1
          highlightX = pos.x - thickness; // Shift left for B-col-1
        }
        // A-col-cuối keeps normal size when Angle AB (no special adjustment needed)

        // Determine highlight state and color
        let shouldShowHighlight = false;
        let highlightColor = "#E6E6FA"; // Default
        let opacity = 0;

        if (isAngleABHighlighted) {
          // Both A-cuối and B-đầu are highlighted when Angle AB selected
          shouldShowHighlight = true;
          highlightColor = isHovered ? "#d4edda" : "#e6f7f9"; // Green when hovered, blue when selected
          opacity = 0.6;
        } else if (isSelected) {
          // Normal column selected
          shouldShowHighlight = true;
          highlightColor = "#e6f7f9"; // Blue
          opacity = 0.6;
        } else if (isHovered) {
          // Just hovered (not selected or part of Angle AB)
          shouldShowHighlight = true;
          highlightColor = "#f8f9fa"; // Light gray
          opacity = 0.4; // Lighter opacity for hover
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
        const isHovered = hoveredColumn === index;
        const isAngleABHighlighted = isAngleABSelected && pos.isAngleABColumn;

        // Hide icon for section A last column when Angle AB is selected
        if (
          isAngleABSelected &&
          sectionName === "sectionA" &&
          pos.isAngleABColumn
        ) {
          return null; // Don't show icon for A-cuối when Angle AB selected
        }

        // Show icon conditions
        const shouldShowIcon = isHovered || isSelected || isAngleABHighlighted;
        if (!shouldShowIcon) return null;

        // Adjust icon position for section B first column when Angle AB is selected
        let adjustedX = pos.x;
        if (
          isAngleABSelected &&
          sectionName === "sectionB" &&
          pos.isAngleABColumn
        ) {
          adjustedX = pos.x - thickness; // Shift icon to center of extended highlight
        }

        // Determine icon properties
        let iconColor = "#4169E1"; // Default blue
        let iconText = "+"; // Default plus

        if (isAngleABHighlighted) {
          // B-đầu column when Angle AB selected (A-cuối won't reach here due to return null above)
          iconColor = isHovered ? "#28a745" : "#20c997"; // Darker green when hovered, teal when just selected
          iconText = "✓";
        } else if (isSelected) {
          // Normal selected column
          iconColor = "green";
          iconText = "✓";
        } else if (isHovered) {
          // Just hovered (not selected)
          iconColor = "#4169E1";
          iconText = "+";
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

export default EtagereColumnHighlights;
