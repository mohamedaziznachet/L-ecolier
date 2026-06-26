import { ChevronRight } from "lucide-react";
import videoBg from "./vd.mp4";

const categories = [
  { label: "Sacs à dos",            icon: "🎒" },
  { label: "Fournitures scolaires", icon: "📚" },
  { label: "Fournitures de bureau", icon: "🖊️" },
  { label: "Stylos et crayons",     icon: "✏️" },
  { label: "Calculatrices",         icon: "🔢" },
  { label: "Papeterie",             icon: "📄" },
  { label: "Accessoires",           icon: "📐" },
];

const features = [
  { icon: "🚚", title: "Livraison rapide",       desc: "Partout en Tunisie"  },
  { icon: "💳", title: "Paiement à la livraison",desc: "Paiement sécurisé"   },
  { icon: "⭐", title: "Produits de qualité",    desc: "Marques certifiées"  },
  { icon: "🏷️", title: "Meilleurs prix",         desc: "Prix garantis"       },
];

const WA_SVG = (
  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

import { useNavigation } from "../context/AppContext";

export function Hero() {
  const { navigateTo } = useNavigation();

  return (
    <section className="hero-section">
      <div className="hero-layout">

        {/* Sidebar – desktop only */}
        <aside className="hero-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-header">
              <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
              <span className="sidebar-title">Catégories</span>
            </div>
            <ul>
              {categories.map((cat) => (
                <li key={cat.label}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo("category", cat.label);
                    }}
                    className="sidebar-link"
                  >
                    <div className="sidebar-link-inner">
                      <span className="sidebar-icon">{cat.icon}</span>
                      <span className="sidebar-label">{cat.label}</span>
                    </div>
                    <ChevronRight size={14} className="sidebar-chevron" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main banner + feature strip */}
        <div className="hero-main">
          <div className="hero-banner">
            {/* Decorative circles */}
            <div className="hero-deco-circle-1" />
            <div className="hero-deco-circle-2" />

            {/* Content */}
            <div className="hero-content">
              {/* Background video */}
              <video src={videoBg} autoPlay loop muted playsInline className="hero-video" />
              {/* Overlays */}
              <div className="hero-overlay" />
              <div className="hero-overlay-color" />

              <div className="hero-text">
                {/* Badge */}
                <div className="hero-badge">
                  <span>Rentrée 2026</span>
                </div>

                <h1 className="hero-title">
                  <span className="hero-title-main">LA RENTRÉE</span>
                  <span className="hero-title-accent">SCOLAIRE 2026</span>
                </h1>

                <p className="hero-desc">
                  Tout ce qu'il faut pour<br />réussir votre année !
                </p>

                <div className="hero-actions">
                  <button
                    className="btn-primary"
                    onClick={() => navigateTo("category", "Sacs à dos")}
                  >
                    Découvrir maintenant
                    <ChevronRight size={16} />
                  </button>
                  <a href="https://wa.me/+21658982121" className="btn-whatsapp">
                    {WA_SVG}
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Feature strip */}
          <div className="feature-strip">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <span className="feature-icon">{f.icon}</span>
                <div>
                  <p className="feature-title">{f.title}</p>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
