import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  startReviewByStudentApi,
  getReviewStatusApi,
  submitReviewByStudentApi,
} from "../adminApi/reviewApi";

// START
export const startReviewByStudent = createAsyncThunk(
  "review/startReviewByStudent",
  async (payload, { rejectWithValue }) => {
    try {
      return await startReviewByStudentApi(payload);
    } catch (error) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

// GET STATUS
export const getReviewStatus = createAsyncThunk(
  "review/getReviewStatus",
  async (studentId, { rejectWithValue }) => {
    try {
      return await getReviewStatusApi(studentId);
    } catch (error) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

// SUBMIT
export const submitReviewByStudent = createAsyncThunk(
  "review/submitReviewByStudent",
  async (reviewId, { rejectWithValue }) => {
    try {
      return await submitReviewByStudentApi(reviewId);
    } catch (error) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

const reviewSlice = createSlice({
  name: "review",
  initialState: {
    loading: false,
    submitLoading: false,
    statusLoading: false,
    success: false,
    submitSuccess: false,
    statusSuccess: false,
    error: null,
    reviewId: null, // ✅ important
    reviewStatus: null, // ✅ for status API
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // START
      .addCase(startReviewByStudent.pending, (state) => {
        state.loading = true;
      })
      .addCase(startReviewByStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.reviewId = action.payload.review_id; // ✅ FIX
      })
      .addCase(startReviewByStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // GET STATUS
      .addCase(getReviewStatus.pending, (state) => {
        state.statusLoading = true;
      })
      .addCase(getReviewStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.statusSuccess = true;
        state.reviewStatus = action.payload;
      })
      .addCase(getReviewStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.error = action.payload;
      })

      // SUBMIT
      .addCase(submitReviewByStudent.pending, (state) => {
        state.submitLoading = true;
      })
      .addCase(submitReviewByStudent.fulfilled, (state) => {
        state.submitLoading = false;
        state.submitSuccess = true;
      })
      .addCase(submitReviewByStudent.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
      });
  },
});

export default reviewSlice.reducer;