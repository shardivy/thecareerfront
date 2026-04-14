import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createHHSessionApi,
  updateHHSessionApi,
  deleteHHSessionApi,
  getHHSessionApi,
} from "../hhApi/handholdingSessionApi";

/* ================= CREATE ================= */
export const createHHSession = createAsyncThunk(
  "hhSession/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createHHSessionApi(payload);
      return res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Create failed" }
      );
    }
  }
);

/* ================= UPDATE ================= */
export const updateHHSession = createAsyncThunk(
  "hhSession/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await updateHHSessionApi(id, payload);
      return res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Update failed" }
      );
    }
  }
);



/* ================= DELETE ================= */
export const deleteHHSession = createAsyncThunk(
  "hhSession/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await deleteHHSessionApi(id);
      return { id, ...res }; // return id for UI update
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Delete failed" }
      );
    }
  }
);

/* ================= GET ================= */
export const getHHSession = createAsyncThunk(
  "hhSession/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getHHSessionApi();
      return res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Fetch failed" }
      );
    }
  }
);


/* ================= SLICE ================= */
const handholdingSessionSlice = createSlice({
  name: "hhSession",
  initialState: {
    loading: false,
    error: null,
     sessions: [],
  },
  reducers: {},

  extraReducers: (builder) => {
    builder

      /* CREATE */
      .addCase(createHHSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(createHHSession.fulfilled, (state, action) => {
        state.loading = false;
        const newSession = action.payload?.data || action.payload;
        if (newSession) {
          state.sessions = Array.isArray(state.sessions)
            ? [newSession, ...state.sessions]
            : [newSession];
        }
      })
      .addCase(createHHSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* UPDATE */
      .addCase(updateHHSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateHHSession.fulfilled, (state, action) => {
        state.loading = false;
        const updatedSession = action.payload?.data || action.payload;
        if (updatedSession?.id) {
          state.sessions = state.sessions.map((session) =>
            session.id === updatedSession.id ? updatedSession : session
          );
        }
      })
      .addCase(updateHHSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* DELETE */
.addCase(deleteHHSession.pending, (state) => {
  state.loading = true;
})
.addCase(deleteHHSession.fulfilled, (state, action) => {
  state.loading = false;
  state.sessions = state.sessions.filter(
    (session) => session.id !== action.payload?.id
  );
})
.addCase(deleteHHSession.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

/* GET */
.addCase(getHHSession.pending, (state) => {
  state.loading = true;
})
.addCase(getHHSession.fulfilled, (state, action) => {
  state.loading = false;
  state.sessions = action.payload?.data || action.payload; 
  // ⚠️ depends on API response format
})
.addCase(getHHSession.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
});
  },
});

export default handholdingSessionSlice.reducer;
