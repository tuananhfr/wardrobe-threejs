// src/components/Wardrobe/WardrobeInteractions.tsx
// import React, { useCallback, useRef } from "react";
// import { useThree } from "@react-three/fiber";
// import * as THREE from "three";

const WardrobeInteractions: React.FC = () => {
  // const { scene, camera, raycaster, pointer } = useThree();
  // const doorRefs = useRef<{ [key: string]: THREE.Group }>({});
  // const drawerRef = useRef<THREE.Group | null>(null);

  // Animation functions
  // const animateDoor = useCallback((doorId: string, opening: boolean) => {
  //   const door = doorRefs.current[doorId];
  //   if (!door) return;

  //   const targetRotation = opening ? Math.PI / 3 : 0;

  //   if (door.userData.animationId) {
  //     cancelAnimationFrame(door.userData.animationId);
  //   }

  //   const animate = () => {
  //     const speed = 0.05;
  //     const diff = targetRotation - door.rotation.y;

  //     if (Math.abs(diff) < 0.01) {
  //       door.rotation.y = targetRotation;
  //       door.userData.animationId = null;
  //       return;
  //     }

  //     door.rotation.y += diff * speed;
  //     door.userData.animationId = requestAnimationFrame(animate);
  //   };

  //   animate();
  // }, []);

  // const animateDrawer = useCallback((opening: boolean) => {
  //   if (!drawerRef.current) return;

  //   const targetPosition = opening ? 0.3 : 0;
  //   const animationRef = drawerRef.current.userData.animationRef;

  //   if (animationRef) {
  //     cancelAnimationFrame(animationRef);
  //   }

  //   const animate = () => {
  //     const speed = 0.05;
  //     const diff = targetPosition - drawerRef.current!.position.z;

  //     if (Math.abs(diff) < 0.01) {
  //       drawerRef.current!.position.z = targetPosition;
  //       drawerRef.current!.userData.animationRef = null;
  //       return;
  //     }

  //     drawerRef.current!.position.z += diff * speed;
  //     drawerRef.current!.userData.animationRef = requestAnimationFrame(animate);
  //   };

  //   animate();
  // }, []);

  // const handlePointerMove = useCallback(
  //   (event: any) => {
  //     // Update raycaster
  //     raycaster.setFromCamera(pointer, camera);

  //     // Get all interactive objects
  //     const interactiveObjects: THREE.Object3D[] = [];

  //     // Find all doors and drawer in scene
  //     scene.traverse((child) => {
  //       if (child instanceof THREE.Mesh && child.userData.type) {
  //         interactiveObjects.push(child);
  //       }
  //     });

  //     const intersects = raycaster.intersectObjects(interactiveObjects);

  //     if (intersects.length > 0) {
  //       const intersected = intersects[0].object;
  //       const userData = intersected.userData;

  //       if (userData.type === "door") {
  //         // Close all doors first
  //         Object.keys(doorRefs.current).forEach((doorId) => {
  //           if (doorId !== userData.id) {
  //             animateDoor(doorId, false);
  //           }
  //         });
  //         // Close drawer
  //         if (drawerRef.current) {
  //           animateDrawer(false);
  //         }
  //         // Open hovered door
  //         animateDoor(userData.id, true);
  //       } else if (userData.type === "drawer") {
  //         // Close all doors
  //         Object.keys(doorRefs.current).forEach((doorId) => {
  //           animateDoor(doorId, false);
  //         });
  //         // Open drawer
  //         animateDrawer(true);
  //       }
  //     } else {
  //       // Close everything when not hovering
  //       Object.keys(doorRefs.current).forEach((doorId) => {
  //         animateDoor(doorId, false);
  //       });
  //       if (drawerRef.current) {
  //         animateDrawer(false);
  //       }
  //     }
  //   },
  //   [animateDoor, animateDrawer, raycaster, pointer, camera, scene]
  // );

  // Note: Event listeners and ref management would need to be handled
  // in the parent component or through a different mechanism

  return null; // This component doesn't render anything visible
};

export default WardrobeInteractions;
