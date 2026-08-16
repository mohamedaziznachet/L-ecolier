import { Heart, Award, Users, Target, MapPin, Phone, Mail } from "lucide-react";
import { useNavigation } from "../context/AppContext";
import Seo from '../components/common/Seo';
export function AboutPage() {
  const { navigateTo } = useNavigation();

  return (
    <div className="page-section">
        <Seo title="À propos – L’Écolier" description="Learn about our story, values, and mission." />
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigateTo("home")}>Accueil</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">À propos</span>
      </div>

      {/* Hero Section */}
      <div className="about-hero">
        <h1 className="about-title">À propos de Librairie l'Écolier</h1>
        <p className="about-subtitle">
          Votre partenaire de confiance pour toutes vos fournitures scolaires et de bureau en Tunisie
        </p>
      </div>

      {/* Our Story */}
      <div className="about-section">
        <div className="about-content">
          <h2 className="section-title">Notre Histoire</h2>
          <div className="section-underline" />
          <p className="about-text">
            Fondée avec la passion de l'éducation, Librairie l'Écolier s'est rapidement imposée comme une référence 
            dans le domaine des fournitures scolaires et de bureau en Tunisie. Notre mission est d'accompagner 
            chaque étudiant, chaque professionnel dans leur parcours de réussite en leur offrant des produits 
            de qualité à des prix accessibles.
          </p>
          <p className="about-text">
            Située au cœur de l'Aouina, notre boutique accueille quotidiennement des centaines de clients 
            qui nous font confiance pour leurs achats scolaires et professionnels.
          </p>
        </div>
      </div>

      {/* Our Values */}
      <div className="about-section">
        <h2 className="section-title">Nos Valeurs</h2>
        <div className="section-underline" />
        <div className="values-grid">
          <div className="value-card">
            <Heart size={40} className="value-icon" />
            <h3 className="value-title">Passion</h3>
            <p className="value-description">
              Nous mettons notre cœur à sélectionner les meilleurs produits pour nos clients.
            </p>
          </div>
          <div className="value-card">
            <Award size={40} className="value-icon" />
            <h3 className="value-title">Qualité</h3>
            <p className="value-description">
              Nous travaillons uniquement avec des marques reconnues pour garantir la qualité.
            </p>
          </div>
          <div className="value-card">
            <Users size={40} className="value-icon" />
            <h3 className="value-title">Service</h3>
            <p className="value-description">
              Notre équipe est dédiée à offrir un service client exceptionnel.
            </p>
          </div>
          <div className="value-card">
            <Target size={40} className="value-icon" />
            <h3 className="value-title">Engagement</h3>
            <p className="value-description">
              Nous nous engageons à offrir les meilleurs prix du marché.
            </p>
          </div>
        </div>
      </div>

      {/* Our Partners */}
      <div className="about-section">
        <h2 className="section-title">Nos Partenaires</h2>
        <div className="section-underline" />
        <p className="about-text">
          Nous sommes fiers de collaborer avec les meilleures marques internationales pour vous offrir 
          une sélection de produits de qualité supérieure.
        </p>
        <div className="partners-list">
          <span className="partner-badge">BIC</span>
          <span className="partner-badge">Bomi</span>
          <span className="partner-badge">Lojel</span>
          <span className="partner-badge">Maped</span>
          <span className="partner-badge">Stabilo</span>
          <span className="partner-badge">Staedler</span>
          <span className="partner-badge">UHU</span>
          <span className="partner-badge">Yamama</span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="about-section">
        <h2 className="section-title">Nous Contacter</h2>
        <div className="section-underline" />
        <div className="contact-grid">
          <div className="contact-item">
            <MapPin size={24} className="contact-icon" />
            <div>
              <h4 className="contact-label">Adresse</h4>
              <p className="contact-value">11 Avenue Mongi Slim l'Aouina, Tunisie</p>
            </div>
          </div>
          <div className="contact-item">
            <Phone size={24} className="contact-icon" />
            <div>
              <h4 className="contact-label">Téléphone</h4>
              <p className="contact-value">+216 58 98 21 21</p>
            </div>
          </div>
          <div className="contact-item">
            <Mail size={24} className="contact-icon" />
            <div>
              <h4 className="contact-label">Email</h4>
              <p className="contact-value">ecolier.librairie@gmail.com</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigateTo("contact")}
          className="btn-primary"
          style={{ marginTop: "2rem" }}
        >
          Nous envoyer un message
        </button>
      </div>
    </div>
  );
}
