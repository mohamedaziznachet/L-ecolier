import { useState, useEffect } from "react";
import { Star, ShoppingCart, Heart, ChevronLeft, ShieldCheck, Truck, MessageSquare, CheckCircle, PhoneCall, Check, ArrowRight, Sparkles } from "lucide-react";
import { useNavigation, useCart, useWishlist } from "../context/AppContext";
import { getProductById, getProducts, getProductReviews, submitCustomerReview } from "../services/api";
import { ResponsiveImage } from "../utils/ResponsiveImage";
import { Product, Review } from "../types";
import { AvailabilityBadge } from "../components/common/AvailabilityBadge";
import Seo from "../components/common/Seo";

const WA_SVG = (
  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

export function ProductDetailPage() {
  const { selectedProductId, navigateTo, navigateToProduct, user } = useNavigation();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Reviews state
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newCustomerName, setNewCustomerName] = useState(user?.name || "");
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const effectiveProductId =
    selectedProductId ||
    window.location.pathname.match(/^\/product\/([^\/]+)/)?.[1] ||
    new URLSearchParams(window.location.search).get('productId') ||
    localStorage.getItem('ecolier_last_product_id');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        if (!effectiveProductId) {
          setLoading(false);
          return;
        }
        const p = await getProductById(effectiveProductId as number | string);
        if (cancelled) return;
        setProduct(p);

        // Fetch product reviews
        if (p?.id) {
          const revs = await getProductReviews(String(p.id));
          if (!cancelled) setReviewsList(revs);
        }

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
    return () => {
      cancelled = true;
    };
  }, [selectedProductId, effectiveProductId]);

  useEffect(() => {
    if (user?.name && !newCustomerName) {
      setNewCustomerName(user.name);
    }
  }, [user]);

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!newCustomerName.trim()) {
      setReviewMessage({ type: 'error', text: 'Veuillez saisir votre nom.' });
      return;
    }

    setSubmittingReview(true);
    setReviewMessage(null);

    try {
      const res = await submitCustomerReview({
        productId: String(product.id),
        productName: product.name,
        customerName: newCustomerName.trim(),
        rating: newRating,
        comment: newComment.trim(),
        userId: user?.id || 'guest',
      });

      if (res.success) {
        setReviewMessage({ type: 'success', text: res.message || 'Merci ! Votre avis a été publié avec succès.' });
        setNewComment("");
        setShowReviewForm(false);
        const updatedReviews = await getProductReviews(String(product.id));
        setReviewsList(updatedReviews);
        setProduct(prev => prev ? { ...prev, reviews: updatedReviews.length } : null);
      }
    } catch (err: any) {
      setReviewMessage({ type: 'error', text: err.message || 'Échec de l\'envoi de votre avis.' });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="page-section flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-section" style={{ minHeight: "60vh", textAlign: "center", padding: "4rem 1rem" }}>
        <h2 style={{ color: "#0f172a", fontWeight: 800 }}>Article introuvable</h2>
        <p style={{ color: "#64748b" }}>Ce produit n'est plus disponible ou a été déplacé.</p>
        <button onClick={() => navigateTo("category", "")} className="btn-primary" style={{ marginTop: "1rem", padding: "0.75rem 1.75rem", borderRadius: "9999px", fontWeight: 700 }}>
          Retour au catalogue
        </button>
      </div>
    );
  }

  const averageRating = reviewsList.length > 0
    ? (reviewsList.reduce((acc, r) => acc + (r.rating || 5), 0) / reviewsList.length).toFixed(1)
    : Number(product.rating || 5).toFixed(1);

  const whatsappMessage = encodeURIComponent(
    `Bonjour Librairie l'Écolier, je souhaite commander l'article suivant :\n- Produit : ${product.name}\n- Prix : ${product.price}\n- Quantité : ${quantity}\nPouvez-vous m'indiquer la disponibilité et le délai de livraison ? Merci !`
  );

  return (
    <div className="page-section" style={{ minHeight: "75vh", paddingBottom: "4rem" }}>
      <Seo
        title={`${product.name} – Librairie l'Écolier`}
        description={product.description || `Acheter ${product.name} au meilleur prix chez Librairie l'Écolier Tunisie.`}
      />
      
      {/* Sleek Breadcrumb Bar */}
      <div className="breadcrumb" style={{ marginBottom: "1.5rem" }}>
        <button 
          onClick={() => navigateTo("category", "")} 
          className="inline-flex items-center gap-1 text-primary font-bold hover:underline border-none bg-transparent cursor-pointer p-0"
        >
          <ChevronLeft size={16} /> Retour au catalogue
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-link" onClick={() => navigateTo("home")}>Accueil</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-link" onClick={() => navigateTo("category", product.category)}>{product.category || "Fournitures"}</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">{product.name}</span>
      </div>

      {/* Main Product Card Grid */}
      <div className="product-detail-layout">
        
        {/* Left Column: Gallery Display */}
        <div className="product-gallery-card">
          <div className="product-gallery-card-inner">
            <ResponsiveImage src={product.img} alt={product.name} className="product-gallery-img" />
          </div>

          {product.badge ? (
            <span className="product-detail-gallery-badge" style={product.badgeColor ? { backgroundColor: product.badgeColor } : undefined}>
              {product.badge}
            </span>
          ) : product.discount && product.discount > 0 ? (
            <span className="product-detail-gallery-badge bg-rose-600">
              -{product.discount}%
            </span>
          ) : null}
        </div>

        {/* Right Column: Product Information & Purchase Panel */}
        <div className="product-info-panel">
          
          <div>
            {product.category && (
              <span className="product-category-tag">
                {product.category}
              </span>
            )}

            <h1 className="product-detail-title">
              {product.name}
            </h1>

            {/* Rating & Stock Badge Row */}
            <div className="product-rating-row">
              <div className="product-rating-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.floor(Number(averageRating)) ? "#fbbf24" : "none"}
                    stroke="#fbbf24"
                    strokeWidth={2}
                  />
                ))}
                <span className="product-rating-num font-bold">
                  {averageRating}
                </span>
              </div>

              <span className="product-rating-count">
                ({reviewsList.length > 0 ? reviewsList.length : product.reviews} avis vérifiés)
              </span>

              <AvailabilityBadge availability={product.availability} size="md" />
            </div>
          </div>

          {/* Pricing Block */}
          <div className="product-price-block">
            {product.oldPrice && (
              <span className="text-base text-slate-400 line-through mr-2 font-medium">
                {product.oldPrice}
              </span>
            )}
            <span className="product-price-value">
              {product.price}
            </span>
          </div>

          {/* Description */}
          <div className="product-description-card">
            <h3 className="product-description-title">Description de l'article</h3>
            <p className="product-description-text">
              {product.description && product.description.trim() ? product.description : "Article de qualité supérieure sélectionné par Librairie l'Écolier pour répondre aux besoins scolaires et professionnels. Produit 100% garanti et authentique."}
            </p>
          </div>

          {/* Key Product Features */}
          <div className="product-grid-two-cols">
            <div className="product-grid-info-card">
              <span className="product-grid-info-label">MARQUE CERTIFIÉE</span>
              <strong className="product-grid-info-val">{product.brand || "L'Écolier Authentique"}</strong>
            </div>

            <div className="product-grid-info-card">
              <span className="product-grid-info-label">DÉLAI DE LIVRAISON</span>
              <strong className="product-grid-info-val-primary">24h à 48h express</strong>
            </div>
          </div>

          {/* Technical Specifications Section */}
          {((product.specifications && product.specifications.length > 0) || product.schoolLevel) && (
            <div className="product-specs-section">
              <h3 className="product-specs-title">
                <span>📋</span> Caractéristiques détaillées
              </h3>
              <div className="product-specs-grid">
                {product.schoolLevel && (
                  <div className="product-specs-card">
                    <span className="product-specs-key">Niveau Recommandé</span>
                    <strong className="product-specs-val">{product.schoolLevel}</strong>
                  </div>
                )}
                {product.specifications?.map((spec, idx) => (
                  (spec.key?.trim() || spec.value?.trim()) && (
                    <div key={idx} className="product-specs-card">
                      <span className="product-specs-key">{spec.key}</span>
                      <strong className="product-specs-val">{spec.value}</strong>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector & Wishlist Action Row */}
          <div className="product-actions-group">
            <div className="product-qty-selector">
              <button onClick={handleDecrement} className="product-qty-btn" aria-label="Diminuer la quantité">-</button>
              <span className="product-qty-val">{quantity}</span>
              <button onClick={handleIncrement} className="product-qty-btn" aria-label="Augmenter la quantité">+</button>
            </div>

            <button
              onClick={() => toggleWishlist(product)}
              className={`product-wishlist-toggle-btn${isInWishlist(product.id) ? " active" : ""}`}
              title={isInWishlist(product.id) ? "Retirer de la liste d'envies" : "Ajouter à la liste d'envies"}
              aria-label={isInWishlist(product.id) ? "Retirer de la liste d'envies" : "Ajouter à la liste d'envies"}
            >
              <Heart size={20} fill={isInWishlist(product.id) ? "#ef4444" : "none"} stroke={isInWishlist(product.id) ? "#ef4444" : "#64748b"} />
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="product-purchase-btns">
            <button
              onClick={handleAddToCart}
              className={`product-purchase-add-btn${added ? " success" : ""}`}
            >
              {added ? (
                <>
                  <Check size={19} className="animate-bounce" />
                  <span>Ajouté au panier !</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={19} />
                  <span>Ajouter au panier ({quantity})</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                handleAddToCart();
                navigateTo("cart");
              }}
              className="product-purchase-direct-btn"
            >
              <span>Commander direct</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* WhatsApp Direct Express Order Button */}
          <a
            href={`https://wa.me/+21658982121?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] mt-2 no-underline"
          >
            {WA_SVG}
            <span>Commander directement par WhatsApp</span>
          </a>

          {/* Trust Guarantee Cards */}
          <div className="product-trust-grid">
            <div className="product-trust-card">
              <Truck size={20} className="product-trust-icon text-primary" />
              <div>
                <div className="product-trust-title">Livraison Rapide</div>
                <div className="product-trust-desc">Partout en Tunisie</div>
              </div>
            </div>

            <div className="product-trust-card">
              <ShieldCheck size={20} className="product-trust-icon text-emerald-600" />
              <div>
                <div className="product-trust-title">Paiement à la livraison</div>
                <div className="product-trust-desc">En espèces à domicile</div>
              </div>
            </div>

            <div className="product-trust-card">
              <PhoneCall size={20} className="product-trust-icon text-blue-600" />
              <div>
                <div className="product-trust-title">Assistance Client</div>
                <div className="product-trust-desc">+216 58 98 21 21</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── SECTION: AVIS CLIENTS & ÉVALUATIONS ── */}
      <div className="product-reviews-box">
        
        {/* Reviews Section Header */}
        <div className="product-reviews-header">
          <div>
            <h2 className="product-reviews-heading">
              <MessageSquare size={22} /> Avis Clients ({reviewsList.length})
            </h2>
            <p className="product-reviews-subtitle">
              Découvrez les retours d'expérience vérifiés de nos clients sur ce produit.
            </p>
          </div>

          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className={`product-reviews-toggle-btn${showReviewForm ? " active" : ""}`}
          >
            {showReviewForm ? "Fermer le formulaire" : "⭐ Laisser un avis"}
          </button>
        </div>

        {/* Global Feedback Alert Messages */}
        {reviewMessage && (
          <div className={`product-review-alert ${reviewMessage.type === 'success' ? 'success' : 'error'}`}>
            {reviewMessage.type === 'success' ? <CheckCircle size={18} /> : null}
            {reviewMessage.text}
          </div>
        )}

        {/* Interactive Add Review Form */}
        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="product-review-form">
            <h3 className="product-review-form-title">
              Partagez votre avis sur cet article
            </h3>

            {/* Rating Selector */}
            <div className="product-review-form-field">
              <label className="product-review-form-label">
                Votre note (1 à 5 étoiles) *
              </label>
              <div className="product-review-stars-select">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="product-review-stars-btn"
                  >
                    <Star
                      size={28}
                      fill={star <= newRating ? "#fbbf24" : "none"}
                      stroke="#fbbf24"
                      strokeWidth={2}
                    />
                  </button>
                ))}
                <span className="product-review-stars-lbl">
                  {newRating} / 5
                </span>
              </div>
            </div>

            {/* Customer Name Input */}
            <div className="product-review-form-field">
              <label className="product-review-form-label">
                Votre Nom et Prénom *
              </label>
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Ex: Yassine Mansouri"
                required
                className="product-review-input"
              />
            </div>

            {/* Comment Textarea */}
            <div className="product-review-form-field">
              <label className="product-review-form-label">
                Votre Commentaire
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Donnez votre avis sur la qualité du produit, la finition, l'usage quotidien..."
                rows={4}
                className="product-review-input product-review-textarea"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="product-review-submit-btn"
            >
              {submittingReview ? "Envoi en cours..." : "Publier mon avis"}
            </button>
          </form>
        )}

        {/* Reviews List */}
        {reviewsList.length === 0 ? (
          <div className="product-reviews-empty">
            <MessageSquare size={36} className="product-reviews-empty-icon" />
            <h4 className="product-reviews-empty-title">Aucun avis pour le moment</h4>
            <p className="product-reviews-empty-text">
              Soyez le premier client à donner votre avis sur cet article !
            </p>
          </div>
        ) : (
          <div className="product-reviews-list">
            {reviewsList.map((rev) => (
              <div key={rev._id || rev.id} className="product-review-card">
                <div className="product-review-card-header">
                  <div className="product-review-author-info">
                    <div className="product-review-avatar">
                      {(rev.customerName || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="product-review-author-name">{rev.customerName}</div>
                      <div className="product-review-date">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : 'Avis vérifié'}
                      </div>
                    </div>
                  </div>

                  <div className="product-review-card-stars-badge">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} fill={i < rev.rating ? "#fbbf24" : "none"} stroke="#fbbf24" />
                    ))}
                    <span className="product-review-badge-num">{rev.rating}/5</span>
                  </div>
                </div>

                {rev.comment && (
                  <p className="product-review-comment">
                    "{rev.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Related products section */}
      {relatedProducts.length > 0 && (
        <div className="related-products-section" style={{ marginTop: "4rem" }}>
          <div className="section-header">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-primary" />
                <h2 className="section-title">Produits similaires recommandés</h2>
              </div>
              <div className="section-underline" />
            </div>
          </div>

          <div className="catalog-grid">
            {relatedProducts.map((p) => (
              <div key={p.id} className="ref-product-card group" onClick={() => navigateToProduct(p.id)}>
                <div className="ref-card-img-wrap">
                  <ResponsiveImage src={p.img} alt={p.name} className="ref-card-img" />
                  {p.badge && (
                    <span className="ref-card-badge" style={{ backgroundColor: p.badgeColor ?? "var(--c-primary)" }}>
                      {p.badge}
                    </span>
                  )}
                </div>
                <div className="ref-card-info">
                  <h3 className="ref-card-title">{p.name}</h3>
                  <div className="ref-card-price-row">
                    <span className="ref-card-price">{p.price}</span>
                  </div>
                  <button
                    className="ref-buy-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(p, 1);
                    }}
                  >
                    <ShoppingCart size={15} />
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

