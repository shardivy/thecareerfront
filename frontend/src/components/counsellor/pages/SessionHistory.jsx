// src/components/counsellor/SessionHistory.jsx

import React, { useState } from "react";
import {
  Card,
  Table,
  Typography,
  Row,
  Col,
  Input,
  DatePicker,
  Select,
  Button,
  Space,
  Modal,
  Grid,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import StudentProfileModal from "../modals/StudentProfileModal";
import SessionNotesModal from "../modals/SessionNotesModal";

const { Title } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const SessionHistory = () => {
  const screens = useBreakpoint();

  /* ================= DUMMY DATA ================= */
  const sessions = [
    {
      id: 1,
      studentName: "Rahul Sharma",
      email: "rahul@gmail.com",
      phone: "9876543210",
      date: "2026-02-25",
      startTime: "15:00",
      endTime: "16:00",
      mode: "Online",
      discussion:
        "Student showed improvement in focus. Suggested weekly practice plan.",
    },
    {
      id: 2,
      studentName: "Anjali Verma",
      email: "anjali@gmail.com",
      phone: "9999999999",
      date: "2026-02-20",
      startTime: "10:30",
      endTime: "11:30",
      mode: "Offline",
    },
  ];

  /* ================= STATES ================= */
  const [searchText, setSearchText] = useState("");
  const [filterDate, setFilterDate] = useState(null);
  const [filterMode, setFilterMode] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  const [profileOpen, setProfileOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  /* ================= FILTER LOGIC ================= */
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.studentName
      .toLowerCase()
      .includes(searchText.toLowerCase());

    const matchesDate = filterDate
      ? dayjs(session.date).format("YYYY-MM-DD") ===
        dayjs(filterDate).format("YYYY-MM-DD")
      : true;

    const matchesMode = filterMode ? session.mode === filterMode : true;

    return matchesSearch && matchesDate && matchesMode;
  });

  /* ================= TABLE COLUMNS ================= */
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
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space
          direction={screens.xs ? "vertical" : "horizontal"}
          style={{ width: "100%" }}
        >
          <Button
            icon={<UserOutlined />}
            block={screens.xs}
            onClick={() => {
              setSelectedSession(record);
              setProfileOpen(true);
            }}
          >
            View Profile
          </Button>

          <Button
            type="primary"
            icon={<FileTextOutlined />}
            block={screens.xs}
            onClick={() => {
              setSelectedSession(record);
              setNotesOpen(true);
            }}
          >
            View Notes
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: screens.xs ? 10 : 16 }}>
      <Title
        level={screens.xs ? 4 : 3}
        style={{ textAlign: screens.xs ? "center" : "left" }}
      >
        Session History
      </Title>

      <Card style={{ marginTop: 16 }}>
        {/* ================= FILTER SECTION ================= */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={8}>
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by Mode"
              allowClear
              style={{ width: "100%" }}
              value={filterMode}
              onChange={setFilterMode}
            >
              <Option value="Online">Online</Option>
              <Option value="Offline">Offline</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <DatePicker
              style={{ width: "100%" }}
              value={filterDate}
              onChange={setFilterDate}
            />
          </Col>
        </Row>

        {/* ================= TABLE ================= */}
        <div style={{ overflowX: "auto" }}>
         <Table
  columns={columns}
  dataSource={filteredSessions}
  rowKey="id"
  pagination={{
    current: pagination.current,
    pageSize: pagination.pageSize,
    showSizeChanger: true,
    pageSizeOptions: [5, 10, 20, 50],
    onChange: (page, pageSize) => {
      setPagination({
        current: page,
        pageSize: pageSize,
      });
    },
  }}
  scroll={{ x: 800 }}
/>
        </div>
      </Card>

      {/* PROFILE MODAL */}
      <StudentProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        student={selectedSession}
      />

      {/* NOTES MODAL */}
      <Modal
        title={`Session Notes - ${selectedSession?.studentName || ""}`}
        open={notesOpen}
        onCancel={() => setNotesOpen(false)}
        footer={null}
        width={screens.xs ? "100%" : screens.md ? 700 : 900}
        style={{ top: screens.xs ? 10 : 50 }}
        bodyStyle={{ padding: screens.xs ? 12 : 24 }}
      >
        <SessionNotesModal
          session={selectedSession}
          isViewMode={true}
          onClose={() => setNotesOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default SessionHistory;