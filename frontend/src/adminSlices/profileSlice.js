import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getProfileApi,
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
  reducers: {},
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

      // ===== UPDATE =====
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;

        // ✅ KEY FIX
        state.profile = {
          ...state.profile,
          ...action.payload,
        };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default profileSlice.reducer;
