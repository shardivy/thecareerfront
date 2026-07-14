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
import {
  fetchUserExams,
  approveUserExam,
  rejectUserExam,
} from "../../../adminSlices/userExamSlice";
import adminTheme from "../../../theme/adminTheme";

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const ModalSuggestionField = ({ suggestions, placeholder, onChange }) => {
  const [comment, setComment] = useState("");

  useEffect(() => {
    onChange(comment);
  }, [comment, onChange]);

  return (
    <div>
      <Text strong>Suggested messages</Text>
      <Text type="secondary" style={{ display: "block", marginBottom: 10 }}>
        Click any suggestion to add it to the comment box, then edit if needed.
      </Text>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {suggestions.map((item) => (
          <Button key={item} size="small" onClick={() => setComment(item)}>
            {item}
          </Button>
        ))}
      </div>

      <Input.TextArea
        rows={3}
        value={comment}
        placeholder={placeholder}
        onChange={(e) => setComment(e.target.value)}
      />
    </div>
  );
};

const ExamManagements = () => {
  const dispatch = useDispatch();

  const { data: examRecords = [], loading } = useSelector(
    (state) => state.userExams
  );

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    dispatch(fetchUserExams());
  }, [dispatch]);

  /* ================= APPROVE ================= */
  const handleApproveExam = (id) => {
    let description = "";
    let selectedSuggestion = "";

const approveSuggestions = [
  "Exam reviewed and approved",
  "Student has successfully completed the assessment",
  "All required criteria have been met",
  "Report access granted",
];

    confirm({
      title: "Approve Exam?",
      icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      centered: true,
      closable: true,
      width: 600,
      maskClosable: true,
      okText: "Yes, Approve",

      content: (
        <ModalSuggestionField
          suggestions={approveSuggestions}
          placeholder="Add comment"
          onChange={(value) => {
            description = value;
          }}
        />
      ),

      async onOk() {
        try {
          const res = await dispatch(
            approveUserExam({
              id,
              description, // ✅ send comment
            })
          ).unwrap();

          message.success(res?.message || "Exam approved successfully");
          dispatch(fetchUserExams());
        } catch (err) {
          message.error(err?.message || "Something went wrong");
        }
      },
    });
  };

  /* ================= MARK AS COMPLETE ================= */


  const handleMarkComplete = (id) => {
   let description = "";
let selectedSuggestion = "";

const completeSuggestions = [
  "Exam completed successfully",
  "Assessment submitted and reviewed",
  "Student completed all sections",
  "Exam status updated to completed",
];

    confirm({
      title: "Mark Exam as Complete?",
      icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      centered: true,
      closable: true,
      maskClosable: true,
      width: 600,
      okText: "Yes, Complete",

      content: (
        <ModalSuggestionField
          suggestions={completeSuggestions}
          placeholder="Add comment"
          onChange={(value) => {
            description = value;
          }}
        />
      ),

      async onOk() {
        try {
          const res = await dispatch(
            approveUserExam({
              id,
              description: description, 
            })
          ).unwrap();

          message.success(res?.message || "Exam marked as complete");
          dispatch(fetchUserExams());
        } catch (err) {
          message.error(err?.message || "Something went wrong");
        }
      },
    });
  };

  /* ================= REJECT ================= */
  const handleRejectExam = (id) => {
    let description = "";
    let selectedSuggestion = "";

    const rejectSuggestions = [
  "Incomplete exam submission",
  "Invalid responses detected",
  "Required sections were not completed",
  "Exam requires re-attempt",
];

    confirm({
      title: "Reject Exam?",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      centered: true,
      closable: true,
      maskClosable: true,
      width: 600,
      okText: "Yes, Reject",
      okType: "danger",

      content: (
        <ModalSuggestionField
          suggestions={rejectSuggestions}
          placeholder="Add rejection reason"
          onChange={(value) => {
            description = value;
          }}
        />
      ),

      async onOk() {
        try {
          const res = await dispatch(
            rejectUserExam({
              id,
              description, 
            })
          ).unwrap();

          message.success(res?.message || "Exam rejected successfully");
          dispatch(fetchUserExams());
        } catch (err) {
          message.error(err?.message || "Something went wrong");
        }
      },
    });
  };

  /* ================= DISAPPROVE ================= */
  const handleDisapproveExam = (id) => {
    let description = "";

    confirm({
      title: "Disapprove Exam?",
      icon: <ExclamationCircleOutlined style={{ color: "#fa8c16" }} />,
      centered: true,
      closable: true,
      maskClosable: true,
      width: 600,
      okText: "Yes, Disapprove",
      okType: "danger",
      cancelText: "Cancel",

      content: (
        <div>
          <p>
            Are you sure you want to disapprove this exam? The student's report will be locked again.
          </p>

          <Input.TextArea
            rows={3}
            placeholder="Add reason for disapproval"
            onChange={(e) => {
              description = e.target.value;
            }}
            style={{ marginTop: 10 }}
          />
        </div>
      ),

      async onOk() {
        try {
          const res = await dispatch(
            rejectUserExam({
              id,
              description, // ✅ send comment
            })
          ).unwrap();

          message.success(res?.message || "Exam disapproved successfully");
          dispatch(fetchUserExams());
        } catch (err) {
          message.error(
            typeof err === "string"
              ? err
              : err?.message || "Something went wrong"
          );
        }
      },
    });
  };

  /* ================= MAP DATA ================= */
  const mappedData = examRecords.map((item) => ({
    id: item.id,
    userName: `${item.first_name} ${item.last_name}`,
    email: item.email,
    program: item.program || "-",
    package: item.package || "-",
    status:
      item.status === "completed"
        ? "Completed"
        : item.status === "not_started"
          ? "Not Started"
          : item.status === "in_progress"
            ? "In Progress"
            : item.status === "exam_started"
              ? "Exam Started"
              : item.status === "rejected"
                ? "Rejected"
                : "Awaiting Approval",
    completedDate: item.completed_at
      ? item.completed_at.split("T")[0]
      : "-",
    approvedBy: item.approved_by
      ? {
        name: item.approved_by,
        role: item.approved_by_role,
      }
      : null,
  }));

  /* ================= FILTER ================= */
  const filteredData = mappedData
    .filter((item) => {
      const search = searchText.toLowerCase();
      const matchesSearch =
        item.userName.toLowerCase().includes(search) ||
        item.program.toLowerCase().includes(search);

      const matchesStatus = statusFilter
        ? item.status === statusFilter
        : true;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const priorityStatuses = ["In Progress", "Not Started"];

      if (priorityStatuses.includes(a.status) && !priorityStatuses.includes(b.status))
        return -1;

      if (!priorityStatuses.includes(a.status) && priorityStatuses.includes(b.status))
        return 1;

      return 0;
    });

  /* ================= STATUS TAG ================= */
  const renderStatus = (status) => {
    switch (status) {
      case "Completed":
        return <Tag color="success">Approved</Tag>;

      case "Awaiting Approval":
        return <Tag color="warning">Awaiting Approval</Tag>;

      case "Exam Started":
        return <Tag color="processing">Exam Started</Tag>;

      case "In Progress":
        return <Tag color="processing">In Progress</Tag>;

      case "Rejected":
        return <Tag color="error">Rejected</Tag>;

      case "Not Started":
        return <Tag>Not Started</Tag>;

      default:
        return <Tag>{status}</Tag>;
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
    // { title: "Program", dataIndex: "program" },
    {
      title: "Program / Counselling Service",
      width: 250,
      render: (_, record) => (
        <div>
          <Text strong>{record.program || "N/A"}</Text>
          <br />
          <Text type="colorTextSecondary" >
            {record.package || "-"}
          </Text>
        </div>
      ),
    },

    { title: "Exam Status", dataIndex: "status", render: renderStatus },
    {
      title: "Actions",
      render: (_, record) => (
        <Space wrap>
          {record.status === "Awaiting Approval" && (
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

          {["In Progress", "Not Started"].includes(record.status) && (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleMarkComplete(record.id)}
              >
                Mark as Complete
              </Button>

            </>
          )}

          {record.status === "Completed" && (
            <>
              <Button disabled type="primary">
                Approved
              </Button>
              <Button
                icon={<ClockCircleOutlined />}
                onClick={() => handleDisapproveExam(record.id)}
              >
                Edit
              </Button>
            </>
          )}

          {record.status === "Rejected" && (
            <Button danger disabled>
              Rejected
            </Button>
          )}

          {/* {record.status === "Not Started" && (
            <Button icon={<BellOutlined />}>Send Reminder</Button>
          )} */}
        </Space>
      ),
    },
    { title: "Exam Completion Date", dataIndex: "completedDate" },
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
  ];

  return (
    <div style={{ padding: 16 }}>
      <Title level={3}>User Request List</Title>

      <Card
        style={{
          borderRadius: adminTheme.token.borderRadius,
          boxShadow: adminTheme.token.boxShadow,
        }}
      >
        <Title level={5} style={{ margin: 10 }}>
          Records ({filteredData.length})
        </Title>

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
              placeholder="Filter by exam status"
              allowClear
              style={{ width: "100%" }}
              onChange={setStatusFilter}
            >
              <Option value="Completed">Approved</Option>
              <Option value="Awaiting Approval">Awaiting Approval</Option>
              <Option value="In Progress">In Progress</Option>
              {/* <Option value="Rejected">Rejected</Option> */}
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
          scroll={{ x: "max-content" }}
        />
      </Card>
    </div>
  );
};

export default ExamManagements;
