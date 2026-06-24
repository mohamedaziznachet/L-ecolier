import { useState, useMemo } from "react";
import { Star, ShoppingCart, Heart, Eye, Sliders, ChevronDown, RefreshCw } from "lucide-react";
import { ResponsiveImage } from "./utils/ResponsiveImage";
import { useNavigation, useCart, Product } from "../context/AppContext";

const catalogProducts: Product[] = [
  // Bomi > Catrable Lux
  { id: 101, name: "Cartable Ergonomique Lux - Bleu Profond", price: "48,000 DT", priceNum: 48.0, rating: 4.8, reviews: 34, img: "https://images.unsplash.com/photo-1726726192148-af52008ff663?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Catrable Lux" },
  { id: 102, name: "Cartable Orthopédique Lux - Rose Princesse", price: "49,500 DT", priceNum: 49.5, rating: 4.9, reviews: 27, img: "https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Catrable Lux" },
  { id: 103, name: "Sac à Dos Scolaire Lux Tech - Gris", price: "38,000 DT", priceNum: 38.0, rating: 4.7, reviews: 19, img: "https://images.unsplash.com/photo-1615988938302-bd2a5a7023bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Catrable Lux" },
  
  // Bomi > Catrable super lux
  { id: 104, name: "Cartable Super Lux - Dinosaure 3D", price: "65,000 DT", priceNum: 65.0, rating: 4.9, reviews: 42, img: "https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Catrable super lux" },
  { id: 105, name: "Sac Scolaire Super Lux - Papillon Magique", price: "62,500 DT", priceNum: 62.5, rating: 4.8, reviews: 31, img: "https://images.unsplash.com/photo-1726726192148-af52008ff663?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Catrable super lux" },

  // Bomi > Catrable high lux
  { id: 106, name: "Cartable High Lux Premium - Noir & Or", price: "89,000 DT", priceNum: 89.0, rating: 5.0, reviews: 15, img: "https://images.unsplash.com/photo-1615988938302-bd2a5a7023bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Catrable high lux" },
  { id: 107, name: "Cartable High Lux - Unicorn Glitter", price: "85,000 DT", priceNum: 85.0, rating: 4.9, reviews: 23, img: "https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Catrable high lux" },

  // Bomi > Trousse / Other Trousse
  { id: 108, name: "Trousse Scolaire Double Compartiment - Bic", price: "8,500 DT", priceNum: 8.5, rating: 4.6, reviews: 54, img: "https://images.unsplash.com/photo-1568205612837-017257d2310a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Trousse" },
  { id: 109, name: "Trousse Silicone Imperméable - Fun", price: "6,000 DT", priceNum: 6.0, rating: 4.5, reviews: 38, img: "https://images.unsplash.com/photo-1615988938302-bd2a5a7023bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Trousse" },
  { id: 110, name: "Trousse Grande Capacité - Oxford", price: "12,000 DT", priceNum: 12.0, rating: 4.8, reviews: 47, img: "https://images.unsplash.com/photo-1722929309984-c6b3e55dd6e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Trousse" },

  // Bomi > Lunch box
  { id: 111, name: "Lunch Box Isotherme - Acier Inox", price: "18,500 DT", priceNum: 18.5, rating: 4.7, reviews: 29, img: "https://images.unsplash.com/photo-1615988938302-bd2a5a7023bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Lunch box" },
  { id: 112, name: "Lunch Box Compartimentée - Rotpunkt", price: "14,000 DT", priceNum: 14.0, rating: 4.6, reviews: 16, img: "https://images.unsplash.com/photo-1574607383077-47ddc2dc51c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Lunch box" },
  { id: 113, name: "Lunch Box Enfant - Happy Cat", price: "9,500 DT", priceNum: 9.5, rating: 4.8, reviews: 33, img: "https://images.unsplash.com/photo-1722929309984-c6b3e55dd6e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Lunch box" },

  // Bomi > Chariot
  { id: 114, name: "Cartable Trolley Chariot - Spider-Man 3D", price: "95,000 DT", priceNum: 95.0, rating: 4.9, reviews: 76, img: "https://images.unsplash.com/photo-1726726192148-af52008ff663?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Chariot" },
  { id: 115, name: "Sac à Dos Chariot Renforcé - Galactic", price: "88,000 DT", priceNum: 88.0, rating: 4.7, reviews: 49, img: "https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Chariot" },
  { id: 116, name: "Chariot Scolaire Lux - Licorne Magique", price: "92,000 DT", priceNum: 92.0, rating: 4.9, reviews: 63, img: "https://images.unsplash.com/photo-1615988938302-bd2a5a7023bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Chariot" },

  // Generic Categories for robust navigation
  { id: 1, name: "Cahier scolaire 200 pages",    price: "1,800 DT",  priceNum: 1.8, rating: 4.8, reviews: 124, img: "https://images.unsplash.com/photo-1722929309984-c6b3e55dd6e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Cahiers & Classeurs" },
  { id: 2, name: "Plumier scolaire complet",     price: "12,500 DT", priceNum: 12.5, rating: 4.9, reviews: 89, img: "https://images.unsplash.com/photo-1615988938302-bd2a5a7023bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Stylos & Crayons" },
  { id: 3, name: "Classeur A4 polypropylène",    price: "4,000 DT",  priceNum: 4.0, rating: 4.7, reviews: 56, img: "https://images.unsplash.com/photo-1779684998897-ce5de594a5ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Cahiers & Classeurs" },
  { id: 4, name: "Boîte de crayons de couleur",  price: "8,500 DT",  priceNum: 8.5, rating: 4.6, reviews: 203, img: "https://images.unsplash.com/photo-1568205612837-017257d2310a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Stylos & Crayons" },
  { id: 5, name: "Sac à dos ergonomique",        price: "45,000 DT", priceNum: 45.0, rating: 4.9, reviews: 178, img: "https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Sacs à dos" },
  { id: 6, name: "Calculatrice scientifique",    price: "52,000 DT", priceNum: 52.0, rating: 4.8, reviews: 95, img: "https://images.unsplash.com/photo-1574607383077-47ddc2dc51c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Calculatrices" },
  { id: 7, name: "Valise WAMA Rigide",           price: "115,000 DT",priceNum: 115.0,rating: 4.9, reviews: 36, img: "https://images.unsplash.com/photo-1726726192148-af52008ff663?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Valise WAMA" },
  { id: 8, name: "Sac à dos WAMA Pro",           price: "55,000 DT", priceNum: 55.0, rating: 4.8, reviews: 42, img: "https://images.unsplash.com/photo-1615988938302-bd2a5a7023bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Sac A Dos Informatique" },
  { id: 9, name: "Sac à dos Take & Go",          price: "32,000 DT", priceNum: 32.0, rating: 4.6, reviews: 29, img: "https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Take And Go" },
  { id: 10, name: "Cahier de dessin Canson A3",  price: "9,500 DT",  priceNum: 9.5,  rating: 4.9, reviews: 68, img: "https://images.unsplash.com/photo-1568205612837-017257d2310a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Matériel artistique" },
  { id: 11, name: "Bloc Papier à dessin",        price: "4,500 DT",  priceNum: 4.5,  rating: 4.7, reviews: 52, img: "https://images.unsplash.com/photo-1779684998897-ce5de594a5ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400", category: "Papeterie" }
];

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
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-card">
      <div className="product-img-wrap">
        <ResponsiveImage src={product.img} alt={product.name} className="product-img" />
        {product.badge && (
          <span className="product-badge" style={{ backgroundColor: product.badgeColor ?? "var(--c-primary)" }}>
            {product.badge}
          </span>
        )}
        <div className="product-actions">
          <button className="product-action-btn" onClick={() => setWished(!wished)}>
            <Heart size={13} fill={wished ? "var(--c-danger)" : "none"} stroke={wished ? "var(--c-danger)" : "#666"} />
          </button>
          <button className="product-action-btn">
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
  const { activeCategory, navigateTo } = useNavigation();
  const [maxPrice, setMaxPrice] = useState<number>(120);
  const [sortBy, setSortBy] = useState<string>("default");

  // Filter products based on selected category and max price
  const filteredProducts = useMemo(() => {
    let result = catalogProducts.filter((p) => {
      // Direct match or check if category matches generic lists
      const categoryMatch = p.category?.toLowerCase() === activeCategory.toLowerCase();
      const priceMatch = p.priceNum <= maxPrice;
      return categoryMatch && priceMatch;
    });

    // If no direct matches, check fallback items or show similar
    if (result.length === 0) {
      result = catalogProducts.filter((p) => p.priceNum <= maxPrice);
    }

    // Apply sorting
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.priceNum - b.priceNum);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.priceNum - a.priceNum);
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [activeCategory, maxPrice, sortBy]);

  const categoryTitle = activeCategory || "Tous nos articles";

  return (
    <div className="page-section catalog-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigateTo("home")}>Accueil</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-link">Bomi</span>
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
                      onClick={() => navigateTo("category", cat)}
                      className={`filter-category-btn${activeCategory === cat ? " active" : ""}`}
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
