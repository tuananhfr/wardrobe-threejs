// src/hooks/useWardrobeShelves.ts
import { useWardrobeConfig } from "./useWardrobeConfig";

interface ShelfItem {
  id: string;
  position: number; // Vị trí từ bottom (cm)
  type: "shelf" | "rod"; // Kệ thường hoặc thanh treo
  isFixed?: boolean; // Có thể di chuyển được không
}

interface ColumnShelves {
  columnId: string;
  totalHeight: number; // Chiều cao có sẵn
  shelves: ShelfItem[];
  minSpacing: number; // Khoảng cách tối thiểu giữa các kệ
}

export const useWardrobeShelves = () => {
  const { config, handleUpdateSection } = useWardrobeConfig();

  const MIN_SHELF_SPACING = 10; // cm
  const DEFAULT_SHELF_THICKNESS = 2; // cm
  const MIN_BOTTOM_SPACING = 5; // cm từ đáy
  const MIN_TOP_SPACING = 5; // cm từ đỉnh

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
    if (!column || !column.shelves) return null;

    const totalHeight = config.height - config.baseBarHeight;

    return {
      columnId,
      totalHeight,
      shelves:
        column.shelves.spacings?.map((spacing) => ({
          id: spacing.id,
          position: spacing.spacing,
          type: "shelf",
          isFixed: false,
        })) || [],
      minSpacing: MIN_SHELF_SPACING,
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
    const availableHeight = totalHeight - MIN_BOTTOM_SPACING - MIN_TOP_SPACING;

    // Distribute shelves evenly
    const spacings: shelfSpacing[] = [];
    for (let i = 0; i < shelfCount; i++) {
      const position =
        MIN_BOTTOM_SPACING + (availableHeight / (shelfCount + 1)) * (i + 1);
      spacings.push({
        id: `${columnId}-shelf-${i + 1}`,
        spacing: Math.round(position),
      });
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

    handleUpdateSection(sectionKey, { columns: updatedColumns });
  };

  /**
   * Add a new shelf to a column
   */
  const addShelfToColumn = (
    sectionKey: SectionKey,
    columnId: string,
    position?: number
  ) => {
    const section = config.wardrobeType.sections[sectionKey];
    if (!section) return;

    const column = section.columns.find((col) => col.id === columnId);
    if (!column) return;

    const totalHeight = config.height - config.baseBarHeight;

    // Initialize shelves if not exists
    if (!column.shelves) {
      initializeColumnShelves(sectionKey, columnId, 1);
      return;
    }

    const currentShelves = column.shelves.spacings || [];

    // Determine position for new shelf
    let newPosition: number;
    if (position !== undefined) {
      newPosition = position;
    } else {
      // Find optimal position - in the middle of largest gap
      const sortedPositions = [
        MIN_BOTTOM_SPACING,
        ...currentShelves.map((s) => s.spacing),
        totalHeight - MIN_TOP_SPACING,
      ].sort((a, b) => a - b);

      let largestGap = 0;
      let optimalPosition = MIN_BOTTOM_SPACING + 20;

      for (let i = 0; i < sortedPositions.length - 1; i++) {
        const gap = sortedPositions[i + 1] - sortedPositions[i];
        if (gap > largestGap && gap > MIN_SHELF_SPACING * 2) {
          largestGap = gap;
          optimalPosition = sortedPositions[i] + gap / 2;
        }
      }

      newPosition = Math.round(optimalPosition);
    }

    // Validate position
    if (!isValidShelfPosition(currentShelves, newPosition, totalHeight)) {
      console.warn(`Invalid shelf position: ${newPosition}cm`);
      return;
    }

    const newShelf: shelfSpacing = {
      id: `${columnId}-shelf-${Date.now()}`,
      spacing: newPosition,
    };

    const updatedColumns = section.columns.map((col) => {
      if (col.id === columnId) {
        return {
          ...col,
          shelves: {
            ...col.shelves!,
            spacings: [...(col.shelves?.spacings || []), newShelf],
          },
        };
      }
      return col;
    });

    handleUpdateSection(sectionKey, { columns: updatedColumns });
  };

  /**
   * Remove a shelf from a column
   */
  const removeShelfFromColumn = (
    sectionKey: SectionKey,
    columnId: string,
    shelfId: string
  ) => {
    const section = config.wardrobeType.sections[sectionKey];
    if (!section) return;

    const updatedColumns = section.columns.map((col) => {
      if (col.id === columnId && col.shelves) {
        return {
          ...col,
          shelves: {
            ...col.shelves,
            spacings:
              col.shelves.spacings?.filter((s) => s.id !== shelfId) || [],
          },
        };
      }
      return col;
    });

    handleUpdateSection(sectionKey, { columns: updatedColumns });
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

    const otherShelves =
      column.shelves.spacings?.filter((s) => s.id !== shelfId) || [];
    const totalHeight = config.height - config.baseBarHeight;

    // Validate new position
    if (!isValidShelfPosition(otherShelves, newPosition, totalHeight)) {
      console.warn(`Invalid shelf position: ${newPosition}cm`);
      return;
    }

    const updatedColumns = section.columns.map((col) => {
      if (col.id === columnId && col.shelves) {
        return {
          ...col,
          shelves: {
            ...col.shelves,
            spacings:
              col.shelves.spacings?.map((s) =>
                s.id === shelfId ? { ...s, spacing: newPosition } : s
              ) || [],
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
    existingShelves: shelfSpacing[],
    position: number,
    totalHeight: number
  ): boolean => {
    // Check bounds
    if (
      position < MIN_BOTTOM_SPACING ||
      position > totalHeight - MIN_TOP_SPACING
    ) {
      return false;
    }

    // Check spacing with other shelves
    for (const shelf of existingShelves) {
      if (Math.abs(shelf.spacing - position) < MIN_SHELF_SPACING) {
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
    const section = config.wardrobeType.sections[sectionKey];
    if (!section) return { min: 0, max: 0 };

    const column = section.columns.find((col) => col.id === columnId);
    if (!column || !column.shelves) return { min: 0, max: 0 };

    const totalHeight = config.height - config.baseBarHeight;
    const otherShelves =
      column.shelves.spacings?.filter((s) => s.id !== shelfId) || [];

    let min = MIN_BOTTOM_SPACING;
    let max = totalHeight - MIN_TOP_SPACING;

    // Find constraints from other shelves
    const sortedShelves = otherShelves
      .map((s) => s.spacing)
      .sort((a, b) => a - b);

    for (const shelfPosition of sortedShelves) {
      if (shelfPosition < min + MIN_SHELF_SPACING) {
        min = Math.max(min, shelfPosition + MIN_SHELF_SPACING);
      }
      if (shelfPosition > max - MIN_SHELF_SPACING) {
        max = Math.min(max, shelfPosition - MIN_SHELF_SPACING);
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
    const section = config.wardrobeType.sections[sectionKey];
    if (!section) return;

    const column = section.columns.find((col) => col.id === columnId);
    if (!column || !column.shelves) return;

    const currentShelves = column.shelves.spacings || [];
    if (currentShelves.length === 0) return;

    const totalHeight = config.height - config.baseBarHeight;
    const availableHeight = totalHeight - MIN_BOTTOM_SPACING - MIN_TOP_SPACING;

    const updatedShelves = currentShelves.map((shelf, index) => ({
      ...shelf,
      spacing: Math.round(
        MIN_BOTTOM_SPACING +
          (availableHeight / (currentShelves.length + 1)) * (index + 1)
      ),
    }));

    const updatedColumns = section.columns.map((col) => {
      if (col.id === columnId) {
        return {
          ...col,
          shelves: {
            ...col.shelves!,
            spacings: updatedShelves,
          },
        };
      }
      return col;
    });

    handleUpdateSection(sectionKey, { columns: updatedColumns });
  };

  /**
   * Get shelf spacing analysis for display
   */
  const getShelfSpacingAnalysis = (
    sectionKey: SectionKey,
    columnId: string
  ) => {
    const columnShelves = getColumnShelves(sectionKey, columnId);
    if (!columnShelves) return null;

    const positions = [
      0,
      ...columnShelves.shelves.map((s) => s.position),
      columnShelves.totalHeight,
    ].sort((a, b) => a - b);

    const spacings = [];
    for (let i = 0; i < positions.length - 1; i++) {
      const spacing = positions[i + 1] - positions[i];
      spacings.push({
        from: positions[i],
        to: positions[i + 1],
        height: spacing,
        isValid: spacing >= MIN_SHELF_SPACING,
        isOptimal: spacing >= 20 && spacing <= 50, // Optimal range for storage
      });
    }

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

    // Shelf management
    addShelfToColumn,
    removeShelfFromColumn,
    moveShelf,

    // Utilities
    isValidShelfPosition,
    getShelfPositionRange,
    redistributeShelvesEvenly,
    getShelfSpacingAnalysis,

    // Constants
    MIN_SHELF_SPACING,
    DEFAULT_SHELF_THICKNESS,
    MIN_BOTTOM_SPACING,
    MIN_TOP_SPACING,
  };
};
