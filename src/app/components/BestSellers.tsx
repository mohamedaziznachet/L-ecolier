import { useState } from "react";
import { ShoppingCart, Eye, Heart, Star, ChevronRight } from "lucide-react";
import { ResponsiveImage } from "./utils/ResponsiveImage";
import { useCart } from "../context/AppContext";

const products = [
  { id: 1, name: "Cahier scolaire 200 pages",    price: "1,800 DT",  priceNum: 1.8,  oldPrice: "2,200 DT", badge: "-18%",   badgeColor: "#e53935", rating: 4.8, reviews: 124, img: "https://images.unsplash.com/photo-1722929309984-c6b3e55dd6e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxzY2hvb2wlMjBub3RlYm9va3MlMjBwZW5jaWxzJTIwZGVza3xlbnwxfHx8fDE3ODIyMTM5NTR8MA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 2, name: "Plumier scolaire complet",     price: "12,500 DT", priceNum: 12.5, oldPrice: "15,000 DT",badge: "-17%",   badgeColor: "#e53935", rating: 4.9, reviews: 89,  img: "https://images.unsplash.com/photo-1615988938302-bd2a5a7023bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxzY2hvb2wlMjBzdXBwbGllcyUyMGJhY2twYWNrJTIwc3RhdGlvbmVyeXxlbnwxfHx8fDE3ODIyMTM5NTR8MA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 3, name: "Classeur A4 polypropylène",    price: "4,000 DT",  priceNum: 4.0,  oldPrice: null,        badge: "Nouveau",badgeColor: "#0d2b6b", rating: 4.7, reviews: 56,  img: "https://images.unsplash.com/photo-1779684998897-ce5de594a5ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxzY2hvb2wlMjBub3RlYm9va3MlMjBwZW5jaWxzJTIwZGVza3xlbnwxfHx8fDE3ODIyMTM5NTR8MA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 4, name: "Boîte de crayons de couleur",  price: "8,500 DT",  priceNum: 8.5,  oldPrice: "10,000 DT",badge: "-15%",   badgeColor: "#e53935", rating: 4.6, reviews: 203, img: "https://images.unsplash.com/photo-1568205612837-017257d2310a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2hvb2wlMjBub3RlYm9va3MlMjBwZW5jaWxzJTIwZGVza3xlbnwxfHx8fDE3ODIyMTM5NTR8MA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 5, name: "Sac à dos ergonomique",        price: "45,000 DT", priceNum: 45.0, oldPrice: "55,000 DT",badge: "-18%",   badgeColor: "#e53935", rating: 4.9, reviews: 178, img: "https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxzY2hvb2wlMjBzdXBwbGllcyUyMGJhY2twYWNrJTIwc3RhdGlvbmVyeXxlbnwxfHx8fDE3ODIyMTM5NTR8MA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 6, name: "Calculatrice scientifique",    price: "52,000 DT", priceNum: 52.0, oldPrice: "65,000 DT",badge: "-20%",   badgeColor: "#e53935", rating: 4.8, reviews: 95,  img: "https://images.unsplash.com/photo-1574607383077-47ddc2dc51c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxjYWxjdWxhdG9yJTIwc2NpZW50aWZpYyUyMHN0dWRlbnR8ZW58MXx8fHwxNzgyMjEzOTU5fDA&ixlib=rb-4.1.0&q=80&w=400" },
];

function ProductCard({ product }: { product: typeof products[0] }) {
  const [wished, setWished]   = useState(false);
  const [added, setAdded]     = useState(false);
  const { addToCart }         = useCart();

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-card">
      <div className="product-img-wrap">
        <ResponsiveImage src={product.img} alt={product.name} className="product-img" />
        <span className="product-badge" style={{ backgroundColor: product.badgeColor }}>
          {product.badge}
        </span>
        <div className="product-actions">
          <button className="product-action-btn" onClick={() => setWished(!wished)}>
            <Heart size={13} fill={wished ? "#e53935" : "none"} stroke={wished ? "#e53935" : "#666"} />
          </button>
          <button className="product-action-btn">
            <Eye size={13} stroke="#666" />
          </button>
        </div>
      </div>

      <div className="product-body">
        <p className="product-name">{product.name}</p>

        <div className="product-stars">
          <div className="star-row">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={10} fill={i < Math.floor(product.rating) ? "#fbbf24" : "none"} stroke="#fbbf24" />
            ))}
          </div>
          <span className="product-reviews">({product.reviews})</span>
        </div>

        <div className="product-footer">
          <div>
            <span className="product-price">{product.price}</span>
            {product.oldPrice && (
              <span className="product-old-price">{product.oldPrice}</span>
            )}
          </div>
          <button
            className="add-to-cart-btn"
            onClick={handleAdd}
            style={{ backgroundColor: added ? "#059669" : "#0d2b6b" }}
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function BestSellers() {
  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Nos produits les plus vendus</h2>
          <div className="section-underline" />
        </div>
        <a href="#" className="section-link">
          Voir tous les produits <ChevronRight size={14} />
        </a>
      </div>

      <div className="products-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
