import { useConfig } from "@/context/WardrobeContext";
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
  const isTexturesMode = config.accordionOpen === "collapseTextures";
  const isTablettesMode = config.activeView === "tablette";
  const isSelectingShelves = isTexturesMode && isTablettesMode;

  // Cache texture để tránh nhấp nháy
  const textureCache = React.useRef<Map<string, THREE.Texture>>(new Map());
  const textureLoader = React.useRef(new THREE.TextureLoader());

  // Clear cache khi texture config thay đổi
  React.useEffect(() => {
    textureCache.current.clear();
  }, [config.shelfTextureConfig]);

  // Hàm lấy texture cho kệ cụ thể
  const getShelfTexture = (
    spacingId: string,
    columnIndex: number,
    spacingIndex: number
  ): THREE.Texture => {
    // Kiểm tra xem có phải kệ angle không
    const angleGroup = getAngleShelfGroup(columnIndex, spacingIndex);

    let textureSrc: string;
    let textureKey: string;

    if (angleGroup) {
      // Nếu là kệ angle, tìm texture theo angle group ID
      const shelfTexture = config.shelfTextureConfig[angleGroup];
      textureSrc = shelfTexture ? shelfTexture.src : texture.image?.src || "";
      textureKey = `${angleGroup}-${textureSrc}`;
    } else {
      // Kiểm tra texture riêng cho spacingId
      const shelfTexture = config.shelfTextureConfig[spacingId];
      textureSrc = shelfTexture ? shelfTexture.src : texture.image?.src || "";
      textureKey = `${spacingId}-${textureSrc}`;
    }

    // Kiểm tra cache trước
    if (textureCache.current.has(textureKey)) {
      return textureCache.current.get(textureKey)!;
    }

    let textureToUse: THREE.Texture;

    if (angleGroup) {
      // Nếu là kệ angle, tìm texture theo angle group ID
      const shelfTexture = config.shelfTextureConfig[angleGroup];
      if (shelfTexture) {
        textureToUse = textureLoader.current.load(shelfTexture.src);
      } else {
        textureToUse = texture;
      }
    } else {
      // Kiểm tra texture riêng cho spacingId
      const shelfTexture = config.shelfTextureConfig[spacingId];
      if (shelfTexture) {
        textureToUse = textureLoader.current.load(shelfTexture.src);
      } else {
        textureToUse = texture;
      }
    }

    // Cache texture với key bao gồm cả URL
    textureCache.current.set(textureKey, textureToUse);
    return textureToUse;
  };

  // Hàm xử lý hover kệ
  const handleShelfPointerOver = (
    spacingId: string,
    columnIndex: number,
    spacingIndex: number
  ) => {
    if (isSelectingShelves) {
      const angleGroup = getAngleShelfGroup(columnIndex, spacingIndex);

      if (angleGroup) {
        updateConfig("hoveredShelvesSpacingId", angleGroup); // "angle-ab" thay vì spacingId
      } else {
        updateConfig("hoveredShelvesSpacingId", spacingId);
      }
    }
  };

  // Hàm xử lý leave kệ
  const handleShelfPointerOut = () => {
    if (isSelectingShelves) {
      updateConfig("hoveredShelvesSpacingId", null);
    }
  };

  // Hàm xử lý click kệ
  const handleShelfClick = (
    spacingId: string,
    columnIndex: number,
    spacingIndex: number
  ) => {
    if (isSelectingShelves) {
      const angleGroup = getAngleShelfGroup(columnIndex, spacingIndex);
      const targetId = angleGroup || spacingId; // Dùng angle group nếu có

      const currentSelectedIds = [...config.selectedShelvesSpacingIds];
      const index = currentSelectedIds.indexOf(targetId);

      if (index > -1) {
        currentSelectedIds.splice(index, 1);
      } else {
        currentSelectedIds.push(targetId);
      }

      updateConfig("selectedShelvesSpacingIds", currentSelectedIds);
    }
  };

  // Hàm xác định trạng thái highlight của kệ
  const getShelfHighlightState = (
    spacingId: string,
    columnIndex: number,
    spacingIndex: number
  ) => {
    if (!isSelectingShelves) return { isHighlighted: false, isSelected: false };

    const angleGroup = getAngleShelfGroup(columnIndex, spacingIndex);
    const isHovered = angleGroup
      ? config.hoveredShelvesSpacingId === angleGroup
      : config.hoveredShelvesSpacingId === spacingId;

    const isSelected = angleGroup
      ? config.selectedShelvesSpacingIds.includes(angleGroup)
      : config.selectedShelvesSpacingIds.includes(spacingId);

    return { isHighlighted: isHovered || isSelected, isSelected };
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
          const shelfTexture = getShelfTexture(spacingId, columnIndex, index);
          const { isSelected } = getShelfHighlightState(
            spacingId,
            columnIndex,
            index
          );
          const angleGroup = getAngleShelfGroup(columnIndex, index);
          const isHovered = angleGroup
            ? config.hoveredShelvesSpacingId === angleGroup
            : config.hoveredShelvesSpacingId === spacingId;

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
                onPointerOver={() =>
                  handleShelfPointerOver(spacingId, columnIndex, index)
                }
                onPointerOut={handleShelfPointerOut}
                onClick={() => handleShelfClick(spacingId, columnIndex, index)}
              >
                <boxGeometry args={[shelfWidth, shelfThickness, shelfDepth]} />
                <meshStandardMaterial
                  map={shelfTexture}
                  transparent={!isActive}
                  opacity={1}
                />
              </mesh>

              {/* Highlight overlay chỉ hiển thị ở chế độ Textures + Tablettes */}
              {isSelectingShelves && shouldShowHighlight && (
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

              {/* Icon: chỉ hiển thị ở chế độ Textures + Tablettes */}
              {isSelectingShelves &&
                (!isAngleShelf(columnIndex) ||
                  shouldShowAngleShelfIcon(columnIndex)) && (
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

  // Hàm kiểm tra xem có phải angle shelf không
  const isAngleShelf = (columnIndex: number) => {
    const { id } = config.wardrobeType;
    const isFirst = columnIndex === 0;
    const isLast = columnIndex === sectionData.columns.length - 1;

    if (id === "Angle" && sectionName === "sectionB" && isFirst) {
      return true;
    }
    if (id === "Angle" && sectionName === "sectionA" && isLast) {
      return true;
    }
    if (id === "Forme U" && sectionName === "sectionB" && isLast) {
      return true;
    }
    if (id === "Forme U" && sectionName === "sectionC" && isFirst) {
      return true;
    }
    if (id === "Forme U" && sectionName === "sectionA" && isFirst) {
      return true;
    }
    if (id === "Forme U" && sectionName === "sectionA" && isLast) {
      return true;
    }
    return false;
  };

  // Xác định kệ angle groups
  const getAngleShelfGroup = (columnIndex: number, spacingIndex: number) => {
    const { id } = config.wardrobeType;

    if (id === "Angle") {
      const isALast =
        sectionName === "sectionA" &&
        columnIndex === sectionData.columns.length - 1;
      const isBFirst = sectionName === "sectionB" && columnIndex === 0;

      if (isALast || isBFirst) {
        // Tạo unique ID cho từng spacing level
        return `angle-ab-${spacingIndex}`;
      }
    } else if (id === "Forme U") {
      const isBLast =
        sectionName === "sectionB" &&
        columnIndex === sectionData.columns.length - 1;
      const isAFirst = sectionName === "sectionA" && columnIndex === 0;
      const isCFirst = sectionName === "sectionC" && columnIndex === 0;
      const isALast =
        sectionName === "sectionA" &&
        columnIndex === sectionData.columns.length - 1;

      if (isBLast || isAFirst) {
        return `angle-ab-${spacingIndex}`;
      }
      if (isCFirst || isALast) {
        return `angle-ac-${spacingIndex}`;
      }
    }

    return null;
  };
  // Hàm kiểm tra xem có hiển thị icon cho angle shelf không (chỉ ở b-col-1)
  const shouldShowAngleShelfIcon = (columnIndex: number) => {
    const { id } = config.wardrobeType;

    if (id === "Angle") {
      // Cho Angle type: hiển thị icon ở sectionB (cột đầu) cho angle-ab
      const isBFirstColumn = sectionName === "sectionB" && columnIndex === 0;
      return isBFirstColumn;
    } else if (id === "Forme U") {
      // Cho Forme U type:
      // - angle-ab: hiển thị icon ở sectionB (cột cuối)
      // - angle-ac: hiển thị icon ở sectionC (cột đầu)
      const isBLastColumn =
        sectionName === "sectionB" &&
        columnIndex === sectionData.columns.length - 1;
      const isCFirstColumn = sectionName === "sectionC" && columnIndex === 0;
      return isBLastColumn || isCFirstColumn;
    }
    return false;
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
