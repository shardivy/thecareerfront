import React from "react";
import { Card, Typography, Tooltip, Spin, Timeline, Tag, Divider } from "antd";
import { useNavigate } from "react-router-dom";
import { CheckOutlined } from "@ant-design/icons";
import { theme } from "antd";

const { Title, Text } = Typography;
const { useToken } = theme;

const JourneySteps = ({
  currentStep = 0,
  showExamAndReport = true,
  engineeringTestAnalysis = false,
  role = "",
  progressData = {},
  historyData = [],
  paymentSummary = {},
  programName = "",
  packageName = "",
  journeyLoading = false,
}) => {
  const navigate = useNavigate();
  const { token } = useToken();

  // Derive isFreeUser from role
  const isFreeUser = String(role || "").toLowerCase() === "basic_user";



  // Define journey steps based on conditions
  // const getJourneySteps = () => {
  //   let steps = [
  //     "Registration",
  //     "Counselling Service Selection",
  //     "Payment",
  //   ];

  //   if (showExamAndReport) {
  //     steps.push("Exam", "Report");
  //   }

  //   if (engineeringTestAnalysis) {
  //     steps.push("Questionnaire", "Analysis Report");
  //   }

  //   steps.push(
  //     "Counselling Slot Booking",
  //     "Review",
  //     "Full Access"
  //   );

  //   return steps;
  // };

  const getJourneySteps = () => {
    let steps = [
      "Registration",
      "Counselling Service Selection",
      "Payment",
    ];

    // EXAM FLOW
    if (showExamAndReport) {
      steps.push(
        "Exam",
        "Counselling Slot Booking",
        "Review",
        "Report"
      );
    } else if (engineeringTestAnalysis) {
      // ENGINEERING FLOW
      steps.push(
        "Questionnaire",
        "Analysis Report",
        "Counselling Slot Booking",
        "Review"
      );
    } else {
      // Normal paid journey flow: slot booking comes after payment
      steps.push("Counselling Slot Booking", "Review");
    }

    steps.push("Full Access");

    return steps;
  };

  const journeySteps = getJourneySteps();

  // Check if a step is completed based on progressData
  const isStepCompleted = (label) => {
    switch (label) {
      case "Registration":
        return progressData.registration === true;
      case "Counselling Service Selection":
        return progressData.counselling_service === true;
      case "Payment":
        return progressData.payment === "fully_paid";
      case "Exam":
        return progressData.exam === "completed";
      case "Report":
        return progressData.report === "received_unlocked";
      case "Questionnaire":
        return progressData.analysis === "completed" ;

      case "Analysis Report":
        return progressData.report === "all_received";

      case "Counselling Slot Booking":
        return (
          progressData.counselling_slot_booking === "booked" ||
          progressData.counselling_slot_booking === "rescheduled" ||
          progressData.counselling_slot_booking === "completed"
        );
      //   return progressData.counselling_slot_booking === true;
      case "Review":
        return progressData.review === true || progressData.review === "submitted";

      case "Full Access":
        return progressData.full_access === true || progressData.full_access === "submitted";
      default:
        return false;
    }
  };

  // Check if step is in progress
  const isStepInProgress = (label) => {
    switch (label) {
      case "Exam":
        return progressData.exam === "in_progress";
      case "Report":
        return progressData.report === "received_locked";

      case "Payment":
        return (
          progressData.payment === "not_paid" ||
          progressData.payment === "partial_paid"
        );
      case "Counselling Slot Booking":
        return progressData.counselling_slot_booking === "pending" || progressData.counselling_slot_booking === "not_booked";
      case "Questionnaire":
        return progressData.analysis === "in_progress";

      case "Analysis Report":
        return (
          progressData.report === "received_locked" ||
          progressData.report === "v1_received" ||
          progressData.report === "in_progress"
        );

      case "Review":
        return progressData.review === "in_process";
      default:
        return false;
    }
  };

  // Get step color based on status
  const getStepColor = (label, index) => {
    const stepNo = index + 1;
    const isPartialPayment = label === "Payment" && progressData.payment === "partial_paid";
    const isCompleted = isStepCompleted(label);
    const isInProgress = isStepInProgress(label);
    const isActive = stepNo === currentStep + 1;
    const isPending = !isCompleted && !isInProgress && !isActive;

    if (isPartialPayment) return token.colorWarning; // Orange/amber for partial payment
    if (isCompleted) return token.colorSuccess; // Green for completed
    if (isInProgress || isActive || isPending) return token.colorPrimary; // Blue for in progress/active
    if (stepNo < currentStep + 1) return token.colorSuccess; // Completed steps before current
    return token.colorBorder; // Default grey for pending
  };

  // Get connector progress width
  const getConnectorProgress = (label, index) => {
    const stepNo = index + 1;

    const isPaymentStep = label === "Payment";
    const isCompleted = isStepCompleted(label);
    const isInProgress = isStepInProgress(label);
    const isActive = stepNo === currentStep + 1;

    // ✅ Always show connector for payment step
    if (isPaymentStep) {
      return "100%";
    }

    if (stepNo < currentStep + 1 || isCompleted || isInProgress || isActive) {
      return "100%";
    }

    return "0%";
  };

  // Handle step click navigation
  const handleStepClick = (label, index) => {
    const stepNo = index + 1;
    if (stepNo <= currentStep + 1) {
      switch (label) {
        case "Registration":
          navigate("/register");
          break;
        case "Counselling Service Selection":
          navigate("/student/program");
          break;
        case "Payment":
          navigate("/student/payments");
          break;
        case "Exam":
          navigate("/student/exam-management");
          break;
        case "Report":
          navigate("/student/report-management");
          break;
        case "Questionnaire":
          navigate("/student/engineering-questionnaires");
          break;
        case "Analysis Report":
          navigate("/student/analysis-report");
          break;
        case "Counselling Slot Booking":
          navigate("/student/slot-booking");
          break;
        case "Review":
          navigate("/student/write-review");
          break;
        case "Full Access":
          navigate("/student/dashboard");
          break;
        default:
          break;
      }
    }
  };

  // Get tooltip text
  const getTooltipText = (label) => {
    if (isStepCompleted(label)) return `${label} - Completed`;
    if (label === "Payment" && progressData.payment === "partial_paid")
      return `${label} - Partially Paid`;
    if (label === "Exam" && progressData.exam === "in_progress")
      return `${label} - In Progress`;
    if (label === "Report" && progressData.report === "received_locked")
      return `${label} - Locked`;
    if (label === "Questionnaire" && progressData.analysis === "in_progress")
      return `${label} - In Progress`;

    if (
      label === "Analysis Report" &&
      (
        progressData.report === "received_unlocked" ||
        progressData.report === "all_received"
      )
    )
      return `${label} - Completed`;

    if (label === "Analysis Report")
      return `${label} - In Progress`;

    if (label === "Review") {
      if (progressData.review === "in_process")
        return `${label} - In Progress`;

      if (progressData.review === "not_submitted")
        return `${label} - Pending`;
    }

    if (label === "Review" && progressData.review === true)
      return `${label} - Completed`;
  };



  // Free user static view
  if (isFreeUser) {
    const freeSteps = [
      "Registration",
      "Counselling Service Selection",
      "Payment",
      "Exam",
      "Counselling Slot Booking",
      "Full Access",
    ];

    return (
      <Card
        style={{
          borderRadius: 16,
          padding: "24px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
        }}
      >
        <Title level={4} style={{ marginBottom: 10 }}>
          Your Career Counselling Journey
        </Title>

        <Text type="colorTextSecondary" style={{ display: "block", marginBottom: 24 }}>
          This is a preview of your complete counselling journey.
        </Text>

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
              minWidth: freeSteps.length * 140,
            }}
          >
            {freeSteps.map((label, index) => (
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
                {/* Connector */}
                {index !== 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 20,
                      left: "-70px",
                      width: "140px",
                      height: 4,
                      background: "#e5e7eb",
                    }}
                  />
                )}

                {/* Step Circle */}
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: token.colorPrimary,
                    color: "#fff",
                    zIndex: 1,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  {index + 1}
                </div>

                {/* Step Label */}
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    textAlign: "center",
                    maxWidth: 120,
                    fontWeight: 500,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Paid user view
  return (
    <Card
      style={{
        borderRadius: 16,
        padding: "24px",
        boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
      }}
    >
      <Title level={4} style={{ marginBottom: 8 }}>
        Your Journey Progress
      </Title>



      {journeyLoading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin />
        </div>
      ) : (
        <>
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
                minWidth: journeySteps.length * 140,
              }}
            >
              {journeySteps.map((label, index) => {
                const stepColor = getStepColor(label, index);
                const isCompleted = isStepCompleted(label);
                const isPartialPayment = label === "Payment" && progressData.payment === "partial_paid";
                const isClickable = index <= currentStep;

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
                        <Tooltip title={isPartialPayment ? "Partial Paid" : ""}>
                          <div
                            style={{
                              height: "100%",
                              background: token.colorPrimary,
                              width: getConnectorProgress(label, index),
                              transition: "width 0.3s ease",
                            }}
                          />
                        </Tooltip>
                      </div>
                    )}

                    <Tooltip title={getTooltipText(label)}>
                      <div
                        onClick={() => handleStepClick(label, index)}
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
                        fontWeight: index === currentStep ? 600 : 400,
                        color: index === currentStep ? token.colorPrimary : "inherit",
                        cursor: isClickable ? "pointer" : "default",
                      }}
                      onClick={() => handleStepClick(label, index)}
                    >
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


        </>
      )}
    </Card>
  );
};

export default JourneySteps;

// import React from "react";
// import { Card, Steps, Typography, Tooltip, Result, Button } from "antd";
// import { useNavigate } from "react-router-dom";
// import { RocketOutlined } from "@ant-design/icons";

// const { Title, Text } = Typography;

// const JourneySteps = ({
//   currentStep = 0,
//   showExamAndReport = true,
//   isFreeUser = false,
//     progressData = {},
// }) => {
//   const navigate = useNavigate();


// const getStepStatus = (stepKey) => {
//   const value = progressData?.[stepKey];

//   if (value === true || value === "fully_paid") return "finish";

//   if (
//     value === "pending_approval" ||
//     value === "not_uploaded" ||
//     value === false
//   )
//     return "wait";

//   return "process";
// };


//   // If free user, show a different message instead of steps
//   if (isFreeUser) {
//     const staticSteps = [
//       { title: "Registration" },
//       { title: "Counselling Service Selection" },
//       { title: "Payment" },
//       { title: "Exam" },
//       // { title: "Report" },
//       { title: "Counselling Slot Booking" },
//       { title: "Review" },
//       { title: "Full Access" },
//     ];


//     return (
//       <Card
//         style={{
//           borderRadius: 20,
//           padding: "24px 32px",
//           boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
//         }}
//       >
//         <Title level={4} style={{ marginBottom: 10 }}>
//           Your Career Journey
//         </Title>

//         <Text type="colorTextSecondary">
//           This is a preview of your complete counselling journey.
//           Upgrade to unlock and track your progress.
//         </Text>

//         <div style={{ marginTop: 32 }}>
//           <Steps
//             current={0} // Always start from first step (static)
//             labelPlacement="vertical"
//             items={staticSteps.map((step) => ({
//               title: (
//                 <span style={{ color: "#595959", fontWeight: 500 }}>
//                   {step.title}
//                 </span>
//               ),
//             }))}
//           />
//         </div>

//         {/* <div style={{ textAlign: "center", marginTop: 32 }}>
//           <Button
//             type="primary"
//             size="large"
//             onClick={() => navigate("/student/program")}
//           >
//             Upgrade & Start Journey
//           </Button>
//         </div> */}
//       </Card>
//     );
//   }
// const baseSteps = [
//   { key: "registration", title: "Registration", path: "/register" },
//   {
//     key: "counselling_service",
//     title: "Counselling Service Selection",
//     path: "/student/program",
//   },
//   { key: "payment", title: "Payment", path: "/student/payments" },
// ];

// const examSteps = showExamAndReport
//   ? [
//       { key: "exam", title: "Exam", path: "/student/exam-management" },
//       { key: "report", title: "Report", path: "/student/report-management" },
//     ]
//   : [];

// const remainingSteps = [
//   {
//     key: "counselling_slot_booking",
//     title: "Counselling Slot Booking",
//     path: "/student/slot-booking",
//   },
//   { key: "review", title: "Review", path: "/student/report-management" },
//   { key: "full_access", title: "Full Access", path: "/student/dashboard" },
// ];

// const stepsConfig = [...baseSteps, ...examSteps, ...remainingSteps];

//   return (
//     <Card
//       style={{
//         borderRadius: 20,
//         padding: "24px 32px",
//         boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
//       }}
//     >
//       <Title level={4} style={{ marginBottom: 32 }}>
//         Your Journey Progress
//       </Title>

//       <Steps
//   current={currentStep}
//   labelPlacement="vertical"
//   items={stepsConfig.map((step, index) => ({
//     status: getStepStatus(step.key),
//     title: (
//       <Tooltip title={step.title}>
//         <span
//           style={{
//             cursor: index <= currentStep ? "pointer" : "not-allowed",
//             opacity: index <= currentStep ? 1 : 0.5,
//             fontWeight: 500,
//           }}
//           onClick={() => {
//             if (index <= currentStep) {
//               navigate(step.path);
//             }
//           }}
//         >
//           {step.title}
//         </span>
//       </Tooltip>
//     ),
//   }))}
// />
//     </Card>
//   );
// };

// export default JourneySteps;