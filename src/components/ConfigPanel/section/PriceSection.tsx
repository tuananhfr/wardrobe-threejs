import { usePrice } from "@/hooks/usePrice";
import React from "react";

const PriceSection: React.FC = () => {
  const { price, originalPrice } = usePrice();

  return (
    <div className="d-flex align-items-center w-100">
      <div className="d-flex flex-row w-100">
        {/* Cột giá */}
        <div
          className="d-flex flex-column align-items-start me-3"
          style={{ minWidth: 70 }}
        >
          <div className="text-muted text-decoration-line-through">
            <span className="d-lg-none fs-6">
              {originalPrice?.toFixed(2)} €
            </span>
            <span className="d-none d-lg-inline fs-5">
              {originalPrice?.toFixed(2)} €
            </span>
          </div>
          <div className="fs-4 fw-bold text-dark">
            <span className="d-lg-none fs-6">{price?.toFixed(2)} €</span>
            <span className="d-none d-lg-inline fs-4">
              {price?.toFixed(2)} €
            </span>
          </div>
        </div>

        {/* Cột thông tin */}
        <div className="d-flex flex-column justify-content-center">
          <div className="text-secondary small">
            <span className="d-none d-lg-inline">
              incl. 20% TVA hors frais de livraison
            </span>
          </div>
          <div className="text-secondary">
            <span className="d-none d-lg-inline">
              Livraison sous <span className="fw-bold">5-6 semaines</span>
            </span>
          </div>
          <div className="text-secondary small">
            <span className="d-none d-lg-inline">
              Le prix le plus bas en 30 jours:{" "}
              <span className="text-muted">
                {((price || 0) * 0.9)?.toFixed(0)} €
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceSection;
