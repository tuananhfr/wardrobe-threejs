import { useEffect } from "react";
import { useConfig } from "@/components/context/WardrobeContext";

export const usePrice = () => {
  const { config, batchUpdate } = useConfig();
  const WOOD_PANEL_PRICE_PER_M2 = 200;
  const BASE_BAR_WIDTH_PRICE = 12;

  // LED pricing constants
  const LED_STRIP_PRICE_PER_METER = 120; // 120€/m (100cm)
  const LED_CONVERTISSEUR_PRICE = 40; // 40€ cho 1 convertisseur

  // Internal Equipment pricing constants
  const EQUIPMENT_VIDE_PRICE = 0; // 0€
  const EQUIPMENT_TRIGLE_PRICE = 30; // 30€
  const EQUIPMENT_PENDERIE_ESCAMOTABLE_PRICE = 120; // 120€
  const EQUIPMENT_DOUBLE_RAIL_PRICE = 150; // 150€ (30€ + 120€)

  // Tiroir internal pricing constants
  const TIROIR_WIDTH_45_PRICE = 150; // <45cm = 150€
  const TIROIR_WIDTH_65_PRICE = 190; // <65cm = 190€
  const TIROIR_WIDTH_95_PRICE = 210; // <95cm = 210€
  const TIROIR_WIDTH_OVER_95_PRICE = 230; // >95cm = 230€

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

  // Hàm tính giá kệ (shelves)
  const calculateShelvesPrice = () => {
    const { wardrobeType, thickness } = config;
    let totalShelvesPrice = 0;

    // Helper: xác định cột góc (giống logic trong SectionShelves)
    const getCornerConfiguration = (
      sectionName: string,
      columnIndex: number,
      totalColumns: number
    ) => {
      const { id } = wardrobeType;
      const isFirst = columnIndex === 0;
      const isLast = columnIndex === totalColumns - 1;

      if (id === "Angle" && sectionName === "sectionB" && isFirst) {
        return true;
      }
      if (id === "Forme U" && sectionName === "sectionB" && isLast) {
        return true;
      }
      if (id === "Forme U" && sectionName === "sectionC" && isFirst) {
        return true;
      }
      return false;
    };

    // Tính giá kệ cho từng section
    Object.entries(wardrobeType.sections).forEach(([sectionName, section]) => {
      if (!section || !section.columns) return;

      section.columns.forEach((column, columnIndex) => {
        if (!column.shelves?.spacings) return;

        // Tính width theo logic SectionShelves
        const isCorner = getCornerConfiguration(
          sectionName,
          columnIndex,
          section.columns.length
        );
        const shelfWidth = column.width + (isCorner ? 2 * thickness : 0);

        // Tính depth: section.depth - 2*thickness
        const shelfDepth = section.depth - 2 * thickness;

        // Tính diện tích kệ: width * depth
        const shelfArea = shelfWidth * shelfDepth;

        // Tính giá kệ: diện tích * giá gỗ/m²
        const shelfPrice = (shelfArea / 10000) * WOOD_PANEL_PRICE_PER_M2;

        // Nhân với số lượng kệ trong cột này
        const shelfCount = column.shelves.spacings.length - 1; // Trừ đi spacing cuối (đến plafond)
        totalShelvesPrice += shelfPrice * shelfCount;
      });
    });

    return totalShelvesPrice;
  };

  // Hàm tính giá LED
  const calculateLEDPrice = () => {
    const { wardrobeType, height, baseBarHeight } = config;

    // Chỉ tính giá nếu có LED
    if (!config.ledColor || config.ledColor === "") {
      return { total: 0, stripsPrice: 0, convertisseurPrice: 0 };
    }

    let totalLedLength = 0; // Tổng chiều dài LED (cm)
    let totalLedStrips = 0; // Tổng số LED strips

    // Tính tổng chiều dài LED cho tất cả section
    Object.entries(wardrobeType.sections).forEach(([, section]) => {
      if (!section || !section.columns) return;

      // LED ở cột ngăn (giữa các cột)
      const columnLedCount =
        section.columns.length > 1 ? (section.columns.length - 1) * 2 : 0;

      // LED ở cạnh trái và phải khung tủ (SectionFrame)
      const frameLedCount = 2; // Luôn có 2 LED (trái + phải)

      // Tổng số LED strips cho section này
      const sectionLedStrips = columnLedCount + frameLedCount;
      totalLedStrips += sectionLedStrips;

      // Chiều cao LED (trừ 10cm khoảng cách an toàn)
      const ledHeight = Math.max(0, height - baseBarHeight - 10);

      // Tổng chiều dài LED cho section này
      const sectionLedLength = sectionLedStrips * ledHeight;
      totalLedLength += sectionLedLength;
    });

    // Tính giá LED strips: 120€/m (100cm)
    const stripsPrice = (totalLedLength / 100) * LED_STRIP_PRICE_PER_METER;

    // Giá Convertisseur: 40€ (chỉ cần 1 cái)
    const convertisseurPrice = LED_CONVERTISSEUR_PRICE;

    const total = stripsPrice + convertisseurPrice;

    return {
      total,
      stripsPrice,
      convertisseurPrice,
      totalLedLength,
      totalLedStrips,
    };
  };

  // Hàm tính giá thiết bị nội thất
  const calculateInternalEquipmentPrice = () => {
    let totalEquipmentPrice = 0;
    let equipmentCount = 0;

    Object.entries(config.internalEquipmentConfig || {}).forEach(
      ([, equipmentVal]) => {
        let price = 0;

        if (typeof equipmentVal === "string") {
          // Equipment type là string
          switch (equipmentVal) {
            case "vide":
              price = EQUIPMENT_VIDE_PRICE;
              break;
            case "trigle":
              price = EQUIPMENT_TRIGLE_PRICE;
              break;
            case "penderieEscamotable":
              price = EQUIPMENT_PENDERIE_ESCAMOTABLE_PRICE;
              break;
            case "doubleRail":
              price = EQUIPMENT_DOUBLE_RAIL_PRICE;
              break;
            default:
              price = 0;
          }
        } else if (
          typeof equipmentVal === "object" &&
          equipmentVal?.type === "tiroirInterieur"
        ) {
          // Tiroir internal: tính giá theo width của từng tiroir
          equipmentVal.items.forEach((tiroir) => {
            const width = tiroir.width;
            if (width < 45) {
              price += TIROIR_WIDTH_45_PRICE;
            } else if (width < 65) {
              price += TIROIR_WIDTH_65_PRICE;
            } else if (width < 95) {
              price += TIROIR_WIDTH_95_PRICE;
            } else {
              // Width >= 95cm
              price += TIROIR_WIDTH_OVER_95_PRICE;
            }
          });
        }

        totalEquipmentPrice += price;
        if (price > 0) equipmentCount++;
      }
    );

    return {
      total: totalEquipmentPrice,
      equipmentCount,
      totalSpacings: Object.keys(config.internalEquipmentConfig || {}).length,
    };
  };

  // Hàm cập nhật giá
  const updatePrice = () => {
    const feet = calculateFeetPrice();
    const frame = calculateFramePrice();
    const shelves = calculateShelvesPrice();
    const led = calculateLEDPrice();
    const internalEquipment = calculateInternalEquipmentPrice();
    const calculatedPrice =
      feet + frame.total + shelves + led.total + internalEquipment.total;
    const finalPrice = Math.round(calculatedPrice * 100) / 100;
    const originalPrice = finalPrice * 1.2; // originalPrice = 1.2 × price

    // Không còn logging - chỉ cập nhật giá

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
  }, [
    wardrobeType,
    thickness,
    height,
    baseBarHeight,
    config.ledColor,
    config.internalEquipmentConfig,
  ]);

  // Return các giá trị và hàm hữu ích
  return {
    price: config.price,
    originalPrice: config.originalPrice,

    // Chi tiết giá chân kệ
    feetPrice: calculateFeetPrice(),

    // Chi tiết giá khung
    framePrice: calculateFramePrice(),

    // Chi tiết giá kệ
    shelvesPrice: calculateShelvesPrice(),

    // Chi tiết giá LED
    ledPrice: calculateLEDPrice(),

    // Chi tiết giá thiết bị nội thất
    internalEquipmentPrice: calculateInternalEquipmentPrice(),

    // Discount percentage
    discountPercentage: config.originalPrice
      ? Math.round((1 - (config.price || 0) / config.originalPrice) * 100)
      : 0,

    // Hàm thủ công để force update
    forceUpdatePrice: updatePrice,
  };
};
