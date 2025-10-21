import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

interface CameraControllerProps {
  zoomInTriggered: boolean;
  zoomOutTriggered: boolean;
  resetZoomTriggers: () => void;
  updateZoomLimits: (canIn: boolean, canOut: boolean) => void;
}

const CameraController: React.FC<CameraControllerProps> = ({
  zoomInTriggered,
  zoomOutTriggered,
  resetZoomTriggers,
  updateZoomLimits, // Thêm vào destructuring
}) => {
  const { camera } = useThree();

  // Define zoom limits
  const MIN_ZOOM = 1.2;
  const MAX_ZOOM = 5;

  // Function để check và update zoom limits
  const checkZoomLimits = () => {
    const currentZ = camera.position.z;
    updateZoomLimits(
      currentZ > MIN_ZOOM, // canZoomIn
      currentZ < MAX_ZOOM // canZoomOut
    );
  };

  useEffect(() => {
    if (zoomInTriggered) {
      // Zoom in logic
      camera.position.z = Math.max(MIN_ZOOM, camera.position.z - 0.3);
      checkZoomLimits(); // Check limits sau khi zoom
      resetZoomTriggers();
    }
  }, [zoomInTriggered, camera, resetZoomTriggers]);

  useEffect(() => {
    if (zoomOutTriggered) {
      // Zoom out logic
      camera.position.z = Math.min(MAX_ZOOM, camera.position.z + 0.3);
      checkZoomLimits(); // Check limits sau khi zoom
      resetZoomTriggers();
    }
  }, [zoomOutTriggered, camera, resetZoomTriggers]);

  // Initial check khi component mount
  useEffect(() => {
    checkZoomLimits();
  }, [camera]);

  return null;
};

export default CameraController;
