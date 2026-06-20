import React, { useEffect, useState } from "react";
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
  Select,
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
  "Counselling Slot Booking",
  "Review",
  "Report",
  "Full Access",
];



const journeySteps =
  // user?.program?.toLowerCase() === "engineering"
  [
    "Registration",
    "Counselling Service Selection",
    "Payment",
    "Exam",
    "Questionnaire",
    "Analysis Report",
    "Counselling Slot Booking",
    "Review",
    "Report",
    "Full Access",
  ]
baseJourneySteps;



const UserProfileModal = ({ open, onClose, user }) => {
  const [selectedProgramIdx, setSelectedProgramIdx] = useState(0);
  const { token } = theme.useToken();
  const dispatch = useDispatch();
  const { journey, journeyLoading } = useSelector((state) => state.users);

  useEffect(() => {
    if (open && user?.id) {
      dispatch(fetchStudentJourney(user.id));
    }
  }, [open, user, dispatch]);

  // Reset to first program when modal opens
  useEffect(() => {
    if (open) {
      setSelectedProgramIdx(0);
    }
  }, [open, user?.id]);

  // Normalize program journeys from API payload
  const programJourneys = Array.isArray(journey?.programs) && journey.programs.length > 0
    ? journey.programs
    : Array.isArray(journey?.journeys) && journey.journeys.length > 0
      ? journey.journeys
      : journey && (journey.progress || journey.history || journey.payment_summary)
        ? [{
          ...journey,
          program_name: journey.program_name || journey.program?.name || user?.program,
          package: journey.package || journey.package_name || user?.package,
        }]
        : [];

  const programs = programJourneys.length > 0
    ? programJourneys
    : Array.isArray(user?.programs)
      ? user.programs
      : [];

  const hasMultiplePrograms = programs.length > 1;

  const selectedJourney = programJourneys[selectedProgramIdx] || programJourneys[0] || journey || {};

  useEffect(() => {
    if (programJourneys.length > 0 && selectedProgramIdx >= programJourneys.length) {
      setSelectedProgramIdx(0);
    }
  }, [programJourneys.length, selectedProgramIdx]);

  if (!user) return null;

  /* ================= API DATA ================= */
  const progressData = selectedJourney?.progress || journey?.progress || {};
  const historyData = Array.isArray(selectedJourney?.history)
    ? selectedJourney.history
    : Array.isArray(journey?.history)
      ? journey.history
      : Object.values(selectedJourney?.history || journey?.history || {});
  const paymentSummary = selectedJourney?.payment_summary || journey?.payment_summary || {};
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

  const engineeringTestAnalysis = selectedJourney?.engineering_test_analysis || journey?.engineering_test_analysis;

  const showExamReport =
    (selectedJourney?.aptitude_test === true || user?.aptitude_test === true) &&
    !engineeringTestAnalysis;

  const visibleJourneySteps = journeySteps.filter((label) => {
    if (!showExamReport && (label === "Exam" || label === "Report")) return false;
    if (!engineeringTestAnalysis && (label === "Questionnaire" || label === "Analysis Report")) return false;
    return true;
  });

  const normalizedCurrentStep = Math.min(currentStep, visibleJourneySteps.length || 1);

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
                <Descriptions.Item label="Program / Counselling Service">
                  {Array.isArray(user.programs) && user.programs.length > 0 ? (
                    user.programs.map((item, idx) => (
                      <div key={idx} style={{ marginBottom: 10 }}>
                        <Text strong>{`Program ${idx + 1}: `}</Text>
                        <Text strong >
                          {item.program_name || item.program?.name || user.program || "-"}
                        </Text>
                        <br />
                        <Text type="colorTextSecondary">
                          {`Service ${idx + 1}: ${item.package?.name || item.package_name || user.package || "-"}`}
                        </Text>
                      </div>
                    ))
                  ) : (
                    <>
                      <Text strong>{user.program || "-"}</Text>
                      <br />
                      <Text type="colorTextSecondary">{user.package || "-"}</Text>
                    </>
                  )}
                </Descriptions.Item>
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

          {/* ================= PROGRAM SELECTOR (if multiple) ================= */}
          {hasMultiplePrograms && (
            <div style={{ marginBottom: 20 }}>
              <Row gutter={16}>
                <Col xs={24} md={10}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                    Select Program:
                  </label>
                  <Select
                    value={selectedProgramIdx}
                    onChange={setSelectedProgramIdx}
                    style={{ width: window.innerWidth < 768 ? "100%" : "150%" }}
                  >
                    {programs.map((prog, idx) => (
                      <Select.Option key={idx} value={idx}>
                        {`Program ${idx + 1}: ${prog.program_name || prog.program?.name || "—"
                          } | Package: ${prog.package?.name || prog.package_name || "—"
                          }`}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
              </Row>
              <Divider />
            </div>
          )}

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
                minWidth: visibleJourneySteps.length * 140,
              }}
            >
              {visibleJourneySteps.map((label, index) => {
                const isPartialReportStep = label === "Partial Report";
                const isFullReportStep = label === "Full Report";
                const stepNo = index + 1;
                const isPaymentStep = label === "Payment";
                const isExamStep = label === "Exam";
                const isReportStep = label === "Report";
                const isActive = stepNo === normalizedCurrentStep;

                const isCompleted =
                  (label === "Registration" && progressData.registration) ||
                  (label === "Counselling Service Selection" && progressData.counselling_service) ||
                  (label === "Payment" && progressData.payment === "fully_paid") ||
                  (label === "Exam" && progressData.exam === "completed") ||
                  (label === "Report" && progressData.report === "received_unlocked") ||
                  (label === "Questionnaire" &&
                    (progressData.analysis === "completed")) ||

                  (label === "Analysis Report" &&
                    (progressData.report === "completed" || progressData.report === "all_received")) ||


                  (label === "Counselling Slot Booking" &&
                    ["booked", "rescheduled", "completed"].includes(
                      progressData.counselling_slot_booking
                    )) ||
                  (label === "Review" && (progressData.review === true || progressData.review === "submitted")) ||
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
                  status === "submitted" ||
                  status === "all_received";

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



// import React, { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   Modal,
//   Typography,
//   Row,
//   Col,
//   Descriptions,
//   Tag,
//   Divider,
//   ConfigProvider,
//   theme,
//   Tooltip,
//   Spin,
//   Empty,
//   Card,
// } from "antd";
// import { CheckOutlined } from "@ant-design/icons";
// import adminTheme from "../../../theme/adminTheme";
// import { fetchStudentJourney } from "../../../adminSlices/userSlice";

// const { Title, Text } = Typography;

// /* ─────────────────────────────────────────────────────────────────────────────
//    Helpers
// ───────────────────────────────────────────────────────────────────────────── */
// const formatDisplayDate = (value) => {
//   if (!value) return "—";
//   const d = new Date(value);
//   if (Number.isNaN(d.getTime())) return value;
//   return new Intl.DateTimeFormat("en-IN", {
//     day: "2-digit", month: "short", year: "numeric",
//     hour: "numeric", minute: "2-digit", hour12: true,
//   }).format(d);
// };

// const buildJourneySteps = (showExamReport, showEngAnalysis) => {
//   const steps = ["Registration", "Counselling Service Selection", "Payment"];
//   if (showExamReport)  steps.push("Exam", "Report");
//   if (showEngAnalysis) steps.push("Questionnaire", "Analysis Report");
//   steps.push("Counselling Slot Booking", "Review", "Full Access");
//   return steps;
// };

// const isStepCompleted = (label, p) => {
//   switch (label) {
//     case "Registration":                  return !!p.registration;
//     case "Counselling Service Selection": return !!p.counselling_service;
//     case "Payment":                       return p.payment === "fully_paid";
//     case "Exam":                          return p.exam === "completed";
//     case "Report":                        return p.report === "received_unlocked";
//     case "Questionnaire":                 return ["completed", "in_progress"].includes(p.analysis);
//     case "Analysis Report":               return p.analysis === "completed";
//     case "Counselling Slot Booking":      return ["booked", "rescheduled", "completed"].includes(p.counselling_slot_booking);
//     case "Review":                        return p.review === true || p.review === "submitted";
//     case "Full Access":                   return !!p.full_access;
//     default:                              return false;
//   }
// };

// /* ─────────────────────────────────────────────────────────────────────────────
//    JourneyProgress
// ───────────────────────────────────────────────────────────────────────────── */
// const JourneyProgress = ({ progressData = {}, paymentSummary = {}, showExamReport, showEngAnalysis }) => {
//   const { token } = theme.useToken();
//   const isPartialPayment   = progressData.payment === "partial_paid";
//   const isJourneyCompleted = progressData.full_access === true;
//   const currentStep        = progressData.current_step || 1;
//   const steps              = buildJourneySteps(showExamReport, showEngAnalysis);

//   return (
//     <div style={{ overflowX: "auto", paddingBottom: 8 }}>
//       <div style={{ display: "flex", alignItems: "flex-start", minWidth: steps.length * 130 }}>
//         {steps.map((label, index) => {
//           const stepNo        = index + 1;
//           const isPaymentStep = label === "Payment";
//           const isExamStep    = label === "Exam";
//           const isReportStep  = label === "Report";
//           const isActive      = stepNo === currentStep;
//           const completed     = isStepCompleted(label, progressData);

//           let stepColor = token.colorBorder;
//           if      (isPaymentStep && isPartialPayment)                           stepColor = token.colorWarning;
//           else if (completed)                                                    stepColor = token.colorSuccess;
//           else if (
//             (isExamStep   && progressData.exam   === "in_progress") ||
//             (isReportStep && progressData.report === "received_locked") ||
//             (label === "Review" && progressData.review === "in_process") ||
//             isActive
//           ) stepColor = token.colorPrimary;

//           let progressWidth = "0%";
//           if (
//             isJourneyCompleted || stepNo < currentStep ||
//             (isPaymentStep && isPartialPayment) ||
//             (isExamStep   && progressData.exam   === "in_progress") ||
//             (isReportStep && progressData.report === "received_locked") ||
//             (label === "Review" && ["in_process", "submitted"].includes(progressData.review)) ||
//             isActive
//           ) progressWidth = "100%";

//           return (
//             <div
//               key={label}
//               style={{
//                 position: "relative", display: "flex", flexDirection: "column",
//                 alignItems: "center", width: 130, flexShrink: 0, minHeight: 90,
//               }}
//             >
//               {index !== 0 && (
//                 <div style={{
//                   position: "absolute", top: 18, left: "-65px",
//                   width: "130px", height: 4, background: token.colorBorder,
//                 }}>
//                   <Tooltip title={isPaymentStep && isPartialPayment ? "Partial Paid" : ""}>
//                     <div style={{
//                       height: "100%", background: token.colorPrimary,
//                       width: progressWidth, transition: "width 0.3s ease",
//                     }} />
//                   </Tooltip>
//                 </div>
//               )}
//               <div style={{
//                 width: 36, height: 36, borderRadius: "50%", fontWeight: 600,
//                 display: "flex", alignItems: "center", justifyContent: "center",
//                 backgroundColor: stepColor,
//                 color: stepColor === token.colorBorder ? token.colorTextSecondary : "#fff",
//                 zIndex: 1, fontSize: 13,
//               }}>
//                 {completed ? <CheckOutlined /> : stepNo}
//               </div>
//               <div style={{
//                 marginTop: 8, fontSize: 12, textAlign: "center",
//                 maxWidth: 110, color: token.colorText, lineHeight: 1.4,
//               }}>
//                 {label}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// /* ─────────────────────────────────────────────────────────────────────────────
//    JourneyHistory
// ───────────────────────────────────────────────────────────────────────────── */
// const JourneyHistory = ({ historyData = [], progressData = {}, paymentSummary = {}, showExamReport }) => {
//   const { token } = theme.useToken();
//   const lastPaymentStatus = paymentSummary?.last_payment?.status || null;
//   const payments = paymentSummary.all_payments || paymentSummary.payments || [];

//   const filteredHistory = Object.values(
//     historyData
//       .filter((item) => {
//         const status = item.status?.toLowerCase();
//         if (!status || status === "pending") return false;
//         if (item.step === "Counselling Slot Booking" && status === "not_booked") return false;
//         if (item.step === "Exam"   && progressData.exam   === "not_applicable") return false;
//         if (item.step === "Report" && progressData.report === "not_applicable") return false;
//         if (item.step === "Review" && status === "not_submitted") return false;
//         if (!showExamReport && (item.step === "Exam" || item.step === "Report")) return false;
//         return true;
//       })
//       .reduce((acc, item) => {
//         if (!acc[item.step]) acc[item.step] = { ...item, payments: [] };
//         if (item.step === "Payment") acc[item.step].payments.push(item);
//         return acc;
//       }, {})
//   );

//   if (filteredHistory.length === 0) {
//     return <Empty description="No history yet" imageStyle={{ height: 40 }} style={{ margin: "12px 0" }} />;
//   }

//   return (
//     <div style={{ position: "relative", paddingLeft: 28 }}>
//       {/* vertical line */}
//       <div style={{
//         position: "absolute", left: 13, top: 0, bottom: 0,
//         width: 3, background: token.colorBorder, borderRadius: 2,
//       }} />

//       {filteredHistory.map((item, index) => {
//         let status = item.step === "Payment"
//           ? lastPaymentStatus?.toLowerCase()
//           : item.status?.toLowerCase();

//         const isCompleted   = ["completed", "fully_paid", "received_unlocked", "rescheduled", "booked", "submitted"].includes(status);
//         const isPartial     = ["partial_paid", "partially_paid", "partial"].includes(status);
//         const isInProgress  = status === "in_process";
//         const isRescheduled = status === "rescheduled";

//         const dotColor = isCompleted ? token.colorSuccess
//           : isPartial     ? token.colorWarning
//           : isRescheduled || isInProgress ? token.colorPrimary
//           : token.colorBorder;

//         const tagColor = isCompleted ? "success"
//           : isPartial     ? "warning"
//           : isRescheduled || isInProgress ? "processing"
//           : "default";

//         return (
//           <div key={index} style={{ position: "relative", marginBottom: 16 }}>
//             <div style={{
//               position: "absolute", left: -15, top: 8,
//               width: 28, height: 28, borderRadius: "50%",
//               background: dotColor,
//               display: "flex", alignItems: "center", justifyContent: "center",
//               color: "#fff", fontWeight: 600, fontSize: 12, zIndex: 1,
//             }}>
//               {isCompleted ? <CheckOutlined /> : index + 1}
//             </div>

//             <div style={{
//               marginLeft: 24, padding: "12px 16px", borderRadius: 10,
//               background: token.colorBgContainer,
//               border: `1px solid ${token.colorBorder}`,
//               boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
//             }}>
//               <Row justify="space-between" align="middle">
//                 <Col><Text strong style={{ fontSize: 14 }}>{item.step}</Text></Col>
//                 <Col>
//                   <Tag color={tagColor} style={{ fontSize: 11 }}>
//                     {status?.replace(/_/g, " ").toUpperCase()}
//                   </Tag>
//                 </Col>
//               </Row>

//               {item.step === "Payment" ? (
//                 <div style={{ marginTop: 8 }}>
//                   {(payments.length > 0
//                     ? payments
//                     : paymentSummary?.last_payment ? [paymentSummary.last_payment] : []
//                   ).map((pay, i) => (
//                     <div key={pay?.payment_id || i} style={{
//                       padding: "6px 10px", marginTop: 6, borderRadius: 6,
//                       background: "#fafafa", border: `1px solid ${token.colorBorder}`, fontSize: 13,
//                     }}>
//                       <Text>₹{pay?.amount ?? "-"}</Text>
//                       <Text type="secondary"> · {pay?.method || "-"}</Text>
//                       <div style={{ fontSize: 11, color: token.colorTextSecondary, marginTop: 2 }}>
//                         {formatDisplayDate(pay?.created_at || pay?.date)}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <>
//                   {item.details && (
//                     <div style={{ marginTop: 6, fontSize: 13, color: token.colorTextSecondary }}>
//                       {item.details}
//                     </div>
//                   )}
//                   <div style={{ marginTop: 4, fontSize: 11, color: token.colorTextSecondary }}>
//                     {formatDisplayDate(item.created_at || item.date)}
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// /* ─────────────────────────────────────────────────────────────────────────────
//    UserProfileModal
// ───────────────────────────────────────────────────────────────────────────── */
// const UserProfileModal = ({ open, onClose, user }) => {
//   const { token } = theme.useToken();
//   const dispatch = useDispatch();
//   const { journey, journeyLoading } = useSelector((state) => state.users);

//   useEffect(() => {
//     if (open && user?.id) dispatch(fetchStudentJourney(user.id));
//   }, [open, user, dispatch]);

//   if (!user) return null;

//   const displayName =
//     user.name?.toString().trim() ||
//     `${(user.first_name || "").trim()} ${(user.last_name || "").trim()}`.trim();

//   /* Normalise to array — supports new { programs:[...] } and legacy flat shape */
//   const programJourneys = (() => {
//     if (!journey) return [];
//     if (Array.isArray(journey.programs) && journey.programs.length > 0) return journey.programs;
//     if (journey.progress || journey.history) {
//       return [{
//         program:                    user.program,
//         package:                    user.package,
//         preferred_counselling_mode: user.preferred_counselling_mode,
//         price:                      user.price,
//         aptitude_test:              user.aptitude_test,
//         engineering_test_analysis:  journey.engineering_test_analysis,
//         progress:                   journey.progress        || {},
//         history:                    journey.history         || [],
//         payment_summary:            journey.payment_summary || {},
//       }];
//     }
//     return [];
//   })();

//   const multiProgram = programJourneys.length > 1;

//   return (
//     <ConfigProvider theme={adminTheme}>
//       <Modal
//         open={open}
//         onCancel={onClose}
//         footer={null}
//         width={1020}
//         centered
//         title={<Title level={4} style={{ margin: 0 }}>User Profile</Title>}
//       >
//         <div style={{ maxHeight: "85vh", overflowY: "auto", paddingRight: 8 }}>

//           {/* ── Student Details ── */}
//           <Card
//             size="small"
//             style={{ marginBottom: 20, borderRadius: 10 }}
//             styles={{ body: { padding: "14px 18px" } }}
//           >
//             <Title level={5} style={{ marginBottom: 10 }}>Student Details</Title>
//             <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
//               <Descriptions.Item label="Name">{displayName}</Descriptions.Item>
//               <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
//             </Descriptions>
//           </Card>

//           {/* ── Program sections ── */}
//           {journeyLoading ? (
//             <div style={{ textAlign: "center", padding: 60 }}>
//               <Spin size="large" />
//             </div>
//           ) : programJourneys.length === 0 ? (
//             <Empty description="No program data available" style={{ margin: "40px 0" }} />
//           ) : (
//             programJourneys.map((prog, idx) => {
//               const progressData    = prog?.progress        || {};
//               const historyData     = prog?.history         || [];
//               const paymentSummary  = prog?.payment_summary || {};
//               const showExamReport  = prog?.aptitude_test   === true || user?.aptitude_test === true;
//               const showEngAnalysis = prog?.engineering_test_analysis || false;
//               const lastPaymentStatus = paymentSummary?.last_payment?.status || null;
//               const suffix = multiProgram ? ` ${idx + 1}` : "";

//               return (
//                 <div key={idx} style={{ marginBottom: 28 }}>

//                   {/* Program header badge */}
//                   {multiProgram && (
//                     <div style={{
//                       display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
//                     }}>
//                       <div style={{
//                         width: 30, height: 30, borderRadius: "50%",
//                         background: token.colorPrimary,
//                         display: "flex", alignItems: "center", justifyContent: "center",
//                         color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0,
//                       }}>
//                         {idx + 1}
//                       </div>
//                       <Title level={5} style={{ margin: 0 }}>
//                         {prog?.program || `Program ${idx + 1}`}
//                       </Title>
//                     </div>
//                   )}

//                   {/* Program details card */}
//                   <Card
//                     size="small"
//                     style={{ marginBottom: 14, borderRadius: 10 }}
//                     styles={{ body: { padding: "14px 18px" } }}
//                     title={<Text strong>Program Details{suffix}</Text>}
//                   >
//                     <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
//                       <Descriptions.Item label="Program">{prog?.program || "—"}</Descriptions.Item>
//                       <Descriptions.Item label="Counselling Service">{prog?.package || "—"}</Descriptions.Item>
//                       <Descriptions.Item label="Preferred Mode">
//                         {prog?.preferred_counselling_mode ? (
//                           <Tag color={prog.preferred_counselling_mode.toLowerCase() === "online" ? "blue" : "green"}>
//                             {prog.preferred_counselling_mode.replace("_", " ").toUpperCase()}
//                           </Tag>
//                         ) : <Tag>Not Specified</Tag>}
//                       </Descriptions.Item>
//                       <Descriptions.Item label="Payment Status">
//                         <Tag color={
//                           lastPaymentStatus === "fully_paid"   ? "success"
//                           : lastPaymentStatus === "partial_paid" ? "warning"
//                           : "processing"
//                         }>
//                           {lastPaymentStatus ? lastPaymentStatus.replace(/_/g, " ").toUpperCase() : "N/A"}
//                         </Tag>
//                       </Descriptions.Item>
//                       <Descriptions.Item label="Fees Paid">
//                         ₹{paymentSummary.total_amount_paid || prog?.amount_paid || 0} / ₹{prog?.price || user?.price || 0}
//                         {(prog?.price || user?.price) > 0 && (
//                           <>
//                             <br />
//                             <Text type="secondary" style={{ fontSize: 12 }}>
//                               Remaining: ₹{(prog?.price || user?.price || 0) -
//                                 (paymentSummary.total_amount_paid || prog?.amount_paid || 0)}
//                             </Text>
//                           </>
//                         )}
//                       </Descriptions.Item>
//                       {showExamReport && (
//                         <Descriptions.Item label="Exam Status">
//                           <Tag color={
//                             progressData.exam === "completed"         ? "success"
//                             : progressData.exam === "pending_approval" ? "warning"
//                             : progressData.exam === "in_progress"      ? "processing"
//                             : "default"
//                           }>
//                             {progressData.exam === "completed"         ? "Completed"
//                             : progressData.exam === "pending_approval"  ? "Pending Approval"
//                             : progressData.exam === "in_progress"       ? "In Progress"
//                             : "Not Started"}
//                           </Tag>
//                         </Descriptions.Item>
//                       )}
//                       {showExamReport && (
//                         <Descriptions.Item label="Report Status">
//                           <Tag color={
//                             progressData.report === "received_unlocked" ? "success"
//                             : progressData.report === "received_locked"  ? "processing"
//                             : progressData.report === "not_received"     ? "warning"
//                             : "default"
//                           }>
//                             {progressData.report === "received_locked"   ? "Received & Locked"
//                             : progressData.report === "not_received"      ? "Not Received"
//                             : progressData.report === "received_unlocked" ? "Received & Unlocked"
//                             : "N/A"}
//                           </Tag>
//                         </Descriptions.Item>
//                       )}
//                     </Descriptions>
//                   </Card>

//                   {/* Journey Progress card */}
//                   <Card
//                     size="small"
//                     style={{ marginBottom: 14, borderRadius: 10 }}
//                     styles={{ body: { padding: "14px 18px" } }}
//                     title={<Text strong>Journey Progress{suffix}</Text>}
//                   >
//                     <JourneyProgress
//                       progressData={progressData}
//                       paymentSummary={paymentSummary}
//                       showExamReport={showExamReport}
//                       showEngAnalysis={showEngAnalysis}
//                     />
//                   </Card>

//                   {/* Journey History card */}
//                   <Card
//                     size="small"
//                     style={{ borderRadius: 10 }}
//                     styles={{ body: { padding: "14px 18px" } }}
//                     title={<Text strong>Journey History{suffix}</Text>}
//                   >
//                     <JourneyHistory
//                       historyData={historyData}
//                       progressData={progressData}
//                       paymentSummary={paymentSummary}
//                       showExamReport={showExamReport}
//                     />
//                   </Card>

//                   {/* Divider between programs */}
//                   {idx < programJourneys.length - 1 && (
//                     <Divider style={{ margin: "28px 0 0" }} />
//                   )}
//                 </div>
//               );
//             })
//           )}

//         </div>
//       </Modal>
//     </ConfigProvider>
//   );
// };

// export default UserProfileModal;