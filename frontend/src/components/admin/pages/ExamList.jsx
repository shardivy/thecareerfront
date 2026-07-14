import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Typography,
  Space,
  Button,
  Input,
  DatePicker,
  Row,
  Col,
  Select,
  Switch,
  Modal,
  message,
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
import { useDispatch, useSelector } from "react-redux";
import { fetchExams, updateExam } from "../../../adminSlices/examSlice";
import AddExamModal from "../modals/AddExamModal";

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const ExamList = () => {
  const dispatch = useDispatch();
  const { list: exams = [], loading } = useSelector((state) => state.exam);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingExam, setEditingExam] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [filterDate, setFilterDate] = useState(null);
  const [filterProgram, setFilterProgram] = useState(null);
  const [filterPackage, setFilterPackage] = useState(null);

  useEffect(() => {
    dispatch(fetchExams());
  }, [dispatch]);

  /* ---------- CONFIRM STATUS TOGGLE ---------- */
  const handleStatusToggle = (record) => {
    confirm({
      title: "Confirmation",
      icon: <ExclamationCircleOutlined />,
      centered: true,
      okText: "Yes",
      cancelText: "No",

      content: (
        <div>
          <p>
            Are you sure you want to{" "}
            <strong>
              {record.is_active ? "inactivate" : "activate"}
            </strong>{" "}
            the exam{" "}
            <Text strong type="colorTextSecondary">
              {record.exam_name}
            </Text>
            ?
          </p>
        </div>
      ),


      onOk: async () => {
        try {
          await dispatch(
            updateExam({
              id: record.id,
              payload: { is_active: !record.is_active },
            })
          ).unwrap();

          message.success(
            `Exam ${record.is_active ? "inactivated" : "activated"
            } successfully`
          );

          dispatch(fetchExams());
        } catch (err) {
          message.error("Failed to update exam status");
        }
      },
    });
  };



  /* ---------- SAFE FILTER ---------- */
  const filteredExams = (exams || []).filter((exam = {}) => {
    const search = (searchText || "").toLowerCase();

    const examName = (exam.exam_name || "").toLowerCase();
    const program = (exam.program || "").toLowerCase();
    const pack = (exam.package || "").toLowerCase();

    const matchesSearch =
      examName.includes(search) ||
      program.includes(search) ||
      pack.includes(search);

    const matchesDate = filterDate
      ? exam.created_at &&
      dayjs(exam.created_at).format("YYYY-MM-DD") ===
      dayjs(filterDate).format("YYYY-MM-DD")
      : true;

    const matchesProgram = filterProgram ? exam.program === filterProgram : true;
    const matchesPackage = filterPackage ? exam.package === filterPackage : true;

    return matchesSearch && matchesDate && matchesProgram && matchesPackage;
  });

  const breakAfterThreeWords = (text = "") => {
    if (!text) return "-";
    const words = text.split(" ");
    let lines = [];
    for (let i = 0; i < words.length; i += 3) {
      lines.push(words.slice(i, i + 3).join(" "));
    }
    return lines.join("\n");
  };

  /* ---------- TABLE COLUMNS ---------- */
  const columns = [
    {
      title: "Sr. No.",
      render: (_, __, index) => index + 1,
      width: 80,
    },
    {
      title: "Exam Name",
      dataIndex: "exam_name",
      render: (text) => (
        <span style={{ whiteSpace: "pre-line" }}>
          {breakAfterThreeWords(text)}
        </span>
      ),
    },
    {
      title: "Program",
      dataIndex: "program",
      render: (text) => (
        <span style={{ whiteSpace: "pre-line" }}>
          {breakAfterThreeWords(text)}
        </span>
      ),
    },
    {
      title: "Counselling Service",
      dataIndex: "package",
      render: (text) => (
        <span style={{ whiteSpace: "pre-line" }}>
          {breakAfterThreeWords(text)}
        </span>
      ),
    },
    {
      title: "Instruction",
      dataIndex: "instructions",
      render: (text) => (
        <span style={{ whiteSpace: "pre-line" }}>
          {breakAfterThreeWords(text)}
        </span>
      ),
    },
    {
      title: "Exam Link",
      dataIndex: "exam_link",
      render: (text) =>
        text ? (
          <a href={text} target="_blank" rel="noopener noreferrer">
            View Link
          </a>
        ) : (
          "-"
        ),
    },
    {
      title: "Status",
      render: (_, record) => (
        <Switch
          checked={record.is_active}
          size="large"
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={() => handleStatusToggle(record)}
        />
      ),
    },
    {
      title: "Created At",
      render: (_, record) =>
        record.created_at
          ? dayjs(record.created_at).format("YYYY-MM-DD")
          : "-",
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space wrap size="small">
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

          <Button danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Manage Exams
          </Title>
        </Col>



        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={true}
            onClick={() => {
              setEditingExam(null);
              setModalMode("create");
              setModalOpen(true);
            }}
          >
            Add Exam
          </Button>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Col>
          <Title level={5} style={{ margin: 10 }}>
            Exam Records ({filteredExams.length})
          </Title>
        </Col>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>

          <Col md={6}>
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>

          <Col md={6}>
            <Select
              placeholder="Program"
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
              placeholder="Counselling Services"
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
              style={{ width: "100%" }}
              value={filterDate}
              onChange={setFilterDate}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredExams}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 5 }}
          scroll={{ x: "max-content" }}
        />
      </Card>

      <AddExamModal
        open={modalOpen}
        mode={modalMode}
        editingExam={editingExam}
        onCancel={() => {
          setModalOpen(false);
          setEditingExam(null);
          setModalMode("create");
        }}
        onSuccess={() => dispatch(fetchExams())}
      />
    </div>
  );
};

export default ExamList;
