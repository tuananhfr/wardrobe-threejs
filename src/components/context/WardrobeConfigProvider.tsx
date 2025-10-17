import { ReactNode, useState, useRef, useCallback } from "react";
import { WardrobeContext } from "./WardrobeContext";

import oakTexture from "@/assets/images/textures/samples-oak-wood-effect-800x800.jpg";
import walnutTexture from "@/assets/images/textures/samples-walnut-wood-effect-800x800.jpg";
import wengeTexture from "@/assets/images/textures/samples-wenge-wood-effect-800x800.jpg";
import whiteTexture from "@/assets/images/textures/white_u11209.jpg";
import lightGreyTexture from "@/assets/images/textures/light_grey_u12044.jpg";
import taupeTexture from "@/assets/images/textures/taupe_u15133.jpg";
import { wardrobeTypeList } from "@/constants/wardrobeTypes";

const MAX_HISTORY = 100;
const DEBOUNCE_DELAY = 500; // 500ms

interface WardrobeConfigProviderProps {
  children: ReactNode;
}

const WardrobeConfigProvider = ({ children }: WardrobeConfigProviderProps) => {
  const textures = [
    { name: "Oak", src: oakTexture },
    { name: "Walnut", src: walnutTexture },
    { name: "Wenge", src: wengeTexture },
    { name: "White", src: whiteTexture },
    { name: "Light Grey", src: lightGreyTexture },
    { name: "Taupe", src: taupeTexture },
  ];

  // Config state
  const [config, setConfig] = useState<WardrobeState>({
    wardrobeTypeListTemplate: wardrobeTypeList,
    wardrobeType: wardrobeTypeList[0],
    height: 180,
    thickness: 2,
    baseBarHeight: 7,
    price: 0,
    originalPrice: 0,
    texture: textures[0],
    textures: textures,
    ledColor: "",
    showMeasurements: false,
    showSections: "",
    accordionOpen: "collapseType",
    selectedColumnId: null,
    hoveredColumnId: null,
    selectedFacadeSpacingIds: [],
    hoveredFacadeSpacingId: null,
    selectedDoorsDrawersSpacingIds: [],
    hoveredDoorsDrawersSpacingId: null,
    selectedInternalEquipmentSpacingId: null,
    hoveredInternalEquipmentSpacingId: null,
    selectedShelvesSpacingIds: [],
    hoveredShelvesSpacingId: null,
    selectedInternalEquipmentType: null,
    internalEquipmentConfig: {},
    selectedDoorsDrawersType: null,
    doorsDrawersConfig: {},
    handleType: "none",
    handleConfig: {},
    shelfTextureConfig: {},
    facadeTextureConfig: {},
    activeView: "entier",
    groupedDoorsConfig: {},
  });

  // Undo/Redo state
  const historyRef = useRef<WardrobeState[]>([]);
  const configRef = useRef<WardrobeState>(config);
  const [historyCount, setHistoryCount] = useState(0);

  // Debounce timer refs - theo dõi từng field riêng biệt
  const debounceTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const pendingConfigRef = useRef<WardrobeState | null>(null);

  // Cập nhật ref mỗi khi config thay đổi
  configRef.current = config;

  // ==================== CONFIG FUNCTIONS ====================

  // Hàm cập nhật cấu hình - KHÔNG lưu history
  const updateConfig = useCallback(
    <K extends keyof WardrobeState>(key: K, value: WardrobeState[K]) => {
      setConfig((prevConfig) => ({
        ...prevConfig,
        [key]: value,
      }));
    },
    []
  );

  // Hàm cập nhật nhiều thuộc tính cùng lúc - KHÔNG lưu history
  const batchUpdate = useCallback((updates: Partial<WardrobeState>) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      ...updates,
    }));
  }, []);

  // ==================== UNDO/REDO FUNCTIONS ====================

  // Lưu config hiện tại vào lịch sử
  const saveToHistory = useCallback(() => {
    const configSnapshot = JSON.parse(
      JSON.stringify(configRef.current)
    ) as WardrobeState;
    historyRef.current.unshift(configSnapshot);

    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.pop();
    }

    setHistoryCount(historyRef.current.length);
  }, []);

  // updateConfig CÓ LƯU HISTORY - Lưu ngay lập tức
  const updateConfigWithHistory = useCallback(
    <K extends keyof WardrobeState>(key: K, value: WardrobeState[K]) => {
      saveToHistory();
      updateConfig(key, value);
    },
    [saveToHistory, updateConfig]
  );

  // batchUpdate CÓ LƯU HISTORY - Lưu ngay lập tức
  const batchUpdateWithHistory = useCallback(
    (updates: Partial<WardrobeState>) => {
      saveToHistory();
      batchUpdate(updates);
    },
    [saveToHistory, batchUpdate]
  );

  // updateConfig CÓ LƯU HISTORY + DEBOUNCED - Dùng cho input number
  const updateConfigWithHistoryDebounced = useCallback(
    <K extends keyof WardrobeState>(
      key: K,
      value: WardrobeState[K],
      delay: number = DEBOUNCE_DELAY
    ) => {
      // Clear timer cũ cho field này
      if (debounceTimersRef.current[key as string]) {
        clearTimeout(debounceTimersRef.current[key as string]);
      }

      // Nếu đây là lần đầu tiên thay đổi field này (chưa có pending), lưu snapshot
      if (!pendingConfigRef.current) {
        pendingConfigRef.current = JSON.parse(
          JSON.stringify(configRef.current)
        ) as WardrobeState;
      }

      // Cập nhật config ngay (để UI responsive)
      updateConfig(key, value);

      // Set timer mới để lưu history sau delay
      debounceTimersRef.current[key as string] = setTimeout(() => {
        // Lưu snapshot vào history (config TRƯỚC KHI thay đổi)
        if (pendingConfigRef.current) {
          historyRef.current.unshift(pendingConfigRef.current);

          if (historyRef.current.length > MAX_HISTORY) {
            historyRef.current.pop();
          }

          setHistoryCount(historyRef.current.length);

          // Reset pending
          pendingConfigRef.current = null;
        }

        // Cleanup timer
        delete debounceTimersRef.current[key as string];
      }, delay);
    },
    [updateConfig]
  );

  // Hàm undo
  const undo = useCallback(() => {
    if (historyRef.current.length === 0) {
      return;
    }

    // Clear tất cả debounce timers đang chờ
    Object.values(debounceTimersRef.current).forEach((timer) =>
      clearTimeout(timer)
    );
    debounceTimersRef.current = {};
    pendingConfigRef.current = null;

    const previousConfig = historyRef.current.shift();
    setHistoryCount(historyRef.current.length);

    if (previousConfig) {
      batchUpdate(previousConfig);
    }
  }, [batchUpdate]);

  // ==================== CONTEXT VALUE ====================

  const contextValue = {
    config,
    updateConfig,
    batchUpdate,
    // Undo/Redo
    updateConfigWithHistory,
    batchUpdateWithHistory,
    updateConfigWithHistoryDebounced,
    undo,
    undoCount: historyCount,
    canUndo: historyCount > 0,
    saveToHistory,
  };

  return (
    <WardrobeContext.Provider value={contextValue}>
      {children}
    </WardrobeContext.Provider>
  );
};

export default WardrobeConfigProvider;
