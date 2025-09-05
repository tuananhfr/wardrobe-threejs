import React, { useRef } from "react";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RailRendererProps {
  sectionName: string;
  sectionData: WardrobeSection;
  height: number;
  baseBarHeight: number;
  thickness: number;
  texture: THREE.Texture;
}

const RailRenderer: React.FC<RailRendererProps> = ({
  sectionName,
  sectionData,
  height,
  baseBarHeight,
  thickness,
  texture,
}) => {
  const { config } = useWardrobeConfig();

  // Animation refs for tiroir intérieur
  const openedTiroirsRef = useRef<Record<string, boolean>>({});
  const tiroirGroupsRef = useRef<Record<string, THREE.Group>>({});
  const tiroirAnimsRef = useRef<Record<string, any>>({});

  // Easing function
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  // Function to check if animations should be disabled
  const shouldDisableAnimations = () => {
    // Trường hợp 1: Khi accordion Doors & Drawers đang mở
    if (config.accordionOpen === "collapseDoorsDrawers") {
      return true;
    }
    // Trường hợp 2: Khi accordion Internal Equipment đang mở
    if (config.accordionOpen === "collapseInternalEquipment") {
      return true;
    }

    // Trường hợp 3: Khi đang ở chế độ facades selection
    if (
      config.accordionOpen === "collapseTextures" &&
      config.activeView === "facades"
    ) {
      return true;
    }

    return false;
  };

  // Function to trigger tiroir animation
  const triggerTiroir = (key: string, open: boolean, baseZ: number) => {
    // Don't animate if animations are disabled
    if (shouldDisableAnimations()) {
      return;
    }

    const group = tiroirGroupsRef.current[key];
    if (!group) return;
    const currentZ = group.position.z;
    const travel = Math.min(sectionData.depth * 0.4, 0.4); // max 40cm
    const targetZ = open ? baseZ + travel : baseZ;

    const id = `${key}-${Date.now()}`;
    tiroirAnimsRef.current[id] = {
      key,
      startZ: currentZ,
      targetZ,
      startTime: Date.now(),
      duration: 300,
    };
  };

  // useEffect to close all tiroirs when accordion opens
  React.useEffect(() => {
    if (shouldDisableAnimations()) {
      // Close all tiroirs immediately when accordion opens
      Object.keys(openedTiroirsRef.current).forEach((key) => {
        if (openedTiroirsRef.current[key]) {
          const group = tiroirGroupsRef.current[key];
          if (group) {
            // Reset to base position
            const baseZ = parseFloat(group.position.z.toString()) - 0.4; // Assuming max travel is 0.4
            group.position.z = baseZ;
            openedTiroirsRef.current[key] = false;
          }
        }
      });
    }
  }, [config.accordionOpen]);

  // useFrame to step tiroir animations
  useFrame(() => {
    // Don't animate if animations are disabled
    if (shouldDisableAnimations()) {
      return;
    }

    const now = Date.now();

    // Tiroir animations
    Object.keys(tiroirAnimsRef.current).forEach((id) => {
      const anim = tiroirAnimsRef.current[id];
      const group = tiroirGroupsRef.current[anim.key];
      if (!group) return;
      const t = Math.min((now - anim.startTime) / anim.duration, 1);
      const v = easeOutCubic(t);
      const z = anim.startZ + (anim.targetZ - anim.startZ) * v;
      group.position.z = z;
      if (t >= 1) delete tiroirAnimsRef.current[id];
    });
  });

  // Function to get section texture
  const getSectionTexture = (spacingId: string): THREE.Texture => {
    // Kiểm tra xem spacing có texture riêng không
    const customTexture = config.facadeTextureConfig[spacingId];
    if (customTexture) {
      // Load custom texture
      const textureLoader = new THREE.TextureLoader();
      return textureLoader.load(customTexture.src);
    }
    // Sử dụng texture mặc định của section
    return texture;
  };

  // Get all spacing IDs that have rail equipment for this section
  const railSpacingIds = Object.entries(config.internalEquipmentConfig)
    .filter(([spacingId, equipmentVal]) => {
      const type =
        typeof equipmentVal === "string" ? equipmentVal : equipmentVal?.type;
      return (
        (type === "trigle" ||
          type === "penderieEscamotable" ||
          type === "doubleRail" ||
          type === "tiroirInterieur") &&
        spacingId.startsWith(sectionName)
      );
    })
    .map(([spacingId, equipmentVal]) => ({
      spacingId,
      equipmentType:
        typeof equipmentVal === "string" ? equipmentVal : equipmentVal?.type,
      equipmentVal,
    }));

  // Don't render if no rail equipment is configured for this section
  if (railSpacingIds.length === 0) {
    return null;
  }

  // Parse selected spacing ID to get column info
  const parseSpacingId = (spacingId: string) => {
    const parts = spacingId.split("-");

    // Handle format: "sectionA-col-1-spacing-3"
    let columnId: string;
    let spacingIndex: number;

    if (parts.length === 5 && parts[1] === "col" && parts[3] === "spacing") {
      // Format: "sectionA-col-1-spacing-3"
      columnId = `${parts[0]}-${parts[1]}-${parts[2]}`; // "sectionA-col-1"
      spacingIndex = parseInt(parts[4]); // 3
    } else {
      // Fallback to old format: "columnId-spacing-index"
      columnId = parts[0];
      spacingIndex = parseInt(parts[2]);
    }

    // Find column in this section
    let foundColumn: any = null;
    let foundColumnIndex: number = -1;

    if (sectionData && sectionData.columns) {
      const columnIndex = sectionData.columns.findIndex(
        (col: any) => col.id === columnId
      );
      if (columnIndex !== -1) {
        foundColumn = sectionData.columns[columnIndex];
        foundColumnIndex = columnIndex;
      }
    }
    return { foundColumn, foundColumnIndex, spacingIndex };
  };

  // Render all rails for configured rail equipment
  const renderRails = () => {
    return railSpacingIds.map(({ spacingId, equipmentType, equipmentVal }) => {
      const { foundColumn, foundColumnIndex, spacingIndex } =
        parseSpacingId(spacingId);

      if (!foundColumn) {
        return null;
      }

      // Calculate rail position
      const getRailPosition = () => {
        // Calculate column X position (same logic as InternalEquipmentSpacingHighlights)
        // Sections are already converted to meters
        let startX = -sectionData.width / 2 + thickness;

        for (let i = 0; i < foundColumnIndex; i++) {
          const colWidth = sectionData.columns[i].width; // Already in meters
          startX += colWidth + thickness;
        }
        const columnX = startX + foundColumn.width / 2; // Already in meters

        // Calculate rail Y position - 10cm from shelf or plafond
        const spacings = foundColumn.shelves?.spacings || [];
        if (spacings.length === 0) {
          // If no spacings, place rail 20cm from plafond
          const railY = height / 2 - 0.2; // 20cm from plafond
          const result = {
            x: columnX,
            y: railY,
            width: foundColumn.width, // Already in meters
            depth: sectionData.depth, // Already in meters
          };
          return result;
        }

        // Calculate position based on spacing - same logic as InternalEquipmentSpacingHighlights
        let currentY = baseBarHeight * 100; // Keep in cm for calculation
        for (let i = 0; i < spacingIndex; i++) {
          const spacing = spacings[i];
          currentY += spacing.spacing + thickness * 100; // Add spacing + thickness
        }

        // Get current spacing
        const spacing = spacings[spacingIndex];
        const spacingHeightCm = spacing.spacing;

        // Calculate center of spacing (same as highlight)
        const worldY =
          (currentY + spacingHeightCm) / 100 - height / 2 + 2 * thickness;

        // Position rail based on equipment type
        let railY;
        if (equipmentType === "doubleRail") {
          // For doubleRail: use spacing position (will render both rails at fixed positions)
          railY = worldY - 0.2;
        } else {
          // For regular rails: 20cm above center of spacing
          railY = worldY - 0.2;
        }

        const result = {
          x: columnX,
          y: railY,
          width: foundColumn.width, // Already in meters
          depth: sectionData.depth, // Already in meters
        };
        return result;
      };

      const railPosition = getRailPosition();

      if (!railPosition) {
        return null;
      }

      // Render tiroir intérieur
      if (equipmentType === "tiroirInterieur") {
        const tiroirDepth = railPosition.depth * 0.6; // Độ sâu của tiroir
        // Lấy cấu hình tiroir từ equipmentVal (object)
        const items =
          typeof equipmentVal === "object" &&
          equipmentVal?.type === "tiroirInterieur"
            ? equipmentVal.items
            : [];
        const tiroirHeight = (items[0]?.height || 15) / 100; // cm -> m
        const sideThickness = thickness * 0.5; // Độ dày thành bên
        const facadeZ = railPosition.depth / 2 - thickness / 3;
        // Tính đáy (bottom) của spacing này theo world Y
        let bottomYWorld = baseBarHeight * 100; // cm
        const spacingsForCol = foundColumn.shelves?.spacings || [];
        for (let i = 0; i < spacingIndex; i++) {
          const s = spacingsForCol[i];
          bottomYWorld += (s?.spacing || 0) + thickness * 100;
        }
        bottomYWorld = bottomYWorld / 100 - height / 2; // m

        // Render theo số lượng tiroir: xếp chồng từ đáy lên, gap cố định 2cm
        const gapY = 2 * thickness; // m
        const startY = bottomYWorld + tiroirHeight / 2; // m

        return (
          <group key={spacingId}>
            {items.map((_, idx) => {
              const y = startY + idx * (tiroirHeight + gapY);
              const key = `${spacingId}-tiroir-${idx + 1}`;
              return (
                <group
                  key={key}
                  position={[railPosition.x, y, facadeZ]}
                  ref={(ref) => {
                    if (ref) tiroirGroupsRef.current[key] = ref as any;
                  }}
                  onPointerOver={(e) => {
                    // Chỉ cho phép tiroir animation khi không bị disable
                    if (!shouldDisableAnimations()) {
                      e.stopPropagation();
                      triggerTiroir(key, true, facadeZ);
                    }
                  }}
                  onPointerOut={(e) => {
                    // Chỉ cho phép tiroir animation khi không bị disable
                    if (!shouldDisableAnimations()) {
                      e.stopPropagation();
                      triggerTiroir(key, false, facadeZ);
                    }
                  }}
                >
                  {/* Tiroir front panel */}
                  <mesh position={[0, 0, -thickness]}>
                    <boxGeometry
                      args={[
                        railPosition.width,
                        tiroirHeight + thickness,
                        thickness,
                      ]}
                    />
                    <meshStandardMaterial
                      map={getSectionTexture(spacingId)}
                      color="white"
                    />
                  </mesh>

                  {/* Left side panel */}
                  <mesh
                    position={[
                      -railPosition.width / 2 + sideThickness / 2,
                      0,
                      -tiroirDepth / 2 - thickness,
                    ]}
                  >
                    <boxGeometry
                      args={[sideThickness, tiroirHeight, tiroirDepth]}
                    />
                    <meshStandardMaterial
                      map={getSectionTexture(spacingId)}
                      color="white"
                    />
                  </mesh>

                  {/* Right side panel */}
                  <mesh
                    position={[
                      railPosition.width / 2 - sideThickness / 2,
                      0,
                      -tiroirDepth / 2 - thickness,
                    ]}
                  >
                    <boxGeometry
                      args={[sideThickness, tiroirHeight, tiroirDepth]}
                    />
                    <meshStandardMaterial
                      map={getSectionTexture(spacingId)}
                      color="white"
                    />
                  </mesh>

                  {/* Bottom panel */}
                  <mesh
                    position={[
                      0,
                      -tiroirHeight / 2 + sideThickness / 2,
                      -tiroirDepth / 2 - thickness,
                    ]}
                  >
                    <boxGeometry
                      args={[
                        railPosition.width - sideThickness * 2,
                        sideThickness,
                        tiroirDepth,
                      ]}
                    />
                    <meshStandardMaterial
                      map={getSectionTexture(spacingId)}
                      color="white"
                    />
                  </mesh>

                  {/* Back panel */}
                  <mesh position={[0, 0, -tiroirDepth]}>
                    <boxGeometry
                      args={[
                        railPosition.width - sideThickness * 2,
                        tiroirHeight,
                        sideThickness - thickness,
                      ]}
                    />
                    <meshStandardMaterial
                      map={getSectionTexture(spacingId)}
                      color="white"
                    />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      }

      // Render different rail types based on equipment type
      if (equipmentType === "penderieEscamotable") {
        return (
          <group key={spacingId} position={[railPosition.x, railPosition.y, 0]}>
            {/* Main rail cylinder - same as regular rail */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry
                args={[0.02, 0.02, railPosition.width - 0.18, 8]}
              />
              <meshStandardMaterial
                color="#000000"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Rail brackets (left and right) - same as regular rail */}
            {/* Left bracket */}
            <mesh
              position={[-(railPosition.width / 2 - 0.02 - thickness), 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
              <meshStandardMaterial color="#696969" />
            </mesh>

            {/* Right bracket */}
            <mesh
              position={[railPosition.width / 2 - 0.02 - thickness, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
              <meshStandardMaterial color="#696969" />
            </mesh>

            {/* Vertical extension bars - 50cm long from each bracket */}
            {/* Left vertical bar */}
            <mesh
              position={[
                -(railPosition.width / 2 - 0.02 - thickness),
                -0.25,
                0,
              ]}
              rotation={[0, 0, 0]}
            >
              <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
              <meshStandardMaterial
                color="#2c3e50"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Right vertical bar */}
            <mesh
              position={[railPosition.width / 2 - 0.02 - thickness, -0.25, 0]}
              rotation={[0, 0, 0]}
            >
              <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
              <meshStandardMaterial
                color="#2c3e50"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Center vertical bar - from middle of rail */}
            <mesh position={[0, -0.25, 0]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.5, 8]} />
              <meshStandardMaterial
                color="#2c3e50"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Horizontal bar on center vertical - short bar */}
            <mesh position={[0, -0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.15, 8]} />
              <meshStandardMaterial
                color="#2c3e50"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Base blocks for side supports */}
            {/* Left base block */}
            <mesh
              position={[-(railPosition.width / 2 - 0.02 - thickness), -0.5, 0]}
              rotation={[0, 0, 0]}
            >
              <boxGeometry args={[0.08, 0.12, 0.08]} />
              <meshStandardMaterial
                color="#2c3e50"
                metalness={0.6}
                roughness={0.3}
              />
            </mesh>

            {/* Right base block */}
            <mesh
              position={[railPosition.width / 2 - 0.02 - thickness, -0.5, 0]}
              rotation={[0, 0, 0]}
            >
              <boxGeometry args={[0.08, 0.12, 0.08]} />
              <meshStandardMaterial
                color="#2c3e50"
                metalness={0.6}
                roughness={0.3}
              />
            </mesh>
          </group>
        );
      } else if (equipmentType === "trigle") {
        // Regular trigle rail
        return (
          <group key={spacingId} position={[railPosition.x, railPosition.y, 0]}>
            {/* Rail cylinder */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry
                args={[0.02, 0.02, railPosition.width - 0.18, 8]}
              />
              <meshStandardMaterial
                color="#000000"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Rail brackets (left and right) - rotated to be horizontal */}
            {/* Left bracket */}
            <mesh
              position={[-(railPosition.width / 2 - 0.02 - thickness), 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
              <meshStandardMaterial color="#696969" />
            </mesh>

            {/* Right bracket */}
            <mesh
              position={[railPosition.width / 2 - 0.02 - thickness, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
              <meshStandardMaterial color="#696969" />
            </mesh>
          </group>
        );
      } else if (equipmentType === "doubleRail") {
        // Double rail system - escamotable on top, regular on bottom
        return (
          <group key={spacingId}>
            {/* Top rail - escamotable at height - 20cm */}
            <group position={[railPosition.x, height / 2 - 0.2, 0]}>
              {/* Main rail cylinder */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry
                  args={[0.02, 0.02, railPosition.width - 0.18, 8]}
                />
                <meshStandardMaterial
                  color="#000000"
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>

              {/* Rail brackets */}
              <mesh
                position={[-(railPosition.width / 2 - 0.02 - thickness), 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
                <meshStandardMaterial color="#696969" />
              </mesh>

              <mesh
                position={[railPosition.width / 2 - 0.02 - thickness, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
                <meshStandardMaterial color="#696969" />
              </mesh>

              {/* Vertical extension bars - 50cm long from each bracket */}
              <mesh
                position={[
                  -(railPosition.width / 2 - 0.02 - thickness),
                  -0.25,
                  0,
                ]}
                rotation={[0, 0, 0]}
              >
                <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
                <meshStandardMaterial
                  color="#2c3e50"
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>

              <mesh
                position={[railPosition.width / 2 - 0.02 - thickness, -0.25, 0]}
                rotation={[0, 0, 0]}
              >
                <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
                <meshStandardMaterial
                  color="#2c3e50"
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>

              {/* Center vertical bar */}
              <mesh position={[0, -0.25, 0]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.5, 8]} />
                <meshStandardMaterial
                  color="#2c3e50"
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>

              {/* Horizontal bar on center vertical - short bar */}
              <mesh position={[0, -0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.012, 0.012, 0.15, 8]} />
                <meshStandardMaterial
                  color="#2c3e50"
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>

              {/* Base blocks */}
              <mesh
                position={[
                  -(railPosition.width / 2 - 0.02 - thickness),
                  -0.5,
                  0,
                ]}
                rotation={[0, 0, 0]}
              >
                <boxGeometry args={[0.08, 0.12, 0.08]} />
                <meshStandardMaterial
                  color="#2c3e50"
                  metalness={0.6}
                  roughness={0.3}
                />
              </mesh>

              <mesh
                position={[railPosition.width / 2 - 0.02 - thickness, -0.5, 0]}
                rotation={[0, 0, 0]}
              >
                <boxGeometry args={[0.08, 0.12, 0.08]} />
                <meshStandardMaterial
                  color="#2c3e50"
                  metalness={0.6}
                  roughness={0.3}
                />
              </mesh>
            </group>

            {/* Bottom rail - regular at 0 - 20cm */}
            <group position={[railPosition.x, -0.2, 0]}>
              {/* Rail cylinder */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry
                  args={[0.02, 0.02, railPosition.width - 0.18, 8]}
                />
                <meshStandardMaterial
                  color="#000000"
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>

              {/* Rail brackets */}
              <mesh
                position={[-(railPosition.width / 2 - 0.02 - thickness), 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
                <meshStandardMaterial color="#696969" />
              </mesh>

              <mesh
                position={[railPosition.width / 2 - 0.02 - thickness, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
                <meshStandardMaterial color="#696969" />
              </mesh>
            </group>
          </group>
        );
      }
    });
  };

  return <>{renderRails()}</>;
};

export default RailRenderer;
