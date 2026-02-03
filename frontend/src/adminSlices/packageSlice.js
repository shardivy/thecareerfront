// src/adminSlices/packageSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getPackagesApi, createPackageApi, updatePackageApi } from "../adminApi/packageApi";

// -------- FETCH PACKAGES --------
export const fetchPackages = createAsyncThunk(
  "packages/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getPackagesApi();
      return res;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to load packages");
    }
  }
);

// -------- CREATE PACKAGE --------
export const createPackage = createAsyncThunk(
  "packages/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createPackageApi(payload);
      return res;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create package");
    }
  }
);

// -------- UPDATE PACKAGE --------
export const updatePackage = createAsyncThunk(
  "packages/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await updatePackageApi(id, payload);
      return res;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update package");
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchPackages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload?.data) ? action.payload.data : [];
      })
      .addCase(fetchPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE
      .addCase(createPackage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPackage.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.data) state.list.unshift(action.payload.data);
      })
      .addCase(createPackage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE
      .addCase(updatePackage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePackage.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.data) {
          const index = state.list.findIndex(pkg => pkg.id === action.payload.data.id);
          if (index !== -1) state.list[index] = action.payload.data;
        }
      })
      .addCase(updatePackage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default packageSlice.reducer;
