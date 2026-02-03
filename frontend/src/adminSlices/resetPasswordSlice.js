import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { resetPasswordApi } from "../adminApi/authApi";

// ================= ASYNC THUNK =================
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await resetPasswordApi(payload);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Password reset failed"
      );
    }
  }
);

// ================= SLICE =================
const resetPasswordSlice = createSlice({
  name: "resetPassword",
  initialState: {
    loading: false,
    success: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearResetPasswordState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.successMessage = null;
    },
    clearSuccessAndEmail: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.successMessage = action.payload.message || action.payload.detail || "Password reset successfully";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearResetPasswordState, clearSuccessAndEmail } = resetPasswordSlice.actions;
export default resetPasswordSlice.reducer;
