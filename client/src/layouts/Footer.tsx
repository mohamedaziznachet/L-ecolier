import { MapPin, Phone, Mail } from "lucide-react";

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
const quickLinks = ["Accueil", "Boutique", "Promotions", "À propos", "Contact", "Panier"];
const categories = ["Sacs à dos", "Cahiers & Classeurs", "Stylos & Crayons", "Calculatrices", "Matériel artistique", "Papeterie"];
const WA_SVG = (
  <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);
export function Footer() {
  const { navigateTo } = useNavigation();
  return (
    <footer>
      {/* Brand logos bar - Infinite Marquee Ticker */}
      <div className="brands-ticker-wrap">
        <div className="brands-ticker-track">
          {[...brandLogos, ...brandLogos, ...brandLogos, ...brandLogos].map((brand, idx) => (
            <div key={`${brand.name}-${idx}`} className="brand-chip-small">
              <img src={brand.img} alt={brand.name} className="brand-logo-small" />
            </div>
          ))}
        </div>
      </div>
      {/* Main footer */}
      <div className="footer-main">
        <div className="footer-grid">
          {/* Brand column */}
          <div>
            <div className="footer-brand-row">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("home");
                }}
              >
                <img src={logoImg} alt="Librairie l'Écolier" className="footer-logo" />
              </a>
            </div>
            <p className="footer-tagline">
              Votre partenaire de confiance pour toutes vos fournitures scolaires et de bureau en Tunisie.
            </p>
            <div className="footer-social">
              <a href="https://www.facebook.com/LibrairieLecolier" target="_blank" rel="noopener noreferrer" className="footer-social-link">f</a>
              <a href="https://www.instagram.com/librairie_lecolier/" target="_blank" rel="noopener noreferrer" className="footer-social-link">ig</a>
              <a href="https://www.tiktok.com/@librairie_lecolier" target="_blank" rel="noopener noreferrer" className="footer-social-link">tt</a>
            </div>
          </div>
          {/* Quick links */}
          <div>
            <h4 className="footer-heading">Liens rapides</h4>
            <ul className="footer-links">
              {quickLinks.map((link) => (
                <li key={link}>
                  <a href="#" onClick={(e) => {
                      e.preventDefault();
                      if (link === "Accueil") {
                        navigateTo("home");
                      } else if (link === "Panier") {
                        navigateTo("cart");
                      } else if (link === "Boutique") {
                        navigateTo("category", "Sacs à dos");
                      } else if (link === "Promotions") {
                        navigateTo("promotions");
                      } else if (link === "À propos") {
                        navigateTo("about");
                      } else if (link === "Contact") {
                        navigateTo("contact");
                      }
                    }}
                    className="footer-link"
                  >
                    → {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="footer-heading">Catégories</h4>
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
                    → {cat}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="footer-heading">Notre boutique</h4>
            <ul className="footer-contact-list">
              <li className="footer-contact-item">
                <MapPin size={13} className="footer-contact-icon" />
                <span className="footer-contact-text">11 Avenue Mongi Slim l'Aouina</span>
              </li>
              <li className="footer-contact-item">
                <Phone size={13} className="footer-contact-icon" />
                <span className="footer-contact-text">+216 58 98 21 21</span>
              </li>
              <li className="footer-contact-item">
                <Mail size={13} className="footer-contact-icon" />
                <span className="footer-contact-text">ecolier.librairie@gmail.com</span>
              </li>
            </ul>
            <a href="https://wa.me/+21658982121" className="footer-whatsapp">
              {WA_SVG}
              Contact WhatsApp
            </a>
          </div>

        </div>
      </div>

      {/* Copyright */}
      <div className="footer-copyright">
        <p> © 2026 Med Aziz Nachet – Tous droits réservés | Tunisie </p>
        <div className="footer-legal-links">
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo("terms"); }} className="footer-legal-link">Conditions Générales</a>
          <span className="footer-legal-separator">|</span>
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo("privacy"); }} className="footer-legal-link">Politique de Confidentialité</a>
        </div>
      </div>
    </footer>
  );
}