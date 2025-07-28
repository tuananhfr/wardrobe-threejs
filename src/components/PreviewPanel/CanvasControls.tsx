interface CanvasControlsProps {
  onRulerClick: () => void;
  onZoomInClick: () => void;
  onZoomOutClick: () => void;
  isRulerActive?: boolean;
  canZoomIn?: boolean; // <-- Thêm props này
  canZoomOut?: boolean; // <-- Thêm props này
}

const CanvasControls: React.FC<CanvasControlsProps> = ({
  onRulerClick,
  onZoomInClick,
  onZoomOutClick,
  isRulerActive = false,
  canZoomIn = true, // <-- Default true
  canZoomOut = true, // <-- Default true
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
        className={`${buttonBaseClass} ${
          canZoomIn ? "btn-light" : "btn-secondary"
        }`}
        onClick={onZoomInClick}
        style={buttonStyle}
        disabled={!canZoomIn} // <-- Disable khi không thể zoom in
      >
        <i className="bi bi-zoom-in"></i>
      </button>

      <button
        className={`${buttonBaseClass} ${
          canZoomOut ? "btn-light" : "btn-secondary"
        }`}
        onClick={onZoomOutClick}
        style={buttonStyle}
        disabled={!canZoomOut} // <-- Disable khi không thể zoom out
      >
        <i className="bi bi-zoom-out"></i>
      </button>
    </div>
  );
};
export default CanvasControls;
