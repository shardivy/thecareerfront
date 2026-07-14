// studentSelectionSlice.js

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedProgramId: null,
  selectedProgram: null,
  selectedPackageId: null,
  selectedPackage: null,
};

const studentSelectionSlice = createSlice({
  name: "studentSelection",
  initialState,
  reducers: {
    setSelection: (state, action) => {
      state.selectedProgramId = action.payload.programId;
      state.selectedProgram = action.payload.programName;
      state.selectedPackageId = action.payload.packageId;
      state.selectedPackage = action.payload.packageName;
    },

    clearSelection: (state) => {
      state.selectedProgramId = null;
      state.selectedProgram = null;
      state.selectedPackageId = null;
      state.selectedPackage = null;
    },
  },
});

export const { setSelection, clearSelection } =
  studentSelectionSlice.actions;

export default studentSelectionSlice.reducer;