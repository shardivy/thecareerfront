import React, { useState } from "react";
import {
  Card,
  Table,
  Typography,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Row,
  Col,
  message,
  Modal,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
  UnlockOutlined,
  BellOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const ExamManagements = () => {
  /* ================= DATA ================= */
const [examRecords, setExamRecords] = useState([
  {
    key: 1,
    userName: "Priya Sharma",
    email: "priya.sharma@email.com",
    program: "Engineering Career Path",
    status: "Awaiting Approval",
    completedDate: "-",
    approvedBy: null,
  },
  {
    key: 2,
    userName: "Rajesh Kumar",
    email: "rajesh.kumar@email.com",
    program: "Medical Career Guidance",
    status: "In Progress",
    completedDate: "-",
    approvedBy: null,
  },
  {
    key: 3,
    userName: "Anjali Verma",
    email: "anjali.verma@email.com",
    program: "MBA Preparation",
    status: "Completed",
    completedDate: "2026-01-10",
    approvedBy: {
      name: "Admin John",
      role: "Admin",
    },
  },
  {
    key: 4,
    userName: "Vikram Singh",
    email: "vikram.singh@email.com",
    program: "Career Assessment",
    status: "Not Started",
    completedDate: "-",
    approvedBy: null,
  },
]);


  /* ================= STATES ================= */
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  /* ================= APPROVE ================= */
  const handleApproveExam = (key) => {
    confirm({
      title: "Approve Exam?",
      icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      content:
        "Are you sure you want to approve this exam? The student's report will be unlocked.",
      centered: true,
      okText: "Yes, Approve",
      okType: "primary",
      okButtonProps: {
        style: { background: "#52c41a", borderColor: "#52c41a" },
      },
      cancelText: "Cancel",
      onOk() {
        setExamRecords((prev) =>
          prev.map((item) =>
            item.key === key
              ? {
                  ...item,
                  status: "Completed",
                  completedDate: new Date().toISOString().split("T")[0],
                  approvedBy: {
                    name: "Admin John", // 🔑 replace with logged-in user
                    role: "Admin",
                  },
                }
              : item
          )
        );
        message.success("Exam approved successfully. Report unlocked!");
      },
    });
  };

  /* ================= REJECT ================= */
  const handleRejectExam = (key) => {
    confirm({
      title: "Reject Exam?",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content:
        "Are you sure you want to reject this exam? This action cannot be undone.",
      centered: true,
      okText: "Yes, Reject",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        setExamRecords((prev) =>
          prev.map((item) =>
            item.key === key
              ? {
                  ...item,
                  status: "Rejected",
                  approvedBy: null,
                }
              : item
          )
        );
        message.warning("Exam rejected successfully.");
      },
    });
  };

  /* ================= REMINDER ================= */
  const handleSendReminder = () => {
    message.success("Reminder sent successfully to the student!");
  };

  /* ================= FILTER ================= */
  const filteredData = examRecords.filter((item) => {
    const search = searchText.toLowerCase();

    const matchesSearch =
      item.userName.toLowerCase().includes(search) ||
      item.program.toLowerCase().includes(search);

    const matchesStatus = statusFilter
      ? item.status === statusFilter
      : true;

    return matchesSearch && matchesStatus;
  });

  /* ================= STATUS TAG ================= */
  const renderStatus = (status) => {
    switch (status) {
      case "Completed":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Approved
          </Tag>
        );
      case "Awaiting Approval":
        return (
          <Tag icon={<ExclamationCircleOutlined />} color="warning">
            Awaiting <br></br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Approval
          </Tag>
        );
      case "In Progress":
        return (
          <Tag icon={<ClockCircleOutlined />} color="processing">
            In Progress
          </Tag>
        );
      case "Rejected":
        return (
          <Tag icon={<MinusCircleOutlined />} color="error">
            Rejected
          </Tag>
        );
      default:
        return <Tag>Not Started</Tag>;
    }
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      title: "Sr. No",
      render: (_, __, index) => index + 1,
    },
    {
  title: "User Name",
  dataIndex: "userName",
  render: (_, record) => (
    <Space direction="vertical" size={0}>
      <Text strong>{record.userName}</Text>
      <Text type="colorTextSecondary" >
        {record.email}
      </Text>
    </Space>
  ),
},

    {
      title: "Program",
      dataIndex: "program",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: renderStatus,
    },
    {
      title: "Completed Date",
      dataIndex: "completedDate",
      render: (date) => <Text type="colorTextSecondary">{date}</Text>,
    },
    {
      title: "Approved By",
      dataIndex: "approvedBy",
      render: (approvedBy) =>
        approvedBy ? (
          <Space direction="vertical" size={0}>
            <Text strong>{approvedBy.name}</Text>
            <Tag color="blue">{approvedBy.role}</Tag>
          </Space>
        ) : (
          <Text type="colorTextSecondary">-</Text>
        ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          {(record.status === "Awaiting Approval" ||
            record.status === "In Progress") && (
            <>
              <Button
                type="primary"
                icon={<UnlockOutlined />}
                onClick={() => handleApproveExam(record.key)}
              >
                Approve
              </Button>

              <Button
                danger
                icon={<MinusCircleOutlined />}
                onClick={() => handleRejectExam(record.key)}
              >
                Reject
              </Button>
            </>
          )}

          {record.status === "Not Started" && (
            <Button
              icon={<BellOutlined />}
              onClick={handleSendReminder}
            >
              Send Reminder
            </Button>
          )}

          {record.status === "Completed" && (
            <Button disabled type="primary">
              Approved
            </Button>
          )}

          {record.status === "Rejected" && (
            <Button disabled danger>
              Rejected
            </Button>
          )}
        </Space>
      ),
    },
  ];

  /* ================= JSX ================= */
  return (
    <div style={{ padding: 16 }}>
      <Title level={3}>User Request List</Title>

      <Card
        style={{
          borderRadius: adminTheme.token.borderRadius,
          boxShadow: adminTheme.token.boxShadow,
        }}
      >
        <Title level={4}>Records ({filteredData.length})</Title>

        {/* SEARCH + FILTER */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search by user or program"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>

          <Col xs={24} md={6}>
            <Select
              placeholder="Filter by Status"
              allowClear
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="Completed">Approved</Option>
              <Option value="Awaiting Approval">Awaiting Approval</Option>
              <Option value="In Progress">In Progress</Option>
              <Option value="Rejected">Rejected</Option>
              <Option value="Not Started">Not Started</Option>
            </Select>
          </Col>
        </Row>

        {/* TABLE */}
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 5 }}
          scroll={{ x: "max-content" }}
        />
      </Card>
    </div>
  );
};

export default ExamManagements;