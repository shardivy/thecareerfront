import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { convertEnquiryApi } from "../adminApi/enquiryApi";
import { m } from "framer-motion";

// ---------------- CONVERT ENQUIRY / USER ----------------
export const convertEnquiry = createAsyncThunk(
  "convertEnquiry/convert",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await convertEnquiryApi(id, payload);
      return response;
    } catch (error) {
      if (error.response?.data?.errors) {
        const fieldErrors = error.response.data.errors;
        return rejectWithValue({ fieldErrors });
      }

      // fallback to general message
      const generalError =
        error.response?.data?.message || "Failed to convert enquiry";
      return rejectWithValue({ generalError });
    }
  }
);

const convertEnquirySlice = createSlice({
  name: "convertEnquiry",
  initialState: {
    loading: false,
    success: false,
    error: null, 
    fieldErrors: {}, 
    message: null,
  },
  reducers: {
    clearConvertState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.message = null;
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
      .addCase(convertEnquiry.fulfilled, (state,action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;
      })
      // rejected
     .addCase(convertEnquiry.rejected, (state, action) => {
        state.loading = false;
        if (action.payload?.fieldErrors) {
          state.fieldErrors = action.payload.fieldErrors;
        } else if (action.payload?.generalError) {
          state.error = action.payload.generalError;
        } else {
          state.error = "Failed to convert enquiry";
        }
      });
  },
});

export const { clearConvertState } = convertEnquirySlice.actions;
export default convertEnquirySlice.reducer;
