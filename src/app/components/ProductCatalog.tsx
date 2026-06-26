import { useState, useMemo } from "react";
import { Star, ShoppingCart, Heart, Eye, Sliders, ChevronDown, RefreshCw } from "lucide-react";
import { ResponsiveImage } from "./utils/ResponsiveImage";
import { useNavigation, useCart, Product } from "../context/AppContext";
import { catalogProducts } from "./utils/products";

const categoriesList = [
  "Catrable Lux",
  "Catrable super lux",
  "Catrable high lux",
  "Trousse",
  "Lunch box",
  "Chariot",
  "Sacs à dos",
  "Cahiers & Classeurs",
  "Stylos & Crayons",
  "Calculatrices",
  "Matériel artistique",
  "Papeterie"
];

function CatalogProductCard({ product }: { product: Product }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const { navigateToProduct } = useNavigation();
  const { addToCart } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-card" onClick={() => navigateToProduct(product.id)} style={{ cursor: "pointer" }}>
      <div className="product-img-wrap">
        <ResponsiveImage src={product.img} alt={product.name} className="product-img" />
        {product.badge && (
          <span className="product-badge" style={{ backgroundColor: product.badgeColor ?? "var(--c-primary)" }}>
            {product.badge}
          </span>
        )}
        <div className="product-actions">
          <button
            className="product-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setWished(!wished);
            }}
          >
            <Heart size={13} fill={wished ? "var(--c-danger)" : "none"} stroke={wished ? "var(--c-danger)" : "#666"} />
          </button>
          <button
            className="product-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigateToProduct(product.id);
            }}
          >
            <Eye size={13} stroke="#666" />
          </button>
        </div>
      </div>

      <div className="product-body">
        <p className="product-name">{product.name}</p>

        <div className="product-stars">
          <div className="star-row">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={10} fill={i < Math.floor(product.rating) ? "var(--c-accent)" : "none"} stroke="var(--c-accent)" />
            ))}
          </div>
          <span className="product-reviews">({product.reviews})</span>
        </div>

        <div className="product-footer">
          <div>
            <span className="product-price">{product.price}</span>
            {product.oldPrice && (
              <span className="product-old-price">{product.oldPrice}</span>
            )}
          </div>
          <button
            className="add-to-cart-btn"
            onClick={handleAdd}
            style={{ backgroundColor: added ? "var(--c-success)" : "var(--c-primary)" }}
          >
            {added ? "Ajouté !" : <ShoppingCart size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductCatalog() {
  const { activeCategory, navigateTo, searchQuery, setSearchQuery } = useNavigation();
  const [maxPrice, setMaxPrice] = useState<number>(120);
  const [sortBy, setSortBy] = useState<string>("default");

  // Filter products based on selected category, search query, and max price
  const filteredProducts = useMemo(() => {
    let result = catalogProducts;

    // First filter by search query if present
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    } else if (activeCategory) {
      // Direct category filter
      result = result.filter(
        (p) => p.category?.toLowerCase() === activeCategory.toLowerCase()
      );
      
      // Fallback: If no direct matches, check similar
      if (result.length === 0) {
        result = catalogProducts;
      }
    }

    // Filter by price
    result = result.filter((p) => p.priceNum <= maxPrice);

    // Apply sorting
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.priceNum - b.priceNum);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.priceNum - a.priceNum);
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [activeCategory, searchQuery, maxPrice, sortBy]);

  const categoryTitle = searchQuery
    ? `Résultats pour "${searchQuery}"`
    : (activeCategory || "Tous nos articles");

  return (
    <div className="page-section catalog-container">
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
        <span className="breadcrumb-link" onClick={() => setSearchQuery("")}>Boutique</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">{categoryTitle}</span>
      </div>

      <div className="catalog-layout">
        {/* Sidebar Filters */}
        <aside className="catalog-sidebar">
          <div className="filter-card">
            <div className="filter-header">
              <Sliders size={16} />
              <span>Filtres</span>
            </div>

            {/* Categories filter */}
            <div className="filter-group">
              <h4 className="filter-group-title">Catégories</h4>
              <ul className="filter-category-list">
                {categoriesList.map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        navigateTo("category", cat);
                      }}
                      className={`filter-category-btn${activeCategory === cat && !searchQuery ? " active" : ""}`}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price filter */}
            <div className="filter-group">
              <h4 className="filter-group-title">Prix Maximum</h4>
              <div className="price-slider-wrap">
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="price-slider"
                />
                <div className="price-slider-labels">
                  <span>0 DT</span>
                  <span className="price-current">{maxPrice} DT</span>
                  <span>120 DT</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Catalog Main Panel */}
        <div className="catalog-main">
          {/* Header toolbar */}
          <div className="catalog-toolbar">
            <h1 className="catalog-title">
              {categoryTitle}
              <span className="catalog-count-label">({filteredProducts.length} articles)</span>
            </h1>

            <div className="toolbar-actions">
              <div className="sort-select-wrapper">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="default">Trier par défaut</option>
                  <option value="price-asc">Prix : croissant</option>
                  <option value="price-desc">Prix : décroissant</option>
                  <option value="rating">Mieux notés</option>
                </select>
                <ChevronDown size={14} className="sort-select-icon" />
              </div>
            </div>
          </div>

          {/* Product grid */}
          {filteredProducts.length > 0 ? (
            <div className="catalog-grid">
              {filteredProducts.map((product) => (
                <CatalogProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="catalog-empty">
              <RefreshCw size={40} className="empty-icon" />
              <h3>Aucun produit trouvé</h3>
              <p>Essayez de modifier votre filtre de prix maximum pour voir plus d'articles.</p>
              <button
                onClick={() => {
                  setMaxPrice(120);
                  setSortBy("default");
                }}
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
