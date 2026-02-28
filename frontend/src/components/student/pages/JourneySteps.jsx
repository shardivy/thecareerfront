import React from "react";
import { Card, Steps, Typography, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const JourneySteps = ({
  currentStep = 0,
  showExamAndReport = true,
}) => {
  const navigate = useNavigate();

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

  const stepsConfig = [
    ...baseSteps,
    ...examSteps,
    ...remainingSteps,
  ];

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
                  cursor:
                    index <= currentStep
                      ? "pointer"
                      : "not-allowed",
                  opacity:
                    index <= currentStep ? 1 : 0.5,
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