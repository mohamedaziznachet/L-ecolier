import { ChevronRight, Clock } from "lucide-react";
import { ResponsiveImage } from "./utils/ResponsiveImage";

const promos = [
  { id: 1, label: "Fournitures scolaires", discount: "-20%", desc: "Sur tous les cahiers et classeurs", color: "#1a4299", img: "https://images.unsplash.com/photo-1779684998897-ce5de594a5ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxzY2hvb2wlMjBub3RlYm9va3MlMjBwZW5jaWxzJTIwZGVza3xlbnwxfHx8fDE3ODIyMTM5NTR8MA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 2, label: "Sacs à dos",            discount: "-15%", desc: "Collection rentrée 2026",           color: "#e53935", img: "https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxzY2hvb2wlMjBzdXBwbGllcyUyMGJhY2twYWNrJTIwc3RhdGlvbmVyeXxlbnwxfHx8fDE3ODIyMTM5NTR8MA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 3, label: "BIC",                   discount: "-10%", desc: "Stylos et marqueurs BIC",          color: "#0d2b6b", img: "https://images.unsplash.com/photo-1568205612837-017257d2310a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2hvb2wlMjBub3RlYm9va3MlMjBwZW5jaWxzJTIwZGVza3xlbnwxfHx8fDE3ODIyMTM5NTR8MA&ixlib=rb-4.1.0&q=80&w=400" },
];

export function Promotions() {
  return (
    <section className="section-bg">
      <div className="page-section" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">Promotions</h2>
            <div className="section-underline" />
          </div>
          <a href="#" className="section-link">
            Voir toutes les promotions <ChevronRight size={14} />
          </a>
        </div>

        <div className="promotions-grid">
          {promos.map((promo) => (
            <a key={promo.id} href="#" className="promo-card">
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
