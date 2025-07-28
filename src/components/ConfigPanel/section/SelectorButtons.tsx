interface SelectorButtonsProps {
  options: string[];
  activeOption: string;
  onChange: (option: string) => void;
}
const SelectorButtons: React.FC<SelectorButtonsProps> = ({
  options,
  activeOption,
  onChange,
}) => {
  return (
    <div className="d-flex flex-wrap mb-3 mt-3 pb-3 border-bottom">
      {options.map((option) => (
        <button
          key={option}
          className={`btn ${
            activeOption === option ? "btn-secondary" : "btn-outline-secondary"
          } rounded-pill me-2 mb-2`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default SelectorButtons;
