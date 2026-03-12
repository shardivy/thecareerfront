// src/adminSlices/employeeSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  registerUserApi,
  getRegisteredUsersApi,
  updateUserApi,
  deleteUserApi,
} from "../adminApi/employeeApi";

// REGISTER USER
export const registerUser = createAsyncThunk(
  "employee/registerUser",
  async (payload, { rejectWithValue }) => {
    try {
      return await registerUserApi(payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Something went wrong"
      );
    }
  }
);

// FETCH USERS
export const fetchRegisteredUsers = createAsyncThunk(
  "employee/fetchRegisteredUsers",
  async (_, { rejectWithValue }) => {
    try {
      return await getRegisteredUsersApi();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Something went wrong"
      );
    }
  }
);

// UPDATE USER
export const updateUser = createAsyncThunk(
  "employee/updateUser",
  async ({ userId, payload }, { rejectWithValue }) => {
    try {
      return await updateUserApi(userId, payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Something went wrong"
      );
    }
  }
);

// DELETE USER
export const deleteUser = createAsyncThunk(
  "employee/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      await deleteUserApi(userId);
      return userId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Something went wrong"
      );
    }
  }
);

const employeeSlice = createSlice({
  name: "employee",
  initialState: {
    loading: false,
    error: null,
    employees: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder

      // FETCH USERS
      .addCase(fetchRegisteredUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
     .addCase(fetchRegisteredUsers.fulfilled, (state, action) => {
  state.loading = false;

  const data = Array.isArray(action.payload)
    ? action.payload
    : action.payload.data || [];

  const employees = [];

  data.forEach((item, index) => {
    employees.unshift({
      key: item.id || index,
      user_id: item.user_id,
      name: `${item.first_name || ""} ${item.last_name || ""}`,
      email: item.email || "",
      mobile: item.phone || item.mobile || "",
      role: item.role || "",
      date: item.created_at || "",
      Status: item.status || "Active",
    });
  });

  state.employees = employees;
})
      .addCase(fetchRegisteredUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // REGISTER
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // DELETE
.addCase(deleteUser.pending, (state) => {
  state.loading = true;
})
.addCase(deleteUser.fulfilled, (state, action) => {
  state.loading = false;

  // remove deleted user from state
  state.employees = state.employees.filter(
    (emp) => emp.user_id !== action.payload
  );
})
.addCase(deleteUser.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
});
  },
});

export default employeeSlice.reducer;