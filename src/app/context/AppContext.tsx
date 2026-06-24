import React, { createContext, useContext, useState, useEffect } from "react";

export interface Product {
  id: number;
  name: string;
  price: string;
  priceNum: number; // For easy subtotal calculations
  oldPrice?: string | null;
  badge?: string;
  badgeColor?: string;
  rating: number;
  reviews: number;
  img: string;
  category?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type ViewType = "home" | "category" | "cart" | "product" | "auth";

export interface UserType {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  governorate: string;
  statut: string;
}

interface NavigationContextType {
  currentView: ViewType;
  activeCategory: string;
  selectedProductId: number | null;
  navigateTo: (view: ViewType, category?: string) => void;
  navigateToProduct: (productId: number) => void;
  user: UserType | null;
  loginUser: (user: UserType) => void;
  logoutUser: () => void;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);
const CartContext = createContext<CartContextType | undefined>(undefined);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [user, setUser] = useState<UserType | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("ecolier_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error parsing user storage:", e);
      }
    }
  }, []);

  const loginUser = (userData: UserType) => {
    setUser(userData);
    localStorage.setItem("ecolier_user", JSON.stringify(userData));
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem("ecolier_user");
    setCurrentView("home");
  };

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("ecolier_cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error parsing cart storage:", e);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem("ecolier_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const navigateTo = (view: ViewType, category = "") => {
    setCurrentView(view);
    setActiveCategory(category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToProduct = (productId: number) => {
    // Store selected product ID in a new state (we'll add it below)
    setSelectedProductId(productId);
    setCurrentView('product');
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.product.id === product.id);
      if (existing) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + item.product.priceNum * item.quantity, 0);

  return (
    <NavigationContext.Provider value={{ currentView, activeCategory, navigateTo, selectedProductId, navigateToProduct, user, loginUser, logoutUser }}>
      <CartContext.Provider
        value={{
          cartItems,
          addToCart,
          removeFromCart,
          updateQuantity,
          clearCart,
          cartCount,
          cartTotal,
        }}
      >
        {children}
      </CartContext.Provider>
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within AppProviders");
  }
  return context;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within AppProviders");
  }
  return context;
}
