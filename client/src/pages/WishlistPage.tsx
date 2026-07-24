import { useState } from "react";
import { Heart, ShoppingCart, Trash2, Eye, Star, ArrowLeft, RefreshCw } from "lucide-react";
import { useWishlist, useNavigation, useCart } from "../context/AppContext";
import { ResponsiveImage } from "../utils/ResponsiveImage";
import { Product } from "../types";
import Seo from "../components/common/Seo";

export function WishlistPage() {
  const { wishlistProducts, removeFromWishlist, wishlistCount, loadingWishlist } = useWishlist();
  const { navigateTo, navigateToProduct } = useNavigation();
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState<Record<string | number, boolean>>({});

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  const handleRemove = (productId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromWishlist(productId);
  };

  return (
    <div className="page-section wishlist-container">
      <Seo title="Ma Liste d'Envies – L’Écolier" description="Retrouvez vos articles coup de cœur enregistrés dans votre liste d'envies L'Écolier." />

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigateTo("home")}>
          Accueil
        </span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">Liste d'envies</span>
      </div>

      <div className="section-header" style={{ marginBottom: "2rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Heart size={28} color="var(--c-danger)" fill="var(--c-danger)" />
            <h1 className="section-title" style={{ margin: 0 }}>Ma Liste d'Envies</h1>
            {wishlistCount > 0 && (
              <span className="cart-badge" style={{ position: "static", fontSize: "0.9rem", padding: "4px 10px", borderRadius: "12px" }}>
                {wishlistCount}
              </span>
            )}
          </div>
          <p style={{ color: "var(--c-text-muted)", marginTop: "0.4rem", fontSize: "0.92rem" }}>
            Conservez vos produits préférés et ajoutez-les facilement à votre panier à tout moment.
          </p>
        </div>
      </div>

      {loadingWishlist ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <RefreshCw
            size={40}
            style={{ animation: "spin 1s linear infinite", color: "var(--c-primary)", marginBottom: "1rem" }}
          />
          <p style={{ color: "var(--c-text-muted)" }}>Chargement de votre liste d'envies...</p>
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div
          className="a-card"
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            maxWidth: "600px",
            margin: "0 auto",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "rgba(229, 57, 53, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem"
            }}
          >
            <Heart size={40} color="var(--c-danger)" />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Votre liste d'envies est vide</h2>
          <p style={{ color: "var(--c-text-muted)", marginBottom: "2rem", lineHeight: 1.6 }}>
            Vous n'avez pas encore ajouté de produit à vos favoris. Parcourez notre catalogue et cliquez sur le cœur pour enregistrer vos articles préférés !
          </p>
          <button
            className="btn-primary"
            onClick={() => navigateTo("category", "")}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.75rem" }}
          >
            <ArrowLeft size={18} />
            <span>Découvrir nos produits</span>
          </button>
        </div>
      ) : (
        <div className="products-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.5rem" }}>
          {wishlistProducts.map((product) => {
            const isAdded = addedIds[product.id];
            return (
              <div
                key={product.id}
                className="product-card"
                onClick={() => navigateToProduct(product.id)}
                style={{ cursor: "pointer", display: "flex", flexDirection: "column", position: "relative" }}
              >
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
                      onClick={(e) => handleRemove(product.id, e)}
                      title="Retirer des favoris"
                      style={{ color: "var(--c-danger)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      className="product-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToProduct(product.id);
                      }}
                      title="Voir les détails"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>

                <div className="product-body" style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--c-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                      {product.category || "Autre"}
                    </span>
                    <p className="product-name" style={{ marginTop: "0.2rem", fontWeight: 600 }}>{product.name}</p>
                    <div className="product-stars" style={{ margin: "0.4rem 0" }}>
                      <div className="star-row">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < Math.floor(product.rating || 5) ? "var(--c-accent)" : "none"}
                            stroke="var(--c-accent)"
                          />
                        ))}
                      </div>
                      <span className="product-reviews">({product.reviews || 0})</span>
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <span className="product-price" style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--c-primary)" }}>
                        {product.price}
                      </span>
                      {product.oldPrice && (
                        <span style={{ fontSize: "0.85rem", textDecoration: "line-through", color: "var(--c-text-muted)" }}>
                          {product.oldPrice}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="btn-primary"
                        onClick={(e) => handleAddToCart(product, e)}
                        style={{
                          flex: 1,
                          fontSize: "0.85rem",
                          padding: "0.55rem",
                          backgroundColor: isAdded ? "var(--c-success)" : "var(--c-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.4rem",
                          borderRadius: "8px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <ShoppingCart size={15} />
                        <span>{isAdded ? "Ajouté !" : "Ajouter au panier"}</span>
                      </button>
                      <button
                        onClick={(e) => handleRemove(product.id, e)}
                        title="Retirer"
                        style={{
                          padding: "0.55rem",
                          borderRadius: "8px",
                          border: "1px solid var(--c-border)",
                          backgroundColor: "transparent",
                          color: "var(--c-danger)",
                          cursor: "pointer"
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
