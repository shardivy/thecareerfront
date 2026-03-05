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
  Select,
  DatePicker,
  Divider,
} from "antd";
import {
  UserOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  CloseOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import BookSessionModal from "../modals/BookSessionModal";
import {
  fetchStudentCounsellingBookings,
  deleteCounsellingBooking,
} from "../../../adminSlices/counsellingBookingSlice";
import { fetchLeadCounsellors } from "../../../adminSlices/counsellorSlice";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { Option } = Select;

const SlotBookingList = () => {
  const dispatch = useDispatch();
  const screens = useBreakpoint();

  /* ================= STATE ================= */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [dateFilter, setDateFilter] = useState(null);
  const [modeFilter, setModeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [counsellorFilter, setCounsellorFilter] = useState(null);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");

  /* ================= REDUX DATA ================= */
  const sessions = useSelector((state) =>
    Array.isArray(state.counsellingBooking.data)
      ? state.counsellingBooking.data
      : []
  );
  const loading = useSelector((state) => state.counsellingBooking.loading);
  const counsellors = useSelector((state) =>
    Array.isArray(state.counsellors.list) ? state.counsellors.list : []
  );

  /* ================= FETCH DATA ================= */
  const studentId = localStorage.getItem("studentId"); // Retrieve studentId from localStorage

  useEffect(() => {
    if (studentId) {
      dispatch(fetchStudentCounsellingBookings(studentId));
    }
  }, [dispatch, studentId]);

  useEffect(() => {
    dispatch(fetchLeadCounsellors());
  }, [dispatch]);

  useEffect(() => {
    console.log("Sessions data:", sessions); // Debug log to inspect sessions data
  }, [sessions]);

  /* ================= CURRENT TIME UPDATER ================= */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // update every 1 minute
    return () => clearInterval(timer);
  }, []);

  /* ================= MAP API DATA ================= */
  const mappedSessions = sessions.map((s) => ({
    ...s,
    key: s.id,

    // ✅ HANDLE MULTIPLE COUNSELLORS
    counsellorsList: Array.isArray(s.counsellors)
      ? s.counsellors.map((c) => ({
        id: c.counsellor.id,
        name: `${c.counsellor.first_name} ${c.counsellor.last_name}`,
        role: c.role,
      }))
      : [],

    counsellorDisplay: Array.isArray(s.counsellors)
      ? s.counsellors
        .map(
          (c) =>
            `${c.counsellor.first_name} ${c.counsellor.last_name} (${c.role})`
        )
        .join(", ")
      : "—",

    mode: s.mode
      ? s.mode.charAt(0).toUpperCase() + s.mode.slice(1)
      : "—",

    time:
      s.start_time && s.end_time
        ? `${s.start_time} - ${s.end_time}`
        : "—",

    date: s.slot_date || "—",

    status: s.status
      ? s.status.charAt(0).toUpperCase() + s.status.slice(1)
      : "—",

    location:
      s.mode === "offline"
        ? "ABC College, Main Campus, Bangalore"
        : "—",

    zoomLink: s.meeting_link || "—",
  }));

  /* ================= FILTERING ================= */
  const filteredSessions = mappedSessions.filter((s) => {
    const dateMatch = !dateFilter || dayjs(s.date).isSame(dateFilter, "day");
    const modeMatch = !modeFilter || s.mode === modeFilter;
    const statusMatch = !statusFilter || s.status === statusFilter;
    const counsellorMatch =
      !counsellorFilter || s.counsellorDisplay.some((c) => c.id === counsellorFilter);

    return dateMatch && modeMatch && statusMatch && counsellorMatch;
  });

  /* ================= STATUS COLOR ================= */
  const statusColor = (status) => {
    if (status === "Completed") return "green";
    if (status === "Booked") return "blue";
    if (status === "Cancelled") return "red";
    return "default";
  };

  /* ================= CHECK JOIN ALLOWED ================= */
  const isJoinAllowed = (session) => {
    if (!session.time || !session.date) return false;
    const [startTime] = session.time.split(" - ");
    const sessionDateTime = new Date(`${session.date} ${startTime}`);
    const joinTime = new Date(sessionDateTime.getTime() - 10 * 60000);
    return currentTime >= joinTime;
  };

  /* ================= HANDLE JOIN ================= */
  // const handleJoin = (session) => {
  //   if (session.mode === "Offline") {
  //     if (session.location) window.open(session.location, "_blank");
  //     else message.warning("Offline location not available");
  //   } else {
  //     if (session.zoomLink) window.open(session.zoomLink, "_blank");
  //     else message.warning("Zoom link not available");
  //   }
  // };


const handleJoin = (session) => {
  if (session.zoomLink) {
    window.open(session.zoomLink, "_blank");
  } else {
    message.warning("Zoom link not available");
  }
};


  /* ================= HANDLE RESCHEDULE ================= */
  const handleReschedule = (session) => {
    setRescheduleData(session);
    setIsModalOpen(true);
  };

  /* ================= HANDLE CANCEL ================= */
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
  (s) => s.status === "Booked" || s.status === "Completed"
);
  const hasSessions = filteredSessions.length > 0;


  return (
    <div style={{ padding: screens.md ? 24 : 12 }}>
      {/* ================= HEADER ================= */}
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
          <Text type="colorTextSecondary" style={{ display: "block", textAlign: "center" }}>
            View and manage your booked sessions
          </Text>
        </Col>

        {hasSessions && (
          <Col span={24} style={{ textAlign: "end" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              disabled={hasActiveSession}
              onClick={() => {
                setRescheduleData(null);
                setIsModalOpen(true);
              }}
              style={{
                borderRadius: 8,
                padding: "0 32px",
              }}
            >
              Book Session
            </Button>
          </Col>
        )}

      </Row>




      {/* ================= SESSION LIST ================= */}
      {loading ? (
        <Text>Loading sessions...</Text>
      ) : filteredSessions.length > 0 ? (
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          {filteredSessions.map((session) => (
            <Card
              key={session.id}
              style={{
                borderRadius: 16,
                border: "1px solid #e5e7eb",
                opacity: session.status === "Cancelled" ? 0.6 : 1,
                filter: session.status === "Cancelled" ? "blur(1px)" : "none",
                transition: "0.3s ease",
              }}
            >
              {/* HEADER */}
              <Row justify="space-between" align="middle">
                <Space>
                  <Avatar size={48} icon={<UserOutlined />} />
                  <div>
                    <div>
                      {session.counsellorsList.length > 0 ? (
                        session.counsellorsList.map((c, index) => (
                          <div key={c.id}>
                            <Text strong>{c.name}</Text>{" "}
                            <br></br>
                            <Tag
                              color={c.role === "lead" ? "blue" : "purple"}
                              style={{ marginLeft: 6 }}
                            >
                              {c.role}
                            </Tag>
                          </div>
                        ))
                      ) : (
                        <Text strong>—</Text>
                      )}
                    </div>
                  </div>
                </Space>
                <Tag
                  color={statusColor(session.status === "Booked" ? "Booked" : session.status)}
                  style={{
                    fontSize: "14px",
                    padding: "4px 12px",
                    borderRadius: "16px",
                    backgroundColor: session.status === "Completed" ? "#f0f0f0" : undefined,
                    color: session.status === "Completed" ? "#9c4e00" : undefined,
                    filter: session.status === "Completed" ? "blur(1px)" : "none",
                    opacity: session.status === "Completed" ? 0.6 : 1,
                  }}
                >
                  {session.status === "Booked" ? "Booked" : session.status}
                </Tag>

              </Row>

              {/* DETAILS */}
              <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                {["Date", "Time", "Mode", ].map((label, index) => {
                  let icon = null;
                  let value = "";

                  switch (label) {
                    case "Date":
                      icon = <CalendarOutlined />;
                      value = session.date;
                      break;
                    case "Time":
                      icon = <ClockCircleOutlined />;
                      value = session.time;
                      break;
                    case "Mode":
                      icon = <VideoCameraOutlined />;
                      value = session.mode;
                      break;
                   
                    default:
                      break;
                  }

                  return (
                 <Col key={label} xs={24} sm={12} md={8}>
                      <Card
                        bordered={false}
                        style={{
                          background: "#f9fafb",
                          borderRadius: 12,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          padding: "12px 16px",
                          height: 120,          // Fixed height
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center", // vertically center content
                        }}
                      >
                        <Text type="colorTextSecondary">{label}</Text>
                        <br />
                        <Text strong>
                          {icon} {value}
                        </Text>
                      </Card>
                    </Col>
                  );
                })}
              </Row>


              {/* ACTIONS */}
             {session.status === "Booked" && (
  <Row justify="end" style={{ marginTop: 24 }}>
    <Space wrap>
      
      {/* ONLINE → Join Button */}
      {session.mode === "Online" && (
        <Button
          type="primary"
          icon={<VideoCameraOutlined />}
          disabled={!isJoinAllowed(session)}
          onClick={() => handleJoin(session)}
        >
          Join
        </Button>
      )}

      {/* OFFLINE → View Location Button */}
      {session.mode === "Offline" && (
        <Button
          type="primary"
          icon={<CalendarOutlined />}
          onClick={() => {
            setSelectedLocation(session.location);
            setIsLocationModalOpen(true);
          }}
        >
          View Location Details
        </Button>
      )}

      {/* <Button
        icon={<ReloadOutlined />}
        onClick={() => handleReschedule(session)}
      >
        Reschedule
      </Button> */}

      <Button
        danger
        icon={<CloseOutlined />}
        onClick={() => handleCancel(session.id)}
      >
        Cancel
      </Button>

    </Space>
  </Row>
)}
            </Card>
          ))}
        </Space>
      ) : (
        <div style={{ textAlign: "center", marginTop: 80 }}>
          <Empty
            description={
              <Text type="colorTextSecondary">
                No sessions found.
              </Text>
            }
          />

          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            disabled={hasActiveSession}
            onClick={() => setIsModalOpen(true)}
            style={{ borderRadius: 8, marginTop: 24 }}
          >
            Book Session
          </Button>
        </div>
      )}

      {/* MODAL */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={screens.md ? 1000 : "100%"}
        style={!screens.md ? { top: 0 } : {}}
        bodyStyle={!screens.md ? { padding: 12 } : {}}
      >
        <BookSessionModal
          rescheduleData={rescheduleData}
          closeModal={() => setIsModalOpen(false)}
          onSave={() => dispatch(fetchStudentCounsellingBookings(studentId))}
        />
      </Modal>

<Modal
  open={isLocationModalOpen}
  onCancel={() => setIsLocationModalOpen(false)}
  footer={null}
  centered
  width={500}
  title={
    <Space>
      <span style={{ fontSize: 20 }}>📍</span>
      <span style={{ fontWeight: 600 }}>Session Location Details</span>
    </Space>
  }
>
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

    {/* Address Card */}
    <Card
      bordered={false}
      style={{
        background: "#f9fafb",
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
      }}
    >
      <Space direction="vertical" size={4}>
        <Text strong style={{ fontSize: 16 }}>
          Mrs. Reena Bhutada
        </Text>
        <Text type="colorTextSecondary">
          Abhinav Career Scope, Pune
        </Text>

        <Divider style={{ margin: "8px 0" }} />

        <Text>
          Bhagwati Maestros, Miller 403 <br />
          LMD Chowk, Above Indian Smart Bazaar <br />
          Bavdhan, Pune – 411021
        </Text>
      </Space>
    </Card>

    {/* Important Notes */}
    <Card
      bordered={false}
      style={{
        background: "#fff7ed",
        borderRadius: 16,
        border: "1px solid #fde68a"
      }}
    >
      <Title level={5} style={{ marginBottom: 12 }}>
        📌 Important Notes
      </Title>

      <Space direction="vertical" size={8}>
        <Text>• Office is near Chandani Chowk, Bavdhan</Text>
        <Text>• Start 20 minutes earlier due to traffic</Text>
        <Text>• 🚗 Parking available outside the building gate</Text>
      </Space>
    </Card>

    {/* Google Maps Button */}
    <Button
      type="primary"
      size="large"
      block
      onClick={() =>
        window.open(
          "https://www.google.com/maps/search/?api=1&query=Abhinav Career Scope Bavdhan Pune",
          "_blank"
        )
      }
      style={{
        borderRadius: 12,
        height: 48,
        fontWeight: 600
      }}
    >
      Open in Google Maps
    </Button>

  </div>
</Modal>
    </div>
  );
};

export default SlotBookingList;
