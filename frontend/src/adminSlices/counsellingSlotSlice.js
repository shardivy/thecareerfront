import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getSlotsByDateApi,
  getSlotsCounsellorWiseApi,
  deleteSlotApi,
  createSlotsApi,
  updateCounsellorStatusApi,
  getSlotsForSelectedDateApi,
  updateSlotAvailabilityApi,
  getCounsellorBookingsApi,
} from "../adminApi/counsellingSlotApi";


const sortSlotsAsc = (slots) => {
  if (!slots) return [];

  const toMinutes = (timeStr) => {
    const [time, modifier] = timeStr.split(" "); // ["03:00", "PM"]
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  return [...slots].sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
};


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


export const fetchSlotsForSelectedDate = createAsyncThunk(
  "counsellingSlots/fetchForSelectedDate",
  async (date, { rejectWithValue }) => {
    try {
      return await getSlotsForSelectedDateApi(date);
    } catch (error) {
      console.error("API ERROR:", error.response || error);
      return rejectWithValue(
        error.response?.data || "Failed to fetch slots for selected date"
      );
    }
  }
);

// ✅ UPDATE SLOT AVAILABILITY
export const updateSlotAvailability = createAsyncThunk(
  "counsellingSlots/updateSlotAvailability",
  async ({ slotId, is_available }, { rejectWithValue }) => {
    try {
      return await updateSlotAvailabilityApi(slotId, { is_available });
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update slot availability"
      );
    }
  }
);

// ✅ FETCH COUNSELLOR BOOKINGS FOR SCHEDULER
export const fetchSlotsCounsellorWiseScheduler = createAsyncThunk(
  "counsellingSlots/fetchSlotsCounsellorWiseScheduler",
  async ({ year, month }, { rejectWithValue }) => {
    try {
      const data = await getCounsellorBookingsApi(year, month);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error");
    }
  }
);

const counsellingSlotSlice = createSlice({
  name: "counsellingSlots",
  initialState: {
    list: [],
    counsellorWiseList: [],
      modalSlots: [], 
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

  const slots = action.payload?.data || action.payload || [];

 state.modalSlots = sortSlotsAsc(slots);

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
              is_active: c.is_active,
              slots: sortSlotsAsc(c.slots),
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
        state.list = state.list.filter((s) => s.slot_id !== action.payload);
        state.counsellorWiseList = state.counsellorWiseList.filter(
          (s) => s.slot_id !== action.payload
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

      //

      .addCase(updateCounsellorStatus.pending, (state) => {
        state.loading = true; // show spinner if you want
      })

      .addCase(updateCounsellorStatus.fulfilled, (state, action) => {
        const { counsellor_id, date, is_active } = action.payload;

        state.counsellorWiseList = state.counsellorWiseList.map((item) =>
          item.counsellor_id === counsellor_id && item.date === date
            ? { ...item, is_active }
            : item
        );

        state.loading = false;
      })

      .addCase(updateCounsellorStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //
      .addCase(fetchSlotsForSelectedDate.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchSlotsForSelectedDate.fulfilled, (state, action) => {
        state.loading = false;

        const apiData = action.payload?.data || [];
        const date = action.payload?.date;

        state.list = apiData.map((c) => ({
          date: date,
          counsellor_id: c.counsellor_id,
          counsellor_name: c.counsellor_name,
          is_active: c.is_active,
          slots: sortSlotsAsc(c.slots),
        }));
      })
      .addCase(fetchSlotsForSelectedDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

.addCase(updateSlotAvailability.fulfilled, (state, action) => {
  const updatedSlot = action.payload; // { slot_id, is_available }

  state.list = state.list.map((item) => ({
    ...item,
    slots: sortSlotsAsc(
      item.slots?.map((slot) =>
        slot.slot_id === updatedSlot.slot_id
          ? { ...slot, is_available: updatedSlot.is_available }
          : slot
      )
    ),
  }));

  state.counsellorWiseList = state.counsellorWiseList.map((item) => ({
    ...item,
    slots: sortSlotsAsc(
      item.slots?.map((slot) =>
        slot.slot_id === updatedSlot.slot_id
          ? { ...slot, is_available: updatedSlot.is_available }
          : slot
      )
    ),
  }));

  state.loading = false;
})

.addCase(fetchSlotsCounsellorWiseScheduler.pending, (state) => {
        state.loading = true;
      })
.addCase(fetchSlotsCounsellorWiseScheduler.fulfilled, (state, action) => {
  state.loading = false;

  const normalized = [];

  action.payload.forEach((day) => {
    day.counsellors.forEach((c) => {
      normalized.push({
        date: day.date,
        counsellor_id: c.counsellor_id,
        counsellor_name: c.counsellor_name,

        // ✅ SORTED SLOTS
        slots: sortSlotsAsc(
          c.bookings.map((b) => ({
            slot_id: b.booking_id,
            start_time: b.start_time,
            end_time: b.end_time,
            status: b.status,
            student_name: b.student_name,
            student_email: b.student_email,
            preferred_mode: b.preferred_mode,
          }))
        ),
      });
    });
  });

  state.counsellorWiseList = normalized;
})
      .addCase(fetchSlotsCounsellorWiseScheduler.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });



  },
});

export const { resetSlotState } = counsellingSlotSlice.actions;
export default counsellingSlotSlice.reducer;
