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
    width: number;
    height: number;
    depth: number;
    thickness: number;
    price: number;
    originalPrice: number;
    texture: Texture;
    textures: Texture[];
    showMeasurements: boolean;
  }

  interface Texture {
    name: string;
    src: string;
  }

  interface WardrobeSection {
    width: number;
    height: number;
    depth: number;
  }

  export type WardrobeType = "straight" | "L-shaped" | "U-shaped";

  interface WardrobeTypeTemplate {
    value: WardrobeType;
    label: string;
    description: string;
    icon: string;
    sections: {
      sectionA: WardrobeSection;
      sectionB?: WardrobeSection;
      sectionC?: WardrobeSection;
    };
    defaultShelves: number;
    defaultDoorType: "swing" | "sliding" | "none";
  }
}

export {};
