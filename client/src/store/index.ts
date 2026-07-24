// client/src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import brandsReducer from './brandsSlice';
import couponsReducer from './couponsSlice';
import reviewsReducer from './reviewsSlice';

export const store = configureStore({
  reducer: {
    brands: brandsReducer,
    coupons: couponsReducer,
    reviews: reviewsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
