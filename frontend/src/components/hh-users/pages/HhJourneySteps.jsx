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
}) => {
  const navigate = useNavigate();
  const { token } = useToken();

  const sessions = Array.from({ length: totalSessions }, (_, i) => ({
    label: `Session ${i + 1}`,
    index: i,
  }));

  const getStepStatus = (index) => {
    if (index < completedSessions) return "completed";
    if (index === completedSessions) return "active";
    return "pending";
  };

  const getStepColor = (status) => {
    switch (status) {
      case "completed":
        return token.colorSuccess;
      case "active":
        return token.colorPrimary;
      default:
        return token.colorBorder;
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
        Your Session Journey
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
            minWidth: totalSessions * 120,
          }}
        >
          {sessions.map((step, index) => {
            const status = getStepStatus(index);
            const color = getStepColor(status);
            const isClickable = index <= completedSessions;

            return (
              <div
                key={index}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 120,
                  flexShrink: 0,
                    paddingTop: 8,
                  }}
                >
                  {/* Connector */}
                  {index !== 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "42%",
                        left: "-60px",
                        width: "120px",
                        height: 4,
                        transform: "translateY(-50%)",
                        background: "#e5e7eb",
                        borderRadius: 2,
                        zIndex: 0,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: index <= completedSessions ? "100%" : "0%",
                          background: token.colorPrimary,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  )}

                  {/* Circle */}
                  <Tooltip title={step.label}>
                    <div
                      onClick={() =>
                        isClickable &&
                        navigate(`/session/${index + 1}`)
                      }
                      style={{
                        position: "relative",
                        zIndex: 1,
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: color,
                        color:
                          status === "pending"
                            ? token.colorTextSecondary
                            : "#fff",
                        cursor: isClickable ? "pointer" : "not-allowed",
                        fontWeight: 600,
                      }}
                    >
                      {status === "completed" ? (
                        <CheckOutlined />
                      ) : (
                        index + 1
                      )}
                    </div>
                  </Tooltip>

                  {/* Label */}
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      textAlign: "center",
                      maxWidth: 100,
                      fontWeight: status === "active" ? 600 : 400,
                      color:
                        status === "active"
                          ? token.colorPrimary
                          : "inherit",
                    }}
                  >
                    {step.label}
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