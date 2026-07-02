// src/adminSlices/packageSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getPackagesApi,
  createPackageApi,
  updatePackageApi,
  getPackagesByProgramApi,
  getProgramPackageDetailsApi,
  getPackagesByMultipleProgramsApi,
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
      // console.log("API response:", response);
      return response.data.packages; // ✅ FIX
    } catch {
      return rejectWithValue("Failed to fetch packages");
    }
  }
);


export const fetchPackagesByMultiplePrograms = createAsyncThunk(
  "packages/fetchByMultiplePrograms",
  async (programIds, { rejectWithValue }) => {
    try {
      const response =
        await getPackagesByMultipleProgramsApi(programIds);

      const programs = response?.data || [];

      const allPackages = programs.flatMap(
        (program) => program.packages || []
      );

      return {
        packages: allPackages,
        programsData: programs,
      };
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

/* FETCH SINGLE PROGRAM PACKAGE DETAILS */
export const fetchProgramPackageDetails = createAsyncThunk(
  "packages/fetchProgramPackageDetails",
  async ({ programId, packageId }, { rejectWithValue }) => {
    try {
      return await getProgramPackageDetailsApi(programId, packageId);
    } catch {
      return rejectWithValue("Failed to fetch package details");
    }
  }
);

const packageSlice = createSlice({
  name: "packages",
  initialState: {
    list: [],
    programsData: [],
    loading: false,
    error: null,
    selectedPackage: null,
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
      // .addCase(fetchPackages.fulfilled, (state, action) => {
      //   state.loading = false;
      //   state.list = action.payload?.data || [];
      // })

      .addCase(fetchPackages.fulfilled, (state, action) => {
        state.loading = false;

        const packages = action.payload?.data || [];

        // 🔥 Sort alphabetically by name
        packages.sort((a, b) =>
          a.name?.localeCompare(b.name, undefined, { sensitivity: "base" })
        );

        state.list = packages;
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

      //  fetch by multi program
      .addCase(fetchPackagesByMultiplePrograms.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchPackagesByMultiplePrograms.fulfilled,
        (state, action) => {
          state.loading = false;
          state.list = action.payload.packages || [];
          state.programsData = action.payload.programsData || [];
        }
      )
      .addCase(
        fetchPackagesByMultiplePrograms.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )

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
      })

      /* FETCH SINGLE PACKAGE DETAILS */
      .addCase(fetchProgramPackageDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProgramPackageDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPackage = action.payload?.data || action.payload;
      })
      .addCase(fetchProgramPackageDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPackages } = packageSlice.actions;
export default packageSlice.reducer;