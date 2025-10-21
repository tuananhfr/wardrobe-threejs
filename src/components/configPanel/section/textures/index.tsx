import React from "react";
import { useConfig } from "@/context/WardrobeContext";

interface MainSelectorProps {
  activeOption: string;
}

const MainSelector: React.FC<MainSelectorProps> = ({ activeOption }) => {
  const { updateConfig, batchUpdate, config } = useConfig();

  const options = [
    { id: "entier", name: "Entière" },

    { id: "tablette", name: "Tablettes" },
    { id: "facades", name: "Facades" },
    { id: "led", name: "LED" },
  ];

  // Đếm tổng số kệ (tablettes) trong toàn bộ tủ
  const getAllShelvesCount = (): number => {
    let totalCount = 0;

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

  // Đếm tổng số facade hợp lệ trong tủ (loại trừ verre/mirror)
  const getAllFacadesCount = (): number => {
    let totalCount = 0;

    const excludedTypes = [
      "leftDoorVerre",
      "rightDoorVerre",
      "drawerVerre",
      "doubleSwingDoorVerre",
      "slidingMirrorDoor",
      "slidingGlassDoor",
    ];

    Object.entries(config.doorsDrawersConfig).forEach(([, doorType]) => {
      if (doorType && !excludedTypes.includes(doorType as string)) {
        totalCount += 1;
      }
    });

    return totalCount;
  };

  const totalShelves = getAllShelvesCount();
  const totalFacades = getAllFacadesCount();

  const filteredOptions = options.filter((opt) => {
    if (opt.id === "tablette") return totalShelves > 0;
    if (opt.id === "facades") return totalFacades > 0;
    return true;
  });

  const handleOptionChange = (optionId: string) => {
    if (optionId === "led") {
      // Khi chọn "LED", hiển thị LED color selector
      updateConfig("activeView", "led");
    } else if (optionId === "tablette") {
      // Khi chọn "Tablettes", reset selectedSpacingIds và hoveredSpacingId
      batchUpdate({
        activeView: "tablette",
        selectedFacadeSpacingIds: [],
        selectedDoorsDrawersSpacingIds: [],
        selectedInternalEquipmentSpacingId: null,
        hoveredFacadeSpacingId: null,
        hoveredDoorsDrawersSpacingId: null,
        hoveredInternalEquipmentSpacingId: null,
      });
    } else if (optionId === "facades") {
      // Khi chọn "Facades", reset selectedSpacingIds và hoveredSpacingId
      batchUpdate({
        activeView: "facades",
        selectedShelvesSpacingIds: [],
        selectedDoorsDrawersSpacingIds: [],
        selectedInternalEquipmentSpacingId: null,
        hoveredShelvesSpacingId: null,
        hoveredDoorsDrawersSpacingId: null,
        hoveredInternalEquipmentSpacingId: null,
      });
    } else {
      // Khi chuyển sang chế độ khác từ tablette hoặc facades, reset các state liên quan
      if (config.activeView === "tablette" || config.activeView === "facades") {
        batchUpdate({
          activeView: optionId,
          selectedFacadeSpacingIds: [],
          selectedShelvesSpacingIds: [],
          selectedDoorsDrawersSpacingIds: [],
          selectedInternalEquipmentSpacingId: null,
          hoveredFacadeSpacingId: null,
          hoveredShelvesSpacingId: null,
          hoveredDoorsDrawersSpacingId: null,
          hoveredInternalEquipmentSpacingId: null,
        });
      } else {
        // Các option khác hoạt động bình thường
        updateConfig("activeView", optionId);
      }
    }
  };

  return (
    <div className="d-flex flex-wrap mb-3 mt-3 pb-3 border-bottom">
      {filteredOptions.map((option) => (
        <button
          key={option.id}
          className={`btn ${
            activeOption === option.id
              ? "btn-secondary"
              : "btn-outline-secondary"
          } rounded-pill me-2 mb-2`}
          onClick={() => handleOptionChange(option.id)}
        >
          {option.name}
        </button>
      ))}
    </div>
  );
};

export default MainSelector;
