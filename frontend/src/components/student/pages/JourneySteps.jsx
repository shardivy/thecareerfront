import React from "react";
import { Card, Steps, Typography, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const Journeysteps = ({ currentStep = 1 }) => {
  const navigate = useNavigate();

  const stepsConfig = [
    {
      title: "Registration",
      tooltip: "Complete your basic registration details",
      path: "/register",
    },
    {
      title: "Package Selection",
      tooltip: "Choose your preferred career package",
      path: "/student/program",
    },
    {
      title: "Payment",
      tooltip: "Complete payment to proceed",
      // path: "/student/payment",
    },
    {
      title: "Exam",
      tooltip: "Appear for the assessment exam",
      path: "/student/exam-management",
    },
    {
      title: "Counselling",
      tooltip: "Attend expert counselling session",
      path: "/student/slot-booking",
    },
    {
      title: "Review",
      tooltip: "Submit your feedback and review",
      path: "/student/report-management",
    },
    {
      title: "Report",
      tooltip: "View and download your career report",
      path: "/student/report-management",
    },
    {
      title: "Full Access",
      tooltip: "Get complete access to all resources",
      path: "/student/dashboard",
    },
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
        items={stepsConfig.map((step) => ({
          title: (
            <Tooltip title={step.tooltip} placement="top">
              <span
                style={{
                  color: "#0F172A",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
                onClick={() => navigate(step.path)}
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

export default Journeysteps;



// import React from "react";
// import { Card, Steps, Typography, Tooltip } from "antd";
// import { useNavigate } from "react-router-dom";

// const { Title } = Typography;

// const Journeysteps = ({ currentStep = 1 }) => {
//   const navigate = useNavigate();

//   const stepsConfig = [
//     {
//       title: "Registration",
//       tooltip: "Complete your basic registration details",
//       path: "/registration",
//     },
//     {
//       title: "Package Selection",
//       tooltip: "Choose your preferred career package",
//       path: "/packages",
//     },
//     {
//       title: "Payment",
//       tooltip: "Complete payment to proceed",
//       path: "/payment",
//     },
//     {
//       title: "Exam",
//       tooltip: "Appear for the assessment exam",
//       path: "/exam",
//     },
//     {
//       title: "Counselling",
//       tooltip: "Attend expert counselling session",
//       path: "/counselling",
//     },
//     {
//       title: "Review",
//       tooltip: "Submit your feedback and review",
//       path: "/review",
//     },
//     {
//       title: "Report",
//       tooltip: "View and download your career report",
//       path: "/report",
//     },
//     {
//       title: "Full Access",
//       tooltip: "Get complete access to all resources",
//       path: "/dashboard",
//     },
//   ];

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
//         current={currentStep}
//         labelPlacement="vertical"
//         items={stepsConfig.map((step, index) => ({
//           title: (
//             <Tooltip title={step.tooltip} placement="top">
//               <span
//                 style={{
//                   color: "#0F172A",
//                   cursor: index < currentStep ? "pointer" : "not-allowed",
//                   fontWeight: 500,
//                   opacity: index < currentStep ? 1 : 0.5, // dim unclickable steps
//                 }}
//                 onClick={() => {
//                   if (index < currentStep) navigate(step.path);
//                 }}
//               >
//                 {step.title}
//               </span>
//             </Tooltip>
//           ),
//         }))}
//       />
//     </Card>
//   );
// };

// export default Journeysteps;
