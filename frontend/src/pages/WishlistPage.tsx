import { useState } from "react";
import { Heart, ShoppingCart, Trash2, Eye, Star, ArrowLeft, RefreshCw, Check, Sparkles } from "lucide-react";
import { useWishlist, useNavigation, useCart } from "../context/AppContext";
import { ResponsiveImage } from "../utils/ResponsiveImage";
import { Product } from "../types";
import Seo from "../components/common/Seo";

export function WishlistPage() {
  const { wishlistProducts, removeFromWishlist, wishlistCount, loadingWishlist } = useWishlist();
  const { navigateTo, navigateToProduct } = useNavigation();
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState<Record<string | number, boolean>>({});
  const [addingAll, setAddingAll] = useState(false);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  const handleAddAllToCart = () => {
    if (wishlistProducts.length === 0) return;
    setAddingAll(true);
    wishlistProducts.forEach((p) => {
      addToCart(p, 1);
    });
    setTimeout(() => {
      setAddingAll(false);
      navigateTo("cart");
    }, 600);
  };

  const handleRemove = (productId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromWishlist(productId);
  };

  return (
    <div className="page-section wishlist-container">
      <Seo title="Ma Liste d'Envies – Librairie l'Écolier" description="Retrouvez vos articles favoris enregistrés chez Librairie l'Écolier." />

      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigateTo("home")}>
          Accueil
        </span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">Mes Favoris</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Heart size={26} className="text-rose-600 fill-rose-600 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary m-0">Ma Liste d'Envies</h1>
            {wishlistCount > 0 && (
              <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {wishlistCount} article{wishlistCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Retrouvez tous vos articles coup de cœur et ajoutez-les facilement à votre panier.
          </p>
        </div>

        {wishlistProducts.length > 0 && (
          <button
            onClick={handleAddAllToCart}
            disabled={addingAll}
            className="btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <ShoppingCart size={16} />
            <span>{addingAll ? "Ajout en cours..." : "Tout ajouter au panier"}</span>
          </button>
        )}
      </div>

      {loadingWishlist ? (
        <div className="catalog-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="ref-card-skeleton animate-pulse" />
          ))}
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 text-center p-12 max-w-lg mx-auto rounded-3xl shadow-sm">
          <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <Heart size={36} className="text-rose-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">Votre liste d'envies est vide</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Vous n'avez pas encore sauvegardé d'article. Cliquez sur l'icône cœur sur nos produits pour les retrouver ici à tout moment !
          </p>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => navigateTo("category", "")}
          >
            <ArrowLeft size={16} />
            <span>Explorer notre catalogue</span>
          </button>
        </div>
      ) : (
        <div className="catalog-grid">
          {wishlistProducts.map((product) => {
            const isAdded = addedIds[product.id];
            const ratingValue = Number(product.rating || 5);

            return (
              <div
                key={product.id}
                className="ref-product-card group"
                onClick={() => navigateToProduct(product.id)}
              >
                <div className="ref-card-img-wrap">
                  <ResponsiveImage src={product.img} alt={product.name} className="ref-card-img" />
                  
                  {product.badge ? (
                    <span className="ref-card-badge" style={{ backgroundColor: product.badgeColor ?? "var(--c-primary)" }}>
                      {product.badge}
                    </span>
                  ) : null}

                  <button
                    className="ref-card-wishlist-btn"
                    onClick={(e) => handleRemove(product.id, e)}
                    title="Retirer des favoris"
                    aria-label="Retirer des favoris"
                  >
                    <Trash2 size={16} className="text-rose-600 hover:scale-110 transition-transform" />
                  </button>
                </div>

                <div className="ref-card-info">
                  {product.category && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {product.category}
                    </span>
                  )}
                  <h3 className="ref-card-title">{product.name}</h3>

                  <div className="flex items-center gap-1 my-0.5">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} fill={i < Math.floor(ratingValue) ? "currentColor" : "none"} stroke="currentColor" />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">({product.reviews || 0})</span>
                  </div>

                  <div className="ref-card-price-row">
                    {product.oldPrice && (
                      <span className="ref-card-old-price">{product.oldPrice}</span>
                    )}
                    <span className="ref-card-price">{product.price}</span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      className={`ref-buy-btn flex-1${isAdded ? " added" : ""}`}
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={isAdded}
                    >
                      {isAdded ? (
                        <>
                          <Check size={16} className="animate-bounce" />
                          <span>Ajouté !</span>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

