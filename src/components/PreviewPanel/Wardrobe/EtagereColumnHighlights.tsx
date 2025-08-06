// src/components/Wardrobe/EtagereColumnHighlights.tsx
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

      positions.push({
        col: i,
        columnId: column.id,
        x: centerX,
        y: 0,
        iconY: 0,
        width: colWidth,
        height: colHeight,
        shelvesCount: column.shelves?.spacings?.length || 0,
      });
    }

    return positions;
  };

  const columnPositions = getColumnPositions();

  // Handle column click
  const handleColumnClick = (columnId: string) => {
    if (selectedColumnId === columnId) {
      // Deselect if already selected
      updateConfig("selectedColumnId", null);
    } else {
      // Select new column
      updateConfig("selectedColumnId", columnId);
    }
  };

  // Handle pointer move for hover detection
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    const x = event.point.x;
    let hoveredCol = null;

    // Check which column the pointer is over
    for (let i = 0; i < columnPositions.length; i++) {
      const pos = columnPositions[i];
      const halfWidth = pos.width / 2;
      const columnStartX = pos.x - halfWidth;
      const columnEndX = pos.x + halfWidth;

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

        return (
          <mesh
            key={`etagere-highlight-${pos.columnId}`}
            position={[pos.x, pos.y, 0]}
            onClick={(e) => {
              handleColumnClick(pos.columnId);
              e.stopPropagation();
            }}
          >
            <boxGeometry
              args={[pos.width, pos.height, depth - 2 * thickness]}
            />
            <meshBasicMaterial
              color={isSelected ? "#e6f7f9" : "#E6E6FA"}
              transparent
              opacity={isHovered || isSelected ? 0.6 : 0}
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

        if (!isHovered && !isSelected) return null;

        return (
          <group
            key={`etagere-icon-${pos.columnId}`}
            position={[pos.x, pos.iconY, depth / 2 + 0.01]}
          >
            {/* Icon background */}
            <mesh>
              <circleGeometry args={[0.05, 32]} />
              <meshBasicMaterial color="white" transparent opacity={0.9} />
            </mesh>

            {/* Icon text */}
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
        );
      })}
    </group>
  );
};

export default EtagereColumnHighlights;
