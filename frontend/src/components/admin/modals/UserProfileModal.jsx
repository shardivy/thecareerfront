import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  Tooltip,
  Spin,
} from "antd";
import { CheckOutlined } from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";
import { fetchStudentJourney } from "../../../adminSlices/userSlice";

const { Title, Text } = Typography;

/* ---------------- JOURNEY STEPS ---------------- */
const journeySteps = [
  "Registration",
  "Counselling Service Selection",
  "Payment",
  "Exam",
  "Report",
  "Counselling Slot Booking",
  "Review",
  "Full Access",
];

const UserProfileModal = ({ open, onClose, user }) => {
  const { token } = theme.useToken();
  const dispatch = useDispatch();
  const { journey, journeyLoading } = useSelector((state) => state.users);

  useEffect(() => {
    if (open && user?.id) {
      dispatch(fetchStudentJourney(user.id));
    }
  }, [open, user, dispatch]);

  if (!user) return null;

  /* ================= API DATA ================= */
  const progressData = journey?.progress || {};
  const historyData = journey?.history || [];
  const paymentSummary = journey?.payment_summary || {};
const payments = paymentSummary.payments || [];


  const currentStep = progressData.current_step || 1;
  const isPartialPayment = progressData.payment === "partial";
  const isFullyPaid = progressData.payment === "fully_paid";


  const displayName =
    (user.name && user.name.toString().trim()) ||
    `${(user.first_name || "").toString().trim()} ${(user.last_name || "")
      .toString()
      .trim()}`.trim();

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
        {/* ================= DETAILS ================= */}
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
                {user.review || " - "}
              </Descriptions.Item>
              <Descriptions.Item label="Report Status">
                <Tag
                  color={
                    progressData.report === "locked"
                      ? "default"
                      : "success"
                  }
                >
                  {progressData.report || "N/A"}
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
                    progressData.payment === "fully_paid"
                      ? "success"
                      : progressData.payment === "partial"
                      ? "warning"
                      : "processing"
                  }
                >
                  {progressData.payment || "N/A"}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Amount Paid">
                ₹ {user.total_paid_amount || 0} / ₹ {user.price || 0}
                {user.price > 0 && (
                  <>
                    <br />
                    <Text type="colorTextSecondary">
                      (Remaining: ₹{" "}
                      {(user.price || 0) - (user.total_paid_amount || 0)})
                    </Text>
                  </>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Exam Status">
                <Tag
                  color={
                    progressData.exam ? "success" : "warning"
                  }
                >
                  {progressData.exam ? "Completed" : "Pending"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        <Divider />

        {/* ================= JOURNEY PROGRESS ================= */}
        <Title level={5}>Journey Progress</Title>

        <div
          className="progress-scroll"
                style={{
            marginTop: 16,
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
              minWidth: journeySteps.length * 140,
            }}
          >
            {journeySteps.map((label, index) => {
              const stepNo = index + 1;
              const isCompleted = stepNo < currentStep;
              const isActive = stepNo === currentStep;

              let progressWidth = "0%";

              if (isCompleted) {
                progressWidth = "100%";
              } else if (isActive) {
                if (stepNo === 3 && isPartialPayment) {
                  progressWidth = "50%";
                } else {
                  progressWidth = "100%";
                }
              }

              return (
                <div
                  key={label}
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
                      <Tooltip
                        title={
                          stepNo === 3 && isPartialPayment
                            ? "Partially Paid"
                            : ""
                        }
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

                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isCompleted
                        ? token.colorSuccess
                        : isActive
                        ? token.colorPrimary
                        : token.colorBorder,
                      color: isCompleted || isActive ? "#fff" : token.colorTextSecondary,
                      zIndex: 1,
                    }}
                  >
                    {isCompleted ? <CheckOutlined /> : stepNo}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      textAlign: "center",
                      maxWidth: 120,
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

     {/* ================= JOURNEY HISTORY ================= */}
<Title level={5}>Journey History</Title>

{journeyLoading ? (
  <Spin />
) : (
  <div
    style={{
      marginTop: 20,
      position: "relative",
      paddingLeft: 30,
      maxHeight: 360,
      overflowY: "auto",
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

    {/* 🔥 GROUP HISTORY BY STEP */}
{/* 🔥 GROUP HISTORY BY STEP */}
{Object.values(
  historyData
    // ✅ REMOVE PENDING STEPS FIRST
    .filter((item) => {
      const status = item.status?.toLowerCase();
      return status && status !== "pending";
    })
    // ✅ THEN GROUP
    .reduce((acc, item) => {
      if (!acc[item.step]) {
        acc[item.step] = {
          ...item,
          payments: [],
        };
      }

      if (item.step === "Payment") {
        acc[item.step].payments.push(item);
      }

      return acc;
    }, {})
).map((item, index) => {

const status = item.status?.toLowerCase();

  const isCompleted =
    status === "completed" || status === "fully_paid";

  const isPartial =
    status === "partially_paid" ||
    status === "partial_paid" ||
    status === "partial";


      return (
        <div
          key={index}
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
              fontWeight: 600,
              zIndex: 1,
            }}
          >
            {isCompleted ? <CheckOutlined /> : index + 1}
          </div>

          {/* Card */}
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
                <Text strong>{item.step}</Text>
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
  {item.status?.replace("_", " ").toUpperCase()}
</Tag>

              </Col>
            </Row>

            {/* 🔥 If Payment → Show All Payments */}
            {item.step === "Payment" ? (
              <div style={{ marginTop: 10 }}>
                {item.payments.map((pay, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px 12px",
                      marginTop: 6,
                      borderRadius: 8,
                      background: "#fafafa",
                      border: `1px solid ${token.colorBorder}`,
                      fontSize: 14,
                    }}
                  >
                    {pay.details}
                    <div
                      style={{
                        fontSize: 12,
                        color: token.colorTextSecondary,
                        marginTop: 4,
                      }}
                    >
                      {pay.date || "—"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    color: token.colorTextSecondary,
                  }}
                >
                  {item.details}
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: token.colorTextSecondary,
                  }}
                >
                  {item.date || "—"}
                </div>
              </>
            )}
          </div>
        </div>
      );
    })}
  </div>
)}

      </Modal>
    </ConfigProvider>
  );
};

export default UserProfileModal;
