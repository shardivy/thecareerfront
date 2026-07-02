import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  uploadContentApi,
  updateContentApi,
  getContentListApi,
  getContentCountApi,
  deleteContentApi,
  incrementDownloadCountApi,
  getProgramContentApi,
  getStudentCounsellingNotesApi,
  getFilteredContentApi,
  assignStreamContentApi,
  getStudentContentApi,
  updateStreamContentApi,
} from "../adminApi/contentApi";

// ================= THUNK =================
export const uploadContent = createAsyncThunk(
  "content/uploadContent",
  async (formData, { rejectWithValue }) => {
    try {
      const data = await uploadContentApi(formData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Upload failed"
      );
    }
  }
);

// ================= UPDATE THUNK =================
export const updateContent = createAsyncThunk(
  "content/updateContent",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const data = await updateContentApi(id, formData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Update failed"
      );
    }
  }
);


// ================= GET CONTENT LIST =================
export const fetchContentList = createAsyncThunk(
  "content/fetchContentList",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getContentListApi();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Fetch failed"
      );
    }
  }
);


// ================= DELETE CONTENT =================
export const deleteContent = createAsyncThunk(
  "content/deleteContent",
  async (id, { rejectWithValue }) => {
    try {
      await deleteContentApi(id);
      return id; // return deleted id
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Delete failed"
      );
    }
  }
);

// ================= GET CONTENT COUNT =================
export const fetchContentCount = createAsyncThunk(
  "content/fetchContentCount",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getContentCountApi();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Fetch count failed"
      );
    }
  }
);

// ================= INCREMENT DOWNLOAD COUNT =================
export const incrementDownloadCount = createAsyncThunk(
  "content/incrementDownloadCount",
  async (id, { rejectWithValue }) => {
    try {
      const data = await incrementDownloadCountApi(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to increment download count");
    }
  }
);

// ================= FETCH PROGRAM CONTENT =================
export const fetchProgramContent = createAsyncThunk(
  "content/fetchProgramContent",
  async (programId, { rejectWithValue }) => {
    try {
      const data = await getProgramContentApi(programId);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Program content fetch failed"
      );
    }
  }
);

export const fetchStudentCounsellingNotes = createAsyncThunk(
  "counsellors/fetchStudentCounsellingNotes",
  async (
    { studentId, programId, packageId },
    { rejectWithValue }
  ) => {
    try {
      return await getStudentCounsellingNotesApi(
        studentId,
        programId,
        packageId
      );
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to fetch counselling notes"
      );
    }
  }
);

export const fetchFilteredContent = createAsyncThunk(
  "content/fetchFilteredContent",
  async (
    { programId, packageId, streamIds },
    { rejectWithValue }
  ) => {
    try {
      const data = await getFilteredContentApi(
        programId,
        packageId,
        streamIds
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data ||
        "Filtered content fetch failed"
      );
    }
  }
);

export const assignStreamContent = createAsyncThunk(
  "content/assignStreamContent",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await assignStreamContentApi(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to assign content"
      );
    }
  }
);

export const fetchStudentContent = createAsyncThunk(
  "content/fetchStudentContent",
  async (studentId, { rejectWithValue }) => {
    try {
      const data = await getStudentContentApi(studentId);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch student content"
      );
    }
  }
);


//================= UPDATE STREAM CONTENT (already-assigned content) =================
export const updateStreamContent = createAsyncThunk(
  "content/updateStreamContent",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await updateStreamContentApi(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update assigned content"
      );
    }
  }
);
 

// ================= SLICE =================
const contentSlice = createSlice({
  name: "content",
  initialState: {
    loading: false,
    success: false,
    error: null,
    contentList: [],
    studentContent: [],
    contentStats: null,
    studentCounsellingNotes: [],
    studentCounsellingNotesLoading: false,
    assignLoading: false,
    assignSuccess: false,

  },
 reducers: {
  resetContentState: (state) => {
    state.loading = false;
    state.success = false;
    state.error = null;
  },

  clearFilteredContent: (state) => {
    state.contentList = [];
  },
},
  extraReducers: (builder) => {
    builder
      .addCase(uploadContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadContent.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(uploadContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //get content list cases
      .addCase(fetchContentList.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchContentList.fulfilled, (state, action) => {
        state.loading = false;

        const list = action.payload?.data || [];

        state.contentList = list.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
      })
      .addCase(fetchContentList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContent.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // DELETE CASES
      .addCase(deleteContent.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteContent.fulfilled, (state, action) => {
        state.loading = false;

        // remove deleted item from state
        state.contentList = state.contentList.filter(
          (item) => item.id !== action.payload
        );
      })
      .addCase(deleteContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // COUNT CASES
      .addCase(fetchContentCount.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchContentCount.fulfilled, (state, action) => {
        state.loading = false;
        state.contentStats = action.payload?.data || action.payload;
      })
      .addCase(fetchContentCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // INCREMENT DOWNLOAD COUNT
      .addCase(incrementDownloadCount.pending, (state) => {
        state.loading = true;
      })
      .addCase(incrementDownloadCount.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally update contentStats if needed
        if (action.payload?.id) {
          const item = state.contentList.find(c => c.id === action.payload.id);
          if (item) item.downloads = action.payload.downloads; // assuming API returns new count
        }
      })
      .addCase(incrementDownloadCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      // ================= PROGRAM CONTENT =================
      .addCase(fetchProgramContent.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProgramContent.fulfilled, (state, action) => {
        state.loading = false;

        const list = action.payload?.data || [];

        state.contentList = list.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
      })
      .addCase(fetchProgramContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      /* FETCH STUDENT COUNSELLING NOTES */
      .addCase(fetchStudentCounsellingNotes.pending, (state) => {
        state.studentCounsellingNotesLoading = true;
        state.error = null;
      })

      .addCase(fetchStudentCounsellingNotes.fulfilled, (state, action) => {
        state.studentCounsellingNotesLoading = false;

        state.studentCounsellingNotes =
          action.payload?.data ||
          action.payload ||
          [];
      })

      .addCase(fetchStudentCounsellingNotes.rejected, (state, action) => {
        state.studentCounsellingNotesLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchFilteredContent.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchFilteredContent.fulfilled, (state, action) => {
        console.log("API Response:", action.payload);
        state.loading = false;

        state.contentList =
          action.payload?.data ||
          action.payload ||
          [];
      })

      .addCase(fetchFilteredContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(assignStreamContent.pending, (state) => {
        state.assignLoading = true;
        state.assignSuccess = false;
      })

      .addCase(assignStreamContent.fulfilled, (state, action) => {
        state.assignLoading = false;
        state.assignSuccess = true;
      })

      .addCase(assignStreamContent.rejected, (state, action) => {
        state.assignLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchStudentContent.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchStudentContent.fulfilled, (state, action) => {
         console.log("Student API Response:", action.payload);
        state.loading = false;

       state.studentContent = Array.isArray(action.payload?.contents)
      ? action.payload.contents
      : [];
      })

      .addCase(fetchStudentContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= UPDATE STREAM CONTENT =================
      .addCase(updateStreamContent.pending, (state) => {
        state.updateLoading = true;
        state.updateSuccess = false;
      })
 
      .addCase(updateStreamContent.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateSuccess = true;
      })
 
      .addCase(updateStreamContent.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })
 
  },
});

export const { resetContentState , clearFilteredContent} = contentSlice.actions;
export default contentSlice.reducer;