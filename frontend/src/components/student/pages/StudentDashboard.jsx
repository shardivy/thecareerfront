import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Button,
  Row,
  Col,
  Typography,
  Grid,
  theme,
  Spin,
} from "antd";
import {
  BookOutlined,
  ContainerOutlined,
  FileTextOutlined,
  LockOutlined,
} from "@ant-design/icons";
import JourneySteps from "./JourneySteps";
import { fetchStudentJourney } from "../../../adminSlices/userSlice";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const StudentDashboard = () => {
  const screens = useBreakpoint();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = theme.useToken();

  const { journey, journeyLoading } = useSelector(
    (state) => state.users
  );

  const { profile } = useSelector((state) => state.profile);

  /* ================= FREE USER CHECK ================= */
  const isFreeUser = !profile?.package_id;

  /* ================= SAVE PROGRAM & PACKAGE IN LOCAL STORAGE ================= */
  useEffect(() => {
    if (!profile) return;

    if (profile.program) {
      localStorage.setItem("selectedProgram", profile.program);
      localStorage.setItem("program_id", profile.program_id);
    }

    if (profile.package_id) {
      localStorage.setItem("selectedPackage", profile.package_id);
    }

    if (profile.package) {
      localStorage.setItem("selectedPackageName", profile.package);
    }

    if (profile.student_id) {
      localStorage.setItem("studentId", profile.student_id);
    }

    if (profile.first_name && profile.last_name) {
      const fullName = `${profile.first_name} ${profile.last_name}`;
      if (localStorage.getItem("username") !== fullName) {
        localStorage.setItem("username", fullName);
      }
    }
    /* ✅ STORE COUNSELLING MODE */
    if (profile.preferred_counselling_mode) {
      localStorage.setItem(
        "preferredCounsellingMode",
        profile.preferred_counselling_mode
      );
    }
  }, [profile]);

  /* ================= PROGRAM TYPE LOGIC ================= */

  // Read aptitude_test from localStorage
  const aptitudeTestFromStorage = localStorage.getItem("aptitude_test");

  // Show exam & report only if aptitude_test = true
  const showExamAndReport = aptitudeTestFromStorage === "true";

  const engineeringTestAnalysis =
    localStorage.getItem("engineering_test_analysis") === "true";

  /* ================= FETCH JOURNEY (ONLY FOR PAID USERS) ================= */
  useEffect(() => {
    if (!isFreeUser && profile?.student_id) {
      dispatch(fetchStudentJourney(profile.student_id));
    }
  }, [dispatch, profile?.student_id, isFreeUser]);


  /* ================= JOURNEY DATA ================= */
  const progressData = journey?.progress || {};

  let currentStep =
    progressData?.current_step !== undefined
      ? progressData.current_step - 1
      : 0;

  // Adjust step index if exam/report are not part of the journey
  // if (!showExamAndReport && currentStep > 2) {
  //   currentStep = currentStep - 2;
  // }

  if (!showExamAndReport && currentStep > 2) {
    currentStep = currentStep - 2;
  }

  if (!engineeringTestAnalysis && currentStep > 2) {
    currentStep = currentStep - 2;
  }

  useEffect(() => {
    if (progressData) {
      const paymentCompleted = progressData.payment === "fully_paid";

      // If exam is part of the journey
      let examCompleted;
      if (showExamAndReport) {
        examCompleted = progressData.exam === "completed";
      } else {
        // Journey does not include exam
        examCompleted = "not_applicable"; // mark as not applicable
      }

      localStorage.setItem("paymentCompleted", paymentCompleted);
      localStorage.setItem("examCompleted", examCompleted);
    }
  }, [progressData, showExamAndReport]);


  /* ================= BUTTON LOGIC ================= */

  const getJourneyAction = () => {
    if (isFreeUser) {
      return {
        label: "Browse Programs & Services →",
        path: "/student/program",
      };
    }

    // ✅ Step-wise based on real data (BEST PRACTICE)

    if (!progressData.registration) {
      return {
        label: "Complete Registration →",
        path: "/register",
      };
    }

    if (!progressData.counselling_service) {
      return {
        label: "Select Program →",
        path: "/student/program",
      };
    }

    if (progressData.payment !== "fully_paid") {
      return {
        label: "Pay Now →",
        path: "/student/payments",
      };
    }

    // ✅ AFTER PAYMENT
    if (showExamAndReport && progressData.exam !== "completed") {
      return {
        label: "Start Exam →",
        path: "/student/exam-management",
      };
    }

    // ================= EXAM FLOW =================
    if (showExamAndReport && progressData.exam !== "completed") {
      return {
        label: "Start Exam →",
        path: "/student/exam-management",
      };
    }

    // SLOT BOOKING AFTER EXAM
    if (
      showExamAndReport &&
      (!progressData.counselling_slot_booking ||
        progressData.counselling_slot_booking === "not_booked")
    ) {
      return {
        label: "Book Counselling Session →",
        path: "/student/slot-booking",
      };
    }

    // REVIEW AFTER SLOT BOOKING
    if (
      showExamAndReport &&
      (!progressData.review ||
        progressData.review === "not_submitted")
    ) {
      return {
        label: "Write Review →",
        path: "/student/write-review",
      };
    }

    // REPORT LAST
    if (
      showExamAndReport &&
      progressData.report !== "received_unlocked"
    ) {
      return {
        label: "View Report →",
        path: "/student/report-management",
      };
    }

    // ================= ENGINEERING FLOW =================
    if (
      engineeringTestAnalysis &&
      progressData.analysis !== "completed"
    ) {
      return {
        label: "Start Questionnaire →",
        path: "/student/engineering-questionnaires",
      };
    }

    if (
      engineeringTestAnalysis &&
      (!progressData.counselling_slot_booking ||
        progressData.counselling_slot_booking === "not_booked")
    ) {
      return {
        label: "Book Counselling Session →",
        path: "/student/slot-booking",
      };
    }

    if (
      engineeringTestAnalysis &&
      (!progressData.review ||
        progressData.review === "not_submitted")
    ) {
      return {
        label: "Write Review →",
        path: "/student/write-review",
      };
    }

    if (
      engineeringTestAnalysis &&
      progressData.report !== "received_unlocked"
    ) {
      return {
        label: "View Analysis Report →",
        path: "/student/analysis-report",
      };
    }

    return {
      label: "Go to Dashboard →",
      path: "/student/dashboard",
    };
  };
  // const getJourneyAction = () => {
  //   if (isFreeUser) {
  //     return {
  //       label: "Browse Programs & Services →",
  //       path: "/student/program",
  //     };
  //   }

  //   switch (currentStep) {
  //     case 0:
  //     case 1:
  //       return {
  //         label: "View Programs & Services →",
  //         path: "/student/program",
  //       };

  //     case 2:
  //       return {
  //         label: "Pay Now →",
  //         path: "/student/payments",
  //       };

  //     case 3:
  //       if (showExamAndReport) {
  //         return {
  //           label: "Start Exam →",
  //           path: "/student/exam-management",
  //         };
  //       }
  //       break;

  //     case 4:
  //       if (showExamAndReport) {
  //         return {
  //           label: "View Report →",
  //           path: "/student/report-management",
  //         };
  //       }
  //       break;

  //     case 5:
  //       return {
  //         label: "Book Counselling Session →",
  //         path: "/student/slot-booking",
  //       };

  //     case 6:
  //       return {
  //         label: "Submit Review →",
  //         path: "/student/report-management",
  //       };

  //     default:
  //       return {
  //         label: "Go to Dashboard →",
  //         path: "/student/dashboard",
  //       };
  //   }
  // };

  const journeyAction = getJourneyAction();

  return (
    <div
      style={{
        padding: screens.xs ? "12px 12px 24px" : "30px 20px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* ===================== PROGRESS STEPS ===================== */}
      <div style={{ overflowX: "auto", paddingBottom: 10 }}>
        {isFreeUser ? (
          <JourneySteps isFreeUser={true} />
        ) : journeyLoading ? (
          <Spin />
        ) : (
          <JourneySteps
            currentStep={currentStep}
            showExamAndReport={showExamAndReport}
            engineeringTestAnalysis={engineeringTestAnalysis}
            progressData={progressData}
            journeyLoading={journeyLoading}
          />
        )}
      </div>

      {/* ===================== CTA CARD ===================== */}
      <Card
        style={{
          margin: "32px 0",
          borderRadius: token.borderRadiusLG,
          background: `linear-gradient(90deg, ${token.colorPrimary}, ${token.colorInfo})`,
        }}
      >
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Title level={4} style={{ color: "#fff" }}>
              {isFreeUser
                ? "Start Your Career Journey"
                : "Continue Your Journey"}
            </Title>
            <Text style={{ color: "#f0f0f0", fontSize: 15 }}>
              {isFreeUser
                ? "Select a program and service package to unlock full access"
                : "Complete your next step to unlock more features"}
            </Text>
          </Col>

          <Col
            xs={24}
            md={8}
            style={{
              display: "flex",
              justifyContent: screens.xs ? "center" : "flex-end",
            }}
          >
            <Button
              size="large"
              type="primary"
              onClick={() => navigate(journeyAction.path)}
              style={{
                width: screens.xs ? "100%" : "auto",   // full width on mobile
                whiteSpace: screens.xs ? "normal" : "nowrap", // allow wrapping on mobile
                height: screens.xs ? "auto" : undefined, // auto height for 2 lines
                padding: screens.xs ? "10px 16px" : undefined,
                textAlign: "center",
              }}
            >
              {journeyAction.label}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* ===================== DASHBOARD CARDS ===================== */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            onClick={() => navigate("/student/content-library")}
            style={{ borderRadius: token.borderRadiusLG }}
          >
            <BookOutlined
              style={{ fontSize: 26, color: token.colorSuccess }}
            />
            <Title level={5} style={{ marginTop: 16 }}>
              Explore Content Library
            </Title>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            onClick={() => navigate("/student/program")}
            style={{ borderRadius: token.borderRadiusLG }}
          >
            <ContainerOutlined
              style={{ fontSize: 26, color: token.colorPrimary }}
            />
            <Title level={5} style={{ marginTop: 16 }}>
              My Program
            </Title>
          </Card>
        </Col>

        {!isFreeUser && showExamAndReport && (
          <Col xs={24} sm={12} md={8}>
            <Card
              hoverable
              onClick={() => navigate("/student/report-management")}
              style={{ borderRadius: token.borderRadiusLG }}
            >
              <FileTextOutlined
                style={{ fontSize: 26, color: token.colorInfo }}
              />
              <Title level={5} style={{ marginTop: 16 }}>
                My Assessment Report
              </Title>
            </Card>
          </Col>
        )}

        {/* <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  onClick={() => navigate("/student/content-library")}
                  style={{ borderRadius: token.borderRadiusLG }}
                >
                  <LockOutlined
                    style={{ fontSize: 26, color: token.colorError }}
                  />
                  <Title level={5} style={{ marginTop: 16 }}>
                    Locked Content
                  </Title>
                </Card>
              </Col> */}
      </Row>
    </div>
  );
};

export default StudentDashboard;