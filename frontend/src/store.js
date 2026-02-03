import { configureStore } from "@reduxjs/toolkit";

//  ================ ADMIN REDUCERS =================
import authReducer from "./adminSlices/authSlice";
import forgotPasswordReducer from "./adminSlices/forgotPasswordSlice";
import resetPasswordReducer from "./adminSlices/resetPasswordSlice";
import addEnquiryReducer from "./adminSlices/addEnquirySlice";
import enquiryListReducer from "./adminSlices/enquiryListSlice";
import programReducer from "./adminSlices/programSlice";
import userReducer from "./adminSlices/userSlice";
import packageReducer from "./adminSlices/packageSlice";
import paymentReducer from "./adminSlices/paymentSlice";
import counsellingSlotReducer from "./adminSlices/counsellingSlotSlice";
import counsellorReducer from "./adminSlices/counsellorSlice";
import normalCounsellorReducer from "./adminSlices/normalCounsellorSlice";
import counsellingBookingReducer from "./adminSlices/counsellingBookingSlice";
import profileReducer from "./adminSlices/profileSlice";
import convertEnquiryReducer from "./adminSlices/convertEnquirySlice";
import updateEnquiryReducer from "./adminSlices/updateEnquirySlice";


const store = configureStore({
  reducer: {
        auth: authReducer,
        forgotPassword: forgotPasswordReducer,
        resetPassword: resetPasswordReducer,
        addEnquiry: addEnquiryReducer,
        enquiryList: enquiryListReducer,
        programs: programReducer, 
        users: userReducer,
        packages: packageReducer,
        payment: paymentReducer,
        counsellingSlots: counsellingSlotReducer,
        counsellors: counsellorReducer,
        normalCounsellors: normalCounsellorReducer,
        counsellingBooking: counsellingBookingReducer,
        profile: profileReducer,
        convertEnquiry: convertEnquiryReducer,
        updateEnquiry: updateEnquiryReducer,

  },
});

export default store;
