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
// import normalCounsellorReducer from "./adminSlices/normalCounsellorSlice";
import counsellingBookingReducer from "./adminSlices/counsellingBookingSlice";
import profileReducer from "./adminSlices/profileSlice";
import convertEnquiryReducer from "./adminSlices/convertEnquirySlice";
import updateEnquiryReducer from "./adminSlices/updateEnquirySlice";
import examReducer from "./adminSlices/examSlice";
import userExamReducer from "./adminSlices/userExamSlice";
import reportReducer from "./adminSlices/reportSlice";
import dashboardReducer from "./adminSlices/dashboardSlice";
import studentReducer from "./adminSlices/studentSlice";
import streamReducer from "./adminSlices/streamSlice";
import subjectReducer from "./adminSlices/subjectSlice";
import hobbyReducer from "./adminSlices/hobbySlice";
import contentReducer from "./adminSlices/contentSlice";
import employeeReducer from "./adminSlices/employeeSlice";
import notificationReducer from "./adminSlices/notificationSlice";
import questionReducer from "./adminSlices/questionSlice";
import collegeAnalysisReducer from "./adminSlices/collegeAnalysisSlice";
import reviewReducer from "./adminSlices/reviewSlice";
import hhRegisterReducer from "./hhSlices/hhRegisterSlice";
import handholdingSessionReducer from "./hhSlices/handholdingSessionSlice";
import handholdingUsersReducer from "./hhSlices/handholdingUsersSlice";
import handholdingPaymentReducer from "./hhSlices/handholdingPaymentSlice";
import sessionBookingReducer from "./hhSlices/sessionBookingSlice";
import landingPageReducer from "./adminSlices/landingPageSlice";
import certificateReducer from "./hhSlices/certificateSlice";
import advertisementReducer from "./adminSlices/advertisementSlice";
import eventReducer from "./adminSlices/eventSlice";
import studentSelectionReducer from "./adminSlices/studentSelectionSlice";


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
        // normalCounsellors: normalCounsellorReducer,
        counsellingBooking: counsellingBookingReducer,
        profile: profileReducer,
        convertEnquiry: convertEnquiryReducer,
        updateEnquiry: updateEnquiryReducer,
        exam: examReducer,
        userExams: userExamReducer,
        reports: reportReducer,
        dashboard: dashboardReducer,
        student: studentReducer,
        streams: streamReducer,
        subjects: subjectReducer, 
        hobbies: hobbyReducer,
        content: contentReducer,
        employee: employeeReducer,
        notifications: notificationReducer,
        questions: questionReducer,
        collegeAnalysis: collegeAnalysisReducer,
        review: reviewReducer,
        landingPage: landingPageReducer,
        advertisement: advertisementReducer,
        event: eventReducer,

        studentSelection: studentSelectionReducer,

        hhRegister: hhRegisterReducer,
        hhSession: handholdingSessionReducer,
        handholdingUsers: handholdingUsersReducer,
        handholdingPayment: handholdingPaymentReducer,
        sessionBooking: sessionBookingReducer,
        certificate: certificateReducer,

  },
});

export default store;
