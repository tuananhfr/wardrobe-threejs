interface DimensionControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}
const DimensionControl: React.FC<DimensionControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}) => {
  return (
    <div className="mb-4">
      <div className="d-flex align-items-center gap-3">
        {/* Label bên trái */}
        <label className="form-label mb-0" style={{ minWidth: "80px" }}>
          {label}
        </label>

        {/* Nút trừ */}
        <button
          className="btn btn-outline-secondary btn-sm"
          style={{ width: "32px", height: "32px" }}
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
        >
          −
        </button>

        {/* Container cho slider với custom thumb */}
        <div className="flex-grow-1 position-relative">
          <input
            type="range"
            className="form-range custom-range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            style={{
              height: "6px",
            }}
          />

          {/* Value overlay - không chặn tương tác */}
          <div
            className="position-absolute bg-primary text-white rounded px-2 py-1 small"
            style={{
              top: "-25px",
              left: `${((value - min) / (max - min)) * 100}%`,
              transform: "translateX(-50%)",
              minWidth: "60px",
              textAlign: "center",
              fontSize: "12px",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            {value} cm
          </div>
        </div>

        {/* Nút cộng */}
        <button
          className="btn btn-outline-secondary btn-sm"
          style={{ width: "32px", height: "32px" }}
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
};
export default DimensionControl;
