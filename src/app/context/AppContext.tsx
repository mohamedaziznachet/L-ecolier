import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, User } from "../types";
import * as api from "../services/api";

export type { Product, User } from "../types";

export interface CartItem {
  product: Product;
  quantity: number;
}

export type ViewType = "home" | "category" | "cart" | "product" | "auth" | "admin";

interface NavigationContextType {
  currentView: ViewType;
  activeCategory: string;
  selectedProductId: number | null;
  navigateTo: (view: ViewType, category?: string) => void;
  navigateToProduct: (productId: number) => void;
  user: User | null;
  loginUser: (user: User) => void;
  logoutUser: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
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
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Load user from storage on mount
  useEffect(() => {
    const savedUser = api.getCurrentUser();
    if (savedUser) setUser(savedUser);
  }, []);

  const loginUser = (userData: User) => {
    setUser(userData);
    api.saveCurrentUser(userData);
  };

  const logoutUser = () => {
    setUser(null);
    api.logout();
    setCurrentView("home");
  };

  // Load cart from storage on mount
  useEffect(() => {
    setCartItems(api.getCart<CartItem>());
  }, []);

  // Save cart to storage on change
  useEffect(() => {
    api.saveCart(cartItems);
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

  const addToCart = (product: Product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.product.id === product.id);
      if (existing) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, quantity }];
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
    <NavigationContext.Provider value={{ currentView, activeCategory, navigateTo, selectedProductId, navigateToProduct, user, loginUser, logoutUser, searchQuery, setSearchQuery }}>
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
