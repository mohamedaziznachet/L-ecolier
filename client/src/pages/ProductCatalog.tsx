import { useState, useEffect } from "react";
import { Star, ShoppingCart, Heart, Eye, Sliders, ChevronDown, RefreshCw, X, Filter } from "lucide-react";
import { ResponsiveImage } from "../utils/ResponsiveImage";
import { useNavigation, useCart, useWishlist } from "../context/AppContext";
import { Product, Brand } from "../types";
import { getFilteredProducts, getBrands } from "../services/api";
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
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="ref-product-card" onClick={() => navigateToProduct(product.id)}>
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
        ) : product.discount && product.discount > 0 ? (
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
        >
          <Heart size={18} fill={isWished ? "#ef4444" : "none"} stroke={isWished ? "#ef4444" : "#64748b"} />
        </button>
      </div>

      <div className="ref-card-info">
        <h3 className="ref-card-title">{product.name}</h3>
        <div className="ref-card-price-row">
          {product.oldPrice && (
            <span className="ref-card-old-price">{product.oldPrice}</span>
          )}
          <span className="ref-card-price">{product.price}</span>
        </div>

        <button
          className="ref-buy-btn"
          onClick={handleAdd}
          style={{
            backgroundColor: added ? "var(--c-success)" : "var(--c-primary)",
            transition: "all 0.2s ease",
          }}
        >
          <ShoppingCart size={15} />
          <span>{added ? "Ajouté !" : "Acheter"}</span>
        </button>
      </div>
    </div>
  );
}

export function ProductCatalog() {
  const { activeCategory, navigateTo, searchQuery, setSearchQuery, pageNumber, navigateToPage } = useNavigation();
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

  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentPage = Math.min(Math.max(pageNumber ?? 1, 1), totalPages);

  const categoryTitle = searchQuery
    ? `Résultats pour "${searchQuery}"`
    : activeCategory
    ? activeCategory
    : "Tous nos articles";

  // Load available brands
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

  // Debounce price input changes to avoid spamming backend requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [minPrice, maxPrice]);

  // Fetch filtered products
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
  }, [activeCategory, searchQuery, debouncedMinPrice, debouncedMaxPrice, userTouchedPrice, selectedBrand, selectedSchoolLevel, sortBy, currentPage]);

  const gotoPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    if (navigateToPage) navigateToPage(p);
    else navigateTo("category", activeCategory, p);
  };

  const handleResetFilters = () => {
    setUserTouchedPrice(false);
    setMinPrice("");
    setMaxPrice(absoluteMax);
    setSortBy("default");
    setSelectedSchoolLevel("");
    setSelectedBrand("");
    setSearchQuery("");
    navigateTo("category", "");
  };

  return (
    <div className="page-section catalog-container">
      <Seo
        title={`${categoryTitle} – L’Écolier Catalogue`}
        description={`Découvrez nos fournitures scolaires, sac à dos, trousses et papeterie dans la catégorie ${categoryTitle}.`}
      />

      {/* Breadcrumb */}
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
      <div className="mobile-filter-toggle-wrap" style={{ marginBottom: "1rem" }}>
        <button
          className="btn-primary"
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", justifyContent: "center", padding: "0.65rem 1rem" }}
        >
          <Filter size={16} />
          <span>{mobileFilterOpen ? "Fermer les filtres" : "Afficher les filtres"}</span>
        </button>
      </div>

      {/* Backdrop overlay for mobile filter drawer */}
      {mobileFilterOpen && (
        <div
          className="mobile-filter-backdrop"
          onClick={() => setMobileFilterOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(3px)",
            zIndex: 140,
          }}
        />
      )}

      <div className="catalog-layout">
        {/* Sidebar Filters */}
        <aside className={`catalog-sidebar${mobileFilterOpen ? " mobile-open" : ""}`}>
          <div className="filter-card">
            <div className="filter-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sliders size={16} />
                <span>Filtres</span>
              </div>
              {mobileFilterOpen && (
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-text-muted)" }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Category list */}
            <div className="filter-group">
              <h4 className="filter-group-title">Catégories</h4>
              <ul className="filter-category-list">
                <li>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      navigateTo("category", "");
                    }}
                    className={`filter-category-btn${!activeCategory && !searchQuery ? " active" : ""}`}
                  >
                    Tous les produits
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        navigateTo("category", cat);
                        setMobileFilterOpen(false);
                      }}
                      className={`filter-category-btn${activeCategory === cat && !searchQuery ? " active" : ""}`}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price Filter */}
            <div className="filter-group">
              <h4 className="filter-group-title">Filtre par Prix (DT)</h4>
              <div className="price-slider-wrap" style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <input
                  type="range"
                  min="0"
                  max={absoluteMax || 500}
                  value={typeof maxPrice === "number" ? maxPrice : absoluteMax}
                  onChange={(e) => {
                    setUserTouchedPrice(true);
                    setMaxPrice(Number(e.target.value));
                  }}
                  className="price-slider"
                />
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  <input
                    type="number"
                    placeholder="Min"
                    min="0"
                    value={minPrice}
                    onChange={(e) => {
                      setUserTouchedPrice(true);
                      setMinPrice(e.target.value === "" ? "" : Number(e.target.value));
                    }}
                    style={{
                      width: "50%",
                      padding: "0.35rem 0.5rem",
                      fontSize: "0.8rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--c-gray-200)",
                    }}
                  />
                  <span style={{ fontSize: "0.8rem", color: "var(--c-text-muted)" }}>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => {
                      setUserTouchedPrice(true);
                      setMaxPrice(e.target.value === "" ? "" : Number(e.target.value));
                    }}
                    style={{
                      width: "50%",
                      padding: "0.35rem 0.5rem",
                      fontSize: "0.8rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--c-gray-200)",
                    }}
                  />
                </div>
                <div className="price-slider-labels">
                  <span>0 DT</span>
                  <span className="price-current">{typeof maxPrice === "number" ? maxPrice : absoluteMax} DT</span>
                  <span>{absoluteMax} DT</span>
                </div>
              </div>
            </div>

            {/* Brand Filter */}
            {brandsList.length > 0 && (
              <div className="filter-group">
                <h4 className="filter-group-title">Marque</h4>
                <select
                  className="sort-select"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  style={{ width: "100%", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
                >
                  <option value="">Toutes les marques</option>
                  {brandsList.map((b) => (
                    <option key={b._id || b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}



            <button
              onClick={handleResetFilters}
              className="btn-primary"
              style={{ width: "100%", marginTop: "1rem", fontSize: "0.85rem", padding: "0.5rem" }}
            >
              Réinitialiser filtres
            </button>
          </div>
        </aside>

        {/* Main Content Grid */}
        <div className="catalog-main">
          {/* Reference Horizontal Top Filter Bar */}
          <div className="top-filter-bar">
            <div className="filter-pills-left">
              <span className="filter-by-label">Filtrer par :</span>

              {/* Categories */}
              <div className="filter-pill-dropdown">
                <select
                  value={activeCategory}
                  onChange={(e) => {
                    setSearchQuery("");
                    navigateTo("category", e.target.value);
                  }}
                  className="filter-pill-select"
                >
                  <option value="">Tous les produits</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pill-icon" />
              </div>

              {/* Brands */}
              {brandsList.length > 0 && (
                <div className="filter-pill-dropdown">
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="filter-pill-select"
                  >
                    <option value="">Marque</option>
                    {brandsList.map((b) => (
                      <option key={b._id || b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pill-icon" />
                </div>
              )}

              {/* Result Count */}
              <span className="filter-results-count">{totalItems} résultats</span>

              {(activeCategory || selectedBrand || searchQuery) && (
                <button onClick={handleResetFilters} className="clear-filters-btn">
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="filter-sort-right">
              <span className="sort-by-label">Trier par</span>
              <div className="sort-pill-dropdown">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-pill-select">
                  <option value="default">Alphabétique (par défaut)</option>
                  <option value="price-asc">Prix : croissant</option>
                  <option value="price-desc">Prix : décroissant</option>
                  <option value="rating">Mieux notés</option>
                </select>
                <ChevronDown size={14} className="pill-icon" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="catalog-loading" style={{ textAlign: "center", padding: "4rem" }}>
              <RefreshCw
                size={40}
                className="spin-icon"
                style={{ animation: "spin 1s linear infinite", color: "var(--c-primary)" }}
              />
              <p style={{ marginTop: "1rem", color: "var(--c-text-muted)" }}>Chargement des produits...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="catalog-grid">
                {products.map((product) => (
                  <CatalogProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="catalog-pagination" style={{ display: "flex", justifyContent: "center", marginTop: "2rem", gap: ".5rem" }}>
                  <button className="pagination-btn" onClick={() => gotoPage(currentPage - 1)} disabled={currentPage === 1}>
                    Préc.
                  </button>
                  {(() => {
                    const siblingCount = 1;
                    const totalPageNumbers = siblingCount * 2 + 5;
                    if (totalPages <= totalPageNumbers) {
                      return Array.from({ length: totalPages }).map((_, i) => {
                        const p = i + 1;
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
                      });
                    }
                    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
                    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
                    const shouldShowLeftDots = leftSiblingIndex > 2;
                    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

                    if (!shouldShowLeftDots && shouldShowRightDots) {
                      const leftItemCount = 3 + 2 * siblingCount;
                      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
                      return (
                        <>
                          {leftRange.map(p => (
                            <button key={p} className={`pagination-btn${p === currentPage ? " active" : ""}`} onClick={() => gotoPage(p)}>{p}</button>
                          ))}
                          <span style={{ padding: '6px 10px', fontSize: '0.85rem' }}>...</span>
                          <button className="pagination-btn" onClick={() => gotoPage(totalPages)}>{totalPages}</button>
                        </>
                      );
                    }

                    if (shouldShowLeftDots && !shouldShowRightDots) {
                      const rightItemCount = 3 + 2 * siblingCount;
                      const rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + 1 + i);
                      return (
                        <>
                          <button className="pagination-btn" onClick={() => gotoPage(1)}>1</button>
                          <span style={{ padding: '6px 10px', fontSize: '0.85rem' }}>...</span>
                          {rightRange.map(p => (
                            <button key={p} className={`pagination-btn${p === currentPage ? " active" : ""}`} onClick={() => gotoPage(p)}>{p}</button>
                          ))}
                        </>
                      );
                    }

                    const middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
                    return (
                      <>
                        <button className="pagination-btn" onClick={() => gotoPage(1)}>1</button>
                        <span style={{ padding: '6px 10px', fontSize: '0.85rem' }}>...</span>
                        {middleRange.map(p => (
                          <button key={p} className={`pagination-btn${p === currentPage ? " active" : ""}`} onClick={() => gotoPage(p)}>{p}</button>
                        ))}
                        <span style={{ padding: '6px 10px', fontSize: '0.85rem' }}>...</span>
                        <button className="pagination-btn" onClick={() => gotoPage(totalPages)}>{totalPages}</button>
                      </>
                    );
                  })()}
                  <button className="pagination-btn" onClick={() => gotoPage(currentPage + 1)} disabled={currentPage === totalPages}>
                    Suiv.
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="catalog-empty">
              <RefreshCw size={40} className="empty-icon" />
              <h3>Aucun produit trouvé</h3>
              <p>Essayez de réinitialiser vos filtres pour voir tous les articles disponibles.</p>
              <button
                onClick={handleResetFilters}
                className="btn-primary"
                style={{ marginTop: "1rem" }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
