import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types for admin entities
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Order = {
  id: string;
  userId: string;
  productIds: string[];
  total: number;
  date: string; // ISO string
};

interface AdminContextProps {
  products: Product[];
  users: User[];
  orders: Order[];
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  // CRUD helpers
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id'>>) => void;
  deleteProduct: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<Omit<User, 'id'>>) => void;
  deleteUser: (id: string) => void;
  addOrder: (order: Omit<Order, 'id'>) => void;
  updateOrder: (id: string, updates: Partial<Omit<Order, 'id'>>) => void;
  deleteOrder: (id: string) => void;
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  products: 'admin_products',
  users: 'admin_users',
  orders: 'admin_orders',
  isAdmin: 'admin_isAdmin',
};

// Helper to generate simple IDs
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    const load = (key: string, setter: (data: any) => void) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          setter(JSON.parse(raw));
        } catch (_) {}
      }
    };
    load(LOCAL_STORAGE_KEYS.products, setProducts);
    load(LOCAL_STORAGE_KEYS.users, setUsers);
    load(LOCAL_STORAGE_KEYS.orders, setOrders);
    const adminFlag = localStorage.getItem(LOCAL_STORAGE_KEYS.isAdmin);
    setIsAdmin(adminFlag === 'true');
  }, []);

  // Persist changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.products, JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.users, JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.orders, JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.isAdmin, String(isAdmin));
  }, [isAdmin]);

  // Simple hard‑coded login
  const login = (username: string, password: string) => {
    if (username === 'admin@gmail.com' && password === 'admin@123') {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => setIsAdmin(false);

  // CRUD implementations (products)
  const addProduct = (product: Omit<Product, 'id'>) => {
    setProducts([...products, { ...product, id: generateId() }]);
  };
  const updateProduct = (id: string, updates: Partial<Omit<Product, 'id'>>) => {
    setProducts(products.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };
  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // Users
  const addUser = (user: Omit<User, 'id'>) => {
    setUsers([...users, { ...user, id: generateId() }]);
  };
  const updateUser = (id: string, updates: Partial<Omit<User, 'id'>>) => {
    setUsers(users.map(u => (u.id === id ? { ...u, ...updates } : u)));
  };
  const deleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  // Orders
  const addOrder = (order: Omit<Order, 'id'>) => {
    setOrders([...orders, { ...order, id: generateId() }]);
  };
  const updateOrder = (id: string, updates: Partial<Omit<Order, 'id'>>) => {
    setOrders(orders.map(o => (o.id === id ? { ...o, ...updates } : o)));
  };
  const deleteOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
  };

  return (
    <AdminContext.Provider
      value={{
        products,
        users,
        orders,
        isAdmin,
        login,
        logout,
        addProduct,
        updateProduct,
        deleteProduct,
        addUser,
        updateUser,
        deleteUser,
        addOrder,
        updateOrder,
        deleteOrder,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};
