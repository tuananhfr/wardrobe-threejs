import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

import { useState, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "three-stdlib";
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import React from "react";
import CameraController from "./CameraController";
import CanvasControls from "./CanvasControls";
import WardrobeModel from "./Wardrobe/WardrobeModel";
import { useConfig } from "@/context/WardrobeContext";
// Custom OrbitControls component
interface CustomOrbitControlsProps {
  enablePan?: boolean;
  enableZoom?: boolean;
  enableRotate?: boolean;
}

const CustomOrbitControls: React.FC<CustomOrbitControlsProps> = ({
  enablePan = true,
  enableZoom = false,
  enableRotate = true,
}) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controlsRef.current = controls;

    // Set properties
    controls.enablePan = enablePan;
    controls.enableZoom = enableZoom;
    controls.enableRotate = enableRotate;

    // Expose controls to window
    (window as Window).__THREE_CONTROLS__ = controls;

    return () => {
      controls.dispose();
      (window as Window).__THREE_CONTROLS__ = null;
    };
  }, [camera, gl, enablePan, enableZoom, enableRotate]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return null;
};

// Component để expose scene và camera ra ngoài
const SceneExposer: React.FC = () => {
  const { scene, camera } = useThree();

  React.useEffect(() => {
    // Set scene và camera lên window object
    (window as Window).__THREE_SCENE__ = scene;
    (window as Window).__THREE_CAMERA__ = camera;

    return () => {
      // Cleanup khi component unmount
      (window as Window).__THREE_SCENE__ = null;
      (window as Window).__THREE_CAMERA__ = null;
    };
  }, [scene, camera]);

  return null;
};

const ThreeDPreview: React.FC = () => {
  const { config, updateConfig } = useConfig();
  const [zoomInTriggered, setZoomInTriggered] = useState(false);
  const [zoomOutTriggered, setZoomOutTriggered] = useState(false);

  const [canZoomIn, setCanZoomIn] = useState(true);
  const [canZoomOut, setCanZoomOut] = useState(true);

  const handleRulerClick = () => {
    updateConfig("showMeasurements", !config.showMeasurements);
  };

  const handleZoomInClick = () => {
    setZoomInTriggered(true);
  };

  const handleZoomOutClick = () => {
    setZoomOutTriggered(true);
  };

  const resetZoomTriggers = useCallback(() => {
    setZoomInTriggered(false);
    setZoomOutTriggered(false);
  }, []);

  // Callback để update zoom state từ CameraController
  const updateZoomLimits = useCallback((canIn: boolean, canOut: boolean) => {
    setCanZoomIn(canIn);
    setCanZoomOut(canOut);
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [-1.5, 0, 4.5], fov: 50 }}
      >
        <color attach="background" args={["#e5e6e8"]} />

        <ambientLight intensity={0.5} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          castShadow
        />
        <pointLight position={[-10, -10, -10]} />

        <WardrobeModel showMeasurements={config.showMeasurements} />

        <CameraController
          zoomInTriggered={zoomInTriggered}
          zoomOutTriggered={zoomOutTriggered}
          resetZoomTriggers={resetZoomTriggers}
          updateZoomLimits={updateZoomLimits}
        />

        {/* Sử dụng custom OrbitControls thay vì từ drei */}
        <CustomOrbitControls
          enablePan={true}
          enableZoom={false}
          enableRotate={true}
        />

        <Environment preset="apartment" />

        {/* Component để expose scene và camera */}
        <SceneExposer />
      </Canvas>

      <CanvasControls
        onRulerClick={handleRulerClick}
        onZoomInClick={handleZoomInClick}
        onZoomOutClick={handleZoomOutClick}
        isRulerActive={config.showMeasurements}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
      />
    </div>
  );
};

export default ThreeDPreview;
