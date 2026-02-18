import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { addEnquiryApi } from "../adminApi/enquiryApi";

export const addEnquiry = createAsyncThunk(
  "enquiry/add",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await addEnquiryApi(payload);
      return response;
    } catch (error) {
    //   console.log("❌ Error Response:", error.response?.data);

      // Handle field-specific errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError)
          ? firstError[0]
          : firstError;
        // console.log("❌ Field Error:", errorMessage);
        return rejectWithValue(errorMessage);
      }

      // Handle general message
      const generalError =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to add enquiry";

    //   console.log("❌ General Error:", generalError);
      return rejectWithValue(generalError);
    }
  }
);


const addEnquirySlice = createSlice({
  name: "addEnquiry",
  initialState: {
    loading: false,
    success: false,
    error: null,
    message: null,
  },
  reducers: {
   clearAddEnquiryState: (state) => {
  state.loading = false;
  state.success = false;
  state.error = null;
  state.message = null;
},

  },
  extraReducers: (builder) => {
    builder
      .addCase(addEnquiry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addEnquiry.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;
      })
      .addCase(addEnquiry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAddEnquiryState } = addEnquirySlice.actions;
export default addEnquirySlice.reducer;
