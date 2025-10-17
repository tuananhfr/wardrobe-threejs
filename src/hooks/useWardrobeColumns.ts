import { useWardrobeConfig } from "./useWardrobeConfig";

export const useWardrobeColumns = () => {
  const {
    config,

    handleUpdateSection,

    generateOptimalColumns,
    cleanupConfigForRemovedColumns,
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
      handleUpdateSection(sectionKey, { columns: newColumns }, true);
      return;
    }

    // Adjacent-only redistribution: only move the separator with one neighbor and stop at min/max
    const rightNeighborIndex =
      columnIndex + 1 < newColumns.length ? columnIndex + 1 : -1;
    const leftNeighborIndex = columnIndex - 1 >= 0 ? columnIndex - 1 : -1;

    // Prefer right neighbor if exists (moving the separator to the right), otherwise use left
    const neighborIndex =
      rightNeighborIndex !== -1 ? rightNeighborIndex : leftNeighborIndex;

    if (neighborIndex === -1) {
      // No neighbor to adjust
      console.warn("No adjacent column to redistribute width with.");
      return;
    }

    const neighborOldWidth = newColumns[neighborIndex].width;

    if (difference > 0) {
      // Increasing current column width -> take from neighbor down to its min (30)
      const maxTakeFromNeighbor = Math.max(0, neighborOldWidth - 30);
      const actualIncrease = Math.min(difference, maxTakeFromNeighbor);

      // Clamp if requested increase exceeds what neighbor can give
      const appliedNewWidth = oldWidth + actualIncrease;
      const appliedNeighborWidth = neighborOldWidth - actualIncrease;

      newColumns[columnIndex] = {
        ...newColumns[columnIndex],
        width: appliedNewWidth,
      };
      newColumns[neighborIndex] = {
        ...newColumns[neighborIndex],
        width: appliedNeighborWidth,
      };

      // If we could not absorb full difference, stop here (do not cascade further)
      if (actualIncrease < difference - 0.0001) {
        // Do not proceed; effectively we clamped at boundary
      }
    } else {
      // Decreasing current column width -> give to neighbor up to its max (120)
      const delta = -difference; // positive amount to give
      const maxGiveToNeighbor = Math.max(0, 120 - neighborOldWidth);
      const actualDecrease = Math.min(delta, maxGiveToNeighbor);

      const appliedNewWidth = oldWidth - actualDecrease;
      const appliedNeighborWidth = neighborOldWidth + actualDecrease;

      newColumns[columnIndex] = {
        ...newColumns[columnIndex],
        width: appliedNewWidth,
      };
      newColumns[neighborIndex] = {
        ...newColumns[neighborIndex],
        width: appliedNeighborWidth,
      };

      // If we could not absorb full difference, stop here (do not cascade further)
      if (actualDecrease < delta - 0.0001) {
        // Do not proceed; effectively we clamped at boundary
      }
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
    handleUpdateSection(sectionKey, { columns: newColumns }, true);
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

    const currentCount = currentSection.columns.length;
    const isIncreasing = newCount > currentCount;
    const isDecreasing = newCount < currentCount;

    // Generate columns với L-shape optimal distribution
    const newColumns = generateOptimalColumns(
      newCount,
      currentSection.width,
      config.thickness,
      sectionKey,
      currentSection.columns
    );

    // Xử lý theo logic mới
    if (isIncreasing) {
      // Khi tăng: giữ nguyên tất cả thiết lập, chỉ thêm cột mới nếu cần
      const preservedColumns = newColumns.map((newCol, index) => {
        const existingCol = currentSection.columns[index];
        if (existingCol) {
          // Giữ nguyên shelves hiện có
          return {
            ...newCol,
            shelves: existingCol.shelves,
          };
        }
        // Cột mới: chỉ có width, không có thiết lập
        return newCol;
      });

      handleUpdateSection(sectionKey, { columns: preservedColumns }, true);
    } else if (isDecreasing) {
      // Khi giảm: chỉ xóa thiết lập trên các cột bị loại bỏ
      const preservedColumns = newColumns.map((newCol) => {
        const existingCol = currentSection.columns.find(
          (col) => col.id === newCol.id
        );
        if (existingCol) {
          // Giữ nguyên shelves cho cột còn lại
          return {
            ...newCol,
            shelves: existingCol.shelves,
          };
        }
        // Cột mới (hiếm khi xảy ra khi giảm): chỉ có width
        return newCol;
      });

      // Xóa các thiết lập doors, drawers, rails, internalEquipment cho các cột bị loại bỏ
      const removedColumnIds = currentSection.columns
        .filter((col) => !newColumns.some((newCol) => newCol.id === col.id))
        .map((col) => col.id);

      cleanupConfigForRemovedColumns(removedColumnIds);

      handleUpdateSection(sectionKey, { columns: preservedColumns }, true);
    } else {
      // Không thay đổi số lượng columns, chỉ redistribute
      handleUpdateSection(sectionKey, { columns: newColumns }, true);
    }
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
