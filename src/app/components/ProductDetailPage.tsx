import { useState, useMemo } from "react";
import { Star, ShoppingCart, Heart, ChevronLeft, ShieldCheck, Truck, RotateCcw, AlertTriangle } from "lucide-react";
import { useNavigation, useCart, Product } from "../context/AppContext";
import { catalogProducts } from "./utils/products";
import { ResponsiveImage } from "./utils/ResponsiveImage";

export function ProductDetailPage() {
  const { selectedProductId, navigateTo, navigateToProduct } = useNavigation();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);

  // Find the selected product
  const product = useMemo(() => {
    return catalogProducts.find((p) => p.id === selectedProductId) || null;
  }, [selectedProductId]);

  // Find related products in the same category
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return catalogProducts
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product]);

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

  // Prefilled WhatsApp message
  const waMessage = encodeURIComponent(
    `Bonjour, je souhaite commander le produit suivant :\n\n- Produit : ${product.name}\n- Prix : ${product.price}\n- Quantité : ${quantity}\n\nMerci !`
  );

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
            {product.oldPrice && (
              <span className="detail-old-price">{product.oldPrice}</span>
            )}
          </div>

          {/* Description */}
          <p className="detail-description">
            Ce produit de haute qualité est parfaitement adapté aux besoins des étudiants et des professionnels en Tunisie.
            Conçu pour être à la fois durable, fonctionnel et ergonomique.
          </p>

          {/* Product specs / highlights */}
          <div className="specs-table">
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
                className={`btn-wishlist${wished ? " wished" : ""}`}
                onClick={() => setWished(!wished)}
                aria-label="Ajouter aux favoris"
              >
                <Heart size={18} fill={wished ? "var(--c-danger)" : "none"} stroke={wished ? "var(--c-danger)" : "currentColor"} />
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

              {/* WhatsApp direct order */}
              <a
                href={`https://wa.me/+21658982121?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp-detail"
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: "8px" }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
                Commander sur WhatsApp
              </a>
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
