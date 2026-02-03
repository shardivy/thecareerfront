import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { convertEnquiryApi } from "../adminApi/enquiryApi";

// ---------------- CONVERT ENQUIRY / USER ----------------
export const convertEnquiry = createAsyncThunk(
  "convertEnquiry/convert",
  async (id, { rejectWithValue }) => {
    try {
      const response = await convertEnquiryApi(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to convert enquiry"
      );
    }
  }
);

const convertEnquirySlice = createSlice({
  name: "convertEnquiry",
  initialState: {
    loading: false,
    success: false,
    error: null,
  },
  reducers: {
    clearConvertState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // pending
      .addCase(convertEnquiry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // fulfilled
      .addCase(convertEnquiry.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      // rejected
      .addCase(convertEnquiry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearConvertState } = convertEnquirySlice.actions;
export default convertEnquirySlice.reducer;
