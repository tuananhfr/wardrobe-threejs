// src/components/PreviewPanel/Wardrobe/DoorsDrawersRenderer.tsx
import React, { useRef } from "react";
import * as THREE from "three";

import FacadeHighlight from "./FacadeHighlight";
import { useWardrobeConfig } from "@/hooks/useWardrobeConfig";
import { useConfig } from "@/components/context/WardrobeContext";
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
  const { updateConfig } = useConfig();
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

  // Function để kiểm tra các điều kiện disable
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

  // Function để vô hiệu hóa và đóng tất cả animations
  const disableAndCloseAllAnimations = () => {
    const shouldDisable = shouldDisableAnimations();
    const facadeZ = depth / 2 - thickness / 3; // Calculate facadeZ locally
    const facadeWidth = width; // Use section width

    if (shouldDisable) {
      // Đóng tất cả drawers với animation
      Object.keys(openedDrawersRef.current).forEach((key) => {
        if (openedDrawersRef.current[key]) {
          const group = drawerGroupsRef.current[key];
          if (group) {
            // Tìm baseZ từ position hiện tại
            const baseZ = facadeZ;

            // Trigger animation đóng
            const currentZ = group.position.z;
            const targetZ = baseZ;

            const animId = `${key}-close-${Date.now()}`;
            drawerAnimsRef.current[animId] = {
              key,
              startZ: currentZ,
              targetZ,
              startTime: Date.now(),
              duration: 300,
            };

            // Update trạng thái
            openedDrawersRef.current[key] = false;
          }
        }
      });

      // Đóng tất cả swing doors với animation
      Object.keys(openedDoorsRef.current).forEach((key) => {
        if (openedDoorsRef.current[key]) {
          const group = doorGroupsRef.current[key];
          if (group) {
            // Trigger animation đóng (về rotation 0)
            const currentRot = group.rotation.y;
            const targetRot = 0;

            const animId = `${key}-close-${Date.now()}`;
            doorAnimsRef.current[animId] = {
              key,
              startRotY: currentRot,
              targetRotY: targetRot,
              startTime: Date.now(),
              duration: 300,
            };

            // Update trạng thái
            openedDoorsRef.current[key] = false;
          }
        }
      });

      // Đóng tất cả sliding doors với animation
      Object.keys(openedSlidersRef.current).forEach((key) => {
        if (openedSlidersRef.current[key]) {
          const group = sliderGroupsRef.current[key];
          if (group) {
            // Tính baseX từ key hoặc sử dụng logic existing
            let baseX = 0;

            // Parse key để lấy thông tin baseX, direction, width
            if (key.includes("-left")) {
              const slidingDoorWidth = facadeWidth / 2;
              baseX = -slidingDoorWidth / 2;
            } else if (key.includes("-right")) {
              const slidingDoorWidth = facadeWidth / 2;
              baseX = slidingDoorWidth / 2;
            }

            // Trigger animation đóng
            const currentX = group.position.x;
            const targetX = baseX; // Vị trí đóng

            const animId = `${key}-close-${Date.now()}`;
            sliderAnimsRef.current[animId] = {
              key,
              startX: currentX,
              targetX,
              startTime: Date.now(),
              duration: 300,
            };

            // Update trạng thái
            openedSlidersRef.current[key] = false;
          }
        }
      });
    }
  };

  // Thêm useEffect để monitor config changes
  React.useEffect(() => {
    disableAndCloseAllAnimations();
  }, [config.accordionOpen, config.activeView]);

  // Helper function to check if we're in facades selection mode
  const isSelectingFacades = () => {
    const isTexturesMode = config.accordionOpen === "collapseTextures";
    const isFacadesMode = config.activeView === "facades";
    return isTexturesMode && isFacadesMode;
  };

  // Helper function to handle facade pointer events
  const handleFacadePointerOver = (spacingId: string) => {
    if (!isSelectingFacades()) return;
    updateConfig("hoveredSpacingId", spacingId);
  };

  const handleFacadePointerOut = () => {
    if (!isSelectingFacades()) return;
    updateConfig("hoveredSpacingId", null);
  };

  const handleFacadeClick = (spacingId: string) => {
    if (!isSelectingFacades()) return;

    const currentSelectedIds = [...config.selectedSpacingIds];
    const index = currentSelectedIds.indexOf(spacingId);

    if (index > -1) {
      // Remove from selection
      currentSelectedIds.splice(index, 1);
    } else {
      // Add to selection
      currentSelectedIds.push(spacingId);
    }

    updateConfig("selectedSpacingIds", currentSelectedIds);
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

  // Helper function to create group data
  const createGroupData = (
    spacingIds: string[],
    columnId: string,
    startIndex: number,
    endIndex: number
  ) => {
    // Find column data
    const column = sectionData.columns.find((col) => col.id === columnId);
    if (!column) return null;

    const columnWidth = column.width;
    const columnIndex = sectionData.columns.findIndex(
      (col) => col.id === columnId
    );
    const startX = getColumnXPosition(columnIndex);

    // Calculate total height and center position
    let totalHeight = 0;
    let minY = Infinity;
    let maxY = -Infinity;

    // Sort spacingIds by index to calculate height correctly
    const sortedSpacingIds = spacingIds.sort((a, b) => {
      const partsA = a.split("-");
      const partsB = b.split("-");
      const indexA =
        partsA.length === 5 ? parseInt(partsA[4]) : parseInt(partsA[2]);
      const indexB =
        partsB.length === 5 ? parseInt(partsB[4]) : parseInt(partsB[2]);
      return indexA - indexB;
    });

    sortedSpacingIds.forEach((spacingId, index) => {
      const spacingPos = spacingPositions.find(
        (pos) => pos.spacingId === spacingId
      );
      if (spacingPos) {
        totalHeight += spacingPos.height;
        minY = Math.min(minY, spacingPos.y - spacingPos.height / 2);
        maxY = Math.max(maxY, spacingPos.y + spacingPos.height / 2);

        // Add thickness between spacings (except for the last one)
        if (index < sortedSpacingIds.length - 1) {
          totalHeight += thickness;
        }
      }
    });

    const centerY = (minY + maxY) / 2;
    const groupId = `${columnId}-group-${startIndex}-${endIndex}`;

    return {
      groupId,
      spacingIds,
      startIndex,
      endIndex,
      columnId,
      totalHeight,
      centerY,
      width: columnWidth,
      x: startX + columnWidth / 2,
    };
  };

  const getGroupedConfiguredSpacings = () => {
    // Get all spacings that have config
    const configuredSpacings = spacingPositions
      .filter((pos) => config.doorsDrawersConfig[pos.spacingId])
      .map((pos) => pos.spacingId);

    if (configuredSpacings.length === 0) return [];

    // Get currently selected spacings
    const selectedSpacings = config.selectedSpacingIds || [];
    const groupedDoorsConfig = config.groupedDoorsConfig || {};

    // Group by column
    const columnGroups: Record<string, string[]> = {};

    configuredSpacings.forEach((spacingId) => {
      const parts = spacingId.split("-");
      if (parts.length < 4) return;

      let columnId: string;
      if (parts.length === 5 && parts[1] === "col" && parts[3] === "spacing") {
        columnId = `${parts[0]}-${parts[1]}-${parts[2]}`;
      } else {
        columnId = parts[0];
      }

      if (!columnGroups[columnId]) {
        columnGroups[columnId] = [];
      }
      columnGroups[columnId].push(spacingId);
    });

    const groupedSpacings: Array<{
      groupId: string;
      spacingIds: string[];
      startIndex: number;
      endIndex: number;
      columnId: string;
      totalHeight: number;
      centerY: number;
      width: number;
      x: number;
    }> = [];

    Object.entries(columnGroups).forEach(([columnId, spacingIds]) => {
      // Sort by spacing index
      const sortedSpacings = spacingIds.sort((a, b) => {
        const partsA = a.split("-");
        const partsB = b.split("-");
        const indexA =
          partsA.length === 5 ? parseInt(partsA[4]) : parseInt(partsA[2]);
        const indexB =
          partsB.length === 5 ? parseInt(partsB[4]) : parseInt(partsB[2]);
        return indexA - indexB;
      });

      // Track processed spacings
      const processedSpacings = new Set<string>();

      // STEP 1: Process existing grouped doors first
      Object.entries(groupedDoorsConfig).forEach(([, groupData]) => {
        // Check if this group belongs to current column
        const groupSpacingsInColumn = groupData.spacingIds.filter((id) =>
          sortedSpacings.includes(id)
        );

        if (groupSpacingsInColumn.length > 0) {
          // Validate group still exists and has same config
          const allSpacingsStillExist = groupData.spacingIds.every(
            (id) => config.doorsDrawersConfig[id] === groupData.doorType
          );

          if (
            allSpacingsStillExist &&
            groupSpacingsInColumn.length === groupData.spacingIds.length
          ) {
            // Group is still valid, recreate it
            const firstParts = groupData.spacingIds[0].split("-");
            const lastParts =
              groupData.spacingIds[groupData.spacingIds.length - 1].split("-");
            const startIndex =
              firstParts.length === 5
                ? parseInt(firstParts[4])
                : parseInt(firstParts[2]);
            const endIndex =
              lastParts.length === 5
                ? parseInt(lastParts[4])
                : parseInt(lastParts[2]);

            const createdGroupData = createGroupData(
              groupData.spacingIds,
              columnId,
              startIndex,
              endIndex
            );
            if (createdGroupData) {
              groupedSpacings.push(createdGroupData);
              // Mark these spacings as processed
              groupData.spacingIds.forEach((id) => processedSpacings.add(id));
            }
          } else {
            // Group is invalid, clean it up later
            // Don't mark as processed so they can be handled individually
          }
        }
      });

      // STEP 2: Process remaining spacings for new grouping
      for (let i = 0; i < sortedSpacings.length; i++) {
        const currentSpacingId = sortedSpacings[i];

        if (processedSpacings.has(currentSpacingId)) continue;

        const currentConfig = config.doorsDrawersConfig[currentSpacingId];

        // Skip if already processed in a group
        const alreadyProcessed = groupedSpacings.some((group) =>
          group.spacingIds.includes(currentSpacingId)
        );
        if (alreadyProcessed) continue;

        // Check if this spacing type should never be grouped
        const isDrawer =
          currentConfig === "drawer" || currentConfig === "drawerVerre";
        const isSlidingDoor = [
          "slidingDoor",
          "slidingMirrorDoor",
          "slidingGlassDoor",
        ].includes(currentConfig);

        if (isDrawer || isSlidingDoor) {
          // Create individual group for drawers and sliding doors
          const parts = currentSpacingId.split("-");
          const spacingIndex =
            parts.length === 5 ? parseInt(parts[4]) : parseInt(parts[2]);
          const groupData = createGroupData(
            [currentSpacingId],
            columnId,
            spacingIndex,
            spacingIndex
          );
          if (groupData) {
            groupedSpacings.push(groupData);
            processedSpacings.add(currentSpacingId);
          }
          continue;
        }

        // Check if this should be grouped (multi-selection logic)
        const isCurrentlySelected = selectedSpacings.includes(currentSpacingId);
        let shouldCreateNewGroup = false;

        if (isCurrentlySelected && selectedSpacings.length > 1) {
          // Multiple selection mode: create new group if explicitly selected together
          shouldCreateNewGroup = true;
        }

        if (shouldCreateNewGroup) {
          // Find consecutive group with same config from selection
          const groupMembers = findConsecutiveGroupFromSelection(
            currentSpacingId,
            sortedSpacings,
            currentConfig,
            selectedSpacings,
            processedSpacings
          );

          if (groupMembers.length > 1) {
            const firstParts = groupMembers[0].split("-");
            const lastParts = groupMembers[groupMembers.length - 1].split("-");
            const startIndex =
              firstParts.length === 5
                ? parseInt(firstParts[4])
                : parseInt(firstParts[2]);
            const endIndex =
              lastParts.length === 5
                ? parseInt(lastParts[4])
                : parseInt(lastParts[2]);

            const groupData = createGroupData(
              groupMembers,
              columnId,
              startIndex,
              endIndex
            );
            if (groupData) {
              groupedSpacings.push(groupData);
              groupMembers.forEach((id) => processedSpacings.add(id));

              // IMPORTANT: Save this new group to groupedDoorsConfig
              const newGroupId = `${columnId}-${startIndex}-${endIndex}-${Date.now()}`;
              const updatedGroupedDoorsConfig = {
                ...groupedDoorsConfig,
                [newGroupId]: {
                  spacingIds: groupMembers,
                  doorType: currentConfig,
                  createdAt: Date.now(),
                },
              };
              updateConfig("groupedDoorsConfig", updatedGroupedDoorsConfig);
            }
            continue;
          }
        }

        // Create individual group (single door)
        const parts = currentSpacingId.split("-");
        const spacingIndex =
          parts.length === 5 ? parseInt(parts[4]) : parseInt(parts[2]);
        const groupData = createGroupData(
          [currentSpacingId],
          columnId,
          spacingIndex,
          spacingIndex
        );
        if (groupData) {
          groupedSpacings.push(groupData);
          processedSpacings.add(currentSpacingId);
        }
      }
    });

    // STEP 3: Cleanup invalid groups
    cleanupInvalidGroups();

    return groupedSpacings;
  };

  // Helper function: Find consecutive group members from current selection
  const findConsecutiveGroupFromSelection = (
    startSpacingId: string,
    sortedSpacings: string[],
    targetConfig: string,
    selectedSpacings: string[],
    processedSpacings: Set<string>
  ): string[] => {
    const parts = startSpacingId.split("-");
    const startIndex =
      parts.length === 5 ? parseInt(parts[4]) : parseInt(parts[2]);

    const group = [startSpacingId];

    // Only include spacings that are:
    // 1. Selected
    // 2. Same config
    // 3. Consecutive
    // 4. Not already processed

    // Look backwards
    for (let i = startIndex - 1; i >= 0; i--) {
      const candidateId = sortedSpacings.find((id) => {
        const candidateParts = id.split("-");
        const candidateIndex =
          candidateParts.length === 5
            ? parseInt(candidateParts[4])
            : parseInt(candidateParts[2]);
        return candidateIndex === i;
      });

      if (!candidateId || processedSpacings.has(candidateId)) break;

      const candidateConfig = config.doorsDrawersConfig[candidateId];
      if (candidateConfig !== targetConfig) break;

      // Must be selected to be included in new group
      if (!selectedSpacings.includes(candidateId)) break;

      group.unshift(candidateId);
    }

    // Look forwards
    for (let i = startIndex + 1; i < 100; i++) {
      const candidateId = sortedSpacings.find((id) => {
        const candidateParts = id.split("-");
        const candidateIndex =
          candidateParts.length === 5
            ? parseInt(candidateParts[4])
            : parseInt(candidateParts[2]);
        return candidateIndex === i;
      });

      if (!candidateId || processedSpacings.has(candidateId)) break;

      const candidateConfig = config.doorsDrawersConfig[candidateId];
      if (candidateConfig !== targetConfig) break;

      // Must be selected to be included in new group
      if (!selectedSpacings.includes(candidateId)) break;

      group.push(candidateId);
    }

    return group;
  };

  // Helper function: Cleanup invalid groups
  const cleanupInvalidGroups = () => {
    const groupedDoorsConfig = config.groupedDoorsConfig || {};
    const updatedConfig = { ...groupedDoorsConfig };
    let hasChanges = false;

    Object.entries(groupedDoorsConfig).forEach(([groupId, groupData]) => {
      // Check if all spacings in group still exist and have same config
      const allValid = groupData.spacingIds.every((spacingId) => {
        const currentConfig = config.doorsDrawersConfig[spacingId];
        return currentConfig === groupData.doorType;
      });

      if (!allValid) {
        delete updatedConfig[groupId];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      updateConfig("groupedDoorsConfig", updatedConfig);
    }
  };

  // Helper function to group consecutive selected spacings by column
  const getGroupedSelectedSpacings = () => {
    const selectedSpacings = config.selectedSpacingIds || [];
    if (selectedSpacings.length === 0) return [];

    // Group by column
    const columnGroups: Record<string, string[]> = {};

    selectedSpacings.forEach((spacingId) => {
      const parts = spacingId.split("-");
      if (parts.length < 4) return;

      let columnId: string;

      if (parts.length === 5 && parts[1] === "col" && parts[3] === "spacing") {
        columnId = `${parts[0]}-${parts[1]}-${parts[2]}`;
      } else {
        columnId = parts[0];
      }

      if (!columnGroups[columnId]) {
        columnGroups[columnId] = [];
      }
      columnGroups[columnId].push(spacingId);
    });

    // For each column, group consecutive spacings
    const groupedSpacings: Array<{
      groupId: string;
      spacingIds: string[];
      startIndex: number;
      endIndex: number;
      columnId: string;
      totalHeight: number;
      centerY: number;
      width: number;
      x: number;
    }> = [];

    Object.entries(columnGroups).forEach(([columnId, spacingIds]) => {
      // Sort by spacing index
      const sortedSpacings = spacingIds.sort((a, b) => {
        const partsA = a.split("-");
        const partsB = b.split("-");
        const indexA =
          partsA.length === 5 ? parseInt(partsA[4]) : parseInt(partsA[2]);
        const indexB =
          partsB.length === 5 ? parseInt(partsB[4]) : parseInt(partsB[2]);
        return indexA - indexB;
      });

      // Find consecutive groups
      let currentGroup: string[] = [];
      let currentStartIndex = -1;

      sortedSpacings.forEach((spacingId) => {
        const parts = spacingId.split("-");
        const spacingIndex =
          parts.length === 5 ? parseInt(parts[4]) : parseInt(parts[2]);
        const spacingConfig = config.doorsDrawersConfig[spacingId];

        // Check if this is a drawer - drawers should not be grouped
        const isDrawer =
          spacingConfig === "drawer" || spacingConfig === "drawerVerre";

        // Check if this is a sliding door - sliding doors have their own logic
        const isSlidingDoor =
          spacingConfig === "slidingDoor" ||
          spacingConfig === "slidingMirrorDoor" ||
          spacingConfig === "slidingGlassDoor";

        if (currentGroup.length === 0) {
          currentGroup = [spacingId];
          currentStartIndex = spacingIndex;
        } else {
          const lastParts = currentGroup[currentGroup.length - 1].split("-");
          const lastIndex =
            lastParts.length === 5
              ? parseInt(lastParts[4])
              : parseInt(lastParts[2]);

          // For drawers, never group them
          if (isDrawer) {
            // Create individual group for drawer
            if (currentGroup.length > 0) {
              const groupData = createGroupData(
                currentGroup,
                columnId,
                currentStartIndex,
                lastIndex
              );
              if (groupData) {
                groupedSpacings.push(groupData);
              }
            }
            currentGroup = [spacingId];
            currentStartIndex = spacingIndex;
          }
          // For sliding doors, never group them (they have their own logic)
          else if (isSlidingDoor) {
            // Create individual group for sliding door
            if (currentGroup.length > 0) {
              const groupData = createGroupData(
                currentGroup,
                columnId,
                currentStartIndex,
                lastIndex
              );
              if (groupData) {
                groupedSpacings.push(groupData);
              }
            }
            currentGroup = [spacingId];
            currentStartIndex = spacingIndex;
          }
          // For other door types, group if consecutive
          else if (spacingIndex === lastIndex + 1) {
            // Consecutive
            currentGroup.push(spacingId);
          } else {
            // Not consecutive, create group and start new one
            if (currentGroup.length > 0) {
              const groupData = createGroupData(
                currentGroup,
                columnId,
                currentStartIndex,
                lastIndex
              );
              if (groupData) {
                groupedSpacings.push(groupData);
              }
            }
            currentGroup = [spacingId];
            currentStartIndex = spacingIndex;
          }
        }
      });

      // Add the last group
      if (currentGroup.length > 0) {
        const lastParts = currentGroup[currentGroup.length - 1].split("-");
        const lastIndex =
          lastParts.length === 5
            ? parseInt(lastParts[4])
            : parseInt(lastParts[2]);
        const groupData = createGroupData(
          currentGroup,
          columnId,
          currentStartIndex,
          lastIndex
        );
        if (groupData) {
          groupedSpacings.push(groupData);
        }
      }
    });

    return groupedSpacings;
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
    const travel = widthAmt; // Di chuyển toàn bộ width của mảnh cửa
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
  // Update shouldDisableInteractions function
  const shouldDisableInteractions = () => {
    return shouldDisableAnimations();
  };

  // Render different facade types for grouped spacings
  const renderGroupedFacade = (
    type: string,
    groupData: any,
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

    // Get handle type for the first spacing in the group
    const firstSpacingId = groupData.spacingIds[0];
    const handleType = config.handleConfig[firstSpacingId] || config.handleType;

    switch (type) {
      case "leftDoor":
        // Porte Gauche - door hinged on left side

        return (
          <group
            position={[
              groupData.x - facadeWidth / 2,
              groupData.centerY,
              facadeZ,
            ]}
          >
            <group
              ref={(ref) => {
                if (ref)
                  doorGroupsRef.current[`${groupData.groupId}-leftDoor`] = ref;
              }}
              position={[0, 0, 0]} // Hinge tại vị trí này
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-leftDoor`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, true, "left");
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-leftDoor`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, false, "left");
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-leftDoor`;
                const next = !openedDoorsRef.current[k];
                openedDoorsRef.current[k] = next;
                triggerDoorSwing(k, next, "left");
              }}
            >
              {/* Door panel - pivot từ left edge */}
              <mesh
                position={[facadeWidth / 2, 0, 0]}
                userData={{
                  type: "facade",
                  spacingId: firstSpacingId,
                  columnId: groupData.columnId,
                  sectionName: getSectionNameFromSpacingId(firstSpacingId),
                }}
                onPointerOver={() => handleFacadePointerOver(firstSpacingId)}
                onPointerOut={handleFacadePointerOut}
                onClick={() => handleFacadeClick(firstSpacingId)}
              >
                <boxGeometry
                  args={[facadeWidth, facadeHeight + thickness, thickness]}
                />
                <meshStandardMaterial
                  map={getFacadeTexture(firstSpacingId)}
                  color="white"
                />
              </mesh>

              <FacadeHighlight
                overlaySize={[facadeWidth, facadeHeight + thickness, thickness]}
                overlayPosition={[facadeWidth / 2, 0, 0.01]}
                iconPosition={[facadeWidth / 2, 0, thickness / 2 + 0.02]}
                spacingId={firstSpacingId}
              />

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
          <group
            position={[
              groupData.x + facadeWidth / 2,
              groupData.centerY,
              facadeZ,
            ]}
          >
            <group
              ref={(ref) => {
                if (ref)
                  doorGroupsRef.current[`${groupData.groupId}-rightDoor`] = ref;
              }}
              position={[0, 0, 0]} // Hinge tại vị trí này
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-rightDoor`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, true, "right");
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-rightDoor`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, false, "right");
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-rightDoor`;
                const next = !openedDoorsRef.current[k];
                openedDoorsRef.current[k] = next;
                triggerDoorSwing(k, next, "right");
              }}
            >
              {/* Door panel - pivot từ right edge */}
              <mesh
                position={[-facadeWidth / 2, 0, 0]}
                userData={{
                  type: "facade",
                  spacingId: firstSpacingId,
                  columnId: groupData.columnId,
                  sectionName: getSectionNameFromSpacingId(firstSpacingId),
                }}
                onPointerOver={() => handleFacadePointerOver(firstSpacingId)}
                onPointerOut={handleFacadePointerOut}
                onClick={() => handleFacadeClick(firstSpacingId)}
              >
                <boxGeometry
                  args={[facadeWidth, facadeHeight + thickness, thickness]}
                />
                <meshStandardMaterial
                  map={getFacadeTexture(firstSpacingId)}
                  color="white"
                />
              </mesh>

              <FacadeHighlight
                overlaySize={[facadeWidth, facadeHeight + thickness, thickness]}
                overlayPosition={[-facadeWidth / 2, 0, 0.01]}
                iconPosition={[-facadeWidth / 2, 0, thickness / 2 + 0.02]}
                spacingId={firstSpacingId}
              />

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
        // Tiroir - ngăn kéo đầy đủ bộ phận (mặt trước mỏng, 2 thành, đáy, mặt sau)
        const drawerDepth = depth * 0.6; // Độ sâu của ngăn kéo
        const drawerHeight = facadeHeight * 0.8; // Chiều cao bên trong ngăn kéo
        const sideThickness = thickness * 0.5; // Độ dày thành bên

        return (
          <group
            position={[groupData.x, groupData.centerY, facadeZ]}
            ref={(ref) => {
              if (ref)
                drawerGroupsRef.current[`${groupData.groupId}-drawer`] = ref;
            }}
            onPointerOver={(e) => {
              if (shouldDisableInteractions()) return;
              e.stopPropagation();
              const k = `${groupData.groupId}-drawer`;
              if (!openedDrawersRef.current[k]) triggerDrawer(k, true, facadeZ);
            }}
            onPointerOut={(e) => {
              if (shouldDisableInteractions()) return;
              e.stopPropagation();
              const k = `${groupData.groupId}-drawer`;
              if (!openedDrawersRef.current[k])
                triggerDrawer(k, false, facadeZ);
            }}
            onClick={(e) => {
              if (shouldDisableInteractions()) return;
              e.stopPropagation();
              const k = `${groupData.groupId}-drawer`;
              const next = !openedDrawersRef.current[k];
              openedDrawersRef.current[k] = next;
              triggerDrawer(k, next, facadeZ);
            }}
          >
            {/* Drawer front panel */}
            <mesh
              position={[0, 0, 0]}
              userData={{
                type: "facade",
                spacingId: firstSpacingId,
                columnId: groupData.columnId,
                sectionName: getSectionNameFromSpacingId(firstSpacingId),
              }}
              onPointerOver={() => handleFacadePointerOver(firstSpacingId)}
              onPointerOut={handleFacadePointerOut}
              onClick={() => handleFacadeClick(firstSpacingId)}
            >
              <boxGeometry
                args={[facadeWidth, facadeHeight + thickness, thickness]}
              />
              <meshStandardMaterial
                map={getFacadeTexture(firstSpacingId)}
                color="white"
                roughness={0.7}
                metalness={0.1}
              />
            </mesh>

            <FacadeHighlight
              overlaySize={[facadeWidth, facadeHeight + thickness, thickness]}
              overlayPosition={[0, 0, 0.01]}
              iconPosition={[0, 0, thickness / 2 + 0.02]}
              spacingId={firstSpacingId}
            />

            {/* Left side panel */}
            <mesh
              position={[
                -facadeWidth / 2 + sideThickness / 2,
                0,
                -drawerDepth / 2,
              ]}
            >
              <boxGeometry args={[sideThickness, drawerHeight, drawerDepth]} />
              <meshStandardMaterial
                map={getFacadeTexture(firstSpacingId)}
                roughness={0.7}
                metalness={0.1}
              />
            </mesh>

            {/* Right side panel */}
            <mesh
              position={[
                facadeWidth / 2 - sideThickness / 2,
                0,
                -drawerDepth / 2,
              ]}
            >
              <boxGeometry args={[sideThickness, drawerHeight, drawerDepth]} />
              <meshStandardMaterial
                map={getFacadeTexture(firstSpacingId)}
                roughness={0.7}
                metalness={0.1}
              />
            </mesh>

            {/* Bottom panel */}
            <mesh
              position={[
                0,
                -drawerHeight / 2 + sideThickness / 2,
                -drawerDepth / 2,
              ]}
            >
              <boxGeometry
                args={[
                  facadeWidth - sideThickness * 2,
                  sideThickness,
                  drawerDepth,
                ]}
              />
              <meshStandardMaterial
                map={getFacadeTexture(firstSpacingId)}
                roughness={0.7}
                metalness={0.1}
              />
            </mesh>

            {/* Back panel */}
            <mesh position={[0, 0, -drawerDepth]}>
              <boxGeometry
                args={[
                  facadeWidth - sideThickness * 2,
                  drawerHeight,
                  sideThickness,
                ]}
              />
              <meshStandardMaterial
                map={getFacadeTexture(firstSpacingId)}
                roughness={0.7}
                metalness={0.1}
              />
            </mesh>

            {/* Drawer handle in center */}
            {renderHandle(handleType, [0, 0, thickness / 2 + 0.01])}
          </group>
        );

      case "leftDoorVerre":
        // Porte Gauche en Verre - door hinged on left side with glass material
        return (
          <group
            position={[
              groupData.x - facadeWidth / 2,
              groupData.centerY,
              facadeZ,
            ]}
          >
            <group
              ref={(ref) => {
                if (ref)
                  doorGroupsRef.current[`${groupData.groupId}-leftDoorVerre`] =
                    ref;
              }}
              position={[0, 0, 0]} // Hinge tại vị trí này
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-leftDoorVerre`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, true, "left");
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-leftDoorVerre`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, false, "left");
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-leftDoorVerre`;
                const next = !openedDoorsRef.current[k];
                openedDoorsRef.current[k] = next;
                triggerDoorSwing(k, next, "left");
              }}
            >
              {/* Door panel - pivot từ left edge */}
              <mesh position={[facadeWidth / 2, 0, 0]}>
                <boxGeometry
                  args={[facadeWidth, facadeHeight + thickness, thickness]}
                />
                <meshPhysicalMaterial
                  key={`glass-door-material-${groupData.groupId}-left`}
                  color="#000000"
                  transparent={true}
                  opacity={0.15}
                  metalness={0.1}
                  roughness={0.0}
                  transmission={0.85}
                  thickness={0.1}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Glass border */}
              <mesh position={[facadeWidth / 2, 0, 0.001]}>
                <boxGeometry
                  args={[
                    facadeWidth + 0.01,
                    facadeHeight + thickness + 0.01,
                    0.002,
                  ]}
                />
                <meshStandardMaterial
                  key={`glass-border-material-${groupData.groupId}-left`}
                  color="#666"
                  transparent={true}
                  opacity={0.3}
                />
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

      case "rightDoorVerre":
        // Porte Droite en Verre - door hinged on right side with glass material
        return (
          <group
            position={[
              groupData.x + facadeWidth / 2,
              groupData.centerY,
              facadeZ,
            ]}
          >
            <group
              ref={(ref) => {
                if (ref)
                  doorGroupsRef.current[`${groupData.groupId}-rightDoorVerre`] =
                    ref;
              }}
              position={[0, 0, 0]} // Hinge tại vị trí này
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-rightDoorVerre`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, true, "right");
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-rightDoorVerre`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, false, "right");
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-rightDoorVerre`;
                const next = !openedDoorsRef.current[k];
                openedDoorsRef.current[k] = next;
                triggerDoorSwing(k, next, "right");
              }}
            >
              {/* Door panel - pivot từ right edge */}
              <mesh position={[-facadeWidth / 2, 0, 0]}>
                <boxGeometry
                  args={[facadeWidth, facadeHeight + thickness, thickness]}
                />
                <meshPhysicalMaterial
                  key={`glass-door-material-${groupData.groupId}-right`}
                  color="#000000"
                  transparent={true}
                  opacity={0.15}
                  metalness={0.1}
                  roughness={0.0}
                  transmission={0.85}
                  thickness={0.1}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Glass border */}
              <mesh position={[-facadeWidth / 2, 0, 0.001]}>
                <boxGeometry
                  args={[
                    facadeWidth + 0.01,
                    facadeHeight + thickness + 0.01,
                    0.002,
                  ]}
                />
                <meshStandardMaterial
                  key={`glass-border-material-${groupData.groupId}-right`}
                  color="#666"
                  transparent={true}
                  opacity={0.3}
                />
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

      case "drawerVerre":
        // Tiroir en Verre - complete glass drawer with all sides
        const drawerDepthVerre = depth * 0.6; // Độ sâu của ngăn kéo
        const drawerHeightVerre = facadeHeight * 0.8; // Chiều cao bên trong ngăn kéo
        const sideThicknessVerre = thickness * 0.5; // Độ dày thành bên

        return (
          <group
            position={[groupData.x, groupData.centerY, facadeZ]}
            ref={(ref) => {
              if (ref)
                drawerGroupsRef.current[`${groupData.groupId}-drawerVerre`] =
                  ref;
            }}
            onPointerOver={(e) => {
              if (shouldDisableInteractions()) return;
              e.stopPropagation();
              const k = `${groupData.groupId}-drawerVerre`;
              if (!openedDrawersRef.current[k]) triggerDrawer(k, true, facadeZ);
            }}
            onPointerOut={(e) => {
              if (shouldDisableInteractions()) return;
              e.stopPropagation();
              const k = `${groupData.groupId}-drawerVerre`;
              if (!openedDrawersRef.current[k])
                triggerDrawer(k, false, facadeZ);
            }}
            onClick={(e) => {
              if (shouldDisableInteractions()) return;
              e.stopPropagation();
              const k = `${groupData.groupId}-drawerVerre`;
              const next = !openedDrawersRef.current[k];
              openedDrawersRef.current[k] = next;
              triggerDrawer(k, next, facadeZ);
            }}
          >
            {/* Drawer front panel */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry
                args={[facadeWidth, facadeHeight + thickness, thickness]}
              />
              <meshPhysicalMaterial
                key={`glass-drawer-material-${groupData.groupId}`}
                color="#000000"
                transparent={true}
                opacity={0.15}
                metalness={0.1}
                roughness={0.0}
                transmission={0.85}
                thickness={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Glass border for front */}
            <mesh position={[0, 0, 0.001]}>
              <boxGeometry
                args={[
                  facadeWidth + 0.01,
                  facadeHeight + thickness + 0.01,
                  0.002,
                ]}
              />
              <meshStandardMaterial
                key={`glass-drawer-border-material-${groupData.groupId}`}
                color="#666"
                transparent={true}
                opacity={0.3}
              />
            </mesh>

            {/* Left side panel */}
            <mesh
              position={[
                -facadeWidth / 2 + sideThicknessVerre / 2,
                0,
                -drawerDepthVerre / 2,
              ]}
            >
              <boxGeometry
                args={[sideThicknessVerre, drawerHeightVerre, drawerDepthVerre]}
              />
              <meshPhysicalMaterial
                key={`glass-drawer-side-material-${groupData.groupId}-left`}
                color="#000000"
                transparent={true}
                opacity={0.15}
                metalness={0.1}
                roughness={0.0}
                transmission={0.85}
                thickness={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Right side panel */}
            <mesh
              position={[
                facadeWidth / 2 - sideThicknessVerre / 2,
                0,
                -drawerDepthVerre / 2,
              ]}
            >
              <boxGeometry
                args={[sideThicknessVerre, drawerHeightVerre, drawerDepthVerre]}
              />
              <meshPhysicalMaterial
                key={`glass-drawer-side-material-${groupData.groupId}-right`}
                color="#000000"
                transparent={true}
                opacity={0.15}
                metalness={0.1}
                roughness={0.0}
                transmission={0.85}
                thickness={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Bottom panel */}
            <mesh
              position={[
                0,
                -drawerHeightVerre / 2 + sideThicknessVerre / 2,
                -drawerDepthVerre / 2,
              ]}
            >
              <boxGeometry
                args={[
                  facadeWidth - sideThicknessVerre * 2,
                  sideThicknessVerre,
                  drawerDepthVerre,
                ]}
              />
              <meshPhysicalMaterial
                key={`glass-drawer-bottom-material-${groupData.groupId}`}
                color="#000000"
                transparent={true}
                opacity={0.15}
                metalness={0.1}
                roughness={0.0}
                transmission={0.85}
                thickness={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Back panel */}
            <mesh position={[0, 0, -drawerDepthVerre]}>
              <boxGeometry
                args={[
                  facadeWidth - sideThicknessVerre * 2,
                  drawerHeightVerre,
                  sideThicknessVerre,
                ]}
              />
              <meshPhysicalMaterial
                key={`glass-drawer-back-material-${groupData.groupId}`}
                color="#000000"
                transparent={true}
                opacity={0.15}
                metalness={0.1}
                roughness={0.0}
                transmission={0.85}
                thickness={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Drawer handle in center */}
            {renderHandle(handleType, [0, 0, thickness / 2 + 0.01])}
          </group>
        );

      case "doubleSwingDoor":
        // Porte Double - two doors hinged on opposite sides
        const doorWidthSwing = facadeWidth / 2; // Mỗi cửa chiếm đúng một nửa chiều rộng

        return (
          <group position={[groupData.x, groupData.centerY, facadeZ]}>
            {/* Left door */}
            <group
              ref={(ref) => {
                if (ref)
                  doorGroupsRef.current[
                    `${groupData.groupId}-doubleSwingDoor-left`
                  ] = ref;
              }}
              position={[-facadeWidth / 2, 0, 0]} // Hinge tại left edge của toàn bộ facade
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleSwingDoor-left`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, true, "left");
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleSwingDoor-left`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, false, "left");
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleSwingDoor-left`;
                const next = !openedDoorsRef.current[k];
                openedDoorsRef.current[k] = next;
                triggerDoorSwing(k, next, "left");
              }}
            >
              {/* Left door panel */}
              <mesh
                position={[doorWidthSwing / 2, 0, 0]}
                userData={{
                  type: "facade",
                  spacingId: firstSpacingId,
                  columnId: groupData.columnId,
                  sectionName: getSectionNameFromSpacingId(firstSpacingId),
                }}
                onPointerOver={() => handleFacadePointerOver(firstSpacingId)}
                onPointerOut={handleFacadePointerOut}
                onClick={() => handleFacadeClick(firstSpacingId)}
              >
                <boxGeometry
                  args={[doorWidthSwing, facadeHeight + thickness, thickness]}
                />
                <meshStandardMaterial
                  map={getFacadeTexture(firstSpacingId)}
                  color="white"
                />
              </mesh>

              <FacadeHighlight
                overlaySize={[
                  doorWidthSwing,
                  facadeHeight + thickness,
                  thickness,
                ]}
                overlayPosition={[doorWidthSwing / 2, 0, 0.01]}
                iconPosition={[doorWidthSwing / 2, 0, thickness / 2 + 0.02]}
                spacingId={firstSpacingId}
              />

              {/* Left door handle ở RIGHT SIDE */}
              {renderHandle(handleType, [
                doorWidthSwing - 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>

            {/* Right door */}
            <group
              ref={(ref) => {
                if (ref)
                  doorGroupsRef.current[
                    `${groupData.groupId}-doubleSwingDoor-right`
                  ] = ref;
              }}
              position={[facadeWidth / 2, 0, 0]} // Hinge tại right edge của toàn bộ facade
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleSwingDoor-right`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, true, "right");
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleSwingDoor-right`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, false, "right");
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleSwingDoor-right`;
                const next = !openedDoorsRef.current[k];
                openedDoorsRef.current[k] = next;
                triggerDoorSwing(k, next, "right");
              }}
            >
              {/* Right door panel */}
              <mesh
                position={[-doorWidthSwing / 2, 0, 0]}
                userData={{
                  type: "facade",
                  spacingId: firstSpacingId,
                  columnId: groupData.columnId,
                  sectionName: getSectionNameFromSpacingId(firstSpacingId),
                }}
                onPointerOver={() => handleFacadePointerOver(firstSpacingId)}
                onPointerOut={handleFacadePointerOut}
                onClick={() => handleFacadeClick(firstSpacingId)}
              >
                <boxGeometry
                  args={[doorWidthSwing, facadeHeight + thickness, thickness]}
                />
                <meshStandardMaterial
                  map={getFacadeTexture(firstSpacingId)}
                  color="white"
                />
              </mesh>

              <FacadeHighlight
                overlaySize={[
                  doorWidthSwing,
                  facadeHeight + thickness,
                  thickness,
                ]}
                overlayPosition={[-doorWidthSwing / 2, 0, 0.01]}
                iconPosition={[-doorWidthSwing / 2, 0, thickness + 0.02]}
                spacingId={firstSpacingId}
              />

              {/* Right door handle ở LEFT SIDE */}
              {renderHandle(handleType, [
                -doorWidthSwing + 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>
          </group>
        );

      case "doubleSwingDoorVerre":
        // Porte Double en Verre - two glass doors hinged on opposite sides
        const doorWidthSwingVerre = facadeWidth / 2; // Mỗi cửa chiếm đúng một nửa chiều rộng

        return (
          <group position={[groupData.x, groupData.centerY, facadeZ]}>
            {/* Left glass door */}
            <group
              ref={(ref) => {
                if (ref)
                  doorGroupsRef.current[
                    `${groupData.groupId}-doubleSwingDoorVerre-left`
                  ] = ref;
              }}
              position={[-facadeWidth / 2, 0, 0]} // Hinge tại left edge của toàn bộ facade
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleSwingDoorVerre-left`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, true, "left");
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleSwingDoorVerre-left`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, false, "left");
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleSwingDoorVerre-left`;
                const next = !openedDoorsRef.current[k];
                openedDoorsRef.current[k] = next;
                triggerDoorSwing(k, next, "left");
              }}
            >
              {/* Left glass door panel */}
              <mesh position={[doorWidthSwingVerre / 2, 0, 0]}>
                <boxGeometry
                  args={[
                    doorWidthSwingVerre,
                    facadeHeight + thickness,
                    thickness,
                  ]}
                />
                <meshPhysicalMaterial
                  key={`glass-double-swing-door-material-${groupData.groupId}-left`}
                  color="#000000"
                  transparent={true}
                  opacity={0.15}
                  metalness={0.1}
                  roughness={0.0}
                  transmission={0.85}
                  thickness={0.1}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Glass border for left door */}
              <mesh position={[doorWidthSwingVerre / 2, 0, 0.001]}>
                <boxGeometry
                  args={[
                    doorWidthSwingVerre + 0.01,
                    facadeHeight + thickness + 0.01,
                    0.002,
                  ]}
                />
                <meshStandardMaterial
                  key={`glass-double-swing-door-border-material-${groupData.groupId}-left`}
                  color="#666"
                  transparent={true}
                  opacity={0.3}
                />
              </mesh>
              {/* Left door handle ở RIGHT SIDE */}
              {renderHandle(handleType, [
                doorWidthSwingVerre - 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>

            {/* Right glass door */}
            <group
              ref={(ref) => {
                if (ref)
                  doorGroupsRef.current[
                    `${groupData.groupId}-doubleSwingDoorVerre-right`
                  ] = ref;
              }}
              position={[facadeWidth / 2, 0, 0]} // Hinge tại right edge của toàn bộ facade
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleSwingDoorVerre-right`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, true, "right");
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleSwingDoorVerre-right`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, false, "right");
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleSwingDoorVerre-right`;
                const next = !openedDoorsRef.current[k];
                openedDoorsRef.current[k] = next;
                triggerDoorSwing(k, next, "right");
              }}
            >
              {/* Right glass door panel */}
              <mesh position={[-doorWidthSwingVerre / 2, 0, 0]}>
                <boxGeometry
                  args={[
                    doorWidthSwingVerre,
                    facadeHeight + thickness,
                    thickness,
                  ]}
                />
                <meshPhysicalMaterial
                  key={`glass-double-swing-door-material-${groupData.groupId}-right`}
                  color="#000000"
                  transparent={true}
                  opacity={0.15}
                  metalness={0.1}
                  roughness={0.0}
                  transmission={0.85}
                  thickness={0.1}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Glass border for right door */}
              <mesh position={[-doorWidthSwingVerre / 2, 0, 0.001]}>
                <boxGeometry
                  args={[
                    doorWidthSwingVerre + 0.01,
                    facadeHeight + thickness + 0.01,
                    0.002,
                  ]}
                />
                <meshStandardMaterial
                  key={`glass-double-swing-door-border-material-${groupData.groupId}-right`}
                  color="#666"
                  transparent={true}
                  opacity={0.3}
                />
              </mesh>
              {/* Right door handle ở LEFT SIDE */}
              {renderHandle(handleType, [
                -doorWidthSwingVerre + 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>
          </group>
        );

      case "doubleDoor":
        // Porte Double - two doors hinged on opposite sides
        const doorWidth = facadeWidth / 2 - 0.01; // Mỗi cửa chiếm một nửa chiều rộng, trừ đi khoảng cách nhỏ ở giữa

        return (
          <group position={[groupData.x, groupData.centerY, facadeZ]}>
            {/* Left door */}
            <group
              ref={(ref) => {
                if (ref)
                  doorGroupsRef.current[
                    `${groupData.groupId}-doubleDoor-left`
                  ] = ref;
              }}
              position={[-doorWidth / 2, 0, 0]} // Hinge tại left edge
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleDoor-left`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, true, "left");
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleDoor-left`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, false, "left");
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleDoor-left`;
                const next = !openedDoorsRef.current[k];
                openedDoorsRef.current[k] = next;
                triggerDoorSwing(k, next, "left");
              }}
            >
              {/* Left door panel */}
              <mesh position={[doorWidth / 2, 0, 0]}>
                <boxGeometry
                  args={[doorWidth, facadeHeight + thickness, thickness]}
                />
                <meshStandardMaterial
                  map={getFacadeTexture(firstSpacingId)}
                  color="white"
                />
              </mesh>
              {/* Left door handle ở RIGHT SIDE */}
              {renderHandle(handleType, [
                doorWidth - 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>

            {/* Right door */}
            <group
              ref={(ref) => {
                if (ref)
                  doorGroupsRef.current[
                    `${groupData.groupId}-doubleDoor-right`
                  ] = ref;
              }}
              position={[doorWidth / 2, 0, 0]} // Hinge tại right edge
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleDoor-right`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, true, "right");
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleDoor-right`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, false, "right");
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleDoor-right`;
                const next = !openedDoorsRef.current[k];
                openedDoorsRef.current[k] = next;
                triggerDoorSwing(k, next, "right");
              }}
            >
              {/* Right door panel */}
              <mesh position={[-doorWidth / 2, 0, 0]}>
                <boxGeometry
                  args={[doorWidth, facadeHeight + thickness, thickness]}
                />
                <meshStandardMaterial
                  map={getFacadeTexture(firstSpacingId)}
                  color="white"
                />
              </mesh>
              {/* Right door handle ở LEFT SIDE */}
              {renderHandle(handleType, [
                -doorWidth + 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>
          </group>
        );

      case "doubleDoorVerre":
        // Porte Double en Verre - two glass doors hinged on opposite sides
        const doorWidthVerre = facadeWidth / 2 - 0.01; // Mỗi cửa chiếm một nửa chiều rộng, trừ đi khoảng cách nhỏ ở giữa

        return (
          <group position={[groupData.x, groupData.centerY, facadeZ]}>
            {/* Left glass door */}
            <group
              ref={(ref) => {
                if (ref)
                  doorGroupsRef.current[
                    `${groupData.groupId}-doubleDoorVerre-left`
                  ] = ref;
              }}
              position={[-doorWidthVerre / 2, 0, 0]} // Hinge tại left edge
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleDoorVerre-left`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, true, "left");
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleDoorVerre-left`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, false, "left");
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleDoorVerre-left`;
                const next = !openedDoorsRef.current[k];
                openedDoorsRef.current[k] = next;
                triggerDoorSwing(k, next, "left");
              }}
            >
              {/* Left glass door panel */}
              <mesh position={[doorWidthVerre / 2, 0, 0]}>
                <boxGeometry
                  args={[doorWidthVerre, facadeHeight + thickness, thickness]}
                />
                <meshPhysicalMaterial
                  key={`glass-double-door-material-${groupData.groupId}-left`}
                  color="#000000"
                  transparent={true}
                  opacity={0.15}
                  metalness={0.1}
                  roughness={0.0}
                  transmission={0.85}
                  thickness={0.1}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Glass border for left door */}
              <mesh position={[doorWidthVerre / 2, 0, 0.001]}>
                <boxGeometry
                  args={[
                    doorWidthVerre + 0.01,
                    facadeHeight + thickness + 0.01,
                    0.002,
                  ]}
                />
                <meshStandardMaterial
                  key={`glass-double-door-border-material-${groupData.groupId}-left`}
                  color="#666"
                  transparent={true}
                  opacity={0.3}
                />
              </mesh>
              {/* Left door handle ở RIGHT SIDE */}
              {renderHandle(handleType, [
                doorWidthVerre - 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>

            {/* Right glass door */}
            <group
              ref={(ref) => {
                if (ref)
                  doorGroupsRef.current[
                    `${groupData.groupId}-doubleDoorVerre-right`
                  ] = ref;
              }}
              position={[doorWidthVerre / 2, 0, 0]} // Hinge tại right edge
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleDoorVerre-right`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, true, "right");
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleDoorVerre-right`;
                if (!openedDoorsRef.current[k])
                  triggerDoorSwing(k, false, "right");
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-doubleDoorVerre-right`;
                const next = !openedDoorsRef.current[k];
                openedDoorsRef.current[k] = next;
                triggerDoorSwing(k, next, "right");
              }}
            >
              {/* Right glass door panel */}
              <mesh position={[-doorWidthVerre / 2, 0, 0]}>
                <boxGeometry
                  args={[doorWidthVerre, facadeHeight + thickness, thickness]}
                />
                <meshPhysicalMaterial
                  key={`glass-double-door-material-${groupData.groupId}-right`}
                  color="#000000"
                  transparent={true}
                  opacity={0.15}
                  metalness={0.1}
                  roughness={0.0}
                  transmission={0.85}
                  thickness={0.1}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Glass border for right door */}
              <mesh position={[-doorWidthVerre / 2, 0, 0.001]}>
                <boxGeometry
                  args={[
                    doorWidthVerre + 0.01,
                    facadeHeight + thickness + 0.01,
                    0.002,
                  ]}
                />
                <meshStandardMaterial
                  key={`glass-double-door-border-material-${groupData.groupId}-right`}
                  color="#666"
                  transparent={true}
                  opacity={0.3}
                />
              </mesh>
              {/* Right door handle ở LEFT SIDE */}
              {renderHandle(handleType, [
                -doorWidthVerre + 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>
          </group>
        );

      case "slidingDoor":
        // Porte Coulissante - sliding door
        const slidingDoorWidth = facadeWidth / 2; // Mỗi cửa chiếm một nửa chiều rộng

        return (
          <group position={[groupData.x, groupData.centerY, facadeZ]}>
            {/* Left sliding door */}
            <group
              ref={(ref) => {
                if (ref)
                  sliderGroupsRef.current[
                    `${groupData.groupId}-slidingDoor-left`
                  ] = ref;
              }}
              position={[-slidingDoorWidth / 2, 0, thickness]} // Lồi ra ngoài thêm thickness
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingDoor-left`;
                if (!openedSlidersRef.current[k])
                  triggerSlider(
                    k,
                    true,
                    -slidingDoorWidth / 2,
                    1,
                    slidingDoorWidth
                  );
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingDoor-left`;
                if (!openedSlidersRef.current[k])
                  triggerSlider(
                    k,
                    false,
                    -slidingDoorWidth / 2,
                    1,
                    slidingDoorWidth
                  );
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingDoor-left`;
                const next = !openedSlidersRef.current[k];
                openedSlidersRef.current[k] = next;
                triggerSlider(
                  k,
                  next,
                  -slidingDoorWidth / 2,
                  1,
                  slidingDoorWidth
                );
              }}
            >
              {/* Left sliding door panel */}
              <mesh
                position={[0, 0, 0]}
                userData={{
                  type: "facade",
                  spacingId: firstSpacingId,
                  columnId: groupData.columnId,
                  sectionName: getSectionNameFromSpacingId(firstSpacingId),
                }}
                onPointerOver={() => handleFacadePointerOver(firstSpacingId)}
                onPointerOut={handleFacadePointerOut}
                onClick={() => handleFacadeClick(firstSpacingId)}
              >
                <boxGeometry
                  args={[slidingDoorWidth, facadeHeight + thickness, thickness]}
                />
                <meshStandardMaterial
                  map={getFacadeTexture(firstSpacingId)}
                  color="white"
                />
              </mesh>

              <FacadeHighlight
                overlaySize={[
                  slidingDoorWidth,
                  facadeHeight + thickness,
                  thickness,
                ]}
                overlayPosition={[0, 0, 0.01]}
                iconPosition={[0, 0, thickness / 2 + 0.02]}
                spacingId={firstSpacingId}
              />

              {/* Left door handle */}
              {renderHandle(handleType, [
                slidingDoorWidth / 2 - 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>

            {/* Right sliding door */}
            <group
              ref={(ref) => {
                if (ref)
                  sliderGroupsRef.current[
                    `${groupData.groupId}-slidingDoor-right`
                  ] = ref;
              }}
              position={[slidingDoorWidth / 2, 0, 0]} // Mảnh phải ở vị trí bình thường
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingDoor-right`;
                if (!openedSlidersRef.current[k])
                  triggerSlider(
                    k,
                    true,
                    slidingDoorWidth / 2,
                    -1,
                    slidingDoorWidth
                  );
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingDoor-right`;
                if (!openedSlidersRef.current[k])
                  triggerSlider(
                    k,
                    false,
                    slidingDoorWidth / 2,
                    -1, // Di chuyển sang trái (về phía mảnh 1)
                    slidingDoorWidth
                  );
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingDoor-right`;
                const next = !openedSlidersRef.current[k];
                openedSlidersRef.current[k] = next;
                triggerSlider(
                  k,
                  next,
                  slidingDoorWidth / 2,
                  -1, // Di chuyển sang trái (về phía mảnh 1)
                  slidingDoorWidth
                );
              }}
            >
              {/* Right sliding door panel */}
              <mesh
                position={[0, 0, 0]}
                userData={{
                  type: "facade",
                  spacingId: firstSpacingId,
                  columnId: groupData.columnId,
                  sectionName: getSectionNameFromSpacingId(firstSpacingId),
                }}
                onPointerOver={() => handleFacadePointerOver(firstSpacingId)}
                onPointerOut={handleFacadePointerOut}
                onClick={() => handleFacadeClick(firstSpacingId)}
              >
                <boxGeometry
                  args={[slidingDoorWidth, facadeHeight + thickness, thickness]}
                />
                <meshStandardMaterial
                  map={getFacadeTexture(firstSpacingId)}
                  color="white"
                />
              </mesh>

              <FacadeHighlight
                overlaySize={[
                  slidingDoorWidth,
                  facadeHeight + thickness,
                  thickness,
                ]}
                overlayPosition={[0, 0, 0.01]}
                iconPosition={[0, 0, thickness / 2 + 0.02]}
                spacingId={firstSpacingId}
              />

              {/* Right door handle */}
              {renderHandle(handleType, [
                -slidingDoorWidth / 2 + 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>
          </group>
        );

      case "slidingMirrorDoor":
        // Porte Coulissante Miroir - sliding mirror door
        const slidingMirrorDoorWidth = facadeWidth / 2; // Mỗi cửa chiếm một nửa chiều rộng

        return (
          <group position={[groupData.x, groupData.centerY, facadeZ]}>
            {/* Left sliding mirror door */}
            <group
              ref={(ref) => {
                if (ref)
                  sliderGroupsRef.current[
                    `${groupData.groupId}-slidingMirrorDoor-left`
                  ] = ref;
              }}
              position={[-slidingMirrorDoorWidth / 2, 0, thickness]} // Lồi ra ngoài thêm thickness
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingMirrorDoor-left`;
                if (!openedSlidersRef.current[k])
                  triggerSlider(
                    k,
                    true,
                    -slidingMirrorDoorWidth / 2,
                    1, // Di chuyển sang phải (về phía mảnh 2)
                    slidingMirrorDoorWidth
                  );
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingMirrorDoor-left`;
                if (!openedSlidersRef.current[k])
                  triggerSlider(
                    k,
                    false,
                    -slidingMirrorDoorWidth / 2,
                    1, // Di chuyển sang phải (về phía mảnh 2)
                    slidingMirrorDoorWidth
                  );
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingMirrorDoor-left`;
                const next = !openedSlidersRef.current[k];
                openedSlidersRef.current[k] = next;
                triggerSlider(
                  k,
                  next,
                  -slidingMirrorDoorWidth / 2,
                  1, // Di chuyển sang phải (về phía mảnh 2)
                  slidingMirrorDoorWidth
                );
              }}
            >
              {/* Left sliding mirror door panel */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry
                  args={[
                    slidingMirrorDoorWidth,
                    facadeHeight + thickness,
                    thickness,
                  ]}
                />
                <meshStandardMaterial
                  key={`mirror-door-material-${groupData.groupId}-left`}
                  color="#C0C0C0"
                  metalness={0.9}
                  roughness={0.1}
                  envMapIntensity={1.0}
                />
              </mesh>
              {/* Left door handle */}
              {renderHandle(handleType, [
                slidingMirrorDoorWidth / 2 - 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>

            {/* Right sliding mirror door */}
            <group
              ref={(ref) => {
                if (ref)
                  sliderGroupsRef.current[
                    `${groupData.groupId}-slidingMirrorDoor-right`
                  ] = ref;
              }}
              position={[slidingMirrorDoorWidth / 2, 0, 0]}
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingMirrorDoor-right`;
                if (!openedSlidersRef.current[k])
                  triggerSlider(
                    k,
                    true,
                    slidingMirrorDoorWidth / 2,
                    -1, // Di chuyển sang trái (về phía mảnh 1)
                    slidingMirrorDoorWidth
                  );
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingMirrorDoor-right`;
                if (!openedSlidersRef.current[k])
                  triggerSlider(
                    k,
                    false,
                    slidingMirrorDoorWidth / 2,
                    -1, // Di chuyển sang trái (về phía mảnh 1)
                    slidingMirrorDoorWidth
                  );
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingMirrorDoor-right`;
                const next = !openedSlidersRef.current[k];
                openedSlidersRef.current[k] = next;
                triggerSlider(
                  k,
                  next,
                  slidingMirrorDoorWidth / 2,
                  -1, // Di chuyển sang trái (về phía mảnh 1)
                  slidingMirrorDoorWidth
                );
              }}
            >
              {/* Right sliding mirror door panel */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry
                  args={[
                    slidingMirrorDoorWidth,
                    facadeHeight + thickness,
                    thickness,
                  ]}
                />
                <meshStandardMaterial
                  key={`mirror-door-material-${groupData.groupId}-right`}
                  color="#C0C0C0"
                  metalness={0.9}
                  roughness={0.1}
                  envMapIntensity={1.0}
                />
              </mesh>
              {/* Right door handle */}
              {renderHandle(handleType, [
                -slidingMirrorDoorWidth / 2 + 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>
          </group>
        );

      case "slidingGlassDoor":
        // Porte Coulissante Verre - sliding glass door
        const slidingGlassDoorWidth = facadeWidth / 2; // Mỗi cửa chiếm một nửa chiều rộng

        return (
          <group position={[groupData.x, groupData.centerY, facadeZ]}>
            {/* Left sliding glass door */}
            <group
              ref={(ref) => {
                if (ref)
                  sliderGroupsRef.current[
                    `${groupData.groupId}-slidingGlassDoor-left`
                  ] = ref;
              }}
              position={[-slidingGlassDoorWidth / 2, 0, thickness]} // Lồi ra ngoài thêm thickness
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingGlassDoor-left`;
                if (!openedSlidersRef.current[k])
                  triggerSlider(
                    k,
                    true,
                    -slidingGlassDoorWidth / 2,
                    1, // Di chuyển sang phải (về phía mảnh 2)
                    slidingGlassDoorWidth
                  );
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingGlassDoor-left`;
                if (!openedSlidersRef.current[k])
                  triggerSlider(
                    k,
                    false,
                    -slidingGlassDoorWidth / 2,
                    1, // Di chuyển sang phải (về phía mảnh 2)
                    slidingGlassDoorWidth
                  );
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingGlassDoor-left`;
                const next = !openedSlidersRef.current[k];
                openedSlidersRef.current[k] = next;
                triggerSlider(
                  k,
                  next,
                  -slidingGlassDoorWidth / 2,
                  1, // Di chuyển sang phải (về phía mảnh 2)
                  slidingGlassDoorWidth
                );
              }}
            >
              {/* Left sliding glass door panel */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry
                  args={[
                    slidingGlassDoorWidth,
                    facadeHeight + thickness,
                    thickness,
                  ]}
                />
                <meshPhysicalMaterial
                  key={`glass-sliding-door-material-${groupData.groupId}-left`}
                  color="#000000"
                  transparent={true}
                  opacity={0.15}
                  metalness={0.1}
                  roughness={0.0}
                  transmission={0.85}
                  thickness={0.1}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Glass border for left door */}
              <mesh position={[0, 0, 0.001]}>
                <boxGeometry
                  args={[
                    slidingGlassDoorWidth + 0.01,
                    facadeHeight + thickness + 0.01,
                    0.002,
                  ]}
                />
                <meshStandardMaterial
                  key={`glass-sliding-door-border-material-${groupData.groupId}-left`}
                  color="#666"
                  transparent={true}
                  opacity={0.3}
                />
              </mesh>
              {/* Left door handle */}
              {renderHandle(handleType, [
                slidingGlassDoorWidth / 2 - 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>

            {/* Right sliding glass door */}
            <group
              ref={(ref) => {
                if (ref)
                  sliderGroupsRef.current[
                    `${groupData.groupId}-slidingGlassDoor-right`
                  ] = ref;
              }}
              position={[slidingGlassDoorWidth / 2, 0, 0]}
              onPointerOver={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingGlassDoor-right`;
                if (!openedSlidersRef.current[k])
                  triggerSlider(
                    k,
                    true,
                    slidingGlassDoorWidth / 2,
                    -1, // Di chuyển sang trái (về phía mảnh 1)
                    slidingGlassDoorWidth
                  );
              }}
              onPointerOut={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingGlassDoor-right`;
                if (!openedSlidersRef.current[k])
                  triggerSlider(
                    k,
                    false,
                    slidingGlassDoorWidth / 2,
                    -1, // Di chuyển sang trái (về phía mảnh 1)
                    slidingGlassDoorWidth
                  );
              }}
              onClick={(e) => {
                if (shouldDisableInteractions()) return;
                e.stopPropagation();
                const k = `${groupData.groupId}-slidingGlassDoor-right`;
                const next = !openedSlidersRef.current[k];
                openedSlidersRef.current[k] = next;
                triggerSlider(
                  k,
                  next,
                  slidingGlassDoorWidth / 2,
                  -1, // Di chuyển sang trái (về phía mảnh 1)
                  slidingGlassDoorWidth
                );
              }}
            >
              {/* Right sliding glass door panel */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry
                  args={[
                    slidingGlassDoorWidth,
                    facadeHeight + thickness,
                    thickness,
                  ]}
                />
                <meshPhysicalMaterial
                  key={`glass-sliding-door-material-${groupData.groupId}-right`}
                  color="#000000"
                  transparent={true}
                  opacity={0.15}
                  metalness={0.1}
                  roughness={0.0}
                  transmission={0.85}
                  thickness={0.1}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Glass border for right door */}
              <mesh position={[0, 0, 0.001]}>
                <boxGeometry
                  args={[
                    slidingGlassDoorWidth + 0.01,
                    facadeHeight + thickness + 0.01,
                    0.002,
                  ]}
                />
                <meshStandardMaterial
                  key={`glass-sliding-door-border-material-${groupData.groupId}-right`}
                  color="#666"
                  transparent={true}
                  opacity={0.3}
                />
              </mesh>
              {/* Right door handle */}
              {renderHandle(handleType, [
                -slidingGlassDoorWidth / 2 + 0.05,
                0,
                thickness / 2 + 0.01,
              ])}
            </group>
          </group>
        );

      default:
        return null;
    }
  };

  // Get grouped spacings
  const groupedSelectedSpacings = getGroupedSelectedSpacings();
  const groupedConfiguredSpacings = getGroupedConfiguredSpacings();

  // Helper function to render sliding doors for entire section
  const renderSlidingDoorsForSection = () => {
    const slidingDoorTypes = [
      "slidingDoor",
      "slidingMirrorDoor",
      "slidingGlassDoor",
    ];

    // Helper function to check if column should be suppressed for sliding doors
    const shouldSuppressColumnForSliding = (
      section: string,
      columnIndex: number,
      totalColumns: number
    ): boolean => {
      const typeId = config.wardrobeType.id;
      if (typeId === "Angle") {
        // Angle: ẩn A cột cuối và B cột 1 (index 0)
        if (section === "sectionA" && columnIndex === totalColumns - 1)
          return true;
        if (section === "sectionB" && columnIndex === 0) return true;
        return false;
      }
      if (typeId === "Forme U") {
        // Forme U: ẩn B cột cuối, A cột 1 và cột cuối, C cột 1
        if (section === "sectionA") {
          if (columnIndex === 0 || columnIndex === totalColumns - 1)
            return true;
        } else if (section === "sectionB") {
          if (columnIndex === totalColumns - 1) return true;
        } else if (section === "sectionC") {
          if (columnIndex === 0) return true;
        }
        return false;
      }
      return false;
    };

    // Check if any spacing in this section has sliding door config
    const sectionSpacingsWithSlidingDoor = spacingPositions.filter((pos) => {
      const doorType = config.doorsDrawersConfig[pos.spacingId];
      return slidingDoorTypes.includes(doorType);
    });

    if (sectionSpacingsWithSlidingDoor.length === 0) {
      return null;
    }

    // Get the sliding door type from the first spacing that has it
    const firstSlidingSpacing = sectionSpacingsWithSlidingDoor[0];
    const slidingDoorType =
      config.doorsDrawersConfig[firstSlidingSpacing.spacingId];

    // Get section name
    const sectionName = getSectionNameFromSpacingId(
      firstSlidingSpacing.spacingId
    );

    // Filter out spacings from suppressed columns
    const validSpacingPositions = spacingPositions.filter((pos) => {
      const parts = pos.spacingId.split("-");
      if (parts.length < 4) return false;

      let columnId: string;
      let columnIndex: number;

      if (parts.length === 5 && parts[1] === "col" && parts[3] === "spacing") {
        columnId = `${parts[0]}-${parts[1]}-${parts[2]}`;
        columnIndex = parseInt(parts[2]); // parts[2] là số thứ tự column (1, 2, 3...)
      } else {
        columnId = parts[0];
        columnIndex = parseInt(parts[1]);
      }

      // Find the column in sectionData to get total columns
      const column = sectionData.columns.find((col) => col.id === columnId);
      if (!column) return false;

      const totalColumns = sectionData.columns.length;

      // Convert columnIndex to 0-based index for comparison
      const columnIndexZeroBased = columnIndex - 1; // Convert from 1-based to 0-based

      return !shouldSuppressColumnForSliding(
        sectionName,
        columnIndexZeroBased, // Use 0-based index
        totalColumns
      );
    });

    if (validSpacingPositions.length === 0) {
      return null; // No valid spacings for sliding door
    }

    // Get unique columns from valid spacings
    const uniqueColumns = new Set<string>();
    validSpacingPositions.forEach((pos) => {
      const parts = pos.spacingId.split("-");
      let columnId: string;
      if (parts.length === 5 && parts[1] === "col" && parts[3] === "spacing") {
        columnId = `${parts[0]}-${parts[1]}-${parts[2]}`;
      } else {
        columnId = parts[0];
      }
      uniqueColumns.add(columnId);
    });

    // Calculate section width based on actual columns
    const sectionWidth = Array.from(uniqueColumns).reduce(
      (total, columnId, index) => {
        const column = sectionData.columns.find((col) => col.id === columnId);
        if (!column) return total;

        if (index === 0) {
          return column.width;
        } else {
          return total + thickness + column.width;
        }
      },
      0
    );

    // Calculate section height: height of the column (not sum of spacings)
    const sectionHeight = height - baseBarHeight - 2 * thickness;

    // Calculate section center position from valid spacings only
    const sectionCenterX =
      validSpacingPositions.reduce((sum, pos) => sum + pos.x, 0) /
      validSpacingPositions.length;
    const sectionCenterY =
      validSpacingPositions.reduce((sum, pos) => sum + pos.y, 0) /
      validSpacingPositions.length;

    // Create group data for the entire section
    const sectionGroupData = {
      groupId: `section-${sectionName}-sliding`,
      spacingIds: validSpacingPositions.map((pos) => pos.spacingId),
      x: sectionCenterX,
      centerY: sectionCenterY,
      width: sectionWidth,
      totalHeight: sectionHeight,
    };

    return renderGroupedFacade(
      slidingDoorType,
      sectionGroupData,
      sectionWidth,
      sectionHeight
    );
  };

  // Helper function to get facade texture
  const getFacadeTexture = (spacingId: string): THREE.Texture => {
    // Kiểm tra xem facade có texture riêng không
    const customTexture = config.facadeTextureConfig[spacingId];
    if (customTexture) {
      // Load custom texture
      const textureLoader = new THREE.TextureLoader();
      return textureLoader.load(customTexture.src);
    }
    // Sử dụng texture mặc định
    return texture;
  };

  return (
    <group position={position}>
      {/* Render sliding doors for entire section */}
      {renderSlidingDoorsForSection()}

      {/* Render grouped facades for selected spacings */}
      {groupedSelectedSpacings.map((groupData) => {
        if (!groupData) return null;

        // Get the door/drawer type from the first spacing in the group
        const firstSpacingId = groupData.spacingIds[0];
        const doorDrawerType = config.doorsDrawersConfig[firstSpacingId];

        if (!doorDrawerType) {
          return null; // No facade for this group
        }

        // Skip if this is a sliding door (already rendered above)
        const slidingDoorTypes = [
          "slidingDoor",
          "slidingMirrorDoor",
          "slidingGlassDoor",
        ];
        if (slidingDoorTypes.includes(doorDrawerType)) {
          return null;
        }

        return (
          <React.Fragment key={`grouped-selected-facade-${groupData.groupId}`}>
            {renderGroupedFacade(
              doorDrawerType,
              groupData,
              groupData.width,
              groupData.totalHeight
            )}
          </React.Fragment>
        );
      })}

      {/* Render grouped facades for configured spacings (not selected) */}
      {groupedConfiguredSpacings.map((groupData) => {
        if (!groupData) return null;

        // Check if any spacing in this group is already rendered as selected
        const isAlreadyRendered = groupedSelectedSpacings.some(
          (selectedGroup) =>
            selectedGroup &&
            selectedGroup.spacingIds.some((id) =>
              groupData.spacingIds.includes(id)
            )
        );

        if (isAlreadyRendered) {
          return null; // Skip if already rendered as selected group
        }

        // Get the door/drawer type from the first spacing in the group
        const firstSpacingId = groupData.spacingIds[0];
        const doorDrawerType = config.doorsDrawersConfig[firstSpacingId];

        if (!doorDrawerType) {
          return null; // No facade for this group
        }

        // Skip if this is a sliding door (already rendered above)
        const slidingDoorTypes = [
          "slidingDoor",
          "slidingMirrorDoor",
          "slidingGlassDoor",
        ];
        if (slidingDoorTypes.includes(doorDrawerType)) {
          return null;
        }

        return (
          <React.Fragment
            key={`grouped-configured-facade-${groupData.groupId}`}
          >
            {renderGroupedFacade(
              doorDrawerType,
              groupData,
              groupData.width,
              groupData.totalHeight
            )}
          </React.Fragment>
        );
      })}

      {/* Render individual facades for spacings that have config but are not in any group */}
      {spacingPositions.map((pos) => {
        const doorDrawerType = config.doorsDrawersConfig[pos.spacingId];

        if (!doorDrawerType) {
          return null; // No config
        }

        // Skip if this is a sliding door (already rendered above)
        const slidingDoorTypes = [
          "slidingDoor",
          "slidingMirrorDoor",
          "slidingGlassDoor",
        ];
        if (slidingDoorTypes.includes(doorDrawerType)) {
          return null;
        }

        // Check if this spacing is already rendered in any group
        const isInSelectedGroup = groupedSelectedSpacings.some(
          (groupData) =>
            groupData && groupData.spacingIds.includes(pos.spacingId)
        );
        const isInConfiguredGroup = groupedConfiguredSpacings.some(
          (groupData) =>
            groupData && groupData.spacingIds.includes(pos.spacingId)
        );

        if (isInSelectedGroup || isInConfiguredGroup) {
          return null; // Already rendered in a group
        }

        return (
          <React.Fragment key={`individual-facade-${pos.spacingId}`}>
            {/* Render facade for individual spacing with config */}
            {renderGroupedFacade(
              doorDrawerType,
              {
                groupId: pos.spacingId,
                spacingIds: [pos.spacingId],
                x: pos.x,
                centerY: pos.y,
                width: pos.width,
                totalHeight: pos.height,
              },
              pos.width,
              pos.height
            )}
          </React.Fragment>
        );
      })}
    </group>
  );
};

export default DoorsDrawersRenderer;
