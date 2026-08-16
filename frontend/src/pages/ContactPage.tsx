import { useState } from "react";
import { MapPin, Phone, Mail, Send, Clock, Facebook, Instagram, MessageCircle, CheckCircle2, Sparkles, Navigation } from "lucide-react";
import { useNavigation } from "../context/AppContext";
import Seo from '../components/common/Seo';

const WA_SVG = (
  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

export function ContactPage() {
  const { navigateTo } = useNavigation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="page-section" style={{ minHeight: "80vh", paddingBottom: "4rem" }}>
      <Seo title="Contactez-nous – Librairie l'Écolier" description="Contactez le service client de Librairie l'Écolier par téléphone, email ou WhatsApp." />
      
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigateTo("home")}>Accueil</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">Contact</span>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary via-blue-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 mb-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 border border-white/15">
            <Sparkles size={14} /> Assistance Client 7j/7
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Contactez Notre Équipe
          </h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            Une question sur un cartable, une commande ou nos délais de livraison ? Nous sommes là pour vous aider avec plaisir.
          </p>
        </div>
      </div>

      <div className="contact-layout">
        {/* Left Column: Contact Information Cards */}
        <div className="contact-info-panel">
          <h2 className="contact-info-title">Nos Coordonnées</h2>
          
          <div className="contact-info-item">
            <MapPin size={22} className="contact-info-icon" />
            <div>
              <h4 className="contact-info-label">Adresse de la Librairie</h4>
              <p className="contact-info-value font-bold text-slate-800">11 Avenue Mongi Slim, L'Aouina</p>
              <p className="contact-info-value text-slate-500 text-xs">Tunis, Tunisie</p>
              <a
                href="https://maps.google.com/?q=11+Avenue+Mongi+Slim+Laouina+Tunis"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary mt-1 hover:underline"
              >
                <Navigation size={12} />
                <span>Ouvrir dans Google Maps</span>
              </a>
            </div>
          </div>

          <div className="contact-info-item">
            <Phone size={22} className="contact-info-icon" />
            <div>
              <h4 className="contact-info-label">Téléphone Direct</h4>
              <a href="tel:+21658982121" className="contact-info-value font-bold text-primary text-base hover:underline block">
                +216 58 98 21 21
              </a>
              <span className="text-slate-400 text-xs">Appels & assistance</span>
            </div>
          </div>

          <div className="contact-info-item">
            <Mail size={22} className="contact-info-icon" />
            <div>
              <h4 className="contact-info-label">Courrier Électronique</h4>
              <a href="mailto:ecolier.librairie@gmail.com" className="contact-info-value text-slate-800 font-medium hover:underline block text-xs sm:text-sm">
                ecolier.librairie@gmail.com
              </a>
            </div>
          </div>

          <div className="contact-info-item">
            <Clock size={22} className="contact-info-icon" />
            <div>
              <h4 className="contact-info-label">Horaires d'Ouverture</h4>
              <p className="contact-info-value font-bold text-emerald-700">7j / 7 : 08h00 – 00h00</p>
              <span className="text-slate-400 text-xs">Service non-stop</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="contact-social">
            <h3 className="contact-social-title">Rejoignez notre communauté</h3>
            <div className="contact-social-links">
              <a
                href="https://www.facebook.com/LibrairieLecolier"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-social-link"
                title="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://www.instagram.com/librairie__lecolier/"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-social-link"
                title="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* WhatsApp CTA Card */}
          <a
            href="https://wa.me/+21658982121"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-whatsapp-btn no-underline"
          >
            {WA_SVG}
            <span>Discuter en direct sur WhatsApp</span>
          </a>
        </div>

        {/* Right Column: Contact Message Form */}
        <div className="contact-form-panel">
          <h2 className="contact-form-title">Envoyez-nous un Message</h2>
          <p className="text-slate-500 text-xs mb-6">
            Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
          </p>
          
          {isSubmitted && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 mb-6 flex items-center gap-3 text-xs font-semibold">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <span>Votre message a bien été envoyé ! Notre équipe vous répondra très rapidement.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-field">
              <label htmlFor="contact-name">Votre Nom et Prénom *</label>
              <input
                id="contact-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ex: Mohamed Ben Salah"
                className="checkout-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-field">
                <label htmlFor="contact-email">Adresse Email *</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Ex: mohamed@example.com"
                  className="checkout-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="contact-phone">Numéro de Téléphone</label>
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ex: 58 98 21 21"
                  className="checkout-input"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="contact-subject">Objet de votre demande *</label>
              <select
                id="contact-subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="checkout-select"
              >
                <option value="">Sélectionnez un motif</option>
                <option value="commande">Suivi ou question sur une commande</option>
                <option value="produit">Renseignement sur la disponibilité d'un article</option>
                <option value="livraison">Délai ou tarif de livraison</option>
                <option value="partenariat">Devis pour établissement scolaire ou entreprise</option>
                <option value="autre">Autre demande</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="contact-message">Votre Message *</label>
              <textarea
                id="contact-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Expliquez-nous votre demande en quelques lignes..."
                className="checkout-textarea"
              />
            </div>

            <button type="submit" className="btn-primary contact-submit-btn w-full py-3.5 flex items-center justify-center gap-2">
              <Send size={18} />
              <span>Transmettre mon message</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

