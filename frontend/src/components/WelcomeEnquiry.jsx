import React, { useEffect, useState } from "react";
import { Row, Col, Card, Typography, Spin, Empty, Modal } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchPrograms } from "../adminSlices/programSlice";
import { fetchPackagesByProgram } from "../adminSlices/packageSlice";
import { useLocation, useNavigate } from "react-router-dom";

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
} from "@ant-design/icons";

const { Title } = Typography;

// ICON MAP
const programIconColorMap = {
  Engineering: { icon: <ToolOutlined />, color: "#4B7CF3" },
  "OCI/NRI/CIWG/PIO Engineering": { icon: <GlobalOutlined />, color: "#3F51B5" },
  Medical: { icon: <MedicineBoxOutlined />, color: "#F44336" },
  Law: { icon: <BankOutlined />, color: "#FFC107" },
  "Design & Architecture": { icon: <SketchOutlined />, color: "#9C27B0" },
  Commerce: { icon: <StockOutlined />, color: "#4CAF50" },
  Arts: { icon: <ReadOutlined />, color: "#E91E63" },
  "Commerce (BBA & MBA)": { icon: <UsergroupAddOutlined />, color: "#FF9800" },
  "11th Admission": { icon: <FileTextOutlined />, color: "#795548" },
  "8-12 Aptitude Test": { icon: <CheckCircleOutlined />, color: "#00BCD4" },
  "PG Counselling": { icon: <ApartmentOutlined />, color: "#607D8B" },
  "Abroad Counselling": { icon: <GlobalOutlined />, color: "#009688" },
  "Admission Counselling": { icon: <HeartOutlined />, color: "#E91E63" },
  Others: { icon: <ToolOutlined />, color: "#9E9E9E" },
};

const WelcomeEnquiry = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const from = location.state?.from;

  const { list: programs, loading: programLoading } = useSelector(
    (state) => state.programs
  );

  const { list: packages, loading: packageLoading } = useSelector(
    (state) => state.packages
  );

  const [activeProgramId, setActiveProgramId] = useState(null);
  const [activeProgramName, setActiveProgramName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchPrograms());
  }, [dispatch]);

  const handleProgramClick = (program) => {
    setActiveProgramId(program.id);
    setActiveProgramName(program.name);
    dispatch(fetchPackagesByProgram(program.id));
    setIsModalOpen(true);
  };

  const serviceRouteMap = {
    "Engineering-Paid Whatsapp Group":
      "/engineering-paid-group-service",

    "Engineering-Admission Counselling":
      "/admission-counselling",

    "Engineering-OCI/NRI/CIWG/PIO Paid Whatsapp Group":
      "/engineering-oci-nri-paid-group-service",

    // "Engineering-OCI/NRI/CIWG/PIO Engineering Admission End-to-End Guidance":
    //   "/oci-nri-end-to-end-counselling",

    "Engineering-CET-Engineering Admission One-on-One Guidance":
      "/cet-one-on-one-guidance",

    "Engineering-JEE-Engineering Admission One-on-One Guidance":
      "/jee-one-on-one-guidance",

    "Medical-Paid Whatsapp Group":
      "/medical-paid-group-service",

    "Medical-End to End Medical Counselling":
      "/medical-end-to-end-counselling",

    "Law-Paid Whatsapp Group":
      "/law-service",

    "11th Admission-Free Whatsapp Group":
      "/11th-admission-free-group-service",

    "Abroad Counselling-Expert Abroad Counselling Service":
      "/abroad-counselling-service",

    // "Admission Counselling-Expert Engineering Online Session":
    //   "/admission-counselling-service",

    "Commerce (BBA  & MBA)-Paid Whatsapp Group":
      "/bba-paid-group-service",

    "Hand Holding Program-Hand Holding":
      "/handholding-program-service",

    "Design & Architecture-Paid Whatsapp Group":
      "/design-arch-paid-group-service",

    "Aptitude Test Counselling-Aptitude Test For 8th-9th std":
      "/8-9-aptitude-service",

    "Aptitude Test Counselling-Aptitude Test Of 10th STD":
      "/10th-aptitude-service",

    "Aptitude Test Counselling-Aptitude Test Of 11th-12th STD":
      "/11-12-aptitude-service",

        "Aptitude Test Counselling-PG Counselling":
      "/pg-counselling-service",


    "Seminar / Webinar-Seminar / Webinar":
      "/seminar-webinar-session",

  };

  return (
    <div style={{ padding: "20px", background: "#f4f7fb", minHeight: "auto" }}>
      {/* TITLE */}
      <Title
        level={3}
        style={{
          textAlign: "center",
          marginBottom: "25px",
          fontWeight: 700,
        }}
      >
        Choose Your Program
      </Title>

      {/* PROGRAM GRID */}
      {/* PROGRAM GRID */}
      {programLoading ? (
        <div style={{ textAlign: "center" }}>
          <Spin />
        </div>
      ) : programs.length === 0 ? (
        <Empty description="No Programs Found" />
      ) : (
        <Row
          gutter={[24, 24]}
          justify="center"
          style={{
            maxWidth: 1320,
            margin: "0 auto",
          }}
        >
          {programs.map((program) => {
            const iconData =
              programIconColorMap[program.name?.trim()] ||
              programIconColorMap["Others"];

            return (
              <Col
                xs={24}
                sm={12}
                lg={6}
                key={program.id}
                style={{ display: "flex" }}
              >
                <Card
                  hoverable
                  onClick={() => handleProgramClick(program)}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 28,
                    overflow: "hidden",
                    cursor: "pointer",
                    border: "1px solid #E5E7EB",
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(14px)",
                    boxShadow: "0 12px 35px rgba(15,23,42,0.08)",
                    transition: "all 0.35s ease",
                    minHeight: 380,
                    position: "relative",
                  }}
                  bodyStyle={{
                    padding: "30px 26px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow =
                      "0 18px 40px rgba(15,23,42,0.14)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 35px rgba(15,23,42,0.08)";
                  }}
                >
                  {/* TOP DECORATION */}
                  <div
                    style={{
                      position: "absolute",
                      top: -45,
                      right: -45,
                      width: 130,
                      height: 130,
                      borderRadius: "50%",
                      background: `${iconData.color}12`,
                    }}
                  />

                  {/* ICON */}
                  <div
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: 28,
                      background: `${iconData.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 38,
                      color: iconData.color,
                      marginBottom: 26,
                      boxShadow: `0 10px 24px ${iconData.color}20`,
                    }}
                  >
                    {iconData.icon}
                  </div>

                  {/* PROGRAM NAME */}
                  <Title
                    level={3}
                    style={{
                      margin: 0,
                      fontWeight: 750,
                      color: "#111827",
                      fontSize: 20,
                      lineHeight: 1.3,
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                      minHeight: "auto",
                      maxHeight: 100,
                      overflow: "hidden",
                    }}
                  >
                    {program.name}
                  </Title>

                  {/* SUBTEXT */}
                  <div
                    style={{
                      marginTop: 12,
                      marginBottom: "auto",
                      color: "#6B7280",
                      fontSize: 15,
                      lineHeight: 1.6,
                      minHeight: 48,
                      paddingBottom: 16,
                    }}
                  >
                    Explore counselling services and admission guidance
                    for {program.name}.
                  </div>

                  {/* FOOTER */}
                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: 16,
                      borderTop: "1px solid #E5E7EB",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: iconData.color,
                        fontSize: 15,
                      }}
                    >
                      View Services
                    </span>

                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: iconData.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 16,
                        boxShadow: `0 10px 22px ${iconData.color}40`,
                      }}
                    >
                      →
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}


      {/* MODAL FOR PACKAGES */}
      <Modal
        title={
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {activeProgramName} Services
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        width={900}
        styles={{
          body: {
            paddingTop: 10,
            background:
              "linear-gradient(180deg, #F8FAFC 0%, #EEF4FF 100%)",
            borderRadius: 20,
          },
        }}
      >
        {packageLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : packages.length === 0 ? (
          <Empty description="No services found" />
        ) : (
          <Row gutter={[24, 24]} align="stretch">
            {packages.map((pkg) => (
              <Col xs={24} md={12} key={pkg.id} style={{ display: "flex" }}>
                <Card
                  hoverable
                  // onClick={() => {
                  //   navigate("/counselling-service", {
                  //     state: {
                  //       fromWelcomePage: true,
                  //       programId: activeProgramId,
                  //       programName: activeProgramName,
                  //       packageId: pkg.id,
                  //       packageName: pkg.name,
                  //       isAptitude: pkg.aptitude_test,
                  //     },
                  //   });
                  // }}
                  onClick={() => {
                    const routeKey = `${activeProgramName}-${pkg.name}`;

                    navigate(
                      serviceRouteMap[routeKey] || "/default"
                    );
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 24,
                    overflow: "hidden",
                    border: "1px solid #E5E7EB",
                    background:
                      "linear-gradient(180deg, #FFFFFF, #F9FBFF)",
                    boxShadow: "0 10px 28px rgba(15,23,42,0.08)",
                    transition: "all 0.35s ease",
                    cursor: "pointer",
                    position: "relative",
                    minHeight: 260,
                  }}
                  bodyStyle={{
                    padding: "26px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow =
                      "0 18px 36px rgba(15,23,42,0.14)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 28px rgba(15,23,42,0.08)";
                  }}
                >
                  {/* TOP BADGE */}
                  <div
                    style={{
                      position: "absolute",
                      top: 18,
                      right: 18,
                      background: "#DBEAFE",
                      color: "#1E40AF",
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Service
                  </div>

                  {/* ICON */}
                  <div
                    style={{
                      position: "relative",
                      width: 78,
                      height: 78,
                      marginBottom: 22,
                    }}
                  >
                    {/* OUTER GLOW */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "24px",
                        background:
                          "linear-gradient(135deg, #1E40AF, #3B82F6)",
                        opacity: 0.12,
                        transform: "rotate(-8deg)",
                      }}
                    />

                    {/* MAIN ICON BOX */}
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "24px",
                        background:
                          "linear-gradient(135deg, #1E40AF, #2563EB)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 34,
                        position: "relative",
                        boxShadow:
                          "0 14px 30px rgba(30,64,175,0.28)",
                      }}
                    >
                      🚀
                    </div>
                  </div>

                  {/* PACKAGE NAME */}
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 750,
                      color: "#111827",
                      lineHeight: 1.3,
                      marginBottom: 10,
                    }}
                  >
                    {pkg.name}
                  </div>

                  {/* DESCRIPTION */}
                  {/* <div
              style={{
                fontSize: 14,
                color: "#6B7280",
                lineHeight: 1.7,
                marginBottom: 18,
              }}
            >
              Personalized counselling and expert guidance
              designed to help students achieve their academic
              goals.
            </div> */}

                  {/* PRICE */}
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: "#1E40AF",
                      marginBottom: 18,
                    }}
                  >
                    ₹ {pkg.price}
                  </div>

                  {/* FEATURES */}
                  {pkg.features && pkg.features.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#111827",
                          marginBottom: 10,
                        }}
                      >
                        Included Features
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {pkg.features
                          .slice(0, 4)
                          .map((feature) => (
                            <div
                              key={feature.id}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                fontSize: 13,
                                color: "#4B5563",
                                lineHeight: 1.5,
                              }}
                            >
                              <div
                                style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: "50%",
                                  background: "#b9fed1", // light green background
                                  color: "#16A34A", // green tick color
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 11,
                                  flexShrink: 0,
                                  marginTop: 1,
                                  fontWeight: 700,
                                  boxShadow: "0 4px 10px rgba(22,163,74,0.18)",
                                }}
                              >
                                ✓
                              </div>

                              <span>
                                {feature.description}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* FOOTER */}
                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: 18,
                      borderTop: "1px solid #E5E7EB",
                    }}
                  >
                    <span
                      style={{
                        color: "#1E40AF",
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      Continue
                    </span>

                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        background: "#1E40AF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 16,
                        boxShadow:
                          "0 10px 20px rgba(30,64,175,0.28)",
                      }}
                    >
                      →
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Modal>
    </div>
  );
};

export default WelcomeEnquiry;
