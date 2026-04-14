import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchHandholdingUsersApi } from "../hhApi/handholdingUsersApi";

// ✅ THUNK
export const fetchHandholdingUsers = createAsyncThunk(
  "handholdingUsers/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchHandholdingUsersApi();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch handholding users"
      );
    }
  }
);

const handholdingUsersSlice = createSlice({
  name: "handholdingUsers",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchHandholdingUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHandholdingUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload?.data || action.payload || [];
      })
      .addCase(fetchHandholdingUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default handholdingUsersSlice.reducer;