import React from "react";
import { useUndoRedo } from "../context/WardrobeContext";

interface CanvasControlsProps {
  onRulerClick: () => void;
  onZoomInClick: () => void;
  onZoomOutClick: () => void;
  isRulerActive?: boolean;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
}

const CanvasControls: React.FC<CanvasControlsProps> = ({
  onRulerClick,
  onZoomInClick,
  onZoomOutClick,
  isRulerActive = false,
  canZoomIn = true,
  canZoomOut = true,
}) => {
  const { undo, undoCount, canUndo } = useUndoRedo();

  const buttonBaseClass =
    "btn d-flex align-items-center justify-content-center rounded-circle shadow-sm";
  const buttonStyle = { width: "40px", height: "40px", fontSize: "18px" };

  return (
    <>
      {/* CSS cho hover effect */}
      <style>
        {`
          .undo-hover-wrapper:hover .undo-icon {
            color: #007bff !important;
          }
          .undo-hover-wrapper:hover .undo-text {
            color: #007bff !important;
          }
          .undo-hover-wrapper.disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }
          .undo-hover-wrapper.disabled:hover .undo-icon,
          .undo-hover-wrapper.disabled:hover .undo-text {
            color: inherit !important;
          }
        `}
      </style>

      {/* Undo Control - Bên trái (chỉ hiển thị khi có undo) */}
      {undoCount > 0 && (
        <div
          className="position-absolute d-flex flex-row align-items-center"
          style={{ top: "20px", left: "20px", gap: "8px", zIndex: 100 }}
        >
          {/* Wrapper cho button và text với hover effect */}
          <div
            className={`d-flex flex-row align-items-center undo-hover-wrapper ${
              !canUndo ? "disabled" : ""
            }`}
            onClick={canUndo ? undo : undefined}
            style={{ cursor: canUndo ? "pointer" : "not-allowed" }}
          >
            {/* Annuler (Undo) Button */}
            <button
              className={`${buttonBaseClass} btn-light`}
              style={buttonStyle}
              disabled={!canUndo}
            >
              <i className="bi bi-arrow-counterclockwise undo-icon"></i>
            </button>

            {/* Text bên cạnh nút - hiển thị số lượng actions có thể undo */}
            <span
              className="text-dark fw-medium ms-2 undo-text"
              style={{ fontSize: "14px" }}
            >
              Annuler ({undoCount})
            </span>
          </div>
        </div>
      )}

      {/* Zoom Controls - Bên phải */}
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
          disabled={!canZoomIn}
        >
          <i className="bi bi-zoom-in"></i>
        </button>

        <button
          className={`${buttonBaseClass} ${
            canZoomOut ? "btn-light" : "btn-secondary"
          }`}
          onClick={onZoomOutClick}
          style={buttonStyle}
          disabled={!canZoomOut}
        >
          <i className="bi bi-zoom-out"></i>
        </button>
      </div>
    </>
  );
};

export default CanvasControls;
