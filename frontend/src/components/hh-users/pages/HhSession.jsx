import { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Button,
  Tag,
  Avatar,
  Grid,
  Modal,
  Row,
  Col,
  Space,
  Divider,
  Progress,
  Empty,
  Spin,
  message,
} from "antd";
import {
  CalendarOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  EnvironmentOutlined,
  UserOutlined,
  FileTextOutlined,
  CheckOutlined,
  EyeOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import HhBookSessionModal from "../modals/HhBookSessionModal";
import StudentProfileModal from "../../counsellor/modals/StudentProfileModal";
import SessionNotesModal from "../../counsellor/modals/SessionNotesModal";
import { getStudentProfile } from "../../../adminSlices/profileSlice";
import { fetchCounsellingNote } from "../../../adminSlices/counsellorSlice";
import { getParticipantSessions } from "../../../hhSlices/sessionBookingSlice";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;


// 🔹 Config
const totalSessions = 10;
const bookedSessions = 3;
const completedSessions = 2;

const getStatusTag = (status) => {
  switch (status) {
    case "completed":
      return <Tag color="green">Completed</Tag>;

    case "booked":
      return <Tag color="blue">Booked</Tag>;

    case "not_booked":
      return <Tag color="default">Not Booked</Tag>;

    case "rescheduled":
      return <Tag color="orange">Rescheduled</Tag>;

    case "in_progress":
      return <Tag color="purple">In Progress</Tag>;

    default:
      return <Tag>Locked</Tag>;
  }
};


const getButton = (session, navigate, isMobile, openModal) => {
  const commonProps = {
    block: isMobile,
  };

  switch (session.status) {
    case "completed":
      return null;

    case "booked":
    case "in_progress":
      return (
        <Button
          {...commonProps}
          type="primary"
          onClick={() => navigate(`/session/${session.id}`)}
        >
          Join Session
        </Button>
      );

    case "not_booked":
    case "rescheduled":
      return (
        <Button
          {...commonProps}
          type="primary"
          onClick={() => openModal(session)}
        >
          Book Now
        </Button>
      );

    default:
      return (
        <Button {...commonProps} disabled>
          Locked
        </Button>
      );
  }
};

const HhSession = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const dispatch = useDispatch();

  const isMobile = screens.xs;

  // 🔹 Redux Selectors
  const { studentProfile, loading: profileLoading } = useSelector(
    (state) => state.profile
  );
  const { notes } = useSelector((state) => state.counsellors);

  const { participantSessions, loading } = useSelector(
    (state) => state.sessionBooking
  );

  const participantId = localStorage.getItem("participant_id");
  useEffect(() => {
    if (participantId) {
      dispatch(getParticipantSessions(participantId));
    }
  }, [dispatch, participantId]);

  // 🔹 Generate sessions
  const sessions = participantSessions || [];

  const formattedSessions = sessions.map((item, index) => ({
    id: item.id,
    session_no: item.session_no,   // ✅ ADD THIS
  participant_id: item.participant_id, // ✅ ADD THIS
    title: `Session ${index + 1}`,
    counsellors: {
      lead: item?.lead_counsellor_name || "Not Assigned",
      assistant: item?.assistant_counsellor_name || null,
    },
    date: item?.date || null,
   time:
    item.start_time && item.end_time
      ? `${item.start_time} - ${item.end_time}`
      : null,

    mode: item?.mode || "online",
    status: item?.status || "locked",
    student_id: item?.student_id,
    report_file: item?.report_file || null,

  }));

  // 🔹 Modal States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [profileModal, setProfileModal] = useState(false);
  const [notesModal, setNotesModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [reportLoading, setReportLoading] = useState(true);

  const openBookingModal = (session) => {
    setSelectedSession(session);
    setIsBookingModalOpen(true);
  };

  // 🔹 View Profile Handler
  const handleViewProfile = (session) => {
    dispatch(getStudentProfile(session.student_id))
      .unwrap()
      .then(() => {
        setSelectedSession(session);
        setProfileModal(true);
      })
      .catch(() => message.error("Failed to load student profile"));
  };

  // 🔹 View Report Handler
  const handleViewReport = (session) => {
    setSelectedReport(session);
    setReportLoading(true);
    setReportModal(true);
  };

  // 🔹 View/Add Notes Handler
  const handleViewNotes = (session) => {
    dispatch(fetchCounsellingNote(session.id)).then(() => {
      setSelectedSession(session);
      setNotesModal(true);
    });
  };

  // 🔹 Handle PDF Download
  const handleDownloadReport = async () => {
    if (!selectedReport?.report_file) {
      message.warning("No report file available");
      return;
    }

    setDownloading(true);

    try {
      const response = await fetch(selectedReport.report_file);
      const blob = await response.blob();

      const fileName = selectedReport.title
        ? `${selectedReport.title.replace(/\s+/g, "_")}_Report.pdf`
        : "Report.pdf";

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success("Report downloaded successfully");
      setReportModal(false);
      setSelectedReport(null);
      setReportLoading(true);
    } catch (error) {
      console.error("Download failed:", error);
      message.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      style={{
        padding: isMobile ? 12 : 20,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: 24,
          maxWidth: 500,
          marginInline: "auto",
        }}
      >
        <Title level={isMobile ? 4 : 3}>My Sessions</Title>
        <Text type="colorTextSecondary">
          You can book up to {totalSessions} sessions as part of your journey
        </Text>
      </div>

      <div
        style={{
          marginTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {formattedSessions.map((session) => (
          <Card
            key={session.id}
            style={{
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              opacity: session.status === "locked" ? 0.6 : 1,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <Row justify="space-between" align="middle">
              <Space>
                <Avatar
                  size={48}
                  icon={<VideoCameraOutlined />}
                  style={{
                    backgroundColor:
                      session.status === "completed" ? "#52c41a" :
                        session.status === "booked" ? "#1E40AF" :
                          session.status === "not_booked" ? "#d9d9d9" :
                            session.status === "rescheduled" ? "#fa8c16" :
                              session.status === "in_progress" ? "#722ed1" :
                                "#d9d9d9"
                  }}
                />
                <div>
                  <Text strong style={{ fontSize: 16 }}>{session.title}</Text>
                  <br />
                  {session.counsellors?.lead ? (
                    <div>
                      <Text type="colorTextSecondary" style={{ fontSize: 14 }}>{session.counsellors.lead}</Text>
                      <Tag color="gold" size="small" style={{ marginLeft: 8 }}>Lead</Tag>
                    </div>
                  ) : (
                    <div>
                      <Text type="colorTextSecondary" style={{ fontSize: 14 }}>Not Assigned</Text>
                      <Tag size="small" style={{ marginLeft: 8 }}>Lead</Tag>
                    </div>
                  )}
                  {session.counsellors?.assistant && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="colorTextSecondary" style={{ fontSize: 14 }}>{session.counsellors.assistant}</Text>
                      <Tag color="blue" size="small" style={{ marginLeft: 8 }}>Assistant</Tag>
                    </div>
                  )}
                </div>
              </Space>
              {getStatusTag(session.status)}
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
              <Col xs={24} sm={12} md={6}>
                <Card bordered={false} style={{ backgroundColor: "#f9fafb" }}>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>Date</Text>
                  <br />
                  <Text strong style={{ fontSize: 14 }}>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    {session.date || "Not Scheduled"}
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card bordered={false} style={{ backgroundColor: "#f9fafb" }}>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>Time</Text>
                  <br />
                  <Text strong style={{ fontSize: 14 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {session.time || "N/A"}
                  </Text>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Card bordered={false} style={{ backgroundColor: "#f9fafb" }}>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>Mode</Text>
                  <br />
                  <Text strong style={{ fontSize: 14 }}>
                    {session.mode === "online" ? (
                      <>
                        <VideoCameraOutlined style={{ marginRight: 4 }} />
                        Online
                      </>
                    ) : (
                      <>
                        <EnvironmentOutlined style={{ marginRight: 4 }} />
                        Offline
                      </>
                    )}
                  </Text>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Card bordered={false} style={{ backgroundColor: "#f9fafb" }}>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>Progress</Text>
                  <br />
                  <Text strong style={{ fontSize: 14 }}>
                    <TrophyOutlined style={{ marginRight: 4 }} />
                    {session.id} of {totalSessions}
                  </Text>
                </Card>
              </Col>
            </Row>

            <Divider style={{ margin: "24px 0" }} />

            {/* Action Buttons */}
            <Row
              gutter={[8, 8]}
              wrap={true}
              style={{
                marginBottom: 12,
                flexWrap: isMobile ? "wrap" : "nowrap",
                overflowX: isMobile ? "visible" : "auto"
              }}
            >
              {!isMobile && <Col flex="auto" />}

              <Col xs={24} sm={24} md="0 1 140px" style={isMobile ? {} : { minWidth: 140, maxWidth: 140 }}>
                <Button
                  icon={<UserOutlined />}
                  style={{ width: "100%", whiteSpace: "nowrap", padding: "0 12px" }}
                  onClick={() => handleViewProfile(session)}
                  disabled={session.status === "locked"}
                >
                  View Profile
                </Button>
              </Col>

              <Col xs={24} sm={24} md="0 1 140px" style={isMobile ? {} : { minWidth: 140, maxWidth: 140 }}>
                <Button
                  icon={<EyeOutlined />}
                  style={{ width: "100%", whiteSpace: "nowrap", padding: "0 12px" }}
                  onClick={() => handleViewReport(session)}
                  disabled={session.status === "locked" || !session.report_file}
                >
                  View Report
                </Button>
              </Col>

              <Col xs={24} sm={24} md="0 1 140px" style={isMobile ? {} : { minWidth: 140, maxWidth: 140 }}>
                <Button
                  icon={<FileTextOutlined />}
                  style={{ width: "100%", whiteSpace: "nowrap", padding: "0 12px" }}
                  onClick={() => handleViewNotes(session)}
                  disabled={session.status === "locked"}
                >
                  {session.status === "completed" ? "View Notes" : "Add Notes"}
                </Button>
              </Col>

              {session.status === "booked" && session.mode === "offline" && (
                <Col xs={24} sm={24} md="0 1 140px" style={isMobile ? {} : { minWidth: 140, maxWidth: 140 }}>
                  <Button
                    icon={<EnvironmentOutlined />}
                    style={{ width: "100%", whiteSpace: "nowrap", padding: "0 12px" }}
                    onClick={() => navigate(`/location/${session.id}`)}
                  >
                    View Location
                  </Button>
                </Col>
              )}

              {getButton(session, navigate, false, openBookingModal) && (
                <Col xs={24} sm={24} md="0 1 140px" style={isMobile ? {} : { minWidth: 140, maxWidth: 140 }}>
                  <Button
                    icon={session.status === "booked" ? <VideoCameraOutlined /> : <CheckOutlined />}
                    style={{ width: "100%", whiteSpace: "nowrap", padding: "0 12px" }}
                    type={
                      ["not_booked", "booked", "in_progress", "rescheduled"].includes(session.status)
                        ? "primary"
                        : undefined
                    }
                    onClick={() => {
                      if (session.status === "not_booked") {
                        openBookingModal(session);
                      } else if (session.status === "booked") {
                        window.open("https://us06web.zoom.us/j/78343615915?pwd=ZjU2UnlGNEl3K2JvcHY0WGYyb1ZKQT09", "_blank");
                      }
                    }}
                    disabled={session.status === "locked"}
                  >
                    {session.status === "booked" ? "Join Session" : session.status === "not_booked" ? "Book Now" : ""}
                  </Button>
                </Col>
              )}
            </Row>
          </Card>
        ))}
      </div>

      <HhBookSessionModal
        open={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        session={selectedSession}
        onConfirm={(slot) => {
          console.log("Booked:", selectedSession, slot);

          dispatch(getParticipantSessions(participantId));
        }}
      />

      {/* PROFILE MODAL */}
      <StudentProfileModal
        open={profileModal}
        onClose={() => setProfileModal(false)}
        student={studentProfile}
        loading={profileLoading}
      />

      {/* NOTES MODAL */}
      <Modal
        title={`Session Notes - ${selectedSession?.title || ""}`}
        open={notesModal}
        centered
        onCancel={() => setNotesModal(false)}
        footer={null}
        width={screens.xs ? "95%" : 900}
      >
        <SessionNotesModal
          session={selectedSession}
          onClose={() => setNotesModal(false)}
          isViewMode={!!notes?.[selectedSession?.id]}
        />
      </Modal>

      {/* REPORT MODAL */}
      <Modal
        title={`Report - ${selectedReport?.title || ""}`}
        open={reportModal}
        centered
        onCancel={() => {
          setReportModal(false);
          setSelectedReport(null);
          setReportLoading(true);
        }}
        footer={[
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadReport}
            disabled={!selectedReport?.report_file || downloading}
            loading={downloading}
          >
            {downloading ? "Downloading..." : "Download"}
          </Button>,
          <Button
            key="close"
            onClick={() => {
              setReportModal(false);
              setSelectedReport(null);
              setReportLoading(true);
            }}
          >
            Close
          </Button>,
        ]}
        width={screens.xs ? "95%" : 800}
        style={{ top: 20 }}
      >
        {selectedReport?.report_file ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "500px",
              width: "100%",
              position: "relative",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              overflow: "hidden",
              padding: "10px",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "500px",
                border: "1px solid #e8e8e8",
                borderRadius: "4px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <iframe
                src={`${selectedReport.report_file}#toolbar=0&navpanes=0&scrollbar=0`}
                title="Report Preview"
                width="100%"
                height="100%"
                style={{
                  border: "none",
                  backgroundColor: "#fff",
                }}
                onLoad={() => setReportLoading(false)}
                onError={() => {
                  setReportLoading(false);
                  message.error("Failed to load report. You can download it instead.");
                }}
              />
            </div>
            {reportLoading && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  padding: "20px",
                  borderRadius: "8px",
                  zIndex: 1,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <Spin size="large" />
                <p style={{ marginTop: 16, marginBottom: 0 }}>Loading report...</p>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              minHeight: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Empty description="No report available for this session" />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HhSession;