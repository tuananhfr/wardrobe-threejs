// src/components/context/WardrobeContext.tsx
import { createContext, useContext } from "react";

// Tạo context với giá trị mặc định là undefined
export const WardrobeContext = createContext<WardrobeContextType | undefined>(
  undefined
);

// Hook để sử dụng context
export const useConfig = () => {
  const context = useContext(WardrobeContext);
  if (context === undefined) {
    throw new Error("useConfig must be used within a WardrobeConfigProvider");
  }
  return context;
};

// Hook riêng cho undo/redo (alias cho dễ sử dụng)
export const useUndoRedo = () => {
  const context = useConfig();
  return {
    updateConfig: context.updateConfig,
    batchUpdate: context.batchUpdate,
    updateConfigWithHistory: context.updateConfigWithHistory,
    batchUpdateWithHistory: context.batchUpdateWithHistory,
    updateConfigWithHistoryDebounced: context.updateConfigWithHistoryDebounced, // ✨ NEW
    undo: context.undo,
    undoCount: context.undoCount,
    canUndo: context.canUndo,
    saveToHistory: context.saveToHistory,
  };
};
