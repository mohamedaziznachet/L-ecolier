import { useState, useEffect } from "react";
import { ShoppingCart, Heart, ChevronRight, RefreshCw, Sparkles, Star, Check } from "lucide-react";
import { ResponsiveImage } from "../utils/ResponsiveImage";
import { useCart, useNavigation, useWishlist } from "../context/AppContext";
import { Product } from "../types";
import { getFilteredProducts } from "../services/api";

const TARGET_MODELS = ["QUAD", "HOOTIE", "NINJA", "PRETTYGIRL", "BESTFRIEND"];

function ProductCard({ product }: { product: Product }) {
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
    <div className="ref-product-card group" onClick={() => navigateToProduct(product.id || (product as any)._id)}>
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
        ) : (
          <span className="ref-card-badge-new">
            <Sparkles size={11} className="inline mr-1" /> Nouveau
          </span>
        )}

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

        {/* Rating stars snippet */}
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

export function NewCollection() {
  const { navigateTo } = useNavigation();
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const res = await getFilteredProducts({ limit: 100 });
        if (!isCancelled && res.products) {
          const cartableModels = res.products.filter(p => {
            if (!p.name) return false;
            const isCartable = p.category ? p.category.toLowerCase().includes("cartable") : true;
            const matchesModel = TARGET_MODELS.some(model => 
              p.name.toUpperCase().includes(model)
            );
            return isCartable && matchesModel;
          });

          setNewProducts(cartableModels.slice(0, 8));
        }
      } catch (err) {
        console.error("Error fetching new collection products:", err);
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
          <div className="flex items-center gap-2">
            <Sparkles size={22} className="text-rose-600 animate-pulse" />
            <h2 className="section-title">Nouvelle Collection Cartables 2026</h2>
          </div>
          <div className="section-underline" />
        </div>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateTo("category", "Cartable Lux");
          }}
          className="section-link group"
        >
          <span>Découvrir toute la collection</span>
          <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      {loading ? (
        <div className="catalog-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="ref-card-skeleton animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="catalog-grid">
          {newProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

