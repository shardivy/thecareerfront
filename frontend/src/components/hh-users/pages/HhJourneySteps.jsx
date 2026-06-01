import React from "react";
import { Card, Typography, Tooltip } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { theme } from "antd";

const { Title } = Typography;
const { useToken } = theme;

const HhJourneySteps = ({
  totalSessions = 10,
  completedSessions = 0,
  journeyData = [],
}) => {
  const navigate = useNavigate();
  const { token } = useToken();

  const fallbackSteps = [
    { step: "Registration", status: "completed" },
    { step: "Counselling Service", status: "completed" },
    { step: "Payment", status: "completed" },
    ...Array.from({ length: totalSessions }, (_, i) => ({
      step: `Session ${i + 1}`,
      status:
        i < completedSessions
          ? "completed"
          : i === completedSessions
            ? "in_progress"
            : "not_booked",
    })),
  ];

  const steps = journeyData.length > 0 ? journeyData : fallbackSteps;

  const getRoute = (label) => {
    switch (label) {
      case "Registration":
        return "/register";
      case "Counselling Service":
        return "/student/program";
      case "Payment":
        return "/handholding/payments";
      default:
        if (label.startsWith("Session")) {
          return "/handholding/sessions";
        }
        return null;
    }
  };

  const isStepCompleted = (status) => status === "completed";

  const isStepInProgress = (status) =>
    ["booked", "in_progress", "rescheduled"].includes(status);

  const getStepColor = (status) => {
    if (status === "completed") return token.colorSuccess;
    if (status === "partial_paid") return token.colorWarning;
    if (status === "not_paid") return token.colorPrimary;
    if (status === "rescheduled") return token.colorWarning;
    if (["booked", "in_progress"].includes(status)) return token.colorPrimary;
    return token.colorBorder;
  };

  const getConnectorProgress = (status) => {
    if (
      status === "completed" ||
      status === "not_paid" ||      // ✅ ADD THIS
      status === "partial_paid" ||  // ✅ (optional but recommended)
      isStepInProgress(status)
    ) {
      return "100%";
    }
    return "0%";
  };

  const getTooltipText = (step) => {
    const status = step.status?.toLowerCase();

    switch (status) {
      case "completed":
        return `${step.step} - Completed`;
      case "booked":
        return `${step.step} - Booked`;
      case "in_progress":
        return `${step.step} - In Progress`;
      case "rescheduled":
        return `${step.step} - Rescheduled`;
      case "partial_paid":
        return `${step.step} - Partially Paid`;
      case "not_paid":
        return `${step.step} - Not Paid`;
      case "not_booked":
        return `${step.step} - Not Booked`;
      default:
        return step.details || `${step.step} - Pending`;
    }
  };

  const handleStepClick = (label, status) => {
    const route = getRoute(label);
    const isClickable =
      route &&
      (isStepCompleted(status) ||
        isStepInProgress(status) ||
        status === "not_paid");

    if (isClickable) {
      navigate(route);
    }
  };

  return (
    <Card
      style={{
        borderRadius: 16,
        padding: "24px",
        boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
      }}
    >
      <Title level={4} style={{ marginBottom: 24 }}>
        Your Learning Journey
      </Title>

      <div
        style={{
          background: token.colorBgContainer,
          padding: 24,
          borderRadius: 16,
          border: `1px solid ${token.colorBorder}`,
          overflowX: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            minWidth: steps.length * 140,
          }}
        >
          {steps.map((step, index) => {
            const status = step.status?.toLowerCase() || "pending";
            const stepColor = getStepColor(status);
            const isCompleted = isStepCompleted(status);
            const isClickable =
              Boolean(getRoute(step.step)) &&
              (isCompleted || isStepInProgress(status) || status === "not_paid");

            return (
              <div
                key={`${step.step}-${index}`}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 140,
                  flexShrink: 0,
                  minHeight: 100,
                }}
              >
                {index !== 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 20,
                      left: "-70px",
                      width: "140px",
                      height: 4,
                      background: token.colorBorder,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background:
                          status === "rescheduled"
                            ? token.colorWarning
                            : token.colorPrimary,
                        width: getConnectorProgress(status),
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                )}

                <Tooltip title={getTooltipText(step)}>
                  <div
                    onClick={() => handleStepClick(step.step, status)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: stepColor,
                      color:
                        stepColor === token.colorBorder
                          ? token.colorTextSecondary
                          : "#fff",
                      zIndex: 1,
                      cursor: isClickable ? "pointer" : "not-allowed",
                      transition: "all 0.3s ease",
                      ...(isClickable && {
                        boxShadow: `0 2px 8px ${stepColor}40`,
                      }),
                    }}
                  >
                    {isCompleted ? <CheckOutlined /> : index + 1}
                  </div>
                </Tooltip>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    textAlign: "center",
                    maxWidth: 120,
                    fontWeight: isStepInProgress(status) ? 600 : 400,
                    color:
                      isCompleted || isStepInProgress(status) || status === "not_paid"
                        ? stepColor
                        : "inherit",
                    cursor: isClickable ? "pointer" : "default",
                  }}
                  onClick={() => handleStepClick(step.step, status)}
                >
                  {step.step}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default HhJourneySteps;
