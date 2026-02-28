import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getStreamsApi } from "../adminApi/enquiryApi"; 

// ================= THUNK =================

export const fetchStreams = createAsyncThunk(
  "streams/fetchStreams",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getStreamsApi();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch streams"
      );
    }
  }
);

// ================= SLICE =================

const streamSlice = createSlice({
  name: "streams",
  initialState: {
    streamList: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStreams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStreams.fulfilled, (state, action) => {
        state.loading = false;
       state.streamList = Array.isArray(action.payload)
  ? action.payload
  : action.payload?.data || [];
      })
      .addCase(fetchStreams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default streamSlice.reducer;