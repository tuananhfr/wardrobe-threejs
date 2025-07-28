// src/hooks/useWardrobeConfig.ts

import { useConfig } from "@/components/context/WardrobeContext";

export const useWardrobeConfig = () => {
  const { config, updateConfig } = useConfig();

  // Helper function để update section
  const handleUpdateSection = (
    sectionKey: SectionKey,
    newData: Partial<WardrobeSection>
  ) => {
    const oldSection = config.wardrobeType.sections[sectionKey] || {};
    const newSections = {
      ...config.wardrobeType.sections,
      [sectionKey]: {
        ...oldSection,
        ...newData,
      },
    };

    updateConfig("wardrobeType", {
      ...config.wardrobeType,
      sections: newSections,
    });
  };

  // Helper function để auto-adjust columns khi section width thay đổi
  const autoAdjustColumnsForSectionWidth = (
    currentColumns: WardrobeColumn[],
    newSectionWidth: number,
    thickness: number,
    sectionKey: SectionKey,
    maxColumns: number
  ): WardrobeColumn[] => {
    const updatedColumns = [...currentColumns];

    // Tính minimum columns cần thiết để không có column nào > 120cm
    const availableWidthForColumns = newSectionWidth - thickness;
    const minColumnsNeeded = Math.ceil(
      availableWidthForColumns / (120 + thickness)
    );

    // Thêm columns nếu cần
    while (
      updatedColumns.length < minColumnsNeeded &&
      updatedColumns.length < maxColumns
    ) {
      const nextColumnNumber = updatedColumns.length + 1;
      const newColumnId = `${sectionKey}-col-${nextColumnNumber}`;

      updatedColumns.push({
        id: newColumnId,
        width: 60, // Default width, sẽ được redistribute sau
      });
    }

    // Redistribute widths đều cho tất cả columns
    const totalAvailableWidth =
      newSectionWidth - (updatedColumns.length + 1) * thickness;
    const distributedWidth = Math.floor(
      totalAvailableWidth / updatedColumns.length
    );
    const extraWidth = totalAvailableWidth % updatedColumns.length;

    return updatedColumns.map((col, index) => ({
      ...col,
      width: Math.max(
        30,
        Math.min(120, distributedWidth + (index < extraWidth ? 1 : 0))
      ),
    }));
  };

  // Helper function để handle section width change với auto column adjustment
  const handleSectionWidthChange = (
    sectionKey: SectionKey,
    newWidth: number
  ) => {
    const currentSection = config.wardrobeType.sections[sectionKey];
    if (!currentSection) return;

    // Auto-adjust columns cho width mới
    const adjustedColumns = autoAdjustColumnsForSectionWidth(
      currentSection.columns,
      newWidth,
      config.thickness,
      sectionKey,
      currentSection.maxColumns
    );

    // Update cả width và columns
    handleUpdateSection(sectionKey, {
      width: newWidth,
      columns: adjustedColumns,
    });
  };

  return {
    config,
    updateConfig,
    handleUpdateSection,
    handleSectionWidthChange,
  };
};
