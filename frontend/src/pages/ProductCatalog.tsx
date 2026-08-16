import { useState, useEffect } from "react";
import { ShoppingCart, Heart, Sliders, ChevronDown, RefreshCw, X, Filter, ChevronLeft, ChevronRight, Star, Check, Sparkles, Tag, ArrowUpDown } from "lucide-react";
import { ResponsiveImage } from "../utils/ResponsiveImage";
import { useNavigation, useCart, useWishlist } from "../context/AppContext";
import { Product, Brand } from "../types";
import { getFilteredProducts, getBrands, getFullAdminCategories } from "../services/api";
import { useAdmin } from "../context/AdminContext";
import Seo from "../components/common/Seo";

function CatalogProductCard({ product }: { product: Product }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const { navigateToProduct } = useNavigation();
  const { addToCart } = useCart();
  const isWished = isInWishlist(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const hasDiscount = product.discount && product.discount > 0;
  const ratingValue = Number(product.rating || 5);

  return (
    <div className="ref-product-card group" onClick={() => navigateToProduct(product.id)}>
      <div className="ref-card-img-wrap">
        <ResponsiveImage src={product.img} alt={product.name} className="ref-card-img" />
        
        {product.badge ? (
          <span
            className={
              product.badge.includes("-") || product.badge.toLowerCase().includes("promo")
                ? "ref-card-badge-discount"
                : "ref-card-badge"
            }
            style={product.badgeColor ? { backgroundColor: product.badgeColor } : undefined}
          >
            {product.badge}
          </span>
        ) : hasDiscount ? (
          <span className="ref-card-badge-discount">-{product.discount}%</span>
        ) : product.oldPrice ? (
          <span className="ref-card-badge-discount">Promo</span>
        ) : null}

        <button
          className="ref-card-wishlist-btn"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          title={isWished ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-label={isWished ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart size={17} fill={isWished ? "#ef4444" : "none"} stroke={isWished ? "#ef4444" : "#64748b"} />
        </button>
      </div>

      <div className="ref-card-info">
        {product.category && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {product.category}
          </span>
        )}
        <h3 className="ref-card-title">{product.name}</h3>

        {/* Rating stars */}
        <div className="flex items-center gap-1 my-0.5">
          <div className="flex text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={12} fill={i < Math.floor(ratingValue) ? "currentColor" : "none"} stroke="currentColor" />
            ))}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">({product.reviews || 8})</span>
        </div>

        <div className="ref-card-price-row">
          {product.oldPrice && (
            <span className="ref-card-old-price">{product.oldPrice}</span>
          )}
          <span className="ref-card-price">{product.price}</span>
        </div>

        <button
          className={`ref-buy-btn${added ? " added" : ""}`}
          onClick={handleAdd}
          disabled={added}
        >
          {added ? (
            <>
              <Check size={16} className="animate-bounce" />
              <span>Ajouté au panier !</span>
            </>
          ) : (
            <>
              <ShoppingCart size={15} />
              <span>Ajouter au panier</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function ProductCatalog() {
  const { activeCategory, activeSubCategory, navigateTo, navigateToSubCategory, searchQuery, setSearchQuery, pageNumber, navigateToPage } = useNavigation();
  const { categories } = useAdmin();

  const itemsPerPage = 12;

  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">(1000);
  const [absoluteMax, setAbsoluteMax] = useState<number>(1000);
  const [userTouchedPrice, setUserTouchedPrice] = useState<boolean>(false);

  const [debouncedMinPrice, setDebouncedMinPrice] = useState<number | "">("");
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState<number | "">(1000);

  const [sortBy, setSortBy] = useState<string>("default");
  const [selectedSchoolLevel, setSelectedSchoolLevel] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [brandsList, setBrandsList] = useState<Brand[]>([]);
  const [fullCategoriesMap, setFullCategoriesMap] = useState<Record<string, string[]>>({});

  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentPage = Math.min(Math.max(pageNumber ?? 1, 1), totalPages);

  const categoryTitle = searchQuery
    ? `Résultats pour "${searchQuery}"`
    : activeCategory && activeSubCategory
    ? `${activeCategory} > ${activeSubCategory}`
    : activeCategory
    ? activeCategory
    : "Tous nos articles";

  useEffect(() => {
    (async () => {
      try {
        const bList = await getBrands();
        setBrandsList(bList);
      } catch (err) {
        console.error("Error loading brands:", err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const docs = await getFullAdminCategories();
        const map: Record<string, string[]> = {};
        docs.forEach((d: any) => {
          if (d.name) {
            const names = (d.subcategories || []).map((s: any) => typeof s === 'string' ? s : s.name);
            map[d.name] = Array.from(new Set(names));
          }
        });
        setFullCategoriesMap(map);
      } catch (err) {
        console.error("Error loading categories map:", err);
      }
    })();
  }, [categories]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
    }, 350);

    return () => {
      clearTimeout(handler);
    };
  }, [minPrice, maxPrice]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await getFilteredProducts({
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery,
          category: activeCategory,
          subcategory: activeSubCategory || undefined,
          minPrice: userTouchedPrice && typeof debouncedMinPrice === "number" ? debouncedMinPrice : undefined,
          maxPrice: userTouchedPrice && typeof debouncedMaxPrice === "number" ? debouncedMaxPrice : undefined,
          brand: selectedBrand,
          schoolLevel: selectedSchoolLevel,
          sortBy,
        });

        if (cancelled) return;

        setProducts(res.products);
        setTotalItems(res.pagination.total);

        if (!userTouchedPrice && res.products.length > 0) {
          const highest = Math.ceil(Math.max(...res.products.map((p) => p.priceNum || 0)));
          if (highest > 0) {
            setAbsoluteMax(highest);
            setMaxPrice(highest);
          }
        }
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setProducts([]);
        setTotalItems(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [activeCategory, activeSubCategory, searchQuery, debouncedMinPrice, debouncedMaxPrice, userTouchedPrice, selectedBrand, selectedSchoolLevel, sortBy, currentPage]);

  const gotoPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    if (navigateToPage) navigateToPage(p);
    else navigateTo("category", activeCategory, p);
  };

  const handleResetFilters = () => {
    setUserTouchedPrice(false);
    setMinPrice("");
    setMaxPrice(1000);
    setSortBy("default");
    setSelectedSchoolLevel("");
    setSelectedBrand("");
    setSearchQuery("");
    navigateTo("category", "");
  };

  const handlePricePreset = (min: number | "", max: number) => {
    setUserTouchedPrice(true);
    setMinPrice(min);
    setMaxPrice(max);
  };

  const hasActiveFilters = Boolean(
    activeCategory ||
    activeSubCategory ||
    selectedBrand ||
    selectedSchoolLevel ||
    userTouchedPrice ||
    searchQuery
  );

  return (
    <div className="page-section catalog-container">
      <Seo
        title={`${categoryTitle} – L’Écolier Catalogue`}
        description={`Découvrez nos fournitures scolaires, sac à dos, trousses et papeterie dans la catégorie ${categoryTitle}.`}
      />

      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <span
          className="breadcrumb-link"
          onClick={() => {
            setSearchQuery("");
            navigateTo("home");
          }}
        >
          Accueil
        </span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-link" onClick={handleResetFilters}>Boutique</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">{categoryTitle}</span>
      </div>

      {/* Mobile Filter Toggle Button */}
      <div className="mobile-filter-toggle-wrap">
        <button
          className="btn-primary mobile-filter-btn"
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
        >
          <Filter size={17} />
          <span>{mobileFilterOpen ? "Fermer les filtres" : `Filtrer les produits (${totalItems})`}</span>
        </button>
      </div>

      {/* Backdrop overlay for mobile filter drawer */}
      {mobileFilterOpen && (
        <div
          className="mobile-filter-backdrop"
          onClick={() => setMobileFilterOpen(false)}
        />
      )}

      <div className="catalog-layout">
        {/* Sidebar Filters */}
        <aside className={`catalog-sidebar${mobileFilterOpen ? " mobile-open" : ""}`}>
          <div className="filter-card">
            <div className="filter-header">
              <div className="flex items-center gap-2 font-bold text-primary">
                <Sliders size={18} />
                <span>Filtrer par critères</span>
              </div>
              {hasActiveFilters && (
                <button onClick={handleResetFilters} className="text-xs font-semibold text-rose-600 hover:underline">
                  Réinitialiser
                </button>
              )}
              {mobileFilterOpen && (
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="mobile-filter-close"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Price Presets */}
            <div className="filter-group">
              <h4 className="filter-group-title">Tranche de Prix (DT)</h4>
              <div className="price-presets-grid">
                <button
                  type="button"
                  className={`price-preset-chip${userTouchedPrice && minPrice === "" && maxPrice === 20 ? " active" : ""}`}
                  onClick={() => handlePricePreset("", 20)}
                >
                  &lt; 20 DT
                </button>
                <button
                  type="button"
                  className={`price-preset-chip${userTouchedPrice && minPrice === 20 && maxPrice === 50 ? " active" : ""}`}
                  onClick={() => handlePricePreset(20, 50)}
                >
                  20 - 50 DT
                </button>
                <button
                  type="button"
                  className={`price-preset-chip${userTouchedPrice && minPrice === 50 && maxPrice === 100 ? " active" : ""}`}
                  onClick={() => handlePricePreset(50, 100)}
                >
                  50 - 100 DT
                </button>
                <button
                  type="button"
                  className={`price-preset-chip${userTouchedPrice && minPrice === 100 ? " active" : ""}`}
                  onClick={() => handlePricePreset(100, 1000)}
                >
                  &gt; 100 DT
                </button>
              </div>

              <div className="filter-price-inputs">
                <div className="price-input-field">
                  <span className="price-input-prefix">Min</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => {
                      setUserTouchedPrice(true);
                      setMinPrice(e.target.value === "" ? "" : Number(e.target.value));
                    }}
                    className="price-num-input"
                  />
                  <span className="price-input-unit">DT</span>
                </div>
                <span className="price-sep">–</span>
                <div className="price-input-field">
                  <span className="price-input-prefix">Max</span>
                  <input
                    type="number"
                    placeholder={String(absoluteMax)}
                    value={maxPrice}
                    onChange={(e) => {
                      setUserTouchedPrice(true);
                      setMaxPrice(e.target.value === "" ? "" : Number(e.target.value));
                    }}
                    className="price-num-input"
                  />
                  <span className="price-input-unit">DT</span>
                </div>
              </div>
            </div>

            {/* Category list */}
            <div className="filter-group">
              <h4 className="filter-group-title">Catégories</h4>
              <ul className="filter-list">
                <li key="all">
                  <button
                    onClick={() => {
                      navigateTo("category", "");
                      if (mobileFilterOpen) setMobileFilterOpen(false);
                    }}
                    className={`filter-item-btn${!activeCategory ? " active" : ""}`}
                  >
                    <span>Tous les articles</span>
                  </button>
                </li>
                {Object.keys(fullCategoriesMap).length > 0 ? (
                  Object.keys(fullCategoriesMap).map((catName) => {
                    const isCatActive = activeCategory === catName;
                    const subList = fullCategoriesMap[catName] || [];

                    return (
                      <li key={catName}>
                        <button
                          onClick={() => {
                            navigateTo("category", catName);
                            if (mobileFilterOpen) setMobileFilterOpen(false);
                          }}
                          className={`filter-item-btn${isCatActive ? " active" : ""}`}
                        >
                          <span>{catName}</span>
                        </button>

                        {/* Subcategories list */}
                        {isCatActive && subList.length > 0 && (
                          <ul className="filter-sublist">
                            {subList.map((sub) => {
                              const isSubActive = activeSubCategory === sub;
                              return (
                                <li key={sub}>
                                  <button
                                    onClick={() => {
                                      navigateToSubCategory(catName, sub);
                                      if (mobileFilterOpen) setMobileFilterOpen(false);
                                    }}
                                    className={`filter-subitem-btn${isSubActive ? " active" : ""}`}
                                  >
                                    <span className="sub-bullet">•</span>
                                    <span>{sub}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })
                ) : (
                  categories.map((c) => (
                    <li key={c}>
                      <button
                        onClick={() => {
                          navigateTo("category", c);
                          if (mobileFilterOpen) setMobileFilterOpen(false);
                        }}
                        className={`filter-item-btn${activeCategory === c ? " active" : ""}`}
                      >
                        <span>{c}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Brand Filter */}
            {brandsList.length > 0 && (
              <div className="filter-group">
                <h4 className="filter-group-title">Marques</h4>
                <div className="filter-brands-scroll">
                  {brandsList.map((b) => (
                    <label key={b._id || b.id || b.name} className="filter-checkbox-row">
                      <input
                        type="radio"
                        name="brandFilter"
                        checked={selectedBrand === b.name}
                        onChange={() => {
                          setSelectedBrand(selectedBrand === b.name ? "" : b.name);
                          if (mobileFilterOpen) setMobileFilterOpen(false);
                        }}
                        className="filter-radio"
                      />
                      <span className="filter-label-text">{b.name}</span>
                    </label>
                  ))}
                  {selectedBrand && (
                    <button
                      onClick={() => setSelectedBrand("")}
                      className="text-xs text-primary font-semibold mt-2 hover:underline"
                    >
                      Effacer le filtre marque
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* School Level Filter */}
            <div className="filter-group">
              <h4 className="filter-group-title">Niveau Scolaire</h4>
              <select
                value={selectedSchoolLevel}
                onChange={(e) => setSelectedSchoolLevel(e.target.value)}
                className="filter-select-input"
              >
                <option value="">Tous les niveaux</option>
                <option value="Maternelle">Maternelle</option>
                <option value="Primaire">Primaire</option>
                <option value="Collège">Collège</option>
                <option value="Lycée">Lycée</option>
                <option value="Universitaire">Universitaire</option>
                <option value="Professionnel">Professionnel</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Main Products Content */}
        <div className="catalog-main">
          {/* Top Control Bar with Search feedback and Sort */}
          <div className="catalog-toolbar">
            <div className="catalog-toolbar-left">
              <h1 className="catalog-heading-title">{categoryTitle}</h1>
              <span className="catalog-count-pill">{totalItems} articles disponibles</span>
            </div>

            <div className="catalog-toolbar-right">
              <span className="sort-label">Trier par :</span>
              <div className="sort-dropdown-wrap">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-dropdown-select"
                >
                  <option value="default">Recommandés / Défaut</option>
                  <option value="price-asc">Prix : croissant</option>
                  <option value="price-desc">Prix : décroissant</option>
                  <option value="rating">Meilleurs avis ⭐</option>
                </select>
                <ChevronDown size={14} className="sort-dropdown-icon" />
              </div>
            </div>
          </div>

          {/* Active Filter Pills Bar */}
          {hasActiveFilters && (
            <div className="active-filters-bar">
              <span className="active-filter-label">Filtres actifs :</span>
              {activeCategory && (
                <span className="filter-chip">
                  Catégorie : {activeCategory}
                  <button onClick={() => navigateTo("category", "")}><X size={12} /></button>
                </span>
              )}
              {activeSubCategory && (
                <span className="filter-chip">
                  Rayon : {activeSubCategory}
                  <button onClick={() => navigateTo("category", activeCategory)}><X size={12} /></button>
                </span>
              )}
              {selectedBrand && (
                <span className="filter-chip">
                  Marque : {selectedBrand}
                  <button onClick={() => setSelectedBrand("")}><X size={12} /></button>
                </span>
              )}
              {selectedSchoolLevel && (
                <span className="filter-chip">
                  Niveau : {selectedSchoolLevel}
                  <button onClick={() => setSelectedSchoolLevel("")}><X size={12} /></button>
                </span>
              )}
              {userTouchedPrice && (
                <span className="filter-chip">
                  Prix : {minPrice || 0} - {maxPrice} DT
                  <button onClick={() => { setUserTouchedPrice(false); setMinPrice(""); setMaxPrice(absoluteMax); }}><X size={12} /></button>
                </span>
              )}
              {searchQuery && (
                <span className="filter-chip">
                  Recherche : "{searchQuery}"
                  <button onClick={() => setSearchQuery("")}><X size={12} /></button>
                </span>
              )}
              <button onClick={handleResetFilters} className="clear-all-filters-btn">
                Tout effacer
              </button>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="catalog-grid">
              {Array.from({ length: itemsPerPage }).map((_, i) => (
                <div key={i} className="ref-card-skeleton animate-pulse" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="catalog-grid">
                {products.map((product) => (
                  <CatalogProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="catalog-pagination-wrap">
                  <div className="catalog-pagination">
                    <button
                      className="pagination-btn pagination-prev"
                      onClick={() => gotoPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      title="Page précédente"
                    >
                      <ChevronLeft size={16} />
                      <span className="pagination-text">Précédent</span>
                    </button>

                    <div className="pagination-numbers">
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const p = i + 1;
                        // Window around current page
                        if (
                          p === 1 ||
                          p === totalPages ||
                          (p >= currentPage - 2 && p <= currentPage + 2)
                        ) {
                          return (
                            <button
                              key={p}
                              className={`pagination-btn${p === currentPage ? " active" : ""}`}
                              onClick={() => gotoPage(p)}
                              aria-current={p === currentPage ? "page" : undefined}
                            >
                              {p}
                            </button>
                          );
                        }
                        if (p === currentPage - 3 || p === currentPage + 3) {
                          return <span key={p} className="pagination-dots">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      className="pagination-btn pagination-next"
                      onClick={() => gotoPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      title="Page suivante"
                    >
                      <span className="pagination-text">Suivant</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="catalog-empty-card">
              <div className="catalog-empty-icon-wrap">
                <RefreshCw size={36} className="text-primary animate-spin" style={{ animationDuration: "12s" }} />
              </div>
              <h3 className="catalog-empty-title">Aucun article ne correspond à votre recherche</h3>
              <p className="catalog-empty-desc">
                Essayez de modifier vos filtres ou de chercher avec des termes plus généraux.
              </p>
              <button
                onClick={handleResetFilters}
                className="btn-primary catalog-empty-reset-btn"
              >
                Réinitialiser tous les filtres
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
