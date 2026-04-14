import React from "react";
import { Button, Grid } from "antd";
import { DownloadOutlined, LockOutlined } from "@ant-design/icons";

const { useBreakpoint } = Grid;

const HhCertificates = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const isUnlocked = false; // Change to false to simulate locked state

  const certificate = {
    name: "Your Name",
    course: "HandHolding Program Completion",
    issuedBy: "ABCD Institute",
    date: "March 2026",
    id: "HH-2026-001",
  };

  const handleDownload = () => {
    if (isUnlocked) window.print();
  };

  return (
    <div
      style={{
        padding: isMobile ? "16px" : "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        flexDirection: "column",
        marginTop: isMobile ? "-10px" : "-50px",
      }}
    >
      {/* Wrapper */}
      <div style={{ position: "relative", width: "100%", maxWidth: "1000px" }}>
        
        {/* Certificate */}
        <div
          style={{
            width: "100%",
            padding: isMobile ? "20px" : "50px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #e6f7ff, #ffffff)",
            border: "6px solid",
            borderImage: "linear-gradient(45deg, #1890ff, #73d13d) 1",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            filter: isUnlocked ? "none" : "blur(4px)",
            opacity: isUnlocked ? 1 : 0.6,
          }}
        >
          {/* Title */}
          <h1 style={{ fontSize: isMobile ? "24px" : "40px" }}>
            🎓 Certificate of Completion
          </h1>

          <p style={{ fontSize: isMobile ? "14px" : "18px" }}>
            This is proudly presented to
          </p>

          {/* Name */}
          <h2
            style={{
              fontSize: isMobile ? "22px" : "38px",
              color: "#1890ff",
              margin: "10px 0",
            }}
          >
            {certificate.name}
          </h2>

          <p style={{ fontSize: isMobile ? "14px" : "18px" }}>
            for successfully completing the course
          </p>

          {/* Course */}
          <h3 style={{ fontSize: isMobile ? "18px" : "26px" }}>
            {certificate.course}
          </h3>

          <p style={{ fontSize: "13px", color: "#777" }}>
            Certificate ID: {certificate.id}
          </p>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: isMobile ? "20px" : "0",
              marginTop: "50px",
              padding: isMobile ? "0" : "0 40px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #000", width: "120px" }} />
              <p>Instructor</p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #000", width: "120px" }} />
              <p>{certificate.date}</p>
            </div>
          </div>

          {/* Issuer */}
          <p
            style={{
              marginTop: "30px",
              fontWeight: "bold",
              fontSize: isMobile ? "14px" : "16px",
            }}
          >
            Issued by {certificate.issuedBy}
          </p>
        </div>

        {/* 🔒 Overlay */}
        {!isUnlocked && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              background: "rgba(255,255,255,0.7)",
              borderRadius: "20px",
              textAlign: "center",
              padding: "20px",
            }}
          >
            <LockOutlined
              style={{
                fontSize: isMobile ? "40px" : "60px",
                color: "#ff4d4f",
              }}
            />
            <h2 style={{ marginTop: "10px", fontSize: isMobile ? "18px" : "24px" }}>
              Certificate Locked
            </h2>
            <p style={{ fontSize: isMobile ? "13px" : "16px", color: "#555" }}>
              Complete the sessions to unlock your certificate
            </p>
          </div>
        )}
      </div>

      {/* Button */}
      <Button
        type="primary"
        size={isMobile ? "middle" : "large"}
        icon={<DownloadOutlined />}
        onClick={handleDownload}
        disabled={!isUnlocked}
        style={{ marginTop: "20px", width: isMobile ? "100%" : "auto" }}
      >
        Download Certificate
      </Button>
    </div>
  );
};

export default HhCertificates;