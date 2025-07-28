// src/pages/WardrobePage.tsx
import ConfigPanel from "@/components/ConfigPanel/ConfigPanel";
import PreviewPanel from "@/components/PreviewPanel/PreviewPanel";

function App() {
  return (
    <div className="container-fluid d-flex flex-column vh-100">
      {/* Main content area */}
      <div className="row flex-grow-1 overflow-hidden">
        {/* Desktop Layout */}
        <div className="col-lg-3 order-lg-1 d-none d-lg-block h-100">
          <div className="h-100 d-flex flex-column">
            <h4 className="pb-3 border-bottom sticky-top bg-white">
              Système de dressing
            </h4>
            <div className="flex-grow-1 overflow-auto">
              <ConfigPanel />
            </div>
          </div>
        </div>

        <div className="col-lg-9 order-lg-2 d-flex flex-column h-100 d-none d-lg-block h-100">
          <div className="h-100">
            <PreviewPanel />
          </div>
        </div>

        {/* Mobile Layout - Using Bootstrap Flex Utilities */}
        <div className="col-12 d-lg-none h-100 d-flex flex-column">
          {/* Preview Panel - Top Half */}
          <div
            className="flex-fill border-bottom bg-light d-flex align-items-stretch"
            style={{ maxHeight: "50%" }}
          >
            <div className="w-100">
              <PreviewPanel />
            </div>
          </div>

          {/* Config Panel - Bottom Half */}
          <div
            className="flex-fill d-flex flex-column bg-white"
            style={{ maxHeight: "50%" }}
          >
            {/* Config Header */}
            <div className="border-bottom bg-light px-3 py-2 flex-shrink-0">
              <h6 className="mb-0 text-secondary fw-semibold">
                Système de dressings
              </h6>
            </div>

            {/* Config Content */}
            <div className="flex-grow-1 overflow-auto p-3">
              <ConfigPanel />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar - Responsive  */}
      <div
        className="border-top bg-light flex-shrink-0 d-flex align-items-center justify-content-between px-3 py-2"
        style={{ minHeight: "70px" }}
      >
        {/* PriceSection à gauche */}
        <div className="flex-grow-1 me-3">{/* <PriceSection /> */}</div>

        {/* ActionButtons à droite */}
        <div className="flex-shrink-0">{/* <ActionButtons /> */}</div>
      </div>
    </div>
  );
}

export default App;
