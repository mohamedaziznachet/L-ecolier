import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Product, User } from "../types";
import * as api from "../services/api";

export type { Product, User } from "../types";

export interface CartItem {
  product: Product;
  quantity: number;
}

export type ViewType = "home" | "category" | "cart" | "product" | "auth" | "admin" | "about" | "promotions" | "contact" | "terms" | "privacy" | "orders" | "wishlist";

interface NavigationContextType {
  currentView: ViewType;
  activeCategory: string;
  selectedProductId: number | string | null;
  navigateTo: (view: ViewType, category?: string, page?: number) => void;
  pageNumber?: number;
  navigateToPage?: (page: number) => void;
  navigateToProduct: (productId: number | string) => void;
  user: User | null;
  loginUser: (user: User) => void;
  logoutUser: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number | string) => void;
  updateQuantity: (productId: number | string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

interface WishlistContextType {
  wishlistIds: (string | number)[];
  wishlistProducts: Product[];
  toggleWishlist: (product: Product | { id: string | number }) => Promise<void>;
  removeFromWishlist: (productId: string | number) => Promise<void>;
  isInWishlist: (productId: string | number) => boolean;
  wishlistCount: number;
  loadingWishlist: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);
const CartContext = createContext<CartContextType | undefined>(undefined);
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Wishlist State
  const [wishlistIds, setWishlistIds] = useState<(string | number)[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState<boolean>(true);

  const navigate = useNavigate();
  const location = useLocation();

  // Load dark mode preference
  useEffect(() => {
    const stored = localStorage.getItem('ecolier_dark_mode');
    if (stored) setDarkMode(stored === 'true');
  }, []);

  // Apply dark mode class and persist
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('ecolier_dark_mode', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Load user from storage on mount
  useEffect(() => {
    const savedUser = api.getCurrentUser();
    if (savedUser) setUser(savedUser);
  }, []);

  // Wishlist synchronization effect
  useEffect(() => {
    let cancelled = false;
    async function syncWishlist() {
      setLoadingWishlist(true);
      try {
        if (user) {
          // Logged in user: fetch server wishlist
          const res = await api.getWishlist();
          if (cancelled) return;

          let serverIds = res.wishlistIds.map(id => String(id));
          let serverProducts = res.wishlist;

          // Sync any guest items saved in localStorage
          const guestRaw = localStorage.getItem('ecolier_wishlist');
          if (guestRaw) {
            try {
              const guestIds: (string | number)[] = JSON.parse(guestRaw);
              const unSynced = guestIds.filter(gid => !serverIds.includes(String(gid)));
              for (const id of unSynced) {
                await api.toggleWishlistApi(id);
              }
              if (unSynced.length > 0) {
                const refreshed = await api.getWishlist();
                if (cancelled) return;
                serverIds = refreshed.wishlistIds.map(id => String(id));
                serverProducts = refreshed.wishlist;
              }
              localStorage.removeItem('ecolier_wishlist');
            } catch (e) {
              console.error('Error syncing guest wishlist to user:', e);
            }
          }

          setWishlistIds(serverIds);
          setWishlistProducts(serverProducts);
        } else {
          // Guest user: fetch from localStorage
          const guestRaw = localStorage.getItem('ecolier_wishlist');
          const guestIds: (string | number)[] = guestRaw ? JSON.parse(guestRaw) : [];
          setWishlistIds(guestIds.map(id => String(id)));

          if (guestIds.length > 0) {
            const products = await api.getBatchWishlistApi(guestIds);
            if (cancelled) return;
            setWishlistProducts(products);
          } else {
            setWishlistProducts([]);
          }
        }
      } catch (err) {
        console.error('Failed to sync wishlist:', err);
      } finally {
        if (!cancelled) setLoadingWishlist(false);
      }
    }

    syncWishlist();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleWishlist = async (targetProduct: Product | { id: string | number }) => {
    const targetId = String(targetProduct.id);
    const currentlyInWishlist = wishlistIds.some(id => String(id) === targetId);

    if (user) {
      try {
        const res = await api.toggleWishlistApi(targetId);
        setWishlistIds((res.wishlistIds || []).map(id => String(id)));
        setWishlistProducts(res.wishlist || []);
      } catch (err) {
        console.error('Failed to toggle wishlist on server:', err);
      }
    } else {
      // Guest local toggle
      let nextIds: (string | number)[];
      if (currentlyInWishlist) {
        nextIds = wishlistIds.filter(id => String(id) !== targetId);
        setWishlistProducts(prev => prev.filter(p => String(p.id) !== targetId));
      } else {
        nextIds = [...wishlistIds, targetId];
        // If full product provided, append to products list
        if ('name' in targetProduct) {
          setWishlistProducts(prev => [...prev.filter(p => String(p.id) !== targetId), targetProduct as Product]);
        } else {
          const batch = await api.getBatchWishlistApi([targetId]);
          if (batch.length > 0) {
            setWishlistProducts(prev => [...prev.filter(p => String(p.id) !== targetId), batch[0]]);
          }
        }
      }
      setWishlistIds(nextIds.map(id => String(id)));
      localStorage.setItem('ecolier_wishlist', JSON.stringify(nextIds));
    }
  };

  const removeFromWishlist = async (productId: string | number) => {
    await toggleWishlist({ id: productId });
  };

  const isInWishlist = (productId: string | number): boolean => {
    const targetId = String(productId);
    return wishlistIds.some(id => String(id) === targetId);
  };

  // Parse URL from react-router location and map to our legacy state
  useEffect(() => {
    const parsePath = (path: string) => {
      try {
        const pathname = path || '/';
        // /category/:cat[/page/:num]
        const catMatch = pathname.match(/^\/category\/([^\/]+)(?:\/page\/(\d+))?/);
        if (catMatch) {
          const cat = decodeURIComponent(catMatch[1]);
          const pg = Number(catMatch[2] || 1);
          setCurrentView('category');
          setActiveCategory(cat);
          setPageNumber(pg);
          return;
        }

        // /page/:num
        const pageOnly = pathname.match(/^\/page\/(\d+)/);
        if (pageOnly) {
          setCurrentView('category');
          setActiveCategory('');
          setPageNumber(Number(pageOnly[1]));
          return;
        }

        if (pathname === '/' || pathname === '') {
          setCurrentView('home');
          setPageNumber(1);
          return;
        }

        // other simple routes
        const part = pathname.replace(/^\//, '').split('/')[0];
        if (part === 'product') setCurrentView('product');
        else if (part === 'cart') setCurrentView('cart');
        else if (part === 'auth') setCurrentView('auth');
        else if (part === 'wishlist') setCurrentView('wishlist');
        else if (['about','promotions','contact','terms','privacy','admin','orders'].includes(part)) setCurrentView(part as ViewType);
      } catch (e) {
        // ignore parse errors
      }
    };

    parsePath(location.pathname);
  }, [location.pathname]);

  const loginUser = (userData: User) => {
    setUser(userData);
    api.saveCurrentUser(userData);
  };

  const logoutUser = () => {
    setUser(null);
    api.logout();
    localStorage.removeItem("ecolier_user");
    localStorage.removeItem("ecolier_token");
    localStorage.removeItem("ecolier_refresh_token");
    localStorage.removeItem("ecolier_is_admin");
    navigate('/');
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

  const navigateTo = (view: ViewType, category = "", page = 1) => {
    // Navigate via React Router; state will sync in useEffect
    try {
      if (view === 'category') {
        const base = category ? `/category/${encodeURIComponent(category)}` : '/shop';
        const url = page && page > 1 ? `${base}/page/${page}` : base;
        navigate(url);
      } else if (view === 'home') {
        navigate('/');
      } else if (view === 'product') {
        navigate('/product');
      } else {
        navigate(`/${view}`);
      }
    } catch (e) {
      console.error(e);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToPage = (page: number) => {
    navigateTo("category", activeCategory, page);
  };

  const navigateToProduct = (productId: number | string) => {
    setSelectedProductId(productId);
    navigate(`/product/${productId}`);
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

  const removeFromCart = (productId: number | string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number | string, quantity: number) => {
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
  const wishlistCount = wishlistIds.length;

  return (
    <NavigationContext.Provider value={{ currentView, activeCategory, navigateTo, selectedProductId, navigateToProduct, user, loginUser, logoutUser, searchQuery, setSearchQuery, darkMode, toggleDarkMode, pageNumber, navigateToPage }}>
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
        <WishlistContext.Provider
          value={{
            wishlistIds,
            wishlistProducts,
            toggleWishlist,
            removeFromWishlist,
            isInWishlist,
            wishlistCount,
            loadingWishlist,
          }}
        >
          {children}
        </WishlistContext.Provider>
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

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within AppProviders");
  }
  return context;
}
