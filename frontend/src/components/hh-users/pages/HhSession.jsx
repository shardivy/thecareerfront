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
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import HhBookSessionModal from "../modals/HhBookSessionModal";
import StudentProfileModal from "../../counsellor/modals/StudentProfileModal";
import SessionNotesModal from "../../counsellor/modals/SessionNotesModal";
import { getStudentProfile } from "../../../adminSlices/profileSlice";
import { fetchCounsellingNote } from "../../../adminSlices/counsellorSlice";
import { getParticipantSessions } from "../../../hhSlices/sessionBookingSlice";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import HhSessionNotesModal from "../modals/HhSessionNotesModal";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

dayjs.extend(customParseFormat);


// 🔹 Config
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

const getSessionStartDateTime = (session) => {
  if (!session?.rawDate || !session?.startTime) return null;

  const sessionDate = dayjs(session.rawDate);
  if (!sessionDate.isValid()) return null;

  const startDateTime = dayjs(
    `${sessionDate.format("YYYY-MM-DD")} ${session.startTime}`,
    "YYYY-MM-DD hh:mm A"
  );

  return startDateTime.isValid() ? startDateTime : null;
};

const canJoinSessionNow = (session, now) => {
  const startDateTime = getSessionStartDateTime(session);
  if (!startDateTime) return false;

  const joinWindowStart = startDateTime.subtract(15, "minute");
  return now.isAfter(joinWindowStart) || now.isSame(joinWindowStart);
};

const HhSession = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const dispatch = useDispatch();
  const [currentTime, setCurrentTime] = useState(dayjs());

  const isMobile = screens.xs;

  // 🔹 Redux Selectors
  const { studentProfile, loading: profileLoading } = useSelector(
    (state) => state.profile
  );
  const { notes } = useSelector((state) => state.counsellors);

  const { participantSessions, totalSessions, loading } = useSelector(
    (state) => state.sessionBooking
  );




  const participantId = localStorage.getItem("participant_id");
  useEffect(() => {
    if (participantId) {
      dispatch(getParticipantSessions(participantId));
    }
  }, [dispatch, participantId]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(dayjs());
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // 🔹 Generate sessions
  const sessions = participantSessions || [];
  const showProfile = JSON.parse(localStorage.getItem("show_profile")) || false;


  const formattedSessions = sessions.map((item, index) => {
    const counsellorsArray = item.counsellors || [];

    const leadCounsellor = counsellorsArray.find(c => c.role === "lead");
    const assistantCounsellor = counsellorsArray.find(c => c.role === "assistant");

    return {
      id: item.session_id ?? item.id,
      session_no: item.session_no,
      participant_id: item.participant_id,
      booking_id: item.booking_id,

      studentName: item.student_name,
      studentEmail: item.student_email || "N/A",
      studentPhone: item.student_phone || "N/A",

      startTime: item.start_time || null,
      endTime: item.end_time || null,

      time: item.start_time || "N/A",

      title: `Session ${index + 1}`,

      counsellors: {
        lead: leadCounsellor?.counsellor_name || null,
        assistant: assistantCounsellor?.counsellor_name || null,
      },

      counsellor: item.counsellors || [],

      date:
        item?.date && dayjs(item.date).isValid()
          ? dayjs(item.date).format("DD-MM-YYYY")
          : "Not Scheduled",

      rawDate: item?.date || null,

      mode: item?.mode || null,
      status: item?.status || "locked",
      student_id: item?.student_id || item?.id,
      report_file: item?.report_file || null,
      report_file_name: item?.report_file_name || null,

      show_profile:
        item?.show_profile === true ||
        item?.show_profile === "true",

      programId: item?.program?.id || null,
      programName: item?.program?.name || null,

      packageId: item?.package?.id || null,
      packageName: item?.package?.name || null,
    };
  });

  // 🔹 Modal States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [profileModal, setProfileModal] = useState(false);
  const [notesModal, setNotesModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [reportLoading, setReportLoading] = useState(true);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const openGoogleMap = () => {
    window.open(
      "https://maps.google.com/?q=Abhinav+Career+Scope+Bavdhan+Pune",
      "_blank"
    );
  };

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
    const bookingId = session.booking_id;

    dispatch(fetchCounsellingNote(bookingId))
      .unwrap()
      .then(() => {
        setSelectedSession({
          ...session,
          booking_id: bookingId, // IMPORTANT normalization
        });
        setNotesModal(true);
      })
      .catch(() => message.error("Failed to load notes"));
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

      const fileName =
        selectedReport?.report_file_name ||
        selectedReport?.report_file?.split("/").pop() ||
        "Report";

      const url = window.URL.createObjectURL(
        new Blob([blob])
      );

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
    } catch (error) {
      console.error(error);
      message.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };


  const getFileType = (url = "") => {
    try {
      const cleanUrl = url.split("?")[0].toLowerCase();

      // ✅ CASE 1: API endpoint contains pdf
      if (cleanUrl.includes("/pdf/") || cleanUrl.endsWith("/pdf")) {
        return "pdf";
      }

      // ✅ CASE 2: normal file extensions
      const ext = cleanUrl.substring(cleanUrl.lastIndexOf(".") + 1);

      if (ext === "pdf") return "pdf";
      if (["xls", "xlsx"].includes(ext)) return "excel";
      if (["doc", "docx"].includes(ext)) return "word";

      return "other";
    } catch {
      return "other";
    }
  };


  const fileType = getFileType(selectedReport?.report_file);

  const formattedSessionsWithLock = formattedSessions.map((session, index, arr) => {
    const previousSession = arr[index - 1];

    const isFirstSession = index === 0;

    const isUnlocked =
      isFirstSession || previousSession?.status === "completed";

    return {
      ...session,
      isUnlocked,
    };
  });


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
        {formattedSessionsWithLock.map((session) => {
          const isJoinSession = ["booked", "rescheduled", "in_progress"].includes(session.status);
          const isJoinEnabled = isJoinSession ? canJoinSessionNow(session, currentTime) : true;

          return (
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
                        {/* <Tag color="gold" size="small" style={{ marginLeft: 8 }}>Lead</Tag> */}
                      </div>
                    ) : (
                      <div>
                        <Text type="colorTextSecondary" style={{ fontSize: 14 }}>Not Assigned</Text>
                        {/* <Tag size="small" style={{ marginLeft: 8 }}>Lead</Tag> */}
                      </div>
                    )}
                    {session.counsellors?.assistant && (
                      <div style={{ marginTop: 4 }}>
                        <Text type="colorTextSecondary" style={{ fontSize: 14 }}>{session.counsellors.assistant}</Text>
                        {/* <Tag color="blue" size="small" style={{ marginLeft: 8 }}>Assistant</Tag> */}
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
                      {session.mode && session.mode !== "N/A" ? (
                        session.mode.toLowerCase() === "online" ? (
                          <>
                            <VideoCameraOutlined style={{ marginRight: 4 }} />
                            Online
                          </>
                        ) : (
                          <>
                            <EnvironmentOutlined style={{ marginRight: 4 }} />
                            Offline
                          </>
                        )
                      ) : (
                        <Text type="colorTextSecondary">Not Available</Text>
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
                      {session.session_no} of {totalSessions}
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

                {showProfile === true && (
                  <>
                    <Col xs={24} sm={24} md="0 1 140px" style={isMobile ? {} : { minWidth: 140, maxWidth: 140 }}>
                      <Button
                        icon={<UserOutlined />}
                        style={{ width: "100%", whiteSpace: "nowrap", padding: "0 12px" }}
                        onClick={() => handleViewProfile(session)}
                        disabled={!session.isUnlocked || session.status == "not_booked"}
                      >
                        View Profile
                      </Button>
                    </Col>

                    <Col xs={24} sm={24} md="0 1 140px" style={isMobile ? {} : { minWidth: 140, maxWidth: 140 }}>
                      <Button
                        icon={<EyeOutlined />}
                        style={{ width: "100%", whiteSpace: "nowrap", padding: "0 12px" }}
                        onClick={() => handleViewReport(session)}
                        disabled={!session.isUnlocked || session.status == "not_booked"}
                      >
                        View Report
                      </Button>
                    </Col>

                    <Col xs={24} sm={24} md="0 1 180px" style={isMobile ? {} : { minWidth: 180, maxWidth: 200 }}>
                      <Button
                        icon={<FileTextOutlined />}
                        style={{ width: "100%", whiteSpace: "nowrap", padding: "0 12px" }}
                        onClick={() => handleViewNotes(session)}
                        disabled={!session.isUnlocked || session.status == "not_booked"}
                      >
                        View/Add Notes
                      </Button>
                    </Col>

                  </>
                )}
                {["booked", "rescheduled"].includes(session.status) &&
                  session.mode === "offline" && (
                    <Col xs={24} sm={24} md="0 1 140px" style={isMobile ? {} : { minWidth: 140, maxWidth: 140 }}>
                      <Button
                        icon={<EnvironmentOutlined />}
                        style={{ width: "100%", whiteSpace: "nowrap", padding: "0 12px" }}
                        onClick={() => setIsLocationModalOpen(true)}
                      >
                        View Location
                      </Button>
                    </Col>
                  )}

                {/* SHOW JOIN BUTTON ONLY FOR ONLINE */}
                {session.mode !== "offline" &&
                  getButton(session, navigate, false, openBookingModal) && (
                    <Col xs={24} sm={24} md="0 1 140px" style={isMobile ? {} : { minWidth: 140, maxWidth: 140 }}>
                      <Button
                        icon={isJoinSession ? <VideoCameraOutlined /> : <PlusOutlined />}
                        style={{ width: "100%", whiteSpace: "nowrap", padding: "0 12px" }}
                        type={
                          ["not_booked", "booked", "in_progress", "rescheduled"].includes(session.status)
                            ? "primary"
                            : undefined
                        }
                        onClick={() => {
                          if (session.status === "not_booked") {
                            openBookingModal(session);
                          } else if (["booked", "rescheduled", "in_progress"].includes(session.status)) {
                            window.open("https://us06web.zoom.us/j/78343615915?pwd=...", "_blank");
                          }
                        }}
                        disabled={!session.isUnlocked || (isJoinSession && !isJoinEnabled)}
                      >
                        {isJoinSession ? "Join Session" : session.status === "not_booked" ? "Book Now" : ""}
                      </Button>
                    </Col>
                  )}
              </Row>


            </Card>
          )
        })}
      </div>

      <HhBookSessionModal
        open={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        session={selectedSession}
        participantId={participantId}
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
        <HhSessionNotesModal
          session={{
            ...selectedSession,
            id: selectedSession?.booking_id,
            counsellorList: selectedSession?.counsellor || [],
            // program: selectedSession?.program || "N/A",
            // package: selectedSession?.package || "N/A",
          }}
          onClose={() => setNotesModal(false)}
          isViewMode={!!notes?.[selectedSession?.booking_id]}
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
          fileType === "pdf" ? (
            <div
              style={{
                width: "100%",
                height: "500px",
                border: "1px solid #e8e8e8",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <iframe
                src={`${selectedReport.report_file}#toolbar=0&navpanes=0&scrollbar=0`}
                title="Report Preview"
                width="100%"
                height="100%"
                style={{ border: "none" }}
                onLoad={() => setReportLoading(false)}
                onError={() => setReportLoading(false)}
              />
            </div>
          ) : (
            <div
              style={{
                minHeight: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 12,
                background: "#fafafa",
                borderRadius: 8,
                border: "1px dashed #d9d9d9",
              }}
            >
              <FileTextOutlined style={{ fontSize: 32, color: "#999" }} />

              <Text strong>
                Preview not available for {fileType === "excel" ? "Excel" : "Word"} file
              </Text>

              <Text type="colorTextSecondary">
                Please download the file to view it
              </Text>
            </div>
          )
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

      <Modal
        open={isLocationModalOpen}
        onCancel={() => setIsLocationModalOpen(false)}
        footer={null}
        width={620}
      >
        <div style={{ padding: 2 }}>
          <div style={{ marginBottom: 20 }}>
            <Title level={4} style={{ marginBottom: 6, color: "#111827" }}>
              📍 Counselling Office
            </Title>

            <Text type="colorTextSecondary">
              Please arrive on time for your offline counselling session
            </Text>
          </div>

          <div
            style={{
              borderRadius: 12,
              background: "#f5f7ff",
              padding: 16,
              marginBottom: 20,
              boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <Avatar
                size={48}
                icon={<UserOutlined />}
                style={{ backgroundColor: "#3b82f6", marginRight: 12 }}
              />
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  Mrs. Reena Bhutada
                </Text>
              </div>
            </div>

            <div style={{ marginTop: 8, paddingLeft: 4 }}>
              <Text strong style={{ display: "block", marginBottom: 4 }}>
                🏢 Office Address
              </Text>

              <Text style={{ lineHeight: 1.5 }}>
                Abhinav Career Scope, Pune <br />
                Bhagwati Maestros, Miller 403 <br />
                LMD Chowk, Above Indian Smart Bazaar <br />
                Bavdhan, Pune – 411021
              </Text>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            <Button onClick={() => setIsLocationModalOpen(false)}>
              Close
            </Button>

            <Button type="primary" onClick={openGoogleMap}>
              📍 Open in Google Maps
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HhSession;
