import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  submitPaymentApi,
  fetchPaymentStatsApi,
  fetchPaymentsApi,
  verifyPaymentApi,
  updatePaymentApi,
} from "../adminApi/paymentApi";

/* ================= SUBMIT PAYMENT ================= */
export const submitPayment = createAsyncThunk(
  "payment/submit",
  async (payload, { rejectWithValue }) => {
    try {
      return await submitPaymentApi(payload);
    } catch (error) {
      return rejectWithValue(error.response?.data || "Payment failed");
    }
  }
);

/* ================= FETCH PAYMENT STATS ================= */
export const fetchPaymentStats = createAsyncThunk(
  "payment/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchPaymentStatsApi();
    } catch (error) {
      return rejectWithValue(error.response?.data || "Stats fetch failed");
    }
  }
);

/* ================= FETCH PAYMENT LIST ================= */
export const fetchPayments = createAsyncThunk(
  "payment/fetchList",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchPaymentsApi();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch payments"
      );
    }
  }
);

// ================= VERIFY PAYMENT =================
export const verifyPayment = createAsyncThunk(
  "payment/verify",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await verifyPaymentApi(id, payload);

      // Check if backend returned success false
      if (!response.success) {
        // Reject with backend error
        return rejectWithValue(response.error);
      }

      return response; // success true
    } catch (error) {
      return rejectWithValue(error.response?.data?.error);
    }
  }
);

// ================= UPDATE PAYMENT =================
export const updatePayment = createAsyncThunk(
  "payment/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await updatePaymentApi(id, payload);

      if (!response.success) {
        return rejectWithValue(response.error || "Update failed");
      }

      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Update failed");
    }
  }
);

/* ================= SLICE ================= */
const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    loading: false,
    success: false,
    error: null,

    // 👇 NEW
    statsLoading: false,
    statsError: null,
    stats: null,

  listLoading: false,
  listError: null,
  list: [],
  },
  reducers: {
    resetPaymentState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* ----- submit payment ----- */
      .addCase(submitPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitPayment.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(submitPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ----- payment stats ----- */
      .addCase(fetchPaymentStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchPaymentStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        // API may return { success: true, data: { ... } } or raw object/array
        state.stats = action.payload?.data ?? action.payload;
      })
      .addCase(fetchPaymentStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload;
      })

      /* ----- payment list ----- */
.addCase(fetchPayments.pending, (state) => {
  state.listLoading = true;
})
.addCase(fetchPayments.fulfilled, (state, action) => {
  state.listLoading = false;
  const payload = action.payload;

  if (Array.isArray(payload)) {
    state.list = payload;
  } else if (Array.isArray(payload?.data)) {
    state.list = payload.data;
  } else {
    state.list = [];
  }
})
.addCase(fetchPayments.rejected, (state, action) => {
  state.listLoading = false;
  state.listError = action.payload;
})

.addCase(verifyPayment.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(verifyPayment.fulfilled, (state, action) => {
  state.loading = false;
  state.success = true;
})
.addCase(verifyPayment.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

/* ----- update payment ----- */
.addCase(updatePayment.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(updatePayment.fulfilled, (state) => {
  state.loading = false;
  state.success = true;
})
.addCase(updatePayment.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
});
  },
});

export const { resetPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;