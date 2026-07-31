import { useState, useEffect } from "react";
import { Star, ShoppingCart, Heart, ChevronLeft, ShieldCheck, Truck, MessageSquare, CheckCircle, PhoneCall } from "lucide-react";
import { useNavigation, useCart, useWishlist } from "../context/AppContext";
import { getProductById, getProducts, getProductReviews, submitCustomerReview } from "../services/api";
import { ResponsiveImage } from "../utils/ResponsiveImage";
import { Product, Review } from "../types";
import { AvailabilityBadge } from "../components/common/AvailabilityBadge";

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
        // Refresh product reviews list
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

  return (
    <div className="page-section" style={{ minHeight: "75vh", paddingBottom: "4rem" }}>
      
      {/* Sleek Breadcrumb Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <button 
          onClick={() => navigateTo("category", "")} 
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#0d2b6b", fontWeight: 700, fontSize: "0.9rem", border: "none", background: "none", cursor: "pointer" }}
        >
          <ChevronLeft size={18} /> Retour au catalogue
        </button>

        <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 500 }}>
          <span style={{ cursor: "pointer" }} onClick={() => navigateTo("home")}>Accueil</span> / <span style={{ cursor: "pointer" }} onClick={() => navigateTo("category", "")}>Catalogue</span> / <span style={{ fontWeight: 700, color: "#0f172a" }}>{product.category || "Fournitures"}</span>
        </div>
      </div>

      {/* Main Product Card Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "2.5rem", alignItems: "start" }}>
        
        {/* Left Column: Premium Gallery Display */}
        <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "2rem", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)", position: "relative" }}>
          <div style={{ width: "100%", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <ResponsiveImage src={product.img} alt={product.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transition: "transform 0.3s ease" }} />
          </div>

          {product.badge && (
            <span style={{ position: "absolute", top: "1.25rem", left: "1.25rem", background: product.badgeColor || "#0d2b6b", color: "#ffffff", padding: "0.35rem 0.85rem", borderRadius: "9999px", fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              {product.badge}
            </span>
          )}
        </div>

        {/* Right Column: Product Information & Purchase Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div>
            <span style={{ display: "inline-block", background: "#f0f6ff", border: "1px solid #bfdbfe", color: "#0d2b6b", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              {product.category || "Fournitures Scolaires"}
            </span>

            <h1 style={{ fontSize: "1.85rem", fontWeight: 900, color: "#0f172a", margin: "0.2rem 0 0.6rem 0", lineHeight: 1.25 }}>
              {product.name}
            </h1>

            {/* Rating & Stock Badge Row */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.floor(Number(averageRating)) ? "#fbbf24" : "none"}
                    stroke="#fbbf24"
                    strokeWidth={2}
                  />
                ))}
                <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.9rem", marginLeft: "4px" }}>
                  {averageRating}
                </span>
              </div>

              <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
                ({reviewsList.length > 0 ? reviewsList.length : product.reviews} avis vérifiés)
              </span>

              <AvailabilityBadge availability={product.availability} size="md" />
            </div>
          </div>

          {/* Pricing Block */}
          <div style={{ background: "#f8fafc", padding: "1.15rem 1.35rem", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
            <span style={{ fontSize: "2.1rem", fontWeight: 900, color: "#0d2b6b" }}>
              {product.price}
            </span>
          </div>

          {/* Description */}
          <div style={{ background: "#ffffff", padding: "1.15rem 1.35rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.4rem" }}>Description du produit</h3>
            <p style={{ fontSize: "0.92rem", color: "#334155", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
              {product.description && product.description.trim() ? product.description : "Ce produit de qualité supérieure est conçu spécialement pour répondre aux exigences scolaires et professionnelles en Tunisie. Fabriqué avec soin pour offrir une durabilité et un confort d'utilisation optimal au quotidien."}
            </p>
          </div>

          {/* Key Product Features & Shipping Highlights */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.85rem" }}>
            <div style={{ background: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: 700 }}>MARQUE</span>
              <strong style={{ color: "#0f172a" }}>{product.brand || "L'Écolier Selection"}</strong>
            </div>

            <div style={{ background: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: 700 }}>LIVRAISON</span>
              <strong style={{ color: "#0d2b6b" }}>24 à 48 heures</strong>
            </div>
          </div>

          {/* Technical Specifications Section */}
          {((product.specifications && product.specifications.length > 0) || product.schoolLevel) && (
            <div style={{ background: "#ffffff", padding: "1.15rem 1.35rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>📋</span> Spécifications Techniques
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.6rem" }}>
                {product.schoolLevel && (
                  <div style={{ background: "#f8fafc", padding: "0.65rem 0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Niveau Scolaire</span>
                    <strong style={{ color: "#0f172a", fontSize: "0.88rem" }}>{product.schoolLevel}</strong>
                  </div>
                )}
                {product.specifications?.map((spec, idx) => (
                  (spec.key?.trim() || spec.value?.trim()) && (
                    <div key={idx} style={{ background: "#f8fafc", padding: "0.65rem 0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>{spec.key}</span>
                      <strong style={{ color: "#0f172a", fontSize: "0.88rem" }}>{spec.value}</strong>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector & Wishlist Action Row */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "12px", background: "#ffffff", height: "46px", overflow: "hidden" }}>
              <button onClick={handleDecrement} style={{ width: "42px", height: "100%", border: "none", background: "none", fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", cursor: "pointer" }}>-</button>
              <span style={{ width: "40px", textAlign: "center", fontWeight: 800, fontSize: "1rem", color: "#0d2b6b" }}>{quantity}</span>
              <button onClick={handleIncrement} style={{ width: "42px", height: "100%", border: "none", background: "none", fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", cursor: "pointer" }}>+</button>
            </div>

            <button
              onClick={() => toggleWishlist(product)}
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "12px",
                border: isInWishlist(product.id) ? "1px solid #ef4444" : "1px solid #cbd5e1",
                background: isInWishlist(product.id) ? "#fef2f2" : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              title={isInWishlist(product.id) ? "Retirer de la liste d'envies" : "Ajouter à la liste d'envies"}
            >
              <Heart size={20} fill={isInWishlist(product.id) ? "#ef4444" : "none"} stroke={isInWishlist(product.id) ? "#ef4444" : "#64748b"} />
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
            <button
              onClick={handleAddToCart}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                background: added ? "#16a34a" : "linear-gradient(135deg, #0d2b6b 0%, #153d93 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "14px",
                padding: "0.9rem",
                fontSize: "0.95rem",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(13, 43, 107, 0.2)",
                transition: "all 0.15s ease"
              }}
            >
              <ShoppingCart size={19} />
              <span>{added ? "Ajouté avec succès !" : "Ajouter au panier"}</span>
            </button>

            <button
              onClick={() => {
                handleAddToCart();
                navigateTo("cart");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f1f5f9",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "14px",
                padding: "0.9rem",
                fontSize: "0.95rem",
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Commander direct
            </button>
          </div>

          {/* Trust Guarantee Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", marginTop: "0.5rem" }}>
            <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Truck size={20} style={{ color: "#0d2b6b", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a" }}>Livraison Express</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Toute la Tunisie</div>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <ShieldCheck size={20} style={{ color: "#16a34a", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a" }}>Paiement Cash</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>À la livraison</div>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <PhoneCall size={20} style={{ color: "#2563eb", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a" }}>Service Client</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>+216 58 98 21 21</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── SECTION: AVIS CLIENTS & ÉVALUATIONS (REVIEWS SECTION) ── */}
      <div style={{ marginTop: "3.5rem", background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "2rem", boxShadow: "0 6px 25px rgba(15, 23, 42, 0.03)" }}>
        
        {/* Reviews Section Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "1.25rem", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0d2b6b", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MessageSquare size={22} /> Avis Clients ({reviewsList.length})
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "0.25rem", margin: 0 }}>
              Découvrez les retours d'expérience vérifiés de nos clients.
            </p>
          </div>

          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            style={{
              background: showReviewForm ? "#f1f5f9" : "#0d2b6b",
              color: showReviewForm ? "#0f172a" : "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "9999px",
              padding: "0.65rem 1.4rem",
              fontSize: "0.88rem",
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            {showReviewForm ? "Fermer le formulaire" : "⭐ Écrire un avis"}
          </button>
        </div>

        {/* Global Feedback Alert Messages */}
        {reviewMessage && (
          <div style={{
            marginBottom: "1.5rem",
            padding: "0.85rem 1.15rem",
            borderRadius: "12px",
            fontSize: "0.88rem",
            fontWeight: 600,
            background: reviewMessage.type === 'success' ? '#dcfce7' : '#fef2f2',
            color: reviewMessage.type === 'success' ? '#15803d' : '#b91c1c',
            border: `1px solid ${reviewMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {reviewMessage.type === 'success' ? <CheckCircle size={18} /> : null}
            {reviewMessage.text}
          </div>
        )}

        {/* Interactive Add Review Form */}
        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
              Partagez votre avis sur cet article
            </h3>

            {/* Rating Selector */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#0d2b6b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>
                Évaluation (1 à 5 étoiles) *
              </label>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    style={{ border: "none", background: "none", cursor: "pointer", padding: "2px" }}
                  >
                    <Star
                      size={28}
                      fill={star <= newRating ? "#fbbf24" : "none"}
                      stroke="#fbbf24"
                      strokeWidth={2}
                    />
                  </button>
                ))}
                <span style={{ marginLeft: "0.75rem", fontSize: "0.95rem", fontWeight: 800, color: "#0d2b6b" }}>
                  {newRating} / 5
                </span>
              </div>
            </div>

            {/* Customer Name Input */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#0d2b6b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>
                Votre Nom et Prénom *
              </label>
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Ex: Yassine Mansouri"
                required
                style={{
                  width: "100%",
                  padding: "0.7rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                  color: "#0f172a",
                  outline: "none",
                  background: "#ffffff"
                }}
              />
            </div>

            {/* Comment Textarea */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#0d2b6b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>
                Votre Commentaire
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Donnez votre avis sur la qualité du produit, la livraison, la conformité..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                  color: "#0f172a",
                  outline: "none",
                  resize: "vertical",
                  background: "#ffffff"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              style={{
                background: "linear-gradient(135deg, #0d2b6b 0%, #153d93 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "9999px",
                padding: "0.75rem 2rem",
                fontSize: "0.9rem",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 6px 16px rgba(13,43,107,0.2)"
              }}
            >
              {submittingReview ? "Envoi en cours..." : "Publier l'avis"}
            </button>
          </form>
        )}

        {/* Reviews List */}
        {reviewsList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem", background: "#f8fafc", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            <MessageSquare size={36} style={{ color: "#94a3b8", marginBottom: "0.75rem" }} />
            <h4 style={{ color: "#0f172a", margin: "0 0 0.35rem 0", fontWeight: 800 }}>Aucun avis pour cet article</h4>
            <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
              Soyez le premier client à laisser votre évaluation !
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {reviewsList.map((rev) => (
              <div key={rev._id || rev.id} style={{ background: "#f8fafc", padding: "1.2rem 1.4rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0d2b6b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>
                      {(rev.customerName || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>{rev.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : 'Avis vérifié'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "3px", background: "#ffffff", padding: "0.3rem 0.75rem", borderRadius: "9999px", border: "1px solid #e2e8f0" }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} fill={i < rev.rating ? "#fbbf24" : "none"} stroke="#fbbf24" />
                    ))}
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0d2b6b", marginLeft: "4px" }}>{rev.rating}/5</span>
                  </div>
                </div>

                {rev.comment && (
                  <p style={{ color: "#1e293b", fontSize: "0.92rem", margin: "0.6rem 0 0 0", lineHeight: 1.5, fontWeight: 500 }}>
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
              <h2 className="section-title" style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0d2b6b" }}>Produits similaires</h2>
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
                    <p className="product-name" style={{ fontWeight: 700, color: "#0f172a" }}>{p.name}</p>
                    <div className="product-stars">
                      <div className="star-row">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11} fill={i < Math.floor(p.rating || 5) ? "#fbbf24" : "none"} stroke="#fbbf24" />
                        ))}
                      </div>
                      <span className="product-reviews">({p.reviews})</span>
                    </div>
                    <div className="product-footer">
                      <span className="product-price" style={{ fontWeight: 800, color: "#0d2b6b" }}>{p.price}</span>
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
