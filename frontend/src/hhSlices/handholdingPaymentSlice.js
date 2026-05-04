import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getHandholdingPaymentDetailsApi,
   getHandholdingSummaryApi ,
  getPaymentProgressApi ,
  sendHandholdingPaymentReminderApi ,
    getHandholdingReceiptApi
 } from "../hhApi/handholdingPaymentsApi";

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

export const fetchPaymentProgress = createAsyncThunk(
  "handholdingPayment/fetchProgress",
  async (participantId, { rejectWithValue }) => {
    try {
      const res = await getPaymentProgressApi(participantId);
      return res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch payment progress"
      );
    }
  }
);

export const sendHandholdingPaymentReminder = createAsyncThunk(
  "handholdingPayment/sendReminder",
  async (participantId, { rejectWithValue }) => {
    try {
      const res = await sendHandholdingPaymentReminderApi(participantId);
      return res;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to send reminder"
      );
    }
  }
);

export const fetchHandholdingReceipt = createAsyncThunk(
  "handholdingPayment/fetchReceipt",
  async (participantId, { rejectWithValue }) => {
    try {
      const res = await getHandholdingReceiptApi(participantId);
      return res; // blob
    } catch (err) {
      return rejectWithValue("Failed to fetch receipt");
    }
  }
);

// 🔥 SLICE
const handholdingPaymentSlice = createSlice({
  name: "handholdingPayment",
  initialState: {
    details: null,
      data: null,
       progress: null, 
       receiptLoading: false,
receiptError: null,
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
      })

      .addCase(fetchPaymentProgress.pending, (state) => {
  state.loading = true;
})
.addCase(fetchPaymentProgress.fulfilled, (state, action) => {
  state.loading = false;
  state.progress = action.payload;
})
.addCase(fetchPaymentProgress.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

.addCase(sendHandholdingPaymentReminder.pending, (state) => {
  state.loading = true;
})
.addCase(sendHandholdingPaymentReminder.fulfilled, (state) => {
  state.loading = false;
})
.addCase(sendHandholdingPaymentReminder.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

.addCase(fetchHandholdingReceipt.pending, (state) => {
  state.receiptLoading = true;
})
.addCase(fetchHandholdingReceipt.fulfilled, (state) => {
  state.receiptLoading = false;
})
.addCase(fetchHandholdingReceipt.rejected, (state, action) => {
  state.receiptLoading = false;
  state.receiptError = action.payload;
})
  },
});

export const { clearHandholdingDetails } = handholdingPaymentSlice.actions;

export default handholdingPaymentSlice.reducer;