// src/adminSlices/studentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { sendOtpApi,verifyOtpRegisterApi ,studentRegisterApi  } from "../adminApi/authApi";

// ================= THUNK =================
export const sendOtp = createAsyncThunk(
  "student/sendOtp",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await sendOtpApi(payload);
      return data; // backend may return { success: true, message: "OTP sent" }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to send OTP");
    }
  }
);

// ================= THUNK =================
export const verifyOtpRegister = createAsyncThunk(
  "student/verifyOtpRegister",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await verifyOtpRegisterApi(payload);
      return data; // backend may return { success: true, message: "OTP verified" }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message  || "Failed to verify OTP");
    }
  }
);


export const studentRegister = createAsyncThunk(
  "student/studentRegister",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await studentRegisterApi(payload);
      return data; // backend returns { success: true, message: "Account created" }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to register student");
    }
  }
);

const studentSlice = createSlice({
  name: "student",
  initialState: {
     sendOtpLoading: false,
  verifyOtpLoading: false,
  registerLoading: false,
    otpError: null,
    otpSuccess: false,
    otpMessage: null,
  },
  reducers: {
    resetOtpState: (state) => {
      state.otpLoading = false;
      state.otpError = null;
      state.otpSuccess = false;
      state.otpMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
    .addCase(sendOtp.pending, (state) => {
  state.sendOtpLoading = true;
  state.otpError = null;
})
.addCase(sendOtp.fulfilled, (state, action) => {
  state.sendOtpLoading = false;
  state.otpSuccess = true;
  state.otpMessage = action.payload.message;
})
.addCase(sendOtp.rejected, (state, action) => {
  state.sendOtpLoading = false;
  state.otpError = action.payload;
})

.addCase(verifyOtpRegister.pending, (state) => {
  state.verifyOtpLoading = true;
  state.otpError = null;
})
.addCase(verifyOtpRegister.fulfilled, (state, action) => {
  state.verifyOtpLoading = false;
  state.otpSuccess = true;
  state.otpMessage = action.payload.message;
})
.addCase(verifyOtpRegister.rejected, (state, action) => {
  state.verifyOtpLoading = false;
  state.otpError = action.payload;
})

  .addCase(studentRegister.pending, (state) => {
  state.registerLoading = true;
})
.addCase(studentRegister.fulfilled, (state) => {
  state.registerLoading = false;
})
.addCase(studentRegister.rejected, (state) => {
  state.registerLoading = false;
});
  
  },
});

export const { resetOtpState } = studentSlice.actions;
export default studentSlice.reducer;