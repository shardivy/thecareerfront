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
  name: "Counsellors",
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
        state.list = (action.payload.data || []).map((c) => ({
          id: c.id,
          name: `${c.first_name} ${c.last_name}`,
        }));
      })
      .addCase(fetchLeadCounsellors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default counsellorSlice.reducer;
