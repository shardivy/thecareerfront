import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCompletedExamReportsApi,
  uploadReportApi,
  getReportStatusCountApi,
  getCompletedExamReportsByStudentApi,
  updateReportApi,
  uploadStudentV2ReportApi,
  updateStudentV2ReportApi,

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

export const fetchCompletedExamReportsByStudent = createAsyncThunk(
  "reports/fetchCompletedExamReportsByStudent",
  async (studentId, { rejectWithValue }) => {
    try {
      return await getCompletedExamReportsByStudentApi(studentId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch student reports"
      );
    }
  }
);

// UPDATE REPORT
export const updateReport = createAsyncThunk(
  "reports/updateReport",
  async ({ reportId, formData }, { rejectWithValue }) => {
    try {
      return await updateReportApi(reportId, formData);
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update report");
    }
  }
);

export const uploadStudentV2Report = createAsyncThunk(
  "reports/uploadStudentV2Report",
  async (
    { studentId, programId, packageId, formData },
    { rejectWithValue }
  ) => {
    try {
      return await uploadStudentV2ReportApi(
        studentId,
        programId,
        packageId,
        formData
      );
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to upload V2 report"
      );
    }
  }
);

export const updateStudentV2Report = createAsyncThunk(
  "reports/updateStudentV2Report",
  async (
    { studentId, programId, packageId, formData },
    { rejectWithValue }
  ) => {
    try {
      return await updateStudentV2ReportApi(
        studentId,
        programId,
        packageId,
        formData
      );
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update V2 report"
      );
    }
  }
);



/* ----------------- SLICE ----------------- */
const reportSlice = createSlice({
  name: "reports",
  initialState: {
    reports: [],
    stats: null, // <-- Add stats here
      uploadingReportId: null,
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

      // FETCH COMPLETED EXAM REPORTS BY STUDENT
      .addCase(fetchCompletedExamReportsByStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompletedExamReportsByStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = Array.isArray(action.payload?.data)
          ? action.payload.data
          : [];
      })
      .addCase(fetchCompletedExamReportsByStudent.rejected, (state, action) => {
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
      })

      // UPDATE REPORT
      .addCase(updateReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateReport.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // STUDENT V2 REPORT UPLOAD
   .addCase(uploadStudentV2Report.pending, (state, action) => {
  state.uploadingReportId = action.meta.arg.studentId;
})

.addCase(uploadStudentV2Report.fulfilled, (state) => {
  state.uploadingReportId = null;
})

.addCase(uploadStudentV2Report.rejected, (state, action) => {
  state.uploadingReportId = null;
  state.error = action.payload;
})

     .addCase(updateStudentV2Report.pending, (state, action) => {
  state.uploadingReportId = action.meta.arg.studentId;
})

.addCase(updateStudentV2Report.fulfilled, (state) => {
  state.uploadingReportId = null;
})

.addCase(updateStudentV2Report.rejected, (state, action) => {
  state.uploadingReportId = null;
  state.error = action.payload;
})
      


  },
});

export const { clearReportsState } = reportSlice.actions;
export default reportSlice.reducer;
