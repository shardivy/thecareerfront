import React, { useEffect } from "react";
import { Button, Grid } from "antd";
import { DownloadOutlined, LockOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { getParticipantCertificate } from "../../../hhSlices/certificateSlice";
import axiosInstance from "../../../axiosInstance";

const { useBreakpoint } = Grid;

const HhCertificates = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const dispatch = useDispatch();

  const { participantCertificate } = useSelector((state) => state.certificate);

  useEffect(() => {
    const participantId = localStorage.getItem("participant_id");

    if (participantId) {
      dispatch(getParticipantCertificate(participantId));
    }
  }, [dispatch]);

  const certificateList = Array.isArray(participantCertificate)
    ? participantCertificate
    : participantCertificate?.data || [];

  const certificateData = certificateList.length > 0 ? certificateList[0] : null;
  const hasCertificate = Boolean(certificateData);
const isUnlocked =
  hasCertificate && certificateData?.certificate_status === "issued";
const isLocked =
  !certificateData || certificateData?.certificate_status === "pending";

  const getCertificateFileUrl = (fileUrl) => {
    if (!fileUrl) return null;

    if (/^https?:\/\//i.test(fileUrl)) {
      return fileUrl;
    }

    const apiBaseUrl = axiosInstance.defaults.baseURL?.replace(/\/api\/?$/, "/");
    return apiBaseUrl ? new URL(fileUrl, apiBaseUrl).toString() : fileUrl;
  };

  const certificate = {
    name: localStorage.getItem("userName") || "Participant",
    course: certificateData?.program_type || "Handholding Program Completion",
    issuedBy: "Abhinav Career Scope",
    date: certificateData?.issued_at
      ? new Date(certificateData.issued_at).toLocaleDateString("en-IN")
      : "-",
    id: certificateData?.id || "-",
    file: getCertificateFileUrl(certificateData?.certificate_file),
  };

  const infoCardStyle = {
    flex: 1,
    minWidth: isMobile ? "100%" : "180px",
    padding: isMobile ? "12px 14px" : "14px 16px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.78)",
    border: "1px solid rgba(16, 24, 40, 0.08)",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
    backdropFilter: "blur(8px)",
  };

  const handleDownload = async () => {
    if (!certificate.file) {
      window.print();
      return;
    }

    try {
      const response = await fetch(certificate.file);
      if (!response.ok) {
        throw new Error("Unable to download certificate");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      let extension = "jpg";
      try {
        const parsed = new URL(certificate.file, window.location.origin);
        const path = parsed.pathname;
        const ext = path.substring(path.lastIndexOf(".") + 1);
        if (ext) extension = ext;
      } catch {
        // fallback if URL parsing fails
      }

      link.href = blobUrl;
      link.download = `certificate-${certificate.id || "download"}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(error);
      window.open(certificate.file, "_blank");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: isMobile ? "18px 14px 28px" : "38px 24px 136px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      //   background:
      //     "radial-gradient(circle at top, rgba(24,144,255,0.14), transparent 32%), linear-gradient(180deg, #f7fbff 0%, #eef5ec 100%)",
       }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "980px",
        }}
      >
        <div
          style={{
            width: "100%",
            padding: isMobile ? "18px" : "28px",
            borderRadius: "28px",
            background:
              "linear-gradient(140deg, rgba(255,255,255,0.96), rgba(245,250,255,0.92))",
            border: "1px solid rgba(24, 144, 255, 0.12)",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
            filter: isUnlocked ? "none" : "blur(4px)",
            opacity: isUnlocked ? 1 : 0.6,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
              justifyContent: "space-between",
              gap: isMobile ? 18 : 28,
              marginBottom: 24,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "7px 12px",
                  borderRadius: 999,
                  background: "rgba(24,144,255,0.1)",
                  color: "#0958d9",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Achievement Certificate
              </div>

              <h1
                style={{
                  margin: "14px 0 10px",
                  fontSize: isMobile ? "28px" : "30px",
                  lineHeight: 1.1,
                  color: "#102a43",
                }}
              >
                Your certificate is ready to showcase.
              </h1>

              {/* <p
                style={{
                  margin: 0,
                  maxWidth: "560px",
                  fontSize: isMobile ? 14 : 15,
                  lineHeight: 1.7,
                  color: "#486581",
                }}
              >
                The preview is framed for a portrait layout so the certificate feels more
                premium and easier to read.
              </p> */}
            </div>

            <div
              style={{
                alignSelf: isMobile ? "stretch" : "flex-start",
                padding: "10px 14px",
                borderRadius: "16px",
                background: isUnlocked ? "#f6ffed" : "#fff2f0",
                border: `1px solid ${isUnlocked ? "#b7eb8f" : "#ffccc7"}`,
                color: isUnlocked ? "#237804" : "#cf1322",
                fontWeight: 600,
                fontSize: 14,
                textAlign: "center",
                minWidth: isMobile ? "100%" : "170px",
              }}
            >
{certificateData?.certificate_status === "issued"
  ? "Unlocked and downloadable"
  : "Locked until completion"}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 18 : 24,
              alignItems: isMobile ? "stretch" : "flex-start",
            }}
          >
            <div
              style={{
                flex: isMobile ? "none" : "0 0 360px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: isMobile ? "320px" : "360px",
                  padding: isMobile ? "10px" : "14px",
                  borderRadius: "24px",
                  background:
                    "linear-gradient(180deg, #fffef8 0%, #ffffff 18%, #f6fbff 100%)",
                  border: "1px solid rgba(24, 144, 255, 0.15)",
                  boxShadow:
                    "0 18px 44px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    padding: isMobile ? "12px" : "14px",
                    borderRadius: "18px",
                    background:
                      "linear-gradient(135deg, rgba(24,144,255,0.1), rgba(115,209,61,0.1))",
                    border: "1px solid rgba(24, 144, 255, 0.1)",
                  }}
                >
                  {certificate.file ? (
                    <img
                      src={certificate.file}
                      alt="Certificate"
                      style={{
                        width: "100%",
                        height: isMobile ? "400px" : "470px",
                        objectFit: "contain",
                        borderRadius: "14px",
                        display: "block",
                        margin: "0 auto",
                        background: "#ffffff",
                        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: isMobile ? "400px" : "470px",
                        borderRadius: "14px",
                        background: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "24px 18px",
                        textAlign: "center",
                        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                      }}
                    >
                      <h2
                        style={{
                          margin: "0 0 12px",
                          fontSize: isMobile ? 24 : 28,
                          color: "#102a43",
                        }}
                      >
                        Certificate of Completion
                      </h2>
                      <p style={{ margin: "0 0 8px", color: "#486581" }}>Presented to</p>
                      <h3 style={{ margin: "0 0 12px", color: "#0958d9" }}>
                        {certificate.name}
                      </h3>
                      <p style={{ margin: "0 0 12px", color: "#486581" }}>
                        for successfully completing
                      </p>
                      <strong style={{ color: "#102a43" }}>{certificate.course}</strong>
                      <p style={{ margin: "20px 0 0", fontSize: 13, color: "#6b7280" }}>
                        Certificate ID: {certificate.id}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 14,
                }}
              >
                <div style={infoCardStyle}>
                  <div style={{ fontSize: 12, color: "#829ab1", marginBottom: 6 }}>
                    Participant
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#102a43" }}>
                    {certificate.name}
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <div style={{ fontSize: 12, color: "#829ab1", marginBottom: 6 }}>
                    Issued On
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#102a43" }}>
                    {certificate.date}
                  </div>
                </div>
              </div>

              <div style={infoCardStyle}>
                <div style={{ fontSize: 12, color: "#829ab1", marginBottom: 6 }}>
                  Program
                </div>
                <div
                  style={{
                    fontSize: isMobile ? 17 : 19,
                    fontWeight: 700,
                    color: "#102a43",
                    textTransform: "capitalize",
                  }}
                >
                Hand Holding Program 
                </div>
              </div>

              <div style={infoCardStyle}>
                <div style={{ fontSize: 12, color: "#829ab1", marginBottom: 6 }}>
                  Issued By
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#102a43" }}>
                  {certificate.issuedBy}
                </div>
              </div>

              {/* <div style={infoCardStyle}>
                <div style={{ fontSize: 12, color: "#829ab1", marginBottom: 6 }}>
                  Certificate ID
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#0958d9",
                    wordBreak: "break-word",
                  }}
                >
                  {certificate.id}
                </div>
              </div> */}

              <div
                style={{
                  padding: isMobile ? "14px" : "16px 18px",
                  borderRadius: "18px",
                  background: "linear-gradient(135deg, #e6f4ff, #f6ffed)",
                  border: "1px solid rgba(24, 144, 255, 0.12)",
                  color: "#334e68",
                  lineHeight: 1.7,
                }}
              >
                This portrait preview keeps the certificate as the hero element while the
                important details stay neat and easy to scan.
              </div>

               <div
        style={{
          width: "100%",
          maxWidth: "980px",
          display: "flex",
          justifyContent: isMobile ? "stretch" : "flex-end",
          marginTop: 18,
        }}
      >
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
      disabled={certificateData?.certificate_status !== "issued"}
          style={{
            height: 46,
            paddingInline: 22,
            borderRadius: 14,
            width: isMobile ? "100%" : "auto",
            background: "linear-gradient(90deg, #1677ff, #52c41a)",
            border: "none",
            boxShadow: "0 12px 24px rgba(22, 119, 255, 0.22)",
            fontWeight: 600,
          }}
        >
          Download Certificate
        </Button>
      </div>
            </div>
          </div>
        </div>

{isLocked && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              background: "rgba(255,255,255,0.78)",
              backdropFilter: "blur(6px)",
              borderRadius: "28px",
              textAlign: "center",
              padding: "24px",
            }}
          >
            <LockOutlined style={{ fontSize: 60, color: "#ff4d4f" }} />
            <h2 style={{ marginBottom: 8 }}>Certificate Locked</h2>
            <p style={{ maxWidth: 320, margin: 0 }}>
              Complete the sessions to unlock your portrait certificate preview.
            </p>
          </div>
        )}
      </div>

      {/* <div
        style={{
          width: "100%",
          maxWidth: "980px",
          display: "flex",
          justifyContent: isMobile ? "stretch" : "flex-end",
          marginTop: 18,
        }}
      >
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          disabled={!isUnlocked}
          style={{
            height: 46,
            paddingInline: 22,
            borderRadius: 14,
            width: isMobile ? "100%" : "auto",
            background: "linear-gradient(90deg, #1677ff, #52c41a)",
            border: "none",
            boxShadow: "0 12px 24px rgba(22, 119, 255, 0.22)",
            fontWeight: 600,
          }}
        >
          Download Certificate
        </Button>
      </div> */}
    </div>
  );
};

export default HhCertificates;
