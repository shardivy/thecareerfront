import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createEventApi,
  getEventsApi,
  updateEventApi,
  sendReminderApi,
  getEventDashboardCountApi,
  markEventCompletedApi,
} from "../adminApi/eventApi";

// CREATE EVENT
export const createEvent = createAsyncThunk(
  "event/createEvent",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createEventApi(data);
      return res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to create event"
      );
    }
  }
);


// GET EVENTS
export const getEvents = createAsyncThunk(
  "event/getEvents",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getEventsApi();
      return res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to fetch events"
      );
    }
  }
);


// UPDATE EVENT
export const updateEvent = createAsyncThunk(
  "event/updateEvent",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateEventApi(id, data);
      return res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to update event"
      );
    }
  }
);

export const sendReminder = createAsyncThunk(
  "event/sendReminder",
  async (id, { rejectWithValue }) => {
    try {
      const res = await sendReminderApi(id);
      return res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to send reminder"
      );
    }
  }
);

export const getEventDashboardCount = createAsyncThunk(
  "event/getEventDashboardCount",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getEventDashboardCountApi();
      return res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to fetch dashboard count"
      );
    }
  }
);

export const markEventCompleted = createAsyncThunk(
  "event/markEventCompleted",
  async (id, { rejectWithValue }) => {
    try {
      const res = await markEventCompletedApi(id);
      return res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to mark completed"
      );
    }
  }
);

const eventSlice = createSlice({
  name: "event",
  initialState: {
    loading: false,
    createLoading: false,
    updateLoading: false,
    completeLoading: false,
    eventList: [],
    dashboardCount: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createEvent.pending, (state) => {
        state.createLoading = true;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.createLoading = false;
        state.eventList.push(action.payload);
      })
      .addCase(createEvent.rejected, (state) => {
        state.createLoading = false;
      })

      // GET
      .addCase(getEvents.pending, (state) => {
        state.loading = true;
      })
      .addCase(getEvents.fulfilled, (state, action) => {
        state.loading = false;

        const events = action.payload?.data || action.payload || [];

        // ✅ SORT: upcoming first, completed last
        state.eventList = events.sort((a, b) => {
          if (a.session_status === "completed" && b.session_status !== "completed") {
            return 1;
          }
          if (a.session_status !== "completed" && b.session_status === "completed") {
            return -1;
          }
          return 0;
        });
      })
      .addCase(getEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateEvent.pending, (state) => {
        state.updateLoading = true;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.updateLoading = false;

        const index = state.eventList.findIndex(
          (item) => item.id === action.payload.id
        );

        if (index !== -1) {
          state.eventList[index] = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state) => {
        state.updateLoading = false;
      })

      .addCase(sendReminder.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendReminder.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendReminder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getEventDashboardCount.pending, (state) => {
        state.loading = true;
      })
      .addCase(getEventDashboardCount.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardCount = action.payload?.data;
      })
      .addCase(getEventDashboardCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(markEventCompleted.pending, (state) => {
        state.completeLoading = true;
      })
      .addCase(markEventCompleted.fulfilled, (state, action) => {
        state.completeLoading = false;

        const index = state.eventList.findIndex(
          (item) => item.id === action.meta.arg
        );

        if (index !== -1) {
          state.eventList[index].session_status = "completed";
        }
      })
      .addCase(markEventCompleted.rejected, (state) => {
        state.completeLoading = false;
      })
  },
});

export default eventSlice.reducer;