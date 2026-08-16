import { useState, useEffect } from "react";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Send, CheckCircle2, ChevronDown, User, ShieldCheck, Truck, Sparkles, Tag, AlertCircle } from "lucide-react";
import { useCart, useNavigation } from "../context/AppContext";
import { useCheckout } from "../hooks/useCheckout";
import { useToast } from "../features/admin/components/Toast";
import * as api from "../services/api";
import Seo from "../components/common/Seo";

const GOVERNORATES = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Bizerte", "Nabeul", "Zaghouan",
  "Béja", "Jendouba", "Le Kef", "Siliana", "Sousse", "Monastir", "Mahdia",
  "Sfax", "Kairouan", "Kasserine", "Sidi Bouzid", "Gabès", "Médenine",
  "Tataouine", "Gafsa", "Tozeur", "Kébili"
];

export function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { navigateTo, user } = useNavigation();
  const { placeOrder, loading: checkoutLoading } = useCheckout();
  
  // Form state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [gov, setGov] = useState(user?.governorate || "");
  const [address, setAddress] = useState(user?.address || "");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const { showToast } = useToast();

  // Sync state if user logins/logouts
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
      setGov(user.governorate ?? "");
      setAddress(user.address ?? "");
    }
  }, [user]);

  // Checkout states
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<any>(null);
  const [formError, setFormError] = useState("");
  
  const FREE_SHIPPING_THRESHOLD = 200;
  const shippingFee = cartTotal >= FREE_SHIPPING_THRESHOLD ? 0 : 8;
  const amountForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);
  const freeShippingProgress = Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100);
  
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const grandTotal = Math.max(0, cartTotal + shippingFee - discountAmount);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !gov || !address.trim()) {
      setFormError("Veuillez renseigner tous les champs obligatoires (*).");
      return;
    }

    if (cartItems.length === 0) {
      setFormError("Votre panier est vide.");
      return;
    }

    setFormError("");
    try {
      const orderPayload = {
        userId: user?.id ?? "guest",
        customerEmail: user?.email || "",
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerAddress: address.trim(),
        customerGovernorate: gov,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        paymentMethod,
        deliveryNotes: deliveryNotes.trim(),
        couponCode: appliedCouponCode,
      };

      const result = await placeOrder(orderPayload);

      if (result) {
        setLastOrderDetails({
          name: name.trim(),
          phone: phone.trim(),
          gov,
          total: grandTotal,
          itemsCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        });
        setIsSuccess(true);
        clearCart();
      } else {
        setFormError("Une erreur est survenue lors de la création de la commande. Veuillez réessayer.");
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      setFormError(error?.message || "Une erreur est survenue. Veuillez vérifier votre connexion et réessayer.");
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      showToast('Veuillez entrer un code promo', 'error');
      return;
    }
    setValidatingCoupon(true);
    try {
      const result = await api.validateCoupon(promoCode.trim().toUpperCase(), cartTotal);
      if (result.valid && result.discountAmount !== undefined) {
        setAppliedCouponCode(promoCode.trim().toUpperCase());
        setDiscountAmount(result.discountAmount);
        showToast(`Code promo appliqué : ${result.discountAmount.toFixed(3)} DT de réduction`, 'success');
      } else {
        setAppliedCouponCode("");
        setDiscountAmount(0);
        showToast(result.error || 'Code promo invalide ou expiré', 'error');
      }
    } catch (err) {
      showToast('Impossible de valider ce code pour le moment', 'error');
    } finally {
      setValidatingCoupon(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="page-section success-view py-12">
        <Seo title="Commande Confirmée – Librairie l'Écolier" />
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-emerald-100 shadow-xl text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-200">
            <CheckCircle2 size={44} className="text-emerald-600 animate-bounce" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            Succès
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            Commande Confirmée !
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Merci <strong>{lastOrderDetails?.name || "cher client"}</strong> pour votre confiance. Votre commande de <strong>{lastOrderDetails?.itemsCount || 0} article(s)</strong> a bien été enregistrée.
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left mb-6 space-y-2 text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Mode de règlement :</span>
              <strong>Paiement en espèces à la livraison</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Destination :</span>
              <strong>{lastOrderDetails?.gov}, Tunisie</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total net à payer :</span>
              <strong className="text-primary text-sm font-extrabold">{lastOrderDetails?.total?.toFixed(3)} DT</strong>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-500">Délai estimé :</span>
              <span className="text-emerald-700 font-semibold">24 à 48 heures ouvrables</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setIsSuccess(false);
                navigateTo("home");
              }}
              className="btn-primary"
            >
              Retourner à l'accueil
            </button>
            <button
              onClick={() => {
                setIsSuccess(false);
                navigateTo("category", "");
              }}
              className="btn-secondary"
            >
              Continuer mes achats
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-section cart-page-container">
      <Seo title="Mon Panier & Caisse – Librairie l'Écolier" />
      
      {/* Top back button */}
      <button onClick={() => navigateTo("home")} className="btn-back">
        <ArrowLeft size={16} />
        <span>Continuer mes achats</span>
      </button>

      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <h1 className="cart-page-title m-0">
          Mon Panier <span className="cart-count-title">({cartItems.length} article{cartItems.length > 1 ? "s" : ""})</span>
        </h1>
        {cartItems.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm("Êtes-vous sûr de vouloir vider l'ensemble du panier ?")) {
                clearCart();
              }
            }}
            className="text-xs text-rose-600 font-bold hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
          >
            <Trash2 size={13} />
            <span>Vider le panier</span>
          </button>
        )}
      </div>

      {cartItems.length > 0 ? (
        <div className="cart-page-layout">
          {/* Left Column: Items List */}
          <div className="cart-items-panel">
            {cartItems.map((item) => {
              const itemTotal = item.product.priceNum * item.quantity;
              return (
                <div key={item.product.id} className="cart-item-row">
                  <img src={item.product.img} alt={item.product.name} className="cart-item-img" />
                  
                  <div className="cart-item-details">
                    <p className="cart-item-name">{item.product.name}</p>
                    <p className="cart-item-unit-price">{item.product.price}</p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="cart-item-qty">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="qty-btn"
                      aria-label="Diminuer la quantité"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="qty-btn"
                      aria-label="Augmenter la quantité"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="cart-item-total-block">
                    <span className="cart-item-total">{itemTotal.toFixed(3)} DT</span>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="cart-item-delete"
                      aria-label="Supprimer cet article"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Reassurance Banner under cart list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 font-medium">
                <Truck size={16} className="text-primary shrink-0" />
                <span>Livraison soignée partout en Tunisie (24h à 48h)</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 font-medium">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Paiement en espèces lors de la réception</span>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout & Summary Panel */}
          <div className="cart-summary-panel">
            <h2 className="summary-title">Finaliser ma commande</h2>
            
            {/* Free Shipping Progress Card */}
            <div className="free-shipping-progress-card">
              {cartTotal >= FREE_SHIPPING_THRESHOLD ? (
                <div className="free-shipping-badge-qualified">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <strong>Livraison GRATUITE débloquée !</strong>
                    <p>Félicitations ! Vos frais de livraison sont 100% offerts.</p>
                  </div>
                </div>
              ) : (
                <div className="free-shipping-badge-pending">
                  <div className="progress-label">
                    <span>🚚 Plus que <strong>{amountForFreeShipping.toFixed(3)} DT</strong> pour la livraison gratuite</span>
                    <span className="progress-percent">{Math.round(freeShippingProgress)}%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${freeShippingProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {!user && (
              <div className="flex items-center justify-between gap-2 p-3 mb-4 rounded-xl border border-blue-100 bg-blue-50 text-xs text-blue-900">
                <div className="flex items-center gap-1.5 font-medium">
                  <User size={14} className="text-blue-600" />
                  <span>Vous avez un compte client ?</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo("auth")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2.5 rounded-lg transition-colors text-[11px] border-none cursor-pointer">
                  Se connecter
                </button>
              </div>
            )}

            <form onSubmit={handleCheckout} className="checkout-form">
              {formError && (
                <div className="p-3 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              
              <div className="form-field">
                <label htmlFor="checkout-name">Nom et Prénom *</label>
                <input
                  id="checkout-name"
                  type="text"
                  placeholder="Ex: Mohamed Ben Salah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="checkout-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="checkout-phone">Téléphone portable *</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  placeholder="Ex: 58 98 21 21"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="checkout-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="checkout-gov">Gouvernorat de livraison *</label>
                <div className="select-wrapper">
                  <select
                    id="checkout-gov"
                    value={gov}
                    onChange={(e) => setGov(e.target.value)}
                    required
                    className="checkout-select"
                  >
                    <option value="">Sélectionnez votre gouvernorat</option>
                    {GOVERNORATES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="select-icon" />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="checkout-address">Adresse exacte de livraison *</label>
                <textarea
                  id="checkout-address"
                  placeholder="Ex: 11 Avenue Mongi Slim, Résidence Les Fleurs..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  required
                  className="checkout-textarea"
                />
              </div>

              <div className="form-field">
                <label htmlFor="checkout-payment">Moyen de règlement *</label>
                <div className="select-wrapper">
                  <select
                    id="checkout-payment"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                    className="checkout-select"
                  >
                    <option value="cod">Paiement à la livraison (Espèces à la réception)</option>
                  </select>
                  <ChevronDown size={14} className="select-icon" />
                </div>
                <p className="payment-info">
                  💵 Vous réglez directement le livreur en espèces lors de la remise du colis.
                </p>
              </div>

              <div className="form-field">
                <label htmlFor="checkout-notes">Remarques ou instructions particulières (optionnel)</label>
                <input
                  id="checkout-notes"
                  type="text"
                  placeholder="Ex: Appeler avant d'arriver..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="checkout-input"
                />
              </div>

              {/* Promo Coupon Widget */}
              <div className="promo-section my-3 flex gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Code Promo / Coupon"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs uppercase font-bold tracking-wider rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={validatingCoupon}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl border-none cursor-pointer transition-colors"
                >
                  {validatingCoupon ? 'Validation...' : 'Appliquer'}
                </button>
              </div>

              {/* Order Totals */}
              <div className="summary-totals">
                <div className="total-row">
                  <span>Sous-total articles</span>
                  <span>{cartTotal.toFixed(3)} DT</span>
                </div>
                <div className="total-row">
                  <span>Frais de livraison</span>
                  <span>
                    {(shippingFee as number) === 0 ? (
                      <span className="free-shipping">Gratuit</span>
                    ) : (
                      `${shippingFee.toFixed(3)} DT`
                    )}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="total-row discount-row">
                    <span>Réduction promo ({appliedCouponCode})</span>
                    <span>-{discountAmount.toFixed(3)} DT</span>
                  </div>
                )}

                <div className="total-row grand-total">
                  <span>Total net à payer</span>
                  <span>{grandTotal.toFixed(3)} DT</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5 text-base shadow-lg hover:shadow-xl transition-all font-bold mt-3"
                disabled={checkoutLoading}
              >
                <Send size={17} />
                <span>{checkoutLoading ? 'Création de commande...' : 'Confirmer et Commander'}</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="cart-empty-view">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={40} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800 mb-2">Votre panier est vide</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            Découvrez nos cartables, fournitures et matériel de bureau pour la rentrée 2026.
          </p>
          <button onClick={() => navigateTo("home")} className="btn-primary">
            <span>Explorer la boutique</span>
          </button>
        </div>
      )}
    </div>
  );
}

