import { useConfig } from "@/components/context/WardrobeContext";
import React, { useState, useRef } from "react";

const WardrobeTypeSelector: React.FC = () => {
  const { config, updateConfig } = useConfig();
  const [hoveredWardrobeType, setHoveredWardrobeType] = useState<{
    name: string;
    images: string;
    x: number;
    y: number;
  } | null>(null);
  const hasInitializedRef = useRef(false);

  // Get current selected wardrobe type from config
  const selectedWardrobeType = config.wardrobeType;

  const handleWardrobeTypeSelect = (wardrobeType: WardrobeType) => {
    // Only reset if actually changing to a different wardrobe type AND not on first mount
    if (
      wardrobeType.id !== config.wardrobeType.id &&
      hasInitializedRef.current
    ) {
      // Reset facades when changing wardrobe type
      updateConfig("doorsDrawersConfig", {});
      updateConfig("groupedDoorsConfig", {});
      updateConfig("internalEquipmentConfig", {});
      updateConfig("selectedColumnId", null);
      updateConfig("selectedSpacingId", null);
      updateConfig("selectedDoorsDrawersType", null);
      updateConfig("selectedInternalEquipmentType", null);
      updateConfig("hoveredColumnId", null);
      updateConfig("hoveredSpacingId", null);
    }

    // Update config context
    updateConfig("wardrobeType", wardrobeType);
  };

  // Hàm xử lý mouse enter để hiển thị tooltip
  const handleMouseEnter = (
    event: React.MouseEvent,
    wardrobeType: { name: string; images: string }
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredWardrobeType({
      name: wardrobeType.name,
      images: wardrobeType.images,
      x: rect.left + rect.width / 2 + 50,
      y: rect.bottom + 30,
    });
  };

  // Hàm xử lý mouse leave để ẩn tooltip
  const handleMouseLeave = () => {
    setHoveredWardrobeType(null);
  };

  // Kiểm tra wardrobe type có đang được chọn không
  const isWardrobeTypeActive = (wardrobeTypeId: WardrobeId) => {
    return selectedWardrobeType.id === wardrobeTypeId;
  };

  return (
    <div className="wardrobe-type-selector">
      <div className="mt-3">
        <div className="d-flex flex-wrap">
          {config.wardrobeTypeListTemplate.length > 0 &&
            config.wardrobeTypeListTemplate.map((wardrobeType, index) => {
              const isActive = isWardrobeTypeActive(wardrobeType.id);

              return (
                <div key={index} className="position-relative">
                  <button
                    onClick={() => handleWardrobeTypeSelect(wardrobeType)}
                    onMouseEnter={(e) => handleMouseEnter(e, wardrobeType)}
                    onMouseLeave={handleMouseLeave}
                    className={`btn p-0 m-1 border rounded-2 position-relative ${
                      isActive
                        ? "border-primary border-3"
                        : "border-secondary border-1"
                    }`}
                    style={{
                      width: 120,
                      height: 120,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#fff",
                      boxShadow: isActive
                        ? "0 0 8px rgba(0,123,255,0.3)"
                        : "none",
                    }}
                    title={wardrobeType.name}
                  >
                    <img
                      src={wardrobeType.images}
                      alt={wardrobeType.name}
                      className="rounded-1"
                      style={{
                        width: 100,
                        height: 100,
                        objectFit: "cover",
                        opacity: isActive ? 1 : 0.8,
                      }}
                    />

                    {/* Active indicator */}
                    {isActive && (
                      <div
                        className="position-absolute top-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: 20,
                          height: 20,
                          fontSize: 12,
                          transform: "translate(25%, -25%)",
                        }}
                      >
                        ✓
                      </div>
                    )}
                  </button>

                  {/* Label below image */}
                  <div className="text-center mt-1">
                    <small
                      className={`${
                        isActive ? "text-primary fw-bold" : "text-muted"
                      }`}
                      style={{ fontSize: "10px" }}
                    >
                      {wardrobeType.name}
                    </small>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Hover Tooltip - hiển thị bên dưới */}
      {hoveredWardrobeType && (
        <div
          className="position-fixed bg-dark text-white p-2 rounded shadow-lg"
          style={{
            left: hoveredWardrobeType.x - 150,
            top: hoveredWardrobeType.y,
            zIndex: 9999,
            pointerEvents: "none",
            minWidth: "300px",
          }}
        >
          <div className="text-center">
            <img
              src={hoveredWardrobeType.images}
              alt={hoveredWardrobeType.name}
              className="rounded mb-2"
              style={{
                width: "100%",
                height: 200,
                objectFit: "cover",
              }}
            />
            <div className="small fw-bold">{hoveredWardrobeType.name}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardrobeTypeSelector;
