// src/hooks/useColumnSeparators.ts (Simplified)
import { useWardrobeConfig } from "./useWardrobeConfig";

interface ColumnSeparator {
  id: string;
  position: number; // Position từ left edge (cm)
  leftColumnId: string;
  rightColumnId: string;
}

export const useColumnSeparators = () => {
  const { config, handleUpdateSection } = useWardrobeConfig();

  /**
   * Tính toán vị trí của tất cả separators dựa trên columns hiện tại
   */
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

      // Di chuyển đến cuối left column
      currentPosition += leftColumn.width;

      separators.push({
        id: `sep-${leftColumn.id}-${rightColumn.id}`,
        position: currentPosition, // Vị trí bắt đầu separator
        leftColumnId: leftColumn.id,
        rightColumnId: rightColumn.id,
      });

      // Di chuyển qua separator
      currentPosition += thickness;
    }

    return separators;
  };

  /**
   * Tính range có thể di chuyển cho separator
   */
  const getSeparatorRange = (
    section: WardrobeSection,
    separatorIndex: number,
    thickness: number
  ): { min: number; max: number } => {
    if (separatorIndex >= section.columns.length - 1) {
      return { min: 0, max: 0 };
    }

    // Tính min position: left column phải >= 30cm
    let minPosition = thickness; // Left wall
    for (let i = 0; i < separatorIndex; i++) {
      minPosition += Math.max(30, section.columns[i].width) + thickness;
    }
    minPosition += 30; // Min width cho left column của separator này

    // Tính max position: right column phải >= 30cm
    let maxPosition = section.width - thickness; // Right wall
    for (let i = section.columns.length - 1; i > separatorIndex + 1; i--) {
      maxPosition -= Math.max(30, section.columns[i].width) + thickness;
    }
    maxPosition -= 30; // Min width cho right column của separator này

    return {
      min: Math.max(thickness + 30, minPosition),
      max: Math.min(section.width - thickness - 30, maxPosition),
    };
  };

  /**
   * Di chuyển separator đến vị trí mới
   * Automatically adjust left và right columns
   */
  const handleMoveSeparator = (
    sectionKey: SectionKey,
    separatorIndex: number,
    newPosition: number
  ) => {
    const currentSection = config.wardrobeType.sections[sectionKey];
    if (!currentSection) return;

    if (separatorIndex >= currentSection.columns.length - 1) return;

    // Validate range
    const range = getSeparatorRange(
      currentSection,
      separatorIndex,
      config.thickness
    );
    if (newPosition < range.min || newPosition > range.max) {
      console.warn(
        `Separator position out of range: ${newPosition} not in [${range.min}, ${range.max}]`
      );
      return;
    }

    // Calculate new widths for affected columns
    const updatedColumns = [...currentSection.columns];

    // Calculate left column's new width
    const leftColumnEndPosition = newPosition;
    let leftColumnStartPosition = config.thickness; // Left wall

    // Sum widths of columns before the left column
    for (let i = 0; i < separatorIndex; i++) {
      leftColumnStartPosition += updatedColumns[i].width + config.thickness;
    }

    const newLeftWidth = leftColumnEndPosition - leftColumnStartPosition;

    // Calculate right column's new width
    const rightColumnStartPosition = newPosition + config.thickness;
    let rightColumnEndPosition = config.thickness; // Account for right wall

    // Sum widths from right wall back to right column
    for (let i = separatorIndex + 2; i < updatedColumns.length; i++) {
      rightColumnEndPosition += updatedColumns[i].width + config.thickness;
    }
    rightColumnEndPosition = currentSection.width - rightColumnEndPosition;

    const newRightWidth = rightColumnEndPosition - rightColumnStartPosition;

    // Validate new widths
    if (
      newLeftWidth < 30 ||
      newLeftWidth > 120 ||
      newRightWidth < 30 ||
      newRightWidth > 120
    ) {
      console.warn(
        `Invalid column widths: left=${newLeftWidth}cm, right=${newRightWidth}cm`
      );
      return;
    }

    // Update columns
    updatedColumns[separatorIndex] = {
      ...updatedColumns[separatorIndex],
      width: newLeftWidth,
    };
    updatedColumns[separatorIndex + 1] = {
      ...updatedColumns[separatorIndex + 1],
      width: newRightWidth,
    };

    handleUpdateSection(sectionKey, { columns: updatedColumns });
  };

  /**
   * Get separator info for display
   */
  const getSeparatorInfo = (
    separator: ColumnSeparator,
    section: WardrobeSection
  ) => {
    const leftColumn = section.columns.find(
      (col) => col.id === separator.leftColumnId
    );
    const rightColumn = section.columns.find(
      (col) => col.id === separator.rightColumnId
    );

    const leftIndex = section.columns.findIndex(
      (col) => col.id === separator.leftColumnId
    );
    const rightIndex = section.columns.findIndex(
      (col) => col.id === separator.rightColumnId
    );

    return {
      leftColumn,
      rightColumn,
      leftIndex: leftIndex + 1, // 1-based for display
      rightIndex: rightIndex + 1, // 1-based for display
      displayName: `Separator ${leftIndex + 1}-${rightIndex + 1}`,
    };
  };

  /**
   * Tính total width validation
   */
  const validateSeparatorConfiguration = (
    section: WardrobeSection,
    thickness: number
  ): { isValid: boolean; message?: string } => {
    const separators = calculateSeparators(section, thickness);

    // Check if all separators are within bounds
    for (let i = 0; i < separators.length; i++) {
      const range = getSeparatorRange(section, i, thickness);
      if (
        separators[i].position < range.min ||
        separators[i].position > range.max
      ) {
        return {
          isValid: false,
          message: `Separator ${i + 1} is out of valid range`,
        };
      }
    }

    // Check total width
    const totalColumnsWidth = section.columns.reduce(
      (sum, col) => sum + col.width,
      0
    );
    const totalSeparatorsWidth = (section.columns.length + 1) * thickness;
    const totalUsedWidth = totalColumnsWidth + totalSeparatorsWidth;

    if (totalUsedWidth > section.width) {
      return {
        isValid: false,
        message: `Total width ${totalUsedWidth}cm exceeds section width ${section.width}cm`,
      };
    }

    return { isValid: true };
  };

  return {
    calculateSeparators,
    getSeparatorRange,
    handleMoveSeparator,
    getSeparatorInfo,
    validateSeparatorConfiguration,
  };
};
