import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createExamApi, updateExamApi, getExamsApi, sendExamForApprovalApi, getExamTrackerApi,startExamApi, getExamStatusApi   } from "../adminApi/examApi";

/* ---------- THUNKS ---------- */

// Create Exam
export const createExam = createAsyncThunk(
  "exam/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await createExamApi(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Create exam failed");
    }
  }
);

// Update Exam
export const updateExam = createAsyncThunk(
  "exam/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await updateExamApi(id, payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Update exam failed");
    }
  }
);

// Fetch Exams
export const fetchExams = createAsyncThunk(
  "exam/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getExamsApi();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Fetch exams failed");
    }
  }
);


// SEND FOR APPROVAL
export const sendExamForApproval = createAsyncThunk(
  "exam/sendForApproval",
  async (studentId, { rejectWithValue }) => {
    try {
      return await sendExamForApprovalApi(studentId);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Send for approval failed"
      );
    }
  }
);


// FETCH EXAM TRACKER (Student)
export const fetchExamTracker = createAsyncThunk(
  "exam/fetchTracker",
  async (studentId, { rejectWithValue }) => {
    try {
      return await getExamTrackerApi(studentId);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Fetch tracker failed"
      );
    }
  }
);

export const startExam = createAsyncThunk(
  "exam/startExam",
  async (studentId, { rejectWithValue }) => {
    try {
      return await startExamApi(studentId);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Start exam failed"
      );
    }
  }
);

// FETCH EXAM STATUS
export const fetchExamStatus = createAsyncThunk(
  "exam/fetchStatus",
  async (studentId, { rejectWithValue }) => {
    try {
      return await getExamStatusApi(studentId);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Fetch exam status failed"
      );
    }
  }
);

/* ---------- SLICE ---------- */
const examSlice = createSlice({
  name: "exam",
  initialState: {
    list: [],
      tracker: null,
          status: null,
    loading: false,
    trackerLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* CREATE */
      .addCase(createExam.pending, (state) => {
        state.loading = true;
      })
      .addCase(createExam.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
      })
      .addCase(createExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* UPDATE */
      .addCase(updateExam.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateExam.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.list.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      })
      .addCase(updateExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* FETCH */
      .addCase(fetchExams.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload || [];
      })
      .addCase(fetchExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* SEND FOR APPROVAL */
.addCase(sendExamForApproval.pending, (state) => {
  state.loading = true;
})
.addCase(sendExamForApproval.fulfilled, (state) => {
  state.loading = false;
})
.addCase(sendExamForApproval.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

/* FETCH TRACKER */
.addCase(fetchExamTracker.pending, (state) => {
  state.trackerLoading = true;
})
.addCase(fetchExamTracker.fulfilled, (state, action) => {
  state.trackerLoading = false;
  state.tracker = action.payload;
})
.addCase(fetchExamTracker.rejected, (state, action) => {
  state.trackerLoading = false;
  state.error = action.payload;
})

/* START EXAM */
.addCase(startExam.pending, (state) => {
  state.loading = true;
})
.addCase(startExam.fulfilled, (state) => {
  state.loading = false;
})
.addCase(startExam.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

/* FETCH EXAM STATUS */
.addCase(fetchExamStatus.pending, (state) => {
  state.loading = true;
})
.addCase(fetchExamStatus.fulfilled, (state, action) => {
  state.loading = false;
  state.tracker = action.payload;   // or store in new state.examStatus
})
.addCase(fetchExamStatus.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
});
  },
});

export default examSlice.reducer;
