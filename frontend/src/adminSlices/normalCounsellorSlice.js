import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchNormalCounsellorsApi } from "../adminApi/counsellorApi";

// ================= THUNK =================
export const fetchNormalCounsellors = createAsyncThunk(
  "counsellors/fetchNormal",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchNormalCounsellorsApi();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch normal counsellors");
    }
  }
);

// ================= SLICE =================
const normalCounsellorSlice = createSlice({
  name: "normalCounsellors",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetNormalCounsellors: (state) => {
      state.list = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNormalCounsellors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNormalCounsellors.fulfilled, (state, action) => {
        state.loading = false;
         state.list = Array.isArray(action.payload?.data) ? action.payload.data : [];
      })
      .addCase(fetchNormalCounsellors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetNormalCounsellors } = normalCounsellorSlice.actions;
export default normalCounsellorSlice.reducer;
