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
    Tooltip, // ✅ ADDED
  } from "antd";
  import { CheckOutlined } from "@ant-design/icons";
  import adminTheme from "../../../theme/adminTheme";

  const { Title, Text } = Typography;

  /* ---------------- JOURNEY CONFIG ---------------- */
  const journeySteps = [
    "Registration",
    "Counselling Service Selection",
    "Payment",
    "Exam",
    "Report",
    "Counselling Slot Booking",
    "Review",
    "Report",
    "Full Access",
  ];

  // const sessionHistory = [
  //   {
  //     id: 1,
  //     title: "Initial Career Counselling",
  //     date: "2026-01-05",
  //     duration: "60 mins",
  //     counselor: "Dr. Ramesh Gupta",
  //     status: "Completed",
  //   },
  //   {
  //     id: 2,
  //     title: "Career Path Discussion",
  //     date: "2026-01-08",
  //     duration: "45 mins",
  //     counselor: "Ms. Priya Menon",
  //     status: "Completed",
  //   },
  //   {
  //     id: 3,
  //     title: "Report Review Session",
  //     date: "2026-01-10",
  //     duration: "60 mins",
  //     counselor: "Dr. Ramesh Gupta",
  //     status: "Completed",
  //   },
  // ];
/* ---------------- JOURNEY HISTORY ---------------- */
const journeyHistory = [
  {
    id: 1,
    step: "Registration",
    description: "Student account created successfully",
    date: "2026-01-01",
    status: "Completed",
  },
  {
    id: 2,
    step: "Counselling Service Selection",
    description: "Premium Career Package selected",
    date: "2026-01-02",
    status: "Completed",
  },
  {
    id: 3,
    step: "Payment",
    description: "₹ 4000 paid (Partial Payment)",
    date: "2026-01-03",
    status: "Partial",
  },
  {
    id: 4,
    step: "Exam",
    description: "Psychometric Test Completed",
    date: "2026-01-05",
    status: "pending",
  },
  {
    id: 5,
    step: "Report",
    description: "Career Report Generated",
    date: "2026-01-07",
    status: "pending",
  },
];

  const UserProfileModal = ({ open, onClose, user }) => {
    const { token } = theme.useToken();
    if (!user) return null;

    const displayName =
      (user.name && user.name.toString().trim()) ||
      `${(user.first_name || "").toString().trim()} ${(user.last_name || "")
        .toString()
        .trim()}`.trim();

    /* -------- JOURNEY LOGIC -------- */
    let currentStep = 1;

    if (user.reportStatus === "Unlocked") {
      currentStep = 6;
    } else if (user.examStatus === "Completed") {
      currentStep = 5;
    } else if (user.paymentStatus === "Fully Paid") {
      currentStep = 4;
    } else {
      currentStep = 3;
    }

    const isPartial = user.paymentStatus === "Partial Paid";

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
                <Descriptions.Item label="Name">
                  {displayName}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {user.email}
                </Descriptions.Item>
                <Descriptions.Item label="Review">
                  {user.review ? user.review : " - "}
                </Descriptions.Item>
                <Descriptions.Item label="Report Status">
                  <Tag
                    color={
                      user.reportStatus === "Unlocked"
                        ? "success"
                        : "default"
                    }
                  >
                    {user.reportStatus}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Col>

            <Col xs={24} md={12}>
              <Title level={5}>Program Details</Title>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Program">
                  {user.program}
                </Descriptions.Item>
                <Descriptions.Item label="Counselling Services">
                  {user.package}
                </Descriptions.Item>
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

                </Descriptions.Item>

                <Descriptions.Item label="Amount Paid">
                  <Text>
                    ₹ {user.amount || 0} / ₹ {user.price || 0}
                  </Text><br></br>

                  {user.price > 0 && (
                    <Text type="colorTextSecondary" style={{ marginLeft: 8 }}>
                      (Remaining: ₹ {(user.price || 0) - (user.amount || 0)})
                    </Text>
                  )}
                </Descriptions.Item>


                <Descriptions.Item label="Exam Status">
                  <Tag
                    color={
                      user.examStatus === "Completed"
                        ? "success"
                        : "warning"
                    }
                  >
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
    marginTop: 16,
    background: token.colorBgContainer,
    padding: 24,
    borderRadius: 16,
    border: `1px solid ${token.colorBorder}`,
    overflowX: "auto",
    scrollbarWidth: "thin",
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "flex-start", // ✅ keeps everything aligned
      minWidth: journeySteps.length * 140,
    }}
  >
    {journeySteps.map((label, index) => {
      const stepNo = index + 1;
      const isCompleted = stepNo < currentStep;
      const isActive = stepNo === currentStep;

      const progressWidth =
        isCompleted
          ? "100%"
          : isActive && isPartial && stepNo === 3
          ? "50%"
          : isActive
          ? "100%"
          : "0%";

      const showPartialTooltip =
        isPartial && isActive && stepNo === 3;

      return (
        <div
          key={label}
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            width: 140,
            flexShrink: 0,
            minHeight: 100, // ✅ prevents shifting
          }}
        >
          {/* CONNECTOR WITH TOOLTIP */}
          {index !== 0 && (
            <div
              style={{
                position: "absolute",
                top: 20,
                left: "-70px",
                width: "140px",
                height: 4,
                background: token.colorBorder,
                zIndex: 0,
              }}
            >
              <Tooltip
                title={showPartialTooltip ? "Partially Paid" : ""}
              >
                <div
                  style={{
                    height: "100%",
                    background: token.colorPrimary,
                    width: progressWidth,
                    transition: "width 0.3s ease",
                  }}
                />
              </Tooltip>
            </div>
          )}

          {/* STEP CIRCLE */}
          <div
            style={{
              width: 40,
              height: 40,
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
                  ? "#fff"
                  : token.colorTextSecondary,
            }}
          >
            {isCompleted ? <CheckOutlined /> : stepNo}
          </div>

          {/* STEP LABEL */}
          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              textAlign: "center",
              color: token.colorTextSecondary,
              maxWidth: 120,
              lineHeight: "18px",
              height: 36, // ✅ fixed height for 2 lines
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {label}
          </div>
        </div>
      );
    })}
  </div>
</div>

          <Divider />

{/* ================== JOURNEY HISTORY ================== */}
<Title level={5}>Journey History</Title>

<div
  style={{
    marginTop: 20,
    position: "relative",
    paddingLeft: 30,
    maxHeight: 360, // 👈 Shows approx 3 items
    overflowY: "auto",
    paddingRight: 10,
  }}
>
  {/* Vertical Line */}
  <div
    style={{
      position: "absolute",
      left: 15,
      top: 0,
      bottom: 0,
      width: 3,
      background: token.colorBorder,
    }}
  />

  {journeyHistory.map((item, index) => {
    const isCompleted = item.status === "Completed";
    const isPartial = item.status === "Partial";

    return (
      <div
        key={item.id}
        style={{
          position: "relative",
          marginBottom: 28,
        }}
      >
        {/* Timeline Dot */}
        <div
          style={{
            position: "absolute",
            left: -2,
            top: 5,
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: isCompleted
              ? token.colorSuccess
              : isPartial
              ? token.colorWarning
              : token.colorBorder,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            zIndex: 1,
          }}
        >
          {isCompleted ? <CheckOutlined /> : index + 1}
        </div>

        {/* Content Card */}
        <div
          style={{
            marginLeft: 40,
            padding: 18,
            borderRadius: 14,
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
          }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Text style={{ fontSize: 15, fontWeight: 600 }}>
                {item.step}
              </Text>
            </Col>

            <Col>
              <Tag
                color={
                  isCompleted
                    ? "success"
                    : isPartial
                    ? "warning"
                    : "default"
                }
              >
                {item.status}
              </Tag>
            </Col>
          </Row>

          <div
            style={{
              marginTop: 6,
              color: token.colorTextSecondary,
              fontSize: 14,
            }}
          >
            {item.description}
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: token.colorTextSecondary,
            }}
          >
            {item.date}
          </div>
        </div>
      </div>
    );
  })}
</div>



          {/* ================== SESSION HISTORY ================== */}
          {/* <Title level={5}>Session History</Title>

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
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: token.colorPrimary,
                    color: "#fff",
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
          </div> */}
        </Modal>
      </ConfigProvider>
    );
  };

  export default UserProfileModal;
