// src/constants/wardrobeTypes.ts

export const wardrobeTypeList: WardrobeTypeTemplate[] = [
  {
    value: "straight",
    label: "Tủ thẳng",
    description: "Tủ hình chữ nhật cơ bản",
    icon: "/images/wardrobe-straight.png",
    sections: {
      sectionA: { width: 120, height: 200, depth: 60 },
    },
    defaultShelves: 4,
    defaultDoorType: "swing",
  },
  {
    value: "L-shaped",
    label: "Tủ chữ L",
    description: "Tủ góc hình chữ L",
    icon: "/images/wardrobe-l-shaped.png",
    sections: {
      sectionA: { width: 120, height: 200, depth: 60 },
      sectionB: { width: 80, height: 200, depth: 60 },
    },
    defaultShelves: 5,
    defaultDoorType: "sliding",
  },
  {
    value: "U-shaped",
    label: "Tủ chữ U",
    description: "Tủ bao quanh hình chữ U",
    icon: "/images/wardrobe-u-shaped.png",
    sections: {
      sectionA: { width: 120, height: 200, depth: 60 },
      sectionB: { width: 80, height: 200, depth: 60 },
      sectionC: { width: 80, height: 200, depth: 60 },
    },
    defaultShelves: 6,
    defaultDoorType: "sliding",
  },
];

// Helper function
export const getWardrobeTypeTemplate = (type: WardrobeType) => {
  return wardrobeTypeList.find((template) => template.value === type);
};
