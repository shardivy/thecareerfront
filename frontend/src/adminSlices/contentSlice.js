import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { uploadContentApi, updateContentApi, getContentListApi,getContentCountApi, deleteContentApi} from "../adminApi/contentApi";

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


// ================= SLICE =================
const contentSlice = createSlice({
  name: "content",
  initialState: {
    loading: false,
    success: false,
    error: null,
    contentList: [],
     contentStats: null, 
  },
  reducers: {
    resetContentState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
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
  state.contentList = action.payload?.data || [];
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
});
  },
});

export const { resetContentState } = contentSlice.actions;
export default contentSlice.reducer;