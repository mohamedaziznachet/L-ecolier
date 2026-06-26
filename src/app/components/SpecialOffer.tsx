import { ChevronRight } from "lucide-react";
import { ResponsiveImage } from "./utils/ResponsiveImage";
import { useNavigation } from "../context/AppContext";

export function SpecialOffer() {
  const { navigateTo } = useNavigation();

  return (
    <section className="special-offer-section">
      <div className="special-offer-card">
        {/* Decorations */}
        <div className="special-offer-deco-1" />
        <div className="special-offer-deco-2" />

        <div className="special-offer-inner">
          {/* Text content */}
          <div className="special-offer-content">
            <div className="offer-badge">
              <span>Offre spéciale rentrée</span>
            </div>
            <h2 className="offer-title">
              Offres spéciales<br />de la rentrée !
            </h2>
            <p className="offer-desc">
              Profitez de nos meilleures offres sur une sélection<br />
              de produits pour la rentrée scolaire 2026.
            </p>
            <div className="offer-actions">
              <button
                className="btn-offer"
                onClick={() => navigateTo("category", "Sacs à dos")}
              >
                Voir les offres <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Badge + image */}
          <div className="special-offer-right">
            <div className="discount-circle">
              <span className="discount-value">-20%</span>
              <span className="discount-label">sur tout</span>
            </div>
            <ResponsiveImage
              src="https://images.unsplash.com/photo-1726726192148-af52008ff663?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxzY2hvb2wlMjBzdXBwbGllcyUyMGJhY2twYWNrJTIwc3RhdGlvbmVyeXxlbnwxfHx8fDE3ODIyMTM5NTR8MA&ixlib=rb-4.1.0&q=80&w=400"
              alt="Offre spéciale"
              className="offer-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
