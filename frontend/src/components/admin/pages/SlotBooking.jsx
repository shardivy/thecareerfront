import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import CreateSessionModal from "../modals/CreateSessionModal";
import adminTheme from "../../../theme/adminTheme";

const { Title, Text } = Typography;
const { Option } = Select;
const { token } = adminTheme;

const SlotBooking = () => {
  const [searchText, setSearchText] = useState("");
  const [modeFilter, setModeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState(null);

  // ✅ ADDED (nothing else touched)
  const [modalMode, setModalMode] = useState("create"); // create | edit | view

  const [dataSource, setDataSource] = useState([
    {
      key: "1",
      user: "Priya Sharma",
      email: "priya.sharma@email.com",
      sessionType: "Initial Counselling",
      counsellors: [
        { name: "Dr. Ramesh Gupta", type: "lead" },
        { name: "Ms. Priya Menon", type: "normal" },
      ],
      date: "2026-01-15",
      time: "10:00 AM - 11:00 AM (60 mins)",
      mode: "Online",
      status: "Scheduled",
    },
    {
      key: "2",
      user: "Rajesh Kumar",
      email: "rajesh.kumar@email.com",
      sessionType: "Follow-up Session",
      counsellors: [{ name: "Ms. Priya Menon", type: "normal" }],
      date: "2026-01-12",
      time: "02:00 PM - 03:00 PM (60 mins)",
      mode: "Online",
      status: "Completed",
    },
    {
      key: "3",
      user: "Anjali Verma",
      email: "anjali.verma@email.com",
      sessionType: "Report Review",
      counsellors: [{ name: "Dr. Ramesh Gupta", type: "lead" }],
      date: "2026-01-16",
      time: "11:00 AM - 12:00 PM (60 mins)",
      mode: "Offline",
      status: "Scheduled",
    },
  ]);

  /* ----------------- STATS DATA ----------------- */
  const stats = [
    {
      title: "Total Sessions",
      value: 284,
      icon: <CalendarOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
    },
    {
      title: "Today's Sessions",
      value: 12,
      sub: "5 completed, 7 upcoming",
      icon: <ClockCircleOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
    },
    {
      title: "This Week",
      value: 38,
      icon: <CalendarOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
    },
    {
      title: "Completed",
      value: 234,
      icon: <CheckCircleOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
    },
  ];

  /* ----------------- FILTER + SORT LOGIC ----------------- */
  const filteredData = dataSource
    .filter((item) => {
      const matchesSearch = Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesMode = modeFilter ? item.mode === modeFilter : true;
      const matchesStatus = statusFilter ? item.status === statusFilter : true;
      const matchesDate = dateFilter
        ? dayjs(item.date).isSame(dateFilter, "day")
        : true;
      return matchesSearch && matchesMode && matchesStatus && matchesDate;
    })
    .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, modeFilter, statusFilter, dateFilter]);

  /* ----------------- TABLE COLUMNS ----------------- */
  const columns = [
    { title: "Sr. No.", width: 50, render: (_, __, index) => index + 1 },
    {
      title: "User Name",
      dataIndex: "user",
      width: 130,
       render: (text, record) => (
    <>
      <Text strong>{text}</Text>
      <br />
      <Text type="colorTextSecondary" >
        {record.email}
      </Text>
    </>
  ),
    },
    {
      title: "Counsellors",
      width: 150,
      render: (_, record) => (
        <>
          {record.counsellors.map((c, index) => (
            <div key={index} style={{ marginBottom: 4 }}>
              <Text strong>{c.name}</Text>
              <br />
              <Tag>{c.type === "lead" ? "Lead" : "Normal"}</Tag>
            </div>
          ))}
        </>
      ),
    },
    {
      title: "Date & Time",
      width: 160,
      render: (_, record) => (
        <>
          <Text>{record.date}</Text>
          <br />
          <Text type="colorTextSecondary">{record.time}</Text>
        </>
      ),
    },
    {
      title: "Mode",
      dataIndex: "mode",
      width: 80,
      render: (mode) => <Tag>{mode}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (status) => <Tag>{status}</Tag>,
    },
    {
      title: "Actions",
      width: 120,
      render: (_, record) => (
        <Space size="small" style={{ whiteSpace: "nowrap" }}>
          {/* VIEW */}
          <Button
            icon={<EyeOutlined />}
            size="large"
            onClick={() => {
              setRescheduleData(record);
              setModalMode("view");
              setIsModalOpen(true);
            }}
          >
            View
          </Button>

          {/* EDIT */}
          <Button
            icon={<EditOutlined />}
            type="primary"
            size="large"
            onClick={() => {
              setRescheduleData(record);
              setModalMode("edit");
              setIsModalOpen(true);
            }}
          >
            Edit
          </Button>

          {/* DELETE */}
          <Popconfirm
            title="Delete Content"
            description="Are you sure you want to delete this booking?"
            onConfirm={() => handleDelete(record)}
            onCancel={() => {}}
            okText="Yes"
            cancelText="No"
          >
            <Button danger size="large" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSaveSession = (session) => {
    if (modalMode === "edit") {
      setDataSource((prev) =>
        prev.map((item) =>
          item.key === rescheduleData.key ? { ...item, ...session } : item
        )
      );
    } else {
      setDataSource((prev) => [
        ...prev,
        { key: Date.now().toString(), ...session },
      ]);
    }
  };

  const getBookedSlots = (date) => {
    if (!date) return [];
    return dataSource
      .filter((s) => s.date === dayjs(date).format("YYYY-MM-DD"))
      .map((s) => s.time.split(" (")[0]);
  };

  const handleDelete = (record) => {
  setDataSource((prev) =>
    prev.filter((item) => item.key !== record.key)
  );
};


  return (
    <div style={{ padding: "8px 12px", maxWidth: "1400px", margin: "0 auto" }}>
      <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Title level={3} style={{ marginBottom: 0 }}>Counselling Sessions</Title>
        </Col>
        <Col xs={24} md={12} style={{ textAlign: "right" }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setRescheduleData(null);
              setModalMode("create");
              setIsModalOpen(true);
            }}
            style={{ width: "100%", maxWidth: "140px" }}
          >
            Create Session
          </Button>
        </Col>
      </Row>
<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
  {stats.map((item, index) => (
    <Col xs={24} sm={12} md={6} key={index}>
      <Card
        style={{
          height: 140,              // ✅ FIXED HEIGHT
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Text>{item.title}</Text>

        <Title level={2} style={{ margin: 0 }}>
          {item.value}
        </Title>

        {/* reserve space even if sub text not present */}
        <Text style={{ minHeight: 22 }}>
          {item.sub || ""}
        </Text>
      </Card>
    </Col>
  ))}
</Row>


      <Card>
        <Title level={5}>Upcoming Session ({filteredData.length})</Title>

        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={10}>
            <Input
              placeholder="Search by name, type, etc..."
              prefix={<SearchOutlined />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="middle"
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select placeholder="Mode" allowClear onChange={setModeFilter} style={{ width: "100%" }}>
              <Option value="Online">Online</Option>
              <Option value="Offline">Offline</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select placeholder="Status" allowClear onChange={setStatusFilter} style={{ width: "100%" }}>
              <Option value="Scheduled">Scheduled</Option>
              <Option value="Completed">Completed</Option>
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <DatePicker style={{ width: "100%" }} onChange={(d) => setDateFilter(d)} />
          </Col>
        </Row>

        <div style={{ overflowX: "auto", width: "100%" }}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="key"
            pagination={{ pageSize }}
            size="small"
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>

      <CreateSessionModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSession}
        sessionData={
          rescheduleData
            ? { ...rescheduleData, slot: rescheduleData.time.split(" (")[0] }
            : null
        }
        bookedSlots={getBookedSlots(rescheduleData?.date)}
        mode={modalMode}
      />
    </div>
  );
};

export default SlotBooking;
