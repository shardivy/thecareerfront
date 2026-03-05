// src/adminSlices/counsellorSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchLeadCounsellorsApi, getMyStudentsApi, createCounsellingNoteApi,fetchCounsellingNoteApi, fetchCounsellorDashboardCountApi } from "../adminApi/counsellorApi";

/* ================= THUNK ================= */

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
      console.log("FETCHING NOTE FOR:", bookingId);
      const data = await fetchCounsellingNoteApi(bookingId);
      console.log("API Response:", data);

      // Handle array response safely
      let noteData = null;

      if (Array.isArray(data) && data.length > 0) {
        noteData = data[0]; // take latest / first note
      } else if (!Array.isArray(data)) {
        noteData = data;
      }

      return {
        bookingId,
        notes: noteData?.notes || "",
        file_urls: noteData?.file_urls || [],
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

/* ================= SLICE ================= */

const counsellorSlice = createSlice({
  name: "counsellors", 
  initialState: {
    list: [],
    students: [],          // 👈 my-students list
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

   
    
      .addCase(fetchCounsellingNote.pending, (state) => {
        state.notesLoading = true;
        state.error = null;
      })
   .addCase(fetchCounsellingNote.fulfilled, (state, action) => {
        state.notesLoading = false;
        
        const { bookingId, notes, file_urls } = action.payload;
        
        if (bookingId) {
          // Store with both properties for compatibility
          state.notes[bookingId] = {
            notes: notes || "",
            file_urls: file_urls || [],
            uploadedFiles: file_urls || [], // Add this for backward compatibility
          };
          
          console.log("Stored note in state:", state.notes[bookingId]);
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
      });
    }
});

export default counsellorSlice.reducer;