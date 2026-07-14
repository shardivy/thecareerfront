import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCollegeListAnalysisApi,
  submitAnswersApi,
  startCollegeAnalysisApi,
  getCollegeAnalysisStatusApi,
  uploadAnalysisReportApi,
  getCompletedReportsApi,
  updateAnalysisReportApi,
  updateAnswersApi,
  getAnalysisDashboardApi,
  uploadEngineeringV3ReportApi
} from "../adminApi/collegeAnalysisApi";

// 📥 FETCH USER REQUESTS
export const fetchCollegeAnalysis = createAsyncThunk(
  "collegeAnalysis/fetchCollegeAnalysis",
  async (
    { studentId, tab, programId, packageId } = {},
    { rejectWithValue }
  ) => {
    try {
      return await getCollegeListAnalysisApi({
        studentId,
        tab,
        programId,
        packageId,
      });
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);

// 📤 SUBMIT ANSWERS
export const submitAnswers = createAsyncThunk(
  "collegeAnalysis/submitAnswers",
  async (payload, { rejectWithValue }) => {
    try {
      return await submitAnswersApi(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);

// 🚀 START QUESTIONNAIRE
export const startCollegeAnalysis = createAsyncThunk(
  "collegeAnalysis/startCollegeAnalysis",
  async (
    { studentId, programId, packageId },
    { rejectWithValue }
  ) => {
    try {
      return await startCollegeAnalysisApi(
        studentId,
        programId,
        packageId
      );
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);

export const updateAnswers = createAsyncThunk(
  "collegeAnalysis/updateAnswers",
  async ({ studentId, answers }, { rejectWithValue }) => {
    try {
      return await updateAnswersApi({ studentId, answers });
    } catch (err) {
      return rejectWithValue(err.response?.data || "Update failed");
    }
  }
);

// 📊 GET STATUS
export const fetchCollegeAnalysisStatus = createAsyncThunk(
  "collegeAnalysis/fetchStatus",
  async (
    { studentId, programId, packageId },
    { rejectWithValue }
  ) => {
    try {
      return await getCollegeAnalysisStatusApi(
        studentId,
        programId,
        packageId
      );
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);

// 📤 UPLOAD REPORT
export const uploadAnalysisReport = createAsyncThunk(
  "collegeAnalysis/uploadReport",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      return await uploadAnalysisReportApi(id, formData);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Upload failed");
    }
  }
);

// 📊 FETCH COMPLETED REPORTS
export const fetchCompletedReports = createAsyncThunk(
  "collegeAnalysis/fetchCompletedReports",
  async (_, { rejectWithValue }) => {
    try {
      return await getCompletedReportsApi();
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);

export const updateAnalysisReport = createAsyncThunk(
  "collegeAnalysis/updateReport",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      return await updateAnalysisReportApi(id, formData);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Update failed");
    }
  }
);

// 📊 FETCH DASHBOARD STATS
export const fetchAnalysisDashboard = createAsyncThunk(
  "collegeAnalysis/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      return await getAnalysisDashboardApi();
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);

export const uploadEngineeringV3Report = createAsyncThunk(
  "reports/uploadEngineeringV3Report",
  async ({ reportId, formData }, { rejectWithValue }) => {
    try {
      return await uploadEngineeringV3ReportApi(reportId, formData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to upload V3 report"
      );
    }
  }
);

const collegeAnalysisSlice = createSlice({
  name: "collegeAnalysis",
  initialState: {
    loading: false,
    updateLoading: false,
    error: null,
    requests: [],
    completedReports: [],
    status: "not_started",
    dashboardStats: null,
    draftAnswers: {},
  },
   reducers: {
    clearCollegeAnalysisDraft: (state) => {
      state.draftAnswers = {};
      state.status = "not_started";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCollegeAnalysis.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCollegeAnalysis.fulfilled, (state, action) => {
        state.loading = false;

        const data = action.payload.data || [];
        state.requests = [...data].reverse();

        const { studentId, programId, packageId } =
          action.meta.arg || {};

        const key = `${studentId}_${programId}_${packageId}`;

        if (!state.draftAnswers) {
          state.draftAnswers = {};
        }

        state.draftAnswers[key] = {};

        if (data.length > 0 && data[0].answers) {
          const formatted = {};

          data[0].answers.forEach((ans) => {
            formatted[ans.question_id] = ans.answer_text;
          });

          state.draftAnswers[key] = formatted;
        }
      })
      // .addCase(fetchCollegeAnalysis.fulfilled, (state, action) => {
      //   state.loading = false;

      //   const data = action.payload.data || [];

      //   state.requests = [...data].reverse();

      //   state.draftAnswers = {}; // clear old draft first

      //   if (data.length > 0 && data[0].answers) {
      //     const formatted = {};

      //     data[0].answers.forEach((ans) => {
      //       formatted[ans.question_id] = ans.answer_text;
      //     });

      //     state.draftAnswers = formatted;
      //   }
      // })
      .addCase(fetchCollegeAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(submitAnswers.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitAnswers.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(submitAnswers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(startCollegeAnalysis.pending, (state) => {
        state.loading = true;
      })
      .addCase(startCollegeAnalysis.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(startCollegeAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateAnswers.pending, (state) => {
        state.updateLoading = true;
      })
      .addCase(updateAnswers.fulfilled, (state, action) => {
        state.updateLoading = false;

        const updated = action.payload.data;

        // ✅ update that specific request
        state.requests = state.requests.map((item) =>
          item.id === updated.id ? updated : item
        );
      })
      .addCase(updateAnswers.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchCollegeAnalysisStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCollegeAnalysisStatus.fulfilled, (state, action) => {
        state.loading = false;

        // API response example:
        // { status: "completed" }

        state.status = action.payload.analysis_status;
      })
      .addCase(fetchCollegeAnalysisStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //upload report
      .addCase(uploadAnalysisReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadAnalysisReport.fulfilled, (state, action) => {
        state.loading = false;

        // ✅ Update that specific record
        const updated = action.payload;

        state.requests = state.requests.map((item) =>
          item.id === updated.id
            ? {
              ...item,
              report_status: updated.report_status,
              payment_status: updated.payment_status,
              uploaded_at: updated.uploaded_at,
              status: updated.college_analysis_status,

            }
            : item
        );
      })
      .addCase(uploadAnalysisReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // report get
      .addCase(fetchCompletedReports.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCompletedReports.fulfilled, (state, action) => {
        state.loading = false;

        // 👇 depends on API structure
        state.completedReports = action.payload.data || [];
      })
      .addCase(fetchCompletedReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //update report
      .addCase(updateAnalysisReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAnalysisReport.fulfilled, (state, action) => {
        state.loading = false;

        const updated = action.payload;

        state.completedReports = state.completedReports.map((item) =>
          item.id === updated.report_id
            ? {
              ...item,
              report_status: updated.report_status,
              payment_status: updated.payment_status,
              uploaded_at: updated.uploaded_at,
            }
            : item
        );
      })
      .addCase(updateAnalysisReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchAnalysisDashboard.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAnalysisDashboard.fulfilled, (state, action) => {
        state.loading = false;

        // ✅ store full response
        state.dashboardStats = action.payload.data || action.payload;
      })
      .addCase(fetchAnalysisDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(uploadEngineeringV3Report.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadEngineeringV3Report.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(uploadEngineeringV3Report.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export const { clearCollegeAnalysisDraft } = collegeAnalysisSlice.actions;
export default collegeAnalysisSlice.reducer;