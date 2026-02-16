import React, { useEffect, useState } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import { fetchUserExams, approveUserExam,  rejectUserExam,} from "../../../adminSlices/userExamSlice";
import adminTheme from "../../../theme/adminTheme";

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const ExamManagements = () => {
  const dispatch = useDispatch();

  /* ================= REDUX ================= */
  const { data: examRecords, loading } = useSelector(
    (state) => state.userExams
  );

  /* ================= LOCAL STATES ================= */
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [rollbackId, setRollbackId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);


    /* ================= APPROVE ================= */
const handleApproveExam = (id) => {
  confirm({
    title: "Approve Exam?",
    icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
    content:
      "Are you sure you want to approve this exam? The student's report will be unlocked.",
    centered: true,
    okText: "Yes, Approve",
    okButtonProps: {
      style: { background: "#52c41a", borderColor: "#52c41a" },
    },
    cancelText: "Cancel",

    async onOk() {
      try {
        const res = await dispatch(approveUserExam(id)).unwrap(); // ✅ CAPTURE RESPONSE
        message.success(res?.message || "Exam approved successfully");
        setRollbackId(null);
        dispatch(fetchUserExams());
      } catch (err) {
        message.error(
          typeof err === "string" ? err : err?.message || "Something went wrong"
        );
      }
    },
  });
};



/* ================= REJECT ================= */
const handleRejectExam = (id) => {
  confirm({
    title: "Reject Exam?",
    icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
    content:
      "Are you sure you want to reject this exam? This action cannot be undone.",
    centered: true,
    okText: "Yes, Reject",
    okType: "danger",
    cancelText: "Cancel",

    async onOk() {
      try {
        const res = await dispatch(rejectUserExam(id)).unwrap(); // ✅ CAPTURE RESPONSE
        message.success(res?.message || "Exam rejected successfully");
        setRollbackId(null);
        dispatch(fetchUserExams());
      } catch (err) {
        message.error(
          typeof err === "string" ? err : err?.message || "Something went wrong"
        );
      }
    },
  });
};




  /* ================= FETCH DATA ================= */
  useEffect(() => {
    dispatch(fetchUserExams());
  }, [dispatch]);

  const mappedData = examRecords.map((item) => ({
  id: item.id,

  // ✅ FULL NAME
  userName: `${item.first_name} ${item.last_name}`,

  email: item.email,

  // ✅ HANDLE NULL PROGRAM
  program: item.program || "-",

  // ✅ STATUS NORMALIZATION
 status:
  item.status === "completed"
    ? "Completed"
    : item.status === "not_started"
    ? "Not Started"
    : item.status === "in_progress"
    ? "In Progress"
    : item.status === "rejected"
    ? "Rejected"
    : "Awaiting Approval",


  // ✅ DATE FORMAT
completedDate: item.completed_at
  ? item.completed_at.split("T")[0]
  : "-",


  // ✅ APPROVED BY STRUCTURE
  approvedBy: item.approved_by
    ? {
        name: item.approved_by,
        role: item.approved_by_role,
      }
    : null,
}));


  /* ================= FILTER ================= */
const filteredData = mappedData.filter((item) => {
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
        return <Tag color="success">Approved</Tag>;
      case "Awaiting Approval":
        return <Tag color="warning">Awaiting Approval</Tag>;
      case "In Progress":
        return <Tag color="processing">In Progress</Tag>;
      case "Rejected":
        return <Tag color="error">Rejected</Tag>;
      default:
        return <Tag>Not Started</Tag>;
    }
  };

  /* ================= COLUMNS ================= */
  const columns = [
   {
  title: "Sr. No",
  width: 50,
  render: (_, __, index) =>
    (currentPage - 1) * pageSize + index + 1,
},

    {
      title: "User Name",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.userName}</Text>
          <Text type="colorTextSecondary">{record.email}</Text>
        </Space>
      ),
    },
    {
      title: "Program",
      dataIndex: "program",
    },
    {
      title: "Exam Status",
      dataIndex: "status",
      render: renderStatus,
    },
    {
      title: "Exam Completion Date",
      dataIndex: "completedDate",
    },
    {
      title: "Approved By",
      render: (_, record) =>
        record.approvedBy ? (
          <Space direction="vertical" size={0}>
            <Text strong>{record.approvedBy.name}</Text>
            <Tag color="blue">{record.approvedBy.role}</Tag>
          </Space>
        ) : (
          "-"
        ),
    },
{
  title: "Actions",
  render: (_, record) => {
    const isRollbackMode = rollbackId === record.id;

    return (
      <Space wrap>
        {/* Rollback mode → show Approve & Reject */}
        {isRollbackMode && (
          <>
            <Button
              type="primary"
              icon={<UnlockOutlined />}
              onClick={() => handleApproveExam(record.id)}
            >
              Approve
            </Button>

            <Button
              danger
              icon={<MinusCircleOutlined />}
              onClick={() => handleRejectExam(record.id)}
            >
              Reject
            </Button>
          </>
        )}

        {/* Normal Awaiting / In Progress */}
        {!isRollbackMode &&
          (record.status === "Awaiting Approval" ||
            record.status === "In Progress") && (
            <>
              <Button
                type="primary"
                icon={<UnlockOutlined />}
                onClick={() => handleApproveExam(record.id)}
              >
                Approve
              </Button>

              <Button
                danger
                icon={<MinusCircleOutlined />}
                onClick={() => handleRejectExam(record.id)}
              >
                Reject
              </Button>
            </>
          )}

        {/* Approved */}
        {!isRollbackMode && record.status === "Completed" && (
          <>
            <Button disabled type="primary">
              Approved
            </Button>
            <Button
              icon={<ClockCircleOutlined />}
              onClick={() => setRollbackId(record.id)}
            >
              Edit
            </Button>
          </>
        )}

        {/* Rejected */}
        {!isRollbackMode && record.status === "Rejected" && (
          <>
            <Button danger disabled>
              Rejected
            </Button>
            <Button
              icon={<ClockCircleOutlined />}
              onClick={() => setRollbackId(record.id)}
            >
              Rollback
            </Button>
          </>
        )}

        {/* Not Started */}
        {record.status === "Not Started" && (
          <Button icon={<BellOutlined />}>Send Reminder</Button>
        )}
      </Space>
    );
  },
}


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
         <Col>
        <Title level={5} style={{ margin: 10 }}>
           Records ({filteredData.length})
        </Title>
      </Col>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search user or program"
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>

          <Col xs={24} md={6}>
            <Select
              placeholder="Filter by Status"
              allowClear
              style={{ width: "100%" }}
              onChange={setStatusFilter}
            >
              <Option value="Completed">Approved</Option>
              <Option value="Awaiting Approval">Awaiting Approval</Option>
              <Option value="In Progress">In Progress</Option>
              <Option value="Rejected">Rejected</Option>
            </Select>
          </Col>
        </Row>

        <Table
          loading={loading}
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
  current: currentPage,
  pageSize: pageSize,
  showSizeChanger: true,
  pageSizeOptions: [5, 10, 20, 50],
  onChange: (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  },
}}

          scroll={{ x: "max-content" }} // ✅ mobile-safe
        />
      </Card>
    </div>
  );
};

export default ExamManagements;
