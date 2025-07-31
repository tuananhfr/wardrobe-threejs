// src/hooks/useWardrobeColumns.ts - Simple Adjacent Redistribution Only

import { useWardrobeConfig } from "./useWardrobeConfig";

export const useWardrobeColumns = () => {
  const {
    config,
    handleUpdateSection,

    generateOptimalColumns,
  } = useWardrobeConfig();

  // ===== BASIC HELPERS =====

  const calculateUsedWidth = (
    columns: WardrobeColumn[],
    thickness: number
  ): number => {
    const columnsWidth = columns.reduce((sum, col) => sum + col.width, 0);
    const separatorsWidth = (columns.length + 1) * thickness;
    return columnsWidth + separatorsWidth;
  };

  const getRemainingSpace = (section: WardrobeSection, thickness: number) => {
    const totalUsed = calculateUsedWidth(section.columns, thickness);
    const remaining = section.width - totalUsed;

    return {
      totalUsed,
      remaining,
      isOverflow: remaining < 0,
      canAddMoreColumns: remaining >= 30 + thickness,
    };
  };

  // ===== CASCADE ADJACENT COLUMN WIDTH UPDATE =====

  /**
   * Update column width với cascade adjacent redistribution
   * Nếu adjacent column không thể adjust hết, cascade sang columns khác
   */
  const handleUpdateColumnWidth = (
    sectionKey: SectionKey,
    columnId: string,
    newWidth: number
  ) => {
    const currentSection = config.wardrobeType.sections[sectionKey];
    if (!currentSection) return;

    const columnIndex = currentSection.columns.findIndex(
      (col) => col.id === columnId
    );
    if (columnIndex === -1) return;

    const oldWidth = currentSection.columns[columnIndex].width;
    const difference = newWidth - oldWidth;

    if (difference === 0) return;

    const newColumns = [...currentSection.columns];
    newColumns[columnIndex] = { ...newColumns[columnIndex], width: newWidth };

    // Single column case
    if (newColumns.length === 1) {
      const totalUsed = calculateUsedWidth(newColumns, config.thickness);
      if (totalUsed > currentSection.width) {
        console.warn(
          `Single column too wide: ${totalUsed}cm > ${currentSection.width}cm`
        );
        return;
      }
      handleUpdateSection(sectionKey, { columns: newColumns });
      return;
    }

    // Multiple columns: Cascade redistribution
    let remainingDifference = -difference; // Amount to redistribute (opposite of change)
    const adjustments: Array<{
      index: number;
      oldWidth: number;
      newWidth: number;
    }> = [];

    // Define cascade order: prioritize adjacent, then expand outward
    const cascadeOrder: number[] = [];

    // Start with immediate adjacent (right first, then left)
    if (columnIndex + 1 < newColumns.length) cascadeOrder.push(columnIndex + 1);
    if (columnIndex - 1 >= 0) cascadeOrder.push(columnIndex - 1);

    // Then expand outward from the changed column
    let leftExpand = columnIndex - 2;
    let rightExpand = columnIndex + 2;

    while (leftExpand >= 0 || rightExpand < newColumns.length) {
      if (rightExpand < newColumns.length) {
        cascadeOrder.push(rightExpand);
        rightExpand++;
      }
      if (leftExpand >= 0) {
        cascadeOrder.push(leftExpand);
        leftExpand--;
      }
    }

    // Try to distribute remaining difference through cascade
    for (const targetIndex of cascadeOrder) {
      if (Math.abs(remainingDifference) < 0.1) break; // Done

      const currentWidth = newColumns[targetIndex].width;
      const maxAdjustment =
        remainingDifference > 0
          ? Math.min(remainingDifference, 120 - currentWidth) // Can increase up to 120
          : Math.max(remainingDifference, 30 - currentWidth); // Can decrease down to 30

      if (Math.abs(maxAdjustment) >= 1) {
        const newTargetWidth = currentWidth + maxAdjustment;

        adjustments.push({
          index: targetIndex,
          oldWidth: currentWidth,
          newWidth: newTargetWidth,
        });

        newColumns[targetIndex] = {
          ...newColumns[targetIndex],
          width: newTargetWidth,
        };
        remainingDifference -= maxAdjustment;
      }
    }

    // Check if we could redistribute all the difference
    if (Math.abs(remainingDifference) > 0.1) {
      console.warn(
        `Cannot fully redistribute: ${remainingDifference.toFixed(
          1
        )}cm remaining`
      );
      console.warn(
        `This means the constraints prevent the desired width change.`
      );
      return;
    }

    // Final validation: Total width should remain the same
    const totalUsed = calculateUsedWidth(newColumns, config.thickness);
    const originalUsed = calculateUsedWidth(
      currentSection.columns,
      config.thickness
    );

    if (Math.abs(totalUsed - originalUsed) > 0.1) {
      console.warn(
        `Width mismatch after cascade: ${totalUsed}cm vs ${originalUsed}cm`
      );
      return;
    }

    // Update section
    handleUpdateSection(sectionKey, { columns: newColumns });
  };

  // ===== SET COLUMN COUNT =====

  const setColumnCount = (sectionKey: SectionKey, newCount: number) => {
    const currentSection = config.wardrobeType.sections[sectionKey];
    if (!currentSection) return;

    // Validate constraints từ section (đã được auto-calculated với L-shape support)
    if (
      newCount < currentSection.minColumns ||
      newCount > currentSection.maxColumns
    ) {
      console.warn(
        `Column count must be between ${currentSection.minColumns} and ${currentSection.maxColumns}`
      );
      return;
    }

    // Generate columns với L-shape optimal distribution
    const newColumns = generateOptimalColumns(
      newCount,
      currentSection.width,
      config.thickness,
      sectionKey,
      currentSection.columns
    );

    handleUpdateSection(sectionKey, { columns: newColumns });
  };

  // ===== REDISTRIBUTE EVENLY =====

  const redistributeColumnsEvenly = (sectionKey: SectionKey) => {
    const currentSection = config.wardrobeType.sections[sectionKey];
    if (!currentSection) return;

    // Use setColumnCount với số columns hiện tại để redistribute optimal với L-shape constraints
    setColumnCount(sectionKey, currentSection.columns.length);
  };

  // ===== VALIDATION =====

  const validateSection = (section: WardrobeSection, thickness: number) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check individual columns
    section.columns.forEach((col, index) => {
      if (col.width < 30)
        errors.push(`Column ${index + 1} too narrow (${col.width}cm)`);
      if (col.width > 120)
        errors.push(`Column ${index + 1} too wide (${col.width}cm)`);
    });

    // Check total width
    const spaceInfo = getRemainingSpace(section, thickness);
    if (spaceInfo.isOverflow) {
      errors.push(
        `Total width exceeds section by ${Math.abs(spaceInfo.remaining)}cm`
      );
    }

    if (spaceInfo.remaining > 10) {
      warnings.push(`Large unused space: ${spaceInfo.remaining}cm`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      spaceInfo,
    };
  };

  return {
    // Main functions
    setColumnCount,
    handleUpdateColumnWidth, // Simple adjacent redistribution

    // Utilities
    redistributeColumnsEvenly,
    getRemainingSpace,
    validateSection,
    calculateUsedWidth,
  };
};
