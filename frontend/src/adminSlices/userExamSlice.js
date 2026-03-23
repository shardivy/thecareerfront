import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUserExamsApi, approveUserExamApi, rejectUserExamApi, } from "../adminApi/examApi";


/* ================= THUNK ================= */
export const fetchUserExams = createAsyncThunk(
  "userExams/fetchUserExams",
  async (_, { rejectWithValue }) => {
    try {
      return await getUserExamsApi();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch exams"
      );
    }
  }
);

// export const approveUserExam = createAsyncThunk(
//   "userExams/approveUserExam",
//   async (id, { rejectWithValue }) => {
//     try {
//       return await approveUserExamApi(id);
//     } catch (error) {
//       return rejectWithValue(
//         error.response?.data || "Failed to approve exam"
//       );
//     }
//   }
// );

export const approveUserExam = createAsyncThunk(
  "userExams/approveUserExam",
  async ({ id, description }, { rejectWithValue }) => {
    try {
      return await approveUserExamApi(id, description);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to approve exam"
      );
    }
  }
);

export const rejectUserExam = createAsyncThunk(
  "userExams/rejectUserExam",
  async ({ id, description }, { rejectWithValue }) => {
    try {
      return await rejectUserExamApi(id, description);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to reject exam"
      );
    }
  }
);


// export const rejectUserExam = createAsyncThunk(
//   "userExams/rejectUserExam",
//   async (id, { rejectWithValue }) => {
//     try {
//       return await rejectUserExamApi(id);
//     } catch (error) {
//       return rejectWithValue(
//         error.response?.data || "Failed to reject exam"
//       );
//     }
//   }
// );


/* ================= SLICE ================= */
const userExamSlice = createSlice({
  name: "userExams",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserExams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserExams.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload || [];
      })
      .addCase(fetchUserExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //  APPROVE EXAM
      .addCase(approveUserExam.pending, (state) => {
        state.loading = true;
      })
      .addCase(approveUserExam.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(approveUserExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // REJECT EXAM
      .addCase(rejectUserExam.pending, (state) => {
        state.loading = true;
      })
      .addCase(rejectUserExam.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(rejectUserExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

  },
});

export default userExamSlice.reducer;
