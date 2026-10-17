import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    currentUser: null,
  },
  reducers: {
    loginSucceeded(state, action) {
      const { id, name, email } = action.payload;
      state.currentUser = { id, name, email };
    },
    loggedOut(state) {
      state.currentUser = null;
    },
  },
});

export const { loginSucceeded, loggedOut } = authSlice.actions;
export default authSlice.reducer;
