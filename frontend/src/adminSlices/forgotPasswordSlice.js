import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { forgotPasswordApi, verifyOtpApi } from "../adminApi/authApi";

// ================= THUNK =================
export const sendResetLink = createAsyncThunk(
  "forgotPassword/sendResetLink",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await forgotPasswordApi(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
          error.response?.data?.error ||
        "Failed to send otp to your email"
      );
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "forgotPassword/verifyOtp",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await verifyOtpApi(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Invalid OTP"
      );
    }
  }
);

// ================= SLICE =================
const forgotPasswordSlice = createSlice({
  name: "forgotPassword",
  initialState: {
    loading: false,
    successMessage: null,
    error: null,
    otpSent: false,
    email: null,
    otpVerified: false,
  },
  reducers: {
    clearForgotPasswordState: (state) => {
      state.loading = false;
      state.successMessage = null;
      state.error = null;
    },
    resetOtpState: (state) => {
      state.otpSent = false;
      state.otpVerified = false;
    },
    setEmailInState: (state, action) => {
      state.email = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendResetLink.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(sendResetLink.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        state.otpSent = true;
        state.email = action.payload.email || null;
      })
      .addCase(sendResetLink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.otpSent = false;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpVerified = true;
        state.successMessage = "OTP verified successfully";
        state.email = action.payload.email || state.email;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.otpVerified = false;
      });
  },
});

export const { clearForgotPasswordState, resetOtpState, setEmailInState } =
  forgotPasswordSlice.actions;

export default forgotPasswordSlice.reducer;
