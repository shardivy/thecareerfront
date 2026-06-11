import React, { useState, useEffect, useRef } from "react";
import { Card, Row, Col, Typography, Button, Grid, Spin, Empty } from "antd";
import {
  ToolOutlined,
  MedicineBoxOutlined,
  SketchOutlined,
  StockOutlined,
  ReadOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  HeartOutlined,
  GlobalOutlined,
  FileTextOutlined,
  UsergroupAddOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import antdTheme from "../../../theme/antdTheme";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchActivePrograms } from "../../../adminSlices/programSlice";
import { fetchPackagesByProgram, clearPackages } from "../../../adminSlices/packageSlice";
import { setSelection } from "../../../adminSlices/studentSelectionSlice";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { token } = antdTheme;

export const programIconColorMap = {
  Engineering: { icon: <ToolOutlined />, color: "#4B7CF3" },
  "OCI/NRI/CIWG/PIO Engineering": { icon: <ApartmentOutlined />, color: "#3F51B5" },
  Medical: { icon: <MedicineBoxOutlined />, color: "#F44336" },
  Law: { icon: <BankOutlined />, color: "#FFC107" },
  "Design & Architecture": { icon: <SketchOutlined />, color: "#9C27B0" },
  Commerce: { icon: <StockOutlined />, color: "#4CAF50" },
  Arts: { icon: <HeartOutlined />, color: "#E91E63" },
  BBA: { icon: <FileTextOutlined />, color: "#FF9800" },
  "11th Admission": { icon: <ReadOutlined />, color: "#795548" },
  "8-12 Aptitude Test": { icon: <UsergroupAddOutlined />, color: "#00BCD4" },
  "PG Counselling": { icon: <GlobalOutlined />, color: "#607D8B" },
  "Abroad Counselling": { icon: <GlobalOutlined />, color: "#009688" },
  "Admission Counselling": { icon: <HeartOutlined />, color: "#E91E63" },
  Others: { icon: <FileTextOutlined />, color: "#9E9E9E" },
};

export const defaultProgramIconColor = {
  icon: <FileTextOutlined />,
  color: "#9E9E9E",
};

const Program = () => {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const programScrollRef = useRef(null);

  const scrollLeft = () => {
    if (programScrollRef.current) {
      programScrollRef.current.scrollBy({ left: -250, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (programScrollRef.current) {
      programScrollRef.current.scrollBy({ left: 250, behavior: "smooth" });
    }
  };

  const navigate = useNavigate();
  const screens = useBreakpoint();
  const dispatch = useDispatch();

  const { activeList: programsList, loading } = useSelector((state) => state.programs);
  const { list: packageList, loading: packageLoading } = useSelector((state) => state.packages);
  const profile = useSelector((state) => state.profile?.profile);

  const selectedProgramRedux = useSelector((state) => state.studentSelection?.selectedProgram);
  const selectedPackageRedux = useSelector((state) => state.studentSelection?.selectedPackage);
  const selectedPackageIdRedux = useSelector((state) => state.studentSelection?.selectedPackageId);

  const selectedProgramFromStorage =
    selectedProgramRedux || localStorage.getItem("selectedProgram");

  const selectedProgramIdFromStorage =
    useSelector((state) => state.studentSelection?.selectedProgramId) ||
    Number(localStorage.getItem("selectedProgramId"));

  const selectedPackageIdFromStorage =
    selectedPackageIdRedux || Number(localStorage.getItem("selectedPackageId"));

  const selectedPackageFromStorage =
    selectedPackageRedux || localStorage.getItem("selectedPackage");

  // Check if user is free/basic
  const isFreeUser =
    profile?.student_id == null || profile?.role === "basic_user";

  // console.log(
  //   "Profile Data:",
  //   isFreeUser ? "Free/Basic User" : "Logged-in Student",
  //   profile
  // );

  const finalProgram = selectedProgram || selectedProgramFromStorage;
  // console.log("Final Program:", finalProgram);

  // ================= FETCH PROGRAMS =================
  useEffect(() => {
    dispatch(fetchActivePrograms());
  }, [dispatch]);

  // ================= LOAD SELECTED PROGRAM FROM LOCALSTORAGE =================
  useEffect(() => {
    const savedProgram = localStorage.getItem("selectedProgram");
    if (programsList.length && savedProgram) {
      setSelectedProgram(savedProgram);
      const selected = programsList.find((p) => p.name === savedProgram);
      if (selected?.id) {
        dispatch(fetchPackagesByProgram(selected.id));
      }
    }
  }, [programsList, dispatch]);

  // ================= SAVE SELECTED PROGRAM =================
  const handleProgramSelect = (programTitle) => {
    setSelectedProgram(programTitle);
    localStorage.setItem("selectedProgram", programTitle);
    dispatch(clearPackages());
    const selected = programsList.find((p) => p.name === programTitle);
    if (selected?.id) dispatch(fetchPackagesByProgram(selected.id));
  };

  const serviceRouteMap = {
    "Engineering-Paid Whatsapp Group": "/engineering-paid-group-service",
    "Engineering-Admission Counselling": "/admission-counselling",
    "Engineering-OCI/NRI/CIWG/PIO Paid Whatsapp Group": "/engineering-oci-nri-paid-group-service",
    "Engineering-CET-Engineering Admission One-on-One Guidance": "/cet-one-on-one-guidance",
    "Engineering-JEE-Engineering Admission One-on-One Guidance": "/jee-one-on-one-guidance",
    "Medical-Paid Whatsapp Group": "/medical-paid-group-service",
    "Medical-End to End Medical Counselling": "/medical-end-to-end-counselling",
    "Law-Paid Whatsapp Group": "/law-service",
    "11th Admission-Free Whatsapp Group": "/11th-admission-free-group-service",
    "Abroad Counselling-Expert Abroad Counselling Service": "/abroad-counselling-service",
    "Commerce (BBA  & MBA)-Paid Whatsapp Group": "/bba-paid-group-service",
    "Hand Holding Program-Hand Holding": "/handholding-program-service",
    "Design & Architecture-Paid Whatsapp Group": "/design-arch-paid-group-service",
    "Aptitude Test Counselling-Aptitude Test For 8th-9th std": "/8-9-aptitude-service",
    "Aptitude Test Counselling-Aptitude Test Of 10th STD": "/10th-aptitude-service",
    "Aptitude Test Counselling-Aptitude Test Of 11th-12th STD": "/11-12-aptitude-service",
    "Aptitude Test Counselling-PG Counselling": "/pg-counselling-service",
    "Seminar / Webinar-Seminar / Webinar": "/seminar-webinar-session",
  };

  const eleventhAdmissionWhatsappLink = "https://chat.whatsapp.com/HwiCs0qVJBe91abE42SpDz";
  const isEleventhAdmissionProgram = finalProgram === "11th Admission";

  // ================= FREE CONTENT CARD =================
  const FreeContentCard = () => (
    <Card
      style={{
        marginTop: 24,
        borderRadius: 16,
        border: `1px solid ${token.colorBgContainer}`,
        background: "linear-gradient(135deg, #F0FFF4 0%, #ECFDF5 100%)",
        boxShadow: token.boxShadow,
      }}
      bodyStyle={{ padding: screens.xs ? 16 : 20 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: screens.xs ? 12 : 16,
          flexWrap: "wrap",
          flexDirection: screens.xs ? "column" : "row",
        }}
      >
        <div
          style={{
            width: screens.xs ? 48 : 64,
            height: screens.xs ? 48 : 64,
            borderRadius: 14,
            backgroundColor: "#52B788",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ReadOutlined style={{ fontSize: screens.xs ? 20 : 28, color: "#ffffff" }} />
        </div>
        <div style={{ flex: 1, minWidth: screens.xs ? "100%" : 200 }}>
          <Title
            level={screens.xs ? 5 : 4}
            style={{ marginBottom: 6, color: "#52B788", fontSize: screens.xs ? "16px" : "20px" }}
          >
            Content Available
          </Title>
          <Text
            style={{
              color: token.colorTextSecondary,
              display: "block",
              fontSize: screens.xs ? 14 : 16,
            }}
          >
            Browse curated guides, sample tests, videos and case studies that help you explore
            careers and prepare for exams. No payment required.
          </Text>
          <div style={{ marginTop: 16 }}>
            <Button
              type="default"
              icon={<ReadOutlined />}
              onClick={() => navigate("/student/content-library")}
              size={screens.xs ? "small" : "middle"}
            >
              Browse Content
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  // ================= DISPLAY PROGRAMS =================
  const displayedPrograms =
    !isFreeUser && profile?.program
      ? programsList.filter((p) => p.name === profile.program)
      : programsList;

  const apiPrograms = displayedPrograms.map((p) => {
    const map = programIconColorMap[p.name] || defaultProgramIconColor;
    return { id: p.id, title: p.name, icon: map.icon, color: map.color };
  });

  const titleText =
    !isFreeUser && profile?.program
      ? "Your Selected Counselling Program"
      : "Choose Your Career Path";

  // ================= FREE / BASIC USER SECTION =================
  if (isFreeUser) {
    return (
      <div
        style={{
          padding: screens.xs ? "20px 16px" : "20px 20px",
          maxWidth: "1200px",
          margin: "0 auto",
          fontFamily: token.fontFamily,
        }}
      >
        {loading ? (
          <div
            style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}
          >
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Welcome Banner */}
            <Card
              style={{
                marginBottom: 30,
                borderRadius: 16,
                background: "linear-gradient(90deg, #1E40AF 0%, #6b85db 100%)",
                color: "#fff",
              }}
            >
              <div style={{ textAlign: "center", padding: screens.xs ? 20 : 30 }}>
                <Title level={screens.xs ? 3 : 2} style={{ color: "#fff", marginBottom: 10 }}>
                  Welcome to Career Counselling
                </Title>
                <Text style={{ color: "#fff", fontSize: screens.xs ? 14 : 16, display: "block" }}>
                  Explore our programs and services.
                </Text>
              </div>
            </Card>

            {/* Title */}
            <Title
              level={screens.xs ? 3 : 2}
              style={{ textAlign: "center", marginBottom: screens.xs ? 20 : 30 }}
            >
              {titleText}
            </Title>

            {/* Program Slider */}
            <div
              style={{
                position: "relative",
                marginBottom: 30,
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                onClick={scrollLeft}
                style={{
                  cursor: "pointer",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0,0,0,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <ArrowLeftOutlined />
              </div>

              <div
                ref={programScrollRef}
                style={{
                  display: "flex",
                  gap: screens.xs ? 12 : 16,
                  overflowX: screens.xs ? "auto" : "hidden",
                  flex: 1,
                  scrollbarWidth: "thin",
                  msOverflowStyle: "auto",
                  padding: "4px 0",
                }}
              >
                {programsList.map((program) => {
                  const { icon, color } =
                    programIconColorMap[program.name] || defaultProgramIconColor;
                  return (
                    <Card
                      key={program.id}
                      hoverable
                      onClick={() => handleProgramSelect(program.name)}
                      style={{
                        minWidth: screens.xs ? 140 : 180,
                        borderRadius: 12,
                        border:
                          finalProgram === program.name
                            ? `2px solid ${color}`
                            : "1px solid #f0f0f0",
                        transition: "all 0.3s ease",
                      }}
                      bodyStyle={{ padding: screens.xs ? 12 : 16 }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{ fontSize: screens.xs ? 24 : 32, color: color, marginBottom: 8 }}
                        >
                          {icon}
                        </div>
                        <Text strong style={{ fontSize: screens.xs ? 12 : 14 }}>
                          {program.name}
                        </Text>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div
                onClick={scrollRight}
                style={{
                  cursor: "pointer",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0,0,0,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 10,
                }}
              >
                <ArrowRightOutlined />
              </div>
            </div>

            {!finalProgram && <FreeContentCard />}

            {finalProgram && (
              <div>
                <Title
                  level={screens.xs ? 4 : 3}
                  style={{ textAlign: "center", marginBottom: screens.xs ? 20 : 30 }}
                >
                  {finalProgram} - Available Services
                </Title>

                <Row gutter={[screens.xs ? 16 : 24, screens.xs ? 16 : 24]} justify="center">
                  {packageLoading ? (
                    <div style={{ textAlign: "center", marginTop: 40 }}>
                      <Spin size="large" />
                    </div>
                  ) : packageList.length > 0 ? (
                    packageList.map((pkg) => (
                      <Col xs={24} sm={12} md={8} key={pkg.id}>
                        <Card
                          style={{
                            borderRadius: 12,
                            position: "relative",
                            height: "100%",
                            boxShadow: token.boxShadow,
                            border: pkg.is_popular
                              ? `2px solid ${token.colorPrimary}`
                              : "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: screens.xs ? 16 : 24 }}
                        >
                          {pkg.is_popular && (
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                background: token.colorWarning,
                                color: "#fff",
                                padding: "6px 14px",
                                borderTopRightRadius: 12,
                                borderBottomLeftRadius: 12,
                                fontSize: 12,
                              }}
                            >
                              ⭐ Most Popular
                            </div>
                          )}

                          <Title level={4}>{pkg.name}</Title>
                          <Title level={2} style={{ color: token.colorPrimary }}>
                            ₹{pkg.price}
                          </Title>
                          <Text type="colorTextSecondary">
                            {pkg.description || "No description available"}
                          </Text>

                          <div style={{ marginTop: 20 }}>
                            {pkg.features?.map((feature, i) => (
                              <div key={i} style={{ display: "flex", marginBottom: 10 }}>
                                <CheckCircleOutlined
                                  style={{
                                    color: token.colorSuccess,
                                    marginRight: 8,
                                    marginTop: 2,
                                  }}
                                />
                                <Text>{feature.description}</Text>
                              </div>
                            ))}
                          </div>

                          {/*
                           * ── FREE / BASIC USER BUTTONS ──
                           * Always show "Learn More"
                           * 11th Admission → "Join Now" (WhatsApp)
                           * All other programs → "Register Now" (payment page)
                           */}
                          <div
                            style={{
                              marginTop: 20,
                              display: "flex",
                              gap: 10,
                              flexDirection: screens.xs ? "column" : "row",
                            }}
                          >
                            {/* Learn More — always shown for free users */}
                            <Button
                              block
                              onClick={() => {
                                const routeKey = `${finalProgram}-${pkg.name}`;
                                navigate(serviceRouteMap[routeKey] || "/default", {
                                  state: {
                                    fromProgramPage: true,
                                    programId: pkg.program?.id,
                                    programName: finalProgram,
                                    packageId: pkg.id,
                                    packageName: pkg.name,
                                    isAptitude: pkg.aptitude_test,
                                  },
                                });
                              }}
                            >
                              Learn More
                            </Button>

                            {/* Second button: Join Now for 11th Admission, else Register Now */}
                            {isEleventhAdmissionProgram ? (
                              <Button
                                type="primary"
                                block
                                onClick={() =>
                                  window.open(
                                    eleventhAdmissionWhatsappLink,
                                    "_blank",
                                    "noopener,noreferrer"
                                  )
                                }
                              >
                                Join Now
                              </Button>
                            ) : (
                              <Button
                                type="primary"
                                block
                                onClick={() => {
                                  navigate("/student/payment-page", {
                                    state: {
                                      packageId: pkg.id,
                                      packageName: pkg.name,
                                      packagePrice: pkg.price,
                                      programId: pkg.program.id,
                                      programName: finalProgram,
                                      isFreeUser: true,
                                    },
                                  });
                                }}
                              >
                                Register Now
                              </Button>
                            )}
                          </div>
                        </Card>
                      </Col>
                    ))
                  ) : (
                    <Col
                      span={24}
                      style={{ textAlign: "center", marginTop: screens.xs ? 30 : 50 }}
                    >
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <Text
                            style={{
                              fontSize: screens.xs ? 16 : 18,
                              color: token.colorTextSecondary,
                            }}
                          >
                            No packages available for this program yet.
                          </Text>
                        }
                      >
                        <Button
                          type="primary"
                          onClick={() => navigate("/student/freecontent")}
                        >
                          Browse Free Content
                        </Button>
                      </Empty>
                    </Col>
                  )}
                </Row>

                <div style={{ marginTop: screens.xs ? 30 : 40 }}>
                  <FreeContentCard />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ================= PAID / LOGGED-IN USER SECTION =================
  return (
    <div
      style={{
        padding: screens.xs ? "20px 16px" : "20px 20px",
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: token.fontFamily,
      }}
    >
      {loading ? (
        <div
          style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}
        >
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Title */}
          <Title
            level={screens.xs ? 3 : 2}
            style={{ textAlign: "center", marginBottom: screens.xs ? 20 : 30 }}
          >
            {titleText}
            {finalProgram && (
              <Text
                style={{
                  marginLeft: 12,
                  fontSize: screens.xs ? 18 : 26,
                  fontWeight: "bold",
                  color: token.colorPrimary,
                }}
              >
                - {finalProgram}
              </Text>
            )}
          </Title>

          {/* Program Slider (only if no program selected yet) */}
          {!finalProgram && (
            <div
              style={{
                position: "relative",
                marginBottom: 30,
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                onClick={scrollLeft}
                style={{
                  cursor: "pointer",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0,0,0,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <ArrowLeftOutlined />
              </div>

              <div
                ref={programScrollRef}
                style={{
                  display: "flex",
                  gap: screens.xs ? 12 : 16,
                  overflowX: "auto",
                  flex: 1,
                }}
              >
                {programsList.map((program) => (
                  <Card
                    key={program.id}
                    hoverable
                    onClick={() => handleProgramSelect(program.name)}
                    style={{ minWidth: screens.xs ? 140 : 180, borderRadius: 8 }}
                  >
                    <Text strong>{program.name}</Text>
                  </Card>
                ))}
              </div>

              <div
                onClick={scrollRight}
                style={{
                  cursor: "pointer",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0,0,0,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 10,
                }}
              >
                <ArrowRightOutlined />
              </div>
            </div>
          )}

          {!finalProgram && <FreeContentCard />}

          {finalProgram && (
            <div>
              <Title
                level={screens.xs ? 4 : 3}
                style={{ textAlign: "center", marginBottom: screens.xs ? 20 : 30 }}
              >
                Selected Counselling Services
              </Title>

              <Row gutter={[screens.xs ? 16 : 24, screens.xs ? 16 : 24]} justify="center">
                {packageLoading ? (
                  <div style={{ textAlign: "center", marginTop: 40 }}>
                    <Spin size="large" />
                  </div>
                ) : packageList.length > 0 ? (
                  packageList
                    .filter(
                      (pkg) =>
                        !selectedPackageIdFromStorage ||
                        pkg.id === selectedPackageIdFromStorage
                    )
                    .map((pkg) => (
                      <Col xs={24} sm={12} md={8} key={pkg.id}>
                        <Card
                          style={{
                            borderRadius: 12,
                            position: "relative",
                            height: "100%",
                            boxShadow: token.boxShadow,
                            border:
                              selectedPackageIdFromStorage === pkg.id
                                ? `2px solid ${token.colorPrimary}`
                                : "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: screens.xs ? 16 : 24 }}
                        >
                          {pkg.is_popular && (
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                background: token.colorWarning,
                                color: "#fff",
                                padding: "6px 14px",
                                borderTopRightRadius: 12,
                                borderBottomLeftRadius: 12,
                                fontSize: 12,
                              }}
                            >
                              ⭐ Most Popular
                            </div>
                          )}

                          <Title level={4}>{pkg.name}</Title>
                          <Title level={2} style={{ color: token.colorPrimary }}>
                            ₹{pkg.price}
                          </Title>
                          <Text type="colorTextSecondary">
                            {pkg.description || "No description available"}
                          </Text>

                          <div style={{ marginTop: 20 }}>
                            {pkg.features?.map((feature, i) => (
                              <div key={i} style={{ display: "flex", marginBottom: 10 }}>
                                <CheckCircleOutlined
                                  style={{
                                    color: token.colorSuccess,
                                    marginRight: 8,
                                    marginTop: 2,
                                  }}
                                />
                                <Text>{feature.description}</Text>
                              </div>
                            ))}
                          </div>

                          {/*
                           * ── PAID USER BUTTONS ──
                           * 11th Admission  → "Learn More" + "Selected" (disabled green)
                           * All other programs → "Learn More" + "Select Service" / "Selected"
                           */}
                          <div
                            style={{
                              marginTop: 20,
                              display: "flex",
                              gap: 10,
                              flexDirection: screens.xs ? "column" : "row",
                            }}
                          >
                            {(() => {
                              const isSelected =
                                Number(selectedPackageIdFromStorage) === Number(pkg.id);

                              const handleSelectClick = () => {
                                const programName = finalProgram || pkg.program?.name;
                                const programId =
                                  pkg.program?.id || selectedProgramIdFromStorage || null;

                                localStorage.setItem("selectedProgram", programName || "");
                                localStorage.setItem("selectedProgramId", programId || "");
                                localStorage.setItem("selectedPackageId", pkg.id);
                                localStorage.setItem("selectedPackage", pkg.name);

                                dispatch(
                                  setSelection({
                                    programId,
                                    programName,
                                    packageId: pkg.id,
                                    packageName: pkg.name,
                                  })
                                );

                                navigate("/student/payment-page", {
                                  state: {
                                    packageId: pkg.id,
                                    packageName: pkg.name,
                                    packagePrice: pkg.price,
                                    programId,
                                    programName,
                                    isFreeUser: false,
                                  },
                                });
                              };

                              // Learn More — always shown for paid users
                              const learnMoreBtn = (
                                <Button
                                  block
                                  onClick={() => {
                                    const routeKey = `${finalProgram}-${pkg.name}`;
                                    navigate(serviceRouteMap[routeKey] || "/default", {
                                      state: {
                                        fromProgramPage: true,
                                        programId: pkg.program?.id,
                                        programName: finalProgram,
                                        packageId: pkg.id,
                                        packageName: pkg.name,
                                        isAptitude: pkg.aptitude_test,
                                      },
                                    });
                                  }}
                                >
                                  Learn More
                                </Button>
                              );

                              // ── PAID USER: 11th Admission → Learn More + Selected (disabled) ──
                              if (isEleventhAdmissionProgram) {
                                return (
                                  <>
                                    {learnMoreBtn}
                                    <Button
                                      block
                                      disabled
                                      style={{
                                        backgroundColor: token.colorSuccess,
                                        color: "#fff",
                                        border: "none",
                                      }}
                                    >
                                      Selected
                                    </Button>
                                  </>
                                );
                              }

                              // ── PAID USER: All other programs → Learn More + Select Service / Selected ──
                              return (
                                <>
                                  {learnMoreBtn}
                                  {isSelected ? (
                                    <Button
                                      block
                                      disabled
                                      style={{
                                        backgroundColor: token.colorSuccess,
                                        color: "#fff",
                                        border: "none",
                                      }}
                                    >
                                      Selected
                                    </Button>
                                  ) : (
                                    <Button type="primary" block onClick={handleSelectClick}>
                                      Select Service
                                    </Button>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </Card>
                      </Col>
                    ))
                ) : (
                  <Col
                    span={24}
                    style={{ textAlign: "center", marginTop: screens.xs ? 30 : 50 }}
                  >
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <Text
                          style={{
                            fontSize: screens.xs ? 16 : 18,
                            color: token.colorTextSecondary,
                          }}
                        >
                          No packages available for this program.
                        </Text>
                      }
                    >
                      <Button
                        type="primary"
                        onClick={() => navigate("/student/freecontent")}
                      >
                        Browse Free Content
                      </Button>
                    </Empty>
                  </Col>
                )}
              </Row>

              <div style={{ marginTop: screens.xs ? 30 : 40 }}>
                <FreeContentCard />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Program;