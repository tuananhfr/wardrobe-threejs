// src/components/Wardrobe/SectionShelves.tsx
import React from "react";
import * as THREE from "three";
import ShelfInfoDisplay from "./ShelfInfoDisplay";

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

  // Màu sắc cho kệ - nổi bật hơn khi active
  const shelfColor = isActive ? "#8B4513" : "#CD853F"; // Brown colors

  // Chiều cao khả dụng cho kệ (trừ base bar và frame thickness)
  const availableHeight = height - baseBarHeight - 2 * thickness;

  // Render kệ cho từng cột
  const renderColumnShelves = (column: WardrobeColumn, columnIndex: number) => {
    if (!column.shelves || !column.shelves.spacings) {
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
        {column.shelves.spacings.map((shelf) => {
          // Convert shelf position từ cm to meters và adjust cho coordinate system
          const shelfPositionY =
            shelf.spacing / 100 - height / 2 + baseBarHeight / 2;

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
                color={shelfColor}
                transparent={!isActive}
                opacity={isActive ? 1.0 : 0.8}
              />

              {/* Shelf info display when active */}
              {isActive && (
                <ShelfInfoDisplay
                  shelf={shelf}
                  position={[0, 0, 0]}
                  columnWidth={column.width}
                  isVisible={true}
                  totalHeight={availableHeight}
                />
              )}
            </mesh>
          );
        })}

        {/* Optional: Hanging rod nếu có */}
        {column.shelves.spacings.length > 0 && (
          <group>
            {/* Tìm khoảng trống lớn nhất để đặt thanh treo */}
            {(() => {
              const sortedShelves = [...column.shelves!.spacings!].sort(
                (a, b) => a.spacing - b.spacing
              );

              // Tìm khoảng trống lớn nhất (> 50cm)
              let largestGap = 0;
              let gapPosition = 0;

              // Check gap từ bottom đến shelf đầu tiên
              if (sortedShelves.length > 0) {
                const firstGap = sortedShelves[0].spacing - 5; // 5cm từ đáy
                if (firstGap > largestGap && firstGap > 50) {
                  largestGap = firstGap;
                  gapPosition = (5 + sortedShelves[0].spacing) / 2;
                }
              }

              // Check gaps giữa các shelf
              for (let i = 0; i < sortedShelves.length - 1; i++) {
                const gap =
                  sortedShelves[i + 1].spacing - sortedShelves[i].spacing;
                if (gap > largestGap && gap > 50) {
                  largestGap = gap;
                  gapPosition =
                    (sortedShelves[i].spacing + sortedShelves[i + 1].spacing) /
                    2;
                }
              }

              // Check gap từ shelf cuối đến top
              if (sortedShelves.length > 0) {
                const topHeight = availableHeight * 100 - 5; // Convert to cm, minus 5cm from top
                const lastGap =
                  topHeight - sortedShelves[sortedShelves.length - 1].spacing;
                if (lastGap > largestGap && lastGap > 50) {
                  largestGap = lastGap;
                  gapPosition =
                    (sortedShelves[sortedShelves.length - 1].spacing +
                      topHeight) /
                    2;
                }
              }

              // Render hanging rod nếu có khoảng trống đủ lớn
              if (largestGap > 50) {
                const rodPositionY =
                  gapPosition / 100 - height / 2 + baseBarHeight / 2;
                const rodLength = column.width - 0.02; // 2cm padding

                return (
                  <mesh
                    position={[columnXPosition, rodPositionY, 0]}
                    castShadow
                    rotation={[0, 0, Math.PI / 2]}
                  >
                    <cylinderGeometry
                      args={[0.005, 0.005, rodLength]} // 1cm diameter rod
                    />
                    <meshStandardMaterial
                      color="#C0C0C0" // Silver color for rod
                      metalness={0.8}
                      roughness={0.2}
                    />
                  </mesh>
                );
              }

              return null;
            })()}
          </group>
        )}
      </group>
    );
  };

  return (
    <group position={position}>
      {sectionData.columns.map((column, columnIndex) =>
        renderColumnShelves(column, columnIndex)
      )}

      {/* Optional: Visual guides when section is active */}
      {isActive && (
        <group>
          {/* Height markers */}
          {sectionData.columns.length > 0 &&
            sectionData.columns[0].shelves?.spacings && (
              <group>
                {sectionData.columns[0].shelves.spacings.map((shelf, index) => {
                  const shelfPositionY =
                    shelf.spacing / 100 - height / 2 + baseBarHeight / 2;

                  return (
                    <mesh
                      key={`guide-${index}`}
                      position={[
                        -width / 2 - 0.02, // Slightly outside left wall
                        shelfPositionY,
                        depth / 2 + 0.01, // Slightly in front
                      ]}
                    >
                      <sphereGeometry args={[0.005]} />
                      <meshBasicMaterial color="red" />
                    </mesh>
                  );
                })}
              </group>
            )}
        </group>
      )}
    </group>
  );
};

export default SectionShelves;
