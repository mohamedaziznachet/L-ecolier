import { Star, Quote } from "lucide-react";

const testimonials = [
  { id: 1, name: "Amira B.",   location: "Tunis",  rating: 5, avatar: "A", avatarColor: "#0d2b6b", text: "Excellent service ! Livraison rapide et produits de très bonne qualité. Je recommande vivement Librairie l'Écolier pour la rentrée scolaire." },
  { id: 2, name: "Mohamed K.", location: "Sfax",   rating: 5, avatar: "M", avatarColor: "#e53935", text: "Commande passée le soir, reçue le lendemain. Les fournitures sont exactement comme sur les photos. Très satisfait !" },
  { id: 3, name: "Fatma T.",   location: "Sousse", rating: 4, avatar: "F", avatarColor: "#059669", text: "Très bonne sélection de produits et prix compétitifs. Le paiement à la livraison est très pratique. Je reviendrai !" },
];

export function Testimonials() {
  return (
    <section className="page-section">
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 className="section-title">Nos clients témoignent</h2>
        <div className="section-underline" />
      </div>

      <div className="testimonials-grid">
        {testimonials.map((t) => (
          <div key={t.id} className="testimonial-card">
            <Quote size={24} className="testimonial-quote" />

            <div className="testimonial-stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={13} fill={i < t.rating ? "#fbbf24" : "#e5e7eb"} stroke="none" />
              ))}
            </div>

            <p className="testimonial-text">"{t.text}"</p>

            <div className="testimonial-author">
              <div className="testimonial-avatar" style={{ backgroundColor: t.avatarColor }}>
                {t.avatar}
              </div>
              <div>
                <p className="testimonial-name">{t.name}</p>
                <p className="testimonial-location">{t.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
