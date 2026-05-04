import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { bookCounsellingSlotApi,
   getCounsellingBookingsApi,
   updateCounsellingBookingApi, 
   getCounsellingSessionCountApi, 
   deleteCounsellingBookingApi,
   markCounsellingBookingCompletedApi , 
   getStudentCounsellingBookingsApi, 
   cancelCounsellingBookingApi ,
  sendCounsellingReminderApi  } from "../adminApi/counsellingBookingApi";

/* ================= THUNK ================= */
export const bookCounsellingSlot = createAsyncThunk(
  "counsellingBooking/book",
  async (payload, { rejectWithValue }) => {
    try {
      return await bookCounsellingSlotApi(payload);
    } catch (error) {
      // Extract first error from backend response
      const backendError =
        error?.response?.data?.error?.[0] || 
        error?.response?.data?.message || 
        "Slot booking failed";
      return rejectWithValue(backendError);
    }
  }
);


/* ================= GET BOOKINGS ================= */
export const fetchCounsellingBookings = createAsyncThunk(
  "counsellingBooking/list",
  async (_, { rejectWithValue }) => {
    try {
      return await getCounsellingBookingsApi();
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch bookings"
      );
    }
  }
);


export const updateCounsellingBooking = createAsyncThunk(
  "counsellingBooking/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await updateCounsellingBookingApi(id, payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Update failed"
      );
    }
  }
);

export const fetchCounsellingSessionCount = createAsyncThunk(
  "counsellingBooking/stats",
  async (period, { rejectWithValue }) => {
    try {
      return await getCounsellingSessionCountApi(period);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch session stats"
      );
    }
  }
);


/* ================= DELETE ================= */
export const deleteCounsellingBooking = createAsyncThunk(
  "counsellingBooking/delete",
  async (id, { rejectWithValue }) => {
    try {
      return await deleteCounsellingBookingApi(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Delete failed"
      );
    }
  }
);


/* ================= MARK AS COMPLETED ================= */
export const markCounsellingBookingCompleted = createAsyncThunk(
  "counsellingBooking/markCompleted",
  async (id, { rejectWithValue }) => {
    try {
      return await markCounsellingBookingCompletedApi(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to mark as completed"
      );
    }
  }
);

// Get counselling bookings for a specific student
export const fetchStudentCounsellingBookings = createAsyncThunk(
  "counsellingBooking/fetchStudentBookings",
  async (studentId, { rejectWithValue }) => {
    try {
      return await getStudentCounsellingBookingsApi(studentId);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch bookings"
      );
    }
  }
);

export const cancelCounsellingBooking = createAsyncThunk(
  "counsellingBooking/cancel",
  async (id, { rejectWithValue }) => {
    try {
      return await cancelCounsellingBookingApi(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Cancel failed"
      );
    }
  }
);

export const sendCounsellingReminder = createAsyncThunk(
  "counsellingBooking/sendReminder",
  async (id, { rejectWithValue }) => {
    try {
      return await sendCounsellingReminderApi(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to send reminder"
      );
    }
  }
);

/* ================= SLICE ================= */
const counsellingBookingSlice = createSlice({
  name: "counsellingBooking",
  initialState: {
    loading: false,
    success: false,
    error: null,
    data: [],
    stats: null,          // 👈 ADD THIS
  statsLoading: false,
  },
  reducers: {
    resetBookingState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bookCounsellingSlot.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(bookCounsellingSlot.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })
      .addCase(bookCounsellingSlot.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

       /* LIST */
      .addCase(fetchCounsellingBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCounsellingBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload?.data || [];
      })
      .addCase(fetchCounsellingBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= UPDATE ================= */
.addCase(updateCounsellingBooking.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(updateCounsellingBooking.fulfilled, (state) => {
  state.loading = false;
  state.success = true;
})
.addCase(updateCounsellingBooking.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

/* ================= STATS ================= */
.addCase(fetchCounsellingSessionCount.pending, (state) => {
  state.statsLoading = true;
})
.addCase(fetchCounsellingSessionCount.fulfilled, (state, action) => {
  state.statsLoading = false;
  state.stats = action.payload;
})
.addCase(fetchCounsellingSessionCount.rejected, (state, action) => {
  state.statsLoading = false;
  state.error = action.payload;
})

/* ================= DELETE ================= */
.addCase(deleteCounsellingBooking.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(deleteCounsellingBooking.fulfilled, (state, action) => {
  state.loading = false;
  state.success = true;

  // Remove deleted booking from table instantly
  const deletedId = action.meta.arg;
  state.data = state.data.filter(item => item.id !== deletedId);
})
.addCase(deleteCounsellingBooking.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})


// Inside extraReducers
.addCase(markCounsellingBookingCompleted.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(markCounsellingBookingCompleted.fulfilled, (state, action) => {
  state.loading = false;
  state.success = true;

  // Update local state if needed (e.g., mark booking completed in table)
  const completedId = action.meta.arg;
  state.data = state.data.map(item =>
    item.id === completedId ? { ...item, status: "completed" } : item
  );
})
.addCase(markCounsellingBookingCompleted.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

// Get student bookings
.addCase(fetchStudentCounsellingBookings.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(fetchStudentCounsellingBookings.fulfilled, (state, action) => {
  state.loading = false;
  state.data = action.payload?.data || [];
})
.addCase(fetchStudentCounsellingBookings.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

/* ================= CANCEL ================= */
.addCase(cancelCounsellingBooking.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(cancelCounsellingBooking.fulfilled, (state, action) => {
  state.loading = false;
  state.success = true;

  const cancelledId = action.meta.arg;

  // Update status instead of removing
  state.data = state.data.map(item =>
    item.id === cancelledId
      ? { ...item, status: "cancelled" }
      : item
  );
})
.addCase(cancelCounsellingBooking.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

/* ================= SEND REMINDER ================= */
.addCase(sendCounsellingReminder.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(sendCounsellingReminder.fulfilled, (state) => {
  state.loading = false;
  state.success = true;
})
.addCase(sendCounsellingReminder.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})
  },
});

export const { resetBookingState } = counsellingBookingSlice.actions;
export default counsellingBookingSlice.reducer;
