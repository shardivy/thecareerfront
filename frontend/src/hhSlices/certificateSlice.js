import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCertificateTemplatesApi,
  getPendingCertificatesApi,
  generateCertificatesApi,
  getIssuedCertificatesApi,
  createCertificateTemplateApi,
  getParticipantCertificateApi,
  getCertificateStatsApi 
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

// ================= ISSUED CERTIFICATES =================
export const getIssuedCertificates = createAsyncThunk(
  "certificate/getIssuedCertificates",
  async (params, { rejectWithValue }) => {
    try {
      const data = await getIssuedCertificatesApi(params);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch issued certificates"
      );
    }
  }
);

export const createCertificateTemplate = createAsyncThunk(
  "certificate/createTemplate",
  async (formData, { rejectWithValue }) => {
    try {
      const data = await createCertificateTemplateApi(formData);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to create template"
      );
    }
  }
);

export const getParticipantCertificate = createAsyncThunk(
  "certificate/getParticipantCertificate",
  async (participantId, { rejectWithValue }) => {
    try {
      const data = await getParticipantCertificateApi(participantId);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch certificate"
      );
    }
  }
);

// ✅ CERTIFICATE STATS THUNK
export const getCertificateStats = createAsyncThunk(
  "certificate/getStats",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getCertificateStatsApi();
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch certificate stats"
      );
    }
  }
);

const certificateSlice = createSlice({
  name: "certificate",
  initialState: {
    templates: [],
    pendingStudents: [],
    issuedCertificates: [],
    issuedTotal: 0,
    participantCertificate: null,   
    certificateLoading: false,
    certificateStats: null,
statsLoading: false,
    loading: false,
    pendingLoading: false,
    generateLoading: false,
    issuedLoading: false,
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
      })

      .addCase(getIssuedCertificates.pending, (state) => {
        state.issuedLoading = true;
      })
      .addCase(getIssuedCertificates.fulfilled, (state, action) => {
        state.issuedLoading = false;

        // ✅ FIX HERE
        state.issuedCertificates = action.payload?.data || [];
        state.issuedTotal = action.payload?.count || 0;
      })
      .addCase(getIssuedCertificates.rejected, (state, action) => {
        state.issuedLoading = false;
        state.error = action.payload;
      })

      .addCase(createCertificateTemplate.pending, (state) => {
        state.loading = true;
      })
      .addCase(createCertificateTemplate.fulfilled, (state, action) => {
        state.loading = false;

        // ✅ Add new template to list instantly (optional but good UX)
        if (action.payload?.data) {
          state.templates.unshift(action.payload.data);
        }
      })
      .addCase(createCertificateTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getParticipantCertificate.pending, (state) => {
  state.certificateLoading = true;
})
.addCase(getParticipantCertificate.fulfilled, (state, action) => {
  state.certificateLoading = false;
  state.participantCertificate =
    action.payload?.data || action.payload;
})
.addCase(getParticipantCertificate.rejected, (state, action) => {
  state.certificateLoading = false;
  state.error = action.payload;
})

.addCase(getCertificateStats.pending, (state) => {
  state.statsLoading = true;
})
.addCase(getCertificateStats.fulfilled, (state, action) => {
  state.statsLoading = false;

  state.certificateStats =
    action.payload?.data || action.payload;
})
.addCase(getCertificateStats.rejected, (state, action) => {
  state.statsLoading = false;
  state.error = action.payload;
})
  },
});

export default certificateSlice.reducer;