import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getProgramsApi,
  addProgramApi,
  updateProgramApi,
  getProgramStatsApi, // ✅ import new API
} from "../adminApi/programApi";

// ------------------- FETCH PROGRAMS -------------------
export const fetchPrograms = createAsyncThunk(
  "programs/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getProgramsApi();
      return res;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to load programs");
    }
  }
);

// ------------------- ADD PROGRAM -------------------
export const addProgram = createAsyncThunk(
  "programs/add",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await addProgramApi(payload);
      return res;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to add program");
    }
  }
);

// ------------------- UPDATE PROGRAM -------------------
export const updateProgram = createAsyncThunk(
  "programs/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await updateProgramApi(id, payload);
      return res;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update program");
    }
  }
);

// ------------------- FETCH DASHBOARD STATS -------------------
export const fetchProgramStats = createAsyncThunk(
  "programs/stats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getProgramStatsApi();
      return res; // { total_programs, total_packages, total_enrolled, revenue }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to load stats");
    }
  }
);

// ------------------- SLICE -------------------
const programSlice = createSlice({
  name: "programs",
  initialState: {
    list: [],
    loading: false,
    error: null,
    stats: { total_programs: 0, total_packages: 0, total_enrolled: 0, revenue: 0 },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH PROGRAMS
      .addCase(fetchPrograms.pending, (state) => { state.loading = true; })
      .addCase(fetchPrograms.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload?.data) ? action.payload.data : [];
      })
      .addCase(fetchPrograms.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // ADD PROGRAM
      .addCase(addProgram.pending, (state) => { state.loading = true; })
      .addCase(addProgram.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.data) state.list.unshift(action.payload.data);
      })
      .addCase(addProgram.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // UPDATE PROGRAM
      .addCase(updateProgram.pending, (state) => { state.loading = true; })
      .addCase(updateProgram.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.data) {
          const index = state.list.findIndex(p => p.id === action.payload.data.id);
          if (index !== -1) state.list[index] = action.payload.data;
        }
      })
      .addCase(updateProgram.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // FETCH DASHBOARD STATS
      .addCase(fetchProgramStats.pending, (state) => { state.loading = true; })
      .addCase(fetchProgramStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload; // assign dashboard stats
      })
      .addCase(fetchProgramStats.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export default programSlice.reducer;
