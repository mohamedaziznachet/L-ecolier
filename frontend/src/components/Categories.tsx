import { useState, useEffect } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { ResponsiveImage } from "../utils/ResponsiveImage";
import { useNavigation } from "../context/AppContext";
import { useLayout } from "../context/LayoutContext";
import { getCategories, getProducts } from "../services/api";

const CATEGORY_IMAGES: Record<string, string> = {
  "Sacs à dos": "https://images.unsplash.com/photo-1726726192148-af52008ff663?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "Stylos & Crayons": "https://images.unsplash.com/photo-1568205612837-017257d2310a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "Fournitures scolaire": "https://images.unsplash.com/photo-1779684998897-ce5de594a5ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "Calculatrices": "https://images.unsplash.com/photo-1574607383077-47ddc2dc51c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "Cahiers & Classeurs": "https://images.unsplash.com/photo-1722929309984-c6b3e55dd6e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "Matériel artistique": "https://images.unsplash.com/photo-1615988938302-bd2a5a7023bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "Cartable Lux": "https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "Trousse": "https://images.unsplash.com/photo-1615988938302-bd2a5a7023bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1779684998897-ce5de594a5ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400";
const COLORS = ["#0d2b6b", "#e53935", "#f59e0b", "#059669", "#7c3aed", "#db2777", "#0284c7", "#ea580c"];

export function Categories() {
  const { navigateTo } = useNavigation();
  const { layout } = useLayout();
  const [categoriesList, setCategoriesList] = useState<{ label: string; count: number | string; img: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const [cats, products] = await Promise.all([getCategories(), getProducts()]);
        if (isCancelled) return;

        const categoryImagesMap = layout["category_images"] || {};

        if (Array.isArray(layout["home_categories"]) && layout["home_categories"].length > 0) {
          const customMapped = layout["home_categories"].map((item: any, idx: number) => {
            const label = item.label || item.name || item;
            const count = products.filter((p) => (p.category || "").toLowerCase() === label.toLowerCase()).length;
            const foundImg = products.find((p) => (p.category || "").toLowerCase() === label.toLowerCase())?.img;
            const customImg = categoryImagesMap[label] || item.img;
            return {
              label,
              count: count > 0 ? `${count} article(s)` : "Découvrir",
              img: customImg || foundImg || CATEGORY_IMAGES[label] || DEFAULT_IMAGE,
              color: item.color || COLORS[idx % COLORS.length],
            };
          });
          setCategoriesList(customMapped);
          return;
        }

        const listToUse = cats && cats.length > 0 ? cats : [
          "Sacs à dos", "Stylos & Crayons", "Fournitures scolaire",
          "Calculatrices", "Cahiers & Classeurs", "Matériel artistique"
        ];

        const mapped = listToUse.slice(0, 8).map((catName, idx) => {
          const count = products.filter((p) => (p.category || "").toLowerCase() === catName.toLowerCase()).length;
          const foundImg = products.find((p) => (p.category || "").toLowerCase() === catName.toLowerCase())?.img;
          const customImg = categoryImagesMap[catName];
          return {
            label: catName,
            count: count > 0 ? `${count} article(s)` : "Découvrir",
            img: customImg || foundImg || CATEGORY_IMAGES[catName] || DEFAULT_IMAGE,
            color: COLORS[idx % COLORS.length],
          };
        });

        setCategoriesList(mapped);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [layout]);

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="section-title">Nos Catégories Phares</h2>
          </div>
          <div className="section-underline" />
        </div>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateTo("category", "");
          }}
          className="section-link group"
        >
          <span>Voir toutes les catégories</span>
          <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      {loading ? (
        <div className="categories-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="category-card-skeleton animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="categories-grid">
          {categoriesList.map((cat, idx) => (
            <a
              key={`${cat.label}-${idx}`}
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
                <span className="category-count-badge">{cat.count}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

