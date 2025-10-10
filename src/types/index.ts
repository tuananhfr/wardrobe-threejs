import * as THREE from "three";
declare global {
  // Định nghĩa kiểu cho context
  interface WardrobeContextType {
    config: WardrobeState;

    // Config functions - KHÔNG lưu history
    updateConfig: <K extends keyof WardrobeState>(
      key: K,
      value: WardrobeState[K]
    ) => void;
    batchUpdate: (updates: Partial<WardrobeState>) => void;

    // Undo/Redo functions - CÓ lưu history
    updateConfigWithHistory: <K extends keyof WardrobeState>(
      key: K,
      value: WardrobeState[K]
    ) => void;
    batchUpdateWithHistory: (updates: Partial<WardrobeState>) => void;
    undo: () => void;
    undoCount: number;
    canUndo: boolean;
    saveToHistory: () => void;
  }

  interface WardrobeState {
    wardrobeTypeListTemplate: WardrobeType[];
    wardrobeType: WardrobeType;
    height: number;
    thickness: number;
    baseBarHeight: number;
    price: number;
    originalPrice: number;
    texture: Texture;
    textures: Texture[];
    activeView: string;
    showSections: string;
    accordionOpen: string;
    // EtagereColumnHighlights states
    selectedColumnId: string | null;
    hoveredColumnId: string | null;

    // FacadeHighlight states
    selectedFacadeSpacingIds: string[];
    hoveredFacadeSpacingId: string | null;

    // DoorsDrawersHighlights states
    selectedDoorsDrawersSpacingIds: string[];
    hoveredDoorsDrawersSpacingId: string | null;

    // InternalEquipmentSpacingHighlights states
    selectedInternalEquipmentSpacingId: string | null;
    hoveredInternalEquipmentSpacingId: string | null;

    // SectionShelves states
    selectedShelvesSpacingIds: string[];
    hoveredShelvesSpacingId: string | null;
    selectedInternalEquipmentType:
      | "vide"
      | "trigle"
      | "penderieEscamotable"
      | "doubleRail"
      | "tiroirInterieur"
      | null;
    internalEquipmentConfig: {
      [spacingId: string]:
        | "vide"
        | "trigle"
        | "penderieEscamotable"
        | "doubleRail"
        | {
            type: "tiroirInterieur";
            items: Array<{ id: string; height: number; width: number }>;
          };
    };
    selectedDoorsDrawersType:
      | "vide"
      | "leftDoor"
      | "leftDoorVerre"
      | "rightDoor"
      | "rightDoorVerre"
      | "drawer"
      | "drawerVerre"
      | "doubleSwingDoor"
      | "doubleSwingDoorVerre"
      | "slidingDoor"
      | "slidingMirrorDoor"
      | "slidingGlassDoor"
      | null;
    doorsDrawersConfig: {
      [spacingId: string]:
        | "leftDoor"
        | "leftDoorVerre"
        | "rightDoor"
        | "rightDoorVerre"
        | "drawer"
        | "drawerVerre"
        | "doubleSwingDoor"
        | "doubleSwingDoorVerre"
        | "slidingDoor"
        | "slidingMirrorDoor"
        | "slidingGlassDoor";
    };

    handleType: "none" | "baton";
    handleConfig: {
      [spacingId: string]: "none" | "baton";
    };

    ledColor: string;
    showMeasurements: boolean;
    shelfTextureConfig: {
      [spacingId: string]: Texture;
    };
    facadeTextureConfig: {
      [spacingId: string]: Texture;
    };

    groupedDoorsConfig: {
      [groupId: string]: {
        spacingIds: string[];
        doorType: string;
        createdAt: number; // timestamp
      };
    };
  }

  interface Texture {
    name: string;
    src: string;
  }

  interface WardrobeSection {
    width: number;
    depth: number;
    columns: WardrobeColumn[];
    minColumns: number;
    maxColumns: number;

    hangingRods?: number;
  }

  interface WardrobeColumn {
    id: string;
    width: number;
    shelves?: WardrobeShelf;
  }
  interface WardrobeShelf {
    id: string;
    shelfSpacing?: number;
    spacings?: shelfSpacing[];
  }

  interface shelfSpacing {
    id: string;
    spacing: number;
  }

  type WardrobeId = "Linéaire" | "Angle" | "Forme U";
  type SectionKey = "sectionA" | "sectionB" | "sectionC";

  interface WardrobeType {
    id: WardrobeId;
    name: string;

    images: string;
    sections: {
      sectionA: WardrobeSection;
      sectionB?: WardrobeSection;
      sectionC?: WardrobeSection;
    };
  }

  interface SceneConfig {
    [key: string]: string | number | boolean | null | undefined;
  }

  interface OrbitControls {
    update: () => void;
    target: THREE.Vector3;
    enableDamping?: boolean;
    dampingFactor?: number;
  }

  interface Window {
    __THREE_SCENE__?: THREE.Scene | null;
    __THREE_CAMERA__?: THREE.Camera | null;
    __THREE_CONTROLS__?: OrbitControls | null;
    __THREE_SCENE_CONFIG__?: SceneConfig;
  }
}

export {};
