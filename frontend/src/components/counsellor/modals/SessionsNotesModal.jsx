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
  FileImageOutlined,
  FilePdfOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";

import {
  createCounsellingNote,
  updateCounsellingNote,
  deleteCounsellingFile,
} from "../../../adminSlices/counsellorSlice";

import jsPDF from "jspdf";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const SessionsNotesModal = ({
  session,
  onClose,
  isViewMode = false,
  hideSessionDetails = false,
  showStudentName = false,
   showActions = true,
}) => {
  const screens = useBreakpoint();

  const [discussion, setDiscussion] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [editMode, setEditMode] = useState(false);

  const dispatch = useDispatch();

  const notesState = useSelector((state) => state.counsellors.notes || {});

  /* LOAD NOTES */

  useEffect(() => {
    if (session?.id && notesState[session.id]) {
      const note = notesState[session.id];

      setDiscussion(note.notes || "");

      const filesArray = note.file_urls || [];

      setUploadedFiles(
        filesArray.map((file, index) => ({
          name: file.url.split("/").pop() || `File-${index + 1}`,
          url: file.url,
type:
  file.url.endsWith(".pdf")
    ? "application/pdf"
    : file.url.match(/\.(jpg|jpeg|png|gif)$/i)
    ? "image/*"
    : file.url.match(/\.(doc|docx)$/i)
    ? "word"
    : file.url.match(/\.(xls|xlsx)$/i)
    ? "excel"
    : "other",
          key: file.key,
        }))
      );

      setEditMode(!isViewMode);
    } else {
      setDiscussion("");
      setUploadedFiles([]);
      setEditMode(!isViewMode);
    }
  }, [notesState, session]);

  /* SESSION DATA */

  const sessionData = session
    ? {
      studentName: session.studentName || "N/A",
      email: session.studentEmail || "N/A",
      phone: session.studentPhone || "N/A",
      counsellorName: session.counsellorName || "N/A",
      date: session.date
        ? dayjs(session.date).format("DD-MM-YYYY")
        : "N/A",
      time: session.slot_time || `${session.startTime} - ${session.endTime}`,
      status: session.status || "N/A",
      id: session.id,
    }
    : {};

  const noteExists =
    !!notesState?.[session?.id]?.notes?.trim() ||
    (notesState?.[session?.id]?.file_urls?.length || 0) > 0;

  /* DOWNLOAD NOTES PDF */

  const downloadTextNotes = () => {
    const pdf = new jsPDF();

    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(16);
    pdf.text("Session Notes", pageWidth / 2, 20, { align: "center" });

    pdf.setFontSize(12);

    pdf.text(`Session ID: ${sessionData.id}`, 10, 40);
    pdf.text(`Student: ${sessionData.studentName}`, 10, 50);
    pdf.text(`Counsellor: ${sessionData.counsellorName}`, 10, 60);
    pdf.text(`Date: ${sessionData.date}`, 10, 70);
    pdf.text(`Time: ${sessionData.time}`, 10, 80);

    pdf.text("Discussion:", 10, 100);

    const splitText = pdf.splitTextToSize(
      discussion || "No notes added",
      180
    );

    pdf.text(splitText, 10, 110);

    pdf.save(`Session-${sessionData.id}-Notes.pdf`);
  };

  /* FILE DOWNLOAD */

  const handleDownloadFile = async (url, name) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = name || "file";

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      message.error("Failed to download file");
    }
  };

  /* FILE UPLOAD */

  const uploadProps = {
    multiple: true,

    beforeUpload: (file) => {
    const isAllowed =
  file.type === "application/pdf" ||
  file.type.startsWith("image/") ||

  // Word
  file.type === "application/msword" ||
  file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||

  // Excel
  file.type === "application/vnd.ms-excel" ||
  file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      if (!isAllowed) {
        message.error("Only PDF, Image, Word, and Excel files allowed!");
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
    accept: "application/pdf,image/*,.doc,.docx,.xls,.xlsx",
  };

  /* SAVE NOTES */

  const handleSave = async () => {
    const formData = new FormData();

    formData.append("notes", discussion);

    uploadedFiles.slice(0, 5).forEach((file, index) => {
      if (file.originFileObj) {
        formData.append(`file${index + 1}`, file.originFileObj);
      }
    });

    const existingNote = notesState?.[session?.id];

    try {
      if (existingNote?.id) {
        await dispatch(
          updateCounsellingNote({
            bookingId: session.id,
            noteId: existingNote.id,
            payload: formData,
          })
        ).unwrap();

        message.success("Notes updated successfully");
      } else {
        await dispatch(
          createCounsellingNote({
            bookingId: session.id,
            payload: formData,
          })
        ).unwrap();

        message.success("Notes saved successfully");
      }

      onClose();
    } catch {
      message.error("Failed to save notes");
    }
  };

  return (
    <div style={{ padding: screens.xs ? 10 : 20 }}>

      {/* HEADER */}

      <Row
        justify="space-between"
        align="middle"
        wrap
        style={{ marginBottom: 16, gap: screens.xs ? 8 : 0 }}
      >
        <Title
          level={screens.xs ? 5 : 4}
          style={{ margin: 0, wordBreak: "break-word" }}
        >
          Session Notes
          {showStudentName && sessionData.studentName
            ? ` (${sessionData.studentName})`
            : ""}
        </Title>

        <Tag color="green">{sessionData.status}</Tag>
      </Row>

      <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>
        <Row gutter={[16, 16]}>

          {/* LEFT PANEL */}

          {!hideSessionDetails && (
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

                  <Text type="secondary">{sessionData.email}</Text>
                </div>

                <Divider />

                <Space direction="vertical">

                  <div>
                    <Text strong>Mobile:</Text>
                    <br />
                    {sessionData.phone}
                  </div>

                  <div>
                    <Text strong>Counsellor:</Text>
                    <br />
                    {sessionData.counsellorName}
                  </div>

                  <div>
                    <CalendarOutlined /> {sessionData.date}
                  </div>

                  <div>
                    <ClockCircleOutlined /> {sessionData.time}
                  </div>

                </Space>

              </Card>
            </Col>
          )}

          {/* RIGHT PANEL */}

          <Col xs={24} md={hideSessionDetails ? 24 : 16}>
            <Card bordered>

              <Title level={5}>Discussion Notes</Title>

              {noteExists && (
                <div style={{ textAlign: "right", marginBottom: 10 }}>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={downloadTextNotes}
                  >
                    Download Notes
                  </Button>
                </div>
              )}

              {isViewMode ? (
                <div
                  style={{
                    background: "#fafafa",
                    border: "1px solid #f0f0f0",
                    borderRadius: 6,
                    padding: screens.xs ? 10 : 12,
                    minHeight: 120,
                    fontSize: screens.xs ? 13 : 14,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {discussion || "No notes added"}
                </div>
              ) : (
                <TextArea
                  rows={8}
                  value={discussion}
                  placeholder="Enter discussion notes..."
                  onChange={(e) => setDiscussion(e.target.value)}
                />
              )}

              {!isViewMode && (
                <>
                  <Divider />

                  <Upload {...uploadProps}>
                    <Button
                      icon={<UploadOutlined />}
                      block={screens.xs}
                    >
                      Upload PDF / Images
                    </Button>
                  </Upload>
                </>
              )}

              {/* FILE LIST */}

              <div style={{ marginTop: 15 }}>

                {uploadedFiles.length === 0 && isViewMode && (
                  <Empty description="No files uploaded" />
                )}

                {uploadedFiles.map((file, index) => (

                  <div
                    key={index}
                    style={{
                      display: "flex",
                      flexDirection: screens.xs ? "column" : "row",
                      alignItems: screens.xs ? "flex-start" : "center",
                      justifyContent: "space-between",
                      background: "#f6f6f6",
                      padding: 10,
                      borderRadius: 6,
                      marginBottom: 8,
                      gap: 8,
                    }}
                  >

                    <div style={{ display: "flex", gap: 8 }}>
                      {file.type === "application/pdf" ? (
                        <FilePdfOutlined style={{ color: "red" }} />
                      ) : (
                        <FileImageOutlined style={{ color: "green" }} />
                      )}

                      <span style={{ wordBreak: "break-all" }}>
                        {file.name}
                      </span>
                    </div>

                    <Space wrap>

                      <Button
                        size="small"
                        onClick={() => window.open(file.url)}
                      >
                        Preview
                      </Button>

                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() =>
                          handleDownloadFile(file.url, file.name)
                        }
                      >
                        Download
                      </Button>

                    </Space>

                  </div>
                ))}

              </div>

              {/* ACTION BUTTONS */}

              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >

                {/* {(!isViewMode || editMode || !noteExists) && ( */}
                {showActions && (!isViewMode || editMode || !noteExists) && (
                  <Button
                    type="primary"
                    onClick={handleSave}
                  >
                    {noteExists ? "Update Notes" : "Add Notes"}
                  </Button>
                )}

                <Button onClick={onClose}>Close</Button>

              </div>

            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default SessionsNotesModal;