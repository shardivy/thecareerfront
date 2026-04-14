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

const formatDisplayDate = (value) => {
  if (!value) return "—";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parsedDate);
};

/* ---------------- JOURNEY STEPS ---------------- */
const baseJourneySteps = [
  "Registration",
  "Counselling Service Selection",
  "Payment",
  "Exam",
  "Report",
  "Counselling Slot Booking",
  "Review",
  "Full Access",
];



const journeySteps =
  // user?.program?.toLowerCase() === "engineering"
  [
    "Registration",
    "Counselling Service Selection",
    "Payment",
    "Exam",
    "Report",
    "Questionnaire",
    "Analysis Report",
    "Counselling Slot Booking",

    "Review",
    "Full Access",
  ]
baseJourneySteps;



const UserProfileModal = ({ open, onClose, user }) => {
  const { token } = theme.useToken();
  const dispatch = useDispatch();
  const { journey, journeyLoading } = useSelector((state) => state.users);

const engineeringTestAnalysis = journey?.engineering_test_analysis;


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
  const payments = paymentSummary.all_payments || paymentSummary.payments || [];
  const lastPaymentStatus = paymentSummary?.last_payment?.status || null;

  const currentStep = progressData.current_step || 1;
  const isPartialPayment = progressData.payment === "partial_paid";
  const isJourneyCompleted = progressData.full_access === true;

  const displayName =
    (user.name && user.name.toString().trim()) ||
    `${(user.first_name || "").toString().trim()} ${(user.last_name || "")
      .toString()
      .trim()}`.trim();

  const showExamReport = user?.aptitude_test === true;

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
        <div style={{ maxHeight: "85vh", overflowY: "auto", paddingRight: 8 }}>
          {/* ================= DETAILS ================= */}
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Title level={5}>Student Details</Title>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Name">{displayName}</Descriptions.Item>
                <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                {/* <Descriptions.Item label="Review">{user.review || " - "}</Descriptions.Item> */}

              </Descriptions>
            </Col>

            <Col xs={24} md={12}>
              <Title level={5}>Program Details</Title>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Program">{user.program}</Descriptions.Item>
                <Descriptions.Item label="Counselling Services">{user.package}</Descriptions.Item>
                <Descriptions.Item label="Preferred Counselling Mode">
                  {user.preferred_counselling_mode &&
                    user.preferred_counselling_mode !== "Not Specified" ? (
                    <Tag
                      color={
                        user.preferred_counselling_mode.toLowerCase() === "online"
                          ? "blue"
                          : user.preferred_counselling_mode.toLowerCase() === "offline"
                            ? "green"
                            : "default"
                      }
                    >
                      {user.preferred_counselling_mode
                        .replace("_", " ")
                        .toUpperCase()}
                    </Tag>
                  ) : (
                    <Tag>Not Specified</Tag>
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="Payment Status">
                  <Tag
                    color={
                      lastPaymentStatus === "fully_paid"
                        ? token.colorSuccess
                        : lastPaymentStatus === "partial_paid"
                          ? token.colorWarning
                          : "processing"
                    }
                  >
                    {lastPaymentStatus
                      ? lastPaymentStatus.replace("_", " ").toUpperCase()
                      : "N/A"}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Fees Paid">
                  ₹ {paymentSummary.total_amount_paid || 0} / ₹ {user.price || 0}
                  {user.price > 0 && (
                    <>
                      <br />
                      <Text type="colorTextSecondary">
                        (Remaining: ₹{" "}
                        {(user.price || 0) -
                          (paymentSummary.total_amount_paid || 0)})
                      </Text>
                    </>
                  )}
                </Descriptions.Item>

                {showExamReport && (
                  <Descriptions.Item label="Exam Status">
                    <Tag
                      color={
                        progressData.exam === "completed"
                          ? token.colorSuccess
                          : progressData.exam === "pending_approval"
                            ? token.colorWarning
                            : progressData.exam === "in_progress"
                              ? token.colorPrimary
                              : "default"
                      }
                    >
                      {progressData.exam === "completed"
                        ? "Completed"
                        : progressData.exam === "pending_approval"
                          ? "Pending Approval"
                          : progressData.exam === "in_progress"
                            ? "In Progress"
                            : "Not Started"}
                    </Tag>
                  </Descriptions.Item>
                )}

                {showExamReport && (
                  <Descriptions.Item label="Report Status">
                    <Tag
                      color={
                        progressData.report === "received_locked"
                          ? token.colorPrimary
                          : progressData.report === "not_received"
                            ? token.colorWarning
                            : progressData.report === "received_unlocked"
                              ? token.colorSuccess
                              : "default"
                      }
                    >
                      {progressData.report === "received_locked"
                        ? "Received & Locked"
                        : progressData.report === "not_received"
                          ? "Not Received"
                          : progressData.report === "received_unlocked"
                            ? "Received & Unlocked"
                            : "N/A"}
                    </Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Col>
          </Row>

          <Divider />

          {/* ================= JOURNEY PROGRESS ================= */}
          <Title level={5}>Journey Progress</Title>

          <div
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
                const isPartialReportStep = label === "Partial Report";
                const isFullReportStep = label === "Full Report";
                // Hide Exam & Report for programs other than Aptitude & PG
                if (!showExamReport && (label === "Exam" || label === "Report")) {
                  return null;
                }

                // ✅ SHOW Questionnaire & Analysis Report ONLY if flag is true
             if (
  !engineeringTestAnalysis &&
  (label === "Questionnaire" || label === "Analysis Report")
) {
  return null;
}



                const stepNo = index + 1;
                // const isPaymentStep = stepNo === 3;
                const isPaymentStep = label === "Payment";
                const isExamStep = label === "Exam";
                const isReportStep = label === "Report";
                const isActive = stepNo === currentStep;

                const isCompleted =
                  (label === "Registration" && progressData.registration) ||
                  (label === "Counselling Service Selection" && progressData.counselling_service) ||
                  (label === "Payment" && progressData.payment === "fully_paid") ||
                  (label === "Exam" && progressData.exam === "completed") ||
                  (label === "Report" && progressData.report === "received_unlocked") ||
                    (label === "Questionnaire" &&
    (progressData.analysis === "completed" || progressData.analysis === "in_progress")) ||

  (label === "Analysis Report" &&
    progressData.analysis === "completed") ||

                  (label === "Counselling Slot Booking" &&
                    ["booked", "rescheduled", "completed"].includes(
                      progressData.counselling_slot_booking
                    )) ||
                (label === "Review" &&(progressData.review === true || progressData.review === "submitted")) ||
                  (label === "Full Access" && progressData.full_access);


                // Step color
                let stepColor = token.colorBorder;
                if (isPaymentStep && isPartialPayment) stepColor = token.colorWarning;
                else if (isCompleted) stepColor = token.colorSuccess;
                else if (
                  (isExamStep && progressData.exam === "in_progress") ||
                  (isReportStep && progressData.report === "received_locked") ||
                  (label === "Review" && progressData.review === "in_process") ||
                  isActive
                ) stepColor = token.colorPrimary;
                else if (
                  (isPartialReportStep && progressData.partial_report === "locked") ||
                  (isFullReportStep && progressData.full_report === "locked")
                ) {
                  stepColor = token.colorPrimary;
                }


                // Connector width
                let progressWidth = "0%";
                if (
                   isJourneyCompleted ||
                  stepNo < currentStep ||
                  (isPaymentStep && isPartialPayment) ||
                  (isExamStep && progressData.exam === "in_progress") ||
                  (isReportStep && progressData.report === "received_locked") ||

                  (label === "Review" && (progressData.review === "in_process" || progressData.review === "submitted")) ||
                  (label === "Full Access" && progressData.full_access === "submitted") ||
                  isActive
                ) {
                  progressWidth = "100%";
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
                          title={isPaymentStep && isPartialPayment ? "Partial Paid" : ""}
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
                        backgroundColor: stepColor,
                        color: stepColor === token.colorBorder ? token.colorTextSecondary : "#fff",
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

              {Object.values(
                historyData
                  .filter((item) => {
                    const status = item.status?.toLowerCase();

                    if (!status || status === "pending") return false;
                    if (item.step === "Counselling Slot Booking" && status === "not_booked") {
                      return false;
                    }
                    if (item.step === "Exam" && progressData.exam === "not_applicable") {
                      return false;
                    }
                    if (item.step === "Report" && progressData.report === "not_applicable") {
                      return false;
                    }

                    if (item.step === "Review" && status === "not_submitted") {
                    return false;
          }
                    if (
                      !showExamReport &&
                      (item.step === "Exam" || item.step === "Report")
                    ) {
                      return false;
                    }
                    return true;
                  })

                  .reduce((acc, item) => {
                    if (!acc[item.step]) {
                      acc[item.step] = { ...item, payments: [] };
                    }
                    if (item.step === "Payment") acc[item.step].payments.push(item);
                    return acc;
                  }, {})
              ).map((item, index) => {
                let status =
                  item.step === "Payment"
                    ? lastPaymentStatus?.toLowerCase()
                    : item.status?.toLowerCase();

                const isCompleted =
                  status === "completed" || 
                  status === "fully_paid" || 
                  status === "received_unlocked" ||
                  status === "rescheduled" || 
                  status == "booked" ||
                  status === "submitted"; 

                const isPartial =
                  status === "partial_paid" ||
                  status === "partially_paid" ||
                  status === "partial";

                const isInProgress = status === "in_process";
                const isRescheduled = status === "rescheduled";

                return (
                  <div key={index} style={{ position: "relative", marginBottom: 28 }}>
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
                            : isRescheduled
                              ? token.colorInfo   // 🔥 or use custom like "#722ed1"
                              : isInProgress
                                ? token.colorPrimary
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
                                  : isRescheduled || isInProgress
                                    ? "processing"
                                    : "default"
                            }
                          >
                            {status?.replace("_", " ").toUpperCase()}
                          </Tag>
                        </Col>
                      </Row>

                      {/* {item.step === "Payment" ? (
                        <div style={{ marginTop: 10 }}>
                          {payments.map((pay, i) => (
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
                              ₹{pay.amount} - ({pay.method})
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
                      ) : ( */}
                      {item.step === "Payment" ? (
                        <div style={{ marginTop: 10 }}>
                          {(payments.length > 0
                            ? payments
                            : paymentSummary?.last_payment
                              ? [paymentSummary.last_payment]
                              : []
                          ).map((pay, i) => (
                            <div
                              key={pay?.payment_id || i}
                              style={{
                                padding: "8px 12px",
                                marginTop: 6,
                                borderRadius: 8,
                                background: "#fafafa",
                                border: `1px solid ${token.colorBorder}`,
                                fontSize: 14,
                              }}
                            >
                              <div>
                                ₹{pay?.amount ?? "-"} - ({pay?.method || "-"})
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: token.colorTextSecondary,
                                  marginTop: 4,
                                }}
                              >
                                {formatDisplayDate(pay?.created_at || pay?.date)}
                               
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
                            {formatDisplayDate(item.created_at || item.date)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default UserProfileModal;
