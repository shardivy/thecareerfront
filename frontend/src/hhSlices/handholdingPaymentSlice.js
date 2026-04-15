import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getHandholdingPaymentDetailsApi, getHandholdingSummaryApi  } from "../hhApi/handholdingPaymentsApi";

// 🔥 THUNK
export const fetchHandholdingPaymentDetails = createAsyncThunk(
  "handholdingPayment/fetchDetails",
  async (participantId, { rejectWithValue }) => {
    try {
      const res = await getHandholdingPaymentDetailsApi(participantId);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Something went wrong");
    }
  }
);

export const fetchHandholdingSummary = createAsyncThunk(
  "handholdingSummary/fetch",
  async ({ participantId, packageId }, { rejectWithValue }) => {
    try {
      const res = await getHandholdingSummaryApi(
        participantId,
        packageId
      );
      return res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Something went wrong"
      );
    }
  }
);

// 🔥 SLICE
const handholdingPaymentSlice = createSlice({
  name: "handholdingPayment",
  initialState: {
    details: null,
      data: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearHandholdingDetails: (state) => {
      state.details = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHandholdingPaymentDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHandholdingPaymentDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.details = action.payload;
      })
      .addCase(fetchHandholdingPaymentDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

       .addCase(fetchHandholdingSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHandholdingSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchHandholdingSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearHandholdingDetails } = handholdingPaymentSlice.actions;

export default handholdingPaymentSlice.reducer;