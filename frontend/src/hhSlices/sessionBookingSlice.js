import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getSessionBookingsApi, 
  fetchBookedRescheduledApi , 
  bookHandholdingSessionApi,
  rescheduleSessionApi,
cancelSessionApi ,
markSessionCompletedApi,
getParticipantSessionsApi,
  sendHandholdingReminderApi
} from "../hhApi/sessionBookingApi";

/* ================= THUNK ================= */
export const getSessionBookings = createAsyncThunk(
  "sessionBookings/get",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getSessionBookingsApi();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Something went wrong");
    }
  }
);

/* ================= THUNK ================= */
export const fetchBookedRescheduled = createAsyncThunk(
  "handholdingBookedRescheduled/fetch",
  async (date, { rejectWithValue }) => {
    try {
      const data = await fetchBookedRescheduledApi(date);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch booked/rescheduled data"
      );
    }
  }
);

export const bookHandholdingSession = createAsyncThunk(
  "handholdingSession/book",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await bookHandholdingSessionApi(payload);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to book session"
      );
    }
  }
);

export const rescheduleSession = createAsyncThunk(
  "handholdingSession/reschedule",
  async (body, { rejectWithValue }) => {
    try {
      const data = await rescheduleSessionApi(body);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to reschedule session"
      );
    }
  }
);

export const cancelSession = createAsyncThunk(
  "handholdingSession/cancel",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await cancelSessionApi(payload);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to cancel session"
      );
    }
  }
);

export const markSessionCompleted = createAsyncThunk(
  "handholdingSession/markCompleted",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await markSessionCompletedApi(payload);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to mark session completed"
      );
    }
  }
);

export const getParticipantSessions = createAsyncThunk(
  "sessionBookings/getParticipantSessions",
  async (participantId, { rejectWithValue }) => {
    try {
      const data = await getParticipantSessionsApi(participantId);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch participant sessions"
      );
    }
  }
);

export const sendHandholdingReminder = createAsyncThunk(
  "handholdingSession/sendReminder",
  async ({ participantId, sessionNo }, { rejectWithValue }) => {
    try {
      const data = await sendHandholdingReminderApi(
        participantId,
        sessionNo
      );
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to send reminder"
      );
    }
  }
);

/* ================= SLICE ================= */
const sessionBookingSlice = createSlice({
  name: "sessionBookings",
  initialState: {
    list: [],
    bookedRescheduledList: [],
    participantSessions: [], 
      totalSessions: 0,
    loading: false,
    error: null,
  },
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(getSessionBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(getSessionBookings.fulfilled, (state, action) => {
        state.loading = false;

        // 👇 adjust depending on API response
        state.list = action.payload?.data || action.payload || [];
      })
      .addCase(getSessionBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchBookedRescheduled.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBookedRescheduled.fulfilled, (state, action) => {
        state.loading = false;
        state.bookedRescheduledList =
          action.payload?.data || action.payload || [];
      })
      .addCase(fetchBookedRescheduled.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(bookHandholdingSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(bookHandholdingSession.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(bookHandholdingSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(rescheduleSession.pending, (state) => {
  state.loading = true;
})
.addCase(rescheduleSession.fulfilled, (state) => {
  state.loading = false;
})
.addCase(rescheduleSession.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

.addCase(cancelSession.pending, (state) => {
  state.loading = true;
})
.addCase(cancelSession.fulfilled, (state) => {
  state.loading = false;
})
.addCase(cancelSession.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

.addCase(markSessionCompleted.pending, (state) => {
  state.loading = true;
})
.addCase(markSessionCompleted.fulfilled, (state) => {
  state.loading = false;
})
.addCase(markSessionCompleted.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

.addCase(getParticipantSessions.pending, (state) => {
  state.loading = true;
})
.addCase(getParticipantSessions.fulfilled, (state, action) => {
  state.loading = false;
  state.participantSessions = action.payload?.data || action.payload || [];
    state.totalSessions = action.payload.total_sessions;
})
.addCase(getParticipantSessions.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

.addCase(sendHandholdingReminder.pending, (state) => {
  state.loading = true;
})
.addCase(sendHandholdingReminder.fulfilled, (state) => {
  state.loading = false;
})
.addCase(sendHandholdingReminder.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})
  },
});

export default sessionBookingSlice.reducer;