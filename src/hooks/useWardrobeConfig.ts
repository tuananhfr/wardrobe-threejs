// src/hooks/useWardrobeConfig.ts (Updated with L-Shape constraints)

import { useConfig } from "@/components/context/WardrobeContext";

export const useWardrobeConfig = () => {
  const { config, updateConfig } = useConfig();

  // ===== L-SHAPE CONSTRAINT HELPERS =====

  const getLShapeConstraints = (
    wardrobeType: WardrobeType,
    sectionKey: SectionKey
  ): {
    isCornerSection: boolean;
    cornerType?: "first" | "last" | "both";
    adjacentSectionDepth?: number;
    minLastColumnWidth?: number;
    minFirstColumnWidth?: number;
  } => {
    const { sections } = wardrobeType;

    // L-Shape (Angle): Section A corner constraint với Section B
    if (wardrobeType.id === "Angle" && sectionKey === "sectionA") {
      if (sections.sectionB) {
        return {
          isCornerSection: true,
          adjacentSectionDepth: sections.sectionB.depth,
          cornerType: "last",
          minLastColumnWidth: Math.max(
            30,
            sections.sectionB.depth - 2 * config.thickness + 30
          ),
        };
      }
    }

    // U-Shape (Forme U): Chỉ Section A có dual corner constraints
    if (wardrobeType.id === "Forme U" && sectionKey === "sectionA") {
      if (sections.sectionB && sections.sectionC) {
        return {
          isCornerSection: true,
          cornerType: "both",
          // First column constraint từ Section B
          minFirstColumnWidth: Math.max(
            30,
            sections.sectionB.depth - 2 * config.thickness + 30
          ),
          // Last column constraint từ Section C
          minLastColumnWidth: Math.max(
            30,
            sections.sectionC.depth - 2 * config.thickness + 30
          ),
          // For display - use one of the depths (they should be same)
          adjacentSectionDepth: sections.sectionB.depth,
        };
      }
    }

    return { isCornerSection: false };
  };

  // ===== CALCULATION HELPERS WITH L-SHAPE =====

  const calculateMinColumns = (
    sectionWidth: number,
    thickness: number,
    sectionKey: SectionKey,
    wardrobeType?: WardrobeType
  ): number => {
    const currentWardrobeType = wardrobeType || config.wardrobeType;

    const lshapeConstraints = getLShapeConstraints(
      currentWardrobeType,
      sectionKey
    );

    if (!lshapeConstraints.isCornerSection) {
      // Normal calculation
      const singleColumnWidth = sectionWidth - 2 * thickness;
      if (singleColumnWidth <= 120 && singleColumnWidth >= 30) {
        return 1;
      }
      return Math.max(
        1,
        Math.ceil((sectionWidth - thickness) / (120 + thickness))
      );
    }

    // Corner section calculation
    const singleColumnWidth = sectionWidth - 2 * thickness;

    // Handle different corner types
    if (lshapeConstraints.cornerType === "both") {
      // U-Shape: Both first and last column constraints
      const firstConstraint = lshapeConstraints.minFirstColumnWidth!;
      const lastConstraint = lshapeConstraints.minLastColumnWidth!;
      const maxConstraint = Math.max(firstConstraint, lastConstraint);

      if (singleColumnWidth >= maxConstraint && singleColumnWidth <= 120) {
        return 1;
      }
    } else {
      // Single constraint (first or last)
      const constraintWidth =
        lshapeConstraints.cornerType === "last"
          ? lshapeConstraints.minLastColumnWidth!
          : lshapeConstraints.minFirstColumnWidth!;

      if (singleColumnWidth >= constraintWidth && singleColumnWidth <= 120) {
        return 1;
      }
    }

    // Find minimum columns needed for multiple columns
    let minColumns = 2;
    while (minColumns <= 20) {
      if (lshapeConstraints.cornerType === "both") {
        // Both first and last column constraints (U-Shape Section A)
        const normalColumnsCount = minColumns - 2; // Exclude first and last
        const firstConstraint = lshapeConstraints.minFirstColumnWidth!;
        const lastConstraint = lshapeConstraints.minLastColumnWidth!;
        const maxNormalColumnsWidth = Math.max(0, normalColumnsCount * 120);
        const totalWidth =
          firstConstraint +
          maxNormalColumnsWidth +
          lastConstraint +
          (minColumns + 1) * thickness;

        if (totalWidth >= sectionWidth) {
          break;
        }
      } else if (lshapeConstraints.cornerType === "last") {
        // Last column constraint only
        const normalColumnsCount = minColumns - 1;
        const constraintWidth = lshapeConstraints.minLastColumnWidth!;
        const maxNormalColumnsWidth = normalColumnsCount * 120;
        const totalWidth =
          maxNormalColumnsWidth +
          constraintWidth +
          (minColumns + 1) * thickness;

        if (totalWidth >= sectionWidth) {
          break;
        }
      } else if (lshapeConstraints.cornerType === "first") {
        // First column constraint only
        const normalColumnsCount = minColumns - 1;
        const constraintWidth = lshapeConstraints.minFirstColumnWidth!;
        const maxNormalColumnsWidth = normalColumnsCount * 120;
        const totalWidth =
          constraintWidth +
          maxNormalColumnsWidth +
          (minColumns + 1) * thickness;

        if (totalWidth >= sectionWidth) {
          break;
        }
      }

      minColumns++;
    }

    return Math.max(1, minColumns);
  };

  const calculateMaxColumns = (
    sectionWidth: number,
    thickness: number,
    sectionKey: SectionKey,
    wardrobeType?: WardrobeType
  ): number => {
    const currentWardrobeType = wardrobeType || config.wardrobeType;

    const lshapeConstraints = getLShapeConstraints(
      currentWardrobeType,
      sectionKey
    );

    if (!lshapeConstraints.isCornerSection) {
      // Normal calculation
      return Math.max(
        1,
        Math.floor((sectionWidth - thickness) / (30 + thickness))
      );
    }

    // Corner section calculation
    let availableForNormalColumns = 0;
    let maxColumns = 0;

    if (lshapeConstraints.cornerType === "both") {
      // Both constraints: reserve space for first and last columns
      const firstConstraint = lshapeConstraints.minFirstColumnWidth!;
      const lastConstraint = lshapeConstraints.minLastColumnWidth!;
      availableForNormalColumns =
        sectionWidth - firstConstraint - lastConstraint - 2 * thickness;

      if (availableForNormalColumns < 0) {
        // Not enough space even for 2 corner columns
        return 1; // Fall back to single column
      }

      const maxNormalColumns = Math.floor(
        availableForNormalColumns / (30 + thickness)
      );
      maxColumns = Math.max(2, maxNormalColumns + 2); // +2 for first and last, minimum 2
    } else {
      // Single constraint
      const constraintWidth =
        lshapeConstraints.cornerType === "last"
          ? lshapeConstraints.minLastColumnWidth!
          : lshapeConstraints.minFirstColumnWidth!;

      availableForNormalColumns =
        sectionWidth - constraintWidth - 2 * thickness;

      if (availableForNormalColumns < 0) {
        // Not enough space even for 1 corner column
        return 1; // Fall back to single column
      }

      const maxNormalColumns = Math.floor(
        availableForNormalColumns / (30 + thickness)
      );
      maxColumns = maxNormalColumns + 1; // +1 for the constrained column
    }

    return Math.max(1, maxColumns);
  };

  const generateOptimalColumns = (
    columnCount: number,
    sectionWidth: number,
    thickness: number,
    sectionKey: SectionKey,
    existingColumns: WardrobeColumn[] = []
  ): WardrobeColumn[] => {
    const lshapeConstraints = getLShapeConstraints(
      config.wardrobeType,
      sectionKey
    );

    if (!lshapeConstraints.isCornerSection) {
      // Normal distribution
      const totalSeparatorWidth = (columnCount + 1) * thickness;
      const availableColumnWidth = sectionWidth - totalSeparatorWidth;
      const baseWidth = Math.floor(availableColumnWidth / columnCount);
      const remainder = availableColumnWidth % columnCount;

      const newColumns: WardrobeColumn[] = [];
      for (let i = 0; i < columnCount; i++) {
        const existingColumn = existingColumns[i];
        const columnId = existingColumn?.id || `${sectionKey}-col-${i + 1}`;
        const optimalWidth = baseWidth + (i < remainder ? 1 : 0);
        const clampedWidth = Math.max(30, Math.min(120, optimalWidth));

        newColumns.push({ id: columnId, width: clampedWidth });
      }
      return newColumns;
    }

    // Corner section distribution
    if (lshapeConstraints.cornerType === "both") {
      // U-Shape Section A: Both first and last column constraints
      const constraintWidthFirst = lshapeConstraints.minFirstColumnWidth!;
      const constraintWidthLast = lshapeConstraints.minLastColumnWidth!;

      if (columnCount === 1) {
        const singleWidth = sectionWidth - 2 * thickness;
        const maxConstraint = Math.max(
          constraintWidthFirst,
          constraintWidthLast
        );
        const clampedWidth = Math.max(
          maxConstraint,
          Math.min(120, singleWidth)
        );

        return [
          {
            id: existingColumns[0]?.id || `${sectionKey}-col-1`,
            width: clampedWidth,
          },
        ];
      }

      if (columnCount === 2) {
        // Only first and last columns, check if they fit
        const totalNeeded =
          constraintWidthFirst + constraintWidthLast + 3 * thickness;
        if (totalNeeded > sectionWidth) {
          console.warn(
            `Not enough space for both corner constraints: ${totalNeeded}cm > ${sectionWidth}cm`
          );
          // Fallback: distribute available space proportionally
          const availableSpace = sectionWidth - 3 * thickness;
          const total = constraintWidthFirst + constraintWidthLast;
          const firstWidth = Math.max(
            30,
            Math.min(
              120,
              Math.floor((constraintWidthFirst / total) * availableSpace)
            )
          );
          const lastWidth = Math.max(
            30,
            Math.min(120, availableSpace - firstWidth)
          );

          return [
            {
              id: existingColumns[0]?.id || `${sectionKey}-col-1`,
              width: firstWidth,
            },
            {
              id: existingColumns[1]?.id || `${sectionKey}-col-2`,
              width: lastWidth,
            },
          ];
        }

        return [
          {
            id: existingColumns[0]?.id || `${sectionKey}-col-1`,
            width: constraintWidthFirst,
          },
          {
            id: existingColumns[1]?.id || `${sectionKey}-col-2`,
            width: constraintWidthLast,
          },
        ];
      }

      // Multiple columns: first + normal columns + last
      const totalSeparatorWidth = (columnCount + 1) * thickness;
      const availableSpaceForColumns = sectionWidth - totalSeparatorWidth;
      const normalColumnsCount = columnCount - 2; // Exclude first and last
      const remainingSpaceForNormalColumns =
        availableSpaceForColumns - constraintWidthFirst - constraintWidthLast;

      if (remainingSpaceForNormalColumns < normalColumnsCount * 30) {
        console.warn(
          `Not enough space for normal columns: ${remainingSpaceForNormalColumns}cm for ${normalColumnsCount} columns`
        );
        // Fallback to fewer columns
        return generateOptimalColumns(
          columnCount - 1,
          sectionWidth,
          thickness,
          sectionKey,
          existingColumns
        );
      }

      const baseWidthForNormal = Math.floor(
        remainingSpaceForNormalColumns / normalColumnsCount
      );
      const remainderForNormal =
        remainingSpaceForNormalColumns % normalColumnsCount;

      const newColumns: WardrobeColumn[] = [];

      // First column with constraint
      newColumns.push({
        id: existingColumns[0]?.id || `${sectionKey}-col-1`,
        width: constraintWidthFirst,
      });

      // Normal columns (between first and last)
      for (let i = 1; i < columnCount - 1; i++) {
        const existingColumn = existingColumns[i];
        const columnId = existingColumn?.id || `${sectionKey}-col-${i + 1}`;
        const normalIndex = i - 1;
        const width =
          baseWidthForNormal + (normalIndex < remainderForNormal ? 1 : 0);

        newColumns.push({
          id: columnId,
          width: Math.max(30, Math.min(120, width)),
        });
      }

      // Last column with constraint
      newColumns.push({
        id:
          existingColumns[columnCount - 1]?.id ||
          `${sectionKey}-col-${columnCount}`,
        width: constraintWidthLast,
      });

      return newColumns;
    }

    // Single constraint (first or last)
    const constraintWidth =
      lshapeConstraints.cornerType === "last"
        ? lshapeConstraints.minLastColumnWidth!
        : lshapeConstraints.minFirstColumnWidth!;

    if (columnCount === 1) {
      const singleWidth = sectionWidth - 2 * thickness;
      const clampedWidth = Math.max(
        constraintWidth,
        Math.min(120, singleWidth)
      );

      return [
        {
          id: existingColumns[0]?.id || `${sectionKey}-col-1`,
          width: clampedWidth,
        },
      ];
    }

    // Multiple columns with single corner constraint
    const totalSeparatorWidth = (columnCount + 1) * thickness;
    const availableSpaceForColumns = sectionWidth - totalSeparatorWidth;
    const normalColumnsCount = columnCount - 1;

    if (lshapeConstraints.cornerType === "last") {
      // Last column constraint
      const minSpaceForNormalColumns = normalColumnsCount * 30;

      if (
        availableSpaceForColumns <
        constraintWidth + minSpaceForNormalColumns
      ) {
        console.warn(
          `Not enough space for last column constraint: ${availableSpaceForColumns}cm < ${
            constraintWidth + minSpaceForNormalColumns
          }cm`
        );
        // Fallback: reduce constraint or column count
        return generateOptimalColumns(
          columnCount - 1,
          sectionWidth,
          thickness,
          sectionKey,
          existingColumns
        );
      }

      const maxLastColumnWidth = Math.min(
        120,
        availableSpaceForColumns - minSpaceForNormalColumns
      );
      const optimalLastColumnWidth = Math.max(
        constraintWidth,
        maxLastColumnWidth
      );

      const remainingSpaceForNormalColumns =
        availableSpaceForColumns - optimalLastColumnWidth;
      const baseWidthForNormal = Math.floor(
        remainingSpaceForNormalColumns / normalColumnsCount
      );
      const remainderForNormal =
        remainingSpaceForNormalColumns % normalColumnsCount;

      const newColumns: WardrobeColumn[] = [];

      // Normal columns (all except last)
      for (let i = 0; i < normalColumnsCount; i++) {
        const existingColumn = existingColumns[i];
        const columnId = existingColumn?.id || `${sectionKey}-col-${i + 1}`;
        const width = baseWidthForNormal + (i < remainderForNormal ? 1 : 0);

        newColumns.push({
          id: columnId,
          width: Math.max(30, Math.min(120, width)),
        });
      }

      // Last column with constraint
      const lastExistingColumn = existingColumns[normalColumnsCount];
      const lastColumnId =
        lastExistingColumn?.id || `${sectionKey}-col-${columnCount}`;

      newColumns.push({
        id: lastColumnId,
        width: optimalLastColumnWidth,
      });

      return newColumns;
    } else {
      // First column constraint
      const minSpaceForNormalColumns = normalColumnsCount * 30;

      if (
        availableSpaceForColumns <
        constraintWidth + minSpaceForNormalColumns
      ) {
        console.warn(
          `Not enough space for first column constraint: ${availableSpaceForColumns}cm < ${
            constraintWidth + minSpaceForNormalColumns
          }cm`
        );
        // Fallback: reduce constraint or column count
        return generateOptimalColumns(
          columnCount - 1,
          sectionWidth,
          thickness,
          sectionKey,
          existingColumns
        );
      }

      const maxFirstColumnWidth = Math.min(
        120,
        availableSpaceForColumns - minSpaceForNormalColumns
      );
      const optimalFirstColumnWidth = Math.max(
        constraintWidth,
        maxFirstColumnWidth
      );

      const remainingSpaceForNormalColumns =
        availableSpaceForColumns - optimalFirstColumnWidth;
      const baseWidthForNormal = Math.floor(
        remainingSpaceForNormalColumns / normalColumnsCount
      );
      const remainderForNormal =
        remainingSpaceForNormalColumns % normalColumnsCount;

      const newColumns: WardrobeColumn[] = [];

      // First column with constraint
      const firstExistingColumn = existingColumns[0];
      const firstColumnId = firstExistingColumn?.id || `${sectionKey}-col-1`;

      newColumns.push({
        id: firstColumnId,
        width: optimalFirstColumnWidth,
      });

      // Normal columns (all except first)
      for (let i = 1; i < columnCount; i++) {
        const existingColumn = existingColumns[i];
        const columnId = existingColumn?.id || `${sectionKey}-col-${i + 1}`;
        const normalIndex = i - 1;
        const width =
          baseWidthForNormal + (normalIndex < remainderForNormal ? 1 : 0);

        newColumns.push({
          id: columnId,
          width: Math.max(30, Math.min(120, width)),
        });
      }

      return newColumns;
    }
  };
  // ===== CORE UPDATE FUNCTION =====

  const handleUpdateSection = (
    sectionKey: SectionKey,
    newData: Partial<WardrobeSection>
  ) => {
    const currentSection = config.wardrobeType.sections[sectionKey];
    if (!currentSection) {
      return;
    }

    let updatedSectionData = { ...currentSection, ...newData };

    // AUTO-UPDATE: Nếu width thay đổi, tự động recalculate constraints và columns
    if (newData.width !== undefined && newData.width !== currentSection.width) {
      const newWidth = newData.width;
      const thickness = config.thickness;

      // Recalculate dynamic constraints với L-shape support
      const dynamicMinColumns = calculateMinColumns(
        newWidth,
        thickness,
        sectionKey,
        config.wardrobeType
      );
      const dynamicMaxColumns = calculateMaxColumns(
        newWidth,
        thickness,
        sectionKey,
        config.wardrobeType
      );

      // Determine optimal column count
      const currentColumnCount = currentSection.columns.length;
      let targetColumnCount: number;

      if (currentColumnCount < dynamicMinColumns) {
        // Need to add columns
        targetColumnCount = dynamicMinColumns;
      } else if (currentColumnCount > dynamicMaxColumns) {
        // Need to reduce columns
        targetColumnCount = dynamicMaxColumns;
      } else {
        // Keep current count, just redistribute
        targetColumnCount = currentColumnCount;
      }

      // Generate new columns with optimal distribution
      const newColumns = generateOptimalColumns(
        targetColumnCount,
        newWidth,
        thickness,
        sectionKey,
        currentSection.columns
      );

      // Update section data với new constraints và columns
      updatedSectionData = {
        ...updatedSectionData,
        minColumns: dynamicMinColumns,
        maxColumns: dynamicMaxColumns,
        columns: newColumns,
      };
    }

    // Update config
    const newSections = {
      ...config.wardrobeType.sections,
      [sectionKey]: updatedSectionData,
    };

    updateConfig("wardrobeType", {
      ...config.wardrobeType,
      sections: newSections,
    });
  };

  // ===== CONVENIENCE FUNCTIONS =====

  /**
   * Update section width - tự động recalculate everything
   */
  const handleSectionWidthChange = (
    sectionKey: SectionKey,
    newWidth: number
  ) => {
    handleUpdateSection(sectionKey, { width: newWidth });
  };

  /**
   * Update thickness - recalculate tất cả sections
   */
  const handleThicknessChange = (newThickness: number) => {
    // Update thickness first
    updateConfig("thickness", newThickness);

    // Then recalculate all sections
    Object.keys(config.wardrobeType.sections).forEach((key) => {
      const sectionKey = key as SectionKey;
      const section = config.wardrobeType.sections[sectionKey];

      if (section) {
        // Trigger recalculation by "changing" width to same value
        handleUpdateSection(sectionKey, { width: section.width });
      }
    });
  };

  /**
   * Initialize/refresh section constraints - dùng khi setup initial data
   */
  const refreshSectionConstraints = (sectionKey: SectionKey) => {
    const section = config.wardrobeType.sections[sectionKey];
    if (!section) return;

    const dynamicMinColumns = calculateMinColumns(
      section.width,
      config.thickness,
      sectionKey,
      config.wardrobeType
    );
    const dynamicMaxColumns = calculateMaxColumns(
      section.width,
      config.thickness,
      sectionKey,
      config.wardrobeType
    );

    // Validate current columns count
    let targetColumnCount = section.columns.length;
    if (targetColumnCount < dynamicMinColumns) {
      targetColumnCount = dynamicMinColumns;
    } else if (targetColumnCount > dynamicMaxColumns) {
      targetColumnCount = dynamicMaxColumns;
    }

    // Generate optimal columns if needed
    const newColumns =
      targetColumnCount !== section.columns.length
        ? generateOptimalColumns(
            targetColumnCount,
            section.width,
            config.thickness,
            sectionKey,
            section.columns
          )
        : section.columns;

    handleUpdateSection(sectionKey, {
      minColumns: dynamicMinColumns,
      maxColumns: dynamicMaxColumns,
      columns: newColumns,
    });
  };

  /**
   * Refresh tất cả sections - dùng khi app khởi động
   */
  const refreshAllSections = () => {
    Object.keys(config.wardrobeType.sections).forEach((key) => {
      refreshSectionConstraints(key as SectionKey);
    });
  };

  return {
    // Core functions
    config,
    updateConfig,
    handleUpdateSection,

    // Width management với auto-update
    handleSectionWidthChange,
    handleThicknessChange,

    // Refresh functions
    refreshSectionConstraints,
    refreshAllSections,

    // Calculation helpers (exported for useWardrobeColumns)
    calculateMinColumns,
    calculateMaxColumns,
    generateOptimalColumns,
    getLShapeConstraints,
  };
};
