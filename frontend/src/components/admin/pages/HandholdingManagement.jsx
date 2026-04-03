import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Tabs,
  Table,
  Button,
  Progress,
  Space,
  Tag,
  theme,
  Grid,
  Modal,
  message,
  Input,
  Select,
} from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import HHSessionModal from "../modals/HHSessionModal";
import { title } from "framer-motion/client";
import HHUserProfileModal from "../modals/HHUserProfileModal";
import EditHHUserModal from "../modals/EditHHUserModal";
import CertificateTemplateModal from "../modals/CertificateTemplateModal";
import HHSessionBookingModal from "../modals/HHSessionBookingModal";
import GenerateCertificateModal from "../modals/GenerateCertificateModal";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const HandholdingManagement = () => {
  const { token } = theme.useToken();
  const screens = useBreakpoint();

  const [activeTab, setActiveTab] = useState("sessions");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionSearch, setSessionSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [certificateSearch, setCertificateSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [certificationFilter, setCertificationFilter] = useState("");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [selectedCertificateUser, setSelectedCertificateUser] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingMode, setBookingMode] = useState("create"); // create | edit | view
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  /* ================= PAGINATION STATE ================= */
  const [sessionPagination, setSessionPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  const handleEditBooking = (record) => {
    setSelectedBooking(record);
    setBookingMode("edit");   // 🔥 IMPORTANT
    setBookingModalOpen(true);
  };

  const handleViewBooking = (record) => {
    setSelectedBooking(record);
    setBookingMode("view");
    setBookingModalOpen(true);
  };

  const handleDeleteClick = (record) => {
    setSelectedSession(record);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setSessions((prev) =>
      prev.filter((item) => item.id !== selectedSession.id)
    );

    message.success("Session deleted successfully");

    setDeleteModalOpen(false);
    setSelectedSession(null);
  };

  const handleSubmitSession = (values) => {
    if (editingSession) {
      // UPDATE
      setSessions((prev) =>
        prev.map((item) =>
          item.id === editingSession.id
            ? { ...item, ...values }
            : item
        )
      );

      message.success("Session updated successfully");
    } else {
      // CREATE
      const newSession = {
        id: Date.now(),
        ...values,
      };

      setSessions((prev) => [...prev, newSession]);

      message.success("Session added successfully 🎉");
    }

    setModalOpen(false);
    setEditingSession(null);
  };

  /* ================= STATS ================= */
  const stats = [
    {
      title: "Total Sessions",
      value: 10,
      icon: (
        <FileTextOutlined style={{ fontSize: 22, color: token.colorPrimary }} />
      ),
    },
    {
      title: "Active Users",
      value: 25,
      icon: (
        <UserOutlined style={{ fontSize: 22, color: token.colorSuccess }} />
      ),
    },
    {
      title: "Completed Users",
      value: 12,
      icon: (
        <CheckCircleOutlined
          style={{ fontSize: 22, color: token.colorWarning }}
        />
      ),
    },
    {
      title: "Certificates Issued",
      value: 8,
      icon: (
        <TrophyOutlined style={{ fontSize: 22, color: token.colorError }} />
      ),
    },
  ];



  /* ================= SESSION TEMPLATE ================= */
  const [sessions, setSessions] = useState(
    Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `Session ${i + 1}`,
      description: "Session description here",
      status: i % 2 === 0 ? "completed" : "pending",
    }))
  );

  const sessionColumns = [
    {
      title: "Sr No",
      width: 80,
      render: (_, __, index) =>
        (sessionPagination.current - 1) * sessionPagination.pageSize +
        index +
        1,
    },
    {
      title: "Session",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* GREEN TICK */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "2px solid #22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ecfdf5",
            }}
          >
            <CheckCircleOutlined
              style={{
                color:
                  record.status === "completed" ? "#22c55e" : "#d1d5db",
              }}
            />
          </div>

          {/* TEXT */}
          <div>
            <Text strong>{record.title}</Text>
            <div style={{ color: "#888" }}>{record.description}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      align: "right",
      render: (_, record) => (
        <Tag
          color={record.status === "completed" ? "success" : "default"}
          style={{ borderRadius: 20 }}
        >
          {record.status === "completed" ? "Completed" : "Pending"}
        </Tag>
      ),
    },
    {
      title: "Action",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteClick(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    }
  ];

  /* ================= USERS ================= */
  const users = [
    {
      id: 1,
      name: "Rahul Sharma",
      email: "rahul@gmail.com",
      completedSessions: 7,
      totalSessions: 10,
      paymentStatus: "Partial Paid",
      certificationStatus: "pending",
    },
    {
      id: 2,
      name: "Priya Singh",
      email: "priya@gmail.com",
      completedSessions: 10,
      totalSessions: 10,
      paymentStatus: "Fully Paid",
      certificationStatus: "issued",
    },
  ];

  const userColumns = [
    {
      title: "Sr No",
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Username / Email",
      width: 120,
      render: (_, record) => (
        <div>
          <Text strong>{record.name}</Text>
          <div>{record.email}</div>
        </div>
      ),
    },
    {
      title: "Progress",
      render: (_, record) => {
        const percent =
          (record.completedSessions / record.totalSessions) * 100;

        return (
          <div>
            <Progress
              percent={percent}
              size={screens.xs ? "small" : "default"}
            />
            <Text>
              {record.completedSessions}/{record.totalSessions} Sessions
            </Text>
          </div>
        );
      },
    },
    {
      title: "Session Status",
      width: 120,
      render: (_, record) =>
        record.completedSessions === record.totalSessions ? (
          <Tag color="success">Completed</Tag>
        ) : (
          <Tag color="processing">In Progress</Tag>
        ),
    },
    {
      title: "Payment Status",
      width: 120,
      render: (_, record) => {
        let color = "default";

        if (record.paymentStatus === "Fully Paid") {
          color = "success";
        } else if (record.paymentStatus === "Partial Paid") {
          color = "warning";
        } else {
          color = "error";
        }

        return <Tag color={color}>{record.paymentStatus}</Tag>;
      },
    },
    {
      title: "Certification Status",
      width: 120,
      render: (_, record) => {
        const isIssued = record.certificationStatus === "issued";

        return (
          <Tag color={isIssued ? "success" : "warning"}>
            {isIssued ? "Issued" : "Pending"}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      render: (_, record) => {
        const isCompleted =
          record.completedSessions === record.totalSessions;

        return (
          <Space wrap>
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedUser(record);
                setUserModalOpen(true);
              }}
            >
              View
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedUser(record);   // ✅ store user
                setEditModalOpen(true);    // ✅ open edit modal
              }}
            >
              Edit
            </Button>

            {/* ✅ SHOW ONLY IF COMPLETED */}
            {isCompleted && (
              <Button
                type="primary"
                onClick={() => {
                  setSelectedCertificateUser(record); // ✅ correct user
                  setCertificateModalOpen(true);      // ✅ open modal
                }}
              >
                Issue Certificate
              </Button>
            )}
          </Space>
        );
      },
    }
  ];

  /* ================= CERTIFICATION ================= */
  const completedUsers = users.filter(
    (u) => u.completedSessions === u.totalSessions
  );

  const certificateColumns = [
    {
      title: "Sr No",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "User",
      render: (_, record) => (
        <div>
          <Text strong>{record.name}</Text>
          <div>{record.email}</div>
        </div>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space wrap>
          <Button icon={<EyeOutlined />}>View</Button>
          <Button icon={<EditOutlined />}>Edit</Button>
        </Space>
      ),
    },
  ];


  const filteredSessions = sessions.filter((item) =>
    item.title.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  const filteredUsers = users.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      item.email.toLowerCase().includes(userSearch.toLowerCase());

    const matchesPayment =
      !paymentFilter || item.paymentStatus === paymentFilter;

    const matchesCertification =
      !certificationFilter || item.certificationStatus === certificationFilter;

    return matchesSearch && matchesPayment && matchesCertification;
  });

  const filteredCertificates = completedUsers.filter((item) =>
    item.name.toLowerCase().includes(certificateSearch.toLowerCase()) ||
    item.email.toLowerCase().includes(certificateSearch.toLowerCase())
  );

  const bookingsData = [
    {
      id: 1,
      name: "Rahul Sharma",
      email: "rahul@gmail.com",
      session: "Session 1",
      date: "2026-04-03",
      time: "10:00 AM - 11:00 AM",
      status: "booked",
    },
    {
      id: 2,
      name: "Priya Singh",
      email: "priya@gmail.com",
      session: "Session 2",
      date: "2026-04-04",
      time: "12:00 PM - 01:00 PM",
      status: "rescheduled",
    },
  ];

  const bookingColumns = [
    {
      title: "Sr No",
      render: (_, __, index) => index + 1,
    },
    {
      title: "User",
      render: (_, record) => (
        <div>
          <Text strong>{record.name}</Text>
          <div>{record.email}</div>
        </div>
      ),
    },
    {
      title: "Session",
      dataIndex: "session",
    },
    {
      title: "Date",
      dataIndex: "date",
    },
    {
      title: "Time",
      dataIndex: "time",
    },
    {
      title: "Status",
      render: (_, record) => (
        <Tag color={record.status === "booked" ? "green" : "orange"}>
          {record.status === "booked" ? "Booked" : "Rescheduled"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewBooking(record)}
          >
            View
          </Button>

          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditBooking(record)}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col span={24}>
          <Title level={3} style={{ marginBottom: 0 }}>
            Handholding Management
          </Title>
        </Col>
      </Row>

      {/* STATS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {stats.map((item, index) => (
          <Col xs={24} sm={12} md={12} lg={6} key={index}>
            <Card
              bordered={false}
              style={{
                height: screens.xs ? 110 : 130,
                borderRadius: 12,
                boxShadow: token.boxShadow,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <div>
                  <Text style={{ color: token.colorTextSecondary }}>
                    {item.title}
                  </Text>
                  <Title level={3}>{item.value}</Title>
                </div>
                {item.icon}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* TABS */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[

          { key: "users", label: "Handholding Users" },
          { key: "sessions", label: "Session Template" },
          { key: "bookings", label: "Booked / Rescheduled" },
          { key: "certificates", label: "Certification" },


        ]}
      />

      <Card>
        {/* SESSION TEMPLATE */}
        {activeTab === "sessions" && (
          <>
            <Row style={{ marginBottom: 16 }} gutter={10}>
              <Col xs={24} md={12}>
                <Input
                  placeholder="Search session..."
                  prefix={<SearchOutlined />}
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  allowClear
                />
              </Col>

              <Col xs={24} md={12} style={{ textAlign: "right" }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingSession(null);
                    setModalOpen(true);
                  }}
                >
                  Add Session
                </Button>
              </Col>
            </Row>

            <Table
              columns={sessionColumns}
              dataSource={filteredSessions}
              rowKey="id"
              rowClassName={() => "custom-row"}
              pagination={{
                ...sessionPagination,
                showSizeChanger: false,
              }}
              onChange={(pag) => setSessionPagination(pag)}
              scroll={{ x: "max-content" }}
            />
          </>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <>
            <Row
              style={{ marginBottom: 16 }}
              gutter={[12, 12]}
            >
              {/* SEARCH - BIGGER */}
              <Col xs={24} sm={24} md={12} lg={14}>
                <Input
                  placeholder="Search..."
                  prefix={<SearchOutlined />}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  allowClear
                  size="large"
                />
              </Col>

              {/* PAYMENT FILTER - SMALLER */}
              <Col xs={24} sm={12} md={6} lg={5}>
                <Select
                  placeholder="Payment Status"
                  value={paymentFilter || undefined}
                  onChange={(value) => setPaymentFilter(value)}
                  allowClear
                  size="large"
                  style={{ width: "100%" }}
                >
                  <Select.Option value="Fully Paid">Fully Paid</Select.Option>
                  <Select.Option value="Partial Paid">Partial Paid</Select.Option>
                  <Select.Option value="Not Paid">Not Paid</Select.Option>
                </Select>
              </Col>

              {/* CERTIFICATION FILTER - SMALLER */}
              <Col xs={24} sm={12} md={6} lg={5}>
                <Select
                  placeholder="Certification Status"
                  value={certificationFilter || undefined}
                  onChange={(value) => setCertificationFilter(value)}
                  allowClear
                  size="large"
                  style={{ width: "100%" }}
                >
                  <Select.Option value="issued">Issued</Select.Option>
                  <Select.Option value="pending">Pending</Select.Option>
                </Select>
              </Col>
            </Row>

            {/* TABLE */}
            <Table
              columns={userColumns}
              dataSource={filteredUsers}
              rowKey="id"
              scroll={{ x: "max-content" }}
            />
          </>
        )}

        {/* CERTIFICATES */}
    {activeTab === "certificates" && (
  <>
    {/* ================= TOP STATUS CARDS ================= */}
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      
      {/* Pending */}
      <Col xs={24} md={8}>
        <Card
          style={{
            borderRadius: 16,
            background: "#fff7e6",
            border: "1px solid #ffe7ba",
          }}
        >
          <Space direction="vertical">
            <Space>
              <TrophyOutlined style={{ color: "#d97706", fontSize: 18 }} />
              <Text strong>Pending Generation</Text>
            </Space>

            <Title level={2} style={{ margin: 0 }}>1</Title>

            <Text type="colorTextSecondary">
              Students awaiting certificates
            </Text>

           <Button block style={{ marginTop: 10 }} onClick={() => setGenerateModalOpen(true)}>
  Generate Certificates
</Button>
          </Space>
        </Card>
      </Col>

      {/* Ready */}
      <Col xs={24} md={8}>
        <Card
          style={{
            borderRadius: 16,
            background: "#f0f5ff",
            border: "1px solid #d6e4ff",
          }}
        >
          <Space direction="vertical">
            <Space>
              <CheckCircleOutlined style={{ color: "#2563eb", fontSize: 18 }} />
              <Text strong>Ready to Issue</Text>
            </Space>

            <Title level={2} style={{ margin: 0 }}>1</Title>

            <Text type="colorTextSecondary">
              Certificates ready for delivery
            </Text>

            <Button block style={{ marginTop: 10 }}>
              Issue Certificates
            </Button>
          </Space>
        </Card>
      </Col>

      {/* Issued */}
      <Col xs={24} md={8}>
        <Card
          style={{
            borderRadius: 16,
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
          }}
        >
          <Space direction="vertical">
            <Space>
              <CheckCircleOutlined style={{ color: "#16a34a", fontSize: 18 }} />
              <Text strong>Issued</Text>
            </Space>

            <Title level={2} style={{ margin: 0 }}>1</Title>

            <Text type="colorTextSecondary">
              Successfully delivered
            </Text>

            <Button block style={{ marginTop: 10 }}>
              View All
            </Button>
          </Space>
        </Card>
      </Col>
    </Row>

    {/* ================= CERTIFICATE TEMPLATES ================= */}
    <Card
      title="Certificate Templates"
      style={{ borderRadius: 16 }}
    >
      <Row gutter={[16, 16]}>
        
        {/* Template 1 */}
        <Col xs={24} md={12}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              border: "1px solid #f0f0f0",
            }}
          >
            <Space
              direction="vertical"
              style={{ width: "100%" }}
            >
              <Row justify="space-between">
                <Text strong>Career Discovery Certificate</Text>
                <Tag color="green">Active</Tag>
              </Row>

              <Text type="colorTextSecondary">
                Standard certificate for career discovery program completion
              </Text>

              <Button type="primary">
                Use Template
              </Button>
            </Space>
          </Card>
        </Col>

        {/* Template 2 */}
        <Col xs={24} md={12}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              border: "1px solid #f0f0f0",
            }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Row justify="space-between">
                <Text strong>Professional Skills Certificate</Text>
                <Tag color="green">Active</Tag>
              </Row>

              <Text type="colorTextSecondary">
                Certificate for professional development program completion
              </Text>

              <Button type="primary">
                Use Template
              </Button>
            </Space>
          </Card>
        </Col>

      </Row>
    </Card>
  </>
)}

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <>
            <Row style={{ marginBottom: 16 }} gutter={10}>
              <Col xs={24} md={12}>
                <Input
                  placeholder="Search bookings..."
                  prefix={<SearchOutlined />}
                  allowClear
                />
              </Col>
            </Row>

            <Table
              columns={bookingColumns}
              dataSource={bookingsData}
              rowKey="id"
              scroll={{ x: "max-content" }}
            />
          </>
        )}
      </Card>

      {/* CUSTOM CSS */}
      <style>
        {`
          .custom-row {
            background: #f9fafb;
          }

          .ant-table-tbody > tr.custom-row > td {
            border-bottom: none !important;
            padding: 16px !important;
          }

          .ant-table-tbody > tr.custom-row {
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            border-radius: 12px;
          }

          .ant-table {
            background: transparent !important;
          }
        `}
      </style>

      <HHSessionModal
        open={modalOpen}
        centered
        onCancel={() => {
          setModalOpen(false);
          setEditingSession(null);
        }}
        onSubmit={handleSubmitSession}
        initialValues={editingSession}
      />

      <HHUserProfileModal
        open={userModalOpen}
        onClose={() => {
          setUserModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <EditHHUserModal
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        userData={selectedUser}
        onSubmit={(formData) => {
          dispatch(updateHHUser(formData));
        }}
      />

      <CertificateTemplateModal
        open={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
        onSelect={(template) => {
          console.log("Selected Template:", template);
          console.log("User:", selectedCertificateUser);

          message.success(`Certificate issued using ${template.name}`);

          setCertificateModalOpen(false);
        }}
      />

      <GenerateCertificateModal
  open={generateModalOpen}
  onClose={() => setGenerateModalOpen(false)}
  templates={[
    { id: 1, name: "Career Discovery Certificate", description: "Standard certificate for career discovery program completion" },
    { id: 2, name: "Professional Skills Certificate", description: "Certificate for professional development program completion" },
  ]}
  students={users.filter(u => u.completedSessions === u.totalSessions)} // only completed users
/>

      <HHSessionBookingModal
        visible={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setSelectedBooking(null);
        }}
        mode={bookingMode}   // 🔥 edit / view / create
        data={selectedBooking}  // 🔥 pass selected row
        onSave={() => {
          message.success("Booking updated");
        }}
      />

      <Modal
        title="Delete Session"
        open={deleteModalOpen}
        centered
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setSelectedSession(null);
        }}
        okText="Delete"
        okType="default"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to delete{" "}
          <strong>{selectedSession?.title}</strong>?
        </p>
      </Modal>
    </div>
  );
};

export default HandholdingManagement;