import { Package, Users, Truck, Headphones } from "lucide-react";

const stats = [
  { icon: Package,    value: "1 100",   label: "Produits disponibles", color: "#0d2b6b" },
  { icon: Users,      value: "10 000+", label: "Clients satisfaits",   color: "#e53935" },
  { icon: Truck,      value: "48h",     label: "Délai de livraison",   color: "#059669" },
  { icon: Headphones, value: "24/7",    label: "Support client",       color: "#f59e0b" },
];

export function Stats() {
  return (
    <section className="stats-section">
      <div className="stats-inner">
        <div className="stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div
                className="stat-icon"
                style={{ backgroundColor: `${s.color}18`, color: s.color }}
              >
                <s.icon size={22} />
              </div>
              <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
