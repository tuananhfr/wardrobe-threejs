// src/hooks/useWardrobeShelves.ts - Fixed Spacing Logic
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
  const { config, handleUpdateSection } = useWardrobeConfig();

  const MIN_SHELF_SPACING = 10; // cm
  const DEFAULT_SHELF_THICKNESS = 2; // cm
  const MIN_BOTTOM_SPACING = 10; // cm từ đáy
  const MIN_TOP_SPACING = 10; // cm từ đỉnh

  /**
   * Convert spacings array to shelf positions
   * spacings = [sol->shelf1, shelf1->shelf2, shelf2->shelf3, shelf3->plafond]
   * positions = [shelf1_pos, shelf2_pos, shelf3_pos]
   */
  const spacingsToPositions = (spacings: number[]): number[] => {
    const positions: number[] = [];
    let currentPosition = config.thickness; // Start from sol thickness

    // Skip last spacing (to plafond), convert others to positions
    for (let i = 0; i < spacings.length - 1; i++) {
      currentPosition += spacings[i];
      positions.push(currentPosition);
    }

    console.log(`🔧 spacingsToPositions:`, {
      spacings,
      positions,
      thickness: config.thickness,
    });

    return positions;
  };

  /**
   * Convert shelf positions to spacings array
   * positions = [shelf1_pos, shelf2_pos, shelf3_pos]
   * spacings = [sol->shelf1, shelf1->shelf2, shelf2->shelf3, shelf3->plafond]
   */
  const positionsToSpacings = (
    positions: number[],
    totalHeight: number
  ): number[] => {
    if (positions.length === 0) return [];

    const sortedPositions = [...positions].sort((a, b) => a - b);
    const spacings: number[] = [];

    // Sol (with thickness) to first shelf
    spacings.push(sortedPositions[0] - config.thickness);

    // Between shelves
    for (let i = 1; i < sortedPositions.length; i++) {
      spacings.push(sortedPositions[i] - sortedPositions[i - 1]);
    }

    // Last shelf to plafond (with thickness)
    spacings.push(
      totalHeight -
        config.thickness -
        sortedPositions[sortedPositions.length - 1]
    );

    console.log(`🔧 positionsToSpacings:`, {
      positions,
      sortedPositions,
      totalHeight,
      thickness: config.thickness,
      spacings,
    });

    return spacings;
  };

  /**
   * Calculate optimal spacings for given shelf count
   */
  const calculateOptimalSpacings = (
    shelfCount: number,
    totalHeight: number
  ): number[] => {
    if (shelfCount === 0) return [];

    // Available height = totalHeight - thickness for sol/plafond (shelves thickness handled in spacing)
    const availableHeight = totalHeight - 2 * config.thickness; // Only sol + plafond thickness

    // Number of spacings = shelfCount + 1 (sol→shelf1, shelf1→shelf2, ..., lastShelf→plafond)
    const spacingCount = shelfCount + 1;
    const baseSpacing = Math.floor(availableHeight / spacingCount);
    const remainder = availableHeight % spacingCount;

    const spacings: number[] = [];
    for (let i = 0; i < spacingCount; i++) {
      // Distribute remainder evenly, starting from first spacings
      spacings.push(baseSpacing + (i < remainder ? 1 : 0));
    }

    console.log(`🔧 calculateOptimalSpacings:`, {
      shelfCount,
      totalHeight,
      thickness: config.thickness,
      availableHeight,
      spacingCount,
      baseSpacing,
      remainder,
      spacings,
    });

    return spacings;
  };

  /**
   * Get shelves configuration for a specific column
   */
  const getColumnShelves = (
    sectionKey: SectionKey,
    columnId: string
  ): ColumnShelves | null => {
    const section = config.wardrobeType.sections[sectionKey];
    if (!section) return null;

    const column = section.columns.find((col) => col.id === columnId);
    if (!column) return null;

    const totalHeight = config.height - config.baseBarHeight;

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
   * Initialize default shelves for a column
   */
  const initializeColumnShelves = (
    sectionKey: SectionKey,
    columnId: string,
    shelfCount: number = 3
  ) => {
    const section = config.wardrobeType.sections[sectionKey];
    if (!section) return;

    const totalHeight = config.height - config.baseBarHeight;
    const optimalSpacings = calculateOptimalSpacings(shelfCount, totalHeight);

    // Convert spacings to shelfSpacing objects
    const spacings: shelfSpacing[] = optimalSpacings.map((spacing, index) => ({
      id: `${columnId}-spacing-${index + 1}`,
      spacing,
    }));

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

    handleUpdateSection(sectionKey, { columns: updatedColumns });
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
    if (!section) return;

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

      handleUpdateSection(sectionKey, { columns: updatedColumns });
      return;
    }

    // Generate optimal spacings for new count
    const totalHeight = config.height - config.baseBarHeight;
    const optimalSpacings = calculateOptimalSpacings(newCount, totalHeight);

    const spacings: shelfSpacing[] = optimalSpacings.map((spacing, index) => ({
      id: `${columnId}-spacing-${index + 1}`,
      spacing,
    }));

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

    handleUpdateSection(sectionKey, { columns: updatedColumns });
  };

  /**
   * Add a new shelf to a column (legacy - use setShelfCount instead)
   */
  const addShelfToColumn = (
    sectionKey: SectionKey,
    columnId: string,
    position?: number
  ) => {
    const columnShelves = getColumnShelves(sectionKey, columnId);
    if (!columnShelves) {
      initializeColumnShelves(sectionKey, columnId, 1);
      return;
    }

    const currentCount = columnShelves.shelves.length;
    setShelfCount(sectionKey, columnId, currentCount + 1);
  };

  /**
   * Remove a shelf from a column (legacy - use setShelfCount instead)
   */
  const removeShelfFromColumn = (
    sectionKey: SectionKey,
    columnId: string,
    shelfId: string
  ) => {
    const columnShelves = getColumnShelves(sectionKey, columnId);
    if (!columnShelves || columnShelves.shelves.length === 0) return;

    const currentCount = columnShelves.shelves.length;
    setShelfCount(sectionKey, columnId, Math.max(0, currentCount - 1));
  };

  /**
   * Move a shelf to a new position
   */
  const moveShelf = (
    sectionKey: SectionKey,
    columnId: string,
    shelfId: string,
    newPosition: number
  ) => {
    const section = config.wardrobeType.sections[sectionKey];
    if (!section) return;

    const column = section.columns.find((col) => col.id === columnId);
    if (!column || !column.shelves) return;

    const columnShelves = getColumnShelves(sectionKey, columnId);
    if (!columnShelves) return;

    // Find the shelf and update its position
    const shelfIndex = columnShelves.shelves.findIndex((s) => s.id === shelfId);
    if (shelfIndex === -1) return;

    // Create new positions array with updated position
    const newPositions = columnShelves.shelves.map((shelf, index) =>
      index === shelfIndex ? newPosition : shelf.position
    );

    // Convert back to spacings
    const totalHeight = config.height - config.baseBarHeight;
    const newSpacings = positionsToSpacings(newPositions, totalHeight);

    // Update spacings in config
    const spacings: shelfSpacing[] = newSpacings.map((spacing, index) => ({
      id:
        column.shelves!.spacings![index]?.id ||
        `${columnId}-spacing-${index + 1}`,
      spacing,
    }));

    const updatedColumns = section.columns.map((col) => {
      if (col.id === columnId && col.shelves) {
        return {
          ...col,
          shelves: {
            ...col.shelves,
            spacings,
          },
        };
      }
      return col;
    });

    handleUpdateSection(sectionKey, { columns: updatedColumns });
  };

  /**
   * Validate if a shelf position is valid
   */
  const isValidShelfPosition = (
    existingShelves: ShelfItem[],
    position: number,
    totalHeight: number
  ): boolean => {
    // Check bounds (account for thickness)
    if (
      position < config.thickness + MIN_SHELF_SPACING ||
      position > totalHeight - config.thickness - MIN_SHELF_SPACING
    ) {
      return false;
    }

    // Check spacing with other shelves
    for (const shelf of existingShelves) {
      if (Math.abs(shelf.position - position) < MIN_SHELF_SPACING) {
        return false;
      }
    }

    return true;
  };

  /**
   * Get valid range for a shelf position
   */
  const getShelfPositionRange = (
    sectionKey: SectionKey,
    columnId: string,
    shelfId: string
  ): { min: number; max: number } => {
    const columnShelves = getColumnShelves(sectionKey, columnId);
    if (!columnShelves) return { min: 0, max: 0 };

    const totalHeight = columnShelves.totalHeight;
    const otherShelves = columnShelves.shelves.filter((s) => s.id !== shelfId);

    let min = config.thickness + MIN_SHELF_SPACING;
    let max = totalHeight - config.thickness - MIN_SHELF_SPACING;

    // Find constraints from other shelves
    const sortedPositions = otherShelves
      .map((s) => s.position)
      .sort((a, b) => a - b);

    for (const position of sortedPositions) {
      if (position < min + MIN_SHELF_SPACING) {
        min = Math.max(min, position + MIN_SHELF_SPACING);
      }
      if (position > max - MIN_SHELF_SPACING) {
        max = Math.min(max, position - MIN_SHELF_SPACING);
      }
    }

    return { min: Math.ceil(min), max: Math.floor(max) };
  };

  /**
   * Auto-distribute shelves evenly in a column
   */
  const redistributeShelvesEvenly = (
    sectionKey: SectionKey,
    columnId: string
  ) => {
    const columnShelves = getColumnShelves(sectionKey, columnId);
    if (!columnShelves || columnShelves.shelves.length === 0) return;

    const shelfCount = columnShelves.shelves.length;
    setShelfCount(sectionKey, columnId, shelfCount); // This will recalculate optimal spacings
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

  return {
    // Core functions
    getColumnShelves,
    initializeColumnShelves,
    setShelfCount, // New preferred method

    // Legacy shelf management (for backward compatibility)
    addShelfToColumn,
    removeShelfFromColumn,
    moveShelf,

    // Utilities
    isValidShelfPosition,
    getShelfPositionRange,
    redistributeShelvesEvenly,
    getShelfSpacingAnalysis,

    // Helper functions
    spacingsToPositions,
    positionsToSpacings,
    calculateOptimalSpacings,

    // Constants
    MIN_SHELF_SPACING,
    DEFAULT_SHELF_THICKNESS,
    MIN_BOTTOM_SPACING,
    MIN_TOP_SPACING,
  };
};
