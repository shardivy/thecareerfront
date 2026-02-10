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
  if (Array.isArray(action.payload)) {
    state.list = action.payload.map((c) => ({
      id: c.id || c.id,        // ✅ use user.id here
      first_name: c.user?.first_name || "",
      last_name: c.user?.last_name || "",
      email: c.user?.email || "",
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