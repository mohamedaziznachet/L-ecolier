import { useState, useEffect } from "react";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Send, CheckCircle, ChevronDown, Sparkles } from "lucide-react";
import { useCart, useNavigation } from "../context/AppContext";
import { useAdmin } from "../context/AdminContext";

const GOVERNORATES = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Bizerte", "Nabeul", "Zaghouan",
  "Béja", "Jendouba", "Le Kef", "Siliana", "Sousse", "Monastir", "Mahdia",
  "Sfax", "Kairouan", "Kasserine", "Sidi Bouzid", "Gabès", "Médenine",
  "Tataouine", "Gafsa", "Tozeur", "Kébili"
];

export function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { navigateTo, user } = useNavigation();
  const { addOrder } = useAdmin();

  // Form state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [gov, setGov] = useState(user?.governorate || "");
  const [address, setAddress] = useState(user?.address || "");

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

  const shippingFee = cartTotal >= 100 ? 0 : 7;
  const grandTotal = cartTotal + shippingFee;

  const handleCheckout = (e: React.FormEvent) => {
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

    // Format the WhatsApp message text
    let orderLines = "";
    cartItems.forEach((item) => {
      const itemTotal = item.product.priceNum * item.quantity;
      orderLines += `- *${item.product.name}* (x${item.quantity}) : ${itemTotal.toFixed(3)} DT\n`;
    });

    const messageText = 
`Bonjour Librairie l'Écolier, je souhaite passer la commande suivante :

🛒 *DÉTAILS DE LA COMMANDE*
${orderLines}
💵 *Sous-total* : ${cartTotal.toFixed(3)} DT
🚚 *Frais de livraison* : ${shippingFee === 0 ? "Gratuite (Promo > 100 DT)" : `${shippingFee.toFixed(3)} DT`}
💰 *Total à payer* : ${grandTotal.toFixed(3)} DT

👤 *INFORMATIONS DU CLIENT*
- *Nom & Prénom* : ${name}
- *Téléphone* : ${phone}
- *Gouvernorat* : ${gov}
- *Adresse* : ${address}

Merci de confirmer ma commande !`;

    // WhatsApp API url
    const waNumber = "+21658982121";
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(messageText)}`;

    // Open WhatsApp
    window.open(waUrl, "_blank");

    // Persist the order so it shows up in the admin dashboard.
    addOrder({
      userId: user?.id ?? "guest",
      productIds: cartItems.map((item) => item.product.id),
      total: grandTotal,
      date: new Date().toISOString(),
    });

    // Show success view
    setIsSuccess(true);
    clearCart();
  };

  if (isSuccess) {
    return (
      <div className="page-section success-view">
        <CheckCircle size={64} className="success-icon" />
        <h2>Commande Envoyée avec Succès !</h2>
        <p className="success-message">
          Votre commande a été formatée et envoyée via WhatsApp. Nous vous contacterons très prochainement pour confirmer l'expédition.
        </p>
        <button
          onClick={() => {
            setIsSuccess(false);
            navigateTo("home");
          }}
          className="btn-primary success-btn"
        >
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
            
            {!user && (
              <div className="flex items-center justify-between gap-2 p-3 mb-4 rounded-xl border border-blue-100 bg-blue-50 text-xs text-blue-900 animate-pulse">
                <div className="flex items-center gap-1.5 font-medium">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Déjà client ? Connectez-vous pour remplir automatiquement.</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo("auth")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2.5 rounded-lg transition-colors text-[10px]"
                >
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
                  placeholder="Ex: Mohamed Ben Ali"
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
                  placeholder="Ex: 58 982 121"
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

              <div className="summary-totals">
                <div className="total-row">
                  <span>Sous-total</span>
                  <span>{cartTotal.toFixed(3)} DT</span>
                </div>
                <div className="total-row">
                  <span>Frais de livraison</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="free-shipping">Gratuit</span>
                    ) : (
                      `${shippingFee.toFixed(3)} DT`
                    )}
                  </span>
                </div>
                
                {shippingFee > 0 && (
                  <p className="shipping-hint">
                    💡 Ajoutez encore <strong>{(100 - cartTotal).toFixed(3)} DT</strong> pour obtenir la livraison gratuite !
                  </p>
                )}

                <div className="total-row grand-total">
                  <span>Total à payer</span>
                  <span>{grandTotal.toFixed(3)} DT</span>
                </div>
              </div>

              <button type="submit" className="btn-whatsapp-checkout">
                <Send size={16} />
                Passer ma commande sur WhatsApp
              </button>
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
