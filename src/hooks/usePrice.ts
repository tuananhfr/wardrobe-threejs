import { useEffect } from "react";
import { useConfig } from "@/components/context/WardrobeContext";

export const usePrice = () => {
  const { config, batchUpdate } = useConfig();
  const WOOD_PANEL_PRICE_PER_M2 = 200;
  const BASE_BAR_WIDTH_PRICE = 12;

  // Hàm tính giá chân kệ dựa trên các section
  const calculateFeetPrice = () => {
    const { wardrobeType } = config;

    let totalPrice = 0;

    // Tính giá cho từng section
    Object.entries(wardrobeType.sections).forEach(([, section]) => {
      if (section) {
        // Công thức mới: width * BASE_BAR_WIDTH_PRICE
        const sectionPrice = (section.width / 100) * BASE_BAR_WIDTH_PRICE;
        totalPrice += sectionPrice;
      }
    });

    return totalPrice;
  };

  // Hàm tính giá khung: khung dọc, khung ngang (sol, plafond), backPanel
  const calculateFramePrice = () => {
    const { wardrobeType, thickness, height, baseBarHeight } = config;

    // Khung dọc: tính area theo type
    const { sectionA, sectionB, sectionC } = wardrobeType.sections;
    const effectiveHeight = Math.max(0, height - baseBarHeight);

    const verticalAreaForSection = (
      section: WardrobeSection | undefined,
      multiplier: number
    ) => {
      if (!section || multiplier <= 0) return 0;
      return multiplier * effectiveHeight * section.depth; // cm^2
    };

    let verticalAreaCm2 = 0;
    switch (wardrobeType.id) {
      case "Linéaire":
        verticalAreaCm2 = verticalAreaForSection(sectionA, 2);
        break;
      case "Angle":
        verticalAreaCm2 =
          verticalAreaForSection(sectionA, 2) +
          verticalAreaForSection(sectionB, 1);
        break;
      case "Forme U":
        verticalAreaCm2 =
          verticalAreaForSection(sectionA, 2) +
          verticalAreaForSection(sectionB, 1) +
          verticalAreaForSection(sectionC, 1);
        break;
      default:
        verticalAreaCm2 = 0;
    }

    const verticalSidePrice =
      (verticalAreaCm2 / 10000) * WOOD_PANEL_PRICE_PER_M2;

    // Panel dọc giữa các cột (nếu section có > 1 cột)
    const effectiveBackHeightForPanels = Math.max(
      0,
      height - baseBarHeight - 2 * thickness
    );
    const panelsBetweenColumnsAreaForSection = (section?: WardrobeSection) => {
      if (!section) return 0;
      const count = Math.max(0, (section.columns?.length || 0) - 1);
      if (count === 0) return 0;
      const panelWidthCm = Math.max(0, section.depth - 2 * thickness);
      return count * effectiveBackHeightForPanels * panelWidthCm; // cm^2
    };

    const verticalPanelsAreaCm2 =
      panelsBetweenColumnsAreaForSection(sectionA) +
      panelsBetweenColumnsAreaForSection(sectionB) +
      panelsBetweenColumnsAreaForSection(sectionC);

    const verticalPanelsPrice =
      (verticalPanelsAreaCm2 / 10000) * WOOD_PANEL_PRICE_PER_M2;

    const verticalFramePrice = verticalSidePrice + verticalPanelsPrice;

    // BackPanel: (height - baseBarHeight - 2*thickness) * (width - k*thickness)
    const effectiveBackHeight = Math.max(
      0,
      height - baseBarHeight - 2 * thickness
    );
    const backPanelAreaForSection = (
      section: WardrobeSection | undefined,
      subtractWidthThicknessCount: number
    ) => {
      if (!section) return 0;
      const effectiveBackWidth = Math.max(
        0,
        section.width - subtractWidthThicknessCount * thickness
      );
      return effectiveBackHeight * effectiveBackWidth; // cm^2
    };

    let backPanelAreaCm2 = 0;
    switch (wardrobeType.id) {
      case "Linéaire":
        backPanelAreaCm2 = backPanelAreaForSection(sectionA, 2);
        break;
      case "Angle":
        backPanelAreaCm2 =
          backPanelAreaForSection(sectionA, 2) +
          backPanelAreaForSection(sectionB, 1);
        break;
      case "Forme U":
        backPanelAreaCm2 =
          backPanelAreaForSection(sectionA, 2) +
          backPanelAreaForSection(sectionB, 1) +
          backPanelAreaForSection(sectionC, 1);
        break;
      default:
        backPanelAreaCm2 = 0;
    }

    const backPanelPrice = (backPanelAreaCm2 / 10000) * WOOD_PANEL_PRICE_PER_M2;

    // Helper: tính area (cm^2) cho 1 section với phần trừ thickness theo quy tắc
    const sectionAreaCm2 = (
      section: WardrobeSection | undefined,
      subtractThicknessCount: number
    ) => {
      if (!section) return 0;
      const effectiveWidth = Math.max(
        0,
        section.width - subtractThicknessCount * thickness
      );
      // width, depth đang là cm → area cm^2
      return effectiveWidth * section.depth;
    };

    // Tính area cho SOL (plafond giống sol → x2)
    let solAreaCm2 = 0;
    switch (wardrobeType.id) {
      case "Linéaire":
        solAreaCm2 = sectionAreaCm2(sectionA, 2);
        break;
      case "Angle":
        solAreaCm2 = sectionAreaCm2(sectionA, 2) + sectionAreaCm2(sectionB, 1);
        break;
      case "Forme U":
        solAreaCm2 =
          sectionAreaCm2(sectionA, 2) +
          sectionAreaCm2(sectionB, 1) +
          sectionAreaCm2(sectionC, 1);
        break;
      default:
        solAreaCm2 = 0;
    }

    // Convert cm^2 → m^2 và tính giá cho sol + plafond (x2)
    const solAreaM2 = solAreaCm2 / 10000;
    const horizontalFramePrice = 2 * solAreaM2 * WOOD_PANEL_PRICE_PER_M2;

    const total = verticalFramePrice + horizontalFramePrice + backPanelPrice;

    return {
      total,
      verticalFramePrice,
      horizontalFramePrice,
      backPanelPrice,
    };
  };

  // Hàm cập nhật giá
  const updatePrice = () => {
    const feet = calculateFeetPrice();
    const frame = calculateFramePrice();
    const calculatedPrice = feet + frame.total;
    const finalPrice = Math.round(calculatedPrice * 100) / 100;
    const originalPrice = finalPrice * 1.2; // originalPrice = 1.2 × price

    // Log breakdown
    try {
      // Nhóm log cho dễ đọc trên console
      console.groupCollapsed("Price breakdown");
      console.log("feetPrice:", feet);
      // Log số lượng panel dọc của mỗi section (chỉ tính khi > 1 cột)
      try {
        const sections = config.wardrobeType.sections;
        const countPanels = (section?: WardrobeSection) =>
          !section ? 0 : Math.max(0, (section.columns?.length || 0) - 1);
        const verticalPanels = {
          sectionA: countPanels(sections.sectionA),
          sectionB: countPanels(sections.sectionB),
          sectionC: countPanels(sections.sectionC),
        };
        console.groupCollapsed("vertical panels by section");
        console.log(verticalPanels);
        console.groupEnd();
      } catch {}
      console.groupCollapsed("framePrice");
      console.log(
        "vertical (sides + panels between columns):",
        frame.verticalFramePrice
      );
      console.log("horizontal (sol + plafond):", frame.horizontalFramePrice);
      console.log("backPanel:", frame.backPanelPrice);
      console.log("total:", frame.total);
      console.groupEnd();
      console.log("finalPrice:", finalPrice, "originalPrice:", originalPrice);
      console.groupEnd();
    } catch {}

    // Chỉ cập nhật nếu giá thay đổi
    if (Math.abs(finalPrice - config.price) > 0.01) {
      batchUpdate({
        price: finalPrice,
        originalPrice: originalPrice,
      });
    }
  };

  // Extract dependencies and ensure they're always defined with fallback values
  const wardrobeType = config.wardrobeType;
  const thickness = config.thickness ?? 0;
  const height = config.height ?? 0;
  const baseBarHeight = config.baseBarHeight ?? 0;

  // Effect để cập nhật giá khi có thay đổi
  useEffect(() => {
    updatePrice();
  }, [wardrobeType, thickness, height, baseBarHeight]);

  // Return các giá trị và hàm hữu ích
  return {
    price: config.price,
    originalPrice: config.originalPrice,

    // Chi tiết giá chân kệ
    feetPrice: calculateFeetPrice(),

    // Chi tiết giá khung
    framePrice: calculateFramePrice(),

    // Discount percentage
    discountPercentage: config.originalPrice
      ? Math.round((1 - (config.price || 0) / config.originalPrice) * 100)
      : 0,

    // Hàm thủ công để force update
    forceUpdatePrice: updatePrice,
  };
};
