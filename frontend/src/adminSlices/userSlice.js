import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  addUserApi,
  fetchStudentsApi,
  updateUserApi,
  deleteUserApi,
  fetchStudentJourneyApi
} from "../adminApi/userApi";
import create from "@ant-design/icons/lib/components/IconFont";

/* ===================== THUNKS ===================== */

// ADD USER
export const addUser = createAsyncThunk(
  "users/addUser",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await addUserApi(payload);
      return data; // { message, data }
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to add user");
    }
  }
);

// FETCH STUDENTS
export const fetchStudents = createAsyncThunk(
  "users/fetchStudents",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchStudentsApi();
      console.log("📦 API Response from fetchStudents:", data);
      return data.data || data; // backend structure
    } catch (error) {
      console.error("❌ Error fetching students:", error);
      return rejectWithValue("Failed to fetch students");
    }
  }
);

// UPDATE USER
export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await updateUserApi(id, payload);
      console.log("🔄 Update API Response:", data);

      // if API returns updated object
      if (data?.data) return data.data;

      // fallback
      return { id, ...payload };
    } catch (error) {
      console.error("❌ Error updating user:", error);
      return rejectWithValue(error.response?.data || "Update failed");
    }
  }
);

// DELETE USER
// export const deleteUser = createAsyncThunk(
//   "users/deleteUser",
//   async (userId, { rejectWithValue }) => {
//     try {
//       await deleteUserApi(userId);
//       return userId;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || "Delete failed");
//     }
//   }
// );

/* ---------- DELETE USER ---------- */
export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      await deleteUserApi(userId);
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Delete failed");
    }
  }
);


/* ---------- FETCH STUDENT JOURNEY ---------- */
export const fetchStudentJourney = createAsyncThunk(
  "users/fetchStudentJourney",
  async (studentId, { rejectWithValue }) => {
    try {
      const data = await fetchStudentJourneyApi(studentId);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch journey"
      );
    }
  }
);


/* ===================== SLICE ===================== */

const userSlice = createSlice({
  name: "users",
  initialState: {
    list: [],
    loading: false,
    error: null,
    success: false,
    successMessage: null,
    journey: [],
    journeyLoading: false,
  },

  reducers: {
    resetUserState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.successMessage = null;
    },
    // Add a reducer to manually set a user (for debugging)
    setUserData: (state, action) => {
      const { id, data } = action.payload;
      const index = state.list.findIndex((u) => u.id === id);
      if (index !== -1) {
        state.list[index] = { ...state.list[index], ...data };
      }
    }
  },

  extraReducers: (builder) => {
    builder
      /* ---------- FETCH STUDENTS ---------- */
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;

        if (!action.payload) {
          console.error("⚠️ No payload received from fetchStudents");
          return;
        }

        // Map users with ALL fields from API
        const mappedUsers = action.payload.map((u) => {
          console.log("📋 Processing user from API:", u.id, u.first_name);
          console.log("💰 Payment data:", {
            amount: u.amount,
            payment_type: u.payment_type,
            method: u.method,
            transaction_id: u.transaction_id,
            proof_file: u.proof_file
          });

          const userObj = {
            key: u.id,
            id: u.id,
            first_name: u.first_name || "",
            last_name: u.last_name || "",
            student_name: u.student_name || "",
             aptitude_test: Boolean(u.aptitude_test),
            email: u.email || "",
            phone: u.phone || "",
            study_class: u.study_class || "",
            current_academic_stage: u.current_academic_stage || "",
            city: u.city || "",

            // Include IDs so edit modal can pre-fill Selects
            program_id: u.program?.id || u.program_id || null,
            package_id: u.package?.id || u.package_id || null,

            program: u.program_name || u.program?.name || "N/A",
            package: u.package_name || u.package?.name || "N/A",

            preferred_counselling_mode: u.preferred_counselling_mode || "",

            // PAYMENT FIELDS - IMPORTANT: Store all payment data DIRECTLY
            price: u.price || "",
            amount: u.amount || "",
            total_paid_amount: u.total_paid_amount || "",


            payment_type: u.payment_type || "",
            method: u.method || "",
            transaction_id: u.transaction_id || "",
            proof_file: u.proof_file || "",

            paymentStatus: u.payment_status
              ? u.payment_status
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
              : "N/A",

            examStatus: (() => {
              const exam = u.exam_status;

              if (!exam) return "Not Applicable";

              // If all values are "not_applicable"
              const values = Object.values(exam);
              if (values.every(v => v === "not_applicable")) {
                return "Not Applicable";
              }

              if (Number(exam.completed) > 0) return "Completed";
              if (Number(exam.in_progress) > 0) return "In Progress";
              if (Number(exam.pending_approval) > 0) return "Pending Approval";
              if (Number(exam.not_started) > 0) return "Not Started";

              return "Not Started";
            })(),

            // ✅ FIXED REPORT STATUS
  reportStatus: u.report_status || "received_locked",


            sessions: u.exam_status
              ? Object.values(u.exam_status).reduce((sum, val) => sum + val, 0)
              : "0",

              slotStatus: u.slot_status
  ? u.slot_status
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  : "Not Booked",

journeyStatus: u.full_access
  ? u.full_access
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  : "Payment",


 analysis_status: u.analysis_status,
 created_at: u.created_at,

            // Include all payment fields in profile for easy access
            profile: {
              email: u.email || "",
              phone: u.phone || "",
              study_class: u.study_class || "",
              current_academic_stage: u.current_academic_stage || "",
              city: u.city || "",
              program_name: u.program_name || "",
              package_name: u.package_name || "",
              payment_status: u.payment_status || "",
              // ADD PAYMENT DETAILS TO PROFILE
              price: u.price || "",
              amount: u.amount || "",
              total_paid_amount: u.total_paid_amount || "",
              payment_type: u.payment_type || "",
              method: u.method || "",
              transaction_id: u.transaction_id || "",
              proof_file: u.proof_file || "",
            },
          };

          console.log("✅ Created user object:", userObj);
          return userObj;
        });

        console.log("📊 Mapped users with payment data:", mappedUsers);
        // 🔥 Ensure newest users appear at the top
        state.list = mappedUsers.reverse();
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("❌ Fetch students rejected:", action.payload);
      })

      /* ---------- ADD USER ---------- */
      .addCase(addUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.successMessage = action.payload.message;

        const u = action.payload.data;
        console.log("➕ New user data from API:", u);

        const newUser = {
          key: u.id,
          id: u.id,
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          student_name: u.student_name || "",
          email: u.email || "",
          phone: u.phone || "",

          // Include IDs so edit modal can pre-fill Selects
          program_id: u.program?.id || u.program_id || null,
          package_id: u.package?.id || u.package_id || null,

          // FIXED: Access program_name and package_name directly
          program: u.program?.name || "N/A",
          package: u.package?.name || "N/A",

          // PAYMENT FIELDS
          amount: u.amount || "",
          payment_type: u.payment_type || "",
          method: u.method || "",
          transaction_id: u.transaction_id || "",
          proof_file: u.proof_file || "",

          paymentStatus: u.payment_status
            ? u.payment_status.split('_').map(word =>
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')
            : "N/A",

          examStatus: (() => {
            const exam = u.exam_status;

            if (!exam) return "Not Applicable";

            // If all values are "not_applicable"
            const values = Object.values(exam);
            if (values.every(v => v === "not_applicable")) {
              return "Not Applicable";
            }

            if (Number(exam.completed) > 0) return "Completed";
            if (Number(exam.in_progress) > 0) return "In Progress";
            if (Number(exam.pending_approval) > 0) return "Pending Approval";
            if (Number(exam.not_started) > 0) return "Not Started";

            return "Not Started";
          })(),

          reportStatus: (() => {
            const status = u.report_status;

            if (!status) return "Locked";

            if (status === "not_applicable") return "Not Applicable";

            return status
              .split("_")
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
          })(),

          sessions: u.exam_status
            ? Object.values(u.exam_status).reduce((sum, val) => sum + val, 0)
            : "0",

            // SLOT STATUS
slotStatus: u.slot_status
  ? u.slot_status
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  : "Not Booked",

// JOURNEY STATUS
journeyStatus: u.full_access
  ? u.full_access
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  : "Payment",


          profile: {
            email: u.email || "",
            phone: u.phone || "",
            study_class: u.study_class || "",
            current_academic_stage: u.current_academic_stage || "",
            city: u.city || "",
            program_name: u.program_name || "",
            package_name: u.package_name || "",
            payment_status: u.payment_status || "",
            // ADD PAYMENT DETAILS TO PROFILE
            amount: u.amount || "",
            total_paid_amount: u.total_paid_amount || "",
            payment_type: u.payment_type || "",
            method: u.method || "",
            transaction_id: u.transaction_id || "",
            proof_file: u.proof_file || "",
          }
        };

        console.log("✅ New user added with payment data:", newUser);
        // Add new user at top
        state.list.unshift(newUser);
      })
      .addCase(addUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("❌ Add user rejected:", action.payload);
      })

      /* ---------- UPDATE ---------- */
      .addCase(updateUser.fulfilled, (state, action) => {
        const payload = action.payload || {};
        console.log("🔄 Update payload received:", payload);

        if (!payload.id) {
          console.log("⚠️ No ID in update payload, skipping");
          return;
        }

        const index = state.list.findIndex((u) => u.id === payload.id);
        if (index !== -1) {
          const existing = state.list[index];
          console.log("📝 Existing user data:", existing);

          // Merge all fields including payment data
          const updated = {
            ...existing,
            first_name: payload.first_name ?? existing.first_name,
            last_name: payload.last_name ?? existing.last_name,
            email: payload.email ?? existing.email,
            phone: payload.phone ?? existing.phone,
            study_class: payload.study_class ?? existing.study_class,

            // Payment fields
            amount: payload.amount ?? existing.amount,
            payment_type: payload.payment_type ?? existing.payment_type,
            method: payload.method ?? existing.method,
            transaction_id: payload.transaction_id ?? existing.transaction_id,
            proof_file: payload.proof_file ?? existing.proof_file,

            // Program / package
            program_id: payload.program_id ?? payload.program?.id ?? existing.program_id,
            package_id: payload.package_id ?? payload.package?.id ?? existing.package_id,
            program: payload.program_name ?? payload.program?.name ?? existing.program,
            package: payload.package_name ?? payload.package?.name ?? existing.package,

            // Also update profile object
            profile: {
              ...existing.profile,
              first_name: payload.first_name ?? existing.profile.first_name,
              last_name: payload.last_name ?? existing.profile.last_name,
              email: payload.email ?? existing.profile.email,
              phone: payload.phone ?? existing.profile.phone,
              study_class: payload.study_class ?? existing.profile.study_class,
              amount: payload.amount ?? existing.profile.amount,
              payment_type: payload.payment_type ?? existing.profile.payment_type,
              method: payload.method ?? existing.profile.method,
              transaction_id: payload.transaction_id ?? existing.profile.transaction_id,
              proof_file: payload.proof_file ?? existing.profile.proof_file,
              program_name: payload.program_name ?? payload.program?.name ?? existing.profile.program_name,
              package_name: payload.package_name ?? payload.package?.name ?? existing.profile.package_name,
            }
          };

          console.log("✅ Updated user data:", updated);
          state.list[index] = updated;
        } else {
          console.log("⚠️ User not found in list for update:", payload.id);
        }
      })

      /* ---------- DELETE USER ---------- */
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter(
          (user) => user.id !== action.payload
        );
      })


      /* ---------- FETCH JOURNEY ---------- */
      .addCase(fetchStudentJourney.pending, (state) => {
        state.journeyLoading = true;
      })
      .addCase(fetchStudentJourney.fulfilled, (state, action) => {
        state.journeyLoading = false;
        state.journey = action.payload?.data || action.payload || [];
      })
      .addCase(fetchStudentJourney.rejected, (state, action) => {
        state.journeyLoading = false;
        state.error = action.payload;
      });
  },
});

export const { resetUserState, setUserData } = userSlice.actions;
export default userSlice.reducer;