import React from "react";

interface CanvasControlsProps {
  onRulerClick: () => void;
  onZoomInClick: () => void;
  onZoomOutClick: () => void;
  isRulerActive?: boolean;
}

const CanvasControls: React.FC<CanvasControlsProps> = ({
  onRulerClick,
  onZoomInClick,
  onZoomOutClick,
  isRulerActive = false,
}) => {
  const buttonBaseClass =
    "btn d-flex align-items-center justify-content-center rounded-circle shadow-sm";
  const buttonStyle = { width: "40px", height: "40px", fontSize: "18px" };

  return (
    <div
      className="position-absolute d-flex flex-column"
      style={{ top: "20px", right: "20px", gap: "10px", zIndex: 100 }}
    >
      <button
        className={`${buttonBaseClass} ${
          isRulerActive ? "btn-primary" : "btn-light"
        }`}
        onClick={onRulerClick}
        style={{ ...buttonStyle, fontSize: "14px" }}
      >
        <i className="bi bi-rulers"></i>
      </button>
      <button
        className={`${buttonBaseClass} btn-light`}
        onClick={onZoomInClick}
        style={buttonStyle}
      >
        <i className="bi bi-zoom-in"></i>
      </button>
      <button
        className={`${buttonBaseClass} btn-light`}
        onClick={onZoomOutClick}
        style={buttonStyle}
      >
        <i className="bi bi-zoom-out"></i>
      </button>
    </div>
  );
};

export default CanvasControls;
