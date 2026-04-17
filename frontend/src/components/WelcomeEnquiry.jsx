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
  BBA: { icon: <UsergroupAddOutlined />, color: "#FF9800" },
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

  return (
    <div style={{ padding: "20px", background: "#f4f7fb", minHeight: "100vh" }}>
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
      {programLoading ? (
        <div style={{ textAlign: "center" }}>
          <Spin />
        </div>
      ) : programs.length === 0 ? (
        <Empty description="No Programs Found" />
      ) : (
        <Row gutter={[20, 20]} justify="center">
          {programs.map((program) => {
            const iconData =
              programIconColorMap[program.name?.trim()] ||
              programIconColorMap["Others"];

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={program.id}>
                <Card
                  hoverable
                  onClick={() => handleProgramClick(program)}
                  bodyStyle={{
                    height: "100%",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                  style={{
                    borderRadius: "16px",
                    height: "170px",
                    transition: "all 0.3s ease",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 28px rgba(0,0,0,0.18)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(0,0,0,0.08)";
                  }}
                >
                  {/* ICON */}
                  <div
                    style={{
                      width: "70px",
                      height: "70px",
                      margin: "0 auto 12px",
                      marginBottom: "12px",
                      borderRadius: "50%",
                      background: `${iconData.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "32px",
                      color: iconData.color,
                    }}
                  >
                    {iconData.icon}
                  </div>

                  {/* NAME */}
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      textAlign: "center",
                      lineHeight: "1.3",
                    }}
                  >
                    {program.name}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

  
     {/* MODAL FOR PACKAGES */}
<Modal
  title={`Counselling Services for ${activeProgramName}`}
  open={isModalOpen}
  onCancel={() => setIsModalOpen(false)}
  footer={null}
  centered
  width={800}
>
  {packageLoading ? (
    <div style={{ textAlign: "center", padding: 20 }}>
      <Spin />
    </div>
  ) : packages.length === 0 ? (
    <Empty description="No services found" />
  ) : (
    <Row gutter={[20, 20]}>
      {packages.map((pkg) => (
        <Col xs={24} sm={12} key={pkg.id}>
          <Card
            hoverable
onClick={() => {
  navigate("/aptitude-details", {
    state: {
      programId: activeProgramId,
      programName: activeProgramName,
      packageId: pkg.id,
      packageName: pkg.name,
      // price: pkg.price,
      // features: pkg.features,
    },
  });
}}
            style={{
              borderRadius: "16px",
              padding: "18px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background: "#ffffff",
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow =
                "0 12px 28px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 6px 18px rgba(0,0,0,0.08)";
            }}
          >
            {/* PACKAGE NAME */}
            <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: 6 }}>
              {pkg.name}
            </div>

            {/* PRICE */}
            <div
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#1677ff",
                marginBottom: 10,
              }}
            >
              ₹ {pkg.price}
            </div>

           
            {/* FEATURES */}
            {pkg.features && pkg.features.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    marginBottom: 6,
                  }}
                >
                  Features:
                </div>

                <ul
                  style={{
                    paddingLeft: "16px",
                    margin: 0,
                    fontSize: "13px",
                    color: "#444",
                  }}
                >
                  {pkg.features.map((feature) => (
                    <li key={feature.id} style={{ marginBottom: "4px" }}>
                      {feature.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
