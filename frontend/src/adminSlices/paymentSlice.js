import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  submitPaymentApi,
  fetchPaymentStatsApi,
  fetchPaymentsApi,
  verifyPaymentApi,
  updatePaymentApi,
  fetchStudentPaymentSummaryApi,
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

/* ================= VERIFY PAYMENT ================= */
export const verifyPayment = createAsyncThunk(
  "payment/verify",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await verifyPaymentApi(id, payload);

      if (!response.success) {
        return rejectWithValue(response.error);
      }

      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Verification failed");
    }
  }
);

/* ================= UPDATE PAYMENT ================= */
export const updatePayment = createAsyncThunk(
  "payment/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await updatePaymentApi(id, payload);

      if (!response.success) {
        return rejectWithValue(
          response.error || response.message || "Update failed"
        );
      }

      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        "Update failed"
      );
    }
  }
);

/* ================= FETCH STUDENT PAYMENT SUMMARY ================= */
export const fetchStudentPaymentSummary = createAsyncThunk(
  "payment/fetchStudentSummary",
  async ({ studentId, packageId }, { rejectWithValue }) => {
    try {
      return await fetchStudentPaymentSummaryApi(
        studentId,
        packageId
      );
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch summary"
      );
    }
  }
);


/* ================= SLICE ================= */
const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    /* ===== Submit State ===== */
    submitLoading: false,
    submitSuccess: false,
    submitError: null,

    /* ===== Verify State ===== */
    verifyLoading: false,
    verifySuccess: false,
    verifyError: null,

    /* ===== Update State ===== */
    updateLoading: false,
    updateSuccess: false,
    updateError: null,

    /* ===== Stats State ===== */
    statsLoading: false,
    statsError: null,
    stats: null,

    /* ===== List State ===== */
    listLoading: false,
    listError: null,
    list: [],

    /* ===== Student Summary ===== */
    summaryLoading: false,
    summaryError: null,
    summaryData: null,

  },

  reducers: {
    resetPaymentState: (state) => {
      state.submitSuccess = false;
      state.submitError = null;

      state.verifySuccess = false;
      state.verifyError = null;

      state.updateSuccess = false;
      state.updateError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ================= SUBMIT ================= */
      .addCase(submitPayment.pending, (state) => {
        state.submitLoading = true;
        state.submitError = null;
      })
      .addCase(submitPayment.fulfilled, (state) => {
        state.submitLoading = false;
        state.submitSuccess = true;
      })
      .addCase(submitPayment.rejected, (state, action) => {
        state.submitLoading = false;
        state.submitError = action.payload;
      })

      /* ================= FETCH STATS ================= */
      .addCase(fetchPaymentStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchPaymentStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload?.data ?? action.payload;
      })
      .addCase(fetchPaymentStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload;
      })

      /* ================= FETCH LIST ================= */
      .addCase(fetchPayments.pending, (state) => {
        state.listLoading = true;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.listLoading = false;

        const payload = action.payload;
        let paymentList = [];

        if (Array.isArray(payload)) {
          paymentList = payload;
        } else if (Array.isArray(payload?.data)) {
          paymentList = payload.data;
        }

        state.list = paymentList.map((payment, index) => {
          let userName = payment.user_name || "";
          if (userName.includes(" - ")) {
            const parts = userName.split(" - ");
            userName = parts[parts.length - 1].trim();
          }

          let formattedDate = "-";
          const dateToUse = payment.payment_date || payment.created_at;

          if (dateToUse) {
            try {
              formattedDate = new Date(dateToUse)
                .toISOString()
                .split("T")[0];
            } catch {
              formattedDate = "-";
            }
          }

          return {
            key: payment.payment_id || payment.id || `payment-${index}`,
            id: payment.payment_id || payment.id,
            user_id: payment.user_id,
            student_id: payment.student_id,

            name: userName,
            user_name: userName,
            student_name: userName,
            user_email: payment.email || "",

            package_id: payment.package_id,
            package_name: payment.package || "",
            package_price: payment.package_price || 0,


            amount: payment.amount || 0,

            payment_status:
              payment.payment_status || payment.status || "pending",
            status:
              payment.payment_status || payment.status || "pending",

            payment_method:
              payment.payment_method || payment.method || "",

            payment_date: formattedDate,
            transaction_id:
              payment.transaction_id || payment.txn || "-",

            proof_file_url: payment.proof_file_url || "",
          };
        });
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload;
      })

      /* ================= VERIFY ================= */
      .addCase(verifyPayment.pending, (state) => {
        state.verifyLoading = true;
        state.verifyError = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.verifyLoading = false;
        state.verifySuccess = true;

        const paymentId =
          action.payload?.data?.payment_id ||
          action.payload?.payment_id;

        if (paymentId) {
          const index = state.list.findIndex(
            (p) => p.id === paymentId
          );

          if (index !== -1) {
            state.list[index].payment_status = "verified";
            state.list[index].status = "verified";
          }
        }
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.verifyLoading = false;
        state.verifyError = action.payload;
      })

      /* ================= UPDATE ================= */
      .addCase(updatePayment.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updatePayment.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateSuccess = true;

        const paymentId =
          action.payload?.data?.payment_id ||
          action.payload?.payment_id;

        if (paymentId) {
          const index = state.list.findIndex(
            (p) => p.id === paymentId
          );

          if (index !== -1) {
            state.list[index] = {
              ...state.list[index],
              ...action.payload.data,
            };
          }
        }
      })
      .addCase(updatePayment.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })

      /* ================= STUDENT SUMMARY ================= */
      .addCase(fetchStudentPaymentSummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryData = null;
        state.summaryError = null;
      })
      .addCase(fetchStudentPaymentSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summaryData = action.payload?.data;
        state.summaryError = null;
      })
      .addCase(fetchStudentPaymentSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError = action.payload || action.error.message;
        state.summaryData = null;
      });

  },
});

export const { resetPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;
