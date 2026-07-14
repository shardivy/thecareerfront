import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  submitPaymentApi,
  fetchPaymentStatsApi,
  fetchPaymentsApi,
  verifyPaymentApi,
  updatePaymentApi,
  fetchStudentPaymentSummaryApi,
  fetchStudentPaymentHistoryApi,
  fetchStudentPaymentProgressApi,
  fetchPendingPaymentStudentsApi,
  sendPaymentReminderApi,
  fetchPaymentReceiptApi,
  submitStudentPaymentApi,
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


/* ================= FETCH STUDENT PAYMENT HISTORY ================= */
export const fetchStudentPaymentHistory = createAsyncThunk(
  "payment/fetchStudentHistory",
  async (studentId, { rejectWithValue }) => {
    try {
      return await fetchStudentPaymentHistoryApi(studentId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch payment history"
      );
    }
  }
);


/* ================= FETCH PENDING PAYMENT STUDENTS ================= */
export const fetchPendingPaymentStudents = createAsyncThunk(
  "payment/fetchPendingStudents",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchPendingPaymentStudentsApi();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch pending students"
      );
    }
  }
);

/* ================= FETCH STUDENT PAYMENT PROGRESS ================= */
export const fetchStudentPaymentProgress = createAsyncThunk(
  "payment/fetchStudentProgress",
  async (studentId, { rejectWithValue }) => {
    try {
      return await fetchStudentPaymentProgressApi(studentId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch payment progress"
      );
    }
  }
);

/* ================= SEND REMINDER ================= */
export const sendPaymentReminder = createAsyncThunk(
  "payment/sendReminder",
  async (studentId, { rejectWithValue }) => {
    try {
      return await sendPaymentReminderApi(studentId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to send reminder"
      );
    }
  }
);

/* ================= FETCH RECEIPT ================= */
export const fetchPaymentReceipt = createAsyncThunk(
  "payment/fetchReceipt",
  async (paymentId, { rejectWithValue }) => {
    try {
      return await fetchPaymentReceiptApi(paymentId);
    } catch (error) {
      return rejectWithValue("Failed to fetch receipt");
    }
  }
);


export const submitStudentPayment = createAsyncThunk(
  "payment/submitStudentPayment",
  async ({ studentId, payload }, { rejectWithValue }) => {
    try {
      return await submitStudentPaymentApi(studentId, payload);
    } catch (error) {
      return rejectWithValue(error.response?.data || "Payment failed");
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

    /* ===== Student Payment History ===== */
    historyLoading: false,
    historyError: null,
    historyList: [],
    remainingAmount: 0,

    /* ===== Student Payment Progress ===== */
    progressLoading: false,
    progressError: null,
    progressData: null,

    pendingStudentsLoading: false,
    pendingStudentsError: null,
    pendingStudents: [],

    reminderLoading: false,
    reminderSuccess: false,
    reminderError: null,

    receiptLoading: false,
    receiptError: null,

    studentName: "",
    studentEmail: "",

      verifyApproveLoading: false,
  verifyRejectLoading: false,

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

        const formattedList = paymentList.map((payment) => {

          const formattedDate =
            payment.payment_date || payment.created_at
              ? new Date(payment.payment_date || payment.created_at)
              : null;

          const programNames = Array.isArray(payment.programs)
            ? payment.programs
            : payment.program
            ? [payment.program]
            : payment.program_name
            ? [payment.program_name]
            : [];

          const packageNames = Array.isArray(payment.packages)
            ? payment.packages
            : payment.package
            ? [payment.package]
            : payment.package_name
            ? [payment.package_name]
            : [];

          const programIds = Array.isArray(payment.program_ids)
            ? payment.program_ids
            : payment.program_id
            ? [payment.program_id]
            : [];

          const packageIds = Array.isArray(payment.package_ids)
            ? payment.package_ids
            : payment.package_id
            ? [payment.package_id]
            : [];

          return {
            key: payment.payment_id || payment.id,
            id: payment.payment_id || payment.id,
            user_id: payment.user_id,
            student_id: payment.student_id,
            handholding_participant_id: payment.handholding_participant_id || "",

            name: payment.user_name || "",
            user_name: payment.user_name || "",
            student_name: payment.user_name || "",
            email: payment.email || "",

            program_id: payment.program_id,
            program_name: payment.program || "",
            package_id: payment.package_id,
            package_name: payment.package || "",
            package_price: payment.package_price || 0,

            programs: programNames,
            packages: packageNames,
            program_ids: programIds,
            package_ids: packageIds,

            amount: payment.amount || 0,
            total_paid: payment.total_paid || 0,

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

            is_handholding: payment.is_handholding || false,
          };
        });

        // ✅ SORT AFTER MAP
        formattedList.sort((a, b) => {
          const normalize = (val) =>
            val?.toString().toLowerCase().replace(/_/g, " ");

          const statusA = normalize(a.status);
          const statusB = normalize(b.status);

          const isANotPaid = statusA === "not paid";
          const isBNotPaid = statusB === "not paid";

          const isAVerification = statusA === "verification pending";
          const isBVerification = statusB === "verification pending";

          const isAPartial = statusA === "partial paid";
          const isBPartial = statusB === "partial paid";

          // 1️⃣ NOT PAID first
          if (isANotPaid && !isBNotPaid) return -1;
          if (!isANotPaid && isBNotPaid) return 1;

          // 2️⃣ Verification Pending second
          if (isAVerification && !isBVerification) return -1;
          if (!isAVerification && isBVerification) return 1;

          // 3️⃣ Partial Paid third
          if (isAPartial && !isBPartial) return -1;
          if (!isAPartial && isBPartial) return 1;

          // 4️⃣ If same category → oldest first
          if (
            (isANotPaid && isBNotPaid) ||
            (isAVerification && isBVerification) ||
            (isAPartial && isBPartial)
          ) {
            if (!a.payment_date) return 1;
            if (!b.payment_date) return -1;
            return a.payment_date - b.payment_date;
          }

          // 5️⃣ Others → newest first (keep your previous behavior)
          if (!a.payment_date) return 1;
          if (!b.payment_date) return -1;
          return b.payment_date - a.payment_date;
        });

        state.list = formattedList;
      })


      .addCase(fetchPayments.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload;
      })

      /* ================= VERIFY ================= */
     .addCase(verifyPayment.pending, (state, action) => {
  if (action.meta.arg.payload.action === "approve") {
    state.verifyApproveLoading = true;
  } else {
    state.verifyRejectLoading = true;
  }
})
.addCase(verifyPayment.fulfilled, (state, action) => {
  state.verifyApproveLoading = false;
  state.verifyRejectLoading = false;
})
.addCase(verifyPayment.rejected, (state) => {
  state.verifyApproveLoading = false;
  state.verifyRejectLoading = false;
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
      })

      /* ================= STUDENT PAYMENT HISTORY ================= */
      .addCase(fetchStudentPaymentHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchStudentPaymentHistory.fulfilled, (state, action) => {
        state.historyLoading = false;

        const payload = action.payload || {};

        state.historyList = payload.data || [];
        state.remainingAmount = payload.remaining_amount || 0;

        state.studentName = payload.student_name || "";
        state.studentEmail = payload.student_email || "";
      })
      .addCase(fetchStudentPaymentHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload;
      })

      /* ================= STUDENT PAYMENT PROGRESS ================= */
      .addCase(fetchStudentPaymentProgress.pending, (state) => {
        state.progressLoading = true;
        state.progressError = null;
      })
      .addCase(fetchStudentPaymentProgress.fulfilled, (state, action) => {
        state.progressLoading = false;
        state.progressData = action.payload?.data || action.payload;
      })
      .addCase(fetchStudentPaymentProgress.rejected, (state, action) => {
        state.progressLoading = false;
        state.progressError = action.payload;
      })

      /* ================= FETCH PENDING PAYMENT STUDENTS ================= */
      .addCase(fetchPendingPaymentStudents.pending, (state) => {
        state.pendingStudentsLoading = true;
      })
      .addCase(fetchPendingPaymentStudents.fulfilled, (state, action) => {
        state.pendingStudentsLoading = false;
        state.pendingStudents = action.payload?.data || action.payload || [];
      })
      .addCase(fetchPendingPaymentStudents.rejected, (state, action) => {
        state.pendingStudentsLoading = false;
        state.pendingStudentsError = action.payload;
      })

      // send reminder
      .addCase(sendPaymentReminder.pending, (state) => {
        state.reminderLoading = true;
        state.reminderError = null;
      })
      .addCase(sendPaymentReminder.fulfilled, (state) => {
        state.reminderLoading = false;
        state.reminderSuccess = true;
      })
      .addCase(sendPaymentReminder.rejected, (state, action) => {
        state.reminderLoading = false;
        state.reminderError = action.payload;
      })

      .addCase(fetchPaymentReceipt.pending, (state) => {
        state.receiptLoading = true;
      })
      .addCase(fetchPaymentReceipt.fulfilled, (state) => {
        state.receiptLoading = false;
      })
      .addCase(fetchPaymentReceipt.rejected, (state, action) => {
        state.receiptLoading = false;
        state.receiptError = action.payload;
      })

      .addCase(submitStudentPayment.pending, (state) => {
  state.submitLoading = true;
  state.submitError = null;
})
.addCase(submitStudentPayment.fulfilled, (state) => {
  state.submitLoading = false;
  state.submitSuccess = true;
})
.addCase(submitStudentPayment.rejected, (state, action) => {
  state.submitLoading = false;
  state.submitError = action.payload;
})
  },
});

export const { resetPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;
