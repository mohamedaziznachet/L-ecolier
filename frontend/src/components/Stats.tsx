import { Package, Users, Truck, Headphones, ShieldCheck, Sparkles } from "lucide-react";

const stats = [
  { icon: Package,    value: "+8 000",  label: "Articles en Stock",     desc: "Fournitures, livres & bagagerie", color: "#0d2b6b", bg: "#eff6ff" },
  { icon: Users,      value: "+10 000", label: "Clients Heureux",       desc: "Parents, élèves & enseignants", color: "#e11d48", bg: "#fff1f2" },
  { icon: Truck,      value: "24-48h",  label: "Livraison Partout en Tunisie", desc: "Expédition rapide & soignée",   color: "#059669", bg: "#f0fdf4" },
  { icon: Headphones, value: "7j / 7",  label: "Support WhatsApp",      desc: "Conseils & prise de commande", color: "#d97706", bg: "#fffbeb" },
];

export function Stats() {
  return (
    <section className="stats-section">
      <div className="stats-inner">
        <div className="stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="stat-card group">
              <div
                className="stat-icon-wrapper"
                style={{ backgroundColor: s.bg, color: s.color }}
              >
                <s.icon size={26} className="transition-transform group-hover:scale-110" />
              </div>
              <div className="stat-info-content">
                <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
                <span className="stat-label">{s.label}</span>
                <span className="stat-desc">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

