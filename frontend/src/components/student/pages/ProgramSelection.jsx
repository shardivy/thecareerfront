import React, { useEffect } from "react";
import { Row, Col, Card, Typography } from "antd";
import {
  ToolOutlined,
  GlobalOutlined,
  MedicineBoxOutlined,
  BankOutlined,
  SketchOutlined,
  StockOutlined,
  ReadOutlined,
  UsergroupAddOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ApartmentOutlined,
  HeartOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import adminTheme from "../../../theme/adminTheme";
import { useDispatch } from "react-redux";
import { setSelection } from "../../../adminSlices/studentSelectionSlice";
import { clearCollegeAnalysisDraft } from "../../../adminSlices/collegeAnalysisSlice";

const { Title, Text } = Typography;

/* Program Icons & Colors */
const programIconColorMap = {
  Engineering: {
    icon: <ToolOutlined />,
    color: "#4B7CF3",
  },
  "OCI/NRI/CIWG/PIO Engineering": {
    icon: <GlobalOutlined />,
    color: "#3F51B5",
  },
  Medical: {
    icon: <MedicineBoxOutlined />,
    color: "#F44336",
  },
  Law: {
    icon: <BankOutlined />,
    color: "#FFC107",
  },
  "Design & Architecture": {
    icon: <SketchOutlined />,
    color: "#9C27B0",
  },
  Commerce: {
    icon: <StockOutlined />,
    color: "#4CAF50",
  },
  Arts: {
    icon: <ReadOutlined />,
    color: "#E91E63",
  },
  BBA: {
    icon: <UsergroupAddOutlined />,
    color: "#FF9800",
  },
  "11th Admission": {
    icon: <FileTextOutlined />,
    color: "#795548",
  },
  "Aptitude Test Counselling": {
    icon: <CheckCircleOutlined />,
    color: "#00BCD4",
  },
  "PG Counselling": {
    icon: <ApartmentOutlined />,
    color: "#607D8B",
  },
  "Abroad Counselling": {
    icon: <GlobalOutlined />,
    color: "#009688",
  },
  "Admission Counselling": {
    icon: <HeartOutlined />,
    color: "#E91E63",
  },
};

const defaultProgramIconColor = {
  icon: <ToolOutlined />,
  color: "#9E9E9E",
};

const ProgramSelection = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const programs = JSON.parse(localStorage.getItem("programPackages") || "[]") || [];

  useEffect(() => {
    if (programs.length === 1) {
      const [onlyProgram] = programs;
      dispatch(
        setSelection({
          programId: onlyProgram.program_id,
          programName: onlyProgram.program_name,
          packageId: onlyProgram.package_id,
          packageName: onlyProgram.package_name,
        })
      );

      localStorage.setItem("selectedProgramId", onlyProgram.program_id);
      localStorage.setItem("selectedProgram", onlyProgram.program_name);
      localStorage.setItem("selectedPackageId", onlyProgram.package_id);
      localStorage.setItem("selectedPackage", onlyProgram.package_name);

      navigate("/student/student-profile");
    }
  }, [dispatch, navigate, programs]);

  const handleSelectProgram = (item) => {
    // Clear old program-specific Redux data
    dispatch(clearCollegeAnalysisDraft());
    // Redux
    dispatch(
      setSelection({
        programId: item.program_id,
        programName: item.program_name,
        packageId: item.package_id,
        packageName: item.package_name,
      })
    );

    // LocalStorage
    localStorage.setItem("selectedProgramId", item.program_id);
    localStorage.setItem("selectedProgram", item.program_name);

    localStorage.setItem("selectedPackageId", item.package_id);
    localStorage.setItem("selectedPackage", item.package_name);

    navigate("/student/dashboard");
  };

  //   const handleSelectProgram = (item) => {
  //     localStorage.setItem("selectedProgramId", item.program_id);
  //     localStorage.setItem("selectedProgram", item.program_name);

  //     localStorage.setItem("selectedPackageId", item.package_id);
  //     localStorage.setItem("selectedPackage", item.package_name);
  // console.log("Selected Item:", item);
  //     navigate("/student/student-profile");
  //   };

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
      {/* Header */}
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

      {/* Program Cards */}
      <Row
        gutter={[24, 24]}
        justify="center"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {programs.map((item, index) => {
          const programConfig =
            programIconColorMap[item.program_name] ||
            defaultProgramIconColor;

          return (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card
                hoverable
                onClick={() => handleSelectProgram(item)}
                style={{
                  borderRadius: 28,
                  overflow: "hidden",
                  cursor: "pointer",
                  border: `1px solid ${adminTheme.token.colorBorder}`,
                  background: "rgba(255,255,255,0.92)",
                  backdropFilter: "blur(14px)",
                  boxShadow: "0 12px 35px rgba(15,23,42,0.08)",
                  transition: "all 0.35s ease",
                  height: 290,
                  position: "relative",
                }}
                bodyStyle={{
                  padding: "30px 26px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Glow Effect */}
                <div
                  style={{
                    position: "absolute",
                    top: -40,
                    right: -40,
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: `${programConfig.color}15`,
                  }}
                />

                {/* Icon */}
                <div
                  style={{
                    width: 86,
                    height: 86,
                    borderRadius: 24,
                    background: `${programConfig.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: programConfig.color,
                    fontSize: 38,
                    marginBottom: 24,
                    boxShadow: `0 10px 25px ${programConfig.color}20`,
                  }}
                >
                  {programConfig.icon}
                </div>

                {/* Program Name */}
                <Title
                  level={3}
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: 24,
                    color: adminTheme.token.colorTextBase,
                  }}
                >
                  {item.program_name}
                </Title>

                {/* Package Name */}
                <Text
                  style={{
                    marginTop: 10,
                    color: adminTheme.token.colorTextSecondary,
                    fontSize: 15,
                    lineHeight: 1.7,
                  }}
                >
                  {item.package_name}
                </Text>

                {/* Footer */}
                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 20,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: 600,
                      color: programConfig.color,
                      fontSize: 15,
                    }}
                  >
                    Continue
                  </Text>

                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: programConfig.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 16,
                      boxShadow: `0 8px 18px ${programConfig.color}55`,
                    }}
                  >
                    <ArrowRightOutlined />
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default ProgramSelection;


// import React from "react";
// import { Row, Col, Card, Typography } from "antd";
// import {
//   RocketOutlined,
//   BankOutlined,
//   ArrowRightOutlined,
// } from "@ant-design/icons";
// import { useNavigate } from "react-router-dom";

// import adminTheme from "../../../theme/adminTheme";

// const { Title, Text } = Typography;

// const programs =
//   JSON.parse(localStorage.getItem("programPackages")) || [];

// const ProgramSelection = () => {
//   const navigate = useNavigate();

// const handleSelectProgram = (item) => {
//   localStorage.setItem("selectedProgramId", item.program_id);
//   localStorage.setItem("selectedProgram", item.program_name);

//   localStorage.setItem("selectedPackageId", item.package_id);
//   localStorage.setItem("selectedPackage", item.package_name);

//   navigate("/student/student-profile");
// };

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: `
//           radial-gradient(circle at top right, rgba(99,102,241,0.12), transparent 28%),
//           radial-gradient(circle at bottom left, rgba(59,130,246,0.10), transparent 25%),
//           ${adminTheme.token.colorBgLayout}
//         `,
//         padding: "40px 18px",
//       }}
//     >
//       {/* HEADER */}
//       <div
//         style={{
//           textAlign: "center",
//           marginBottom: 40,
//           maxWidth: 700,
//           marginInline: "auto",
//         }}
//       >
//         <div
//           style={{
//             display: "inline-block",
//             padding: "8px 18px",
//             borderRadius: 999,
//             background: "rgba(30,64,175,0.08)",
//             color: adminTheme.token.colorPrimary,
//             fontWeight: 600,
//             marginBottom: 16,
//             fontSize: 14,
//           }}
//         >
//           Student Portal
//         </div>

//         <Title
//           level={1}
//           style={{
//             margin: 0,
//             fontWeight: 800,
//             color: adminTheme.token.colorTextBase,
//             fontSize: "clamp(32px, 5vw, 52px)",
//             lineHeight: 1.1,
//           }}
//         >
//           Choose Your Program
//         </Title>

//         <Text
//           style={{
//             display: "block",
//             marginTop: 16,
//             fontSize: 17,
//             color: adminTheme.token.colorTextSecondary,
//             lineHeight: 1.7,
//           }}
//         >
//           Select your preferred program and counselling service to continue
//   your personalized academic and career journey.
//         </Text>
//       </div>

//       {/* PROGRAM CARDS */}
//       <Row
//         gutter={[24, 24]}
//         justify="center"
//         style={{
//           maxWidth: 1050,
//           margin: "0 auto",
//         }}
//       >
//         {programs.map((item) => (
//           <Col xs={24} sm={12} md={8} key={item.id}>
//             <Card
//               hoverable
//               onClick={() => handleSelectProgram(item)}
//               style={{
//                 borderRadius: 28,
//                 overflow: "hidden",
//                 cursor: "pointer",
//                 border: `1px solid ${adminTheme.token.colorBorder}`,
//                 background: "rgba(255,255,255,0.9)",
//                 backdropFilter: "blur(14px)",
//                 boxShadow: "0 12px 35px rgba(15,23,42,0.08)",
//                 transition: "all 0.35s ease",
//                 height: 280,
//                 position: "relative",
//               }}
//               bodyStyle={{
//                 padding: "30px 26px",
//                 height: "100%",
//                 display: "flex",
//                 flexDirection: "column",
//               }}
//             >
//               {/* TOP GLOW */}
//               <div
//                 style={{
//                   position: "absolute",
//                   top: -40,
//                   right: -40,
//                   width: 120,
//                   height: 120,
//                   borderRadius: "50%",
//                   background: "rgba(99,102,241,0.08)",
//                 }}
//               />

//               {/* ICON */}
//               <div
//                 style={{
//                   width: 86,
//                   height: 86,
//                   borderRadius: 26,
//                   background: item.iconBg,
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   fontSize: 36,
//                   color: item.iconColor,
//                   marginBottom: 26,
//                   boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
//                 }}
//               >
//                 {item.icon}
//               </div>

//               {/* PROGRAM */}
//               <Title
//                 level={3}
//                 style={{
//                   margin: 0,
//                   fontWeight: 750,
//                   color: adminTheme.token.colorTextBase,
//                   fontSize: 28,
//                 }}
//               >
//                 {item.program_name}
//               </Title>

//               {/* SERVICE */}
//               <Text
//                 style={{
//                   marginTop: 10,
//                   color: adminTheme.token.colorTextSecondary,
//                   fontSize: 16,
//                   lineHeight: 1.7,
//                   display: "block",
//                 }}
//               >
//                   {item.package_name}
//               </Text>

//               {/* BOTTOM BUTTON */}
//               <div
//                 style={{
//                   marginTop: "auto",
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                   paddingTop: 24,
//                 }}
//               >
//                 <Text
//                   style={{
//                     fontWeight: 600,
//                     color: adminTheme.token.colorPrimary,
//                     fontSize: 15,
//                   }}
//                 >
//                   Continue
//                 </Text>

//                 <div
//                   style={{
//                     width: 42,
//                     height: 42,
//                     borderRadius: "50%",
//                     background: adminTheme.token.colorPrimary,
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     color: "#fff",
//                     fontSize: 16,
//                     boxShadow: "0 8px 18px rgba(30,64,175,0.35)",
//                   }}
//                 >
//                   <ArrowRightOutlined />
//                 </div>
//               </div>
//             </Card>
//           </Col>
//         ))}
//       </Row>
//     </div>
//   );
// };

// export default ProgramSelection;