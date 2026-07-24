// client/src/store/couponsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Coupon } from '../types';
import * as api from '../services/api';

interface CouponsState {
  items: Coupon[];
  loading: boolean;
  error: string | null;
}

const initialState: CouponsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCoupons = createAsyncThunk('coupons/fetchAll', async () => {
  return api.getCoupons();
});

export const createCoupon = createAsyncThunk('coupons/create', async (data: Omit<Coupon, '_id' | 'id' | 'createdAt'>) => {
  await api.createCoupon(data);
  return api.getCoupons();
});

export const editCoupon = createAsyncThunk('coupons/edit', async ({ id, data }: { id: string; data: Partial<Coupon> }) => {
  await api.updateCoupon(id, data);
  return api.getCoupons();
});

export const removeCoupon = createAsyncThunk('coupons/remove', async (id: string) => {
  await api.deleteCoupon(id);
  return api.getCoupons();
});

const couponsSlice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const pending = (state: CouponsState) => { state.loading = true; state.error = null; };
    const fulfilled = (state: CouponsState, action: PayloadAction<Coupon[]>) => {
      state.loading = false;
      state.items = action.payload;
    };
    const rejected = (state: CouponsState, action: any) => {
      state.loading = false;
      state.error = action.error.message || 'Error';
    };

    builder
      .addCase(fetchCoupons.pending, pending)
      .addCase(fetchCoupons.fulfilled, fulfilled)
      .addCase(fetchCoupons.rejected, rejected)
      .addCase(createCoupon.pending, pending)
      .addCase(createCoupon.fulfilled, fulfilled)
      .addCase(createCoupon.rejected, rejected)
      .addCase(editCoupon.pending, pending)
      .addCase(editCoupon.fulfilled, fulfilled)
      .addCase(editCoupon.rejected, rejected)
      .addCase(removeCoupon.pending, pending)
      .addCase(removeCoupon.fulfilled, fulfilled)
      .addCase(removeCoupon.rejected, rejected);
  },
});

export default couponsSlice.reducer;
