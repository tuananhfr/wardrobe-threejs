import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

const CameraController: React.FC<CameraControllerProps> = ({
  zoomInTriggered,
  zoomOutTriggered,
  resetZoomTriggers,
}) => {
  const { camera } = useThree();

  useEffect(() => {
    if (zoomInTriggered) {
      // Zoom in logic
      camera.position.z = Math.max(1.2, camera.position.z - 0.3);
      resetZoomTriggers();
    }
  }, [zoomInTriggered, camera, resetZoomTriggers]);

  useEffect(() => {
    if (zoomOutTriggered) {
      // Zoom out logic
      camera.position.z = Math.min(5, camera.position.z + 0.3);
      resetZoomTriggers();
    }
  }, [zoomOutTriggered, camera, resetZoomTriggers]);

  return null;
};

export default CameraController;
