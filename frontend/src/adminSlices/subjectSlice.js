import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getSubjectsApi } from "../adminApi/subjectApi";

// ============================
// 🔹 FETCH SUBJECTS
// ============================
export const fetchSubjects = createAsyncThunk(
  "subjects/fetchSubjects",
  async (_, { rejectWithValue }) => {
    try {
      return await getSubjectsApi();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch subjects"
      );
    }
  }
);

const subjectSlice = createSlice({
  name: "subjects",
  initialState: {
    subjectList: [],
    loading: false,
    error: null,
  },
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchSubjects.pending, (state) => {
        state.loading = true;
      })
  .addCase(fetchSubjects.fulfilled, (state, action) => {
  state.loading = false;

  // console.log("Subjects API Response:", action.payload); 

state.subjectList = Array.isArray(action.payload)
  ? action.payload
  : action.payload?.data || [];
})
      .addCase(fetchSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default subjectSlice.reducer;