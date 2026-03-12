import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getHobbiesApi } from "../adminApi/hobbyApi";

// ============================
// 🔹 FETCH HOBBIES
// ============================
export const fetchHobbies = createAsyncThunk(
  "hobbies/fetchHobbies",
  async (_, { rejectWithValue }) => {
    try {
      return await getHobbiesApi();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch hobbies"
      );
    }
  }
);

const hobbySlice = createSlice({
  name: "hobbies",
  initialState: {
    hobbyList: [],
    loading: false,
    error: null,
  },
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchHobbies.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHobbies.fulfilled, (state, action) => {
        state.loading = false;
        state.hobbyList = action.payload || [];
      })
      .addCase(fetchHobbies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default hobbySlice.reducer;