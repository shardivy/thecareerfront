import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createExamApi, updateExamApi, getExamsApi } from "../adminApi/examApi";

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

/* ---------- SLICE ---------- */
const examSlice = createSlice({
  name: "exam",
  initialState: {
    list: [],
    loading: false,
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
      });
  },
});

export default examSlice.reducer;
