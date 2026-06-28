import { ChevronRight } from "lucide-react";
import { ResponsiveImage } from "./utils/ResponsiveImage";

const categories = [
  { id: 1, label: "Sacs à dos",           count: "120+ articles", color: "#1a4299", img: "https://images.unsplash.com/photo-1726726192148-af52008ff663?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxzY2hvb2wlMjBzdXBwbGllcyUyMGJhY2twYWNrJTIwc3RhdGlvbmVyeXxlbnwxfHx8fDE3ODIyMTM5NTR8MA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 2, label: "Stylos & Crayons",     count: "200+ articles", color: "#e53935", img: "https://images.unsplash.com/photo-1568205612837-017257d2310a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2hvb2wlMjBub3RlYm9va3MlMjBwZW5jaWxzJTIwZGVza3xlbnwxfHx8fDE3ODIyMTM5NTR8MA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 3, label: "Fournitures scolaires",count: "350+ articles", color: "#f59e0b", img: "https://images.unsplash.com/photo-1779684998897-ce5de594a5ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxzY2hvb2wlMjBub3RlYm9va3MlMjBwZW5jaWxzJTIwZGVza3xlbnwxfHx8fDE3ODIyMTM5NTR8MA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 4, label: "Calculatrices",        count: "30+ articles",  color: "#059669", img: "https://images.unsplash.com/photo-1574607383077-47ddc2dc51c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxjYWxjdWxhdG9yJTIwc2NpZW50aWZpYyUyMHN0dWRlbnR8ZW58MXx8fHwxNzgyMjEzOTU5fDA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 5, label: "Cahiers & Classeurs",  count: "180+ articles", color: "#7c3aed", img: "https://images.unsplash.com/photo-1722929309984-c6b3e55dd6e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxzY2hvb2wlMjBub3RlYm9va3MlMjBwZW5jaWxzJTIwZGVza3xlbnwxfHx8fDE3ODIyMTM5NTR8MA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 6, label: "Matériel artistique",  count: "90+ articles",  color: "#db2777", img: "https://images.unsplash.com/photo-1615988938302-bd2a5a7023bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxzY2hvb2wlMjBzdXBwbGllcyUyMGJhY2twYWNrJTIwc3RhdGlvbmVyeXxlbnwxfHx8fDE3ODIyMTM5NTR8MA&ixlib=rb-4.1.0&q=80&w=400" },
];
import { useNavigation } from "../context/AppContext";

export function Categories() {
  const { navigateTo } = useNavigation();

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Catégories</h2>
          <div className="section-underline" />
        </div>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateTo("category", "Sacs à dos");
          }}
          className="section-link"
        >
          Voir toutes <ChevronRight size={14} />
        </a>
      </div>

      <div className="categories-grid">
        {categories.map((cat) => (
          <a
            key={cat.id}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("category", cat.label);
            }}
            className="category-card"
          >
            <div className="category-img-wrap">
              <ResponsiveImage src={cat.img} alt={cat.label} className="category-img" />
              <div className="category-color-overlay" style={{ backgroundColor: cat.color }} />
              <div className="category-gradient-overlay" />
            </div>
            <div className="category-info">
              <p className="category-name">{cat.label}</p>
              <p className="category-count">{cat.count}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
