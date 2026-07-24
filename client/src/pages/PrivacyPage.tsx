import { Shield, Lock } from "lucide-react";
import { useNavigation } from "../context/AppContext";

export function PrivacyPage() {
  const { navigateTo } = useNavigation();

  return (
    <div className="page-section">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigateTo("home")}>Accueil</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">Politique de Confidentialité</span>
      </div>

      {/* Hero Section */}
      <div className="legal-hero">
        <Shield size={48} className="legal-icon" />
        <h1 className="legal-title">Politique de Confidentialité</h1>
        <p className="legal-subtitle">
          Dernière mise à jour: Juillet 2026
        </p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2 className="legal-section-title">1. Collecte des Données</h2>
          <p className="legal-text">
            Librairie l'Écolier collecte les données personnelles suivantes lors de votre commande :
          </p>
          <ul className="legal-list">
            <li>Nom et prénom</li>
            <li>Adresse email</li>
            <li>Numéro de téléphone</li>
            <li>Adresse de livraison</li>
            <li>Gouvernorat</li>
          </ul>
          <p className="legal-text">
            Ces données sont nécessaires au traitement de votre commande et à la livraison des produits.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">2. Utilisation des Données</h2>
          <p className="legal-text">
            Vos données personnelles sont utilisées exclusivement pour :
          </p>
          <ul className="legal-list">
            <li>Traiter et confirmer vos commandes</li>
            <li>Organiser la livraison de vos produits</li>
            <li>Vous contacter en cas de problème avec votre commande</li>
            <li>Améliorer nos services et votre expérience client</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">3. Protection des Données</h2>
          <p className="legal-text">
            Nous mettons en œuvre toutes les mesures techniques et organisationnelles appropriées 
            pour protéger vos données personnelles contre tout accès non autorisé, modification, 
            divulgation ou destruction.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">4. Partage des Données</h2>
          <p className="legal-text">
            Vos données personnelles ne sont pas vendues, louées ou partagées avec des tiers à des fins 
            commerciales. Nous ne partageons vos données qu'avec :
          </p>
          <ul className="legal-list">
            <li>Les partenaires de livraison nécessaires à l'acheminement de votre commande</li>
            <li>Les autorités compétentes en cas d'obligation légale</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">5. Conservation des Données</h2>
          <p className="legal-text">
            Vos données personnelles sont conservées pendant la durée nécessaire au traitement de votre 
            commande et pendant une période de 3 ans après votre dernière commande, conformément aux 
            obligations légales en Tunisie.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">6. Vos Droits</h2>
          <p className="legal-text">
            Conformément à la législation tunisienne sur la protection des données personnelles, 
            vous disposez des droits suivants :
          </p>
          <ul className="legal-list">
            <li>Droit d'accès à vos données personnelles</li>
            <li>Droit de rectification des données inexactes</li>
            <li>Droit à l'effacement de vos données (dans certaines conditions)</li>
            <li>Droit d'opposition au traitement de vos données</li>
            <li>Droit à la portabilité de vos données</li>
          </ul>
          <p className="legal-text">
            Pour exercer ces droits, vous pouvez nous contacter par email à ecolier.librairie@gmail.com
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">7. Cookies</h2>
          <p className="legal-text">
            Notre site utilise des cookies pour améliorer votre expérience de navigation. Les cookies 
            sont de petits fichiers stockés sur votre appareil qui nous permettent de :
          </p>
          <ul className="legal-list">
            <li>Mémoriser vos préférences</li>
            <li>Analyser le trafic du site</li>
            <li>Personnaliser le contenu</li>
          </ul>
          <p className="legal-text">
            Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut affecter 
            certaines fonctionnalités du site.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">8. Modifications</h2>
          <p className="legal-text">
            Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
            Les modifications seront publiées sur cette page avec la date de mise à jour.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">9. Contact</h2>
          <p className="legal-text">
            Pour toute question concernant notre politique de confidentialité ou l'utilisation de vos 
            données personnelles, vous pouvez nous contacter :
          </p>
          <ul className="legal-list">
            <li>Par email: ecolier.librairie@gmail.com</li>
            <li>Par téléphone: +216 58 98 21 21</li>
            <li>Par courrier: 11 Avenue Mongi Slim l'Aouina, Tunisie</li>
          </ul>
        </section>
      </div>

      <div className="legal-cta">
        <Lock size={24} className="legal-cta-icon" />
        <p className="legal-cta-text">
          Vos données sont protégées et ne seront jamais partagées sans votre consentement.
        </p>
      </div>
    </div>
  );
}
