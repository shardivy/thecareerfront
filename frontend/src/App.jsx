import { BrowserRouter, Routes, Route } from "react-router-dom";

{/*  Student Dashboard */ }
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./components/student/pages/StudentDashboard";
import StudentRegister from "./components/StudentRegister";
import StudentLogin from "./components/StudentLogin";
import JourneySteps from "./components/student/pages/JourneySteps";
import Program from "./components/student/pages/Program";
import FreeContent from "./components/student/pages/FreeContent";
import ExamManagement from "./components/student/pages/ExamManagement";
import ReportManagement from "./components/student/pages/ReportManagement";
import SlotBookingList from "./components/student/pages/SlotBookingList";
import ContentLibrary from "./components/student/pages/ContentLibrary";
import StudentProfile from "./components/student/pages/StudentProfile";
import AdminLogin from "./components/AdminLogin";
import Forgot_Password from "./components/student/pages/Forgot_Password";
import Reset_Password from "./components/student/pages/Reset_Password";
import StudentPayments from "./components/student/pages/Payments";

{/*  Admin Dashboard */ }
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./components/admin/pages/AdminDashboard";
import Enquiry from "./components/admin/pages/Enquiry";
import UserList from "./components/admin/pages/UserList";
import Programs from "./components/admin/pages/Programs";
import ReportsManagement from "./components/admin/pages/ReportsManagement";
import PaymentManagement from "./components/admin/pages/PaymentManagement";
import SlotBooking from "./components/admin/pages/SlotBooking";
import CreateSlot from "./components/admin/pages/CreateSlot";
import ContentManagement from "./components/admin/pages/ContentManagement";
import EmployeeList from "./components/admin/pages/EmployeeList";
import ExamManagements from "./components/admin/pages/ExamManagements";
import FollowUpManagement from "./components/admin/pages/FollowUpManagement";
import NotificationManagement from "./components/admin/pages/NotificationManagement";
import Profile from "./components/admin/pages/Profile";
import ForgotPassword from "./components/admin/pages/ForgotPassword";
import ResetPassword from "./components/admin/pages/ResetPassword";
import ExamList from "./components/admin/pages/ExamList";
import PaymentPage from "./components/student/pages/PaymentPage";
import CounsellorDashboard from "./components/counsellor/pages/CounsellorDashboard";
import SessionHistory from "./components/counsellor/pages/SessionHistory";
import UiUxDashboard from "./components/ui-ux/pages/UiUxDashboard";
import SessionsHistory from "./components/ui-ux/pages/SessionsHistory";
import ChangePassword from "./components/admin/pages/ChangePassword";
import HHLogin from "./components/HHLogin";
import HHRegister from "./components/HHRegister";
import CollegeListAnalysis from "./components/admin/pages/CollegeListAnalysis";
import EngineeringQuestionaries from "./components/student/pages/EngineeringQuestionaries";
import HandholdingManagement from "./components/admin/pages/HandholdingManagement";
import AptitudeAnalysisReports from "./components/student/pages/AptitudeAnalysisReports";
import SchedulerPage from "./components/admin/pages/SchedulerPage";
import WriteReview from "./components/student/pages/WriteReview";
import HandholdingLayout from "./layouts/HandholdingLayout";
import HandholdingDashboard from "./components/hh-users/pages/HandholdingDashboard";
import HhSession from "./components/hh-users/pages/HhSession";
import HhPayments from "./components/hh-users/pages/HhPayments";
import HhCertificates from "./components/hh-users/pages/HhCertificates";
import Welcome from "./components/Welcome";
import WelcomeEnquiry from "./components/WelcomeEnquiry";
import AptitudeDetails from "./components/AptitudeDetails";
import RegisterDetails from "./components/RegisterDetails";
import SeminarWebinarManagement from "./components/admin/pages/SeminarWebinarManagement";
import Advertisement from "./components/admin/pages/Advertisement";
import HhProfile from "./components/hh-users/pages/HhProfile";
import HhPaymentPage from "./components/hh-users/pages/HhPaymentPage";
import ProgramSelection from "./components/student/pages/ProgramSelection";
// ----------- Landing pages-------- 
import LawAdmission from "./components/landing-pages/LawAdmission";
import PgCounselling from "./components/landing-pages/PgCounselling";
import MedicalNeetGroup from "./components/landing-pages/MedicalNeetGroup";
import MedicalEndToEnd from "./components/landing-pages/MedicalEndToEnd";
import EngineeringPaidGroup from "./components/landing-pages/EngineeringPaidGroup";
import EngAdmissionSession from "./components/landing-pages/EngAdmissionSession";
import EngOciNri from "./components/landing-pages/EngOciNri";
import EleventhAdmission from "./components/landing-pages/EleventhAdmission";
import AbroadCounselling from "./components/landing-pages/AbroadCounselling";
import AdmissionCounselling from "./components/landing-pages/AdmissionCounselling";
import BBAAdmission from "./components/landing-pages/BBAAdmission";
import HandHolding from "./components/landing-pages/HandHolding";
import DesignArchPaidGroup from "./components/landing-pages/DesignArchPaidGroup";
import Apti812 from "./components/landing-pages/Apti812";
import Apti89 from "./components/landing-pages/Apti89";
import Apti10 from "./components/landing-pages/Apti10";
import Apti1112 from "./components/landing-pages/Apti1112";
import JeeOneOnOneGuidance from "./components/landing-pages/JeeOneOnOneGuidance";
import CetEngineeringGuidance from "./components/landing-pages/CetEngineeringGuidance";
import SeminarWebinarSession from "./components/landing-pages/SeminarWebinarSession";
import OCIEndToEnd from "./components/landing-pages/OCIEndToEnd";
import Default from "./components/landing-pages/Default";
import NotFound from "./NotFound";
import ExamRegistration from "./components/student/pages/Examregistration";


const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================== STUDENT AUTH ROUTES ===================== */}
        <Route path="/register" element={<StudentRegister />} />
        {/* <Route path="/" element={<StudentLogin />} /> */}
        {/* <Route path="/forgot_password" element={<Forgot_Password />} /> 
        <Route path="/reset_password" element={<Reset_Password />} />  */}
        <Route path="program-selection" element={<ProgramSelection />} />


        {/* =================== ADMIN AUTH ROUTES ===================== */}
        <Route path="/" element={<AdminLogin />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/resetpassword" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />

        <Route path="/welcome" element={<Welcome />} />
        <Route path="/welcome-enquiry" element={<WelcomeEnquiry />} />
        <Route path="/counselling-service" element={<AptitudeDetails />} />
        <Route path="/register-details" element={<RegisterDetails />} />

        {/* ===================== LANDING PAGE ROUTES ===================== */}
        <Route path="/law-service" element={<LawAdmission />} />
        <Route path="/pg-counselling-service" element={<PgCounselling />} />
        <Route path="/medical-end-to-end-counselling" element={<MedicalEndToEnd />} />
        <Route path="/medical-paid-group-service" element={<MedicalNeetGroup />} />
        <Route path="/engineering-paid-group-service" element={<EngineeringPaidGroup />} />
        {/* <Route path="/engineering-end-to-end-counselling" element={<EngAdmissionSession />} /> */}
        <Route path="/admission-counselling" element={<EngAdmissionSession />} />
        <Route path="/engineering-oci-nri-paid-group-service" element={<EngOciNri />} />
        <Route path="/oci-nri-end-to-end-counselling" element={<OCIEndToEnd />} />
        <Route path="/11th-admission-free-group-service" element={<EleventhAdmission />} />
        <Route path="/abroad-counselling-service" element={<AbroadCounselling />} />
        {/* <Route path="/admission-counselling-service" element={<AdmissionCounselling />} /> */}
        <Route path="/bba-paid-group-service" element={<BBAAdmission />} />
        <Route path="/handholding-program-service" element={<HandHolding />} />
        <Route path="/design-arch-paid-group-service" element={<DesignArchPaidGroup />} />
        <Route path="/8-12-aptitude-service" element={<Apti812 />} />
        <Route path="/8-9-aptitude-service" element={<Apti89 />} />
        <Route path="/10th-aptitude-service" element={<Apti10 />} />
        <Route path="/11-12-aptitude-service" element={<Apti1112 />} />
        <Route path="/jee-one-on-one-guidance" element={<JeeOneOnOneGuidance />} />
        <Route path="/cet-one-on-one-guidance" element={<CetEngineeringGuidance />} />
        <Route path="/seminar-webinar-session" element={<SeminarWebinarSession />} />

        <Route path="/default" element={<Default />} />


        {/* ===================== Handholding ROUTES ===================== */}
        <Route path="/hhlogin" element={<HHLogin />} />
        <Route path="/hhregister" element={<HHRegister />} />



        {/* =================== STUDENT ROUTES ===================== */}
        <Route path="/student" element={<StudentLayout />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="journeysteps" element={<JourneySteps />} />
          <Route path="program" element={<Program />} />
          <Route path="freecontent" element={<FreeContent />} />
          <Route path="exam-management" element={<ExamManagement />} />
          <Route path="report-management" element={<ReportManagement />} />
          <Route path="slot-booking" element={<SlotBookingList />} />
          <Route path="content-library" element={<ContentLibrary />} />
          <Route path="student-profile" element={<StudentProfile />} />
          <Route path="payments" element={<StudentPayments />} />
          <Route path="payment-page" element={<PaymentPage />} />
          <Route path="engineering-questionnaires" element={<EngineeringQuestionaries />} />
          <Route path="analysis-report" element={<AptitudeAnalysisReports />} />
          <Route path="write-review" element={<WriteReview />} />

        </Route>

        {/* Renders standalone — no StudentLayout sidebar/header */}
        <Route path="/student/exam-register" element={<ExamRegistration />} />

        {/* ===================== ADMIN ROUTES ===================== */}
        <Route path="/s-admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="enquiry-leads" element={<Enquiry />} />
          <Route path="users" element={<UserList />} />
          <Route path="programs" element={<Programs />} />
          <Route path="reportsManagement" element={<ReportsManagement />} />
          <Route path="paymentManagement" element={<PaymentManagement />} />
          <Route path="slotbooking" element={<SlotBooking />} />
          <Route path="createslot" element={<CreateSlot />} />
          <Route path="contentManagement" element={<ContentManagement />} />
          <Route path="employeeList" element={<EmployeeList />} />
          <Route path="examManagements" element={<ExamManagements />} />
          <Route path="followupManagement" element={<FollowUpManagement />} />
          <Route path="notificationManagement" element={<NotificationManagement />} />
          <Route path="profile" element={<Profile />} />
          <Route path="examlist" element={<ExamList />} />
          <Route path="collegeListAnalysis" element={<CollegeListAnalysis />} />
          <Route path="hhManagement" element={<HandholdingManagement />} />
          <Route path="scheduler" element={<SchedulerPage />} />

          <Route path="eventOutreach" element={<SeminarWebinarManagement />} />
          <Route path="advertisement" element={<Advertisement />} />




          {/* ===================== counsellor ROUTES ===================== */}

          <Route path="counsellor-dashboard" element={<CounsellorDashboard />} />
          <Route path="session-history" element={<SessionHistory />} />

          <Route path="uiux-dashboard" element={<UiUxDashboard />} />
          <Route path="sessions-history" element={<SessionsHistory />} />

        </Route>


        {/* ===================== HH User ROUTES ===================== */}

        <Route path="/handholding" element={<HandholdingLayout />}>
          <Route path="dashboard" element={<HandholdingDashboard />} />
          <Route path="sessions" element={<HhSession />} />
          <Route path="payments" element={<HhPayments />} />
          <Route path="certificates" element={<HhCertificates />} />
          <Route path="profile" element={<HhProfile />} />
          <Route path="payment-page" element={<HhPaymentPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
