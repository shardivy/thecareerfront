import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getStreamsApi, createStreamApi, updateStreamApi, deleteStreamApi } from "../adminApi/streamApi";

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

// used in Stream tab 
export const createStream = createAsyncThunk(
  "streams/createStream",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await createStreamApi(payload);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to create stream"
      );
    }
  }
);

export const updateStream = createAsyncThunk(
  "streams/updateStream",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await updateStreamApi(id, payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update stream"
      );
    }
  }
);

export const deleteStream = createAsyncThunk(
  "streams/deleteStream",
  async (id, { rejectWithValue }) => {
    try {
      await deleteStreamApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to delete stream"
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
      })

      // create stream
      .addCase(createStream.pending, (state) => {
        state.createLoading = true;
      })

      .addCase(createStream.fulfilled, (state, action) => {
        state.createLoading = false;

        // if API returns created object
        state.streamList.push(action.payload);
      })

      .addCase(createStream.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })

      .addCase(deleteStream.pending, (state) => {
        state.loading = true;
      })

      .addCase(deleteStream.fulfilled, (state, action) => {
        state.loading = false;

        state.streamList = state.streamList.filter(
          (stream) => stream.id !== action.payload
        );
      })

      .addCase(deleteStream.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export default streamSlice.reducer;