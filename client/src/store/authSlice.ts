import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../services/authService';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

const initialToken = localStorage.getItem('factmesh_token');
const initialUserStr = localStorage.getItem('factmesh_user');

const initialState: AuthState = {
  token: initialToken,
  user: initialUserStr ? JSON.parse(initialUserStr) : null,
  isAuthenticated: !!initialToken,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: User }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem('factmesh_token', action.payload.token);
      localStorage.setItem('factmesh_user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('factmesh_token');
      localStorage.removeItem('factmesh_user');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
