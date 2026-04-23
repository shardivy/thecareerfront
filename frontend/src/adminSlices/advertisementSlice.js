import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createAdvertisementApi,
  getAdvertisementsApi,
  updateAdvertisementApi,
  getAdvertisementStatsApi
 } from "../adminApi/advertisementApi";

// CREATE ADVERTISEMENT
export const createAdvertisement = createAsyncThunk(
  "advertisement/createAdvertisement",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await createAdvertisementApi(payload);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create advertisement"
      );
    }
  }
);

// ================= GET =================
export const getAdvertisements = createAsyncThunk(
  "advertisement/getAdvertisements",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAdvertisementsApi();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to fetch advertisements"
      );
    }
  }
);

export const updateAdvertisement = createAsyncThunk(
  "advertisement/updateAdvertisement",
  async ({ id, payload }, { rejectWithValue }) => {
    try {

      const response = await updateAdvertisementApi(
        id,
        payload
      );

      return response;

    } catch (error) {

      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to update advertisement"
      );

    }
  }
);

export const getAdvertisementStats = createAsyncThunk(
 "advertisement/getAdvertisementStats",
 async (_, { rejectWithValue }) => {
   try {
      const response = await getAdvertisementStatsApi();
      return response;
   } catch(error){
      return rejectWithValue(
         error.response?.data?.message ||
         "Failed to fetch stats"
      );
   }
 }
);

const advertisementSlice = createSlice({
  name: "advertisement",
  initialState: {
    loading: false,
    success: false,
    error: null,
    data: null,
    advertisementList: [], 
     statsData:{
   total_ads:0,
   active_ads:0,
   scheduled_ads:0,
   completed_ads:0
 }
  },
  reducers: {
    clearAdvertisementState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAdvertisement.pending, (state) => {
        state.loading = true;
        state.success = false;
      })
      .addCase(createAdvertisement.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })
      .addCase(createAdvertisement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

       // GET ADS
      .addCase(getAdvertisements.pending, (state) => {
        state.loading = true;
      })

      .addCase(getAdvertisements.fulfilled, (state, action) => {
        state.loading = false;

        state.advertisementList =
          action.payload?.data || action.payload || [];
      })

      .addCase(getAdvertisements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE ADVERTISEMENT
.addCase(updateAdvertisement.pending,(state)=>{
   state.loading=true;
})

.addCase(updateAdvertisement.fulfilled,(state,action)=>{
   state.loading=false;
   state.success=true;
   state.data=action.payload;

   // optional update row immediately
   const updatedId = action.meta.arg.id;

   state.advertisementList =
      state.advertisementList.map(item =>
         item.id === updatedId
           ? action.payload
           : item
      );
})

.addCase(updateAdvertisement.rejected,(state,action)=>{
   state.loading=false;
   state.error=action.payload;
})

// GET STATS
.addCase(getAdvertisementStats.pending,(state)=>{
   state.loading=true;
})

.addCase(getAdvertisementStats.fulfilled,(state,action)=>{
   state.loading=false;

   state.statsData =
      action.payload?.data ||
      action.payload ||
      {};
})

.addCase(getAdvertisementStats.rejected,(state,action)=>{
   state.loading=false;
   state.error=action.payload;
})
  },
});

export const { clearAdvertisementState } = advertisementSlice.actions;
export default advertisementSlice.reducer;