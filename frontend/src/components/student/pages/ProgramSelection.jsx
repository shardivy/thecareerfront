import React from "react";
import { Row, Col, Card, Typography } from "antd";
import {
  RocketOutlined,
  BankOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import adminTheme from "../../../theme/adminTheme";

const { Title, Text } = Typography;

const programs = [
  {
    id: 1,
    program: "Engineering",
    service: "Career Counselling",
    icon: <RocketOutlined />,
    iconBg: "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
    iconColor: "#4F46E5",
    route: "/student/student-profile",
  },
  {
    id: 2,
    program: "Law",
    service: "Admission Guidance",
    icon: <BankOutlined />,
    iconBg: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
    iconColor: "#D97706",
    route: "/student/student-profile",
  },
];

const ProgramSelection = () => {
  const navigate = useNavigate();

  const handleSelectProgram = (item) => {
    localStorage.setItem("selectedProgram", item.program);
    navigate(item.route);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at top right, rgba(99,102,241,0.12), transparent 28%),
          radial-gradient(circle at bottom left, rgba(59,130,246,0.10), transparent 25%),
          ${adminTheme.token.colorBgLayout}
        `,
        padding: "40px 18px",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 40,
          maxWidth: 700,
          marginInline: "auto",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "8px 18px",
            borderRadius: 999,
            background: "rgba(30,64,175,0.08)",
            color: adminTheme.token.colorPrimary,
            fontWeight: 600,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          Student Portal
        </div>

        <Title
          level={1}
          style={{
            margin: 0,
            fontWeight: 800,
            color: adminTheme.token.colorTextBase,
            fontSize: "clamp(32px, 5vw, 52px)",
            lineHeight: 1.1,
          }}
        >
          Choose Your Program
        </Title>

        <Text
          style={{
            display: "block",
            marginTop: 16,
            fontSize: 17,
            color: adminTheme.token.colorTextSecondary,
            lineHeight: 1.7,
          }}
        >
          Select your preferred program and counselling service to continue
  your personalized academic and career journey.
        </Text>
      </div>

      {/* PROGRAM CARDS */}
      <Row
        gutter={[24, 24]}
        justify="center"
        style={{
          maxWidth: 1050,
          margin: "0 auto",
        }}
      >
        {programs.map((item) => (
          <Col xs={24} sm={12} md={8} key={item.id}>
            <Card
              hoverable
              onClick={() => handleSelectProgram(item)}
              style={{
                borderRadius: 28,
                overflow: "hidden",
                cursor: "pointer",
                border: `1px solid ${adminTheme.token.colorBorder}`,
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(14px)",
                boxShadow: "0 12px 35px rgba(15,23,42,0.08)",
                transition: "all 0.35s ease",
                height: 280,
                position: "relative",
              }}
              bodyStyle={{
                padding: "30px 26px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* TOP GLOW */}
              <div
                style={{
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: "rgba(99,102,241,0.08)",
                }}
              />

              {/* ICON */}
              <div
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: 26,
                  background: item.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  color: item.iconColor,
                  marginBottom: 26,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                }}
              >
                {item.icon}
              </div>

              {/* PROGRAM */}
              <Title
                level={3}
                style={{
                  margin: 0,
                  fontWeight: 750,
                  color: adminTheme.token.colorTextBase,
                  fontSize: 28,
                }}
              >
                {item.program}
              </Title>

              {/* SERVICE */}
              <Text
                style={{
                  marginTop: 10,
                  color: adminTheme.token.colorTextSecondary,
                  fontSize: 16,
                  lineHeight: 1.7,
                  display: "block",
                }}
              >
                {item.service}
              </Text>

              {/* BOTTOM BUTTON */}
              <div
                style={{
                  marginTop: "auto",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 24,
                }}
              >
                <Text
                  style={{
                    fontWeight: 600,
                    color: adminTheme.token.colorPrimary,
                    fontSize: 15,
                  }}
                >
                  Continue
                </Text>

                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: adminTheme.token.colorPrimary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 16,
                    boxShadow: "0 8px 18px rgba(30,64,175,0.35)",
                  }}
                >
                  <ArrowRightOutlined />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ProgramSelection;