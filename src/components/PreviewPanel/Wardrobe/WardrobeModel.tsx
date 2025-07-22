// src/components/Wardrobe/WardrobeModel.tsx
import React, { useRef } from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";
import { useConfig } from "../../context/WardrobeContext";
import WardrobeFrame from "./WardrobeFrame";
import WardrobeShelves from "./WardrobeShelves";
import WardrobeDoors from "./WardrobeDoors";
import WardrobeDrawer from "./WardrobeDrawer";
import WardrobeMeasurements from "./WardrobeMeasurements";
import WardrobeInteractions from "./WardrobeInteractions";

interface WardrobeModelProps {
  showMeasurements?: boolean;
}

const WardrobeModel: React.FC<WardrobeModelProps> = ({
  showMeasurements = false,
}) => {
  const { config } = useConfig();
  const groupRef = useRef<THREE.Group>(null);
  const texture = useLoader(TextureLoader, config.texture.src);

  // Convert dimensions from mm to meters
  const width = config.width / 100;
  const height = config.height / 100;
  const depth = config.depth / 100;
  const thickness = config.thickness / 100;

  // Calculate sections
  const leftSectionWidth = (width - 3 * thickness) / 2;
  const rightSectionWidth = (width - 3 * thickness) / 2;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main wardrobe structure */}
      <group>
        {/* Frame structure (sides, top, bottom, back, divider) */}
        <WardrobeFrame
          width={width}
          height={height}
          depth={depth}
          thickness={thickness}
          texture={texture}
        />

        {/* Shelves for both sections */}
        <WardrobeShelves
          width={width}
          height={height}
          depth={depth}
          thickness={thickness}
          leftSectionWidth={leftSectionWidth}
          rightSectionWidth={rightSectionWidth}
          texture={texture}
        />

        {/* Drawer in left section */}
        {/* <WardrobeDrawer
          width={width}
          height={height}
          depth={depth}
          thickness={thickness}
          leftSectionWidth={leftSectionWidth}
          texture={texture}
        /> */}

        {/* Doors for both sections */}
        {/* <WardrobeDoors
          width={width}
          height={height}
          depth={depth}
          thickness={thickness}
          leftSectionWidth={leftSectionWidth}
          rightSectionWidth={rightSectionWidth}
          texture={texture}
        /> */}
      </group>

      {/* Measurements (when enabled) */}
      {showMeasurements && (
        <WardrobeMeasurements width={width} height={height} depth={depth} />
      )}

      {/* Interactive behaviors */}
      <WardrobeInteractions />
    </group>
  );
};

export default WardrobeModel;
