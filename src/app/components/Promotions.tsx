import { ChevronRight, Clock } from "lucide-react";
import { ResponsiveImage } from "./utils/ResponsiveImage";

const promos = [
];

import { useNavigation } from "../context/AppContext";

export function Promotions() {
  const { navigateTo } = useNavigation();

  return (
    <section className="section-bg">
      <div className="page-section" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">Promotions</h2>
            <div className="section-underline" />
          </div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("category", "Sacs à dos");
            }}
            className="section-link"
          >
            Voir toutes les promotions <ChevronRight size={14} />
          </a>
        </div>

        <div className="promotions-grid">
          {promos.map((promo) => (
            <a
              key={promo.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigateTo("category", promo.label);
              }}
              className="promo-card"
            >
              <ResponsiveImage src={promo.img} alt={promo.label} className="promo-img" />
              <div
                className="promo-color-overlay"
                style={{ background: `linear-gradient(to right, ${promo.color}dd, ${promo.color}88)` }}
              />
              <div className="promo-content">
                <div className="promo-text">
                  <span className="promo-label">{promo.label}</span>
                  <div className="promo-discount">{promo.discount}</div>
                  <p className="promo-desc">{promo.desc}</p>
                </div>
                <div className="promo-badge">
                  <Clock size={16} className="promo-badge-icon" />
                  <span>Offre<br />limitée</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
