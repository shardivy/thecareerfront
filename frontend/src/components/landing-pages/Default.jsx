import React from "react";
import { FileSearchOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./landing.css";

const Default = () => {
  const navigate = useNavigate();

  return (
    <div className="law-page">
      <div
        className="law-wrapper"
        style={{
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <div
          className="law-content-card"
          style={{
            maxWidth: 620,
            width: "100%",
            height: "auto",
          }}
        >
          <div
            className="law-scroll"
            style={{
              overflow: "hidden",
              textAlign: "center",
              padding: "60px 36px",
            }}
          >
            <div
              style={{
                width: 90,
                height: 90,
                margin: "0 auto 24px",
                borderRadius: "50%",
                background: "#eef2ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1E40AF",
                fontSize: 42,
              }}
            >
              <FileSearchOutlined />
            </div>

            <h1 className="law-title" style={{ marginBottom: 12 }}>
              No Landing Page Available
            </h1>

            <p
              className="law-tagline"
              style={{
                marginBottom: 18,
                fontSize: 14,
              }}
            >
              This service page has not been added yet.
            </p>

            <p
              className="law-desc"
              style={{
                maxWidth: 480,
                margin: "0 auto 28px",
              }}
            >
              The landing page for this particular service is currently under
              development. Please check again later or contact our team for more
              information regarding this service.
            </p>

            <button
              className="book-btn"
              style={{
                maxWidth: 240,
                width: "100%",
              }}
              onClick={() => navigate(-1)}
            >
              <ArrowLeftOutlined className="btn-icon" />
              Go Back
            </button>

            <div
              className="footer-brand"
              style={{
                justifyContent: "center",
                marginTop: 28,
              }}
            >
              <strong>Abhinav Career Scope</strong> — Perfect Career Guide
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Default;