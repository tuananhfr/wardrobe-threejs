// src/components/Wardrobe/SectionShelves.tsx - WITH SPECIAL CASE
import { useConfig } from "@/components/context/WardrobeContext";
import React from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";

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
  const { config, updateConfig } = useConfig();
  // Kiểm tra xem section này có đang được highlight không
  const isActive = showSections === sectionName;

  // Kiểm tra có đang ở chế độ chọn kệ không
  const isSelectingShelves = config.activeView === "tablette";

  // Hàm lấy texture cho kệ cụ thể
  const getShelfTexture = (spacingId: string): THREE.Texture => {
    const shelfTexture = config.shelfTextureConfig[spacingId];
    if (shelfTexture) {
      // Tạo texture mới từ src
      const textureLoader = new THREE.TextureLoader();
      return textureLoader.load(shelfTexture.src);
    }
    // Dùng texture mặc định (entier) chỉ khi kệ không có texture riêng
    return texture;
  };

  // Hàm xử lý hover kệ
  const handleShelfPointerOver = (spacingId: string) => {
    if (isSelectingShelves) {
      updateConfig("hoveredSpacingId", spacingId);
    }
  };

  // Hàm xử lý leave kệ
  const handleShelfPointerOut = () => {
    if (isSelectingShelves) {
      updateConfig("hoveredSpacingId", null);
    }
  };

  // Hàm xử lý click kệ
  const handleShelfClick = (spacingId: string) => {
    if (isSelectingShelves) {
      const currentSelectedIds = [...config.selectedSpacingIds];
      const index = currentSelectedIds.indexOf(spacingId);

      if (index > -1) {
        // Nếu đã chọn thì bỏ chọn
        currentSelectedIds.splice(index, 1);
      } else {
        // Nếu chưa chọn thì thêm vào
        currentSelectedIds.push(spacingId);
      }

      updateConfig("selectedSpacingIds", currentSelectedIds);
    }
  };

  // Hàm xác định trạng thái highlight của kệ
  const getShelfHighlightState = (spacingId: string) => {
    // Chỉ highlight khi ở chế độ tablette
    if (!isSelectingShelves)
      return {
        isHighlighted: false,
        isSelected: false,
        isLightHighlight: false,
      };

    const isHovered = config.hoveredSpacingId === spacingId;
    const isSelected = config.selectedSpacingIds.includes(spacingId);

    // Không cần highlight màu sắc khi ở chế độ tablette
    const isLightHighlight = false;

    // Chỉ highlight đậm khi có kệ được chọn hoặc hover
    const isStrongHighlight = isHovered || isSelected;

    return {
      isHighlighted: isStrongHighlight,
      isSelected,
      isLightHighlight,
    };
  };

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
          const spacingId = column.shelves!.spacings![index].id;
          const shelfTexture = getShelfTexture(spacingId);
          const { isSelected, isLightHighlight } =
            getShelfHighlightState(spacingId);
          const isHovered = config.hoveredSpacingId === spacingId;

          // Xác định màu sắc và opacity cho highlight
          let highlightColor = "#f8f9fa"; // Default light gray
          let opacity = 0;
          let shouldShowHighlight = false;

          if (isSelected) {
            highlightColor = "#e6f7f9"; // Blue khi selected
            opacity = 0.6;
            shouldShowHighlight = true;
          } else if (isHovered) {
            highlightColor = "#f8f9fa"; // Light gray khi hover
            opacity = 0.4;
            shouldShowHighlight = true;
          } else if (isLightHighlight) {
            highlightColor = "#f8f9fa"; // Light gray khi light highlight
            opacity = 0.2;
            shouldShowHighlight = true;
          }

          return (
            <group key={spacingId}>
              {/* Shelf mesh */}
              <mesh
                position={[
                  finalColumnXPosition,
                  convertToWorldY(position),
                  0, // Center theo depth
                ]}
                castShadow
                receiveShadow
                userData={{
                  type: "shelf",
                  spacingId,
                  columnId: column.id,
                  sectionName,
                }}
                onPointerOver={() => handleShelfPointerOver(spacingId)}
                onPointerOut={handleShelfPointerOut}
                onClick={() => handleShelfClick(spacingId)}
              >
                <boxGeometry args={[shelfWidth, shelfThickness, shelfDepth]} />
                <meshStandardMaterial
                  map={shelfTexture}
                  transparent={!isActive}
                  opacity={1}
                />
              </mesh>

              {/* Highlight overlay */}
              {shouldShowHighlight && (
                <mesh
                  position={[
                    finalColumnXPosition,
                    convertToWorldY(position),
                    0.01, // Slightly in front
                  ]}
                >
                  <boxGeometry
                    args={[shelfWidth, shelfThickness, shelfDepth]}
                  />
                  <meshBasicMaterial
                    color={highlightColor}
                    transparent
                    opacity={opacity}
                    depthWrite={false}
                    depthTest={false}
                  />
                </mesh>
              )}

              {/* Icon */}
              {(isHovered || isSelected || isSelectingShelves) && (
                <group
                  position={[
                    finalColumnXPosition,
                    convertToWorldY(position),
                    shelfDepth / 2 + 0.02, // In front of shelf
                  ]}
                >
                  {/* Icon background */}
                  <mesh>
                    <circleGeometry args={[0.05, 32]} />
                    <meshBasicMaterial
                      color="white"
                      transparent
                      opacity={0.9}
                    />
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
              )}
            </group>
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
