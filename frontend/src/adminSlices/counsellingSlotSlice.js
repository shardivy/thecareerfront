import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getSlotsByDateApi,
  deleteSlotApi,
  createSlotsApi,
} from "../adminApi/counsellingSlotApi";

/* ---------- THUNKS ---------- */

// FETCH
export const fetchSlotsByDate = createAsyncThunk(
  "counsellingSlots/fetchByDate",
  async ({ date, counsellorId }, { rejectWithValue }) => {
    try {
      return await getSlotsByDateApi(date, counsellorId);
    } catch {
      return rejectWithValue("Failed to fetch slots");
    }
  }
);

// DELETE
export const deleteSlot = createAsyncThunk(
  "counsellingSlots/deleteSlot",
  async (slotId, { rejectWithValue }) => {
    try {
      await deleteSlotApi(slotId);
      return slotId;
    } catch {
      return rejectWithValue("Failed to delete slot");
    }
  }
);

// CREATE
export const createSlots = createAsyncThunk(
  "counsellingSlots/createSlots",
  async ({ date, counsellorId, payload }, { rejectWithValue }) => {
    try {
      return await createSlotsApi(date, counsellorId, payload);
    } catch {
      return rejectWithValue("Failed to create slots");
    }
  }
);

/* ---------- SLICE ---------- */

const counsellingSlotSlice = createSlice({
  name: "counsellingSlots",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetSlotState: (state) => {
      state.list = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchSlotsByDate.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSlotsByDate.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload?.data || action.payload || [];
      })
      .addCase(fetchSlotsByDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // DELETE
      .addCase(deleteSlot.fulfilled, (state, action) => {
        state.list = state.list.filter(
          (slot) => slot.id !== action.payload
        );
      })

      // CREATE
      .addCase(createSlots.pending, (state) => {
        state.loading = true;
      })
      .addCase(createSlots.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createSlots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetSlotState } = counsellingSlotSlice.actions;
export default counsellingSlotSlice.reducer;
