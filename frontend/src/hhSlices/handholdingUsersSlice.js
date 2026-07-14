import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchHandholdingUsersApi,
  getHandholdingParticipantsApi,
  getParticipantSessionsApi,
  updateHandholdingParticipantApi,
  getPendingParticipantsApi,
  getCardStatsApi,
  getDashboardStatsApi,
  createHandholdingParticipantApi,
} from "../hhApi/handholdingUsersApi";

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

export const getHandholdingParticipants = createAsyncThunk(
  "handholdingParticipants/get",
  async (_, { rejectWithValue }) => {
    try {
      // console.log("API CALL TRIGGERED");
      return await getHandholdingParticipantsApi();
    } catch (err) {
      return rejectWithValue(err.response?.data || "Something went wrong");
    }
  }
);

export const getParticipantSessions = createAsyncThunk(
  "participantSessions/get",
  async (participantId, { rejectWithValue }) => {
    try {
      return await getParticipantSessionsApi(participantId);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error fetching sessions");
    }
  }
);

export const updateHandholdingParticipant = createAsyncThunk(
  "handholdingUsers/updateParticipant",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await updateHandholdingParticipantApi(id, payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update participant"
      );
    }
  }
);

export const fetchPendingParticipants = createAsyncThunk(
  "handholdingUsers/fetchPendingParticipants",
  async (_, { rejectWithValue }) => {
    try {
      return await getPendingParticipantsApi();
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch pending participants"
      );
    }
  }
);

export const getCardStats = createAsyncThunk(
  "handholdingUsers/getCardStats",
  async (_, { rejectWithValue }) => {
    try {
      return await getCardStatsApi();
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch stats"
      );
    }
  }
);

export const getDashboardStats = createAsyncThunk(
  "handholdingUsers/getDashboardStats",
  async (participantId, { rejectWithValue }) => {
    try {
      return await getDashboardStatsApi(participantId);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch dashboard stats"
      );
    }
  }
);

export const createHandholdingParticipant = createAsyncThunk(
  "handholdingUsers/createParticipant",
  async (payload, { rejectWithValue }) => {
    try {
      return await createHandholdingParticipantApi(payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data ||
        error.response?.data?.message ||
        "Failed to create participant"
      );
    }
  }
);

const handholdingUsersSlice = createSlice({
  name: "handholdingUsers",
  initialState: {
    list: [],
    participants: [],
    participantSessions: null,
    pendingParticipants: [],   // ✅ NEW
    pendingLoading: false,
    createLoading: false,
    dashboardStats: null,
    dashboardStatsLoading: false,
    participantSessionsLoading: false,
    loading: false,
    participantsLoading: false,
    error: null,
    cardStats: null,
    cardStatsLoading: false,
  },
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchHandholdingUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHandholdingUsers.fulfilled, (state, action) => {
        state.loading = false;

        const newData = action.payload?.data || action.payload || [];

        // sort newest first (assuming higher id = latest)
        state.list = newData.sort((a, b) => b.id - a.id);
      })
      .addCase(fetchHandholdingUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getHandholdingParticipants.pending, (state) => {
        state.participantsLoading = true;
      })
      .addCase(getHandholdingParticipants.fulfilled, (state, action) => {
        state.participantsLoading = false;
        state.participants = action.payload?.data || action.payload || [];
      })
      .addCase(getHandholdingParticipants.rejected, (state, action) => {
        state.participantsLoading = false;
        state.error = action.payload;
      })

      // ✅ SESSION JOURNEY API
      .addCase(getParticipantSessions.pending, (state) => {
        state.participantSessionsLoading = true;
      })
      .addCase(getParticipantSessions.fulfilled, (state, action) => {
        state.participantSessionsLoading = false;
        state.participantSessions = action.payload; // ✅ keep full object
      })
      .addCase(getParticipantSessions.rejected, (state, action) => {
        state.participantSessionsLoading = false;
        state.error = action.payload;
      })


      .addCase(updateHandholdingParticipant.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateHandholdingParticipant.fulfilled, (state, action) => {
        state.loading = false;

        // optional: update list instantly (optimistic sync)
        const updated = action.payload?.data || action.payload;

        state.participants = state.participants.map((item) =>
          item.id === updated.id ? updated : item
        );
      })
      .addCase(updateHandholdingParticipant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchPendingParticipants.pending, (state) => {
        state.pendingLoading = true;
      })
      .addCase(fetchPendingParticipants.fulfilled, (state, action) => {
        state.pendingLoading = false;
        state.pendingParticipants =
          action.payload?.data || action.payload || [];
      })
      .addCase(fetchPendingParticipants.rejected, (state, action) => {
        state.pendingLoading = false;
        state.error = action.payload;
      })

      .addCase(getCardStats.pending, (state) => {
        state.cardStatsLoading = true;
      })
      .addCase(getCardStats.fulfilled, (state, action) => {
        state.cardStatsLoading = false;
        state.cardStats = action.payload?.data || action.payload;
      })
      .addCase(getCardStats.rejected, (state, action) => {
        state.cardStatsLoading = false;
        state.error = action.payload;
      })

      .addCase(getDashboardStats.pending, (state) => {
        state.dashboardStatsLoading = true;
      })
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.dashboardStatsLoading = false;
        state.dashboardStats = action.payload?.data || action.payload;
      })
      .addCase(getDashboardStats.rejected, (state, action) => {
        state.dashboardStatsLoading = false;
        state.error = action.payload;
      })

      // CREATE HH USER
      .addCase(createHandholdingParticipant.pending, (state) => {
        state.createLoading = true;
      })
      .addCase(createHandholdingParticipant.fulfilled, (state, action) => {
        state.createLoading = false;

        const newParticipant =
          action.payload?.data || action.payload;

        state.participants.unshift(newParticipant);
      })
      .addCase(createHandholdingParticipant.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
  },
});

export default handholdingUsersSlice.reducer;