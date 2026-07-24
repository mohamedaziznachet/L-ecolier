import { useState, useEffect } from "react";
import { Star, ShoppingCart, Heart, ChevronLeft, ShieldCheck, Truck, RotateCcw, AlertTriangle } from "lucide-react";
import { useNavigation, useCart, useWishlist } from "../context/AppContext";
import { getProductById, getProducts } from "../services/api";
import { ResponsiveImage } from "../utils/ResponsiveImage";
import { Product } from "../types";

export function ProductDetailPage() {
  const { selectedProductId, navigateTo, navigateToProduct } = useNavigation();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const p = await getProductById(selectedProductId as number | string);
        if (cancelled) return;
        setProduct(p);
        if (p?.category) {
          const all = await getProducts();
          if (cancelled) return;
          setRelatedProducts(
            all
              .filter((x) => x.category === p.category && x.id !== p.id)
              .slice(0, 4)
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedProductId]);

  if (loading) {
    return (
      <div className="page-section" style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <p style={{ color: "var(--c-text-muted)" }}>Chargement du produit...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-section error-container" style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <AlertTriangle size={48} color="var(--c-danger)" style={{ marginBottom: "1rem" }} />
        <h2>Produit non trouvé</h2>
        <p>Le produit demandé n'existe pas ou a été déplacé.</p>
        <button
          onClick={() => navigateTo("home")}
          className="btn-primary"
          style={{ marginTop: "1.5rem", display: "inline-flex" }}
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="page-section product-detail-container">
      {/* Back button and Breadcrumb */}
      <div className="detail-header-nav">
        <button className="btn-back" onClick={() => navigateTo("home")}>
          <ChevronLeft size={16} />
          <span>Retour</span>
        </button>
        <div className="breadcrumb">
          <span className="breadcrumb-link" onClick={() => navigateTo("home")}>Accueil</span>
          <span className="breadcrumb-separator">/</span>
          {product.category && (
            <>
              <span className="breadcrumb-link" onClick={() => navigateTo("category", product.category)}>
                {product.category}
              </span>
              <span className="breadcrumb-separator">/</span>
            </>
          )}
          <span className="breadcrumb-active">{product.name}</span>
        </div>
      </div>

      {/* Main product presentation */}
      <div className="product-detail-layout">
        {/* Left Column: Image Gallery */}
        <div className="product-detail-media">
          <div className="detail-img-wrapper">
            <ResponsiveImage src={product.img} alt={product.name} className="detail-main-img" />
            {product.badge && (
              <span className="product-badge detail-badge" style={{ backgroundColor: product.badgeColor ?? "var(--c-primary)" }}>
                {product.badge}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Info, Buy Options */}
        <div className="product-detail-info">
          <span className="detail-category">{product.category || "Fournitures"}</span>
          <h1 className="detail-title">{product.name}</h1>

          {/* Rating */}
          <div className="detail-rating-row">
            <div className="star-row">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < Math.floor(product.rating) ? "var(--c-accent)" : "none"}
                  stroke="var(--c-accent)"
                />
              ))}
            </div>
            <span className="detail-reviews">({product.reviews} avis clients)</span>
            <span className="stock-badge">
              <span className="stock-pulse" />
              En stock
            </span>
          </div>

          {/* Pricing */}
          <div className="detail-price-row">
            <span className="detail-price">{product.price}</span>
          </div>

          {/* Description */}
          <p className="detail-description" style={{ whiteSpace: "pre-line" }}>
            {product.description && product.description.trim() ? product.description : "Ce produit de haute qualité est parfaitement adapté aux besoins des étudiants et des professionnels en Tunisie. Conçu pour être à la fois durable, fonctionnel et ergonomique."}
          </p>

          {/* Product specs / highlights */}
          <div className="specs-table">
            {product.brand && (
              <div className="spec-row">
                <span className="spec-label">Marque :</span>
                <span className="spec-value">{product.brand}</span>
              </div>
            )}

            {product.specifications && product.specifications.length > 0 && (
              product.specifications.map((spec, idx) => (
                <div className="spec-row" key={idx}>
                  <span className="spec-label">{spec.key} :</span>
                  <span className="spec-value">{spec.value}</span>
                </div>
              ))
            )}
            <div className="spec-row">
              <span className="spec-label">Disponibilité :</span>
              <span className="spec-value">Disponible en magasin et en livraison</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Livraison :</span>
              <span className="spec-value">24 à 48 heures en Tunisie</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Paiement :</span>
              <span className="spec-value text-highlight">Paiement Cash à la livraison</span>
            </div>
          </div>

          {/* Actions wrapper */}
          <div className="detail-actions-section">
            <div className="qty-and-wish">
              {/* Quantity selector */}
              <div className="qty-selector">
                <button onClick={handleDecrement} className="qty-btn" aria-label="Diminuer la quantité">-</button>
                <span className="qty-value">{quantity}</span>
                <button onClick={handleIncrement} className="qty-btn" aria-label="Augmenter la quantité">+</button>
              </div>

              {/* Wishlist button */}
              <button
                className={`btn-wishlist${isInWishlist(product.id) ? " wished" : ""}`}
                onClick={() => toggleWishlist(product)}
                aria-label="Ajouter aux favoris"
                title={isInWishlist(product.id) ? "Retirer de la liste d'envies" : "Ajouter à la liste d'envies"}
              >
                <Heart
                  size={18}
                  fill={isInWishlist(product.id) ? "var(--c-danger)" : "none"}
                  stroke={isInWishlist(product.id) ? "var(--c-danger)" : "currentColor"}
                />
              </button>
            </div>

            {/* Main Add to Cart */}
            <div className="main-buy-buttons">
              <button
                onClick={handleAddToCart}
                className="btn-add-to-cart btn-primary"
                style={{ backgroundColor: added ? "var(--c-success)" : "var(--c-primary)" }}
              >
                <ShoppingCart size={18} />
                <span>{added ? "Ajouté avec succès !" : "Ajouter au panier"}</span>
              </button>

              {/* Buy Now button */}
              <button
                onClick={() => {
                  handleAddToCart();
                  navigateTo("cart");
                }}
                className="btn-buy-now"
              >
                Acheter maintenant
              </button>
            </div>
          </div>

          {/* Quick guarantees/trust icons */}
          <div className="trust-badges-grid">
            <div className="trust-badge-card">
              <Truck size={20} className="trust-icon" />
              <div>
                <p className="trust-title">Livraison Express</p>
                <p className="trust-desc">Dans toute la Tunisie</p>
              </div>
            </div>
            <div className="trust-badge-card">
              <ShieldCheck size={20} className="trust-icon" />
              <div>
                <p className="trust-title">Paiement Sécurisé</p>
                <p className="trust-desc">Cash à la livraison</p>
              </div>
            </div>
            <div className="trust-badge-card">
              <RotateCcw size={20} className="trust-icon" />
              <div>
                <p className="trust-title">Service Clientèle</p>
                <p className="trust-desc">À votre service +216 58 98 21 21</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related products section */}
      {relatedProducts.length > 0 && (
        <div className="related-products-section" style={{ marginTop: "4rem" }}>
          <div className="section-header">
            <div>
              <h2 className="section-title">Produits similaires</h2>
              <div className="section-underline" />
            </div>
          </div>

          <div className="products-grid">
            {relatedProducts.map((p) => {
              return (
                <div key={p.id} className="product-card" onClick={() => navigateToProduct(p.id)} style={{ cursor: "pointer" }}>
                  <div className="product-img-wrap">
                    <ResponsiveImage src={p.img} alt={p.name} className="product-img" />
                    {p.badge && (
                      <span className="product-badge" style={{ backgroundColor: p.badgeColor ?? "var(--c-primary)" }}>
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className="product-body">
                    <p className="product-name">{p.name}</p>
                    <div className="product-stars">
                      <div className="star-row">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={10} fill={i < Math.floor(p.rating) ? "var(--c-accent)" : "none"} stroke="var(--c-accent)" />
                        ))}
                      </div>
                      <span className="product-reviews">({p.reviews})</span>
                    </div>
                    <div className="product-footer">
                      <span className="product-price">{p.price}</span>
                      <button
                        className="add-to-cart-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p);
                        }}
                      >
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
