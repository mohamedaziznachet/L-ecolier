// client/src/hooks/useCheckout.ts
// Lightweight checkout hook for customer storefront.
// NO dependency on AdminContext — this is purely a customer-facing operation.
// The backend is the authoritative source for prices and availability.

import { useState, useCallback } from 'react';
import { createPublicOrder } from '../services/api';

export interface CheckoutItem {
  /** Product identifier (numeric id or MongoDB ObjectId string) */
  productId: number | string;
  quantity: number;
}

export interface PlaceOrderPayload {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerGovernorate: string;
  customerEmail?: string;
  userId?: string;
  items: CheckoutItem[];
  paymentMethod?: string;
  deliveryNotes?: string;
  couponCode?: string;
}

export interface OrderResult {
  orderId: string;
  total: number;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
}

interface UseCheckoutState {
  loading: boolean;
  error: string | null;
  success: boolean;
  result: OrderResult | null;
}

interface UseCheckoutReturn extends UseCheckoutState {
  placeOrder: (payload: PlaceOrderPayload) => Promise<OrderResult | null>;
  reset: () => void;
}

/**
 * useCheckout — customer-facing checkout hook.
 *
 * Usage:
 * ```tsx
 * const { placeOrder, loading, error, success } = useCheckout();
 *
 * const onSubmit = async () => {
 *   const result = await placeOrder({ customerName, items, ... });
 *   if (result) clearCart();
 * };
 * ```
 */
export function useCheckout(): UseCheckoutReturn {
  const [state, setState] = useState<UseCheckoutState>({
    loading: false,
    error: null,
    success: false,
    result: null,
  });

  const placeOrder = useCallback(async (payload: PlaceOrderPayload): Promise<OrderResult | null> => {
    setState({ loading: true, error: null, success: false, result: null });

    try {
      const result = await createPublicOrder(payload);
      setState({ loading: false, error: null, success: true, result });
      return result;
    } catch (err: any) {
      const message = err?.message || 'Une erreur est survenue lors de la commande.';
      setState({ loading: false, error: message, success: false, result: null });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, success: false, result: null });
  }, []);

  return { ...state, placeOrder, reset };
}
