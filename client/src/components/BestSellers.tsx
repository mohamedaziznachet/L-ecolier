import { useState, useEffect } from "react";
import { ShoppingCart, Heart, ChevronRight, RefreshCw } from "lucide-react";
import { ResponsiveImage } from "../utils/ResponsiveImage";
import { useCart, useNavigation, useWishlist } from "../context/AppContext";
import { Product } from "../types";
import { getFilteredProducts } from "../services/api";

function BestSellerCard({ product }: { product: Product }) {
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

export function BestSellers() {
  const { navigateTo } = useNavigation();
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const res = await getFilteredProducts({ limit: 4 });
        if (!isCancelled) {
          setBestSellers(res.products.slice(0, 4));
        }
      } catch (err) {
        console.error("Error fetching best sellers from database:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Nos produits les plus vendus</h2>
          <div className="section-underline" />
        </div>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateTo("category", "");
          }}
          className="section-link"
        >
          Voir tous les produits <ChevronRight size={14} />
        </a>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <RefreshCw size={32} className="spin-icon" style={{ animation: "spin 1s linear infinite", color: "var(--c-primary)" }} />
        </div>
      ) : (
        <div className="catalog-grid">
          {bestSellers.map((p) => (
            <BestSellerCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
