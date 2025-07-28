// Interface
interface WardrobeColumn {
  id: string;
  width: number;
}

interface WardrobeSection {
  width: number;
  depth: number;
  columns: WardrobeColumn[]; // Thay đổi từ number thành array
  minColumns: number;
  maxColumns: number;
  // Xóa defaultColumnWidth
}

// Updated data
import lineaire from "@/assets/images/wardrobeTypes/LINEAIRE_2.jpg";
import LShape from "@/assets/images/wardrobeTypes/FORME_L_2.jpg";
import UShape from "@/assets/images/wardrobeTypes/FORME_U_2.jpg";

export const wardrobeTypeList: WardrobeType[] = [
  {
    id: "Linéaire",
    name: "Linéaire",
    images: lineaire,
    sections: {
      sectionA: {
        width: 60,
        depth: 60,
        minColumns: 1,
        maxColumns: 1,
        columns: [{ id: "sectionA-col-1", width: 58 }],
      },
    },
  },
  {
    id: "Angle",
    name: "Angle",
    images: LShape,
    sections: {
      sectionA: {
        width: 160,
        depth: 60,
        minColumns: 1,
        maxColumns: 8,
        columns: [
          { id: "sectionA-col-1", width: 37 },
          { id: "sectionA-col-2", width: 37 },
          { id: "sectionA-col-3", width: 37 },
          { id: "sectionA-col-4", width: 37 },
        ],
      },
      sectionB: {
        width: 160,
        depth: 60,
        minColumns: 1,
        maxColumns: 8,
        columns: [
          { id: "sectionB-col-1", width: 37 },
          { id: "sectionB-col-2", width: 37 },
          { id: "sectionB-col-3", width: 37 },
          { id: "sectionB-col-4", width: 37 },
        ],
      },
    },
  },
  {
    id: "Forme U",
    name: "Forme U",
    images: UShape,
    sections: {
      sectionA: {
        width: 260,
        depth: 60,
        minColumns: 1,
        maxColumns: 13,
        columns: [
          { id: "sectionA-col-1", width: 62 },
          { id: "sectionA-col-2", width: 62 },
          { id: "sectionA-col-3", width: 62 },
          { id: "sectionA-col-4", width: 62 },
        ],
      },
      sectionB: {
        width: 160,
        depth: 60,
        minColumns: 1,
        maxColumns: 8,
        columns: [
          { id: "sectionB-col-1", width: 37 },
          { id: "sectionB-col-2", width: 37 },
          { id: "sectionB-col-3", width: 37 },
          { id: "sectionB-col-4", width: 37 },
        ],
      },
      sectionC: {
        width: 160,
        depth: 60,
        minColumns: 1,
        maxColumns: 8,
        columns: [
          { id: "sectionC-col-1", width: 37 },
          { id: "sectionC-col-2", width: 37 },
          { id: "sectionC-col-3", width: 37 },
          { id: "sectionC-col-4", width: 37 },
        ],
      },
    },
  },
];

// Helper functions
export const getWardrobeType = (type: WardrobeId) => {
  return wardrobeTypeList.find((template) => template.id === type);
};

// Thêm column vào section
export const addColumnToSection = (
  section: WardrobeSection
): WardrobeSection => {
  // Tạo ID dựa trên số thứ tự
  const nextColumnNumber = section.columns.length + 1;
  const newColumnId = `col-${nextColumnNumber}`;
  // Tính toán defaultColumnWidth dựa trên space còn lại
  const calculatedWidth = calculateDefaultColumnWidth(section, 2); // thickness = 2
  const newColumn: WardrobeColumn = {
    id: newColumnId,
    width: calculatedWidth,
  };

  return {
    ...section,
    columns: [...section.columns, newColumn],
  };
};

// Helper để tính defaultColumnWidth
export const calculateDefaultColumnWidth = (
  section: WardrobeSection,
  thickness: number
): number => {
  const currentColumnsCount = section.columns.length;
  const newColumnsCount = currentColumnsCount + 1;
  const availableWidth = section.width - (newColumnsCount + 1) * thickness;
  return Math.floor(availableWidth / newColumnsCount);
};

// Xóa column khỏi section
export const removeColumnFromSection = (
  section: WardrobeSection,
  columnId: string
): WardrobeSection => ({
  ...section,
  columns: section.columns.filter((col) => col.id !== columnId),
});

// Update width của 1 column
export const updateColumnWidth = (
  section: WardrobeSection,
  columnId: string,
  width: number
): WardrobeSection => ({
  ...section,
  columns: section.columns.map((col) =>
    col.id === columnId ? { ...col, width } : col
  ),
});

// Tính tổng width của tất cả columns
export const calculateTotalColumnsWidth = (
  columns: WardrobeColumn[],
  thickness: number
): number => {
  const columnsWidth = columns.reduce((total, col) => total + col.width, 0);
  const separatorsWidth = (columns.length + 1) * thickness;
  return columnsWidth + separatorsWidth;
};

// Validate section
export const validateSection = (
  section: WardrobeSection,
  thickness: number
): { isValid: boolean; error?: string } => {
  const totalWidth = calculateTotalColumnsWidth(section.columns, thickness);

  if (totalWidth > section.width) {
    return {
      isValid: false,
      error: `Tổng chiều rộng các cột (${totalWidth}cm) vượt quá chiều rộng section (${section.width}cm)`,
    };
  }

  if (section.columns.length < section.minColumns) {
    return {
      isValid: false,
      error: `Cần ít nhất ${section.minColumns} cột`,
    };
  }

  if (section.columns.length > section.maxColumns) {
    return {
      isValid: false,
      error: `Tối đa ${section.maxColumns} cột`,
    };
  }

  return { isValid: true };
};
