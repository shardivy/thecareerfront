import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { bookCounsellingSlotApi, getCounsellingBookingsApi,updateCounsellingBookingApi, getCounsellingSessionCountApi, } from "../adminApi/counsellingBookingApi";

/* ================= THUNK ================= */
export const bookCounsellingSlot = createAsyncThunk(
  "counsellingBooking/book",
  async (payload, { rejectWithValue }) => {
    try {
      return await bookCounsellingSlotApi(payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Slot booking failed"
      );
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
});


  },
});

export const { resetBookingState } = counsellingBookingSlice.actions;
export default counsellingBookingSlice.reducer;
