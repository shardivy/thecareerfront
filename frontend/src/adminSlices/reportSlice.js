import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCompletedExamReportsApi,
  uploadReportApi,
  getReportStatusCountApi,
} from "../adminApi/reportApi";

/* ----------------- ASYNC THUNKS ----------------- */
export const fetchCompletedExamReports = createAsyncThunk(
  "reports/fetchCompletedExamReports",
  async (_, { rejectWithValue }) => {
    try {
      return await getCompletedExamReportsApi();
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch reports");
    }
  }
);

export const fetchReportStats = createAsyncThunk(
  "reports/fetchReportStats",
  async (_, { rejectWithValue }) => {
    try {
      return await getReportStatusCountApi();
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch stats");
    }
  }
);

export const uploadReport = createAsyncThunk(
  "reports/uploadReport",
  async ({ reportId, formData }, { rejectWithValue }) => {
    try {
      return await uploadReportApi(reportId, formData);
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to upload report");
    }
  }
);

/* ----------------- SLICE ----------------- */
const reportSlice = createSlice({
  name: "reports",
  initialState: {
    reports: [],
    stats: null, // <-- Add stats here
    loading: false,
    error: null,
  },
  reducers: {
    clearReportsState: (state) => {
      state.reports = [];
      state.stats = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH COMPLETED EXAM REPORTS
      .addCase(fetchCompletedExamReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompletedExamReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = Array.isArray(action.payload?.data)
          ? action.payload.data
          : [];
      })
      .addCase(fetchCompletedExamReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH REPORT STATS
      .addCase(fetchReportStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload || null;
      })
      .addCase(fetchReportStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPLOAD REPORT
      .addCase(uploadReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadReport.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(uploadReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReportsState } = reportSlice.actions;
export default reportSlice.reducer;
