import { BrowserRouter, Routes, Route } from "react-router-dom";

{/*  Student Dashboard */}
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

{/*  Admin Dashboard */}
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
import LeadList from "./components/counsellor/pages/LeadList";





const App = () => {
  return (
    <BrowserRouter>
      <Routes>

          {/* =================== STUDENT AUTH ROUTES ===================== */}
        <Route path="/register" element={<StudentRegister />} />
        {/* <Route path="/" element={<StudentLogin />} /> */}
        {/* <Route path="/forgot_password" element={<Forgot_Password />} /> 
        <Route path="/reset_password" element={<Reset_Password />} />  */}


          {/* =================== ADMIN AUTH ROUTES ===================== */}
        <Route path="/" element={<AdminLogin />} /> 
        <Route path="/forgotpassword" element={<ForgotPassword />} /> 
        <Route path="/resetpassword" element={<ResetPassword />} /> 
        

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
        </Route>


           {/* ===================== ADMIN ROUTES ===================== */}
        <Route path="/admin" element={<AdminLayout />}>
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

            {/* ===================== counsellor ROUTES ===================== */}
          <Route path="leadlist" element={<LeadList />} />


       
          {/* <Route path="reset-password" element={<ResetPassword />} /> */}

        </Route>
       

      </Routes>
    </BrowserRouter>
  );
};

export default App;
