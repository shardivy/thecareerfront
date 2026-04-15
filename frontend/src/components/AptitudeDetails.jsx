import React from "react";
import { Card, Typography, Button, Divider, Row, Col } from "antd";
import { useNavigate, Link } from "react-router-dom";

const { Title, Paragraph } = Typography;

const AptitudeDetails = () => {
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
            alt="Aptitude Test"
            style={{
              width: "100%",
              borderRadius: "16px",
              objectFit: "cover",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            }}
          />
        </Col>

        {/* RIGHT CARD */}
        <Col xs={24} md={12}>
          <Card
            style={{
              borderRadius: "16px",
              background: "#ffffff",
              border: "none",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            }}
          >
            {/* TITLE */}
            <Title level={3} style={{ color: "#1a1a1a" }}>
              🎯 Aptitude Test for 10th to 12th Students
            </Title>

            <Paragraph style={{ color: "#555" }}>
              Discover the right stream by understanding{" "}
              <b style={{ color: "#000" }}>
                aptitude, interests & study habits
              </b>.
            </Paragraph>

            <Divider />

            {/* PROCESS */}
            <Title level={5} style={{ color: "#000" }}>
              🕒 Process
            </Title>
            <ul
              style={{
                color: "#555",
                paddingLeft: "18px",
                lineHeight: "1.8",
              }}
            >
              <li>2-hour online aptitude test (No preparation needed)</li>
              <li>
                Detailed report in <b>2–3 days</b>
              </li>
              <li>
                <b>1 to 1.5-hour</b> counselling session
              </li>
              <li>Zoom / Bavdhan, Pune office</li>
              <li>Report shared after session</li>
            </ul>

            <Divider />

            {/* DETAILS */}
            <Paragraph style={{ color: "#555" }}>
              🔍 Stream finalisation | Entrance exams <br />
              🏫 Colleges | 📖 Study techniques <br />
              🎯 Career options Plan A, B, C <br />
              📊 Cut-offs | Board selection | Coaching guidance
            </Paragraph>

            <Divider />

            {/* PRICE */}
            <div
              style={{
                background: "#f0f5ff",
                padding: "14px",
                borderRadius: "10px",
                textAlign: "center",
                border: "1px solid #d6e4ff",
              }}
            >
              <Title level={4} style={{ color: "#1677ff", margin: 0 }}>
                ₹5,000
              </Title>
              <span style={{ color: "#666" }}>Total Fees</span>
            </div>

            <Divider />

            {/* CONTACT */}
            <Paragraph style={{ textAlign: "center", color: "#555" }}>
              📞{" "}
              <b style={{ color: "#000" }}>
                +91 9922695424 | +91 8208030557
              </b>
            </Paragraph>

            <Divider />
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
                  "https://wa.me/919922695424?text=I am interested in Aptitude Test",
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

export default AptitudeDetails;