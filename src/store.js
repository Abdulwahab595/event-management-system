import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import eventsReducer from './slices/eventsSlice.js';
import registrationsReducer from './slices/registrationsSlice.js';
import { loadRegistrations } from './utils/registrations.js';
import { readCurrentUser } from './utils/accounts.js';

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    registrations: registrationsReducer,
  },
  preloadedState: {
    auth: { currentUser: readCurrentUser() },
    registrations: loadRegistrations(),
  },
});

export default store;
