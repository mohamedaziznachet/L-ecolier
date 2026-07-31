import { useState, useEffect } from "react";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Send, CheckCircle, ChevronDown, User } from "lucide-react";
import { useCart, useNavigation } from "../context/AppContext";
import { useCheckout } from "../hooks/useCheckout";
import { useToast } from "../features/admin/components/Toast";
import * as api from "../services/api";

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
  const { showToast } = useToast();

  // Sync state if user logins/logouts
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
      setGov(user.governorate ?? "");
      setAddress(user.address ?? "");
    } else {
      setName("");
      setPhone("");
      setGov("");
      setAddress("");
    }
  }, [user]);

  // Checkout states
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState("");
  const FREE_SHIPPING_THRESHOLD = 200;
  const shippingFee = cartTotal >= FREE_SHIPPING_THRESHOLD ? 0 : 7;
  const amountForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);
  const freeShippingProgress = Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100);
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const grandTotal = Math.max(0, cartTotal + shippingFee - discountAmount);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !gov || !address.trim()) {
      setFormError("Veuillez remplir tous les champs du formulaire.");
      return;
    }

    if (cartItems.length === 0) {
      setFormError("Votre panier est vide.");
      return;
    }

    setFormError("");
    try {
      // Send only product identifiers + quantities.
      // The backend validates prices and stock — never trust client-sent totals.
      const result = await placeOrder({
        userId: user?.id ?? "guest",
        customerEmail: user?.email || "",
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        customerGovernorate: gov,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        paymentMethod,
        deliveryNotes,
        couponCode: appliedCouponCode,
      });

      if (result) {
        // Show success view
        setIsSuccess(true);
        clearCart();
      } else {
        setFormError("Une erreur est survenue lors de la création de la commande. Veuillez réessayer.");
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      setFormError(error?.message || "Une erreur est survenue lors de la création de la commande. Veuillez réessayer.");
    }
  };

  if (isSuccess) {
    return (
      <div className="page-section success-view">
        <CheckCircle size={64} className="success-icon" />
        <h2>Commande Confirmée !</h2>
        <p className="success-message">
          Merci pour votre commande ! Paiement à la livraison. Nous vous contacterons bientôt pour confirmer la livraison.
        </p>
        <button
          onClick={() => {
            setIsSuccess(false);
            navigateTo("home");
          }}
          className="btn-primary success-btn">
          Retourner à l'accueil
        </button>
      </div>
    );
  }
  return (
    <div className="page-section cart-page-container">
      {/* Back button */}
      <button onClick={() => navigateTo("home")} className="btn-back">
        <ArrowLeft size={16} />
        Continuer mes achats
      </button>

      <h1 className="cart-page-title">
        Mon Panier <span className="cart-count-title">({cartItems.length} articles)</span>
      </h1>

      {cartItems.length > 0 ? (
        <div className="cart-page-layout">
          {/* Items List */}
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

                  {/* Quantity controls */}
                  <div className="cart-item-qty">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="qty-btn"
                      aria-label="Diminuer la quantité"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="qty-btn"
                      aria-label="Augmenter la quantité"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="cart-item-total-block">
                    <span className="cart-item-total">{itemTotal.toFixed(3)} DT</span>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="cart-item-delete"
                      aria-label="Supprimer l'article"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkout Panel */}
          <div className="cart-summary-panel">
            <h2 className="summary-title">Détails de la livraison</h2>
            
            {/* Free Shipping Progress Card */}
            <div className="free-shipping-progress-card">
              {cartTotal >= FREE_SHIPPING_THRESHOLD ? (
                <div className="free-shipping-badge-qualified">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <strong>Livraison GRATUITE débloquée !</strong>
                    <p>Félicitations ! Votre commande est éligible à la livraison offerte.</p>
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
                  <span>Déjà client ? Connectez-vous pour remplir automatiquement.</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo("auth")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2.5 rounded-lg transition-colors text-[10px]">
                  Connexion
                </button>
              </div>
            )}


            <form onSubmit={handleCheckout} className="checkout-form">
              {formError && <p className="form-error">{formError}</p>}
              
              <div className="form-field">
                <label htmlFor="checkout-name">Nom & Prénom *</label>
                <input
                  id="checkout-name"
                  type="text"
                  placeholder="Ex: Foulen Ben Falten"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="checkout-phone">Numéro de Téléphone *</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  placeholder="Ex: 12 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="checkout-gov">Gouvernorat *</label>
                <div className="select-wrapper">
                  <select
                    id="checkout-gov"
                    value={gov}
                    onChange={(e) => setGov(e.target.value)}
                    required
                  >
                    <option value="">Sélectionner votre gouvernorat</option>
                    {GOVERNORATES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="select-icon" />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="checkout-address">Adresse de livraison *</label>
                <textarea
                  id="checkout-address"
                  placeholder="Ex: 13 Avenue Mongi Slim l'Aouina, App 4"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="checkout-payment">Mode de paiement *</label>
                <div className="select-wrapper">
                  <select
                    id="checkout-payment"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="cod">Paiement à la livraison (Cash on Delivery)</option>
                  </select>
                  <ChevronDown size={14} className="select-icon" />
                </div>
                <p className="payment-info">
                  💵 Vous paierez en espèces à la livraison. Aucun paiement en ligne requis.
                </p>
              </div>

              <div className="form-field">
                <label htmlFor="checkout-notes">Instructions de livraison (optionnel)</label>
                <textarea
                  id="checkout-notes"
                  placeholder=""
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="summary-totals">
                <div className="total-row">
                  <span>Sous-total</span>
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
                      <span>Réduction promo (-{(discountAmount).toFixed(3)} DT)</span>
                      <span>-{discountAmount.toFixed(3)} DT</span>
                    </div>
                  )}


                <div className="total-row grand-total">
                  <span>Total à payer</span>
                  <span>{grandTotal.toFixed(3)} DT</span>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={checkoutLoading}>
                <Send size={16} />
                {checkoutLoading ? 'Traitement en cours...' : 'Confirmer ma commande'}
              </button>
            <div className="promo-section" style={{ marginTop: 16, marginBottom: 16, display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Code Promo"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="promo-input"
                style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--c-gray-200)' }}
              />
              <button
                type="button"
                onClick={async () => {
                  if (!promoCode.trim()) {
                    showToast('Veuillez entrer un code promo', 'error');
                    return;
                  }
                  const result = await api.validateCoupon(promoCode.trim().toUpperCase(), cartTotal);
                  if (result.valid && result.discountAmount !== undefined) {
                    setAppliedCouponCode(promoCode.trim().toUpperCase());
                    setDiscountAmount(result.discountAmount);
                    showToast(`Code promo appliqué : ${result.discountAmount.toFixed(3)} DT de réduction`, 'success');
                  } else {
                    setAppliedCouponCode("");
                    setDiscountAmount(0);
                    showToast(result.error || 'Code promo invalide', 'error');
                  }
                }}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Appliquer
              </button>
            </div>
            </form>
          </div>
        </div>
      
    ) : (
        <div className="cart-empty-view">
          <ShoppingBag size={48} className="empty-icon" />
          <h3>Votre panier est actuellement vide.</h3>
          <p>Découvrez nos collections pour la rentrée scolaire 2026 et trouvez votre bonheur.</p>
          <button onClick={() => navigateTo("home")} className="btn-primary">
            Commencer mes achats
          </button>
        </div>
      )}
    </div>
  );
}
