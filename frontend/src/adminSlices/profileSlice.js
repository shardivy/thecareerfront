import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getProfileApi,
  getStudentProfileApi,
  updateProfileApi,
} from "../adminApi/profileApi";

// GET profile
export const getProfile = createAsyncThunk(
  "profile/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      return await getProfileApi();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch profile"
      );
    }
  }
);

export const getStudentProfile = createAsyncThunk(
  "profile/getStudentProfile",
  async (studentId, { rejectWithValue }) => {
    try {
      return await getStudentProfileApi(studentId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch student profile"
      );
    }
  }
);

// UPDATE profile
export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async (payload, { rejectWithValue }) => {
    try {
      return await updateProfileApi(payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Profile update failed"
      );
    }
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState: {
    loading: false,
    profile: null,
    error: null,
  },
   reducers: {
    clearProfile: (state) => {
      state.profile = null;
      state.loading = false;
      state.error = null;
    },
      },
  extraReducers: (builder) => {
    builder
      // ===== GET =====
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

       // ===== GET STUDENT PROFILE =====
    .addCase(getStudentProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(getStudentProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.profile = action.payload; 
    })
    .addCase(getStudentProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })

      // ===== UPDATE =====
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state) => {
        state.loading = false;

        
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
