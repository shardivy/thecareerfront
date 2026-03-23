import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getSuperadminNotificationsApi, markNotificationAsReadApi  } from "../adminApi/notificationApi";

// 🔔 Async thunk
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getSuperadminNotificationsApi();
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch notifications"
      );
    }
  }
);

// 🔔 MARK AS READ THUNK
export const markNotificationRead = createAsyncThunk(
  "notifications/markNotificationRead",
  async (id, { rejectWithValue }) => {
    try {
      await markNotificationAsReadApi(id);
      return id; // return id so we update state
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to mark as read"
      );
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    // mark single as read
    markAsRead: (state, action) => {
      const id = action.payload;
      const notif = state.list.find((n) => n.id === id);
      if (notif) notif.is_read = true;
    },

    // mark all as read
    markAllAsRead: (state) => {
      state.list = state.list.map((n) => ({
        ...n,
        read: true,
      }));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;

        // adjust based on API response structure
        state.list = action.payload?.data || action.payload || [];
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


        // ✅ HANDLE MARK AS READ
    .addCase(markNotificationRead.fulfilled, (state, action) => {
      const id = action.payload;
      const notif = state.list.find((n) => n.id === id);
      if (notif) {
        notif.is_read = true; // 👈 important (not "read")
      }
    });
  },
});

export const { markAsRead, markAllAsRead } = notificationSlice.actions;
export default notificationSlice.reducer;