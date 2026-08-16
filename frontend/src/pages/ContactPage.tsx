import { useState } from "react";
import { MapPin, Phone, Mail, Send, Clock, Facebook, Instagram, MessageCircle } from "lucide-react";
import { useNavigation } from "../context/AppContext";

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
    // Here you would typically send the form data to your backend
    console.log("Form submitted:", formData);
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="page-section">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigateTo("home")}>Accueil</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">Contact</span>
      </div>

      {/* Hero Section */}
      <div className="contact-hero">
        <h1 className="contact-title">Contactez-nous</h1>
        <p className="contact-subtitle">
          Notre équipe est à votre disposition pour répondre à toutes vos questions
        </p>
      </div>

      <div className="contact-layout">
        {/* Contact Info */}
        <div className="contact-info-panel">
          <h2 className="contact-info-title">Nos Coordonnées</h2>
          
          <div className="contact-info-item">
            <MapPin size={24} className="contact-info-icon" />
            <div>
              <h4 className="contact-info-label">Adresse</h4>
              <p className="contact-info-value">11 Avenue Mongi Slim l'Aouina</p>
              <p className="contact-info-value">Tunisie</p>
            </div>
          </div>

          <div className="contact-info-item">
            <Phone size={24} className="contact-info-icon" />
            <div>
              <h4 className="contact-info-label">Téléphone</h4>
              <p className="contact-info-value">+216 58 98 21 21</p>
            </div>
          </div>

          <div className="contact-info-item">
            <Mail size={24} className="contact-info-icon" />
            <div>
              <h4 className="contact-info-label">Email</h4>
              <p className="contact-info-value">ecolier.librairie@gmail.com</p>
            </div>
          </div>

          <div className="contact-info-item">
            <Clock size={24} className="contact-info-icon" />
            <div>
              <h4 className="contact-info-label">Horaires</h4>
              <p className="contact-info-value">7/7j ,08:00-00:00</p>
            </div>
          </div>

          {/* Social Links */}
          <div className="contact-social">
            <h3 className="contact-social-title">Suivez-nous</h3>
            <div className="contact-social-links">
              <a
                href="https://www.facebook.com/LibrairieLecolier"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-social-link"
              >
                <Facebook size={24} />
              </a>
              <a
                href="https://www.instagram.com/librairie_lecolier/"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-social-link"
              >
                <Instagram size={24} />
              </a>
              <a
                href="https://www.tiktok.com/@librairie_lecolier"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-social-link"
              >
                <MessageCircle size={24} />
              </a>
            </div>
          </div>

          {/* WhatsApp CTA */}
          <a
            href="https://wa.me/+21658982121"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-whatsapp-btn"
          >
            <MessageCircle size={20} />
            Contactez-nous sur WhatsApp
          </a>
        </div>

        {/* Contact Form */}
        <div className="contact-form-panel">
          <h2 className="contact-form-title">Envoyez-nous un message</h2>
          
          {isSubmitted && (
            <div className="contact-success-message">
              Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
            </div>
          )}

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-field">
              <label htmlFor="contact-name">Nom complet *</label>
              <input
                id="contact-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ex: Mohamed Ali"
              />
            </div>

            <div className="form-field">
              <label htmlFor="contact-email">Email *</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Ex: mohamed.ali@example.com"
              />
            </div>

            <div className="form-field">
              <label htmlFor="contact-phone">Téléphone</label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ex: +216 12 345 678"
              />
            </div>

            <div className="form-field">
              <label htmlFor="contact-subject">Sujet *</label>
              <select
                id="contact-subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez un sujet</option>
                <option value="commande">Question sur une commande</option>
                <option value="produit">Information sur un produit</option>
                <option value="livraison">Question sur la livraison</option>
                <option value="partenariat">Proposition de partenariat</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="contact-message">Message *</label>
              <textarea
                id="contact-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Écrivez votre message ici..."
              />
            </div>

            <button type="submit" className="btn-primary contact-submit-btn">
              <Send size={18} />
              Envoyer le message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
