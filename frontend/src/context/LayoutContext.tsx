// src/app/context/LayoutContext.tsx
//
// Fetches GET /api/settings once on mount and exposes:
//   layout   – a Record<string, any> keyed by setting name
//   saveSetting(key, content) – calls PUT /api/settings/:key
//
// Components read from `layout["navbar"]`, `layout["hero"]`, etc.
// The admin pushes any JSON shape to any key.

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getLayoutSettings, updateLayoutSetting } from "../services/api";

interface LayoutContextType {
  layout: Record<string, any>;
  loading: boolean;
  saveSetting: (key: string, content: any) => Promise<void>;
  refreshLayout: () => Promise<void>;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const refreshLayout = useCallback(async () => {
    try {
      const data = await getLayoutSettings();
      setLayout(data);
    } catch (e) {
      console.error("Failed to load layout settings:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLayout();
  }, [refreshLayout]);

  const saveSetting = useCallback(async (key: string, content: any) => {
    await updateLayoutSetting(key, content);
    // Optimistic local update
    setLayout((prev) => ({ ...prev, [key]: content }));
  }, []);

  return (
    <LayoutContext.Provider value={{ layout, loading, saveSetting, refreshLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used within LayoutProvider");
  return ctx;
}
