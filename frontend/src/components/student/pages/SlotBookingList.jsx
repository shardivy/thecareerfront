import React, { useState, useEffect } from "react";
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
import BookSessionModal from "../modals/BookSessionModal";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const SlotBookingList = () => {
  const screens = useBreakpoint();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [sessions, setSessions] = useState([
    {
      id: 1,
      counsellor: "Dr. Meera Iyer",
      role: "Career Counsellor",
      date: "2026-01-08",
      time: "10:00 AM",
      mode: "Offline",
      duration: "60 mins",
      status: "Completed",
      location: "https://maps.google.com?q=Delhi", // ADD
      zoomLink: "", // ADD
    },
    {
      id: 2,
      counsellor: "Prof. Anil Verma",
      role: "Career Counsellor",
      date: "2026-01-12",
      time: "02:00 PM",
      mode: "Online",
      duration: "60 mins",
      status: "Upcoming",
      location: "",
      zoomLink: "https://zoom.us/j/123456789", // ADD
    },
  ]);

  const isJoinAllowed = (session) => {
    const sessionDateTime = new Date(`${session.date} ${session.time}`);
    const joinTime = new Date(sessionDateTime.getTime() - 10 * 60000);
    return currentTime >= joinTime;
  };


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // update every 1 minute

    return () => clearInterval(timer);
  }, []);

  const hasActiveSession = sessions.some(
    (session) => session.status === "Upcoming"
  );

  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.status === "Upcoming" && b.status !== "Upcoming") return -1;
    if (a.status !== "Upcoming" && b.status === "Upcoming") return 1;
    return 0;
  });

  const statusColor = (status) => {
    if (status === "Completed") return "green";
    if (status === "Upcoming") return "blue";
    if (status === "Cancelled") return "red";
    return "default";
  };

  const handleReschedule = (session) => {
    setRescheduleData(session);
    setIsModalOpen(true);
  };

  const handleJoin = (session) => {
    if (session.mode === "Offline") {
      window.open(session.location, "_blank");
    } else {
      window.open(session.zoomLink, "_blank");
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
        const updatedSessions = sessions.map((session) =>
          session.id === sessionId
            ? { ...session, status: "Cancelled" }
            : session
        );

        setSessions(updatedSessions);
        message.success("Session cancelled successfully");
      },
    });
  };

  return (
    <div style={{ padding: screens.md ? 24 : 12 }}>
      {/* HEADER */}
    <Row
  style={{
    marginBottom: 20,
    paddingBottom: 8,
    borderBottom: "1px solid #f0f0f0",
  }}
>
  {/* Title Row */}
  <Col span={24} style={{ textAlign: "center", marginBottom: 16 }}>
    <Title level={2} style={{ margin: 0 }}>
      My Counselling Sessions
    </Title><br></br>
    <Text type="colorzTextSecondary"  style={{ display: "block", textAlign: "center" }}
    >View and manage your booked sessions</Text>
  </Col>

  {/* Button Row */}
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
</Row>


      {/* SESSION LIST */}
      {sortedSessions.length > 0 ? (
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          {sortedSessions.map((session) => (
            <Card
              key={session.id}
              style={{
                borderRadius: 16,
                border: "1px solid #e5e7eb",
                opacity: session.status === "Cancelled" ? 0.6 : 1,
                filter:
                  session.status === "Cancelled" ? "blur(2px)" : "none",
                transition: "0.3s ease",
              }}
            >
              {/* HEADER WITH STATUS ON SAME LINE */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <Space>
                  <Avatar size={48} icon={<UserOutlined />} />
                  <div>
                    <Text strong style={{ fontSize: 16 }}>
                      {session.counsellor}
                    </Text>
                    <br />
                    <Text type="secondary">{session.role}</Text>
                  </div>
                </Space>

                <Tag
                  color={statusColor(session.status)}
                  style={{
                    fontSize: 14,
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontWeight: 500,
                  }}
                >
                  {session.status}
                </Tag>
              </div>

              {/* DETAILS */}
              <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} sm={12} md={6}>
                  <Card bordered={false} style={{ background: "#f9fafb" }}>
                    <Text type="secondary">Date</Text>
                    <br />
                    <Text strong>
                      <CalendarOutlined /> {session.date}
                    </Text>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Card bordered={false} style={{ background: "#f9fafb" }}>
                    <Text type="secondary">Time</Text>
                    <br />
                    <Text strong>
                      <ClockCircleOutlined /> {session.time}
                    </Text>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Card bordered={false} style={{ background: "#f9fafb" }}>
                    <Text type="secondary">Mode</Text>
                    <br />
                    <Text strong>
                      <VideoCameraOutlined /> {session.mode}
                    </Text>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Card bordered={false} style={{ background: "#f9fafb" }}>
                    <Text type="secondary">Duration</Text>
                    <br />
                    <Text strong>{session.duration}</Text>
                  </Card>
                </Col>
              </Row>

              {/* ACTION BUTTONS */}
              {session.status === "Upcoming" && (
                <Row
                  justify="end"
                  style={{
                    marginTop: 24,
                    borderTop: "1px solid #f0f0f0",
                    paddingTop: 16,
                  }}
                >
                  <Space wrap>
                    <Button
                      type="primary"
                      icon={<VideoCameraOutlined />}
                      disabled={
                        session.mode === "Online"
                          ? !isJoinAllowed(session)
                          : false
                      }
                      onClick={() => handleJoin(session)}
                    >
                      Join
                    </Button>


                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => handleReschedule(session)}
                    >
                      Reschedule
                    </Button>

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
          <Empty description="You have no sessions." />
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
        />
      </Modal>
    </div>
  );
};

export default SlotBookingList;
