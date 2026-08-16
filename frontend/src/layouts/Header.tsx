// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Search, ShoppingCart, Heart, MapPin, Phone, User, Menu, X, ChevronDown, History, Shield, LogOut, Sparkles } from "lucide-react";
import logoImg from "../assets/logo.png";
import { useNavigation, useCart, useWishlist } from "../context/AppContext";

interface NavItem {
  label: string;
  badge?: string;
  subItems?: string[];
}

const navItems: NavItem[] = [
  { label: "Accueil" },
  { label: "Bomi", badge: "Populaire", subItems: ["Cartable Lux", "Cartable Eco Lux", "Cartable super lux", "Cartable high lux", "Trousse", "Lunch box", "paniers", "Chariots"] },
  { label: "Sac A Dos", subItems: ["Sac A Dos Informatique", "Take And Go", "Trousse"] },
  { label: "Bagagerie", subItems: ["Valise WAMA"] },
  { label: "Parascolaires", subItems: ["Dictionnaires", "Atlas & Cartes", "Livres Éducatifs", "Cahiers d'Exercices"] },
  { label: "Fournitures scolaire", badge: "Rentrée", subItems: ["Crayon Noir", "Crayon de Couleur", "Stylo à Bille", "Feutre & Marqueur", "Gomme", "Taille-Crayon", "Mines", "Ciseaux", "Colle & Adhésif", "Correcteur", "Instruments de Traçage", "Agrafage", "Bureautique"] },
  { label: "Jeux Et Cadeaux", subItems: ["Jeux Éducatifs", "Jouets", "Cadeaux Scolaires"] },
  { label: "Gourde & Thermos", subItems: ["TupperWare", "Rotpunkt", "Uzspace"] },
];

const WA_SVG = (
  <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMobileSubmenus, setOpenMobileSubmenus] = useState<Record<string, boolean>>({});
  const [searchVal, setSearchVal] = useState("");
  const { currentView, activeCategory, activeSubCategory, navigateTo, navigateToSubCategory, user, logoutUser, setSearchQuery } = useNavigation();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const headerRef = useRef<HTMLElement | null>(null);
  const hasMobileNavOpen = mobileOpen;

  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [desktopDropdownParent, setDesktopDropdownParent] = useState<string | null>(null);
  const [desktopDropdownX, setDesktopDropdownX] = useState<number | null>(null);
  const [desktopDropdownW, setDesktopDropdownW] = useState<number | null>(null);
  const desktopDropdownCloseTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!hasMobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      const headerEl = headerRef.current;
      if (!headerEl) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (!headerEl.contains(target)) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [hasMobileNavOpen]);

  useEffect(() => {
    return () => {
      if (desktopDropdownCloseTimer.current) {
        window.clearTimeout(desktopDropdownCloseTimer.current);
      }
    };
  }, []);

  const clearDesktopDropdownCloseTimer = () => {
    if (desktopDropdownCloseTimer.current) {
      window.clearTimeout(desktopDropdownCloseTimer.current);
      desktopDropdownCloseTimer.current = null;
    }
  };

  const scheduleDesktopDropdownClose = () => {
    clearDesktopDropdownCloseTimer();
    desktopDropdownCloseTimer.current = window.setTimeout(() => {
      setDesktopDropdownOpen(false);
      setDesktopDropdownParent(null);
    }, 220);
  };

  // Sticky navbar: add/remove .sticky based on scroll
  useEffect(() => {
    const onScroll = () => {
      const nav = document.querySelector('.nav-desktop');
      if (nav) {
        if (window.scrollY > 50) {
          nav.classList.add('sticky');
        } else {
          nav.classList.remove('sticky');
        }
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearchSubmit = () => {
    if (searchVal.trim()) {
      setSearchQuery(searchVal.trim());
      navigateTo("category", "");
      if (mobileOpen) setMobileOpen(false);
    }
  };

  const clearSearch = () => {
    setSearchVal("");
    setSearchQuery("");
  };

  const toggleMobileSubmenu = (label: string) => {
    setOpenMobileSubmenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavItemClick = (item: NavItem) => {
    if (item.label === "Accueil") {
      navigateTo("home");
    } else {
      navigateTo("category", item.label);
    }
  };

  const isNavItemActive = (item: NavItem): boolean => {
    if (item.label === "Accueil") return currentView === "home";
    if (item.subItems) {
      return currentView === "category" && (activeCategory === item.label || item.subItems.includes(activeCategory) || item.subItems.includes(activeSubCategory));
    }
    return currentView === "category" && activeCategory === item.label;
  };

  return (
    <header ref={headerRef} className="app-header">
      {/* ── Top Announcement Bar ── */}
      <div className="top-bar">
        <div className="top-bar-inner">
          <div className="contact-info">
            <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="contact-item">
              <MapPin size={12} className="text-amber-400" />
              <span>11 Avenue Mongi Slim l'Aouina</span>
            </a>
            <a href="tel:+21658982121" className="contact-item">
              <Phone size={12} className="text-amber-400" />
              <span>+216 58 98 21 21</span>
            </a>
          </div>

          <div className="extras">
            <span className="delivery-note">
              <span className="inline-block animate-pulse">🚚</span>
              <strong>Livraison GRATUITE</strong> dès 200 DT d'achats !
            </span>

            <div className="social-links">
              <a href="https://www.facebook.com/LibrairieLecolier" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-link" title="Facebook">
                <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/librairie__lecolier/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-link" title="Instagram">
                <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path fill="#0d2b6b" d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="#0d2b6b" strokeWidth="2" />
                </svg>
              </a>
              <a href="https://www.tiktok.com/@librairie_lecolier" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="social-link" title="TikTok">
                <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.23 8.23 0 0 0 4.83 1.54V7.15a4.84 4.84 0 0 1-1.06-.46z" />
                </svg>
              </a>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => navigateTo(user.statut === "admin" ? "admin" : "orders")} 
                  className="account-link"
                >
                  <User size={13} />
                  <span>Bonjour, {user.name.split(" ")[0]}</span>
                </button>
                <button
                  type="button"
                  className="social-link text-red-300 hover:text-red-100"
                  onClick={logoutUser}
                  title="Déconnexion"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="header-link text-white/90 hover:text-white"
                  onClick={() => navigateTo("contact")}
                >
                  Contact
                </button>
                <button
                  type="button"
                  className={`account-link${currentView === "auth" ? " active" : ""}`}
                  onClick={() => navigateTo("auth")}
                >
                  <User size={13} />
                  <span>Mon compte</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-toggle"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            <span className="mobile-menu-btn-text">Menu</span>
          </button>
        </div>
      </div>

      {/* ── Main Header ── */}
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
            className="logo-wrap"
          >
            <img src={logoImg} alt="Librairie l'Écolier" className="logo" />
          </a>

          {/* Search Input Bar */}
          <div className="search-wrapper">
            <Search size={18} className="search-icon-decor" />
            <input
              type="text"
              placeholder="Rechercher un produit, une marque, un livre..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              className="search-input"
              aria-label="Rechercher sur le site"
            />
            {searchVal && (
              <button type="button" onClick={clearSearch} className="search-clear-btn" aria-label="Effacer la recherche">
                <X size={15} />
              </button>
            )}
            <button
              className="search-btn"
              onClick={handleSearchSubmit}
              aria-label="Lancer la recherche"
            >
              <Search size={16} />
              <span className="search-btn-text">Rechercher</span>
            </button>
          </div>

          {/* Header Action Buttons */}
          <div className="header-actions-group">
            {user && (
              user.statut === "admin" ? (
                <button
                  type="button"
                  className="pro-header-btn admin-btn"
                  onClick={() => navigateTo("admin")}
                  title="Accéder à l'espace administration"
                >
                  <Shield size={16} />
                  <span className="btn-label">Espace Admin</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={`pro-header-btn history-btn${currentView === "orders" ? " active" : ""}`}
                  onClick={() => navigateTo("orders")}
                  title="Consulter mes commandes"
                >
                  <History size={16} />
                  <span className="btn-label">Mes Commandes</span>
                </button>
              )
            )}

            {/* Wishlist Icon Button */}
            <div
              className={`cart wishlist-header-btn${currentView === "wishlist" ? " active" : ""}`}
              onClick={() => navigateTo("wishlist")}
              role="button"
              tabIndex={0}
              aria-label="Voir la liste d'envies"
              title="Ma liste d'envies"
            >
              <div className="cart-icon-btn">
                <Heart size={22} color={wishlistCount > 0 ? "var(--c-danger)" : "currentColor"} fill={wishlistCount > 0 ? "var(--c-danger)" : "none"} />
              </div>
              {wishlistCount > 0 && (
                <span className="cart-badge badge-wishlist animate-bounce">
                  {wishlistCount}
                </span>
              )}
            </div>

            {/* Cart Icon Button */}
            <div
              className={`cart cart-header-btn${currentView === "cart" ? " active" : ""}`}
              onClick={() => navigateTo("cart")}
              role="button"
              tabIndex={0}
              aria-label="Voir le panier"
              title="Mon panier"
            >
              <div className="cart-icon-btn">
                <ShoppingCart size={22} />
              </div>
              {cartCount > 0 && (
                <span className="cart-badge badge-cart animate-bounce">
                  {cartCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop Navigation Bar ── */}
      <nav className="nav-desktop" aria-label="Navigation principale">
        <div className="nav-inner">
          <div className="nav-items">
            {navItems.map((item) => {
              const isItemActive = isNavItemActive(item);
              const hasSub = !!item.subItems?.length;

              return (
                <div
                  key={item.label}
                  className="nav-item"
                  onMouseEnter={(e) => {
                    if (hasSub) {
                      clearDesktopDropdownCloseTimer();
                      const target = e.currentTarget as HTMLDivElement;
                      const rect = target.getBoundingClientRect();
                      setDesktopDropdownX(rect.left);
                      setDesktopDropdownW(rect.width);
                      setDesktopDropdownParent(item.label);
                      setDesktopDropdownOpen(true);
                    }
                  }}
                  onMouseLeave={() => {
                    if (hasSub) {
                      scheduleDesktopDropdownClose();
                    }
                  }}
                >
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setDesktopDropdownOpen(false);
                      setDesktopDropdownParent(null);
                      handleNavItemClick(item);
                    }}
                    className={`nav-link${isItemActive ? " active" : ""}`}
                    onFocus={() => {
                      if (hasSub) {
                        setDesktopDropdownParent(item.label);
                        setDesktopDropdownOpen(true);
                      }
                    }}
                    onBlur={() => {
                      setDesktopDropdownOpen(false);
                      setDesktopDropdownParent(null);
                    }}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge-pill">{item.badge}</span>
                    )}
                    {item.subItems && <ChevronDown size={13} className="dropdown-icon" />}
                    <span className="nav-link-underline" aria-hidden="true" />
                  </a>
                </div>
              );
            })}
          </div>

          <a href="https://wa.me/+21658982121" className="whatsapp-btn" target="_blank" rel="noopener noreferrer">
            {WA_SVG}
            <span>WhatsApp Express</span>
          </a>
        </div>

        {/* Floating Desktop Dropdown Menu */}
        {desktopDropdownOpen && desktopDropdownParent && (() => {
          const parentItem = navItems.find((i) => i.label === desktopDropdownParent);
          const subItems = parentItem?.subItems || [];
          const isWide = subItems.length > 6;
          const minW = isWide ? Math.max(desktopDropdownW || 0, 420) : Math.max(desktopDropdownW || 0, 240);

          return (
            <div
              className="nav-dropdown-panel"
              role="menu"
              aria-label="Sous-catégories"
              style={{
                left: desktopDropdownX ?? undefined,
                minWidth: minW,
                padding: '14px',
              }}
              onMouseEnter={clearDesktopDropdownCloseTimer}
              onMouseLeave={scheduleDesktopDropdownClose}
            >
              <div className="dropdown-panel-header">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  {parentItem?.label}
                </span>
                <button
                  onClick={() => {
                    setDesktopDropdownOpen(false);
                    setDesktopDropdownParent(null);
                    navigateTo("category", parentItem?.label || "");
                  }}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Tout voir &rarr;
                </button>
              </div>

              <ul style={{
                display: 'grid',
                gridTemplateColumns: isWide ? 'repeat(2, 1fr)' : '1fr',
                gap: '6px 12px',
                margin: '8px 0 0',
                padding: 0,
                listStyle: 'none'
              }}>
                {subItems.map((sub) => {
                  const isSubActive = currentView === "category" && (activeCategory === sub || activeSubCategory === sub);
                  return (
                    <li key={sub}>
                      <button
                        onClick={() => {
                          setDesktopDropdownOpen(false);
                          setDesktopDropdownParent(null);
                          navigateToSubCategory(desktopDropdownParent, sub);
                        }}
                        className={`dropdown-item${isSubActive ? " active" : ""}`}
                      >
                        <span className="item-bullet" />
                        <span className="truncate">{sub}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })()}
      </nav>

      {/* ── Mobile Menu Backdrop ── */}
      {mobileOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Menu Drawer ── */}
      {mobileOpen && (
        <div className="mobile-menu" aria-label="Menu mobile">
          {/* Drawer Header */}
          <div className="mobile-menu-header">
            <img src={logoImg} alt="L'Écolier" style={{ height: 38, width: "auto" }} />
            <button
              type="button"
              className="mobile-close-btn"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Search */}
          <div className="mobile-search-box">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              className="mobile-search-input"
            />
            <button onClick={handleSearchSubmit} className="mobile-search-btn">
              <Search size={16} />
            </button>
          </div>

          {/* User Fast Actions */}
          <div className="mobile-quick-actions">
            {user ? (
              <div className="mobile-user-card">
                <div className="user-avatar-badge">{user.name.charAt(0).toUpperCase()}</div>
                <div className="user-info-text">
                  <div className="user-name-title">{user.name}</div>
                  <div className="user-email-subtitle">{user.email}</div>
                </div>
              </div>
            ) : (
              <button 
                type="button" 
                className="mobile-auth-cta"
                onClick={() => {
                  setMobileOpen(false);
                  navigateTo("auth");
                }}
              >
                <User size={16} />
                <span>Se connecter / S'inscrire</span>
              </button>
            )}
          </div>

          {/* Category List Accordion */}
          <div className="mobile-nav-scroll">
            <div className="mobile-nav-heading">Nos Rayons</div>
            {navItems.map((item) => {
              const isItemActive = isNavItemActive(item);
              const isSubmenuOpen = openMobileSubmenus[item.label] ?? false;

              return (
                <div key={item.label} className="mobile-item">
                  <div className="mobile-link-row">
                    <button
                      type="button"
                      className={`mobile-link${isItemActive ? " active" : ""}`}
                      aria-expanded={item.subItems ? isSubmenuOpen : undefined}
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
                      {item.badge && <span className="nav-badge-pill">{item.badge}</span>}
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
                      <button
                        onClick={() => {
                          navigateTo("category", item.label);
                          setMobileOpen(false);
                        }}
                        className="mobile-subitem view-all"
                      >
                        Tout voir dans {item.label} &rarr;
                      </button>
                      {item.subItems.map((sub) => {
                        const isSubActive = currentView === "category" && (activeCategory === sub || activeSubCategory === sub);
                        return (
                          <button
                            key={sub}
                            onClick={() => {
                              navigateToSubCategory(item.label, sub);
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
          </div>

          {/* Drawer Bottom Actions */}
          <div className="mobile-menu-footer">
            <a href="https://wa.me/+21658982121" className="whatsapp-btn" target="_blank" rel="noopener noreferrer">
              {WA_SVG}
              <span>Commander par WhatsApp</span>
            </a>
            {user && (
              <button
                type="button"
                className="mobile-logout-btn"
                onClick={() => {
                  logoutUser();
                  setMobileOpen(false);
                }}
              >
                <LogOut size={14} />
                <span>Déconnexion</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
