// client/src/store/brandsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Brand } from '../types';
import * as api from '../services/api';

interface BrandsState {
  items: Brand[];
  loading: boolean;
  error: string | null;
}

const initialState: BrandsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchBrands = createAsyncThunk('brands/fetchAll', async () => {
  return api.getBrands();
});

export const createBrand = createAsyncThunk('brands/create', async (data: Omit<Brand, '_id' | 'id' | 'createdAt'>) => {
  await api.createBrand(data);
  return api.getBrands();
});

export const editBrand = createAsyncThunk('brands/edit', async ({ id, data }: { id: string; data: Partial<Brand> }) => {
  await api.updateBrand(id, data);
  return api.getBrands();
});

export const removeBrand = createAsyncThunk('brands/remove', async (id: string) => {
  await api.deleteBrand(id);
  return api.getBrands();
});

const brandsSlice = createSlice({
  name: 'brands',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const pending = (state: BrandsState) => { state.loading = true; state.error = null; };
    const fulfilled = (state: BrandsState, action: PayloadAction<Brand[]>) => {
      state.loading = false;
      state.items = action.payload;
    };
    const rejected = (state: BrandsState, action: any) => {
      state.loading = false;
      state.error = action.error.message || 'Error';
    };

    builder
      .addCase(fetchBrands.pending, pending)
      .addCase(fetchBrands.fulfilled, fulfilled)
      .addCase(fetchBrands.rejected, rejected)
      .addCase(createBrand.pending, pending)
      .addCase(createBrand.fulfilled, fulfilled)
      .addCase(createBrand.rejected, rejected)
      .addCase(editBrand.pending, pending)
      .addCase(editBrand.fulfilled, fulfilled)
      .addCase(editBrand.rejected, rejected)
      .addCase(removeBrand.pending, pending)
      .addCase(removeBrand.fulfilled, fulfilled)
      .addCase(removeBrand.rejected, rejected);
  },
});

export default brandsSlice.reducer;
