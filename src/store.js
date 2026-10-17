import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import eventsReducer from './slices/eventsSlice.js';
import { readCurrentUser } from './utils/accounts.js';

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
  },
  preloadedState: {
    auth: { currentUser: readCurrentUser() },
  },
});

export default store;
