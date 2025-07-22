import ThreeDPreview from "./ThreeDPreview";

const PreviewPanel: React.FC = () => {
  return (
    <div className="text-center w-100 h-100 d-flex flex-column">
      <div className="w-100 h-100 flex-fill d-flex flex-column">
        <ThreeDPreview />
      </div>
    </div>
  );
};

export default PreviewPanel;
