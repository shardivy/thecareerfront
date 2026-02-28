// src/pages/CounsellorDashboard.jsx
import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Select,
  Table,
  Button,
  Modal,
  Tag,
  message,
  Grid,
  Divider,
} from "antd";
import {
  TeamOutlined,
  CalendarOutlined,
  UserOutlined,
  VideoCameraOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import adminTheme from "../../../theme/adminTheme";
import SessionNotesModal from "../../counsellor/modals/SessionNotesModal";
import StudentProfileModal from "../modals/StudentProfileModal";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const CounsellorDashboard = () => {
  const screens = useBreakpoint();

  const [period, setPeriod] = useState("monthly");
  const [notesModal, setNotesModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [completedIds, setCompletedIds] = useState([]);
  const [profileModal, setProfileModal] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });
  const [locationModal, setLocationModal] = useState(false);

  const dummyData = {
    weekly: { assignedStudents: 12, upcomingSessions: 5, completedSessions: 8 },
    monthly: { assignedStudents: 45, upcomingSessions: 18, completedSessions: 32 },
    yearly: { assignedStudents: 320, upcomingSessions: 76, completedSessions: 280 },
  };

  const currentStats = dummyData[period];

  const upcomingSessions = [
    {
      key: 1,
      studentName: "Rahul Sharma",
      date: "2026-02-25",
      startTime: "15:00",
      endTime: "16:00",
      mode: "Online",
      zoomLink: "https://us06web.zoom.us/j/78343615915?pwd=ZjU2UnlGNEl3K2JvcHY0WGYyb1ZKQT09",
    },
    {
      key: 2,
      studentName: "Anjali Verma",
      date: "2026-02-26",
      startTime: "10:30",
      endTime: "11:30",
      mode: "Offline",
      location: {
        // counselorName: "Mrs. Reena Bhutada",
        officeName: "Abhinav Career Scope",
        building: "Bhagwati Maestros, Miller 403",
        landmarkLine1: "LMD Chowk, Above Indian Smart Bazaar",
        area: "Bavdhan",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411021",
        nearby: "Near Chandani Chowk, Bavdhan",
        instructions: "Start 20 minutes earlier due to traffic",
        parking: "Parking available outside the building gate"
      }
    },
    {
      key: 3,
      studentName: "Amit Patel",
      date: "2024-01-10",
      startTime: "09:00",
      endTime: "10:00",
      mode: "Online",
    },
  ];

  const columns = [
      {
    title: "Sr No",
    key: "serial",
    width: 80,
    render: (_, __, index) =>
      (pagination.current - 1) * pagination.pageSize + index + 1,
  },
    {
      title: "User Name",
      dataIndex: "studentName",
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (date) => dayjs(date).format("DD-MM-YYYY"),
    },
    {
      title: "Slot Time",
      render: (_, record) =>
        `${dayjs(record.startTime, "HH:mm").format("hh:mm A")} - 
         ${dayjs(record.endTime, "HH:mm").format("hh:mm A")}`,
    },
    {
      title: "Mode",
      dataIndex: "mode",
      render: (mode) =>
        mode === "Online" ? (
          <Tag color="green">Online</Tag>
        ) : (
          <Tag color="blue">Offline</Tag>
        ),
    },
    {
      title: "Actions",
      render: (_, record) => {
        const now = dayjs();
        const sessionStart = dayjs(`${record.date} ${record.startTime}`);
        const sessionEnd = dayjs(`${record.date} ${record.endTime}`);

        const isBeforeEnd = now.isBefore(sessionEnd);
        const isJoinEnabled = now.isAfter(
          sessionStart.subtract(30, "minute")
        );

        return (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              flexDirection: screens.xs ? "column" : "row",
            }}
          >
            {isBeforeEnd ? (
              <>
                <Button
                  size={screens.xs ? "middle" : "large"}
                  icon={<UserOutlined />}
                  onClick={() => {
                    setSelectedSession(record);
                    setProfileModal(true);
                  }}
                >
                  View Profile
                </Button>

                {record.mode === "Online" ? (
                  <Button
                    type="primary"
                    size={screens.xs ? "middle" : "large"}
                    icon={<VideoCameraOutlined />}
                    disabled={!isJoinEnabled}
                    onClick={() => {
                      window.open(
                        "https://us06web.zoom.us/j/78343615915?pwd=ZjU2UnlGNEl3K2JvcHY0WGYyb1ZKQT09",
                        "_blank"
                      );
                    }}
                  >
                    Join
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={screens.xs ? "middle" : "large"}
                    icon={<EnvironmentOutlined />}
                    // disabled={!isJoinEnabled}
                    onClick={() => {
                      setSelectedSession(record);
                      setLocationModal(true);
                    }}
                  >
                    Location Details
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  type="primary"
                  size={screens.xs ? "middle" : "large"}
                  icon={<CheckCircleOutlined />}
                  disabled={completedIds.includes(record.key)}
                  style={
                    !completedIds.includes(record.key)
                      ? {
                        backgroundColor: "#52c41a",
                        borderColor: "#52c41a",
                      }
                      : {}
                  }
                  onClick={() => {
                    setSelectedSession(record);
                    setConfirmModal(true);
                  }}
                >
                  {completedIds.includes(record.key)
                    ? "Completed"
                    : "Mark as Complete"}
                </Button>

                <Button
                  size={screens.xs ? "middle" : "large"}
                  icon={<FileTextOutlined />}
                  onClick={() => {
                    setSelectedSession(record);
                    setNotesModal(true);
                  }}
                >
                  Add Notes
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const stats = [
    {
      title: "Assigned Students",
      value: currentStats.assignedStudents,
      icon: <TeamOutlined />,
    },
    {
      title: "Upcoming Sessions",
      value: currentStats.upcomingSessions,
      icon: <CalendarOutlined />,
    },
    {
      title: "Completed Sessions",
      value: currentStats.completedSessions,
      icon: <CalendarOutlined />,
    },
  ];

  return (
    <div style={{ padding: screens.xs ? 12 : 20 }}>
      {/* HEADER */}
      <Row gutter={[16, 16]} justify="space-between">
        <Col xs={24} md={12}>
          <Title level={3}>Dashboard</Title>
        </Col>
        <Col xs={24} md={6}>
          <Select
            value={period}
            onChange={setPeriod}
            style={{ width: "100%" }}
            options={[
              { label: "Weekly", value: "weekly" },
              { label: "Monthly", value: "monthly" },
              { label: "Yearly", value: "yearly" },
            ]}
          />
        </Col>
      </Row>

      {/* STATS */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        {stats.map((item, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Card
              style={{
                borderRadius: adminTheme.token.borderRadius,
                boxShadow: adminTheme.token.boxShadow,
              }}
            >
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ fontSize: 24 }}>
                  {item.icon}
                </span>
                <Text>{item.title}</Text>
              </div>
              <Title level={2}>{item.value}</Title>
            </Card>
          </Col>
        ))}
      </Row>

      {/* TABLE */}
      <Row style={{ marginTop: 30 }}>
        <Col span={24}>
          <Card title={`Upcoming Sessions (${upcomingSessions.length})`}>
            <div style={{ overflowX: "auto" }}>
              <Table
                columns={columns}
                dataSource={upcomingSessions}
                rowKey="key"
                scroll={{ x: 800 }}
                pagination={{
                  ...pagination,
                  total: upcomingSessions.length,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                }}
                onChange={(pag) => {
                  setPagination(pag);
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* COMPLETE MODAL */}
      <Modal title="Confirm Completion" open={confirmModal} onCancel={() => { setConfirmModal(false); setSelectedSession(null); }} onOk={() => { if (selectedSession?.key) { setCompletedIds((prev) => (prev.includes(selectedSession.key) ? prev : [...prev, selectedSession.key])); } message.success("Session marked as completed!"); setConfirmModal(false); setSelectedSession(null); }} okText="Yes, Complete" cancelText="Cancel" okButtonProps={{ style: { backgroundColor: "#52c41a", borderColor: "#52c41a", color: "#fff", }, }} > <p> Are you sure you want to mark session{" "} <strong>{selectedSession?.studentName}</strong> as completed? </p> </Modal>
      {/* LOCATION MODAL */}
      <Modal
        title={`Location Details`}
        open={locationModal}
        onCancel={() => setLocationModal(false)}
        footer={[
          <Button key="map" type="primary" onClick={() => {
            const address = `${selectedSession.location.officeName}, ${selectedSession.location.area}, ${selectedSession.location.city}`;
            window.open(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
              "_blank"
            );
          }}>
            Open in Google Maps
          </Button>,
          <Button key="close" onClick={() => setLocationModal(false)}>
            Close
          </Button>,
        ]}
      >
        {selectedSession?.location && (
          <div style={{ lineHeight: "1.8" }}>
            {/* <h3>{selectedSession.location.counselorName}</h3> */}
            <p><strong>{selectedSession.location.officeName}</strong></p>
            <p>{selectedSession.location.building}</p>
            <p>{selectedSession.location.landmarkLine1}</p>
            <p>{selectedSession.location.area}, {selectedSession.location.city} – {selectedSession.location.pincode}</p>
            <p>{selectedSession.location.state}</p>

            <Divider />

            <h4>📌 Important Notes</h4>
            <p>• {selectedSession.location.nearby}</p>
            <p>• {selectedSession.location.instructions}</p>
            <p>• {selectedSession.location.parking}</p>
          </div>
        )}
      </Modal>
      {/* NOTES MODAL */}
      <Modal
        title={`Session Notes - ${selectedSession?.studentName || ""}`}
        open={notesModal}
        onCancel={() => setNotesModal(false)}
        footer={null}
        width={screens.xs ? "95%" : 900}
      >
        <SessionNotesModal
          session={selectedSession}
          onClose={() => setNotesModal(false)}
        />
      </Modal>

      {/* PROFILE MODAL */}
      <StudentProfileModal
        open={profileModal}
        onClose={() => setProfileModal(false)}
        student={selectedSession}
      />
    </div>
  );
};

export default CounsellorDashboard;