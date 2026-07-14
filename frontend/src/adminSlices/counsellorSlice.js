// src/adminSlices/counsellorSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchReenaCounsellorApi, fetchLeadCounsellorsApi, getMyStudentsApi, createCounsellingNoteApi, fetchCounsellingNoteApi, fetchCounsellorDashboardCountApi, updateCounsellingNoteApi, fetchCounsellorBookingsApi, deleteCounsellingFileApi, getMyStudentsNewApi ,fetchAllCounsellorsApi} from "../adminApi/counsellorApi";

/* ================= THUNK ================= */

// ✅ NEW THUNK FOR LEAD COUNSELLOR
export const fetchReenaCounsellor = createAsyncThunk(
  "leadCounsellors/fetchReena",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchReenaCounsellorApi();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to fetch lead counsellor"
      );
    }
  }
);

export const fetchLeadCounsellors = createAsyncThunk(
  "leadCounsellors/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchLeadCounsellorsApi();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch lead counsellors"
      );
    }
  }
);

/* ================= FETCH ALL COUNSELLORS ================= */

export const fetchAllCounsellors = createAsyncThunk(
  "counsellors/fetchAllCounsellors",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchAllCounsellorsApi();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch all counsellors"
      );
    }
  }
);


export const fetchMyStudentsNew = createAsyncThunk(
  "counsellors/fetchMyStudentsNew",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getMyStudentsNewApi(); // ✅ new API
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch students"
      );
    }
  }
);

/*** Fetch My Students */
export const fetchMyStudents = createAsyncThunk(
  "counsellors/fetchMyStudents",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getMyStudentsApi();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch students"
      );
    }
  }
);

/*** Fetch Counsellor Bookings (Session History) */
export const fetchCounsellorBookings = createAsyncThunk(
  "counsellors/fetchCounsellorBookings",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchCounsellorBookingsApi();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to fetch counsellor bookings"
      );
    }
  }
);


export const createCounsellingNote = createAsyncThunk(
  "counsellors/createNote",
  async ({ bookingId, payload }, { rejectWithValue }) => {
    try {
      const data = await createCounsellingNoteApi(bookingId, payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save notes"
      );
    }
  }
);



export const fetchCounsellingNote = createAsyncThunk(
  "counsellors/fetchNote",
  async (bookingId, { rejectWithValue }) => {
    try {
      const data = await fetchCounsellingNoteApi(bookingId);

      let noteData = null;

      if (Array.isArray(data) && data.length > 0) {
        noteData = data[0]; // take latest note
      } else if (!Array.isArray(data)) {
        noteData = data;
      }

      // Convert file1..file5 into array with keys
      const filesArray = [
        noteData?.file1 ? { url: noteData.file1, key: "file1" } : null,
        noteData?.file2 ? { url: noteData.file2, key: "file2" } : null,
        noteData?.file3 ? { url: noteData.file3, key: "file3" } : null,
        noteData?.file4 ? { url: noteData.file4, key: "file4" } : null,
        noteData?.file5 ? { url: noteData.file5, key: "file5" } : null,
      ].filter(Boolean);

      return {
        bookingId,
        id: noteData?.id,
        notes: noteData?.notes || "",
        file_urls: filesArray, // array of {url,key}
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch counselling note"
      );
    }
  }
);


export const fetchCounsellorDashboardCount = createAsyncThunk(
  "counsellors/fetchDashboardCount",
  async (period, { rejectWithValue }) => {
    try {
      const data = await fetchCounsellorDashboardCountApi(period);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch dashboard stats"
      );
    }
  }
);

export const updateCounsellingNote = createAsyncThunk(
  "counsellors/updateNote",
  async ({ bookingId, noteId, payload }, { rejectWithValue }) => {
    try {
      const data = await updateCounsellingNoteApi(
        bookingId,
        noteId,
        payload
      );

      return { bookingId, data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update note"
      );
    }
  }
);

export const deleteCounsellingFile = createAsyncThunk(
  "counsellors/deleteFile",
  async ({ bookingId, noteId, fileKey }, { rejectWithValue }) => {
    try {
      const data = await deleteCounsellingFileApi(bookingId, noteId, fileKey);
      return { bookingId, fileKey, data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete file"
      );
    }
  }
);

/* ================= SLICE ================= */

const counsellorSlice = createSlice({
  name: "counsellors",
  initialState: {
    list: [],
    students: [],
    leadCounsellorList: [],
    notes: {},
    dashboardStats: {
      assignedStudents: 0,
      upcomingSessions: 0,
      completedSessions: 0,
    },
    loading: false,
    studentsLoading: false,
    dashboardLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* -------- FETCH REENA COUNSELLOR -------- */
      .addCase(fetchReenaCounsellor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchReenaCounsellor.fulfilled, (state, action) => {
        state.loading = false;

        if (Array.isArray(action.payload)) {
          state.leadCounsellorList = action.payload.map((c) => ({
            id: c.id || c.id,
            first_name: c.user?.first_name || "",
            last_name: c.user?.last_name || "",
            email: c.user?.email || "",
          }));
        } else {
          state.leadCounsellorList = [];
        }
      })

      .addCase(fetchReenaCounsellor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchLeadCounsellors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchLeadCounsellors.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          state.list = action.payload.map((c) => ({
            id: c.id || c.id,
            first_name: c.user?.first_name || "",
            last_name: c.user?.last_name || "",
            email: c.user?.email || "",
          }));
        } else {
          state.list = [];
        }
      })

      .addCase(fetchLeadCounsellors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* -------- FETCH ALL COUNSELLORS -------- */

.addCase(fetchAllCounsellors.pending, (state) => {
  state.loading = true;
  state.error = null;
})

.addCase(fetchAllCounsellors.fulfilled, (state, action) => {
  state.loading = false;

  if (Array.isArray(action.payload)) {
    state.list = action.payload.map((c) => ({
      id: c.id || c.id,
      first_name: c.user?.first_name || "",
      last_name: c.user?.last_name || "",
      email: c.user?.email || "",
    }));
  } else {
    state.list = [];
  }
})

.addCase(fetchAllCounsellors.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

      .addCase(fetchMyStudentsNew.pending, (state) => {
        state.studentsLoading = true;
        state.error = null;
      })
      .addCase(fetchMyStudentsNew.fulfilled, (state, action) => {
        state.studentsLoading = false;
        if (Array.isArray(action.payload)) {
          state.students = action.payload; // ✅ update students list with new API
        } else {
          state.students = [];
        }
      })
      .addCase(fetchMyStudentsNew.rejected, (state, action) => {
        state.studentsLoading = false;
        state.error = action.payload;
      })

      /* -------- FETCH MY STUDENTS -------- */
      .addCase(fetchMyStudents.pending, (state) => {
        state.studentsLoading = true;
        state.error = null;
      })

      .addCase(fetchMyStudents.fulfilled, (state, action) => {
        state.studentsLoading = false;

        if (Array.isArray(action.payload)) {
          state.students = action.payload;
        } else {
          state.students = [];
        }
      })

      .addCase(fetchMyStudents.rejected, (state, action) => {
        state.studentsLoading = false;
        state.error = action.payload;
      })

      /* -------- FETCH COUNSELLOR BOOKINGS -------- */
      .addCase(fetchCounsellorBookings.pending, (state) => {
        state.studentsLoading = true;
        state.error = null;
      })

      .addCase(fetchCounsellorBookings.fulfilled, (state, action) => {
        state.studentsLoading = false;

        if (Array.isArray(action.payload.data)) {
          state.students = action.payload.data;
        } else {
          state.students = [];
        }
      })

      .addCase(fetchCounsellorBookings.rejected, (state, action) => {
        state.studentsLoading = false;
        state.error = action.payload;
      })

      // 
      /* FETCH COUNSELLING NOTE */
      .addCase(fetchCounsellingNote.pending, (state) => {
        state.notesLoading = true;
        state.error = null;
      })
      .addCase(fetchCounsellingNote.fulfilled, (state, action) => {
        state.notesLoading = false;

        const { bookingId, id, notes, file_urls } = action.payload;

        if (bookingId) {
          state.notes[bookingId] = {
            id,
            notes: notes || "",
            file_urls, // array of {url,key}
          };
          // console.log("Stored note with files:", state.notes[bookingId]);
        }
      })
      .addCase(fetchCounsellingNote.rejected, (state, action) => {
        state.notesLoading = false;
        state.error = action.payload;
      })

      /* DASHBOARD */
      .addCase(fetchCounsellorDashboardCount.pending, (state) => {
        state.dashboardLoading = true;
      })
      .addCase(fetchCounsellorDashboardCount.fulfilled, (state, action) => {
        state.dashboardLoading = false;

        state.dashboardStats = {
          assignedStudents: action.payload?.assigned_students || 0,
          upcomingSessions: action.payload?.upcoming_sessions || 0,
          completedSessions: action.payload?.completed_sessions || 0,
        };
      })
      .addCase(fetchCounsellorDashboardCount.rejected, (state) => {
        state.dashboardLoading = false;
      })

      /* -------- UPDATE COUNSELLING NOTE -------- */
      .addCase(updateCounsellingNote.pending, (state) => {
        state.notesLoading = true;
      })
      .addCase(updateCounsellingNote.fulfilled, (state, action) => {
        state.notesLoading = false;
        const { bookingId, data } = action.payload;

        if (bookingId) {
          state.notes[bookingId] = {
            id: data?.id,
            notes: data?.notes || "",
            file_urls: data?.file_urls || [],
            uploadedFiles: data?.file_urls || [],
          };
        }
      })
      .addCase(updateCounsellingNote.rejected, (state, action) => {
        state.notesLoading = false;
        state.error = action.payload;
      })

      // delete file
      /* DELETE FILE */
      .addCase(deleteCounsellingFile.fulfilled, (state, action) => {
        const { bookingId, fileKey } = action.payload;
        const note = state.notes[bookingId];
        if (note) {
          note.file_urls = note.file_urls.filter((file) => file.key !== fileKey);
        }
      })
      .addCase(deleteCounsellingFile.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export default counsellorSlice.reducer;