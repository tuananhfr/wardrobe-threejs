import React, { useState } from "react";
import { useConfig } from "@/components/context/WardrobeContext";

const LEDColorSelector: React.FC = () => {
  const { config, updateConfig } = useConfig();
  const [hoveredLED, setHoveredLED] = useState<{
    name: string;
    src: string;
    x: number;
    y: number;
  } | null>(null);

  const ledColors = [
    {
      name: "Sans LED",
      value: "",
      image: "/src/assets/images/led/PanneauSansLED.webp",
    },
    {
      name: "LED Forme I - Blanc naturel",
      value: "#ffffff",
      image: "/src/assets/images/led/CordonLarge-BlancNaturelle.webp",
    },
    {
      name: "LED Forme I - Blanc chaud",
      value: "0xFBE0DF",
      image: "/src/assets/images/led/CordonLarge-BlancChaud.webp",
    },
  ];

  const handleColorChange = (colorValue: string) => {
    updateConfig("ledColor", colorValue);
  };

  // Hàm xử lý mouse enter để hiển thị tooltip
  const handleMouseEnter = (
    event: React.MouseEvent,
    led: { name: string; image: string }
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredLED({
      name: led.name,
      src: led.image,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  // Hàm xử lý mouse leave để ẩn tooltip
  const handleMouseLeave = () => {
    setHoveredLED(null);
  };

  return (
    <div className="led-color-selector mt-3">
      {/* Danh sách LED colors */}
      <div className="d-flex flex-wrap">
        {ledColors.map((led, index) => {
          const isActive = config.ledColor === led.value;

          return (
            <div key={index} className="position-relative">
              <button
                onClick={() => handleColorChange(led.value)}
                onMouseEnter={(e) => handleMouseEnter(e, led)}
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
                  boxShadow: isActive ? "0 0 8px rgba(0,123,255,0.3)" : "none",
                }}
                title={led.name}
              >
                <img
                  src={led.image}
                  alt={led.name}
                  className="rounded-1"
                  style={{
                    width: 32,
                    height: 32,
                    objectFit: "cover",
                    opacity: isActive ? 1 : 0.8,
                  }}
                />

                {/* Hiển thị indicator khi LED đang được sử dụng */}
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
                    ✓
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Tooltip khi hover */}
      {hoveredLED && (
        <div
          className="position-fixed bg-dark text-white p-2 rounded shadow-lg"
          style={{
            left: hoveredLED.x - 150,
            top: hoveredLED.y - 250,
            zIndex: 9999,
            pointerEvents: "none",
            minWidth: "300px",
          }}
        >
          <div className="text-center">
            <img
              src={hoveredLED.src}
              alt={hoveredLED.name}
              className="rounded mb-2"
              style={{
                width: "100%",
                height: 200,
                objectFit: "cover",
              }}
            />
            <div className="small fw-bold">{hoveredLED.name}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LEDColorSelector;
