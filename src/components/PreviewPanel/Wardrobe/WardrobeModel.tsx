// src/components/Wardrobe/WardrobeModel.tsx
import React, { useRef } from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";
import { useConfig } from "../../context/WardrobeContext";
import LinearWardrobe from "./LinearWardrobe";
import AngleWardrobe from "./AngleWardrobe";
import FormeUWardrobe from "./FormeUWardrobe";
import WardrobeInteractions from "./WardrobeInteractions";
import BaseBar from "./BaseBar";

interface WardrobeModelProps {
  showMeasurements?: boolean;
}

const WardrobeModel: React.FC<WardrobeModelProps> = () => {
  const { config } = useConfig();
  const groupRef = useRef<THREE.Group>(null);
  const texture = useLoader(TextureLoader, config.texture.src);

  // Get current wardrobe type data
  const currentWardrobeType = config.wardrobeType;

  // Convert sections from cm to meters while preserving all properties
  const sectionsInMeters = {
    ...currentWardrobeType,
    sections: {
      sectionA: {
        ...currentWardrobeType.sections.sectionA,
        width: currentWardrobeType.sections.sectionA.width / 100,
        depth: currentWardrobeType.sections.sectionA.depth / 100,
        // Convert column widths to meters too
        columns: currentWardrobeType.sections.sectionA.columns.map((col) => ({
          ...col,
          width: col.width / 100,
        })),
      },
      sectionB: currentWardrobeType.sections.sectionB
        ? {
            ...currentWardrobeType.sections.sectionB,
            width: currentWardrobeType.sections.sectionB.width / 100,
            depth: currentWardrobeType.sections.sectionB.depth / 100,
            columns: currentWardrobeType.sections.sectionB.columns.map(
              (col) => ({
                ...col,
                width: col.width / 100,
              })
            ),
          }
        : undefined,
      sectionC: currentWardrobeType.sections.sectionC
        ? {
            ...currentWardrobeType.sections.sectionC,
            width: currentWardrobeType.sections.sectionC.width / 100,
            depth: currentWardrobeType.sections.sectionC.depth / 100,
            columns: currentWardrobeType.sections.sectionC.columns.map(
              (col) => ({
                ...col,
                width: col.width / 100,
              })
            ),
          }
        : undefined,
    },
  };

  // Convert thickness from cm to meters
  const thickness = config.thickness / 100;
  // Convert height from cm to meters
  const height = config.height / 100;
  // Convert base bar height from cm to meters
  const baseBarHeight = config.baseBarHeight / 100;

  const ledColor = config.ledColor;

  // Common props for all wardrobe types
  const commonProps = {
    sections: sectionsInMeters.sections, // Pass sections object, not the whole wardrobe type
    baseBarHeight,
    thickness,
    height,
    texture,
    showSections: config.showSections,
    ledColor,
  };

  // For BaseBar, create a simplified sections object (only width/depth needed)
  const baseBarSections = {
    sectionA: {
      width: sectionsInMeters.sections.sectionA.width,
      depth: sectionsInMeters.sections.sectionA.depth,
    },
    sectionB: sectionsInMeters.sections.sectionB
      ? {
          width: sectionsInMeters.sections.sectionB.width,
          depth: sectionsInMeters.sections.sectionB.depth,
        }
      : undefined,
    sectionC: sectionsInMeters.sections.sectionC
      ? {
          width: sectionsInMeters.sections.sectionC.width,
          depth: sectionsInMeters.sections.sectionC.depth,
        }
      : undefined,
  };

  // Render appropriate wardrobe type
  const renderWardrobeType = () => {
    switch (currentWardrobeType.id) {
      case "Linéaire":
        return <LinearWardrobe {...commonProps} />;

      case "Angle":
        return <AngleWardrobe {...commonProps} />;

      case "Forme U":
        return <FormeUWardrobe {...commonProps} />;

      default:
        return null;
    }
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Base Bar - chân tủ */}
      <BaseBar
        sections={baseBarSections}
        baseBarHeight={baseBarHeight}
        height={height}
        texture={texture}
        wardrobeType={currentWardrobeType.id}
      />
      {/* Main wardrobe structure */}
      {renderWardrobeType()}

      {/* Interactive behaviors */}
      <WardrobeInteractions />
    </group>
  );
};

export default WardrobeModel;
