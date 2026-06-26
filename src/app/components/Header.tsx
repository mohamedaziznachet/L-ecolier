import { useState } from "react";
import { Search, ShoppingCart, MapPin, Phone, User, Menu, X, ChevronDown } from "lucide-react";
import logoImg from "./img/logo.png";
import { useNavigation, useCart } from "../context/AppContext";

interface NavItem {
  label: string;
  subItems?: string[];
}

const navItems: NavItem[] = [
  { label: "Accueil" },
  { label: "Bomi", subItems: ["Catrable Lux","Cartable Eco Lux" ,"Catrable super lux", "Catrable high lux", "Trousse", "Lunch box","paniers" ,"Chariots"] },
  { label: "Sac A Dos", subItems: ["Sac A Dos Informatique", "Take And Go", "Trousse"] },
  { label: "Bagagerie", subItems: ["Valise WAMA"] },
  { label: "Parascolaires" },
  { label: "Fournitures Scolaire" },
  { label: "Jeux Et Cadeaux" },
  { label: "Gourde & Thermos", subItems: ["TupperWare", "Rotpunkt", "Uzspace"] },
];

const WA_SVG = (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMobileSubmenus, setOpenMobileSubmenus] = useState<Record<string, boolean>>({});
  const [searchVal, setSearchVal] = useState("");
  const { currentView, activeCategory, navigateTo, user, logoutUser, setSearchQuery } = useNavigation();
  const { cartCount } = useCart();

  const handleSearchSubmit = () => {
    if (searchVal.trim()) {
      setSearchQuery(searchVal);
      navigateTo("category", "");
    }
  };

  const toggleMobileSubmenu = (label: string) => {
    setOpenMobileSubmenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavItemClick = (item: NavItem) => {
    if (item.label === "Accueil") {
      navigateTo("home");
    } else if (item.subItems) {
      // Items with submenus navigate to the first subcategory
      navigateTo("category", item.subItems[0]);
    } else {
      // Leaf nav items navigate to their category
      navigateTo("category", item.label);
    }
  };

  const isNavItemActive = (item: NavItem): boolean => {
    if (item.label === "Accueil") return currentView === "home";
    if (item.subItems) {
      return currentView === "category" && item.subItems.includes(activeCategory);
    }
    return currentView === "category" && activeCategory === item.label;
  };

  return (
    <header className="app-header">

      {/* ── Top bar ── */}
      <div className="top-bar">
        <div className="top-bar-inner">
          <div className="contact-info">
            <div className="contact-item">
              <MapPin size={11} />
              <span>11 Avenue Mongi Slim l'Aouina</span>
            </div>
            <div className="contact-item">
              <Phone size={11} />
              <span>+216 58 98 21 21</span>
            </div>
          </div>

          <div className="extras">
            <span className="delivery-note">Livraison rapide en Tunisie</span>

            <div className="social-links">
              <a href="https://www.facebook.com/LibrairieLecolier" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-link">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/librairie_lecolier/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-link">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path fill="#0d2b6b" d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="#0d2b6b" strokeWidth="2" />
                </svg>
              </a>
              <a href="https://www.tiktok.com/@librairie_lecolier" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="social-link">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.23 8.23 0 0 0 4.83 1.54V7.15a4.84 4.84 0 0 1-1.06-.46z" />
                </svg>
              </a>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-amber-300 font-medium">Bonjour, {user.name.split(" ")[0]}</span>
                <button
                  type="button"
                  className="account-link flex items-center gap-1 opacity-90 hover:opacity-100 hover:text-red-400"
                  onClick={logoutUser}
                >
                  <span>Déconnexion</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={`account-link${currentView === "auth" ? " active" : ""}`}
                onClick={() => navigateTo("auth")}
              >
                <User size={12} />
                <span>Mon compte</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main header ── */}
      <div className="main-header">
        <div className="main-header-inner">
          {/* Logo */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setSearchVal("");
              setSearchQuery("");
              navigateTo("home");
            }}
          >
            <img src={logoImg} alt="Librairie l'Écolier" className="logo" />
          </a>

          {/* Search */}
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              className="search-input"
            />
            <button
              className="search-btn"
              onClick={handleSearchSubmit}
              aria-label="Rechercher"
            >
              <Search size={18} />
            </button>
          </div>

          {/* Cart */}
          <div
            className={`cart${currentView === "cart" ? " active" : ""}`}
            onClick={() => navigateTo("cart")}
            role="button"
            aria-label="Voir le panier"
          >
            <div className="cart-icon-btn"><ShoppingCart size={26} /></div>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </div>

          {/* Mobile toggle */}
          <button
            className="mobile-toggle"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Desktop nav ── */}
      <nav className="nav-desktop" aria-label="Navigation principale">
        <div className="nav-inner">
          <div className="nav-items">
            {navItems.map((item) => {
              const isItemActive = isNavItemActive(item);

              return (
                <div key={item.label} className="nav-item">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavItemClick(item);
                    }}
                    className={`nav-link${isItemActive ? " active" : ""}`}
                  >
                    {item.label}
                    {item.subItems && <ChevronDown size={14} className="dropdown-icon" />}
                  </a>
                  {item.subItems && (
                    <div className="dropdown">
                      <ul>
                        {item.subItems.map((sub) => {
                          const isSubActive = currentView === "category" && activeCategory === sub;
                          return (
                            <li key={sub}>
                              <button
                                onClick={() => navigateTo("category", sub)}
                                className={`dropdown-item${isSubActive ? " active" : ""}`}
                              >
                                {sub}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <a href="https://wa.me/+21658982121" className="whatsapp-btn" target="_blank" rel="noopener noreferrer">
            {WA_SVG}
            Commander sur WhatsApp
          </a>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="mobile-menu" aria-label="Menu mobile">
          {navItems.map((item) => {
            const isItemActive = isNavItemActive(item);
            const isSubmenuOpen = openMobileSubmenus[item.label] ?? false;

            return (
              <div key={item.label} className="mobile-item">
                <div className="mobile-link-row">
                  <button
                    className={`mobile-link${isItemActive ? " active" : ""}`}
                    onClick={() => {
                      if (!item.subItems) {
                        handleNavItemClick(item);
                        setMobileOpen(false);
                      } else {
                        toggleMobileSubmenu(item.label);
                      }
                    }}
                  >
                    <span>{item.label}</span>
                    {item.subItems && (
                      <ChevronDown
                        size={16}
                        className={`mobile-chevron${isSubmenuOpen ? " open" : ""}`}
                      />
                    )}
                  </button>
                </div>
                {item.subItems && isSubmenuOpen && (
                  <div className="mobile-submenu">
                    {item.subItems.map((sub) => {
                      const isSubActive = currentView === "category" && activeCategory === sub;
                      return (
                        <button
                          key={sub}
                          onClick={() => {
                            navigateTo("category", sub);
                            setMobileOpen(false);
                          }}
                          className={`mobile-subitem${isSubActive ? " active" : ""}`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <div className="mobile-whatsapp">
            <a href="https://wa.me/+21658982121" className="whatsapp-btn" target="_blank" rel="noopener noreferrer">
              {WA_SVG}
              Commander sur WhatsApp
            </a>
          </div>
        </div>
      )}

    </header>
  );
}
