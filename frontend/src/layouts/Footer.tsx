import { MapPin, Phone, Mail, ArrowRight, ShieldCheck, Heart } from "lucide-react";

import logoImg from "../assets/logo.png";
import logoBic from "../assets/img/bic-1.jpg";
import logoBomi from "../assets/img/bomi-1.jpg";
import logoLojel from "../assets/img/lojel-1.jpg";
import logoMaped from "../assets/img/maped-1.jpg";
import logoStabilo from "../assets/img/stabilo-1.jpg";
import logoStaedler from "../assets/img/staedler-1.jpg";
import logoUhu from "../assets/img/uhu-1.jpg";
import logoYamama from "../assets/img/yamama-1.jpg";
import { useNavigation } from "../context/AppContext";

const brandLogos = [
  { name: "BIC", img: logoBic },
  { name: "Bomi", img: logoBomi },
  { name: "Lojel", img: logoLojel },
  { name: "Maped", img: logoMaped },
  { name: "Stabilo", img: logoStabilo },
  { name: "Staedler", img: logoStaedler },
  { name: "UHU", img: logoUhu },
  { name: "Yamama", img: logoYamama },
];

const quickLinks = [
  { label: "Accueil", target: "home" },
  { label: "Boutique / Catalogue", target: "category", param: "" },
  { label: "Sacs & Cartables", target: "category", param: "Bomi" },
  { label: "À propos", target: "about" },
  { label: "Contactez-nous", target: "contact" },
  { label: "Mon Panier", target: "cart" },
];

const categories = [
  "Sacs à dos",
  "Cartable Lux",
  "Fournitures scolaire",
  "Stylos & Crayons",
  "Calculatrices",
  "Papeterie",
  "Gourde & Thermos",
];

const WA_SVG = (
  <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

export function Footer() {
  const { navigateTo } = useNavigation();

  return (
    <footer className="site-footer">
      {/* Brand Logos Bar - Infinite Marquee Ticker */}
      <div className="brands-ticker-wrap">
        <div className="brands-ticker-track">
          {[...brandLogos, ...brandLogos, ...brandLogos, ...brandLogos].map((brand, idx) => (
            <div key={`${brand.name}-${idx}`} className="brand-chip-small" title={brand.name}>
              <img src={brand.img} alt={brand.name} className="brand-logo-small" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Footer Container */}
      <div className="footer-main">
        <div className="footer-grid">
          {/* Brand & Mission Column */}
          <div className="footer-col brand-col">
            <div className="footer-brand-row">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("home");
                }}
                className="footer-logo-link"
              >
                <img src={logoImg} alt="Librairie l'Écolier" className="footer-logo" />
              </a>
            </div>
            <p className="footer-tagline">
              Votre référence incontournable pour les fournitures scolaires, cartables haut de gamme et matériel de bureau en Tunisie.
            </p>
            <div className="footer-trust-badge">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Garantie Qualité & Authenticité 100%</span>
            </div>
            <div className="footer-social">
              <a href="https://www.facebook.com/LibrairieLecolier" target="_blank" rel="noopener noreferrer" className="footer-social-link" title="Facebook">
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/librairie__lecolier/" target="_blank" rel="noopener noreferrer" className="footer-social-link" title="Instagram">
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path fill="#071845" d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="#071845" strokeWidth="2" />
                </svg>
              </a>
              <a href="https://www.tiktok.com/@librairie_lecolier" target="_blank" rel="noopener noreferrer" className="footer-social-link" title="TikTok">
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.23 8.23 0 0 0 4.83 1.54V7.15a4.84 4.84 0 0 1-1.06-.46z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="footer-col">
            <h4 className="footer-heading">Navigation</h4>
            <ul className="footer-links">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo(link.target, link.param);
                    }}
                    className="footer-link"
                  >
                    <ArrowRight size={12} className="footer-arrow" />
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Top Categories Column */}
          <div className="footer-col">
            <h4 className="footer-heading">Nos Rayons</h4>
            <ul className="footer-links">
              {categories.map((cat) => (
                <li key={cat}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo("category", cat);
                    }}
                    className="footer-link"
                  >
                    <ArrowRight size={12} className="footer-arrow" />
                    <span>{cat}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Store Info Column */}
          <div className="footer-col contact-col">
            <h4 className="footer-heading">Notre Boutique</h4>
            <ul className="footer-contact-list">
              <li className="footer-contact-item">
                <MapPin size={16} className="footer-contact-icon" />
                <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="footer-contact-text hover:text-white">
                  11 Avenue Mongi Slim, L'Aouina, Tunis
                </a>
              </li>
              <li className="footer-contact-item">
                <Phone size={16} className="footer-contact-icon" />
                <a href="tel:+21658982121" className="footer-contact-text hover:text-white">
                  +216 58 98 21 21
                </a>
              </li>
              <li className="footer-contact-item">
                <Mail size={16} className="footer-contact-icon" />
                <a href="mailto:ecolier.librairie@gmail.com" className="footer-contact-text hover:text-white">
                  ecolier.librairie@gmail.com
                </a>
              </li>
            </ul>
            <a href="https://wa.me/+21658982121" className="footer-whatsapp" target="_blank" rel="noopener noreferrer">
              {WA_SVG}
              <span>Assistance WhatsApp Express</span>
            </a>
          </div>
        </div>
      </div>

      {/* Copyright & Legal Links Bar */}
      <div className="footer-copyright">
        <div className="footer-copyright-inner">
          <p className="footer-copy-text">
            © 2026 <strong>Librairie l'Écolier</strong>. Tous droits réservés.
          </p>
          <div className="footer-legal-links">
            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo("terms"); }} className="footer-legal-link">
              Conditions Générales de Vente
            </a>
            <span className="footer-legal-separator">•</span>
            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo("privacy"); }} className="footer-legal-link">
              Politique de Confidentialité
            </a>
            <span className="footer-legal-separator">•</span>
            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo("contact"); }} className="footer-legal-link">
              Support Client
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}