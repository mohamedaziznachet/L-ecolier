import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, User, Order } from '../types';
import * as api from '../services/api';

export type { Product, User, Order } from '../types';

interface AdminContextProps {
  products: Product[];
  users: User[];
  orders: Order[];
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  // CRUD helpers
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: Product['id'], updates: Partial<Omit<Product, 'id'>>) => void;
  deleteProduct: (id: Product['id']) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: User['id'], updates: Partial<Omit<User, 'id'>>) => void;
  deleteUser: (id: User['id']) => void;
  addOrder: (order: Omit<Order, 'id'>) => void;
  updateOrder: (id: Order['id'], updates: Partial<Omit<Order, 'id'>>) => void;
  deleteOrder: (id: Order['id']) => void;
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined);

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin@123';

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAdmin, setIsAdminState] = useState<boolean>(false);

  // Load from the shared data-access layer on mount.
  useEffect(() => {
    setProducts(api.getProducts());
    setUsers(api.getUsers());
    setOrders(api.getOrders());
    setIsAdminState(api.getIsAdmin());
  }, []);

  // Simple hard-coded login
  const login = (username: string, password: string) => {
    if (username === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsAdminState(true);
      api.setIsAdmin(true);
      // Refresh views in case other parts of the app registered users/products.
      setUsers(api.getUsers());
      setProducts(api.getProducts());
      setOrders(api.getOrders());
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdminState(false);
    api.setIsAdmin(false);
  };

  // Products
  const addProduct = (product: Omit<Product, 'id'>) => {
    setProducts(api.addProduct(product));
  };
  const updateProduct = (id: Product['id'], updates: Partial<Omit<Product, 'id'>>) => {
    setProducts(api.updateProduct(id, updates));
  };
  const deleteProduct = (id: Product['id']) => {
    setProducts(api.deleteProduct(id));
  };

  // Users
  const addUser = (user: Omit<User, 'id'>) => {
    setUsers(api.addUser(user));
  };
  const updateUser = (id: User['id'], updates: Partial<Omit<User, 'id'>>) => {
    setUsers(api.updateUser(id, updates));
  };
  const deleteUser = (id: User['id']) => {
    setUsers(api.deleteUser(id));
  };

  // Orders
  const addOrder = (order: Omit<Order, 'id'>) => {
    setOrders(api.createOrder(order));
  };
  const updateOrder = (id: Order['id'], updates: Partial<Omit<Order, 'id'>>) => {
    setOrders(api.updateOrder(id, updates));
  };
  const deleteOrder = (id: Order['id']) => {
    setOrders(api.deleteOrder(id));
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
