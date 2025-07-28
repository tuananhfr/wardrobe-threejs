import { useConfig } from "@/components/context/WardrobeContext";
import React, { useMemo, useState } from "react";

// Type cho thông tin đếm components sử dụng texture
interface EntierInfo {
  count: number;
  details: string[];
}

const TextureSelector: React.FC = () => {
  const { config, updateConfig } = useConfig();
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

    // TODO: Thêm logic để lấy texture từ các sections khác nhau của tủ quần áo
    // sections A, B, C tùy theo loại tủ

    return textures;
  }, [config.texture.src]);

  // Hàm để đếm số lượng thành phần sử dụng texture cho "entier"
  const countComponentsUsingTextureForEntier = (
    textureSrc: string
  ): EntierInfo => {
    let count = 0;
    const details: string[] = [];

    // Kiểm tra texture mặc định
    if (config.texture.src === textureSrc) {
      count += 1;
      details.push("défaut");
    }

    // TODO: Thêm logic đếm cho sections A, B, C

    return { count, details };
  };

  // Hàm cập nhật texture cho toàn bộ tủ
  const updateEntireWardrobe = (textureName: string, textureSrc: string) => {
    // Cập nhật texture mặc định
    updateConfig("texture", {
      name: textureName,
      src: textureSrc,
    });

    // TODO: Reset texture của các sections để sử dụng texture mặc định
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

      {/* Danh sách texture */}
      <div className="d-flex flex-wrap">
        {config.textures.length > 0 &&
          config.textures.map((texture, index) => {
            const isActive = getAllUsedTextures.has(texture.src);

            // Lấy thông tin về components sử dụng texture
            const entierInfo: EntierInfo = countComponentsUsingTextureForEntier(
              texture.src
            );

            return (
              <div key={index} className="position-relative">
                <button
                  onClick={() =>
                    updateEntireWardrobe(texture.name, texture.src)
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
                      {entierInfo.count > 9 ? "9+" : entierInfo.count || "✓"}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
      </div>

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
