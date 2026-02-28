// src/components/counsellor/modals/SessionNotesModal.jsx

import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Input,
  Button,
  Divider,
  Tag,
  message,
  Avatar,
  Upload,
} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  DeleteOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

const SessionNotesModal = ({ session, onClose, isViewMode = false }) => {
  const [discussion, setDiscussion] = useState("");
  const [notesMode, setNotesMode] = useState("type");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    if (session) {
      if (session.discussion) {
        setDiscussion(session.discussion);
        setNotesMode("type");
      }

      if (session.uploadedFiles && session.uploadedFiles.length > 0) {
        setUploadedFiles(session.uploadedFiles);
        setNotesMode("upload");
      }
    }
  }, [session]);

  const sessionDataDefault = {
    sessionId: "SES-2026-0012",
    counsellorName: "Dr. Meera Singh",
    studentName: "Rahul Sharma",
    email: "rahul@gmail.com",
    phone: "+91 9876543210",
    date: "25-02-2026",
    time: "03:00 PM - 04:00 PM",
    mode: "Online",
    status: "Completed",
  };

  const sessionData = session
    ? {
        ...sessionDataDefault,
        studentName: session.studentName || sessionDataDefault.studentName,
        email: session.email || sessionDataDefault.email,
        phone: session.phone || sessionDataDefault.phone,
        date: session.date
          ? dayjs(session.date).format("DD-MM-YYYY")
          : sessionDataDefault.date,
        time:
          session.startTime && session.endTime
            ? `${dayjs(session.startTime, "HH:mm").format("hh:mm A")} - 
               ${dayjs(session.endTime, "HH:mm").format("hh:mm A")}`
            : sessionDataDefault.time,
        mode: session.mode || sessionDataDefault.mode,
      }
    : sessionDataDefault;

  /* ================= DOWNLOAD TEXT NOTES ================= */
  const downloadTextNotes = () => {
    const blob = new Blob([discussion], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `Session-${sessionData.sessionId}-Notes.txt`;
    link.click();

    URL.revokeObjectURL(url);
  };

  /* ================= UPLOAD MODE ================= */
  const uploadProps = {
    multiple: true,
    beforeUpload: (file) => {
      const isAllowed =
        file.type === "application/pdf" || file.type.startsWith("image/");

      if (!isAllowed) {
        message.error("Only PDF or image files allowed!");
        return Upload.LIST_IGNORE;
      }

      const fileUrl = URL.createObjectURL(file);

      setUploadedFiles((prev) => [
        ...prev,
        {
          name: file.name,
          url: fileUrl,
          type: file.type,
        },
      ]);

      return false;
    },
    showUploadList: false,
    accept: "application/pdf,image/*",
  };

  const removeFile = (index) => {
    const updated = [...uploadedFiles];
    URL.revokeObjectURL(updated[index].url);
    updated.splice(index, 1);
    setUploadedFiles(updated);
  };

  const handleSave = () => {
    const payload = {
      sessionId: sessionData.sessionId,
      discussion: notesMode === "type" ? discussion : null,
      uploadedFiles: notesMode === "upload" ? uploadedFiles : [],
    };

    console.log("Saved Data:", payload);
    message.success("Session notes saved successfully!");
    onClose();
  };

  return (
    <div style={{ padding: 20 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Session Notes
        </Title>
        <Tag color="green">{sessionData.status}</Tag>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card bordered>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Avatar size={70} icon={<UserOutlined />} />
              <Title level={5} style={{ marginTop: 10 }}>
                {sessionData.studentName}
              </Title>
              <Text type="secondary">{sessionData.email}</Text>
            </div>

            <Divider />

            <Text strong>Phone:</Text>
            <br />
            <Text>{sessionData.phone}</Text>
            <br /><br />

            <Text strong>Counsellor:</Text>
            <br />
            <Text>{sessionData.counsellorName}</Text>
            <br /><br />

            <Text strong>
              <CalendarOutlined /> Date:
            </Text>
            <br />
            <Text>{sessionData.date}</Text>
            <br /><br />

            <Text strong>
              <ClockCircleOutlined /> Time:
            </Text>
            <br />
            <Text>{sessionData.time}</Text>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card bordered>
            <Title level={5}>Key Discussion Points</Title>

            {!isViewMode && (
              <div style={{ marginBottom: 16 }}>
                <Button
                  type={notesMode === "type" ? "primary" : "default"}
                  onClick={() => setNotesMode("type")}
                  style={{ marginRight: 10 }}
                >
                  Type Notes
                </Button>

                <Button
                  type={notesMode === "upload" ? "primary" : "default"}
                  onClick={() => setNotesMode("upload")}
                >
                  Upload PDF / Images
                </Button>
              </div>
            )}

            {/* TEXT MODE */}
            {notesMode === "type" && (
              <>
                {isViewMode && discussion && (
                  <div style={{ marginBottom: 10, textAlign: "right" }}>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={downloadTextNotes}
                    >
                      Download Notes
                    </Button>
                  </div>
                )}

                <TextArea
                  rows={8}
                  value={discussion}
                  readOnly={isViewMode}
                  placeholder="Enter discussion notes..."
                  onChange={(e) => setDiscussion(e.target.value)}
                />
              </>
            )}

            {/* UPLOAD MODE */}
            {notesMode === "upload" && (
              <>
                {!isViewMode && (
                  <>
                    <Divider />
                    <Upload {...uploadProps}>
                      <Button icon={<UploadOutlined />}>
                        Upload Multiple Files
                      </Button>
                    </Upload>
                  </>
                )}

                <div style={{ marginTop: 15 }}>
                  {uploadedFiles.length === 0 && (
                    <Text type="secondary">No files uploaded.</Text>
                  )}

                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "#f6f6f6",
                        padding: "8px 12px",
                        borderRadius: 6,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: "flex", gap: 8 }}>
                        {file.type === "application/pdf" ? (
                          <FilePdfOutlined style={{ color: "red" }} />
                        ) : (
                          <FileImageOutlined style={{ color: "green" }} />
                        )}
                        <span>{file.name}</span>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <Button
                          size="small"
                          onClick={() => window.open(file.url, "_blank")}
                        >
                          Preview
                        </Button>

                        {isViewMode && (
                          <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = file.url;
                              link.download = file.name;
                              link.click();
                            }}
                          >
                            Download
                          </Button>
                        )}

                        {!isViewMode && (
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeFile(index)}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop: 24, textAlign: "right" }}>
              {!isViewMode && (
                <Button
                  type="primary"
                  style={{ marginRight: 10 }}
                  onClick={handleSave}
                >
                  Save
                </Button>
              )}
              <Button onClick={onClose}>Close</Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SessionNotesModal;