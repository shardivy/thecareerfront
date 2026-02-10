import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getSlotsByDateApi,
  getSlotsCounsellorWiseApi,
  deleteSlotApi,
  createSlotsApi,
  updateCounsellorStatusApi,
} from "../adminApi/counsellingSlotApi";

/* ---------- FETCH BY DATE ---------- */
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

/* ---------- FETCH COUNSELLOR WISE ---------- */
export const fetchSlotsCounsellorWise = createAsyncThunk(
  "counsellingSlots/fetchCounsellorWise",
  async (_, { rejectWithValue }) => {
    try {
      return await getSlotsCounsellorWiseApi();
    } catch {
      return rejectWithValue("Failed to fetch counsellor-wise slots");
    }
  }
);

/* ---------- DELETE ---------- */
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

/* ---------- CREATE ---------- */
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

export const updateCounsellorStatus = createAsyncThunk(
  "counsellingSlots/updateCounsellorStatus",
  async (payload, { rejectWithValue }) => {
    try {
      return await updateCounsellorStatusApi(payload);
    } catch {
      return rejectWithValue("Failed to update counsellor status");
    }
  }
);


const counsellingSlotSlice = createSlice({
  name: "counsellingSlots",
  initialState: {
    list: [],
    counsellorWiseList: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetSlotState: (state) => {
      state.list = [];
      state.counsellorWiseList = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* DATE */
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

      /* COUNSELLOR WISE */
      .addCase(fetchSlotsCounsellorWise.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSlotsCounsellorWise.fulfilled, (state, action) => {
        state.loading = false;

        const normalized = [];

        action.payload?.data?.forEach((day) => {
          day.counsellors.forEach((c) => {
            normalized.push({
              date: day.date,
              counsellor_id: c.counsellor_id,
              counsellor_name: c.counsellor_name,
              counsellor_is_active: c.counsellor_is_active,
              slots: c.slots,
            });
          });
        });

        state.counsellorWiseList = normalized;
      })
      .addCase(fetchSlotsCounsellorWise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* DELETE */
      .addCase(deleteSlot.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s.id !== action.payload);
        state.counsellorWiseList = state.counsellorWiseList.filter(
          (s) => s.id !== action.payload
        );
      })

      /* CREATE */
      .addCase(createSlots.pending, (state) => {
        state.loading = true;
      })
      .addCase(createSlots.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createSlots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------- UPDATE COUNSELLOR STATUS ---------- */
.addCase(updateCounsellorStatus.pending, (state, action) => {
const { counsellor_id, date, is_active } = action.meta.arg;

  
state.counsellorWiseList = state.counsellorWiseList.map((item) =>
  item.counsellor_id === counsellor_id && item.date === date
    ? { ...item, counsellor_is_active: is_active }
    : item
);
})

.addCase(updateCounsellorStatus.fulfilled, (state) => {
  state.loading = false;
})

.addCase(updateCounsellorStatus.rejected, (state, action) => {
  state.error = action.payload;
});


  },
});

export const { resetSlotState } = counsellingSlotSlice.actions;
export default counsellingSlotSlice.reducer;
