import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { bookCounsellingSlotApi } from "../adminApi/counsellingBookingApi";

/* ================= THUNK ================= */
export const bookCounsellingSlot = createAsyncThunk(
  "counselling/bookSlot",
  async (payload, { rejectWithValue }) => {
    try {
      return await bookCounsellingSlotApi(payload);
    } catch (error) {
      return rejectWithValue(error.response?.data || "Booking failed");
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
    data: null,
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
        state.error = null;
      })
      .addCase(bookCounsellingSlot.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })
      .addCase(bookCounsellingSlot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetBookingState } = counsellingBookingSlice.actions;
export default counsellingBookingSlice.reducer;