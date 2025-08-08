// src/components/Wardrobe/SectionColumns.tsx
import React from "react";
import * as THREE from "three";

interface SectionColumnsProps {
  sectionData: WardrobeSection;
  position: [number, number, number];
  height: number;
  baseBarHeight: number;
  thickness: number;
  texture: THREE.Texture;
  ledColor?: string;
}

const SectionColumns: React.FC<SectionColumnsProps> = ({
  sectionData,
  position,
  height,
  baseBarHeight,
  thickness,
  texture,
  ledColor = "",
}) => {
  const { width, depth, columns } = sectionData;

  // Giữ màu trắng cho các thanh chắn column để tránh xung đột với highlight
  const materialColor = "white";

  // Kiểm tra xem có LED không - chỉ hiển thị khi ledColor !== ""
  const hasLed = ledColor !== "";

  // LED strip configuration
  const ledStripWidth = 0.02;
  const ledStripHeight = 0.005;
  const ledStripLength = height - baseBarHeight - 0.1; // Trừ một chút để không chạm top/bottom

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
            <group key={`column-group-${col.id}`}>
              {/* Column separator */}
              <mesh
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

              {/* LED strips on column separator */}
              {hasLed && (
                <>
                  {/* LED strip on left side of column */}
                  <group
                    key={`column-left-led-group-${col.id}-${ledColor}`}
                    position={[
                      separatorX - thickness / 2 - ledStripHeight / 2,
                      thickness / 2,
                      depth / 2 - 0.1,
                    ]}
                  >
                    {/* LED strip base */}
                    <mesh position={[0, 0, 0]}>
                      <boxGeometry
                        args={[ledStripHeight, ledStripLength, ledStripWidth]}
                      />
                      <meshBasicMaterial color="#2c2c2c" />
                    </mesh>

                    {/* LED light effect */}
                    <mesh position={[-ledStripHeight / 4, 0, 0]}>
                      <boxGeometry
                        args={[
                          ledStripHeight / 2,
                          ledStripLength * 0.95,
                          ledStripWidth * 0.8,
                        ]}
                      />
                      <meshStandardMaterial
                        key={`column-left-led-material-${col.id}-${ledColor}`}
                        color="#ffffff"
                        emissive={ledColor}
                        emissiveIntensity={0.8}
                        transparent
                        opacity={0.9}
                      />
                    </mesh>
                  </group>

                  {/* LED strip on right side of column */}
                  <group
                    key={`column-right-led-group-${col.id}-${ledColor}`}
                    position={[
                      separatorX + thickness / 2 + ledStripHeight / 2,
                      thickness / 2,
                      depth / 2 - 0.1,
                    ]}
                  >
                    {/* LED strip base */}
                    <mesh position={[0, 0, 0]}>
                      <boxGeometry
                        args={[ledStripHeight, ledStripLength, ledStripWidth]}
                      />
                      <meshBasicMaterial color="#2c2c2c" />
                    </mesh>

                    {/* LED light effect */}
                    <mesh position={[ledStripHeight / 4, 0, 0]}>
                      <boxGeometry
                        args={[
                          ledStripHeight / 2,
                          ledStripLength * 0.95,
                          ledStripWidth * 0.8,
                        ]}
                      />
                      <meshStandardMaterial
                        key={`column-right-led-material-${col.id}-${ledColor}`}
                        color="#ffffff"
                        emissive={ledColor}
                        emissiveIntensity={0.8}
                        transparent
                        opacity={0.9}
                      />
                    </mesh>
                  </group>

                  {/* LED strip light sources for illumination */}
                  <rectAreaLight
                    key={`column-left-light-${col.id}-${ledColor}`}
                    position={[
                      separatorX - thickness / 2 - 0.02,
                      thickness / 2,
                      thickness,
                    ]}
                    rotation={[0, Math.PI / 2, 0]}
                    width={ledStripLength}
                    height={ledStripWidth}
                    intensity={0.3}
                    color={ledColor}
                  />
                  <rectAreaLight
                    key={`column-right-light-${col.id}-${ledColor}`}
                    position={[
                      separatorX + thickness / 2 + 0.02,
                      thickness / 2,
                      thickness,
                    ]}
                    rotation={[0, -Math.PI / 2, 0]}
                    width={ledStripLength}
                    height={ledStripWidth}
                    intensity={0.3}
                    color={ledColor}
                  />
                </>
              )}
            </group>
          );
        }
        return null;
      })}
    </group>
  );
};

export default SectionColumns;
