import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getEnquiriesApi } from "../adminApi/enquiryApi";
import dayjs from "dayjs"; // ✅ REQUIRED

export const fetchEnquiries = createAsyncThunk(
  "enquiry/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getEnquiriesApi();

      const transformedData = response.data.map((item) => {
        // Normalize program_detail (backend returns array of objects)
        const programDetailArray = Array.isArray(item.program_detail)
          ? item.program_detail
          : [];

        const programText = programDetailArray.length
          ? programDetailArray.map((p) => p.name).join(", ")
          : Array.isArray(item.program)
          ? item.program.join(", ")
          : item.program || "N/A";

        return {
          key: item.id,
          id: item.id,
          name: `${item.first_name} ${item.last_name}`,
          first_name: item.first_name,
          last_name: item.last_name,
          phone: item.phone,
          email: item.email,
          program: programText,
          programId: item.program,
          // keep backend array under `program_detail` so UI can read it directly
          program_detail: programDetailArray,
          handholding_details: item.handholding_details || null,
          source: item.source
            ? item.source.charAt(0).toUpperCase() +
              item.source.slice(1).toLowerCase()
            : "N/A",
          status: item.status
            ? item.status.charAt(0).toUpperCase() +
              item.status.slice(1).toLowerCase()
            : "N/A",

          // ✅ ONLY BACKEND DATE
          date: item.date ? dayjs(item.date).format("YYYY-MM-DD") : "N/A",
        };
      });

    const sortedData = transformedData.sort((a, b) => {
  if (a.date === "N/A") return 1;
  if (b.date === "N/A") return -1;

  return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
});

return sortedData;

    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to fetch enquiries"
      );
    }
  }
);


const enquiryListSlice = createSlice({
  name: "enquiryList",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearEnquiryListState: (state) => {
      state.list = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnquiries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnquiries.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchEnquiries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearEnquiryListState } = enquiryListSlice.actions;
export default enquiryListSlice.reducer;
