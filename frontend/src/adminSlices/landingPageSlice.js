import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createLandingPageApi,
  getLandingPagesApi,
  updateLandingPageApi,
  deleteLandingPageApi ,
  getLandingPageByPackageApi 
} from "../adminApi/landingPageApi";

/* ---------------- CREATE ---------------- */
export const createLandingPage = createAsyncThunk(
  "landingPage/create",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await createLandingPageApi(payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

/* ---------------- GET ---------------- */
export const fetchLandingPages = createAsyncThunk(
  "landingPage/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getLandingPagesApi();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch");
    }
  }
);

/* ---------------- UPDATE ---------------- */
export const updateLandingPage = createAsyncThunk(
  "landingPage/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await updateLandingPageApi(id, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Update failed");
    }
  }
);


export const deleteLandingPage = createAsyncThunk(
  "landingPage/delete",
  async (id, { rejectWithValue }) => {
    try {
      await deleteLandingPageApi(id);
      return id; // return deleted id
    } catch (error) {
      return rejectWithValue(error.response?.data || "Delete failed");
    }
  }
);


export const fetchLandingPageByPackage = createAsyncThunk(
  "landingPage/fetchByPackage",
  async (packageId, { rejectWithValue }) => {
    try {
      const data = await getLandingPageByPackageApi(packageId);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch package landing page"
      );
    }
  }
);

/* ---------------- SLICE ---------------- */
const landingPageSlice = createSlice({
  name: "landingPage",
  initialState: {
    list: [], // ✅ ADD THIS
      currentPackageLanding: null,
    loading: false,
    success: false,
    error: null,
  },
  reducers: {
    resetLandingState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      /* CREATE */
      .addCase(createLandingPage.pending, (state) => {
        state.loading = true;
      })
      .addCase(createLandingPage.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(createLandingPage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* GET */
      .addCase(fetchLandingPages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLandingPages.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload; // ✅ store data
      })
      .addCase(fetchLandingPages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* UPDATE */
.addCase(updateLandingPage.pending, (state) => {
  state.loading = true;
})
.addCase(updateLandingPage.fulfilled, (state) => {
  state.loading = false;
  state.success = true;
})
.addCase(updateLandingPage.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

/* DELETE */
.addCase(deleteLandingPage.pending, (state) => {
  state.loading = true;
})
.addCase(deleteLandingPage.fulfilled, (state, action) => {
  state.loading = false;

  // remove deleted item instantly from UI
  state.list = state.list.filter(
    (item) => item.id !== action.payload
  );
})
.addCase(deleteLandingPage.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})
.addCase(fetchLandingPageByPackage.pending, (state) => {
  state.loading = true;
})

.addCase(fetchLandingPageByPackage.fulfilled, (state, action) => {
  state.loading = false;
  state.currentPackageLanding = action.payload?.data?.[0] || null;
})

.addCase(fetchLandingPageByPackage.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})
  },
});

export const { resetLandingState } = landingPageSlice.actions;
export default landingPageSlice.reducer;