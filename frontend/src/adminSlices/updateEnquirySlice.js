// updateEnquirySlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance";

// ✅ Update enquiry API
export const updateEnquiryApi = async (payload) => {
  const { id, ...data } = payload;
  const response = await axiosInstance.put(
    `/lead-registeration/leads/${id}/`,
    data
  );
  return response.data;
};

// ---------------- ASYNC THUNK ----------------
export const updateEnquiry = createAsyncThunk(
  "enquiry/update",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await updateEnquiryApi(payload);
      return response;
    } catch (error) {
      // Field-specific errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        return rejectWithValue(errorMessage);
      }

      // General message
      const generalError =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to update enquiry";

      return rejectWithValue(generalError);
    }
  }
);

// ---------------- SLICE ----------------
const updateEnquirySlice = createSlice({
  name: "updateEnquiry",
  initialState: {
    loading: false,
    success: false,
    error: null,
  },
  reducers: {
    clearUpdateState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateEnquiry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEnquiry.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateEnquiry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUpdateState } = updateEnquirySlice.actions;
export default updateEnquirySlice.reducer;