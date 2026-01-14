/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Admin user interface based on admin login response
interface AdminUser {
  unique_id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  force_password_change: boolean;
}

// Admin auth interface
interface AdminAuthData {
  access_token: string;
  role: string;
}

// Admin store state interface
interface AdminState {
  user: AdminUser | null;
  auth: AdminAuthData | null;
  isAuthenticated: boolean;
}

const initialState: AdminState = {
  user: null,
  auth: null,
  isAuthenticated: false
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    // Admin management actions
    setAdminUser: (state, action: PayloadAction<AdminUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setAdminAuth: (state, action: PayloadAction<AdminAuthData>) => {
      state.auth = action.payload;
    },
    loginAdmin: (state, action: PayloadAction<{ user: AdminUser; auth: AdminAuthData }>) => {
      state.user = action.payload.user;
      state.auth = action.payload.auth;
      state.isAuthenticated = true;
    },
    logoutAdmin: (state) => {
      state.user = null;
      state.auth = null;
      state.isAuthenticated = false;
    },
    updateAdminUser: (state, action: PayloadAction<Partial<AdminUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { 
  setAdminUser,
  setAdminAuth,
  loginAdmin,
  logoutAdmin,
  updateAdminUser
} = adminSlice.actions;

// Selectors for easy access to admin store data
export const selectAdminUser = (state: { admin: AdminState }) => state.admin.user;
export const selectAdminAuth = (state: { admin: AdminState }) => state.admin.auth;
export const selectAdminIsAuthenticated = (state: { admin: AdminState }) => state.admin.isAuthenticated;

// Custom hook for using admin data
export const useAdminData = () => {
  return {
    selectAdminUser,
    selectAdminAuth,
    selectAdminIsAuthenticated
  };
};

export default adminSlice.reducer;
