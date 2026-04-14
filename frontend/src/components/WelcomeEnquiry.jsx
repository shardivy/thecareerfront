import React, { useEffect, useState } from "react";
import { Row, Col, Card, Typography, Spin, Empty } from "antd";
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

    const from = location.state?.from; // "enquiry" or "register"

    const { list: programs, loading: programLoading } = useSelector(
        (state) => state.programs
    );

    const { list: packages, loading: packageLoading } = useSelector(
        (state) => state.packages
    );

    const [activeProgramId, setActiveProgramId] = useState(null);
    const [activeProgramName, setActiveProgramName] = useState("");

    useEffect(() => {
        dispatch(fetchPrograms());
    }, [dispatch]);

    const handleProgramClick = (program) => {
        if (activeProgramId === program.id) {
            setActiveProgramId(null);
            setActiveProgramName("");
        } else {
            setActiveProgramId(program.id);
            setActiveProgramName(program.name);
            dispatch(fetchPackagesByProgram(program.id));
        }
    };

    return (
        <div style={{ padding: "20px", background: "#cfcfcf", minHeight: "100vh" }}>
            {/* TITLE */}
            <Title
                level={3}
                style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    // background: "linear-gradient(90deg, #08245c, #479fdb)",
                    background: "#000000",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
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
                <Row gutter={[10, 10]} align="stretch">
                    {programs.map((program) => {
                        const iconData =
                            programIconColorMap[program.name?.trim()] ||
                            programIconColorMap["Others"];

                        return (
                            <Col xs={12} sm={8} md={6} lg={4} key={program.id}>
                                <Card
                                    hoverable
                                    onClick={() => handleProgramClick(program)}
                                    style={{
                                        borderRadius: "10px",
                                        textAlign: "center",
                                        padding: "8px 4px",
                                        height: "110px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        border:
                                            activeProgramId === program.id
                                                ? "2px solid #1677ff"
                                                : "1px solid #eee",
                                    }}
                                >
                                    {/* ICON */}
                                    <div
                                        style={{
                                            width: "56px",
                                            height: "56px",
                                            margin: "0 auto 6px",
                                            borderRadius: "50%",
                                            background: `${iconData.color}20`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "26px",
                                            color: iconData.color,
                                        }}
                                    >
                                        {iconData.icon}
                                    </div>

                                    {/* NAME */}
                                    <div
                                        style={{
                                            fontSize: "14px",        // 👈 increased from 12px
                                            fontWeight: "600",       // 👈 slightly bolder
                                            lineHeight: "1.3",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
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

            {/* PACKAGES SECTION */}
            {activeProgramId && (
                <div style={{ marginTop: "30px" }}>
                    <Title
                        level={4}
                        style={{
                            textAlign: "center",
                            color: "#000000", // 👈 makes text white
                        }}
                    >
                        Counselling Service for {activeProgramName}
                    </Title>

                    {packageLoading ? (
                        <div style={{ textAlign: "center" , }}>
                            <Spin />
                        </div>
                    ) : packages.length === 0 ? (
                        <Empty  description={
    <span style={{ color: "#aaa" }}>No service Found</span>
  } />
                    ) : (
                        <Row gutter={[12, 12]} justify="center" align="stretch">
                            {packages.map((pkg) => (
                                <Col xs={12} sm={8} md={6} lg={4} key={pkg.id}>
                                    <Card
                                        hoverable
                                        onClick={() => {
                                            if (pkg.name?.toLowerCase().includes("aptitude")) {
                                                if (from === "register") {
                                                    navigate("/register-details");
                                                } else {
                                                    navigate("/aptitude-details");
                                                }
                                            }
                                        }}
                                        style={{
                                            borderRadius: "14px",
                                            textAlign: "center",
                                            background: "#f5faff",
                                            padding: "14px 10px",
                                            height: "120px", // ✅ fixed height
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                                            transition: "all 0.3s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-5px)";
                                            e.currentTarget.style.boxShadow =
                                                "0 10px 25px rgba(0,0,0,0.18)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow =
                                                "0 4px 14px rgba(0,0,0,0.1)";
                                        }}
                                    >
                                        {/* PACKAGE NAME */}
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                            }}
                                        >
                                            {pkg.name}
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </div>
            )}
        </div>
    );
};

export default WelcomeEnquiry;