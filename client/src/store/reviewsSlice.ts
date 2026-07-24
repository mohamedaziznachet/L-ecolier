// client/src/store/reviewsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Review } from '../types';
import * as api from '../services/api';

interface ReviewsState {
  items: Review[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: ReviewsState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
};

export const fetchReviews = createAsyncThunk('reviews/fetchAll', async ({ page = 1, limit = 20, search = '' }: { page?: number; limit?: number; search?: string }) => {
  return api.getReviews(page, limit, search);
});

export const removeReview = createAsyncThunk('reviews/remove', async ({ id, page, limit, search }: { id: string; page?: number; limit?: number; search?: string }) => {
  await api.deleteReview(id);
  return api.getReviews(page || 1, limit || 20, search || '');
});

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.reviews;
        state.total = action.payload.total;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error';
      })
      .addCase(removeReview.pending, (state) => { state.loading = true; })
      .addCase(removeReview.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.reviews;
        state.total = action.payload.total;
      })
      .addCase(removeReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error';
      });
  },
});

export default reviewsSlice.reducer;
