import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { registerHHApi } from "../hhApi/hhRegisterApi";

// 🔥 THUNK
export const registerHH = createAsyncThunk(
  "hh/register",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await registerHHApi(formData);
      return res;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Something went wrong");
    }
  }
);

// 🔥 SLICE
const hhRegisterSlice = createSlice({
  name: "hhRegister",
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {
    clearHHRegisterState: (state) => {
      state.loading = false;
      state.data = null;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(registerHH.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerHH.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(registerHH.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearHHRegisterState } = hhRegisterSlice.actions;
export default hhRegisterSlice.reducer;
