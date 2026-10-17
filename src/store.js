import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import { readCurrentUser } from './utils/accounts.js';

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: {
    auth: { currentUser: readCurrentUser() },
  },
});

export default store;
