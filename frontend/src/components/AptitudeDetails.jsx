import React from "react";
import { Card, Typography, Button, Divider, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchLandingPageByPackage } from "../adminSlices/landingPageSlice";
import { useLocation } from "react-router-dom";

const { Title, Paragraph } = Typography;

const AptitudeDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const packageId = location.state?.packageId;

  const dispatch = useDispatch();

  const toArray = (obj, key) => {
    const arr = [];

    for (let i = 1; i <= 4; i++) {
      const val = obj?.[`${key}${i}`];
      if (val && val.trim()) {
        arr.push(val);
      }
    }

    return arr;
  };

  const landing = useSelector(
    (state) => state.landingPage.currentPackageLanding
  );

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
        background: "#f5f7fb",
        padding: "30px 20px",
      }}
    >
      {/* MAIN ROW */}
      <Row justify="center" gutter={[30, 30]}>

        {/* LEFT IMAGE */}
        <Col xs={24} md={8}>
          <div
            style={{
              width: "100%",
              height: "700px",              // ✅ FIXED HEIGHT
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              background: "#000",
            }}
          >
            <img
              src={landing?.flyer_image || "/apti-flayer.jpeg"}
              alt="Aptitude Test"
              style={{
                width: "100%",
                height: "100%",             // ✅ fill container
                objectFit: "cover",        // ✅ important
              }}
            />
          </div>
        </Col>

        {/* RIGHT CARD */}
        <Col xs={24} md={14}>
          <Card
            style={{
              width: "100%",
              borderRadius: "16px",
              background: "#ffffff",
              border: "none",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            }}
            bodyStyle={{
              display: "flex",
              flexDirection: "column",
              padding: "16px",
            }}
          >
            {/* TOP */}
            <div>
              <Title level={4}>
                🎯 {landing?.package_details?.name || "-"}
              </Title>

              <Paragraph style={{ fontSize: "13px", marginBottom: 10 }}>
                {landing?.package_details?.description}
              </Paragraph>
            </div>

            <Divider style={{ margin: "10px 0" }} />

            {/* CONTENT */}
            <div>
              <Title level={5} style={{ marginBottom: 6 }}>
                🕒 Process
              </Title>

              <ul>
                {normalizedLanding?.process?.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <Divider style={{ margin: "10px 0" }} />

              <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
                {landing?.package_details?.features?.map((f, index) => {
                  const icons = ["🔍", "🏫", "🎯", "📊"];

                  return (
                    <div key={f.id || index}>
                      {icons[index % icons.length]} {f.description}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTTOM */}
            <div>
              <Divider />

              {/* PRICE */}
              <div
                style={{
                  background: "#f0f5ff",
                  padding: "10px",
                  borderRadius: "8px",
                  textAlign: "center",
                  border: "1px solid #d6e4ff",
                }}
              >
                <Title level={5} style={{ color: "#1677ff", margin: 0 }}>
                  ₹ {landing?.package_details?.price}
                </Title>
                <span style={{ fontSize: "12px" }}>Total Fees</span>
              </div>

              {/* CONTACT */}
              <Paragraph
                style={{
                  textAlign: "center",
                  marginTop: 8,
                  fontSize: "12px",
                }}
              >
                📞{" "}
                {landing?.contact_details?.replace(/,/g, " | ")}
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
                  textAlign: "left",   // ✅ change this from center → left
                  fontSize: "13px",
                  color: "#555",
                  padding: "8px",
                }}
              >
                <b>📝 Registration Details:</b>

                <div style={{ marginTop: "6px", lineHeight: "1.6" }}>
                  {normalizedLanding?.registration_details?.map((item, i) => (
                    <div key={i}>👉 {item}</div>
                  ))}
                </div>


                {/* STATIC PAYMENT INFO */}
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px",
                    background: "#f6ffed",
                    border: "1px solid #b7eb8f",
                    borderRadius: "8px",
                    textAlign: "left",
                  }}
                >
                  <div>📸 Kindly share the fees paid screenshot after payment.</div>

                  <div style={{ marginTop: "6px" }}>
                    💳 <b>Payment Details (GPay / PhonePe):</b><br />
                    📱 99226 95424
                  </div>

                  <div style={{ marginTop: "6px" }}>
                    💰 <b>Session Fees:</b><br />
                    🔹 Online Session: ₹{landing?.package_details?.price} (via GPay)<br />
                    🔹 Offline Session: ₹500 via GPay + ₹{landing?.package_details?.price - 500} cash at the time of counseling
                  </div>
                </div>
              </div>


              <Paragraph
                style={{
                  fontSize: "13px",
                  lineHeight: "1.7",
                  background: "#fff7e6",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ffe58f",

                }}
              >
                <b>⚠️ IMPORTANT before you enroll:</b>
                <br />

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
            </div>
          </Card>
        </Col>
      </Row>

      {/* BUTTON SECTION */}
      <div
        style={{
          maxWidth: "950px",
          margin: "20px auto 0",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Row
          gutter={[12, 12]}
          style={{
            width: "100%",
            maxWidth: "500px",
          }}
        >
          {/* CREATE ACCOUNT */}
          <Col xs={24} sm={12}>
            <Button
              type="primary"
              block
              size="large"
              style={{
                borderRadius: "10px",
                height: "48px",
                fontWeight: "600",
              }}
              onClick={() => navigate("/register")}
            >
              Create Student Account
            </Button>
          </Col>

          {/* WHATSAPP */}
          <Col xs={24} sm={12}>
            <Button
              block
              size="large"
              style={{
                background: "#25D366",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                height: "48px",
                fontWeight: "600",
              }}
              onClick={() => {
                window.open(
                  "https://wa.me/919922695424?text=I am interested in Aptitude Test",
                  "_blank"
                );
              }}
            >
              Send WhatsApp Enquiry
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default AptitudeDetails;