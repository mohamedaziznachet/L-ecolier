import { Star, Quote, CheckCircle2 } from "lucide-react";

const testimonials = [
  { id: 1, name: "Amira B.",   location: "Tunis",  rating: 5, avatar: "A", avatarColor: "#0d2b6b", text: "Excellent service ! Livraison rapide et produits de très bonne qualité. Je recommande vivement Librairie l'Écolier pour toute la rentrée scolaire de mes enfants." },
  { id: 2, name: "Mohamed K.", location: "Sfax",   rating: 5, avatar: "M", avatarColor: "#e11d48", text: "Commande passée le soir, reçue en 24h bien emballée. Les cartables et fournitures sont 100% originaux et conformes. Vraiment satisfait !" },
  { id: 3, name: "Fatma T.",   location: "Sousse", rating: 5, avatar: "F", avatarColor: "#059669", text: "Très large choix d'articles scolaires et prix très compétitifs. Le paiement en cash à la livraison est ultra pratique. Je repasserai commande !" },
  { id: 4, name: "Ranim B.",   location: "Ariana", rating: 5, avatar: "R", avatarColor: "#7c3aed", text: "Ya3tikom saha service tayara w les produits de très haute qualité. Équipe très réactive sur WhatsApp !" },
  { id: 5, name: "Ahmed G.",   location: "Kairouan", rating: 5, avatar: "A", avatarColor: "#d97706", text: "Kol mara nzid net2ked ely hedhi a7sen librairie en ligne en Tunisie. Bravo pour le professionnalisme !" },
];

export function Testimonials() {
  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="section-title">Avis de Nos Clients</h2>
          </div>
          <div className="section-underline" />
        </div>
      </div>

      <div className="testimonials-grid">
        {testimonials.map((t) => (
          <div key={t.id} className="testimonial-card group">
            <div className="flex items-center justify-between mb-3">
              <div className="testimonial-stars flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={15} fill={i < t.rating ? "currentColor" : "none"} stroke="currentColor" />
                ))}
              </div>
              <Quote size={20} className="testimonial-quote text-slate-300 transition-colors group-hover:text-amber-400" />
            </div>

            <p className="testimonial-text">"{t.text}"</p>

            <div className="testimonial-author mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="testimonial-avatar" style={{ backgroundColor: t.avatarColor }}>
                  {t.avatar}
                </div>
                <div>
                  <p className="testimonial-name font-bold text-slate-800 text-sm">{t.name}</p>
                  <p className="testimonial-location text-xs text-slate-400">{t.location}, Tunisie</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={12} />
                <span>Achat vérifié</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

