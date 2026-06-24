import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  // add other fields as needed
}

interface AuthContextProps {
  user: User | null;
  loginUser: (u: User) => void;
  logoutUser: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Load persisted dark mode preference
  useEffect(() => {
    const stored = localStorage.getItem('ecolier_dark_mode');
    if (stored) setDarkMode(stored === 'true');
  }, []);

  // Apply dark mode class to root and persist
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('ecolier_dark_mode', String(darkMode));
  }, [darkMode]);

  const loginUser = (u: User) => setUser(u);
  const logoutUser = () => setUser(null);
  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser, darkMode, toggleDarkMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
