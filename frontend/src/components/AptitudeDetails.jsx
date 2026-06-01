import React, { useEffect, useState, useRef } from "react";
import { Card, Typography, Button, Divider, Row, Col, Grid, Modal } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchLandingPageByPackage } from "../adminSlices/landingPageSlice";
import { PlayCircleOutlined, UserAddOutlined, WhatsAppOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const AptitudeDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const packageId = location.state?.packageId;
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const isAptitude = location.state?.isAptitude;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fromProgramPage = location.state?.fromProgramPage;
  const fromWelcomePage = location.state?.fromWelcomePage;
  const videoRef = useRef(null);

  const toArray = (obj, key) => {
    const arr = [];
    for (let i = 1; i <= 4; i++) {
      const val = obj?.[`${key}${i}`];
      if (val && val.trim()) arr.push(val);
    }
    return arr;
  };

  const landing = useSelector(
    (state) => state.landingPage.currentPackageLanding
  );

  const handleClose = () => {
    setIsModalOpen(false);

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const normalizedLanding = landing
    ? {
      ...landing,
      process: toArray(landing, "process"),
      registration_details: toArray(landing, "registration_details"),
      instructions: toArray(landing, "instructions"),
    }
    : null;

  useEffect(() => {
    if (packageId) {
      dispatch(fetchLandingPageByPackage(packageId));
    }
  }, [packageId, dispatch]);

  return (

    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        background: "#f5f7fb",
        overflow: "hidden",
        gap: isMobile ? "0px" : "20px",
      }}
    >

      {fromProgramPage && (
        <div
          style={{
            position: "absolute",
            top: isMobile ? "12px" : "20px",
            left: isMobile ? "16px" : "15px",
            zIndex: 20,
          }}
        >
          <Button
            type="link"
            onClick={() => navigate("/student/program")}
            style={{
              padding: 0,
              fontWeight: 600,
              fontSize: isMobile ? 14 : 16,
              height: "auto",
            }}
          >
            ← Back
          </Button>
        </div>
      )}

      {fromWelcomePage && (
        <div
          style={{
            position: "absolute",
            top: isMobile ? "12px" : "20px",
            left: isMobile ? "16px" : "15px",
            zIndex: 20,
          }}
        >
          {/* <Button
      type="link"
      onClick={() => navigate("/welcome-enquiry")}
      style={{
        padding: 0,
        fontWeight: 600,
        fontSize: isMobile ? 14 : 16,
        height: "auto",
      }}
    >
      ← Back
    </Button> */}
        </div>
      )}
      <br></br>
      <div
        style={{
          width: isMobile ? "100%" : "45%",   // ✅ reduced width
          padding: isMobile ? "16px 16px 0" : "30px 20px 30px 90px", // ✅ added left padding
        }}
      >
        <div
          style={{
            width: "100%",

            // ✅ MOBILE vs DESKTOP
            height: isMobile ? "380px" : "90vh",

            // ✅ Keep ratio only on desktop
            aspectRatio: isMobile ? "auto" : "4 / 5",

            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          }}
        >
          <img
            src={landing?.flyer_image}
            alt="Aptitude Test"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>

      <div
        style={{
          width: isMobile ? "100%" : "65%",
          height: isMobile ? "auto" : "100vh",
          overflowY: isMobile ? "visible" : "auto",
          padding: isMobile ? "16px" : "30px 20px",
        }}
      >
        <Card
          style={{
            borderRadius: "16px",
            background: "#ffffff",
            border: "none",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          }}
          bodyStyle={{ padding: isMobile ? 16 : 24 }}
        >
          <div>
            <Title level={isMobile ? 5 : 4} style={{ marginBottom: 8 }}>
              Aptitude Test {landing?.package_details?.name || "-"}
            </Title>

            <Paragraph style={{ fontSize: isMobile ? "12px" : "13px", marginBottom: 10 }}>
              {landing?.package_details?.description}
            </Paragraph>
          </div>

          <Divider style={{ margin: "10px 0" }} />

          <div>
            <Title level={5} style={{ marginBottom: 6 }}>
              🕒 Process
            </Title>

            <Row gutter={[8, 8]}>
              {normalizedLanding?.process?.map((item, i) => (
                <Col xs={24} sm={12} key={i}>
                  <ul style={{ paddingLeft: "18px", margin: 0 }}>
                    <li>{item}</li>
                  </ul>
                </Col>
              ))}
            </Row>

            <Divider style={{ margin: "10px 0" }} />

            <div style={{ fontSize: isMobile ? "12px" : "13px", lineHeight: "1.8" }}>
              <Title level={5} style={{ marginBottom: 6 }}>
                ✨ Features
              </Title>


              <Row gutter={[8, 8]}>
                {landing?.package_details?.features?.map((f, index) => {
                  const icons = ["🔍", "🏫", "🎯", "📊"];

                  return (
                    <Col xs={24} sm={12} key={f.id || index}>
                      <div>
                        {icons[index % icons.length]} {f.description}
                      </div>
                    </Col>
                  );
                })}
              </Row>

            </div>
          </div>

          <Divider />

          <div>
            <div
              style={{
                background: "#f0f5ff",
                padding: isMobile ? "12px" : "10px 14px",
                borderRadius: "8px",
                border: "1px solid #d6e4ff",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "12px", color: "#555" }}>Total Fees</span>
              {!isMobile && <span>-</span>}
              <Title level={5} style={{ color: "#1677ff", margin: 0 }}>
                ₹ {landing?.package_details?.price}
              </Title>
            </div>

            <Paragraph
              style={{
                textAlign: "center",
                marginTop: 8,
                fontSize: "12px",
                wordBreak: "break-word",
              }}
            >
              📞 <b>For Enquiries:  </b> {landing?.contact_details?.replace(/,/g, " | ")}
            </Paragraph>

            <Divider style={{ margin: "10px 0" }} />

            <Paragraph
              style={{
                textAlign: "center",
                fontSize: "13px",
                fontWeight: 600,
                color: "#333",
                marginBottom: 0,
              }}
            >
              🏢 {landing?.enterprise_name}
            </Paragraph>

            <Divider style={{ margin: "10px 0" }} />

            <div
              style={{
                textAlign: "left",
                fontSize: isMobile ? "12px" : "13px",
                color: "#555",
                padding: isMobile ? "0" : "8px",
              }}
            >
              {/* <b>📝 Registration Details:</b> */}
              <Title level={5} style={{ marginBottom: 6 }}>
                📝 Registration Details:
              </Title>

              <div style={{ marginTop: "4px" }}>
                Please share the following details:
              </div>


              <Row gutter={[8, 8]} style={{ marginTop: "6px" }}>
                {normalizedLanding?.registration_details?.map((item, i) => (
                  <Col xs={24} sm={12} md={8} key={i}>
                    <div style={{ lineHeight: "1.6" }}>👉 {item}</div>
                  </Col>
                ))}
              </Row>

              <div style={{ marginTop: "12px" }}>
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px",
                    background: "#f6ffed",
                    border: "1px solid #b7eb8f",
                    borderRadius: "8px",
                    textAlign: "left",
                    wordBreak: "break-word",
                  }}
                >
                  <div>📸 Kindly share the fees paid screenshot after payment.</div>

                  <div style={{ marginTop: "6px" }}>
                    💳 <b>Payment Details (GPay / PhonePe):</b>
                    <br />
                    📱 99226 95424
                  </div>

                  <div style={{ marginTop: "6px" }}>
                    💰 <b>Session Fees:</b>
                    <br />
                    Online Session: Rs.{landing?.package_details?.price} (via GPay)
                    <br />
                    Offline Session: Rs.500 via GPay + Rs.
                    {(landing?.package_details?.price || 0) - 500} cash at the
                    time of counseling
                  </div>
                </div>
              </div>

              <Paragraph
                style={{
                  fontSize: isMobile ? "12px" : "13px",
                  lineHeight: "1.7",
                  background: "#fff7e6",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ffe58f",
                  marginTop: 16,
                  marginBottom: 0,
                }}
              >
                <b>⚠️ IMPORTANT before you enroll:</b>
                <div style={{ marginTop: "6px" }}>
                  {normalizedLanding?.instructions?.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: "4px",
                        marginLeft: "10px",
                      }}
                    >
                      {i + 1}. {item}
                    </div>
                  ))}
                </div>
              </Paragraph>

              {isAptitude && (
                <div
                  style={{
                    marginTop: "12px",
                    display: "flex",              // ✅ ADD THIS
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "6px",                  // ✅ controls spacing
                    fontSize: isMobile ? "12px" : "13px",
                    fontWeight: 500,
                    flexWrap: "wrap",            // ✅ mobile safe
                  }}
                >
                  <PlayCircleOutlined style={{ color: "#000000" }} />

                  <span>Want to know more?</span>

                  <span
                    style={{
                      color: "#1677ff",
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontWeight: 600,
                    }}
                    onClick={() => setIsModalOpen(true)}
                  >
                    Watch Now
                  </span>
                </div>
              )}       </div>
          </div>
        </Card>

        <Row
          gutter={[6, 6]}
          justify="center"
          style={{ marginTop: 20 }}
        >
          <Col xs={24} sm={12} md={8} style={{ display: "flex", justifyContent: "center" }}>
            <Button
              type="primary"
              size="large"
              icon={<UserAddOutlined />}   // ✅ ICON ADDED
              style={{ padding: "20px", width: "100%" }}
              onClick={() => navigate("/register")}
            >
              Create Student Account
            </Button>
          </Col>

          <Col xs={24} sm={12} md={8} style={{ display: "flex", justifyContent: "center" }}>
            <Button
              size="large"
              icon={<WhatsAppOutlined />}  // ✅ ICON ADDED
              style={{
                background: "#25D366",
                color: "#fff",
                padding: "20px",
                width: "100%",
              }}
              onClick={() =>
                window.open("https://wa.me/919922695424", "_blank")
              }
            >
              Send WhatsApp Enquiry
            </Button>
          </Col>
        </Row>
      </div>

      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        footer={null}
        centered
        width={1000}
        destroyOnHidden
      >
        <div style={{ position: 'relative', width: '100%' }}>
          <video
            ref={videoRef}
            controls
            autoPlay
            style={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          >
            <source src="/abhinav-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </Modal>
    </div>
  );
};

export default AptitudeDetails;

