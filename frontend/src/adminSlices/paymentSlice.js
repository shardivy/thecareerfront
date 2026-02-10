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
// ================= UPDATE PAYMENT =================
export const updatePayment = createAsyncThunk(
  "payment/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      // Log what we're sending
      console.log("🚀 Sending update for payment ID:", id);
      console.log("📤 Payload type:", payload instanceof FormData ? 'FormData' : 'Object');
      
      if (payload instanceof FormData) {
        console.log("📦 FormData contents in thunk:");
        const entries = [];
        for (let [key, value] of payload.entries()) {
          entries.push({
            key,
            value: value instanceof File ? `File: ${value.name}` : value
          });
        }
        console.log("Entries:", entries);
      }
      
      const response = await updatePaymentApi(id, payload);

      console.log("📥 Update API response in thunk:", response);

      if (!response.success) {
        console.error("❌ Backend returned error:", response);
        return rejectWithValue(response.error || response.message || "Update failed");
      }

      return response;
    } catch (error) {
      console.error("❌ Update catch error in thunk:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
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
        
        console.log("📦 Payment API Response:", payload);

        let paymentList = [];
        
        if (Array.isArray(payload)) {
          paymentList = payload;
        } else if (Array.isArray(payload?.data)) {
          paymentList = payload.data;
        } else if (payload?.data && typeof payload.data === 'object') {
          // If data is an object with array inside
          paymentList = Object.values(payload.data).find(Array.isArray) || [];
        } else {
          paymentList = [];
        }

        console.log("📊 Extracted payment list:", paymentList);

        // Map API fields to expected table fields
        state.list = paymentList.map((payment, index) => {
          console.log(`📋 Processing payment ${index}:`, payment);
          
          // Extract name from user_name if it contains " - "
          let userName = payment.user_name || "";
          if (userName.includes(" - ")) {
            const parts = userName.split(" - ");
            userName = parts[parts.length - 1].trim();
          }
          
          // Format date - use payment_date if available, otherwise created_at
          let formattedDate = "-";
          let dateToUse = payment.payment_date || payment.created_at;
          
          if (dateToUse) {
            try {
              formattedDate = new Date(dateToUse).toISOString().split('T')[0];
            } catch (e) {
              console.error("❌ Error formatting date:", dateToUse, e);
              formattedDate = "-";
            }
          }
          
          console.log(`📅 Date for payment ${index}:`, {
            payment_date: payment.payment_date,
            created_at: payment.created_at,
            formatted: formattedDate
          });
          
          return {
            key: payment.payment_id || payment.id || `payment-${index}`,
            id: payment.payment_id || payment.id,
            user_id: payment.user_id,
              student_id: payment.student_id,     
            
            // Name fields
            user_name: userName,
            name: userName,
            student_name: userName,
            user_email: payment.email || "",
            
            // Package fields
         package_id: payment.package_id ,
      package_name: payment.package || "", 
            // program: payment.program || "",
            
            // Amount fields
            amount: payment.amount || 0,
            package_price: payment.package_price || 0,
            
            // Status fields
            payment_status: payment.payment_status || payment.status || "pending",
            status: payment.payment_status || payment.status || "pending",
            
            // Payment method fields
            payment_method: payment.payment_method || payment.method || "",
            method: payment.payment_method || payment.method || "",
            
            // Date fields - use payment_date first, fallback to created_at
            payment_date: formattedDate,
            date: formattedDate,
            original_payment_date: payment.payment_date, // Store original for debugging
            original_created_at: payment.created_at, // Store original for debugging
            
            // Transaction fields
            transaction_id: payment.transaction_id || payment.txn || "-",
            txn: payment.transaction_id || payment.txn || "-",
            
            // Proof/receipt fields
            proof_file_url: payment.proof_file_url ||  "",

          };
        });

        console.log("✅ Final mapped list:", state.list);
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload;
        console.error("❌ Failed to fetch payments:", action.payload);
      })

      /* ----- verify payment ----- */
      .addCase(verifyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        
        // Update the payment in the list if verification was successful
        const paymentId = action.payload?.data?.payment_id || action.payload?.payment_id;
        if (paymentId) {
          const index = state.list.findIndex(p => p.id === paymentId);
          if (index !== -1) {
            state.list[index].payment_status = "verified";
            state.list[index].status = "verified";
          }
        }
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
      .addCase(updatePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        
        // Update the payment in the list
        const paymentId = action.payload?.data?.payment_id || action.payload?.payment_id;
        if (paymentId) {
          const index = state.list.findIndex(p => p.id === paymentId);
          if (index !== -1) {
            state.list[index] = {
              ...state.list[index],
              ...action.payload.data
            };
          }
        }
      })
      .addCase(updatePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;