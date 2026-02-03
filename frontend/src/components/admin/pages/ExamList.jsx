import React, { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Typography,
  message,
  Space,
  Button,
  Input,
  DatePicker,
  Row,
  Col,
  Select,
  Switch,
  Modal,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import AddExamModal from "../modals/AddExamModal";

const { Title, Text } = Typography;
const { Option } = Select;

const ExamList = () => {
  const [exams, setExams] = useState([
    {
      key: 1,
      name: "Mathematics Final Exam",
      program: "Mathematics",
      package: "Premium",
      created_at: "2026-02-10",
      status: true,
    },
    {
      key: 2,
      name: "Physics Midterm",
      program: "Physics",
      package: "Basic",
      created_at: "2026-03-15",
      status: false,
    },
    {
      key: 3,
      name: "Chemistry Test",
      program: "Chemistry",
      package: "Free",
      created_at: "2026-04-05",
      status: true,
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [modalMode, setModalMode] = useState("create");

  /* -------- CONFIRM MODAL STATES -------- */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState(""); // status | delete
  const [selectedRecord, setSelectedRecord] = useState(null);

  /* -------- FILTER STATES -------- */
  const [searchText, setSearchText] = useState("");
  const [filterDate, setFilterDate] = useState(null);
  const [filterProgram, setFilterProgram] = useState(null);
  const [filterPackage, setFilterPackage] = useState(null);

  /* -------- OPEN CONFIRM MODAL -------- */
  const openConfirmModal = (type, record) => {
    setConfirmType(type);
    setSelectedRecord(record);
    setConfirmOpen(true);
  };

  /* -------- CONFIRM ACTION -------- */
  const handleConfirmOk = () => {
    if (!selectedRecord) return;

    if (confirmType === "status") {
      setExams((prev) =>
        prev.map((exam) =>
          exam.key === selectedRecord.key
            ? { ...exam, status: !exam.status }
            : exam
        )
      );

      message.success(
        `Exam ${
          selectedRecord.status ? "Inactivated" : "Activated"
        } successfully`
      );
    }

    if (confirmType === "delete") {
      setExams((prev) =>
        prev.filter((exam) => exam.key !== selectedRecord.key)
      );
      message.success("Exam deleted successfully");
    }

    setConfirmOpen(false);
    setSelectedRecord(null);
    setConfirmType("");
  };

  /* -------- FILTER LOGIC -------- */
  const filteredExams = exams.filter((exam) => {
    const search = searchText.toLowerCase();

    const matchesSearch =
      exam.name.toLowerCase().includes(search) ||
      exam.program.toLowerCase().includes(search) ||
      exam.package.toLowerCase().includes(search);

    const matchesDate = filterDate
      ? exam.created_at === dayjs(filterDate).format("YYYY-MM-DD")
      : true;

    const matchesProgram = filterProgram
      ? exam.program === filterProgram
      : true;

    const matchesPackage = filterPackage
      ? exam.package === filterPackage
      : true;

    return matchesSearch && matchesDate && matchesProgram && matchesPackage;
  });

  /* -------- TABLE COLUMNS -------- */
  const columns = [
    {
      title: "Sr. No.",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Exam Name",
      dataIndex: "name",
    },
    {
      title: "Program",
      dataIndex: "program",
    },
    {
      title: "Package",
      dataIndex: "package",
    },
    {
      title: "Status",
      render: (_, record) => (
        <Space>
          <Tag color={record.status ? "green" : "red"}>
            {record.status ? "Active" : "Inactive"}
          </Tag>
          <Switch
            checked={record.status}
            onClick={() => openConfirmModal("status", record)}
          />
        </Space>
      ),
    },
    {
      title: "Created At",
      dataIndex: "created_at",
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setEditingExam(record);
              setModalMode("view");
              setModalOpen(true);
            }}
          >
            View
          </Button>

          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingExam(record);
              setModalMode("edit");
              setModalOpen(true);
            }}
          >
            Edit
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => openConfirmModal("delete", record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Row justify="space-between" align="middle">
        <Title level={3}>Manage Exams</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingExam(null);
            setModalMode("create");
            setModalOpen(true);
          }}
        >
          Add Exam
        </Button>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col md={6}>
            <Input
              placeholder="Search exam..."
              prefix={<SearchOutlined />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>

          <Col md={6}>
            <Select
              placeholder="Filter by program"
              allowClear
              style={{ width: "100%" }}
              value={filterProgram}
              onChange={setFilterProgram}
            >
              {[...new Set(exams.map((e) => e.program))].map((p) => (
                <Option key={p} value={p}>
                  {p}
                </Option>
              ))}
            </Select>
          </Col>

          <Col md={6}>
            <Select
              placeholder="Filter by package"
              allowClear
              style={{ width: "100%" }}
              value={filterPackage}
              onChange={setFilterPackage}
            >
              {[...new Set(exams.map((e) => e.package))].map((p) => (
                <Option key={p} value={p}>
                  {p}
                </Option>
              ))}
            </Select>
          </Col>

          <Col md={6}>
            <DatePicker
              placeholder="Filter by date"
              style={{ width: "100%" }}
              value={filterDate}
              onChange={setFilterDate}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredExams}
          rowKey="key"
          pagination={{ pageSize: 5 }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* ---------- CONFIRMATION MODAL ---------- */}
      <Modal
        open={confirmOpen}
        centered
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            Confirmation
          </Space>
        }
        okText="Yes, Confirm"
        cancelText="Cancel"
        okButtonProps={{
          danger: confirmType === "delete",
        }}
        onOk={handleConfirmOk}
        onCancel={() => setConfirmOpen(false)}
      >
        <Text>
          {confirmType === "status" &&
            `Are you sure you want to ${
              selectedRecord?.status ? "inactivate" : "activate"
            } this exam?`}
          {confirmType === "delete" &&
            "Are you sure you want to delete this exam?"}
        </Text>

        <div style={{ marginTop: 8 }}>
          <Text strong>{selectedRecord?.name}</Text>
        </div>
      </Modal>

      <AddExamModal
        open={modalOpen}
        editingExam={editingExam}
        mode={modalMode}
        onCancel={() => {
          setModalOpen(false);
          setEditingExam(null);
          setModalMode("create");
        }}
      />
    </div>
  );
};

export default ExamList;