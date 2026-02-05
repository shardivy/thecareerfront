// src/adminSlices/packageSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getPackagesApi,
  createPackageApi,
  updatePackageApi,
  getPackagesByProgramApi,
} from "../adminApi/packageApi";

/* FETCH ALL PACKAGES */
export const fetchPackages = createAsyncThunk(
  "packages/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await getPackagesApi();
    } catch (error) {
      return rejectWithValue("Failed to load packages");
    }
  }
);

/* FETCH PACKAGES BY PROGRAM */
export const fetchPackagesByProgram = createAsyncThunk(
  "packages/fetchByProgram",
  async (programId, { rejectWithValue }) => {
    try {
      const response = await getPackagesByProgramApi(programId);
      return response.data.packages; // ✅ FIX
    } catch {
      return rejectWithValue("Failed to fetch packages");
    }
  }
);


/* CREATE PACKAGE */
export const createPackage = createAsyncThunk(
  "packages/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await createPackageApi(payload);
    } catch {
      return rejectWithValue("Failed to create package");
    }
  }
);

/* UPDATE PACKAGE */
export const updatePackage = createAsyncThunk(
  "packages/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await updatePackageApi(id, payload);
    } catch {
      return rejectWithValue("Failed to update package");
    }
  }
);

const packageSlice = createSlice({
  name: "packages",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    /* ✅ NOW clearPackages EXISTS */
    clearPackages: (state) => {
      state.list = [];
    },
  },
  extraReducers: (builder) => {
    builder
      /* FETCH ALL */
      .addCase(fetchPackages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload?.data || [];
      })
      .addCase(fetchPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ✅ FETCH BY PROGRAM */
    .addCase(fetchPackagesByProgram.pending, (state) => {
        state.loading = true;
        state.list = [];
      })
      .addCase(fetchPackagesByProgram.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload; // ✅ ARRAY
      })
      .addCase(fetchPackagesByProgram.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* CREATE */
      .addCase(createPackage.fulfilled, (state, action) => {
        if (action.payload?.data) {
          state.list.unshift(action.payload.data);
        }
      })

      /* UPDATE */
      .addCase(updatePackage.fulfilled, (state, action) => {
        const updated = action.payload?.data;
        if (!updated) return;
        const index = state.list.findIndex((p) => p.id === updated.id);
        if (index !== -1) state.list[index] = updated;
      });
  },
});

export const { clearPackages } = packageSlice.actions;
export default packageSlice.reducer;