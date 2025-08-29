import { useEffect } from "react";
import { useConfig } from "@/components/context/WardrobeContext";

export const usePrice = () => {
  const { config, batchUpdate } = useConfig();
  const WOOD_PANEL_PRICE_PER_M2 = 100;

  // Hàm tính giá chân kệ dựa trên các section
  const calculateFeetPrice = () => {
    const { baseBarHeight, wardrobeType } = config;

    let totalPrice = 0;

    // Tính giá cho từng section
    Object.entries(wardrobeType.sections).forEach(([, section]) => {
      if (section) {
        // Công thức: width * depth * (WOOD_PANEL_PRICE_PER_M2/2) * baseBarHeight
        const sectionPrice =
          (section.width / 100) * // width từ cm sang m
          (section.depth / 100) * // depth từ cm sang m
          (WOOD_PANEL_PRICE_PER_M2 / 2) * // giá gỗ / 2
          baseBarHeight; // baseBarHeight

        totalPrice += sectionPrice;
      }
    });

    return totalPrice;
  };

  // Hàm cập nhật giá
  const updatePrice = () => {
    const calculatedPrice = calculateFeetPrice();
    const finalPrice = Math.round(calculatedPrice * 100) / 100;
    const originalPrice = finalPrice * 1.2; // originalPrice = 1.2 × price

    // Chỉ cập nhật nếu giá thay đổi
    if (Math.abs(finalPrice - config.price) > 0.01) {
      batchUpdate({
        price: finalPrice,
        originalPrice: originalPrice,
      });
    }
  };

  // Effect để cập nhật giá khi có thay đổi
  useEffect(() => {
    updatePrice();
  }, [config.baseBarHeight, config.wardrobeType]);

  // Return các giá trị và hàm hữu ích
  return {
    price: config.price,
    originalPrice: config.originalPrice,

    // Chi tiết giá chân kệ
    feetPrice: calculateFeetPrice(),

    // Discount percentage
    discountPercentage: config.originalPrice
      ? Math.round((1 - (config.price || 0) / config.originalPrice) * 100)
      : 0,

    // Hàm thủ công để force update
    forceUpdatePrice: updatePrice,
  };
};
