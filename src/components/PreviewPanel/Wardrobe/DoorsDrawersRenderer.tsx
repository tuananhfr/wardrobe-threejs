// src/components/PreviewPanel/Wardrobe/DoorsDrawersRenderer.tsx
import React, { useRef } from "react";
import * as THREE from "three";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";
import { useFrame } from "@react-three/fiber";

interface DoorsDrawersRendererProps {
  sectionData: WardrobeSection;
  position: [number, number, number];
  height: number;
  baseBarHeight: number;
  thickness: number;
  texture: THREE.Texture;
}

const DoorsDrawersRenderer: React.FC<DoorsDrawersRendererProps> = ({
  sectionData,
  position,
  height,
  baseBarHeight,
  thickness,
  texture,
}) => {
  const { config } = useWardrobeConfig();
  const width = sectionData.width;
  const depth = sectionData.depth;

  // ================= Animation State/Refs =================
  type DrawerAnim = {
    key: string;
    startZ: number;
    targetZ: number;
    startTime: number;
    duration: number;
  };

  type DoorAnim = {
    key: string;
    startRotY: number;
    targetRotY: number;
    startTime: number;
    duration: number;
  };

  type SliderAnim = {
    key: string;
    startX: number;
    targetX: number;
    startTime: number;
    duration: number;
  };

  const openedDrawersRef = useRef<Record<string, boolean>>({});
  const openedDoorsRef = useRef<Record<string, boolean>>({});
  const openedSlidersRef = useRef<Record<string, boolean>>({});

  const drawerGroupsRef = useRef<Record<string, THREE.Group>>({});
  const doorGroupsRef = useRef<Record<string, THREE.Group>>({});
  const sliderGroupsRef = useRef<Record<string, THREE.Group>>({});

  const drawerAnimsRef = useRef<Record<string, DrawerAnim>>({});
  const doorAnimsRef = useRef<Record<string, DoorAnim>>({});
  const sliderAnimsRef = useRef<Record<string, SliderAnim>>({});

  // Easing function
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  // Helper function to check if interactions should be disabled
  const shouldDisableInteractions = () => {
    return config.accordionOpen === "collapseDoorsDrawers";
  };

  // Helper function to get section name from spacingId
  const getSectionNameFromSpacingId = (spacingId: string): string => {
    // Parse spacingId format: "sectionA-col-1-spacing-3"
    const parts = spacingId.split("-");
    if (parts.length >= 1) {
      return parts[0]; // "sectionA", "sectionB", etc.
    }
    return "";
  };

  // Helper function to get all spacingIds in the same section
  const getSpacingIdsInSection = (sectionName: string): string[] => {
    return spacingPositions
      .map((pos) => pos.spacingId)
      .filter(
        (spacingId) => getSectionNameFromSpacingId(spacingId) === sectionName
      );
  };

  // useFrame to step animations
  useFrame(() => {
    const now = Date.now();

    // Drawers
    Object.keys(drawerAnimsRef.current).forEach((id) => {
      const anim = drawerAnimsRef.current[id];
      const group = drawerGroupsRef.current[anim.key];
      if (!group) return;
      const t = Math.min((now - anim.startTime) / anim.duration, 1);
      const v = easeOutCubic(t);
      const z = anim.startZ + (anim.targetZ - anim.startZ) * v;
      group.position.z = z;
      if (t >= 1) delete drawerAnimsRef.current[id];
    });

    // Doors (swing)
    Object.keys(doorAnimsRef.current).forEach((id) => {
      const anim = doorAnimsRef.current[id];
      const group = doorGroupsRef.current[anim.key];
      if (!group) return;
      const t = Math.min((now - anim.startTime) / anim.duration, 1);
      const v = easeOutCubic(t);
      const rot = anim.startRotY + (anim.targetRotY - anim.startRotY) * v;
      group.rotation.y = rot;
      if (t >= 1) delete doorAnimsRef.current[id];
    });

    // Sliding doors
    Object.keys(sliderAnimsRef.current).forEach((id) => {
      const anim = sliderAnimsRef.current[id];
      const group = sliderGroupsRef.current[anim.key];
      if (!group) return;
      const t = Math.min((now - anim.startTime) / anim.duration, 1);
      const v = easeOutCubic(t);
      const x = anim.startX + (anim.targetX - anim.startX) * v;
      group.position.x = x;
      if (t >= 1) delete sliderAnimsRef.current[id];
    });
  });

  // Helpers to trigger animations
  const triggerDrawer = (key: string, open: boolean, baseZ: number) => {
    const group = drawerGroupsRef.current[key];
    if (!group) return;
    const currentZ = group.position.z;
    const travel = Math.min(depth * 0.4, 0.4); // max 40cm
    const targetZ = open ? baseZ + travel : baseZ;

    // Disable animation when accordion 7 is open
    if (config.accordionOpen === "collapseDoorsDrawers") {
      group.position.z = targetZ;
      return;
    }

    const id = `${key}-${Date.now()}`;
    drawerAnimsRef.current[id] = {
      key,
      startZ: currentZ,
      targetZ,
      startTime: Date.now(),
      duration: 300,
    };
  };

  const triggerDoorSwing = (
    key: string,
    open: boolean,
    hinge: "left" | "right"
  ) => {
    const group = doorGroupsRef.current[key];
    if (!group) return;
    const currentRot = group.rotation.y;
    const targetRot = open
      ? hinge === "left"
        ? -Math.PI / 3
        : Math.PI / 3
      : 0;

    // Disable animation when accordion 7 is open
    if (config.accordionOpen === "collapseDoorsDrawers") {
      group.rotation.y = targetRot;
      return;
    }

    const id = `${key}-${Date.now()}`;
    doorAnimsRef.current[id] = {
      key,
      startRotY: currentRot,
      targetRotY: targetRot,
      startTime: Date.now(),
      duration: 300,
    };
  };

  const triggerSlider = (
    key: string,
    open: boolean,
    baseX: number,
    dir: 1 | -1,
    widthAmt: number
  ) => {
    const group = sliderGroupsRef.current[key];
    if (!group) return;
    const currentX = group.position.x;
    const travel = Math.min(widthAmt * 0.35, 0.35); // slide 35% of width, cap 35cm
    const targetX = open ? baseX + dir * travel : baseX;

    // Disable animation when accordion 7 is open
    if (config.accordionOpen === "collapseDoorsDrawers") {
      group.position.x = targetX;
      return;
    }

    const id = `${key}-${Date.now()}`;
    sliderAnimsRef.current[id] = {
      key,
      startX: currentX,
      targetX,
      startTime: Date.now(),
      duration: 300,
    };
  };

  // Helper function to get column X position
  const getColumnXPosition = (colIndex: number) => {
    let startX = -width / 2 + thickness;
    for (let i = 0; i < colIndex; i++) {
      startX += sectionData.columns[i].width + thickness;
    }
    return startX;
  };

  // Generate spacing positions for all columns (same logic as DoorsDrawersHighlights)
  const getSpacingPositions = () => {
    const positions: Array<{
      spacingId: string;
      columnId: string;
      columnIndex: number;
      spacingIndex: number;
      x: number;
      y: number;
      width: number;
      height: number;
      spacing: number;
      isFullColumn: boolean;
    }> = [];

    for (let colIndex = 0; colIndex < sectionData.columns.length; colIndex++) {
      const column = sectionData.columns[colIndex];
      const colWidth = column.width;
      const colHeight = height - baseBarHeight - 2 * thickness;
      const startX = getColumnXPosition(colIndex);

      // Get shelf spacings for this column
      const spacings = column.shelves?.spacings || [];

      // If no spacings, create a default spacing for the entire column height
      if (spacings.length === 0) {
        const spacingId = `${column.id}-spacing-0`;
        positions.push({
          spacingId,
          columnId: column.id,
          columnIndex: colIndex,
          spacingIndex: 0,
          x: startX + colWidth / 2,
          y: 0,
          width: colWidth,
          height: colHeight,
          spacing: colHeight,
          isFullColumn: true,
        });
        continue;
      }

      // Calculate spacing heights and positions
      let currentY = baseBarHeight * 100; // Keep in cm for calculation

      for (
        let spacingIndex = 0;
        spacingIndex < spacings.length;
        spacingIndex++
      ) {
        const spacing = spacings[spacingIndex];
        const spacingHeightCm = spacing.spacing;
        const spacingHeight = spacingHeightCm / 100;
        const worldY = (currentY + spacingHeightCm / 2) / 100 - height / 2;
        const spacingId = `${column.id}-spacing-${spacingIndex}`;

        positions.push({
          spacingId,
          columnId: column.id,
          columnIndex: colIndex,
          spacingIndex,
          x: startX + colWidth / 2,
          y: worldY,
          width: colWidth,
          height: spacingHeight,
          spacing: spacingHeight,
          isFullColumn: false,
        });

        currentY += spacingHeightCm + thickness * 100;
      }
    }

    return positions;
  };

  const spacingPositions = getSpacingPositions();

  // Render different facade types
  const renderFacade = (
    type: string,
    pos: any,
    facadeWidth: number,
    facadeHeight: number
  ) => {
    const facadeZ = depth / 2 - thickness / 3;

    // Helper function to render handle based on type
    const renderHandle = (
      handleType: string,
      position: [number, number, number],
      isVertical: boolean = false
    ) => {
      if (handleType === "none") return null;

      switch (handleType) {
        case "round":
          return (
            <mesh position={position}>
              <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
              <meshStandardMaterial color="#666" />
            </mesh>
          );
        case "bar":
          return (
            <mesh position={position}>
              <boxGeometry
                args={isVertical ? [0.02, 0.15, 0.02] : [0.15, 0.02, 0.02]}
              />
              <meshStandardMaterial color="#666" />
            </mesh>
          );
        case "recessed":
          return (
            <mesh position={position}>
              <boxGeometry
                args={isVertical ? [0.03, 0.12, 0.01] : [0.12, 0.03, 0.01]}
              />
              <meshStandardMaterial color="#333" />
            </mesh>
          );
        default:
          return null;
      }
    };

    // Get handle type for this spacing
    const handleType = config.handleConfig[pos.spacingId] || config.handleType;

    switch (type) {
      case "leftDoor":
        // Porte Gauche - door hinged on left side

        return (
          <group position={[pos.x - facadeWidth / 2, pos.y, facadeZ]}>
            <group
              ref={(ref) => {
                if (ref)
                  doorGroupsRef.current[`${pos.spacingId}-leftDoor`] = ref;
              }}
              position={[0, 0, 0]} // Hinge tại vị trí này
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-leftDoor`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, true, "left");
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-leftDoor`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, false, "left");
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-leftDoor`;
                const next = !openedDoorsRef.current[k];
                openedDoorsRef.current[k] = next;
                triggerDoorSwing(k, next, "left");
              }}
            >
              {/* Door panel - pivot từ left edge */}
              <mesh position={[facadeWidth / 2, 0, 0]}>
                <boxGeometry args={[facadeWidth, facadeHeight, thickness]} />
                <meshStandardMaterial map={texture} color="white" />
              </mesh>
              {/* Door handle ở RIGHT SIDE của door */}
              {renderHandle(handleType, [
                facadeWidth - 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>
          </group>
        );

      case "rightDoor":
        return (
          <group position={[pos.x + facadeWidth / 2, pos.y, facadeZ]}>
            <group
              ref={(ref) => {
                if (ref)
                  doorGroupsRef.current[`${pos.spacingId}-rightDoor`] = ref;
              }}
              position={[0, 0, 0]} // Hinge tại vị trí này
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-rightDoor`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, true, "right");
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-rightDoor`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, false, "right");
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-rightDoor`;
                const next = !openedDoorsRef.current[k];
                openedDoorsRef.current[k] = next;
                triggerDoorSwing(k, next, "right");
              }}
            >
              {/* Door panel - pivot từ right edge */}
              <mesh position={[-facadeWidth / 2, 0, 0]}>
                <boxGeometry args={[facadeWidth, facadeHeight, thickness]} />
                <meshStandardMaterial map={texture} color="white" />
              </mesh>
              {/* Door handle ở LEFT SIDE của door */}
              {renderHandle(handleType, [
                -facadeWidth + 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>
          </group>
        );

      case "drawer":
        // Tiroir - drawer with handle

        return (
          <group
            position={[pos.x, pos.y, facadeZ]}
            ref={(ref) => {
              if (ref) drawerGroupsRef.current[`${pos.spacingId}-drawer`] = ref;
            }}
            onPointerOver={(e) => {
              if (shouldDisableInteractions()) return;
              e.stopPropagation();
              const k = `${pos.spacingId}-drawer`;
              if (!openedDrawersRef.current[k]) triggerDrawer(k, true, facadeZ); // ✅ FIXED: sử dụng facadeZ
            }}
            onPointerOut={(e) => {
              if (shouldDisableInteractions()) return;
              e.stopPropagation();
              const k = `${pos.spacingId}-drawer`;
              if (!openedDrawersRef.current[k])
                triggerDrawer(k, false, facadeZ); // ✅ FIXED: sử dụng facadeZ
            }}
            onClick={(e) => {
              if (shouldDisableInteractions()) return;
              e.stopPropagation();
              const k = `${pos.spacingId}-drawer`;
              const next = !openedDrawersRef.current[k];
              openedDrawersRef.current[k] = next;
              triggerDrawer(k, next, facadeZ); // ✅ FIXED: sử dụng drawerBaseZ
            }}
          >
            {/* Drawer front panel */}
            <mesh>
              <boxGeometry args={[facadeWidth, facadeHeight, thickness]} />
              <meshStandardMaterial map={texture} color="white" />
            </mesh>
            {/* Drawer handle in center */}
            {renderHandle(handleType, [0, 0, thickness / 2 + 0.01])}
          </group>
        );
      case "doubleSwingDoor":
        // Porte double battant - two doors with swing animation
        const totalDoorWidth = facadeWidth; // ✅ Tổng width vừa khít
        const doorWidth = totalDoorWidth / 2; // Slight gap between doors
        return (
          <group position={[pos.x, pos.y, facadeZ]}>
            {/* ✅ Left door - positioned at LEFT side */}
            <group position={[-totalDoorWidth / 2 + doorWidth / 2, 0, 0]}>
              <group
                ref={(ref) => {
                  if (ref)
                    doorGroupsRef.current[`${pos.spacingId}-double-left`] = ref;
                }}
                position={[-doorWidth / 2, 0, 0]} // ✅ Hinge at LEFT edge of door
                onPointerOver={(e) => {
                  if (shouldDisableInteractions()) return;
                  e.stopPropagation();
                  const kl = `${pos.spacingId}-double`;
                  if (!openedDoorsRef.current[kl]) {
                    triggerDoorSwing(
                      `${pos.spacingId}-double-left`,
                      true,
                      "left"
                    );
                    triggerDoorSwing(
                      `${pos.spacingId}-double-right`,
                      true,
                      "right"
                    );
                  }
                }}
                onPointerOut={(e) => {
                  if (shouldDisableInteractions()) return;
                  e.stopPropagation();
                  const kl = `${pos.spacingId}-double`;
                  if (!openedDoorsRef.current[kl]) {
                    triggerDoorSwing(
                      `${pos.spacingId}-double-left`,
                      false,
                      "left"
                    );
                    triggerDoorSwing(
                      `${pos.spacingId}-double-right`,
                      false,
                      "right"
                    );
                  }
                }}
                onClick={(e) => {
                  if (shouldDisableInteractions()) return;
                  e.stopPropagation();
                  const kl = `${pos.spacingId}-double`;
                  const next = !openedDoorsRef.current[kl];
                  openedDoorsRef.current[kl] = next;
                  triggerDoorSwing(
                    `${pos.spacingId}-double-left`,
                    next,
                    "left"
                  );
                  triggerDoorSwing(
                    `${pos.spacingId}-double-right`,
                    next,
                    "right"
                  );
                }}
              >
                {/* ✅ Door panel positioned relative to hinge */}
                <mesh position={[doorWidth / 2, 0, 0]}>
                  <boxGeometry args={[doorWidth, facadeHeight, thickness]} />
                  <meshStandardMaterial map={texture} color="white" />
                </mesh>
                {/* ✅ Handle at RIGHT side of left door (near center gap) */}
                {renderHandle(handleType, [
                  doorWidth - 0.02,
                  0,
                  thickness / 2 + 0.01,
                ])}
              </group>
            </group>

            {/* ✅ Right door - positioned at RIGHT side */}
            <group position={[totalDoorWidth / 2 - doorWidth / 2, 0, 0]}>
              <group
                ref={(ref) => {
                  if (ref)
                    doorGroupsRef.current[`${pos.spacingId}-double-right`] =
                      ref;
                }}
                position={[doorWidth / 2, 0, 0]} // ✅ Hinge at RIGHT edge of door
              >
                {/* ✅ Door panel positioned relative to hinge */}
                <mesh position={[-doorWidth / 2, 0, 0]}>
                  <boxGeometry args={[doorWidth, facadeHeight, thickness]} />
                  <meshStandardMaterial map={texture} color="white" />
                </mesh>
                {/* ✅ Handle at LEFT side of right door (near center gap) */}
                {renderHandle(handleType, [
                  -doorWidth + 0.02,
                  0,
                  thickness / 2 + 0.01,
                ])}
              </group>
            </group>
          </group>
        );

      case "slidingDoor":
        // Porte coulissante - sliding door (slide to the right)
        // Calculate section width for sliding door
        const sectionName = getSectionNameFromSpacingId(pos.spacingId);
        const sectionSpacingIds = getSpacingIdsInSection(sectionName);

        // Check if any spacing in the section has sliding door configured
        const hasSlidingDoorInSection = sectionSpacingIds.some(
          (spacingId) => config.doorsDrawersConfig[spacingId] === "slidingDoor"
        );

        // If no sliding door configured in this section, don't render
        if (!hasSlidingDoorInSection) {
          return null;
        }

        // Filter spacing IDs based on wardrobe type and section
        let filteredSpacingIds = sectionSpacingIds;
        if (config.wardrobeType.id === "Angle") {
          if (sectionName === "sectionA") {
            // Section A: exclude last column
            const lastColumnId =
              sectionData.columns[sectionData.columns.length - 1]?.id;
            filteredSpacingIds = sectionSpacingIds.filter(
              (spacingId) => !spacingId.startsWith(lastColumnId)
            );
          } else if (sectionName === "sectionB") {
            // Section B: exclude first column
            const firstColumnId = sectionData.columns[0]?.id;
            filteredSpacingIds = sectionSpacingIds.filter(
              (spacingId) => !spacingId.startsWith(firstColumnId)
            );
          }
        } else if (config.wardrobeType.id === "Forme U") {
          if (sectionName === "sectionA") {
            // Section A: exclude first and last columns
            const firstColumnId = sectionData.columns[0]?.id;
            const lastColumnId =
              sectionData.columns[sectionData.columns.length - 1]?.id;
            filteredSpacingIds = sectionSpacingIds.filter(
              (spacingId) =>
                !spacingId.startsWith(firstColumnId) &&
                !spacingId.startsWith(lastColumnId)
            );
          } else if (sectionName === "sectionB") {
            // Section B: exclude last column
            const lastColumnId =
              sectionData.columns[sectionData.columns.length - 1]?.id;
            filteredSpacingIds = sectionSpacingIds.filter(
              (spacingId) => !spacingId.startsWith(lastColumnId)
            );
          } else if (sectionName === "sectionC") {
            // Section C: exclude first column
            const firstColumnId = sectionData.columns[0]?.id;
            filteredSpacingIds = sectionSpacingIds.filter(
              (spacingId) => !spacingId.startsWith(firstColumnId)
            );
          }
        }

        const sectionWidth = filteredSpacingIds.reduce((total, spacingId) => {
          const spacingPos = spacingPositions.find(
            (p) => p.spacingId === spacingId
          );
          return total + (spacingPos ? spacingPos.width : 0);
        }, 0);

        // Calculate number of columns in filtered section
        const uniqueColumnIds = [
          ...new Set(
            filteredSpacingIds.map((spacingId) => {
              const parts = spacingId.split("-");
              if (parts.length >= 3) {
                return `${parts[0]}-${parts[1]}-${parts[2]}`; // sectionA-col-1
              }
              return spacingId.split("-")[0]; // fallback
            })
          ),
        ];
        const numberOfColumns = uniqueColumnIds.length;
        const thicknessBetweenColumns = (numberOfColumns - 1) * thickness;

        const slidingDoorWidth = sectionWidth + thicknessBetweenColumns; // Full section width including thickness between columns

        // Only render sliding door for the first spacing in the section to avoid duplicates
        const isFirstSpacingInSection = filteredSpacingIds[0] === pos.spacingId;
        if (!isFirstSpacingInSection) {
          return null;
        }

        // Calculate center position of the section
        const sectionPositions = filteredSpacingIds.map((spacingId) => {
          const spacingPos = spacingPositions.find(
            (p) => p.spacingId === spacingId
          );
          return spacingPos ? spacingPos.x : 0;
        });
        const sectionCenterX =
          sectionPositions.reduce((sum, x) => sum + x, 0) /
          sectionPositions.length;

        return (
          <group position={[sectionCenterX, pos.y, facadeZ + thickness / 2]}>
            {/* Left sliding door panel (mảnh 1) */}
            <group
              ref={(ref) => {
                if (ref)
                  sliderGroupsRef.current[`${pos.spacingId}-slidingDoor-left`] =
                    ref;
              }}
              position={[-slidingDoorWidth / 4, 0, 0]}
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-slidingDoor-left`;
                if (!openedSlidersRef.current[k]) {
                  triggerSlider(
                    k,
                    true,
                    -slidingDoorWidth / 4,
                    1,
                    slidingDoorWidth / 2
                  );
                }
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-slidingDoor-left`;
                if (!openedSlidersRef.current[k]) {
                  triggerSlider(
                    k,
                    false,
                    -slidingDoorWidth / 4,
                    1,
                    slidingDoorWidth / 2
                  );
                }
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-slidingDoor-left`;
                const next = !openedSlidersRef.current[k];
                openedSlidersRef.current[k] = next;
                triggerSlider(
                  k,
                  next,
                  -slidingDoorWidth / 4,
                  1,
                  slidingDoorWidth / 2
                );
              }}
            >
              <mesh position={[0, 0, thickness / 2]}>
                <boxGeometry
                  args={[slidingDoorWidth / 2, facadeHeight, thickness]}
                />
                <meshStandardMaterial
                  key={`sliding-door-material-${pos.spacingId}`}
                  map={texture}
                  color="white"
                />
              </mesh>
              {/* Viền cho mảnh 1 */}
              <mesh position={[0, 0, thickness / 2 + 0.001]}>
                <boxGeometry
                  args={[
                    slidingDoorWidth / 2 + 0.01,
                    facadeHeight + 0.01,
                    0.002,
                  ]}
                />
                <meshStandardMaterial
                  key={`sliding-border-material-${pos.spacingId}`}
                  color="#333"
                />
              </mesh>
            </group>

            {/* Right sliding door panel (mảnh 2) */}
            <group
              ref={(ref) => {
                if (ref)
                  sliderGroupsRef.current[
                    `${pos.spacingId}-slidingDoor-right`
                  ] = ref;
              }}
              position={[slidingDoorWidth / 4, 0, 0]}
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-slidingDoor-right`;
                if (!openedSlidersRef.current[k]) {
                  triggerSlider(
                    k,
                    true,
                    slidingDoorWidth / 4,
                    -1,
                    slidingDoorWidth / 2
                  );
                }
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-slidingDoor-right`;
                if (!openedSlidersRef.current[k]) {
                  triggerSlider(
                    k,
                    false,
                    slidingDoorWidth / 4,
                    -1,
                    slidingDoorWidth / 2
                  );
                }
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-slidingDoor-right`;
                const next = !openedSlidersRef.current[k];
                openedSlidersRef.current[k] = next;
                triggerSlider(
                  k,
                  next,
                  slidingDoorWidth / 4,
                  -1,
                  slidingDoorWidth / 2
                );
              }}
            >
              <mesh position={[0, 0, -thickness / 2]}>
                <boxGeometry
                  args={[slidingDoorWidth / 2, facadeHeight, thickness]}
                />
                <meshStandardMaterial
                  key={`sliding-door-material-${pos.spacingId}-right`}
                  map={texture}
                  color="white"
                />
              </mesh>
              {/* Viền cho mảnh 2 */}
              <mesh position={[0, 0, -thickness / 2 - 0.001]}>
                <boxGeometry
                  args={[
                    slidingDoorWidth / 2 + 0.01,
                    facadeHeight + 0.01,
                    0.002,
                  ]}
                />
                <meshStandardMaterial
                  key={`sliding-border-material-${pos.spacingId}-right`}
                  color="#333"
                />
              </mesh>
            </group>

            {/* Track indicator */}
            <mesh
              position={[0, -facadeHeight / 2 - 0.02, thickness / 2 + 0.01]}
            >
              <boxGeometry args={[slidingDoorWidth - 0.1, 0.01, 0.01]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          </group>
        );

      case "slidingMirrorDoor":
        // Porte coulissante en miroir - sliding mirror door (slide to the left)
        // Calculate section width for sliding mirror door
        const mirrorSectionName = getSectionNameFromSpacingId(pos.spacingId);
        const mirrorSectionSpacingIds =
          getSpacingIdsInSection(mirrorSectionName);

        // Check if any spacing in the section has sliding mirror door configured
        const hasSlidingMirrorDoorInSection = mirrorSectionSpacingIds.some(
          (spacingId) =>
            config.doorsDrawersConfig[spacingId] === "slidingMirrorDoor"
        );

        // If no sliding mirror door configured in this section, don't render
        if (!hasSlidingMirrorDoorInSection) {
          return null;
        }

        // Filter spacing IDs based on wardrobe type and section
        let filteredMirrorSpacingIds = mirrorSectionSpacingIds;
        if (config.wardrobeType.id === "Angle") {
          if (mirrorSectionName === "sectionA") {
            // Section A: exclude last column
            const lastColumnId =
              sectionData.columns[sectionData.columns.length - 1]?.id;
            filteredMirrorSpacingIds = mirrorSectionSpacingIds.filter(
              (spacingId) => !spacingId.startsWith(lastColumnId)
            );
          } else if (mirrorSectionName === "sectionB") {
            // Section B: exclude first column
            const firstColumnId = sectionData.columns[0]?.id;
            filteredMirrorSpacingIds = mirrorSectionSpacingIds.filter(
              (spacingId) => !spacingId.startsWith(firstColumnId)
            );
          }
        } else if (config.wardrobeType.id === "Forme U") {
          if (mirrorSectionName === "sectionA") {
            // Section A: exclude first and last columns
            const firstColumnId = sectionData.columns[0]?.id;
            const lastColumnId =
              sectionData.columns[sectionData.columns.length - 1]?.id;
            filteredMirrorSpacingIds = mirrorSectionSpacingIds.filter(
              (spacingId) =>
                !spacingId.startsWith(firstColumnId) &&
                !spacingId.startsWith(lastColumnId)
            );
          } else if (mirrorSectionName === "sectionB") {
            // Section B: exclude last column
            const lastColumnId =
              sectionData.columns[sectionData.columns.length - 1]?.id;
            filteredMirrorSpacingIds = mirrorSectionSpacingIds.filter(
              (spacingId) => !spacingId.startsWith(lastColumnId)
            );
          } else if (mirrorSectionName === "sectionC") {
            // Section C: exclude first column
            const firstColumnId = sectionData.columns[0]?.id;
            filteredMirrorSpacingIds = mirrorSectionSpacingIds.filter(
              (spacingId) => !spacingId.startsWith(firstColumnId)
            );
          }
        }

        const mirrorSectionWidth = filteredMirrorSpacingIds.reduce(
          (total, spacingId) => {
            const spacingPos = spacingPositions.find(
              (p) => p.spacingId === spacingId
            );
            return total + (spacingPos ? spacingPos.width : 0);
          },
          0
        );

        // Calculate number of columns in filtered mirror section
        const uniqueMirrorColumnIds = [
          ...new Set(
            filteredMirrorSpacingIds.map((spacingId) => {
              const parts = spacingId.split("-");
              if (parts.length >= 3) {
                return `${parts[0]}-${parts[1]}-${parts[2]}`; // sectionA-col-1
              }
              return spacingId.split("-")[0]; // fallback
            })
          ),
        ];
        const numberOfMirrorColumns = uniqueMirrorColumnIds.length;
        const thicknessBetweenMirrorColumns =
          (numberOfMirrorColumns - 1) * thickness;

        const mirrorDoorWidth =
          mirrorSectionWidth + thicknessBetweenMirrorColumns; // Full section width including thickness between columns

        // Only render sliding mirror door for the first spacing in the section to avoid duplicates
        const isFirstMirrorSpacingInSection =
          filteredMirrorSpacingIds[0] === pos.spacingId;
        if (!isFirstMirrorSpacingInSection) {
          return null;
        }

        // Calculate center position of the section
        const mirrorSectionPositions = filteredMirrorSpacingIds.map(
          (spacingId) => {
            const spacingPos = spacingPositions.find(
              (p) => p.spacingId === spacingId
            );
            return spacingPos ? spacingPos.x : 0;
          }
        );
        const mirrorSectionCenterX =
          mirrorSectionPositions.reduce((sum, x) => sum + x, 0) /
          mirrorSectionPositions.length;

        return (
          <group
            position={[mirrorSectionCenterX, pos.y, facadeZ + thickness / 2]}
          >
            {/* Left mirror door panel (mảnh 1) */}
            <group
              ref={(ref) => {
                if (ref)
                  sliderGroupsRef.current[
                    `${pos.spacingId}-slidingMirrorDoor-left`
                  ] = ref;
              }}
              position={[-mirrorDoorWidth / 4, 0, 0]}
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-slidingMirrorDoor-left`;
                if (!openedSlidersRef.current[k]) {
                  triggerSlider(
                    k,
                    true,
                    -mirrorDoorWidth / 4,
                    1,
                    mirrorDoorWidth / 2
                  );
                }
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-slidingMirrorDoor-left`;
                if (!openedSlidersRef.current[k]) {
                  triggerSlider(
                    k,
                    false,
                    -mirrorDoorWidth / 4,
                    1,
                    mirrorDoorWidth / 2
                  );
                }
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-slidingMirrorDoor-left`;
                const next = !openedSlidersRef.current[k];
                openedSlidersRef.current[k] = next;
                triggerSlider(
                  k,
                  next,
                  -mirrorDoorWidth / 4,
                  1,
                  mirrorDoorWidth / 2
                );
              }}
            >
              <mesh position={[0, 0, thickness / 2]}>
                <boxGeometry
                  args={[mirrorDoorWidth / 2, facadeHeight, thickness]}
                />
                <meshStandardMaterial
                  key={`mirror-door-material-${pos.spacingId}`}
                  color="#e0e0e0"
                  metalness={0.8}
                  roughness={0.1}
                  envMapIntensity={1}
                />
              </mesh>
              {/* Viền cho mảnh 1 mirror */}
              <mesh position={[0, 0, thickness / 2 + 0.001]}>
                <boxGeometry
                  args={[
                    mirrorDoorWidth / 2 + 0.01,
                    facadeHeight + 0.01,
                    0.002,
                  ]}
                />
                <meshStandardMaterial
                  key={`mirror-border-material-${pos.spacingId}`}
                  color="#333"
                />
              </mesh>
            </group>

            {/* Right mirror door panel (mảnh 2) */}
            <group
              ref={(ref) => {
                if (ref)
                  sliderGroupsRef.current[
                    `${pos.spacingId}-slidingMirrorDoor-right`
                  ] = ref;
              }}
              position={[mirrorDoorWidth / 4, 0, 0]}
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-slidingMirrorDoor-right`;
                if (!openedSlidersRef.current[k]) {
                  triggerSlider(
                    k,
                    true,
                    mirrorDoorWidth / 4,
                    -1,
                    mirrorDoorWidth / 2
                  );
                }
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-slidingMirrorDoor-right`;
                if (!openedSlidersRef.current[k]) {
                  triggerSlider(
                    k,
                    false,
                    mirrorDoorWidth / 4,
                    -1,
                    mirrorDoorWidth / 2
                  );
                }
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${pos.spacingId}-slidingMirrorDoor-right`;
                const next = !openedSlidersRef.current[k];
                openedSlidersRef.current[k] = next;
                triggerSlider(
                  k,
                  next,
                  mirrorDoorWidth / 4,
                  -1,
                  mirrorDoorWidth / 2
                );
              }}
            >
              <mesh position={[0, 0, -thickness / 2]}>
                <boxGeometry
                  args={[mirrorDoorWidth / 2, facadeHeight, thickness]}
                />
                <meshStandardMaterial
                  key={`mirror-door-material-${pos.spacingId}-right`}
                  color="#e0e0e0"
                  metalness={0.8}
                  roughness={0.1}
                  envMapIntensity={1}
                />
              </mesh>
              {/* Viền cho mảnh 2 mirror */}
              <mesh position={[0, 0, -thickness / 2 - 0.001]}>
                <boxGeometry
                  args={[
                    mirrorDoorWidth / 2 + 0.01,
                    facadeHeight + 0.01,
                    0.002,
                  ]}
                />
                <meshStandardMaterial
                  key={`mirror-border-material-${pos.spacingId}-right`}
                  color="#333"
                />
              </mesh>
            </group>

            {/* Track indicator */}
            <mesh
              position={[0, -facadeHeight / 2 - 0.02, thickness / 2 + 0.01]}
            >
              <boxGeometry args={[mirrorDoorWidth - 0.1, 0.01, 0.01]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          </group>
        );

      default:
        return null;
    }
  };

  return (
    <group position={position}>
      {spacingPositions.map((pos) => {
        const doorDrawerType = config.doorsDrawersConfig[pos.spacingId];

        if (!doorDrawerType) {
          return null; // No facade for this spacing
        }

        return (
          <React.Fragment key={`facade-${pos.spacingId}`}>
            {renderFacade(doorDrawerType, pos, pos.width, pos.height)}
          </React.Fragment>
        );
      })}
    </group>
  );
};

export default DoorsDrawersRenderer;
