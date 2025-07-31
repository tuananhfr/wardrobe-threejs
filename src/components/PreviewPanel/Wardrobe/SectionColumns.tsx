// src/components/Wardrobe/SectionColumns.tsx
import React from "react";
import * as THREE from "three";

interface SectionColumnsProps {
  sectionName: string;
  sectionData: WardrobeSection;
  position: [number, number, number];
  height: number;
  baseBarHeight: number;
  thickness: number;
  texture: THREE.Texture;
  showSections: string;
}

const SectionColumns: React.FC<SectionColumnsProps> = ({
  sectionName,
  sectionData,
  position,

  height,
  baseBarHeight,
  thickness,
  texture,
  showSections,
}) => {
  const { width, depth, columns } = sectionData;

  // Kiểm tra xem section này có đang bật không
  const isActive = showSections === sectionName;

  // Màu sắc tùy theo có bật hay không
  const materialColor = isActive ? "black" : "white";

  // Tính toán vị trí các cột dựa trên column widths
  const calculateColumnPositions = () => {
    if (columns.length === 0) return [];

    let currentX = -width / 2 + thickness; // Bắt đầu từ edge trái + thickness
    const positions: { x: number; width: number; id: string }[] = [];

    columns.forEach((column) => {
      const columnCenterX = currentX + column.width / 2;
      positions.push({
        x: columnCenterX,
        width: column.width,
        id: column.id,
      });
      currentX += column.width + thickness; // Di chuyển đến vị trí cột tiếp theo
    });

    return positions;
  };

  const columnPositions = calculateColumnPositions();
  const innerHeight = height - 2 * thickness - baseBarHeight; // Chiều cao thực của cột

  return (
    <group position={position}>
      {/* Render vertical columns (vách ngăn thẳng đứng) */}
      {columnPositions.map((col, index) => {
        // Chỉ render column separator giữa các cột (không phải cột đầu và cuối)
        if (index < columnPositions.length - 1) {
          const separatorX = col.x + col.width / 2 + thickness / 2;

          return (
            <mesh
              key={`column-${col.id}`}
              position={[
                separatorX,
                thickness / 2, // Đặt ở giữa chiều cao
                thickness,
              ]}
              castShadow
            >
              <boxGeometry
                args={[
                  thickness, // Độ dày cột
                  innerHeight, // Chiều cao cột (từ bottom đến top)
                  depth - 2 * thickness, // Chiều sâu (trừ back panel)
                ]}
              />
              <meshStandardMaterial map={texture} color={materialColor} />
            </mesh>
          );
        }
        return null;
      })}
    </group>
  );
};

export default SectionColumns;
