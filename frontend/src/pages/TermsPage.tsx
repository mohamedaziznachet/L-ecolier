import { FileText, AlertCircle } from "lucide-react";
import { useNavigation } from "../context/AppContext";

export function TermsPage() {
  const { navigateTo } = useNavigation();

  return (
    <div className="page-section">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigateTo("home")}>Accueil</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">Conditions Générales</span>
      </div>

      {/* Hero Section */}
      <div className="legal-hero">
        <FileText size={48} className="legal-icon" />
        <h1 className="legal-title">Conditions Générales de Vente</h1>
        <p className="legal-subtitle">
          Dernière mise à jour: Juillet 2026
        </p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2 className="legal-section-title">1. Introduction</h2>
          <p className="legal-text">
            Les présentes conditions générales de vente régissent la vente des produits proposés par 
            Librairie l'Écolier sur son site web. En passant commande sur notre site, vous acceptez 
            sans ré ces conditions générales de vente.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">2. Produits</h2>
          <p className="legal-text">
            Tous les produits proposés à la vente sont décrits et présentés avec la plus grande exactitude possible. 
            Cependant, si des erreurs ou omissions n'ont pu être évitées, notre responsabilité ne pourra être engagée. 
            Les photos des produits ne sont pas contractuelles.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">3. Commandes</h2>
          <p className="legal-text">
            Toute commande passée sur notre site constitue une offre d'achat ferme et définitive. 
            La validation de votre commande intervient après confirmation de disponibilité des produits 
            et acceptation de votre commande par nos services. Les clients disposent du droit d'annuler 
            leur commande directement depuis leur espace client tant que son statut reste "En attente".
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">4. Prix</h2>
          <p className="legal-text">
            Les prix de nos produits sont indiqués en dinars tunisiens (DT) toutes taxes comprises. 
            Nous nous réservons le droit de modifier nos prix à tout moment, mais le produit sera facturé 
            sur la base du prix en vigueur au moment de la validation de votre commande.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">5. Paiement</h2>
          <p className="legal-text">
            Le paiement s'effectue exclusivement en cash à la livraison. Aucun paiement en ligne 
            n'est actuellement disponible sur notre site.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">6. Livraison</h2>
          <p className="legal-text">
            La livraison est effectuée dans toute la Tunisie. Les délais de livraison sont généralement 
            de 24 à 48 heures après validation de votre commande. Les frais de livraison sont fixés à un 
            tarif unique de 7,000 DT pour toute commande.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">7. Retours et Réclamations</h2>
          <p className="legal-text">
            En cas de produit défectueux ou non conforme, vous disposez d'un délai de 7 jours à compter 
            de la réception pour nous contacter et effectuer un retour. Les produits doivent être retournés 
            dans leur état d'origine et emballage d'origine.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">8. Données Personnelles</h2>
          <p className="legal-text">
            Les informations personnelles collectées lors de votre commande sont nécessaires au traitement 
            de celle-ci et à la livraison. Elles sont conservées conformément à notre politique de 
            confidentialité et ne sont pas transmises à des tiers.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">9. Propriété Intellectuelle</h2>
          <p className="legal-text">
            Tous les éléments du site (textes, images, vidéos, logos) sont la propriété exclusive de 
            Librairie l'Écolier. Toute reproduction, même partielle, est interdite sans autorisation préalable.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">10. Litiges</h2>
          <p className="legal-text">
            En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, 
            le tribunal compétent sera celui du siège social de Librairie l'Écolier.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">11. Contact</h2>
          <p className="legal-text">
            Pour toute question relative aux présentes conditions générales, vous pouvez nous contacter :
          </p>
          <ul className="legal-list">
            <li>Par email: ecolier.librairie@gmail.com</li>
            <li>Par téléphone: +216 58 98 21 21</li>
            <li>Par courrier: 11 Avenue Mongi Slim l'Aouina, Tunisie</li>
          </ul>
        </section>
      </div>

      <div className="legal-cta">
        <AlertCircle size={24} className="legal-cta-icon" />
        <p className="legal-cta-text">
          En passant commande, vous déclarez avoir lu et accepté ces conditions générales de vente.
        </p>
      </div>
    </div>
  );
}
