import React from "react";
import { Card, Typography, Divider, Button, Row, Col } from "antd";
import { useNavigate, Link } from "react-router-dom";

const { Title, Paragraph } = Typography;

const RegisterDetails = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "30px 20px",
      }}
    >
      <Row justify="center" align="middle" gutter={[30, 30]}>

        {/* LEFT IMAGE */}
        <Col xs={24} md={10}>
          <img
            src="/abhinav-apti-img.jpeg"
            alt="Register"
            style={{
              width: "100%",
              borderRadius: "12px",
              objectFit: "cover",
              marginBottom: "70px",
              maxHeight: "1000px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            }}
          />
        </Col>

        {/* RIGHT CARD */}
        <Col xs={24} md={12}>
          <Card
            style={{
              borderRadius: "14px",
              background: "#ffffff", // ✅ white
              border: "none",
              color: "#000",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)", // ✅ clean shadow
            }}
          >
            {/* TITLE */}
            <Title level={3}>
              📝 Registration Details
            </Title>

            <Paragraph>
              If parent wants to register, please share the following details:
            </Paragraph>

            {/* DETAILS */}
            <div style={{ lineHeight: "2" }}>
              👉 <b>Student Name</b> <br />
              👉 <b>STD / Class</b> <br />
              👉 <b>Email ID</b>
            </div>

            <Divider />

            {/* PAYMENT SCREENSHOT */}
            <Paragraph>
              📸 Kindly share the <b>fees paid screenshot</b> after payment.
            </Paragraph>

            <Divider />

            {/* PAYMENT DETAILS */}
            <Title level={5}>
              💳 Payment Details (GPay / PhonePe)
            </Title>

            <div
              style={{
                background: "#f1f5f9",
                padding: "14px",
                borderRadius: "10px",
                textAlign: "center",
                marginBottom: "15px",
              }}
            >
              <Title level={4} style={{ color: "#1677ff", margin: 0 }}>
                📱 99226 95424
              </Title>
            </div>

            {/* FEES */}
            <Title level={5}>
              💰 Session Fees
            </Title>

            <div
              style={{
                background: "#f1f5f9",
                padding: "14px",
                borderRadius: "10px",
                lineHeight: "1.8",
              }}
            >
              🔹 Online Session: <b>₹5,000</b> (via GPay)
              <br />
              🔹 Offline Session: <b>₹500</b> via GPay + <b>₹4,500</b> cash
            </div>

            <Divider />

            {/* IMPORTANT NOTE */}
            <Title level={5}>
              ⚠ Important Before You Enroll
            </Title>

            <Paragraph>
              1. Report will be shared only after session explanation is completed.
              Please do not request it before the session.
            </Paragraph>

            <Paragraph>
              2. We request flexibility in scheduling. Weekday sessions may be required
              as weekends/evenings cannot accommodate all students.
            </Paragraph>

            {/* EXPLORE MORE SERVICES */}
            <div
              style={{
                marginTop: "20px",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "#f0f5ff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                border: "1px solid #d6e4ff",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "14px", color: "#666" }}>
                  Explore More Services
                </span>
                <span style={{ fontWeight: 600, fontSize: "16px" }}>
                  Find the right career guidance for you
                </span>
              </div>

              <Button
                type="primary"
                onClick={() =>
                  window.open("https://abhinavcareerscope.com/", "_blank")
                }
                style={{
                  borderRadius: "8px",
                  fontWeight: 600,
                }}
              >
                View Services →
              </Button>
            </div>
          </Card>

          {/* BUTTONS OUTSIDE CARD */}
          <div style={{ marginTop: "20px" }}>
            <Button
              type="primary"
              block
              size="large"
              style={{
                marginBottom: "12px",
                borderRadius: "10px",
                height: "48px",
                fontWeight: "600",
              }}
              onClick={() => navigate("/register")}
            >
              Create Student Account
            </Button>

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
                  "https://wa.me/919922695424?text=I want to register for aptitude test",
                  "_blank"
                );
              }}
            >
              Send WhatsApp Enquiry
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default RegisterDetails;