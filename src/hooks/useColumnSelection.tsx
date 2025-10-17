import { useState, useCallback } from "react";

interface SelectedColumnInfo {
  sectionKey: SectionKey;
  columnId: string;
  columnIndex: number;
}

export const useColumnSelection = () => {
  const [selectedColumn, setSelectedColumn] =
    useState<SelectedColumnInfo | null>(null);
  const [isShelvesMode, setIsShelvesMode] = useState(false);

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

  const toggleShelvesMode = useCallback((enabled: boolean) => {
    setIsShelvesMode(enabled);
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
    isShelvesMode,
    selectColumn,
    clearSelection,
    toggleShelvesMode,
    isColumnSelected,
    getSelectedColumnInfo,
  };
};
