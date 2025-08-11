import * as THREE from "three";
declare global {
  // Định nghĩa kiểu cho context
  interface WardrobeContextType {
    config: WardrobeState;
    updateConfig: <K extends keyof WardrobeState>(
      key: K,
      value: WardrobeState[K]
    ) => void;
    batchUpdate: (updates: Partial<WardrobeState>) => void;
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
    selectedColumnId: string | null;
    hoveredColumnId: string | null;
    selectedSpacingId: string | null;
    hoveredSpacingId: string | null;
    selectedInternalEquipmentType: "vide" | "trigle" | null;
    internalEquipmentConfig: { [spacingId: string]: "vide" | "trigle" };

    ledColor: string;
    showMeasurements: boolean;
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
