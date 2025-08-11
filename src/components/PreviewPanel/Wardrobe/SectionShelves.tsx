// src/components/Wardrobe/SectionShelves.tsx - WITH SPECIAL CASE
import { useConfig } from "@/components/context/WardrobeContext";
import React from "react";
import * as THREE from "three";

interface SectionShelvesProps {
  sectionName: string;
  sectionData: WardrobeSection;
  position: [number, number, number];
  height: number;
  baseBarHeight: number;
  thickness: number;
  texture: THREE.Texture;
  showSections: string;
}

const SectionShelves: React.FC<SectionShelvesProps> = ({
  sectionName,
  sectionData,
  position,
  height,
  baseBarHeight,
  thickness,
  texture,
  showSections,
}) => {
  const width = sectionData.width;
  const depth = sectionData.depth;
  const shelfThickness = thickness; // Dùng cùng độ dày với frame
  const { config } = useConfig();
  // Kiểm tra xem section này có đang được highlight không
  const isActive = showSections === sectionName;

  /**
   * Convert spacings array to shelf positions
   * spacings = [sol->shelf1, shelf1->shelf2, shelf2->shelf3, shelf3->plafond]
   * positions = [shelf1_pos, shelf2_pos, shelf3_pos]
   */
  const spacingsToPositions = (spacings: shelfSpacing[]): number[] => {
    const positions: number[] = [];

    // Start from sol thickness (not baseBarHeight + thickness)
    let currentPosition = baseBarHeight * 100 + thickness * 100; // Start from sol thickness

    // Skip last spacing (to plafond), convert others to positions
    for (let i = 0; i < spacings.length - 1; i++) {
      currentPosition += spacings[i].spacing;
      positions.push(currentPosition);
      currentPosition += thickness * 100;
    }

    return positions;
  };

  // Render kệ cho từng cột - REFACTORED VERSION
  const renderColumnShelves = (column: WardrobeColumn, columnIndex: number) => {
    // Early returns for invalid data
    if (!column.shelves?.spacings?.length) return null;

    const shelfPositions = spacingsToPositions(column.shelves.spacings);
    if (shelfPositions.length === 0) return null;

    // Calculate base column X position
    const baseColumnXPosition = calculateColumnXPosition(columnIndex);

    // Get corner configuration
    const cornerConfig = getCornerConfiguration(columnIndex);

    // Apply corner adjustments
    const shelfWidth =
      column.width + (cornerConfig.isCorner ? 2 * thickness : 0);
    const finalColumnXPosition =
      baseColumnXPosition + column.width / 2 + cornerConfig.offset;
    const shelfDepth = depth - 2 * thickness;

    return (
      <group key={`${sectionName}-${column.id}-shelves`}>
        {shelfPositions.map((position, index) => {
          return (
            <mesh
              key={column.shelves!.spacings![index].id}
              position={[
                finalColumnXPosition,
                convertToWorldY(position),
                0, // Center theo depth
              ]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[shelfWidth, shelfThickness, shelfDepth]} />
              <meshStandardMaterial
                map={texture}
                transparent={!isActive}
                opacity={1}
              />
            </mesh>
          );
        })}
      </group>
    );
  };

  // Helper functions
  const calculateColumnXPosition = (columnIndex: number): number => {
    let position = -width / 2 + thickness; // Start from left wall + thickness

    // Add width of previous columns + separators
    for (let i = 0; i < columnIndex; i++) {
      position += sectionData.columns[i].width + thickness;
    }

    return position;
  };

  const getCornerConfiguration = (columnIndex: number) => {
    const { id } = config.wardrobeType;
    const isFirst = columnIndex === 0;
    const isLast = columnIndex === sectionData.columns.length - 1;

    // Corner cases configuration
    if (id === "Angle" && sectionName === "sectionB" && isFirst) {
      return { isCorner: true, offset: -thickness };
    }

    if (id === "Forme U" && sectionName === "sectionB" && isLast) {
      return { isCorner: true, offset: thickness };
    }

    if (id === "Forme U" && sectionName === "sectionC" && isFirst) {
      return { isCorner: true, offset: -thickness };
    }

    return { isCorner: false, offset: 0 };
  };

  const convertToWorldY = (shelfPosition: number): number => {
    // Convert shelf position (in cm) to world coordinates
    // shelfPosition is already calculated from baseBarHeight + thickness + spacings
    return shelfPosition / 100 - height / 2;
  };

  return (
    <group position={position}>
      {sectionData.columns.map((column, columnIndex) =>
        renderColumnShelves(column, columnIndex)
      )}
    </group>
  );
};

export default SectionShelves;
