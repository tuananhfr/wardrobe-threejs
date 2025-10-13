// src/hooks/useWardrobeShelves.ts - Updated with spacing change logic
import { useWardrobeConfig } from "./useWardrobeConfig";

interface ShelfItem {
  id: string;
  position: number; // Vị trí từ bottom (cm) - calculated from spacing
}

interface ColumnShelves {
  columnId: string;
  totalHeight: number; // Chiều cao có sẵn
  shelves: ShelfItem[];
  minSpacing: number; // Khoảng cách tối thiểu giữa các kệ
  spacings: number[]; // Array of spacing values [sol->shelf1, shelf1->shelf2, ..., lastShelf->plafond]
}

export const useWardrobeShelves = () => {
  const {
    config,
    handleUpdateSection,
    updateConfig,
    cleanupConfigForRemovedSpacings,
  } = useWardrobeConfig();

  const MIN_SHELF_SPACING = 10; // cm

  /**
   * Convert spacings array to shelf positions
   * spacings = [sol->shelf1, shelf1->shelf2, shelf2->shelf3, shelf3->plafond]
   * positions = [shelf1_pos, shelf2_pos, shelf3_pos]
   */
  const spacingsToPositions = (spacings: number[]): number[] => {
    const positions: number[] = [];
    let currentPosition = config.baseBarHeight + config.thickness; // Start from baseBarHeight + sol thickness

    // Skip last spacing (to plafond), convert others to positions
    for (let i = 0; i < spacings.length - 1; i++) {
      currentPosition += spacings[i];
      positions.push(currentPosition);
    }

    return positions;
  };

  /**
   * Calculate optimal spacings for given shelf count
   */
  const calculateOptimalSpacings = (
    shelfCount: number,
    totalHeight: number
  ): number[] => {
    if (shelfCount === 0) return [];

    // Always enforce minimum spacing constraint by reducing shelf count if needed
    // Recompute available height each iteration because shelfCount affects shelf thickness total
    let feasibleShelfCount = Math.max(0, Math.floor(shelfCount));

    while (true) {
      // Calculate available space for spacings with current shelf count
      const spaceForShelves = feasibleShelfCount * config.thickness; // total shelf thickness
      const spaceForWalls = 2 * config.thickness; // sol + plafond
      const availableHeight =
        totalHeight - config.baseBarHeight - spaceForWalls - spaceForShelves;

      const spacingCount = feasibleShelfCount + 1; // sol→first, ..., last→plafond
      const minRequired = spacingCount * MIN_SHELF_SPACING;

      if (availableHeight >= minRequired) {
        // We can build spacings: start from minimum, then distribute the remaining cm evenly
        const remaining = availableHeight - minRequired;
        const baseExtra = Math.floor(remaining / spacingCount);
        const remainder = remaining % spacingCount;

        const spacings: number[] = [];
        for (let i = 0; i < spacingCount; i++) {
          const extra = baseExtra + (i < remainder ? 1 : 0);
          spacings.push(MIN_SHELF_SPACING + extra);
        }
        return spacings;
      }

      // Not enough height for minimum spacing — reduce shelf count
      if (feasibleShelfCount === 0) {
        return [];
      }
      feasibleShelfCount -= 1;
    }
  };

  /**
   * Get shelves configuration for a specific column
   */
  const getColumnShelves = (
    sectionKey: SectionKey,
    columnId: string
  ): ColumnShelves | null => {
    const section = config.wardrobeType.sections[sectionKey];
    if (!section) {
      return null;
    }

    const column = section.columns.find((col) => col.id === columnId);
    if (!column) {
      return null;
    }

    const totalHeight = config.height;

    // If no shelves data, return empty
    if (!column.shelves || !column.shelves.spacings) {
      return {
        columnId,
        totalHeight,
        shelves: [],
        minSpacing: MIN_SHELF_SPACING,
        spacings: [],
      };
    }

    // Convert spacings to positions for ShelfItem array
    const spacings = column.shelves.spacings.map((s) => s.spacing);
    const positions = spacingsToPositions(spacings);

    const shelves: ShelfItem[] = positions.map((position, index) => ({
      id: column.shelves!.spacings![index].id,
      position,
    }));

    return {
      columnId,
      totalHeight,
      shelves,
      minSpacing: MIN_SHELF_SPACING,
      spacings,
    };
  };

  /**
   * Set specific number of shelves for a column
   */
  const setShelfCount = (
    sectionKey: SectionKey,
    columnId: string,
    newCount: number
  ) => {
    const section = config.wardrobeType.sections[sectionKey];
    if (!section) {
      return;
    }

    const currentColumn = section.columns.find((col) => col.id === columnId);
    if (!currentColumn) {
      return;
    }

    const currentSpacingIds =
      currentColumn.shelves?.spacings?.map((s) => s.id) || [];
    const isDecreasing =
      newCount < (currentColumn.shelves?.spacings?.length || 0);

    if (newCount === 0) {
      // Remove all shelves
      const updatedColumns = section.columns.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            shelves: undefined,
          };
        }
        return col;
      });

      // Xóa config cho tất cả spacing bị loại bỏ
      cleanupConfigForRemovedSpacings(currentSpacingIds);

      handleUpdateSection(sectionKey, { columns: updatedColumns }, true);
      return;
    }

    // Generate optimal spacings for new count
    const totalHeight = config.height;
    const optimalSpacings = calculateOptimalSpacings(newCount, totalHeight);

    // Khi giảm số lượng shelves: giữ nguyên ID của spacing hiện có nếu có thể
    const spacings: shelfSpacing[] = optimalSpacings.map((spacing, index) => {
      const existingSpacing = currentColumn.shelves?.spacings?.[index];
      return {
        id: existingSpacing?.id || `${columnId}-spacing-${index + 1}`,
        spacing,
      };
    });

    // Xác định các spacing bị loại bỏ
    const newSpacingIds = spacings.map((s) => s.id);
    const removedSpacingIds = currentSpacingIds.filter(
      (id) => !newSpacingIds.includes(id)
    );

    // Xóa config cho các spacing bị loại bỏ
    if (isDecreasing && removedSpacingIds.length > 0) {
      cleanupConfigForRemovedSpacings(removedSpacingIds);
    }

    const updatedColumns = section.columns.map((col) => {
      if (col.id === columnId) {
        return {
          ...col,
          shelves: {
            id: `${columnId}-shelves`,
            shelfSpacing: MIN_SHELF_SPACING,
            spacings,
          },
        };
      }
      return col;
    });

    handleUpdateSection(sectionKey, { columns: updatedColumns }, true);
  };

  /**
   * Get shelf spacing analysis for display
   */
  const getShelfSpacingAnalysis = (
    sectionKey: SectionKey,
    columnId: string
  ) => {
    const columnShelves = getColumnShelves(sectionKey, columnId);
    if (!columnShelves || columnShelves.spacings.length === 0) return null;

    const spacings = columnShelves.spacings.map((spacing, index) => ({
      from: index === 0 ? 0 : columnShelves.shelves[index - 1]?.position || 0,
      to:
        index === columnShelves.spacings.length - 1
          ? columnShelves.totalHeight
          : columnShelves.shelves[index]?.position || 0,
      height: spacing,
      isValid: spacing >= MIN_SHELF_SPACING,
      isOptimal: spacing >= 20 && spacing <= 50, // Optimal range for storage
    }));

    return {
      totalHeight: columnShelves.totalHeight,
      shelfCount: columnShelves.shelves.length,
      spacings,
      averageSpacing:
        spacings.reduce((sum, s) => sum + s.height, 0) / spacings.length,
      hasValidSpacing: spacings.every((s) => s.isValid),
    };
  };

  /**
   * Set shelf count for multiple columns simultaneously
   */
  const setShelfCountForMultipleColumns = (
    columnUpdates: Array<{
      sectionKey: SectionKey;
      columnId: string;
      newCount: number;
    }>
  ) => {
    // Process all updates in a single transaction
    const updatedSections = { ...config.wardrobeType.sections };
    const allRemovedSpacingIds: string[] = [];

    columnUpdates.forEach(({ sectionKey, columnId, newCount }) => {
      const section = updatedSections[sectionKey];
      if (!section) {
        console.error(`Section ${sectionKey} not found`);
        return;
      }

      const currentColumn = section.columns.find((col) => col.id === columnId);
      if (!currentColumn) {
        console.error(`Column ${columnId} not found in section ${sectionKey}`);
        return;
      }

      const currentSpacingIds =
        currentColumn.shelves?.spacings?.map((s) => s.id) || [];
      const isDecreasing =
        newCount < (currentColumn.shelves?.spacings?.length || 0);

      if (newCount === 0) {
        // Remove all shelves
        updatedSections[sectionKey] = {
          ...section,
          columns: section.columns.map((col) => {
            if (col.id === columnId) {
              return {
                ...col,
                shelves: undefined,
              };
            }
            return col;
          }),
        };

        // Thêm tất cả spacing IDs vào danh sách bị loại bỏ
        allRemovedSpacingIds.push(...currentSpacingIds);
      } else {
        // Generate optimal spacings for new count
        const totalHeight = config.height;
        const optimalSpacings = calculateOptimalSpacings(newCount, totalHeight);

        // Khi giảm số lượng shelves: giữ nguyên ID của spacing hiện có nếu có thể
        const spacings: shelfSpacing[] = optimalSpacings.map(
          (spacing, index) => {
            const existingSpacing = currentColumn.shelves?.spacings?.[index];
            return {
              id: existingSpacing?.id || `${columnId}-spacing-${index + 1}`,
              spacing,
            };
          }
        );

        // Xác định các spacing bị loại bỏ
        const newSpacingIds = spacings.map((s) => s.id);
        const removedSpacingIds = currentSpacingIds.filter(
          (id) => !newSpacingIds.includes(id)
        );

        if (isDecreasing && removedSpacingIds.length > 0) {
          allRemovedSpacingIds.push(...removedSpacingIds);
        }

        updatedSections[sectionKey] = {
          ...section,
          columns: section.columns.map((col) => {
            if (col.id === columnId) {
              return {
                ...col,
                shelves: {
                  id: `${columnId}-shelves`,
                  shelfSpacing: MIN_SHELF_SPACING,
                  spacings,
                },
              };
            }
            return col;
          }),
        };
      }
    });

    // Xóa config cho tất cả spacing bị loại bỏ
    if (allRemovedSpacingIds.length > 0) {
      cleanupConfigForRemovedSpacings(allRemovedSpacingIds);
    }

    // Single update to config - all sections at once
    updateConfig("wardrobeType", {
      ...config.wardrobeType,
      sections: updatedSections,
    });
  };

  return {
    getColumnShelves,
    setShelfCount,
    setShelfCountForMultipleColumns,
    getShelfSpacingAnalysis,
    MIN_SHELF_SPACING,
  };
};
