// src/adminSlices/counsellorSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchLeadCounsellorsApi } from "../adminApi/counsellorApi"; 

/* ================= THUNK ================= */

export const fetchLeadCounsellors = createAsyncThunk(
  "leadCounsellors/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchLeadCounsellorsApi();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch lead counsellors"
      );
    }
  }
);

/* ================= SLICE ================= */

const counsellorSlice = createSlice({
  name: "counsellors", // Make sure this matches what you're using in useSelector
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeadCounsellors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeadCounsellors.fulfilled, (state, action) => {
        state.loading = false;
        // Transform the API response to match what the component expects
        if (Array.isArray(action.payload)) {
          // If payload is already an array
          state.list = action.payload.map((c) => ({
            id: c.user?.id || c.id,
            name: `${c.user?.first_name || c.first_name} ${c.user?.last_name || c.last_name}`,
            // email: c.user?.email || c.email,
          }));
        } else if (action.payload?.data) {
          // If payload has a data property
          state.list = action.payload.data.map((c) => ({
            id: c.user?.id || c.id,
            name: `${c.user?.first_name || c.first_name} ${c.user?.last_name || c.last_name}`,
            // email: c.user?.email || c.email,
          }));
        } else {
          state.list = [];
        }
      })
      .addCase(fetchLeadCounsellors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default counsellorSlice.reducer;