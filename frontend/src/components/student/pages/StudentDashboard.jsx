import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Button,
  Row,
  Col,
  Typography,
  Badge,
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

  const studentId = localStorage.getItem("studentId");
  const selectedProgram = localStorage.getItem("selectedProgram");

  const normalizedProgram = selectedProgram?.trim().toLowerCase();

  const allowedPrograms = [
    "pg counselling",
    "8-12 aptitude test",
  ];

  const showExamAndReport =
    allowedPrograms.includes(normalizedProgram);

  /* ================= FETCH JOURNEY ================= */
  useEffect(() => {
    if (studentId) {
      dispatch(fetchStudentJourney(studentId));
    }
  }, [dispatch, studentId]);

  /* ================= JOURNEY DATA ================= */
  const progressData = journey?.progress || {};

  // Backend usually sends 1-based index → convert to 0-based
  const currentStep =
    progressData?.current_step !== undefined
      ? progressData.current_step - 1
      : 0;

  /* ================= BUTTON LOGIC ================= */
  const getJourneyAction = () => {
    switch (currentStep) {
      case 0:
      case 1:
        return {
          label: "View Programs & Services →",
          path: "/student/program",
        };

      case 2:
        return {
          label: "Pay Now →",
          path: "/student/payments",
        };

      case 3:
        if (showExamAndReport) {
          return {
            label: "Start Exam →",
            path: "/student/exam-management",
          };
        }
        break;

      case 4:
        if (showExamAndReport) {
          return {
            label: "View Report →",
            path: "/student/report-management",
          };
        }
        break;

      case 5:
        return {
          label: "Book Counselling Session →",
          path: "/student/slot-booking",
        };

      case 6:
        return {
          label: "Submit Review →",
          path: "/student/report-management",
        };

      default:
        return {
          label: "Go to Dashboard →",
          path: "/student/dashboard",
        };
    }
  };

  const journeyAction = getJourneyAction();

  return (
    <div
      style={{
        padding: screens.xs ? "8px" : "30px 20px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* ===================== PROGRESS STEPS ===================== */}
      <div style={{ overflowX: "auto", paddingBottom: 10 }}>
        {journeyLoading ? (
          <Spin />
        ) : (
          <JourneySteps
            currentStep={currentStep}
            showExamAndReport={showExamAndReport}
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
              Continue Your Journey
            </Title>
            <Text style={{ color: "#f0f0f0", fontSize: 15 }}>
              Complete your next step to unlock more features
            </Text>
          </Col>

          <Col
            xs={24}
            md={8}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <Button
              size="large"
              type="primary"
              onClick={() => navigate(journeyAction.path)}
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

        {showExamAndReport && (
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

        <Col xs={24} sm={12} md={8}>
          <Card 
          hoverable 
              onClick={() => navigate("/student/content-library")}
          style={{ borderRadius: token.borderRadiusLG }}>
            <LockOutlined
              style={{ fontSize: 26, color: token.colorError }}
            />
            <Title level={5} style={{ marginTop: 16 }}>
              Locked Content
            </Title>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentDashboard;