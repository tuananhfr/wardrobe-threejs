// src/components/Wardrobe/SectionShelves.tsx - FIXED VERSION
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

  // Kiểm tra xem section này có đang được highlight không
  const isActive = showSections === sectionName;

  /**
   * Convert spacings array to shelf positions
   * spacings = [sol->shelf1, shelf1->shelf2, shelf2->shelf3, shelf3->plafond]
   * positions = [shelf1_pos, shelf2_pos, shelf3_pos]
   */
  const spacingsToPositions = (spacings: shelfSpacing[]): number[] => {
    const positions: number[] = [];
    let currentPosition = thickness; // Start from sol thickness

    // Skip last spacing (to plafond), convert others to positions
    for (let i = 0; i < spacings.length - 1; i++) {
      currentPosition += spacings[i].spacing;
      positions.push(currentPosition);
    }

    return positions;
  };

  // Render kệ cho từng cột
  const renderColumnShelves = (column: WardrobeColumn, columnIndex: number) => {
    if (!column.shelves || !column.shelves.spacings) {
      return null;
    }

    // Convert spacings to positions - ĐÂY LÀ KEY DIFFERENCE!
    const shelfPositions = spacingsToPositions(column.shelves.spacings);

    if (shelfPositions.length === 0) {
      return null;
    }

    // Tính vị trí X của cột trong section
    let columnXPosition = -width / 2 + thickness; // Bắt đầu từ left wall + thickness

    // Cộng width của các cột trước đó + thickness của separators
    for (let i = 0; i < columnIndex; i++) {
      columnXPosition += sectionData.columns[i].width + thickness;
    }

    // Tính center của cột hiện tại
    columnXPosition += column.width / 2;

    return (
      <group key={`${sectionName}-${column.id}-shelves`}>
        {/* RENDER THEO POSITIONS, KHÔNG PHẢI SPACINGS! */}
        {shelfPositions.map((shelfPosition, index) => {
          const shelf = column.shelves!.spacings![index];

          // Convert shelf position - sử dụng actual position, không phải spacing
          const shelfPositionY =
            shelfPosition / 100 - height / 2 + baseBarHeight / 100;

          // Kích thước kệ - hơi nhỏ hơn column để tạo khoảng trống
          const shelfWidth = column.width - 0.01; // 1cm padding
          const shelfDepth = depth - 2 * thickness - 0.01; // Không chạm vào back panel

          return (
            <mesh
              key={shelf.id}
              position={[
                columnXPosition,
                shelfPositionY,
                0, // Center theo depth
              ]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[shelfWidth, shelfThickness, shelfDepth]} />
              <meshStandardMaterial
                map={texture}
                transparent={!isActive}
                opacity={isActive ? 1.0 : 0.8}
              />
            </mesh>
          );
        })}
      </group>
    );
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
