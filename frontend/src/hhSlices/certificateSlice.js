import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getCertificateTemplatesApi ,
  getPendingCertificatesApi,
  generateCertificatesApi,
} from "../hhApi/certificateApi";

// ✅ THUNK
export const getCertificateTemplates = createAsyncThunk(
  "certificate/getTemplates",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getCertificateTemplatesApi();
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch certificate templates"
      );
    }
  }
);

// ================= PENDING STUDENTS =================
export const getPendingCertificates = createAsyncThunk(
  "certificate/getPendingCertificates",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getPendingCertificatesApi();
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch pending certificates"
      );
    }
  }
);

// ================= GENERATE CERTIFICATES =================
export const generateCertificates = createAsyncThunk(
  "certificate/generateCertificates",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await generateCertificatesApi(payload);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to generate certificates"
      );
    }
  }
);

const certificateSlice = createSlice({
  name: "certificate",
  initialState: {
    templates: [],
     pendingStudents: [],  
    loading: false,
     pendingLoading: false,
       generateLoading: false,
    error: null,
  },
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(getCertificateTemplates.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCertificateTemplates.fulfilled, (state, action) => {
        state.loading = false;

        // ✅ handle different API formats safely
        state.templates =
          action.payload?.data || action.payload || [];
      })
      .addCase(getCertificateTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

       // ================= PENDING STUDENTS =================
      .addCase(getPendingCertificates.pending, (state) => {
        state.pendingLoading = true;
      })
      .addCase(getPendingCertificates.fulfilled, (state, action) => {
        state.pendingLoading = false;
        state.pendingStudents = action.payload?.data || action.payload || [];
      })
      .addCase(getPendingCertificates.rejected, (state, action) => {
        state.pendingLoading = false;
        state.error = action.payload;
      })

      .addCase(generateCertificates.pending, (state) => {
  state.generateLoading = true;
})
.addCase(generateCertificates.fulfilled, (state) => {
  state.generateLoading = false;
})
.addCase(generateCertificates.rejected, (state, action) => {
  state.generateLoading = false;
  state.error = action.payload;
});
  },
});

export default certificateSlice.reducer;