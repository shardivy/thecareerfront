// src/adminSlices/authSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginApi } from "../adminApi/authApi";

// ================= THUNK =================
export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await loginApi(payload);

      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);
      localStorage.setItem("adminRole", data.user.role);
      // Store email safely: try lowercase 'email' first, then 'Email' (backend inconsistent)
      localStorage.setItem("userEmail", data.user.email || data.user.Email || "");
   

      console.log("error:", data.error);
  
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 
        "Login failed"
      );
    }
  }
);

// ================= SLICE =================
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    accessToken: null,
    loading: false,
    error: null,
    success: false,
    successMessage: null, 
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false; 
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.user = action.payload.user || null;

        state.accessToken = action.payload.access;

        // ✅ store backend message
        state.successMessage = action.payload.message || "Login successful";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
        state.successMessage = null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
