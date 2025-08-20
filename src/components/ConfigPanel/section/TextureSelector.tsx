import { useConfig } from "@/components/context/WardrobeContext";
import React, { useMemo, useState } from "react";

// Type cho thông tin đếm components sử dụng texture
interface EntierInfo {
  count: number;
  details: string[];
}

interface TextureSelectorProps {
  type: "entier" | "test" | "tablette" | "facades";
}

const TextureSelector: React.FC<TextureSelectorProps> = ({ type }) => {
  const { config, updateConfig, batchUpdate } = useConfig();
  const [hoveredTexture, setHoveredTexture] = useState<{
    name: string;
    src: string;
    x: number;
    y: number;
  } | null>(null);

  // Hàm xử lý mouse enter để hiển thị tooltip
  const handleMouseEnter = (
    event: React.MouseEvent,
    texture: { name: string; src: string }
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredTexture({
      name: texture.name,
      src: texture.src,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  // Hàm xử lý mouse leave để ẩn tooltip
  const handleMouseLeave = () => {
    setHoveredTexture(null);
  };

  // Hàm để lấy tất cả các texture đang được sử dụng trong toàn bộ tủ
  const getAllUsedTextures = useMemo(() => {
    const textures = new Set<string>();

    // Lấy texture mặc định
    textures.add(config.texture.src);

    // Thêm texture từ shelfTextureConfig
    Object.values(config.shelfTextureConfig).forEach((texture) => {
      textures.add(texture.src);
    });

    // Thêm texture từ facadeTextureConfig
    Object.values(config.facadeTextureConfig).forEach((texture) => {
      textures.add(texture.src);
    });

    return textures;
  }, [
    config.texture.src,
    config.shelfTextureConfig,
    config.facadeTextureConfig,
  ]);

  // Hàm để đếm số lượng thành phần sử dụng texture cho "entier"
  const countComponentsUsingTextureForEntier = (
    textureSrc: string
  ): EntierInfo => {
    let count = 0;
    const details: string[] = [];

    // Nếu đang ở chế độ tablette, chỉ đếm những shelf đang được chọn
    if (type === "tablette") {
      config.selectedSpacingIds.forEach((spacingId) => {
        if (spacingId.startsWith("angle-")) {
          const relatedSpacingIds = getAllSpacingIdsInAngleGroup(spacingId);
          const isAngleUsingTexture = relatedSpacingIds.some((relatedId) => {
            const customTexture = config.shelfTextureConfig[relatedId];
            const textureToCheck = customTexture || config.texture;
            return textureToCheck.src === textureSrc;
          });

          if (isAngleUsingTexture) {
            count += 1;
            details.push(`étagère angle ${spacingId}`);
          }
        } else {
          const customTexture = config.shelfTextureConfig[spacingId];
          const textureToCheck = customTexture || config.texture;

          if (textureToCheck.src === textureSrc) {
            count += 1;
            details.push(`étagère ${spacingId}`);
          }
        }
      });
    } else if (type === "facades") {
      // Nếu đang ở chế độ facades, chỉ đếm những facade đang được chọn
      config.selectedSpacingIds.forEach((spacingId) => {
        const customTexture = config.facadeTextureConfig[spacingId];
        const textureToCheck = customTexture || config.texture;

        if (textureToCheck.src === textureSrc) {
          count += 1;
          details.push(`façade ${spacingId}`);
        }
      });
    } else {
      // Logic cũ cho các chế độ khác (entier, facades)
      // Đếm kệ sử dụng texture này
      Object.entries(config.shelfTextureConfig).forEach(
        ([spacingId, texture]) => {
          if (texture.src === textureSrc) {
            // Kiểm tra xem có phải angle group không
            if (spacingId.startsWith("angle-")) {
              // Đếm số kệ thực tế trong angle group
              const relatedSpacingIds = getAllSpacingIdsInAngleGroup(spacingId);
              count += relatedSpacingIds.length;
              details.push(
                `étagère angle ${spacingId} (${relatedSpacingIds.length} kệ)`
              );
            } else {
              count += 1;
              details.push(`étagère ${spacingId}`);
            }
          }
        }
      );

      // Đếm facade sử dụng texture này
      Object.entries(config.facadeTextureConfig).forEach(
        ([spacingId, texture]) => {
          if (texture.src === textureSrc) {
            count += 1;
            details.push(`façade ${spacingId}`);
          }
        }
      );

      // Đếm kệ sử dụng texture mặc định (entier)
      if (config.texture.src === textureSrc) {
        // Tính số kệ không có texture riêng (dùng texture mặc định)
        const totalShelves = getAllShelvesCount();
        const shelvesWithCustomTexture = getShelvesWithCustomTextureCount();
        const shelvesUsingDefaultTexture =
          totalShelves - shelvesWithCustomTexture;

        if (shelvesUsingDefaultTexture > 0) {
          count += shelvesUsingDefaultTexture;
          details.push(`${shelvesUsingDefaultTexture} étagères (défaut)`);
        }

        // Tính số facade không có texture riêng (dùng texture mặc định)
        const totalFacades = getAllFacadesCount();
        const facadesWithCustomTexture = Object.keys(
          config.facadeTextureConfig
        ).length;
        const facadesUsingDefaultTexture =
          totalFacades - facadesWithCustomTexture;

        if (facadesUsingDefaultTexture > 0) {
          count += facadesUsingDefaultTexture;
          details.push(`${facadesUsingDefaultTexture} façades (défaut)`);
        }
      }
    }

    return { count, details };
  };

  // Hàm đếm số kệ có texture riêng (bao gồm cả kệ angle)
  const getShelvesWithCustomTextureCount = (): number => {
    let count = 0;

    Object.entries(config.shelfTextureConfig).forEach(([spacingId]) => {
      if (spacingId.startsWith("angle-")) {
        // Đếm số kệ thực tế trong angle group
        const relatedSpacingIds = getAllSpacingIdsInAngleGroup(spacingId);
        count += relatedSpacingIds.length;
      } else {
        count += 1;
      }
    });

    return count;
  };

  // Hàm đếm tổng số kệ trong tủ
  const getAllShelvesCount = (): number => {
    let totalCount = 0;

    // Đếm kệ trong tất cả sections
    Object.entries(config.wardrobeType.sections).forEach(([, section]) => {
      if (section && section.columns) {
        section.columns.forEach((column: any) => {
          if (column.shelves?.spacings) {
            // Số kệ = số spacings - 1 (trừ spacing cuối cùng)
            totalCount += column.shelves.spacings.length - 1;
          }
        });
      }
    });

    return totalCount;
  };

  // Hàm đếm tổng số facade trong tủ
  const getAllFacadesCount = (): number => {
    let totalCount = 0;

    // Đếm facade từ doorsDrawersConfig, loại trừ verre và mirroir
    Object.entries(config.doorsDrawersConfig).forEach(([, doorType]) => {
      // Loại trừ các loại verre và mirroir
      const excludedTypes = [
        "leftDoorVerre",
        "rightDoorVerre",
        "drawerVerre",
        "doubleSwingDoorVerre",
        "slidingMirrorDoor",
        "slidingGlassDoor",
      ];

      if (!excludedTypes.includes(doorType)) {
        totalCount += 1;
      }
    });

    return totalCount;
  };

  // Hàm cập nhật texture cho toàn bộ tủ
  const updateEntireWardrobe = (textureName: string, textureSrc: string) => {
    // Cập nhật texture mặc định (entier)
    updateConfig("texture", {
      name: textureName,
      src: textureSrc,
    });

    // Nếu ở chế độ "entier", reset tất cả shelf và facade về texture mới
    if (type === "entier") {
      // Xóa tất cả texture riêng của shelf và facade
      updateConfig("shelfTextureConfig", {});
      updateConfig("facadeTextureConfig", {});
    }
  };

  // Hàm cập nhật texture cho các kệ đã chọn
  const updateSelectedShelves = (textureName: string, textureSrc: string) => {
    const newShelfTextureConfig = { ...config.shelfTextureConfig };

    // Tạo map để theo dõi các angle groups đã được xử lý
    const processedAngleGroups = new Set<string>();

    config.selectedSpacingIds.forEach((spacingId) => {
      // Kiểm tra xem spacingId này có phải là angle group không
      if (spacingId.startsWith("angle-")) {
        // Nếu đã xử lý angle group này rồi thì bỏ qua
        if (processedAngleGroups.has(spacingId)) {
          return;
        }

        // Đánh dấu đã xử lý
        processedAngleGroups.add(spacingId);

        // Lấy tất cả spacingId thuộc cùng angle group
        const relatedSpacingIds = getAllSpacingIdsInAngleGroup(spacingId);

        // Áp dụng texture cho tất cả spacingId trong group
        relatedSpacingIds.forEach((relatedSpacingId) => {
          newShelfTextureConfig[relatedSpacingId] = {
            name: textureName,
            src: textureSrc,
          };
        });
      } else {
        // Kệ thường - áp dụng texture bình thường
        newShelfTextureConfig[spacingId] = {
          name: textureName,
          src: textureSrc,
        };
      }
    });

    // Cập nhật texture config
    updateConfig("shelfTextureConfig", newShelfTextureConfig);

    // Tự động deselect tất cả các kệ sau khi áp dụng texture
    batchUpdate({
      selectedSpacingIds: [],
      hoveredSpacingId: null,
    });

    // Reset hoveredTexture để ẩn tooltip
    setHoveredTexture(null);
  };

  // Hàm lấy tất cả spacingId thuộc cùng một angle group
  const getAllSpacingIdsInAngleGroup = (angleGroupId: string): string[] => {
    const spacingIds: string[] = [];
    const { id: wardrobeTypeId } = config.wardrobeType;

    // Parse angle group ID để lấy thông tin
    const match = angleGroupId.match(/angle-(\w+)-(\d+)/);
    if (!match) return [angleGroupId];

    const [, angleType, spacingIndex] = match;
    const spacingIndexNum = parseInt(spacingIndex);

    if (wardrobeTypeId === "Angle" && angleType === "ab") {
      // Cho Angle type: angle-ab bao gồm sectionA (cột cuối) và sectionB (cột đầu)
      const sectionA = config.wardrobeType.sections.sectionA;
      const sectionB = config.wardrobeType.sections.sectionB;

      if (sectionA && sectionA.columns.length > 0) {
        const lastColumnA = sectionA.columns[sectionA.columns.length - 1];
        if (lastColumnA.shelves?.spacings?.[spacingIndexNum]) {
          spacingIds.push(lastColumnA.shelves.spacings[spacingIndexNum].id);
        }
      }

      if (sectionB && sectionB.columns.length > 0) {
        const firstColumnB = sectionB.columns[0];
        if (firstColumnB.shelves?.spacings?.[spacingIndexNum]) {
          spacingIds.push(firstColumnB.shelves.spacings[spacingIndexNum].id);
        }
      }
    } else if (wardrobeTypeId === "Forme U") {
      if (angleType === "ab") {
        // Cho Forme U type: angle-ab bao gồm sectionA (cột đầu) và sectionB (cột cuối)
        const sectionA = config.wardrobeType.sections.sectionA;
        const sectionB = config.wardrobeType.sections.sectionB;

        if (sectionA && sectionA.columns.length > 0) {
          const firstColumnA = sectionA.columns[0];
          if (firstColumnA.shelves?.spacings?.[spacingIndexNum]) {
            spacingIds.push(firstColumnA.shelves.spacings[spacingIndexNum].id);
          }
        }

        if (sectionB && sectionB.columns.length > 0) {
          const lastColumnB = sectionB.columns[sectionB.columns.length - 1];
          if (lastColumnB.shelves?.spacings?.[spacingIndexNum]) {
            spacingIds.push(lastColumnB.shelves.spacings[spacingIndexNum].id);
          }
        }
      } else if (angleType === "ac") {
        // Cho Forme U type: angle-ac bao gồm sectionA (cột cuối) và sectionC (cột đầu)
        const sectionA = config.wardrobeType.sections.sectionA;
        const sectionC = config.wardrobeType.sections.sectionC;

        if (sectionA && sectionA.columns.length > 0) {
          const lastColumnA = sectionA.columns[sectionA.columns.length - 1];
          if (lastColumnA.shelves?.spacings?.[spacingIndexNum]) {
            spacingIds.push(lastColumnA.shelves.spacings[spacingIndexNum].id);
          }
        }

        if (sectionC && sectionC.columns.length > 0) {
          const firstColumnC = sectionC.columns[0];
          if (firstColumnC.shelves?.spacings?.[spacingIndexNum]) {
            spacingIds.push(firstColumnC.shelves.spacings[spacingIndexNum].id);
          }
        }
      }
    }

    return spacingIds.length > 0 ? spacingIds : [angleGroupId];
  };

  // Hàm cập nhật texture cho các facade đã chọn
  const updateSelectedFacades = (textureName: string, textureSrc: string) => {
    const newFacadeTextureConfig = { ...config.facadeTextureConfig };

    config.selectedSpacingIds.forEach((spacingId) => {
      newFacadeTextureConfig[spacingId] = {
        name: textureName,
        src: textureSrc,
      };
    });

    // Cập nhật texture config
    updateConfig("facadeTextureConfig", newFacadeTextureConfig);

    // Tự động deselect tất cả các facade sau khi áp dụng texture
    batchUpdate({
      selectedSpacingIds: [],
      hoveredSpacingId: null,
    });

    // Reset hoveredTexture để ẩn tooltip
    setHoveredTexture(null);
  };

  // Hàm reset các kệ đã chọn
  const resetSelectedShelves = () => {
    batchUpdate({
      selectedSpacingIds: [],
      hoveredSpacingId: null,
    });
  };

  // Hàm reset các facade đã chọn
  const resetSelectedFacades = () => {
    batchUpdate({
      selectedSpacingIds: [],
      hoveredSpacingId: null,
    });
  };

  // Kiểm tra có nên hiển thị danh sách texture không
  const shouldShowTextureGrid = () => {
    if (type === "tablette") {
      return config.selectedSpacingIds.length > 0;
    }
    if (type === "facades") {
      return config.selectedSpacingIds.length > 0;
    }
    return true;
  };

  // Thêm function này (mới hoàn toàn)
  const isTextureActive = (textureSrc: string): boolean => {
    if (type === "tablette") {
      return config.selectedSpacingIds.some((spacingId) => {
        if (spacingId.startsWith("angle-")) {
          const relatedSpacingIds = getAllSpacingIdsInAngleGroup(spacingId);
          return relatedSpacingIds.some((relatedId) => {
            const customTexture = config.shelfTextureConfig[relatedId];
            const textureToCheck = customTexture || config.texture;
            return textureToCheck.src === textureSrc;
          });
        } else {
          // Kệ thường
          const customTexture = config.shelfTextureConfig[spacingId];
          const textureToCheck = customTexture || config.texture;
          return textureToCheck.src === textureSrc;
        }
      });
    } else if (type === "facades") {
      return config.selectedSpacingIds.some((spacingId) => {
        const customTexture = config.facadeTextureConfig[spacingId];
        const textureToCheck = customTexture || config.texture;
        return textureToCheck.src === textureSrc;
      });
    } else {
      return getAllUsedTextures.has(textureSrc);
    }
  };

  // Hàm xử lý click texture
  const handleTextureClick = (textureName: string, textureSrc: string) => {
    if (type === "tablette") {
      updateSelectedShelves(textureName, textureSrc);
    } else if (type === "facades") {
      updateSelectedFacades(textureName, textureSrc);
    } else {
      updateEntireWardrobe(textureName, textureSrc);
    }
  };

  return (
    <div className="texture-selector mt-3">
      {/* Hiển thị thông báo về tình trạng texture */}
      {getAllUsedTextures.size > 1 && (
        <div className="alert alert-info d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center">
            <i className="fas fa-info-circle me-2"></i>
            <span>
              {getAllUsedTextures.size} textures différentes sont utilisées dans
              ce placard
            </span>
          </div>
        </div>
      )}

      {/* Button reset cho chế độ tablette */}
      {type === "tablette" && config.selectedSpacingIds.length > 0 && (
        <div className="mb-3">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={resetSelectedShelves}
          >
            Réinitialiser les étagères sélectionnées
          </button>
        </div>
      )}

      {/* Button reset cho chế độ facades */}
      {type === "facades" && config.selectedSpacingIds.length > 0 && (
        <div className="mb-3">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={resetSelectedFacades}
          >
            Réinitialiser les façades sélectionnées
          </button>
        </div>
      )}

      {/* Danh sách texture - chỉ hiển thị khi cần thiết */}
      {shouldShowTextureGrid() && (
        <div className="d-flex flex-wrap">
          {config.textures.length > 0 &&
            config.textures.map((texture, index) => {
              const isActive = isTextureActive(texture.src);

              // Lấy thông tin về components sử dụng texture
              const entierInfo: EntierInfo =
                countComponentsUsingTextureForEntier(texture.src);

              return (
                <div key={index} className="position-relative">
                  <button
                    onClick={() =>
                      handleTextureClick(texture.name, texture.src)
                    }
                    onMouseEnter={(e) => handleMouseEnter(e, texture)}
                    onMouseLeave={handleMouseLeave}
                    className={`btn p-0 m-1 border rounded-2 position-relative ${
                      isActive
                        ? "border-primary border-3"
                        : "border-secondary border-1"
                    }`}
                    style={{
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#fff",
                      boxShadow: isActive
                        ? "0 0 8px rgba(0,123,255,0.3)"
                        : "none",
                    }}
                    title={`${texture.name}${
                      entierInfo.count > 0
                        ? ` (${entierInfo.details.join(", ")})`
                        : ""
                    }`}
                  >
                    <img
                      src={texture.src}
                      alt={texture.name}
                      className="rounded-1"
                      style={{
                        width: 32,
                        height: 32,
                        objectFit: "cover",
                        opacity: isActive ? 1 : 0.8,
                      }}
                    />

                    {/* Hiển thị indicator khi texture đang được sử dụng */}
                    {isActive && (
                      <div
                        className="position-absolute top-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: 16,
                          height: 16,
                          fontSize: 10,
                          transform: "translate(25%, -25%)",
                        }}
                      >
                        {type === "entier" && config.texture.src === texture.src
                          ? "✓"
                          : entierInfo.count > 9
                          ? "9+"
                          : entierInfo.count || (type === "entier" ? "✓" : "")}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
        </div>
      )}

      {/* Tooltip khi hover */}
      {hoveredTexture && (
        <div
          className="position-fixed bg-dark text-white p-2 rounded shadow-lg"
          style={{
            left: hoveredTexture.x - 150,
            top: hoveredTexture.y - 250,
            zIndex: 9999,
            pointerEvents: "none",
            minWidth: "300px",
          }}
        >
          <div className="text-center">
            <img
              src={hoveredTexture.src}
              alt={hoveredTexture.name}
              className="rounded mb-2"
              style={{
                width: "100%",
                height: 200,
                objectFit: "cover",
              }}
            />
            <div className="small fw-bold">{hoveredTexture.name}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextureSelector;
