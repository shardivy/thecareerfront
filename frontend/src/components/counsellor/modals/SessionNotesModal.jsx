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
  Empty,
  Grid,
  Space,
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
import { useDispatch, useSelector } from "react-redux";
import {
  createCounsellingNote,
  fetchCounsellingNote,
} from "../../../adminSlices/counsellorSlice";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const SessionNotesModal = ({ session, onClose, isViewMode = false, hideSessionDetails = false, }) => {
  const screens = useBreakpoint();

  const [discussion, setDiscussion] = useState("");
  const [notesMode, setNotesMode] = useState("type");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const dispatch = useDispatch();
  const notesState = useSelector((state) => state.counsellors.notes || {});

  /* LOAD NOTES */
  useEffect(() => {
    if (isViewMode && session?.id && notesState[session.id]) {
      const note = notesState[session.id];

      setDiscussion(note.notes || "");

      setUploadedFiles(
        (note.uploadedFiles || []).map((url, idx) => ({
          name: `File-${idx + 1}`,
          url,
          type: url?.endsWith(".pdf")
            ? "application/pdf"
            : "image/*",
        }))
      );

      setNotesMode(
        note.uploadedFiles && note.uploadedFiles.length > 0
          ? "upload"
          : "type"
      );
    }
  }, [notesState, session, isViewMode]);

  useEffect(() => {
    if (session?.id && isViewMode) {
      if (!notesState[session.id]) {
        dispatch(fetchCounsellingNote(session.id));
      }
    }
  }, [session, isViewMode, dispatch, notesState]);

  const sessionData = session
    ? {
      studentName: session.studentName || "N/A",
      email: session.studentEmail || "N/A",
      phone: session.studentPhone || "N/A",
      counsellorName: session.counsellorName || "N/A",
      date: session.date
        ? dayjs(session.date).format("DD-MM-YYYY")
        : "N/A",
      time:
        session.slot_time ||
        `${session.startTime} - ${session.endTime}`,
      status: session.status || "N/A",
      id: session.id,
    }
    : {};

  const noteExists =
    discussion?.trim()?.length > 0 || uploadedFiles.length > 0;

  const downloadTextNotes = () => {
    const blob = new Blob([discussion], {
      type: "text/plain;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Session-${sessionData.id}-Notes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const uploadProps = {
    multiple: true,
    beforeUpload: (file) => {
      const isAllowed =
        file.type === "application/pdf" ||
        file.type.startsWith("image/");

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
          originFileObj: file,
        },
      ]);

      return false;
    },
    showUploadList: false,
    accept: "application/pdf,image/*",
  };

  const handleSave = async () => {
    if (!session?.id) {
      message.error("Session ID missing");
      return;
    }

    const formData = new FormData();
    if (discussion) formData.append("notes", discussion);

    uploadedFiles.forEach((fileObj) => {
      if (fileObj.originFileObj) {
        formData.append("files", fileObj.originFileObj);
      }
    });

    try {
      await dispatch(
        createCounsellingNote({
          bookingId: session.id,
          payload: formData,
        })
      ).unwrap();

      message.success("Session notes saved successfully!");
      onClose();
    } catch (error) {
      message.error(error || "Failed to save notes");
    }
  };

  return (
    <div style={{ padding: screens.xs ? 10 : 20 }}>
      {/* HEADER */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 16 }}
      >
        <Title level={screens.xs ? 5 : 4} style={{ margin: 0 }}>
          Session Notes
        </Title>
        <Tag color="green">{sessionData.status}</Tag>
      </Row>

      <Row gutter={[16, 16]}>
        {/* LEFT PANEL */}

        {!hideSessionDetails ? (
          // ✅ Normal full details (counsellor page)
          <Col xs={24} md={8}>
            <Card bordered>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <Avatar
                  size={screens.xs ? 60 : 80}
                  icon={<UserOutlined />}
                />
                <Title level={5} style={{ marginTop: 10 }}>
                  {sessionData.studentName}
                </Title>
                <Text type="colorTextSecondary">{sessionData.email}</Text>
              </div>

              <Divider />

              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <div>
                  <Text strong>Mobile Number:</Text>
                  <br />
                  <Text>{sessionData.phone}</Text>
                </div>

                <div>
                  <Text strong>Counsellor:</Text>
                  <br />
                  <Text>{sessionData.counsellorName}</Text>
                </div>

                <div>
                  <Text strong>
                    <CalendarOutlined /> Date:
                  </Text>
                  <br />
                  <Text>{sessionData.date}</Text>
                </div>

                <div>
                  <Text strong>
                    <ClockCircleOutlined /> Time:
                  </Text>
                  <br />
                  <Text>{sessionData.time}</Text>
                </div>
              </Space>
            </Card>
          </Col>
        ) : (
          // ✅ SlotBooking mode → Only show student name
          <Col xs={24}>
            <Card bordered style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>
                User Name: {sessionData.studentName}
              </Title>
            </Card>
          </Col>
        )}

        {/* RIGHT PANEL */}
        <Col xs={24} md={hideSessionDetails ? 24 : 16}>
          <Card bordered>
            <Title level={5}>Key Discussion Points</Title>

            {!isViewMode && (
              <Space
                direction={screens.xs ? "vertical" : "horizontal"}
                style={{ marginBottom: 16 }}
              >
                <Button
                  block={screens.xs}
                  type={notesMode === "type" ? "primary" : "default"}
                  onClick={() => setNotesMode("type")}
                >
                  Type Notes
                </Button>

                <Button
                  block={screens.xs}
                  type={notesMode === "upload" ? "primary" : "default"}
                  onClick={() => setNotesMode("upload")}
                >
                  Upload PDF / Images
                </Button>
              </Space>
            )}

            {notesMode === "type" && (
              <>
                {isViewMode && !noteExists && (
                  <Empty description="Session notes not added yet" />
                )}

                {isViewMode && noteExists && discussion && (
                  <div style={{ marginBottom: 10, textAlign: "right" }}>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={downloadTextNotes}
                    >
                      Download Notes
                    </Button>
                  </div>
                )}

                {!isViewMode || noteExists ? (
                  <TextArea
                    rows={screens.xs ? 6 : 8}
                    value={discussion}
                    readOnly={isViewMode}
                    placeholder="Enter discussion notes..."
                    onChange={(e) =>
                      setDiscussion(e.target.value)
                    }
                  />
                ) : null}
              </>
            )}

            {notesMode === "upload" && (
              <>
                {!isViewMode && (
                  <>
                    <Divider />
                    <Upload {...uploadProps}>
                      <Button
                        block={screens.xs}
                        icon={<UploadOutlined />}
                      >
                        Upload Multiple Files
                      </Button>
                    </Upload>
                  </>
                )}

                <div style={{ marginTop: 15 }}>
                  {uploadedFiles.length === 0 && isViewMode && (
                    <Empty description="Session notes not added yet" />
                  )}

                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        flexDirection: screens.xs
                          ? "column"
                          : "row",
                        justifyContent: "space-between",
                        gap: 8,
                        background: "#f6f6f6",
                        padding: 10,
                        borderRadius: 6,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: "flex", gap: 8 }}>
                        {file.type === "application/pdf" ? (
                          <FilePdfOutlined
                            style={{ color: "red" }}
                          />
                        ) : (
                          <FileImageOutlined
                            style={{ color: "green" }}
                          />
                        )}
                        <span>{file.name}</span>
                      </div>

                      <Space
                        direction={screens.xs ? "vertical" : "horizontal"}
                        style={{
                          width: screens.xs ? "100%" : "auto",
                        }}
                      >
                        <Button
                          block={screens.xs}
                          size="small"
                          onClick={() =>
                            window.open(file.url, "_blank")
                          }
                        >
                          Preview
                        </Button>

                        {isViewMode && (
                          <Button
                            block={screens.xs}
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
                      </Space>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop: 24 }}>
              <Space
                direction={screens.xs ? "vertical" : "horizontal"}
                style={{ width: "100%" }}
              >
                {!isViewMode && (
                  <Button
                    block={screens.xs}
                    type="primary"
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                )}
                <Button
                  block={screens.xs}
                  onClick={onClose}
                >
                  Close
                </Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SessionNotesModal;