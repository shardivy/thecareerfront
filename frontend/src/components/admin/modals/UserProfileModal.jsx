import React from "react";
import {
  Modal,
  Typography,
  Row,
  Col,
  Descriptions,
  Tag,
  Divider,
  ConfigProvider,
  theme,
} from "antd";
import { CheckOutlined } from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";

const { Title, Text } = Typography;

/* ---------------- JOURNEY CONFIG ---------------- */
const journeySteps = [
  "Registration",
  "Package Selection",
  "Payment",
  "Exam",
  "Report",
  "Counselling",
  "Full Access",
];

const sessionHistory = [
  {
    id: 1,
    title: "Initial Career Counselling",
    date: "2026-01-05",
    duration: "60 mins",
    counselor: "Dr. Ramesh Gupta",
    status: "Completed",
  },
  {
    id: 2,
    title: "Career Path Discussion",
    date: "2026-01-08",
    duration: "45 mins",
    counselor: "Ms. Priya Menon",
    status: "Completed",
  },
  {
    id: 3,
    title: "Report Review Session",
    date: "2026-01-10",
    duration: "60 mins",
    counselor: "Dr. Ramesh Gupta",
    status: "Completed",
  },
];


const UserProfileModal = ({ open, onClose, user }) => {
  const { token } = theme.useToken();
  if (!user) return null;

  // Prefer explicit name; fall back to first_name + last_name
  const displayName =
    (user.name && user.name.toString().trim()) ||
    `${(user.first_name || "").toString().trim()} ${(user.last_name || "").toString().trim()}`.trim();

  /* -------- MAP USER STATUS → CURRENT STEP -------- */
  let currentStep = 1;
  if (user.paymentStatus === "Fully Paid") currentStep = 3;
  if (user.examStatus === "Completed") currentStep = 4;
  if (user.reportStatus === "Unlocked") currentStep = 5;

  return (
    <ConfigProvider theme={adminTheme}>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        width={1000}
        centered
        title={<Title level={4} style={{ margin: 0 }}>User Profile</Title>}
      >
        {/* ================== DETAILS ================== */}
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Title level={5}>Student Details</Title>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Name">{displayName}</Descriptions.Item>
              <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
              <Descriptions.Item label="Sessions">{user.sessions}</Descriptions.Item>
              <Descriptions.Item label="Report Status">
                <Tag color={user.reportStatus === "Unlocked" ? "success" : "default"}>
                  {user.reportStatus}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>

          <Col xs={24} md={12}>
            <Title level={5}>Program Details</Title>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Program">{user.program}</Descriptions.Item>
              <Descriptions.Item label="Package">{user.package}</Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                <Tag
                  color={
                    user.paymentStatus === "Fully Paid"
                      ? "success"
                      : user.paymentStatus === "Partial Paid"
                      ? "warning"
                      : "processing"
                  }
                >
                  {user.paymentStatus}
                </Tag>
                <Text style={{ marginLeft: 8 }}>{user.paymentAmount}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Exam Status">
                <Tag color={user.examStatus === "Completed" ? "success" : "warning"}>
                  {user.examStatus}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        <Divider />

        {/* ================== JOURNEY PROGRESS ================== */}
        <Title level={5}>Your Journey Progress</Title>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: token.colorBgContainer,
            padding: 24,
            borderRadius: 16,
            border: `1px solid ${token.colorBorder}`,
            marginTop: 16,
            overflowX: "auto",
          }}
        >
          {journeySteps.map((label, index) => {
            const stepNo = index + 1;
            const isCompleted = stepNo < currentStep;
            const isActive = stepNo === currentStep;

            return (
              <div
                key={label}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  minWidth: 120,
                }}
              >
                {/* LINE */}
                {index !== 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 18,
                      left: "-50%",
                      width: "100%",
                      height: 3,
                      background:
                        isCompleted || isActive
                          ? token.colorPrimary
                          : token.colorBorder,
                      zIndex: 0,
                    }}
                  />
                )}

                {/* CIRCLE */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1,
                    backgroundColor: isCompleted
                      ? token.colorSuccess
                      : isActive
                      ? token.colorPrimary
                      : token.colorBorder,
                    color:
                      isCompleted || isActive
                        ? token.colorTextPrimary
                        : token.colorTextSecondary,
                  }}
                >
                  {isCompleted ? <CheckOutlined /> : stepNo}
                </div>

                {/* LABEL */}
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    color: token.colorTextSecondary,
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>

<Divider />

{/* ================== SESSION HISTORY ================== */}
<Title level={5}>Session History</Title>

<div
  style={{
    marginTop: 16,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  }}
>
  {sessionHistory.map((session, index) => (
    <div
      key={session.id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: 20,
        borderRadius: 16,
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
      }}
    >
      {/* NUMBER CIRCLE */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: token.colorPrimary,
          color: token.colorTextPrimary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {index + 1}
      </div>

      {/* SESSION INFO */}
      <div style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: 600 }}>
          {session.title}
        </Text>

        <div
          style={{
            marginTop: 4,
            color: token.colorTextSecondary,
            fontSize: 14,
          }}
        >
          {session.date} • {session.duration} • {session.counselor}
        </div>

        <Tag
          style={{
            marginTop: 8,
            borderRadius: 20,
            padding: "4px 12px",
            background: "#ECFDF5",
            color: token.colorSuccess,
            border: `1px solid ${token.colorSuccess}`,
          }}
        >
          {session.status}
        </Tag>
      </div>
    </div>
  ))}
</div>


      </Modal>
    </ConfigProvider>
  );
};

export default UserProfileModal;
