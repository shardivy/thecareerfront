import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  addUserApi,
  fetchStudentsApi,
  updateUserApi,
  deleteUserApi
} from "../adminApi/userApi";


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
      return data.data; // backend structure
    } catch (error) {
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

      // if API returns updated object
      if (data?.data) return data.data;

      // fallback
      return { id, ...payload };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Update failed");
    }
  }
);


// DELETE USER
export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/users/${userId}/`);
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Delete failed");
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
  },

  reducers: {
    resetUserState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.successMessage = null;
    },
  },

  extraReducers: (builder) => {
    builder
      /* ---------- FETCH STUDENTS ---------- */
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
      })
.addCase(fetchStudents.fulfilled, (state, action) => {
  state.loading = false;

  // Map users
  const mappedUsers = action.payload.map((u) => ({
    key: u.id,
    id: u.id,
    first_name: u.first_name || "",
    last_name: u.last_name || "",
    student_name: u.student_name || "",
    email: u.email || "",
    phone: u.phone || "",
    study_class: u.study_class || "",
    current_academic_stage: u.current_academic_stage || "",
    city: u.city || "",

    // Include IDs so edit modal can pre-fill Selects
    program_id: u.program?.id || u.program_id || null,
    package_id: u.package?.id || u.package_id || null,

    program: u.program_name || "N/A",
    package: u.package_name || "N/A",

    paymentStatus: u.payment_status
      ? u.payment_status
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : "N/A",

    examStatus: u.exam_status?.completed > 0 ? "Completed" : "Pending",
reportStatus: u.is_report_locked ? "Unlocked" : "Locked",
    sessions: u.exam_status
      ? Object.values(u.exam_status).reduce((sum, val) => sum + val, 0)
      : "0",

    profile: {
      email: u.email || "",
      phone: u.phone || "",
      study_class: u.study_class || "",
      current_academic_stage: u.current_academic_stage || "",
      city: u.city || "",
      program_name: u.program_name || "",
      package_name: u.package_name || "",
      payment_status: u.payment_status || "",
    },
  }));

  // 🔥 Ensure newest users appear at the top
  state.list = mappedUsers.reverse(); 
})

      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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

          paymentStatus: u.payment_status 
            ? u.payment_status.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')
            : "N/A",
            
          examStatus: u.exam_status?.completed > 0 ? "Completed" : "Pending",
          reportStatus: u.is_report_locked ? "Locked" : "Unlocked",
          sessions: u.exam_status 
            ? Object.values(u.exam_status).reduce((sum, val) => sum + val, 0)
            : "0",
            
          profile: {
            email: u.email || "",
            phone: u.phone || "",
            study_class: u.study_class || "",
            current_academic_stage: u.current_academic_stage || "",
            city: u.city || "",
            program_name: u.program_name || "",
            package_name: u.package_name || "",
            payment_status: u.payment_status || ""
          }
        };

        // Add new user at top
        state.list.unshift(newUser);
      })
      .addCase(addUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------- UPDATE ---------- */
      .addCase(updateUser.fulfilled, (state, action) => {
        const payload = action.payload || {};
        if (!payload.id) {
          // Nothing to update (API returned only a message); keep existing state
          return;
        }

        const index = state.list.findIndex((u) => u.id === payload.id);
        if (index !== -1) {
          const existing = state.list[index];

          // Merge only known/updated fields to avoid overwriting normalized fields accidentally
          const updated = {
            ...existing,
            first_name: payload.first_name ?? existing.first_name,
            last_name: payload.last_name ?? existing.last_name,
            email: payload.email ?? existing.email,
            phone: payload.phone ?? existing.phone,

            // Program / package: support both {program_id, package_id} or {program: {id, name}} or names
            program_id: payload.program_id ?? payload.program?.id ?? existing.program_id,
            package_id: payload.package_id ?? payload.package?.id ?? existing.package_id,
            program: payload.program_name ?? payload.program?.name ?? existing.program,
            package: payload.package_name ?? payload.package?.name ?? existing.package,
          };

          state.list[index] = updated;
        }
      })

      /* ---------- DELETE USER ---------- */
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter(
          (user) => user.id !== action.payload
        );
      });
  },
});

export const { resetUserState } = userSlice.actions;
export default userSlice.reducer;