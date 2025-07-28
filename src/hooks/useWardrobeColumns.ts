// src/hooks/useWardrobeColumns.ts
import { useWardrobeConfig } from "./useWardrobeConfig";

export const useWardrobeColumns = () => {
  const { config, handleUpdateSection } = useWardrobeConfig();

  // Tính maxColumns dựa trên section width và constraints
  const calculateMaxColumns = (
    sectionWidth: number,
    thickness: number
  ): number => {
    // Với n columns cần (n+1) panels
    // Công thức: sectionWidth = n*minWidth + (n+1)*thickness
    // → n*minWidth + n*thickness + thickness = sectionWidth
    // → n*(minWidth + thickness) = sectionWidth - thickness
    // → n = (sectionWidth - thickness) / (minWidth + thickness)
    const minWidthPerColumn = 30;
    const maxColumns = Math.floor(
      (sectionWidth - thickness) / (minWidthPerColumn + thickness)
    );

    return Math.max(1, maxColumns); // Ít nhất 1 column
  };

  // Tính minColumns dựa trên section width để không có column nào > 120cm
  const calculateMinColumns = (
    sectionWidth: number,
    thickness: number
  ): number => {
    // Với n columns cần (n+1) panels
    // Để đảm bảo không column nào > 120cm
    const maxWidthPerColumn = 120;
    const minColumns = Math.floor(
      (sectionWidth - thickness) / (maxWidthPerColumn + thickness)
    );

    return Math.max(1, minColumns); // Ít nhất 1 column
  };

  // Helper function để redistribute với cascade logic
  const redistributeWithCascade = (
    columns: WardrobeColumn[],
    changedColumnId: string,
    newWidth: number
  ): WardrobeColumn[] => {
    const changedIndex = columns.findIndex((col) => col.id === changedColumnId);
    if (changedIndex === -1) return columns;

    const changedColumn = columns[changedIndex];
    const oldWidth = changedColumn.width;
    let remainingDifference = newWidth - oldWidth;

    // Nếu không có thay đổi
    if (remainingDifference === 0) return columns;

    // Copy columns để modify
    const newColumns = [...columns];
    newColumns[changedIndex] = { ...changedColumn, width: newWidth };

    const isIncreasing = remainingDifference > 0;
    remainingDifference = Math.abs(remainingDifference);

    // Define cascade directions based on preference and availability
    const cascadeDirections: Array<{
      startIndex: number;
      direction: number;
      name: string;
    }> = [];

    if (isIncreasing) {
      // Tăng width -> ưu tiên giảm columns bên phải trước, sau đó bên trái
      if (changedIndex + 1 < columns.length) {
        cascadeDirections.push({
          startIndex: changedIndex + 1,
          direction: 1,
          name: "right",
        });
      }
      if (changedIndex - 1 >= 0) {
        cascadeDirections.push({
          startIndex: changedIndex - 1,
          direction: -1,
          name: "left",
        });
      }
    } else {
      // Giảm width -> ưu tiên tăng columns bên trái trước, sau đó bên phải
      if (changedIndex - 1 >= 0) {
        cascadeDirections.push({
          startIndex: changedIndex - 1,
          direction: -1,
          name: "left",
        });
      }
      if (changedIndex + 1 < columns.length) {
        cascadeDirections.push({
          startIndex: changedIndex + 1,
          direction: 1,
          name: "right",
        });
      }
    }

    // Try each cascade direction until we distribute all the difference
    for (const cascadeDir of cascadeDirections) {
      if (remainingDifference <= 0) break;

      let currentIndex = cascadeDir.startIndex;
      while (
        remainingDifference > 0 &&
        currentIndex >= 0 &&
        currentIndex < columns.length
      ) {
        const currentColumn = newColumns[currentIndex];
        const targetChange = isIncreasing
          ? -remainingDifference
          : remainingDifference;
        const newColumnWidth = currentColumn.width + targetChange;

        if (newColumnWidth >= 30 && newColumnWidth <= 120) {
          // Can fully adjust this column
          newColumns[currentIndex] = {
            ...currentColumn,
            width: newColumnWidth,
          };
          remainingDifference = 0;
          break;
        } else {
          // Partial adjustment - take what we can
          let maxPossibleChange: number;
          if (isIncreasing) {
            // Giảm column này về min (30cm)
            maxPossibleChange = Math.max(0, currentColumn.width - 30);
          } else {
            // Tăng column này đến max (120cm)
            maxPossibleChange = Math.max(0, 120 - currentColumn.width);
          }

          if (maxPossibleChange > 0) {
            const actualChange = Math.min(
              maxPossibleChange,
              remainingDifference
            );
            const adjustedWidth = isIncreasing
              ? currentColumn.width - actualChange
              : currentColumn.width + actualChange;

            newColumns[currentIndex] = {
              ...currentColumn,
              width: adjustedWidth,
            };
            remainingDifference -= actualChange;
          }

          // Move to next column in this direction
          currentIndex += cascadeDir.direction;
        }
      }
    }

    // If we couldn't distribute all the difference, revert
    if (remainingDifference > 0) {
      console.warn(
        `Cannot fully adjust: Still need ${remainingDifference}cm adjustment. ` +
          `Available space is insufficient or all columns are at min/max limits.`
      );
      return columns; // Return original without changes
    }

    return newColumns;
  };

  // Helper function để update width của 1 column với adjacent redistribution
  const handleUpdateColumnWidth = (
    sectionKey: SectionKey,
    columnId: string,
    newWidth: number
  ) => {
    const currentSection = config.wardrobeType.sections[sectionKey];
    if (!currentSection) return;

    // Validate width constraints (30-120cm)
    if (newWidth < 30 || newWidth > 120) {
      console.warn(`Column width must be between 30-120cm`);
      return;
    }

    // Redistribute với cascade logic
    const redistributedColumns = redistributeWithCascade(
      currentSection.columns,
      columnId,
      newWidth
    );

    // Chỉ update nếu có thay đổi
    if (redistributedColumns !== currentSection.columns) {
      handleUpdateSection(sectionKey, { columns: redistributedColumns });
    }
  };

  // NEW: Function để update width trực tiếp không redistribution
  const updateColumnWidth = (
    sectionKey: SectionKey,
    columnId: string,
    newWidth: number
  ) => {
    const currentSection = config.wardrobeType.sections[sectionKey];
    if (!currentSection) return;

    // Validate width constraints (30-120cm)
    if (newWidth < 30 || newWidth > 120) {
      console.warn(`Column width must be between 30-120cm`);
      return;
    }

    const updatedColumns = currentSection.columns.map((col) =>
      col.id === columnId ? { ...col, width: newWidth } : col
    );

    handleUpdateSection(sectionKey, { columns: updatedColumns });
  };

  // Helper function để tính defaultColumnWidth với remainder distribution
  const calculateDefaultColumnWidths = (
    section: WardrobeSection,
    thickness: number,
    targetColumnCount?: number
  ): number[] => {
    const columnsCount = targetColumnCount || section.columns.length + 1;

    let netColumnWidth: number;

    if (columnsCount === 1) {
      // Trường hợp đặc biệt: 1 column = width - 2*thickness (chỉ left + right walls)
      netColumnWidth = section.width - 2 * thickness;
    } else {
      // Trường hợp thường: n columns = width - (n+1)*thickness
      const totalPanelsWidth = (columnsCount + 1) * thickness;
      netColumnWidth = section.width - totalPanelsWidth;
    }

    const baseWidth = Math.floor(netColumnWidth / columnsCount);
    const remainder = netColumnWidth % columnsCount;

    // Clamp base width trong range 30-120cm
    const clampedBaseWidth = Math.max(30, Math.min(120, baseWidth));

    // Tạo array với base width
    const widths = new Array(columnsCount).fill(clampedBaseWidth);

    // Distribute remainder vào các columns đầu (từ đầu xuống)
    for (let i = 0; i < remainder; i++) {
      if (widths[i] + 1 <= 120) {
        widths[i] += 1;
      }
    }

    return widths;
  };

  // Helper function để tính defaultColumnWidth (backward compatibility)
  const calculateDefaultColumnWidth = (
    section: WardrobeSection,
    thickness: number,
    targetColumnCount?: number
  ): number => {
    const widths = calculateDefaultColumnWidths(
      section,
      thickness,
      targetColumnCount
    );
    return widths[0] || 30; // Return first width or fallback
  };

  // NEW: Function để set số lượng columns
  const setColumnCount = (sectionKey: SectionKey, newCount: number) => {
    const currentSection = config.wardrobeType.sections[sectionKey];
    if (!currentSection) return;

    // Validate constraints
    const dynamicMaxColumns = calculateMaxColumns(
      currentSection.width,
      config.thickness
    );
    const dynamicMinColumns = calculateMinColumns(
      currentSection.width,
      config.thickness
    );
    const minCols = dynamicMinColumns;
    const maxCols = dynamicMaxColumns;

    if (newCount < minCols || newCount > maxCols) {
      console.warn(`Column count must be between ${minCols} and ${maxCols}`);
      return;
    }

    const currentCount = currentSection.columns.length;

    // Calculate optimal widths with remainder distribution
    const optimalWidths = calculateDefaultColumnWidths(
      currentSection,
      config.thickness,
      newCount
    );

    let newColumns: WardrobeColumn[] = [];

    if (newCount > currentCount) {
      // Thêm columns - preserve existing + add new ones
      newColumns = [...currentSection.columns];
      for (let i = currentCount; i < newCount; i++) {
        const newColumnId = `${sectionKey}-col-${i + 1}`;
        newColumns.push({
          id: newColumnId,
          width: optimalWidths[i] || 30,
        });
      }
    } else if (newCount < currentCount) {
      // Giảm columns
      newColumns = currentSection.columns.slice(0, newCount);
    } else {
      // Không thay đổi số lượng
      return;
    }

    // Redistribute all columns with optimal widths (including remainder)
    newColumns = newColumns.map((col, index) => ({
      ...col,
      width: optimalWidths[index] || 30,
    }));

    handleUpdateSection(sectionKey, { columns: newColumns });
  };

  // Helper function để check xem có thể add column không
  const canAddColumn = (
    section: WardrobeSection,
    thickness: number
  ): boolean => {
    const dynamicMaxColumns = calculateMaxColumns(section.width, thickness);
    const effectiveMaxColumns = Math.min(section.maxColumns, dynamicMaxColumns);

    // Check max columns limit
    if (section.columns.length >= effectiveMaxColumns) {
      return false;
    }

    // Check xem có đủ space cho column mới không
    const newColumnWidth = calculateDefaultColumnWidth(section, thickness);
    if (newColumnWidth < 30) {
      return false;
    }

    return true;
  };

  // Helper function để check xem có thể remove column không
  const canRemoveColumn = (
    section: WardrobeSection,
    thickness: number
  ): boolean => {
    const dynamicMinColumns = calculateMinColumns(section.width, thickness);
    const effectiveMinColumns = Math.max(section.minColumns, dynamicMinColumns);

    return section.columns.length > effectiveMinColumns;
  };

  // Helper function để add column
  const handleAddColumn = (sectionKey: SectionKey) => {
    const currentSection = config.wardrobeType.sections[sectionKey];
    if (!currentSection) return;

    // Check validation trước khi add
    if (!canAddColumn(currentSection, config.thickness)) {
      console.warn(
        `Cannot add column to ${sectionKey}: Space or limit exceeded`
      );
      return;
    }

    // Tạo ID dựa trên số thứ tự: sectionA-col-1, sectionA-col-2, etc.
    const nextColumnNumber = currentSection.columns.length + 1;
    const newColumnId = `${sectionKey}-col-${nextColumnNumber}`;
    const calculatedWidth = calculateDefaultColumnWidth(
      currentSection,
      config.thickness
    );
    const newColumn = { id: newColumnId, width: calculatedWidth };

    handleUpdateSection(sectionKey, {
      columns: [...currentSection.columns, newColumn],
    });
  };

  // Helper function để remove column
  const handleRemoveColumn = (sectionKey: SectionKey) => {
    const currentSection = config.wardrobeType.sections[sectionKey];
    if (!currentSection || !canRemoveColumn(currentSection, config.thickness)) {
      return;
    }

    const newColumns = currentSection.columns.slice(0, -1);
    handleUpdateSection(sectionKey, { columns: newColumns });
  };

  return {
    handleUpdateColumnWidth,
    updateColumnWidth, // NEW: Direct width update
    setColumnCount, // NEW: Set column count
    handleAddColumn,
    handleRemoveColumn,
    canAddColumn,
    canRemoveColumn,
    calculateMaxColumns,
    calculateMinColumns,
  };
};
