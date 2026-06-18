import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Avatar,
  Modal,
  Grid,
  Empty,
  message,
  Divider,
} from "antd";
import {
  UserOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  PlusOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import BookSessionModal from "../modals/BookSessionModal";
import {
  fetchStudentCounsellingBookings,
  deleteCounsellingBooking,
} from "../../../adminSlices/counsellingBookingSlice";
import { fetchCounsellingNote } from "../../../adminSlices/counsellorSlice";
import { fetchStudentJourney } from "../../../adminSlices/userSlice";
import SessionsNotesModal from "../../counsellor/modals/SessionsNotesModal";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const SlotBookingList = () => {
  const dispatch = useDispatch();
  const screens = useBreakpoint();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const studentId = localStorage.getItem("studentId");
  const aptitudeTestCompleted =
    (localStorage.getItem("aptitude_test") || "").toLowerCase() === "true";
  const engineeringTestAnalysisEnabled =
    (localStorage.getItem("engineering_test_analysis") || "").toLowerCase() === "true";

  const sessions = useSelector((state) =>
    Array.isArray(state.counsellingBooking.data)
      ? state.counsellingBooking.data
      : []
  );

  // Read selected program/package from localStorage to filter displayed slots
  const selectedProgramId = Number(localStorage.getItem("selectedProgramId")) || null;
  const selectedPackageId = Number(localStorage.getItem("selectedPackageId")) || null;

  // Filter sessions so student only sees slots for the selected program/package (if provided)
  const sessionsFilteredBySelection = Array.isArray(sessions)
    ? sessions.filter((s) => {
      const progId = s?.program_detail?.id ? Number(s.program_detail.id) : null;
      const packId = s?.package_detail?.id ? Number(s.package_detail.id) : null;

      // If both selected, require exact match on both
      if (selectedProgramId && selectedPackageId) {
        return progId === selectedProgramId && packId === selectedPackageId;
      }

      // If only program selected
      if (selectedProgramId) return progId === selectedProgramId;

      // If only package selected
      if (selectedPackageId) return packId === selectedPackageId;

      // No selection → show all
      return true;
    })
    : [];

  const loading = useSelector((state) => state.counsellingBooking.loading);
  const { journey } = useSelector((state) => state.users);

  // const isReportAvailable =
  //   journey?.progress?.report === "received_locked" ||
  //   journey?.progress?.report === "received_unlocked";


  const matchedJourney = journey?.journeys?.find(
    (item) =>
      Number(item.program_id) === selectedProgramId &&
      Number(item.package_id) === selectedPackageId
  );

  const reportStatus = matchedJourney?.progress?.report;

  const isReportAvailable =
    reportStatus === "received_locked" ||
    reportStatus === "received_unlocked";


  const shouldDisableBookSession =
    aptitudeTestCompleted && !isReportAvailable;

  useEffect(() => {
    if (studentId) {
      dispatch(fetchStudentCounsellingBookings(studentId));
      dispatch(fetchStudentJourney(studentId));
    }
  }, [dispatch, studentId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const mappedSessions = sessionsFilteredBySelection.map((s) => ({
    ...s,
    key: s.id,
    // counsellorsList: Array.isArray(s.counsellors)
    //   ? s.counsellors.map((c) => ({
    //     id: c.counsellor?.id,
    //     name: `${c.counsellor?.first_name || ""} ${c.counsellor?.last_name || ""}`,
    //     role: c.role,
    //   }))
    //   : [],

    counsellorsList: Array.isArray(s.counsellors)
      ? s.counsellors
        .filter((c) => c.role !== "assistant") // hide assistant counsellor
        .map((c) => ({
          id: c.counsellor?.id,
          name: `${c.counsellor?.first_name || ""} ${c.counsellor?.last_name || ""}`,
          role: c.role,
        }))
      : [],
    mode: s.preferred_counselling_mode
      ? s.preferred_counselling_mode.charAt(0).toUpperCase() + s.preferred_counselling_mode.slice(1)
      : "N/A",
    rawMode: s.preferred_counselling_mode || "offline",
    // time: s.start_time && s.end_time ? `${s.start_time} - ${s.end_time}` : "N/A",
    time: s.start_time || "N/A",
    date: s.slot_date
      ? dayjs(s.slot_date).format("DD MMM YYYY")
      : "N/A",
    status: s.status || "not_booked",
    zoomLink: s.meeting_link || "https://us06web.zoom.us/j/78343615915?pwd=ZjU2UnlGNEl3K2JvcHY0WGYyb1ZKQT09",
  }));

  // const filteredSessions = mappedSessions;
  const getPriority = (status) => {
    if (status === "booked") return 1;
    if (status === "rescheduled") return 2;
    if (status === "completed") return 3;
    if (status === "pending") return 4;
    if (status === "cancelled") return 5;
    return 5;
  };

  const filteredSessions = [...mappedSessions].sort(
    (a, b) => getPriority(a.status) - getPriority(b.status)
  );

  const noSessionFound = filteredSessions.length === 0;
  const showUnavailableUI = noSessionFound && aptitudeTestCompleted;
  const showBookUI = noSessionFound && !aptitudeTestCompleted;

  const isNotBooked =
    filteredSessions.length === 1 && filteredSessions[0].status === "not_booked";
  // const shouldBlockBookingUntilReportUnlock =
  //   isNotBooked &&
  //   (aptitudeTestCompleted || engineeringTestAnalysisEnabled) &&
  //   !isReportUnlocked;

  const shouldBlockBookingUntilReportUnlock =
    isNotBooked &&
    (aptitudeTestCompleted) &&
    !isReportAvailable;

  const formatStatus = (status) => {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const statusColor = (status) => {
    if (status === "completed") return "green";
    if (status === "booked") return "blue";
    if (status === "rescheduled") return "orange";
    if (status === "cancelled") return "red";
    return "default";
  };

  const isJoinAllowed = (session) => {
    if (!session.time || !session.date) return false;

    const [startTime] = session.time.split(" - ");
    const sessionDateTime = new Date(`${session.date} ${startTime}`);
    const joinTime = new Date(sessionDateTime.getTime() - 10 * 60000);

    return currentTime >= joinTime;
  };

  const handleJoin = (session) => {
    if (session.zoomLink) {
      window.open(session.zoomLink, "_blank");
    } else {
      message.warning("Zoom link not available");
    }
  };

  const handleCancel = (sessionId) => {
    Modal.confirm({
      title: "Cancel Session",
      content: "Are you sure you want to cancel this session?",
      okText: "Yes, Cancel",
      cancelText: "No",
      okButtonProps: { danger: true },
      onOk: () => {
        dispatch(deleteCounsellingBooking(sessionId))
          .unwrap()
          .then(() => {
            dispatch(fetchStudentCounsellingBookings(studentId));
            message.success("Session cancelled successfully");
          });
      },
    });
  };

  const hasActiveSession = filteredSessions.some(
    (s) => s.status === "booked" || s.status === "rescheduled" || s.status === "completed" || s.status === "pending"
  );

  const openGoogleMap = () => {
    const mapUrl =
      "https://www.google.com/maps/search/?api=1&query=Abhinav+Career+Scope+Bavdhan+Pune";

    window.open(mapUrl, "_blank");
  };

  const notBookedMessage = shouldBlockBookingUntilReportUnlock ? (
    <>
      Your Analysis report is not uploaded yet.
      <br />
      <b>You will be able to book a session once your report is uploaded.</b>
    </>
  ) : (
    <>
      You have not booked a session yet. Please click the
      <b> Book Session </b> button below.
    </>
  );


  return (
    <div style={{ padding: screens.md ? 24 : 12 }}>
      <Row
        style={{
          marginBottom: 20,
          paddingBottom: 8,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Col span={24} style={{ textAlign: "center", marginBottom: 16 }}>
          <Title level={2} style={{ margin: 0 }}>
            My Counselling Sessions
          </Title>
          <Text type="colorTextSecondary">
            <br />
            View and manage your booked sessions
          </Text>
        </Col>

        {filteredSessions.length > 0 && !isNotBooked && (
          <Col span={24} style={{ textAlign: "end" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              disabled={hasActiveSession || noSessionFound}
              onClick={() => {
                setRescheduleData(null);
                setIsModalOpen(true);
              }}
            >
              Book Session
            </Button>
          </Col>
        )}
      </Row>


      {loading ? (
        <Text>Loading sessions...</Text>
      ) : showUnavailableUI ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Empty
            description={
              <Text type="colorTextSecondary">
                Counselling sessions are currently unavailable.
                <br />
                You will be able to book a slot once your report is uploaded.
              </Text>
            }
          />
          <div style={{ marginTop: 20 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              disabled={noSessionFound}
              onClick={() => {
                setRescheduleData(null);
                setIsModalOpen(true);
              }}
            >
              Book Session
            </Button>
          </div>
        </div>
      ) : showBookUI ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          {/* <Empty
            description={
              <Text type="colorTextSecondary">
                No sessions found.
                <br />
                You can book your counselling session now.
              </Text>
            }
          /> */}
          <Empty
            description={
              <Text type="colorTextSecondary">
                Counselling sessions are currently unavailable.
                <br />
                You will be able to book a slot once your report is uploaded.
              </Text>
            }
          />

          <div style={{ marginTop: 20 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              disabled
              onClick={() => {
                setRescheduleData(null);
                setIsModalOpen(true);
              }}
            >
              Book Session
            </Button>
          </div>
        </div>
      ) : isNotBooked ? (
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          <Card
            style={{
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              width: "100%",
            }}
          >
            <Row justify="space-between" align="middle">
              <Space>
                <Avatar size={48} icon={<UserOutlined />} />
                <div>
                  <Text strong>N/A</Text>
                  <br />
                  <Tag>N/A</Tag>
                </div>
              </Space>
              <Tag>Not Booked</Tag>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
              <Col xs={24} sm={12} md={8}>
                <Card bordered={false}>
                  <Text>Date</Text>
                  <br />
                  <Text strong>
                    <CalendarOutlined /> Not Scheduled
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card bordered={false}>
                  <Text>Time</Text>
                  <br />
                  <Text strong>
                    <ClockCircleOutlined /> N/A
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card bordered={false}>
                  <Text>Mode</Text>
                  <br />
                  <Text strong>
                    <VideoCameraOutlined /> N/A
                  </Text>
                </Card>
              </Col>
            </Row>

            <Divider />
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <Text type="colorTextSecondary">{notBookedMessage}</Text>
              <div style={{ marginTop: 20 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  disabled={shouldBlockBookingUntilReportUnlock}
                  onClick={() => {
                    setRescheduleData(filteredSessions[0]);
                    setIsModalOpen(true);
                  }}
                >
                  Book Session
                </Button>
              </div>
            </div>
          </Card>
        </Space>
      ) : (
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          {filteredSessions.map((session) => (
            <Card
              key={session.id}
              style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}
            >
              <Row justify="space-between" align="middle">
                <Space>
                  <Avatar size={48} icon={<UserOutlined />} />
                  <div>
                    {session.counsellorsList.length > 0 ? (
                      session.counsellorsList.map((c) => (
                        <div key={c.id}>
                          <Text strong>{c.name}</Text>
                          <br />
                          <Tag>Counsellor</Tag>
                        </div>
                      ))
                    ) : (
                      <Text strong>N/A</Text>
                    )}
                  </div>
                </Space>
                <Tag color={statusColor(session.status)}>
                  {formatStatus(session.status)}
                </Tag>
              </Row>

              <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} sm={12} md={8}>
                  <Card bordered={false}>
                    <Text>Date</Text>
                    <br />
                    <Text strong>
                      <CalendarOutlined /> {session.date}
                    </Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card bordered={false}>
                    <Text>Time</Text>
                    <br />
                    <Text strong>
                      <ClockCircleOutlined /> {session.time}
                    </Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card bordered={false}>
                    <Text>Mode</Text>
                    <br />
                    <Text strong>
                      <VideoCameraOutlined /> {session.mode}
                    </Text>
                  </Card>
                </Col>
              </Row>

              {(session.status === "booked" || session.status === "rescheduled") && (
                <Row justify="end" style={{ marginTop: 24 }}>
                  <Space
                    wrap
                    size={12}
                    style={{ width: "100%", justifyContent: "flex-end" }}
                  >
                    {session.rawMode.toLowerCase() === "online" ? (
                      <Button
                        type="primary"
                        icon={<VideoCameraOutlined />}
                        disabled={!isJoinAllowed(session)}
                        onClick={() => handleJoin(session)}
                      >
                        Join
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        icon={<EnvironmentOutlined />}
                        onClick={() => setIsLocationModalOpen(true)}
                      >
                        Location Details
                      </Button>
                    )}
                    {/* <Button
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => handleCancel(session.id)}
                    >
                      Cancel
                    </Button> */}
                  </Space>
                </Row>
              )}

              {session.status === "completed" && (
                <Row justify="end" style={{ marginTop: 24 }}>
                  <Button
                    type="primary"
                    onClick={() => {
                      const counsellor = session.counsellorsList?.[0];
                      const rawUsername = localStorage.getItem("username") || "Student";

                      const studentName = rawUsername.includes(" - ")
                        ? rawUsername.split(" - ")[1]
                        : rawUsername;

                      const sessionDataForNotes = {
                        ...session,
                        studentName: studentName,
                        counsellorName: counsellor?.name || "N/A",
                        startTime: session.time?.split(" - ")[0],
                        endTime: session.time?.split(" - ")[1],
                        slot_time: session.time,
                      };

                      dispatch(fetchCounsellingNote(session.id)).then(() => {
                        setSelectedSession(sessionDataForNotes);
                        setNotesModalOpen(true);
                      });
                    }}
                  >
                    View Session Notes
                  </Button>
                </Row>
              )}
            </Card>
          ))}
        </Space>
      )}

      {/* Location Modal */}
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
            <Text type="seccolorTextSecondaryondary">
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
              gap: "10px",
              marginTop: 16,
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

      {/* Book Session Modal */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={screens.md ? 1000 : "100%"}
      >
        <BookSessionModal
          rescheduleData={rescheduleData}
          selectedProgramId={selectedProgramId}
          selectedPackageId={selectedPackageId}
          closeModal={() => setIsModalOpen(false)}
          onSave={() => dispatch(fetchStudentCounsellingBookings(studentId))}
        />
      </Modal>

      <Modal
        open={notesModalOpen}
        onCancel={() => setNotesModalOpen(false)}
        footer={null}
        width={screens.md ? 900 : "100%"}
        destroyOnClose
      >
        {selectedSession && (
          <SessionsNotesModal
            session={selectedSession}
            onClose={() => setNotesModalOpen(false)}
            isViewMode={true}
            hideSessionDetails={true}
            showStudentName={false}
            showActions={false}
          />
        )}
      </Modal>
    </div>
  );
};

export default SlotBookingList;

