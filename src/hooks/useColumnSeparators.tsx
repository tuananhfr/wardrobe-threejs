// src/hooks/useColumnSeparators.ts
import { useWardrobeConfig } from "./useWardrobeConfig";

interface ColumnSeparator {
  id: string;
  position: number; // Position từ left edge (cm)
  leftColumnId: string;
  rightColumnId: string;
}

export const useColumnSeparators = () => {
  const { config, handleUpdateSection } = useWardrobeConfig();

  // Tính toán separators từ columns hiện tại
  const calculateSeparators = (
    section: WardrobeSection,
    thickness: number
  ): ColumnSeparator[] => {
    if (section.columns.length <= 1) return [];

    const separators: ColumnSeparator[] = [];
    let currentPosition = thickness; // Bắt đầu sau left wall

    for (let i = 0; i < section.columns.length - 1; i++) {
      const leftColumn = section.columns[i];
      const rightColumn = section.columns[i + 1];

      currentPosition += leftColumn.width; // Đến cuối left column

      separators.push({
        id: `sep-${leftColumn.id}-${rightColumn.id}`,
        position: currentPosition,
        leftColumnId: leftColumn.id,
        rightColumnId: rightColumn.id,
      });

      currentPosition += thickness; // Qua separator
    }

    return separators;
  };

  // Tính range có thể di chuyển cho separator
  const getSeparatorRange = (
    section: WardrobeSection,
    separatorIndex: number,
    thickness: number
  ): { min: number; max: number } => {
    const separators = calculateSeparators(section, thickness);
    if (separatorIndex >= separators.length) return { min: 0, max: 0 };

    // Min: Left column phải >= 30cm
    const leftColumnMinWidth = 30;
    const prevSeparatorPos =
      separatorIndex > 0
        ? separators[separatorIndex - 1].position + thickness
        : thickness; // Left wall
    const minPosition = prevSeparatorPos + leftColumnMinWidth;

    // Max: Right column phải >= 30cm
    const rightColumnMinWidth = 30;
    const nextSeparatorPos =
      separatorIndex < separators.length - 1
        ? separators[separatorIndex + 1].position
        : section.width - thickness; // Right wall
    const maxPosition = nextSeparatorPos - rightColumnMinWidth;

    return { min: minPosition, max: maxPosition };
  };

  // Handle di chuyển separator
  const handleMoveSeparator = (
    sectionKey: SectionKey,
    separatorIndex: number,
    newPosition: number
  ) => {
    const currentSection = config.wardrobeType.sections[sectionKey];
    if (!currentSection) return;

    const separators = calculateSeparators(currentSection, config.thickness);
    if (separatorIndex >= separators.length) return;

    const separator = separators[separatorIndex];
    const leftColumnIndex = currentSection.columns.findIndex(
      (col) => col.id === separator.leftColumnId
    );
    const rightColumnIndex = currentSection.columns.findIndex(
      (col) => col.id === separator.rightColumnId
    );

    if (leftColumnIndex === -1 || rightColumnIndex === -1) return;

    // Tính width mới cho 2 columns
    const prevSeparatorPos =
      separatorIndex > 0
        ? separators[separatorIndex - 1].position + config.thickness
        : config.thickness;

    const nextSeparatorPos =
      separatorIndex < separators.length - 1
        ? separators[separatorIndex + 1].position
        : currentSection.width - config.thickness;

    const newLeftWidth = newPosition - prevSeparatorPos;
    const newRightWidth = nextSeparatorPos - newPosition - config.thickness;

    // Validate constraints
    if (
      newLeftWidth < 30 ||
      newLeftWidth > 120 ||
      newRightWidth < 30 ||
      newRightWidth > 120
    ) {
      console.warn(
        `Invalid separator position: left=${newLeftWidth}cm, right=${newRightWidth}cm`
      );
      return;
    }

    // Update columns
    const updatedColumns = currentSection.columns.map((col, index) => {
      if (index === leftColumnIndex) {
        return { ...col, width: newLeftWidth };
      } else if (index === rightColumnIndex) {
        return { ...col, width: newRightWidth };
      }
      return col;
    });

    handleUpdateSection(sectionKey, { columns: updatedColumns });
  };

  return {
    calculateSeparators,
    getSeparatorRange,
    handleMoveSeparator,
  };
};
