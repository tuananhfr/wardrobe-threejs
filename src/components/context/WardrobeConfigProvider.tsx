// src/context/WardrobeConfigProvider.tsx
import { ReactNode, useState } from "react";
import { WardrobeContext } from "./WardrobeContext"; // Import đúng context

import oakTexture from "@/assets/images/samples-oak-wood-effect-800x800.jpg";
import walnutTexture from "@/assets/images/samples-walnut-wood-effect-800x800.jpg";
import wengeTexture from "@/assets/images/samples-wenge-wood-effect-800x800.jpg";
import whiteTexture from "@/assets/images/white_u11209.jpg";
import lightGreyTexture from "@/assets/images/light_grey_u12044.jpg";
import taupeTexture from "@/assets/images/taupe_u15133.jpg";
interface WardrobeConfigProviderProps {
  // Sửa tên interface
  children: ReactNode;
}

const WardrobeConfigProvider = ({ children }: WardrobeConfigProviderProps) => {
  const textures = [
    { name: "Oak", src: oakTexture },
    { name: "Walnut", src: walnutTexture },
    { name: "Wenge", src: wengeTexture },
    { name: "White", src: whiteTexture },
    { name: "Light Grey", src: lightGreyTexture },
    { name: "Taupe", src: taupeTexture },
  ];

  // Định nghĩa kiểu dữ liệu cho cấu hình tủ quần áo
  const [config, setConfig] = useState<WardrobeState>({
    width: 120,
    height: 120,
    depth: 30,
    thickness: 2,
    price: 0,
    originalPrice: 0,
    texture: textures[0],
    textures: textures,
    showMeasurements: false,
  });

  // Hàm cập nhật cấu hình
  const updateConfig = <K extends keyof WardrobeState>(
    key: K,
    value: WardrobeState[K]
  ) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      [key]: value,
    }));
  };

  // Hàm cập nhật nhiều thuộc tính cùng lúc
  const batchUpdate = (updates: Partial<WardrobeState>) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      ...updates,
    }));
  };

  return (
    <WardrobeContext.Provider value={{ config, updateConfig, batchUpdate }}>
      {children}
    </WardrobeContext.Provider>
  );
};

export default WardrobeConfigProvider;
