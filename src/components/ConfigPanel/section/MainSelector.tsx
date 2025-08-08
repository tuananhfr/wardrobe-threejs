import React from "react";
import { useConfig } from "@/components/context/WardrobeContext";

interface MainSelectorProps {
  activeOption: string;
  onChange: (option: string) => void;
}

const MainSelector: React.FC<MainSelectorProps> = ({
  activeOption,
  onChange,
}) => {
  const { updateConfig } = useConfig();

  const options = [
    { id: "entier", name: "Entière" },
    { id: "test", name: "Test" },
    { id: "led", name: "LED" },
  ];

  const handleOptionChange = (optionId: string) => {
    if (optionId === "led") {
      // Khi chọn "LED", hiển thị LED color selector
      updateConfig("activeView", "led");
    } else {
      // Các option khác hoạt động bình thường
      onChange(optionId);
    }
  };

  return (
    <div className="d-flex flex-wrap mb-3 mt-3 pb-3 border-bottom">
      {options.map((option) => (
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
