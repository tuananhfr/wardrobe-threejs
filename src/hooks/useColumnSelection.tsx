// src/hooks/useColumnSelection.ts
import { useState, useCallback } from "react";

interface SelectedColumnInfo {
  sectionKey: SectionKey;
  columnId: string;
  columnIndex: number;
}

export const useColumnSelection = () => {
  const [selectedColumn, setSelectedColumn] =
    useState<SelectedColumnInfo | null>(null);
  const [isEtagereMode, setIsEtagereMode] = useState(false);

  const selectColumn = useCallback(
    (sectionKey: SectionKey, columnId: string, columnIndex: number) => {
      setSelectedColumn({
        sectionKey,
        columnId,
        columnIndex,
      });
    },
    []
  );

  const clearSelection = useCallback(() => {
    setSelectedColumn(null);
  }, []);

  const toggleEtagereMode = useCallback((enabled: boolean) => {
    setIsEtagereMode(enabled);
    if (!enabled) {
      setSelectedColumn(null); // Clear selection when exiting mode
    }
  }, []);

  const isColumnSelected = useCallback(
    (columnId: string) => {
      return selectedColumn?.columnId === columnId;
    },
    [selectedColumn]
  );

  const getSelectedColumnInfo = useCallback(() => {
    return selectedColumn;
  }, [selectedColumn]);

  return {
    selectedColumn,
    isEtagereMode,
    selectColumn,
    clearSelection,
    toggleEtagereMode,
    isColumnSelected,
    getSelectedColumnInfo,
  };
};
