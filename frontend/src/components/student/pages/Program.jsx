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

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { token } = antdTheme;

export const programIconColorMap = {
  Engineering: { icon: <ToolOutlined />, color: "#4B7CF3" },
  "OCI/NRI/CIWG/PIO Engineering": { icon: <GlobalOutlined />, color: "#3F51B5" },
  Medical: { icon: <MedicineBoxOutlined />, color: "#F44336" },
  Law: { icon: <BankOutlined />, color: "#FFC107" },
  "Design & Architecture": { icon: <SketchOutlined />, color: "#9C27B0" },
  Commerce: { icon: <StockOutlined />, color: "#4CAF50" },
  Arts: { icon: <ReadOutlined />, color: "#E91E63" },
  BBA: { icon: <UsergroupAddOutlined />, color: "#FF9800" },
  "11th Admission": { icon: <FileTextOutlined />, color: "#795548" },
  "8-12 Aptitude Test": { icon: <CheckCircleOutlined />, color: "#00BCD4" },
  "PG Counselling": { icon: <ApartmentOutlined />, color: "#607D8B" },
  "Abroad Counselling": { icon: <GlobalOutlined />, color: "#009688" },
  "Admission Counselling": { icon: <HeartOutlined />, color: "#E91E63" },
  Others: { icon: <ToolOutlined />, color: "#9E9E9E" },
};

export const defaultProgramIconColor = {
  icon: <ToolOutlined />,
  color: "#9E9E9E",
};

const Program = () => {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const programScrollRef = useRef(null);
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const dispatch = useDispatch();

  const { activeList: programsList, loading } = useSelector((state) => state.programs);
  const { list: packageList, loading: packageLoading } = useSelector((state) => state.packages);
  const profile = useSelector((state) => state.profile?.profile);

  // ================= FETCH PROGRAMS =================
  useEffect(() => {
    dispatch(fetchActivePrograms());
  }, [dispatch]);

  // ================= LOAD SELECTED PROGRAM FROM PROFILE OR LOCALSTORAGE =================
  useEffect(() => {
    const savedProgram = localStorage.getItem("selectedProgram");
    if (programsList.length) {
      const programFromProfile = profile?.program;
      const programToUse = programFromProfile || savedProgram;

      if (programToUse) {
        setSelectedProgram(programToUse);
        const selected = programsList.find((p) => p.name === programToUse);
        if (selected?.id) {
          dispatch(fetchPackagesByProgram(selected.id));
        }
      }
    }
  }, [programsList, profile, dispatch]);

  // ================= SAVE SELECTED PROGRAM =================
  const handleProgramSelect = (programTitle) => {
    setSelectedProgram(programTitle);
    localStorage.setItem("selectedProgram", programTitle);
    dispatch(clearPackages());
    const selected = programsList.find((p) => p.name === programTitle);
    if (selected?.id) dispatch(fetchPackagesByProgram(selected.id));
  };

  // ================= CENTER SELECTED PROGRAM =================
  useEffect(() => {
    if (selectedProgram && programScrollRef.current && programsList.length) {
      const index = programsList.findIndex((p) => p.name === selectedProgram);
      if (index >= 0) {
        const cardWidth = screens.xs ? 140 : 180;
        const gap = screens.xs ? 12 : 16;
        const scrollLeftValue =
          index * (cardWidth + gap) - (programScrollRef.current.offsetWidth / 2 - cardWidth / 2);
        programScrollRef.current.scrollTo({ left: scrollLeftValue, behavior: "smooth" });
      }
    }
  }, [selectedProgram, programsList, screens.xs]);

  // ================= PROGRAM SCROLL =================
  const scrollLeft = () => {
    if (programScrollRef.current) programScrollRef.current.scrollBy({ left: -250, behavior: "smooth" });
  };
  const scrollRight = () => {
    if (programScrollRef.current) programScrollRef.current.scrollBy({ left: 250, behavior: "smooth" });
  };

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
              icon={<ArrowRightOutlined />}
              onClick={() => navigate("/student/freecontent")}
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
  const displayedPrograms = programsList.filter((p) => !profile?.program || p.name === profile.program);
  const apiPrograms = displayedPrograms.map((p) => {
    const map = programIconColorMap[p.name] || defaultProgramIconColor;
    return { id: p.id, title: p.name, icon: map.icon, color: map.color };
  });
  const titleText = profile?.program ? "Your Selected Counselling Program" : "Choose Your Career Path";

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
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
          <Spin size="large" tip="Loading Programs..." />
        </div>
      ) : (
        <>
          <Title
            level={screens.xs ? 3 : 2}
            style={{ textAlign: "center", marginBottom: screens.xs ? 20 : 30, fontSize: screens.xs ? 24 : 32 }}
          >
            {titleText}
          </Title>

          {/* ================= PROGRAM CARDS ================= */}
          <div style={{ position: "relative", marginBottom: 30, display: "flex", alignItems: "center" }}>
            {!profile?.program && (
              <div onClick={scrollLeft} style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "rgba(0,0,0,0.15)",
                marginRight: 10,
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                fontSize: 20,
                transition: "all 0.2s",
              }}>
                <ArrowLeftOutlined />
              </div>
            )}

            <div
              ref={programScrollRef}
              style={{
                display: "flex",
                gap: screens.xs ? 12 : 16,
                overflowX: "auto",
                scrollBehavior: "smooth",
                flex: 1,
                paddingBottom: 5,
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              {apiPrograms.map((program) => (
                <Card
                  key={program.title}
                  hoverable={!profile?.program}
                  onClick={() => !profile?.program && handleProgramSelect(program.title)}
                  style={{
                    minWidth: screens.xs ? 140 : 180,
                    height: screens.xs ? 110 : 130,
                    borderRadius: 8,
                    border: selectedProgram === program.title ? "2px solid #4B7CF3" : "1px solid #f0f0f0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: profile?.program ? "default" : "pointer",
                    flexShrink: 0,
                  }}
                  bodyStyle={{ padding: screens.xs ? 8 : 12 }}
                >
                  <div
                    style={{
                      backgroundColor: program.color,
                      width: screens.xs ? 36 : 44,
                      height: screens.xs ? 36 : 44,
                      borderRadius: "50%",
                      marginBottom: screens.xs ? 6 : 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                    }}
                  >
                    {React.cloneElement(program.icon, { style: { fontSize: screens.xs ? 16 : 20 } })}
                  </div>
                  <Text strong style={{ fontSize: screens.xs ? 14 : 16 }}>
                    {program.title}
                  </Text>
                </Card>
              ))}
            </div>

            {!profile?.program && (
              <div onClick={scrollRight} style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "rgba(0,0,0,0.15)",
                marginLeft: 10,
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                fontSize: 20,
                transition: "all 0.2s",
              }}>
                <ArrowRightOutlined />
              </div>
            )}
          </div>

          {!selectedProgram && <FreeContentCard />}

          {selectedProgram && (
            <div>
              <Title level={screens.xs ? 4 : 3} style={{ textAlign: "center", marginBottom: screens.xs ? 20 : 30 }}>
                {selectedProgram} Counselling Services
              </Title>

              <Row gutter={[screens.xs ? 16 : 24, screens.xs ? 16 : 24]} justify="center">
                {packageLoading ? (
                  <div style={{ textAlign: "center", marginTop: 40 }}>
                    <Spin size="large" />
                  </div>
                ) : packageList.length > 0 ? (
                  packageList
                    .filter((pkg) => !profile?.package_id || pkg.id === profile.package_id)
                    .map((pkg) => (
                      <Col xs={24} sm={12} md={8} key={pkg.id}>
                        <Card
                          style={{
                            borderRadius: 12,
                            position: "relative",
                            height: "100%",
                            boxShadow: token.boxShadow,
                            border:
                              profile?.package_id === pkg.id ? `2px solid ${token.colorPrimary}` : "1px solid #f0f0f0",
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
                          <Text type="colorTextSecondary">{pkg.description || "No description available"}</Text>

                          <div style={{ marginTop: 20 }}>
                            {pkg.features?.map((feature, i) => (
                              <div key={i} style={{ display: "flex", marginBottom: 10 }}>
                                <CheckCircleOutlined
                                  style={{ color: token.colorSuccess, marginRight: 8, marginTop: 2 }}
                                />
                                <Text>{feature.description}</Text>
                              </div>
                            ))}
                          </div>

                          <Button
                            type="primary"
                            block
                            style={{ marginTop: 20 }}
                            onClick={() => {
                              localStorage.setItem("selectedPackage", pkg.id);
                              navigate("/student/payment-page", { state: { packageId: pkg.id } });
                            }}
                          >
                            Select Service
                          </Button>
                        </Card>
                      </Col>
                    ))
                ) : (
                  <Col span={24} style={{ textAlign: "center", marginTop: screens.xs ? 30 : 50 }}>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <Text style={{ fontSize: screens.xs ? 16 : 18, color: token.colorTextSecondary }}>
                          No packages available for this program.
                        </Text>
                      }
                    >
                      <Button type="primary" onClick={() => navigate("/student/freecontent")}>
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
