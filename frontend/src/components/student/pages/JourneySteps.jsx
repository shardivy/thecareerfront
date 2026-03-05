import React from "react";
import { Card, Steps, Typography, Tooltip, Result, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { RocketOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const JourneySteps = ({
  currentStep = 0,
  showExamAndReport = true,
  isFreeUser = false,
}) => {
  const navigate = useNavigate();

  // If free user, show a different message instead of steps
  if (isFreeUser) {
    const staticSteps = [
      { title: "Registration" },
      { title: "Counselling Service Selection" },
      { title: "Payment" },
      { title: "Exam" },
      // { title: "Report" },
      { title: "Counselling Slot Booking" },
      { title: "Review" },
      { title: "Full Access" },
    ];

    return (
      <Card
        style={{
          borderRadius: 20,
          padding: "24px 32px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
        }}
      >
        <Title level={4} style={{ marginBottom: 10 }}>
          Your Career Journey
        </Title>

        <Text type="colorTextSecondary">
          This is a preview of your complete counselling journey.
          Upgrade to unlock and track your progress.
        </Text>

        <div style={{ marginTop: 32 }}>
          <Steps
            current={0} // Always start from first step (static)
            labelPlacement="vertical"
            items={staticSteps.map((step) => ({
              title: (
                <span style={{ color: "#595959", fontWeight: 500 }}>
                  {step.title}
                </span>
              ),
            }))}
          />
        </div>

        {/* <div style={{ textAlign: "center", marginTop: 32 }}>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/student/program")}
          >
            Upgrade & Start Journey
          </Button>
        </div> */}
      </Card>
    );
  }
  const baseSteps = [
    {
      title: "Registration",
      path: "/register",
    },
    {
      title: "Counselling Service Selection",
      path: "/student/program",
    },
    {
      title: "Payment",
      path: "/student/payments",
    },
  ];

  const examSteps = showExamAndReport
    ? [
      {
        title: "Exam",
        path: "/student/exam-management",
      },
      {
        title: "Report",
        path: "/student/report-management",
      },
    ]
    : [];

  const remainingSteps = [
    {
      title: "Counselling Slot Booking",
      path: "/student/slot-booking",
    },
    {
      title: "Review",
      path: "/student/report-management",
    },
    {
      title: "Full Access",
      path: "/student/dashboard",
    },
  ];

  const stepsConfig = [...baseSteps, ...examSteps, ...remainingSteps];

  return (
    <Card
      style={{
        borderRadius: 20,
        padding: "24px 32px",
        boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
      }}
    >
      <Title level={4} style={{ marginBottom: 32 }}>
        Your Journey Progress
      </Title>

      <Steps
        current={currentStep}
        labelPlacement="vertical"
        items={stepsConfig.map((step, index) => ({
          title: (
            <Tooltip title={step.title}>
              <span
                style={{
                  cursor: index <= currentStep ? "pointer" : "not-allowed",
                  opacity: index <= currentStep ? 1 : 0.5,
                  fontWeight: 500,
                }}
                onClick={() => {
                  if (index <= currentStep) {
                    navigate(step.path);
                  }
                }}
              >
                {step.title}
              </span>
            </Tooltip>
          ),
        }))}
      />
    </Card>
  );
};

export default JourneySteps;