// src/app/context/AdminContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, User, Order, AdminStats } from '../types';
import * as api from '../services/api';

export type { Product, User, Order } from '../types';

interface AdminContextProps {
  products: Product[];
  users: User[];
  orders: Order[];
  categories: string[];
  isAdmin: boolean;
  loading: boolean;
  stats: AdminStats | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  // CRUD helpers
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: Product['id'], updates: Partial<Omit<Product, 'id'>>) => Promise<void>;
  deleteProduct: (id: Product['id']) => Promise<void>;
  getCategories: () => Promise<string[]>;
  addCategory: (category: string) => Promise<string[]>;
  deleteCategory: (category: string) => Promise<string[]>;
  getAuditEntries: (limit?: number) => Promise<any[]>;
  deleteUser: (id: User['id']) => Promise<void>;
  blockUser: (id: string) => Promise<void>;
  unblockUser: (id: string) => Promise<void>;
  fetchUsers: (page?: number, limit?: number, search?: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'date'>) => Promise<void>;
  updateOrder: (id: Order['id'], updates: Partial<Omit<Order, 'id'>>) => Promise<void>;
  deleteOrder: (id: Order['id']) => Promise<void>;
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isAdmin, setIsAdminState] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const fetchStats = async () => {
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchUsers = async (page = 1, limit = 20, search = '') => {
    try {
      const data = await api.getUsers(page, limit, search);
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  // Load from the shared data-access layer on mount.
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const p = await api.getProducts();
      setProducts(p);
      
      const currentAdminFlag = api.getIsAdmin();
      setIsAdminState(currentAdminFlag);
      
      if (currentAdminFlag) {
        try {
          const [u, o, c, s] = await Promise.all([
            api.getUsers(1, 100),
            api.getOrders(),
            api.getAdminCategories(),
            api.getAdminStats(),
          ]);
          setUsers(u);
          setOrders(o);
          setCategories(c);
          setStats(s);
        } catch (err: any) {
          console.error("Failed to load admin data (Unauthorized?):", err);
          // Token is likely invalid or not an admin token. Downgrade to public.
          setIsAdminState(false);
          api.setIsAdmin(false);
          const publicCats = await api.getCategories();
          setUsers([]);
          setOrders([]);
          setCategories(publicCats);
          setStats(null);
        }
      } else {
        // Load public categories for storefront visitors
        const publicCats = await api.getCategories();
        setUsers([]);
        setOrders([]);
        setCategories(publicCats);
        setStats(null);
      }
      setLoading(false);
    };
    loadData();
  }, []); // Load on mount

  // Login via API
  const login = async (email: string, password: string) => {
    try {
      const user = await api.login(email, password);
      if (user && user.statut === 'admin') {
        setIsAdminState(true);
        api.setIsAdmin(true);
        
        // Load admin data
        const [p, u, o, s] = await Promise.all([
          api.getProducts(),
          api.getUsers(1, 100),
          api.getOrders(),
          api.getAdminStats(),
        ]);
        setProducts(p);
        setUsers(u);
        setOrders(o);
        setStats(s);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Admin login error:', err);
      return false;
    }
  };

  const logout = () => {
    setIsAdminState(false);
    api.setIsAdmin(false);
    api.logout();
    setStats(null);
  };

  // Products CRUD
  const addProduct = async (product: Omit<Product, 'id'>) => {
    const updated = await api.addProduct(product);
    setProducts(updated);
  };
  
  const updateProduct = async (id: Product['id'], updates: Partial<Omit<Product, 'id'>>) => {
    const updated = await api.updateProduct(id, updates);
    setProducts(updated);
  };
  
  const deleteProduct = async (id: Product['id']) => {
    const updated = await api.deleteProduct(id);
    setProducts(updated);
  };

  const getCategories = async () => {
    const categories = await api.getAdminCategories();
    setCategories(categories);
    return categories;
  };

  const addCategory = async (category: string) => {
    const categories = await api.addCategory(category);
    setCategories(categories);
    return categories;
  };

  const deleteCategory = async (category: string) => {
    const categories = await api.deleteCategory(category);
    setCategories(categories);
    return categories;
  };

  const getAuditEntries = async (limit = 50) => {
    return api.getAuditEntries(limit);
  };

  // Users CRUD
  const deleteUser = async (id: User['id']) => {
    const updated = await api.deleteUser(id);
    setUsers(updated);
  };

  const blockUser = async (id: string) => {
    await api.blockUser(id);
    await fetchUsers();
  };

  const unblockUser = async (id: string) => {
    await api.unblockUser(id);
    await fetchUsers();
  };

  // Orders CRUD
  const addOrder = async (order: Omit<Order, 'id' | 'date'>) => {
    await api.createOrder(order);
    // Reload orders to get the latest
    const updated = await api.getOrders();
    setOrders(updated);
  };

  const updateOrder = async (id: Order['id'], updates: Partial<Omit<Order, 'id'>>) => {
    const updated = await api.updateOrder(id, updates);
    setOrders(updated);
  };
  
  const deleteOrder = async (id: Order['id']) => {
    const updated = await api.deleteOrder(id);
    setOrders(updated);
  };

  return (
    <AdminContext.Provider
      value={{
        products,
        users,
        orders,
        categories,
        isAdmin,
        loading,
        stats,
        login,
        logout,
        addProduct,
        updateProduct,
        deleteProduct,
        getCategories,
        addCategory,
        deleteCategory,
        getAuditEntries,
        deleteUser,
        blockUser,
        unblockUser,
        fetchUsers,
        fetchStats,
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
