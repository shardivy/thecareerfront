import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Typography,
  Card,
  Tag,
  Button,
  Input,
  Select,
  Row,
  Col,
  Modal,
  message,
  Space,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";
import UserProfileModal from "../modals/UserProfileModal";
import AddUserModal from "../modals/AddUserModal";
import { fetchStudents, deleteUser } from "../../../adminSlices/userSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const UserList = () => {

  const dispatch = useDispatch();
 const { list: users, loading, error } = useSelector((state) => state.users);


useEffect(() => {
  dispatch(fetchStudents());
}, [dispatch]);

  const [searchText, setSearchText] = useState("");
  const [paymentFilter, setPaymentFilter] = useState(null);
  const [examFilter, setExamFilter] = useState(null);

  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState(null);


  // ---------------- FILTERED DATA ----------------
const filteredData = users.filter((user) => {
  const firstName = user.first_name || "";
  const lastName = user.last_name || "";
  const program = typeof user.program === "string" ? user.program : user.program?.name || "";
  const packageName = typeof user.package === "string" ? user.package : user.package?.name || "";
  const email = user.email || "";

  const fullName = `${firstName} ${lastName}`.toLowerCase();
  const search = searchText.toLowerCase();

  const matchesSearch =
    fullName.includes(search) ||
    program.toLowerCase().includes(search) ||
    packageName.toLowerCase().includes(search) ||
    email.toLowerCase().includes(search);

  const matchesPayment = paymentFilter ? user.paymentStatus === paymentFilter : true;
  const matchesExam = examFilter ? user.examStatus === examFilter : true;

  return matchesSearch && matchesPayment && matchesExam;
});



  // TABLE COLUMNS (ALL columns visible)
  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Name",
      key: "name",
      render: (_, record) => (
        <div>
          <Text strong>{`${record.first_name || ""} ${record.last_name || ""}`}</Text>
          <br />
          <Text type="colorTextSecondary">{record.email}</Text>
        </div>
      ),
    },

    {
      title: "Program / Package",
      key: "program",
      render: (_, record) => (
        <div>
          <Text strong>{record.program}</Text>
          <br />
          <Text type="colorTextSecondary">{record.package}</Text>
        </div>
      ),
    },
    {
      title: "Payment Status",
      key: "payment",
      render: (_, record) => {
        const color =
          record.paymentStatus === "Fully Paid"
            ? "success"
            : record.paymentStatus === "Partial Paid"
              ? "warning"
              : "processing";
        return (
          <div>
            <Tag color={color}>{record.paymentStatus}</Tag>
            <br />
            <Text type="colorTextSecondary">{record.paymentAmount}</Text>
          </div>
        );
      },
    },
    {
      title: "Exam Status",
      dataIndex: "examStatus",
      key: "examStatus",
      render: (status) => (
        <Tag
          icon={status === "Completed" ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          color={status === "Completed" ? "success" : "warning"}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Report",
      dataIndex: "reportStatus",
      key: "report",
      render: (status) => (
        <Tag
          icon={status === "Unlocked" ? <UnlockOutlined /> : <LockOutlined />}
          color={status === "Unlocked" ? "success" : "default"}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Sessions",
      dataIndex: "sessions",
      key: "sessions",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedUser(record);
              setViewModalOpen(true);
            }}
          >
            View
          </Button>
          <Button
  type="primary"
  icon={<EditOutlined />}
  onClick={() => {
    setSelectedUser(record);
    setModalMode("edit");
    setAddEditModalOpen(true);
  }}
>
  Edit
</Button>
          <Button
            type="default"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // ADD USER HANDLER
  const handleAddUser = () => {
    setSelectedUser(null);
    setModalMode("add");
    setAddEditModalOpen(true);
  };

  // DELETE handler: open confirmation modal (centered, shows user name)
  const handleDelete = (record) => {
    const name = `${(record.first_name || "").trim()} ${(record.last_name || "").trim()}`.trim() || record.name || "this user";

    Modal.confirm({
      centered: true,
      title: `Delete ${name}`,
      content: `Are you sure you want to delete ${name}? This action cannot be undone.`,
      okText: "Yes",
      cancelText: "No",
      onOk: () =>
        dispatch(deleteUser(record.id))
          .unwrap()
          .then(() => {
            message.success("User deleted");
          })
          .catch(() => {
            message.error("Delete failed");
          }),
    });
  };

  return (
    <div style={{ padding: 1 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3}>User Lists</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
            Add User
          </Button>
        </Col>
      </Row>

      <Card
        style={{
          borderRadius: adminTheme.token.borderRadius,
          boxShadow: adminTheme.token.boxShadow,
          marginTop: 10,
        }}
      >
        {/* FILTERS */}
        <Row gutter={[16, 16]} wrap={true} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={12}>
            <Input
              placeholder="Search user or program..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>

          <Col xs={12} sm={12} md={6}>
            <Select
              placeholder="Payment Status"
              value={paymentFilter}
              onChange={setPaymentFilter}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="Fully Paid">Fully Paid</Option>
              <Option value="Partial Paid">Partial Paid</Option>
              <Option value="Verification Pending">Verification Pending</Option>
            </Select>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <Select
              placeholder="Exam Status"
              value={examFilter}
              onChange={setExamFilter}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="Completed">Completed</Option>
              <Option value="Pending">Pending</Option>
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

      {/* VIEW PROFILE MODAL */}
      <UserProfileModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      {/* ADD / EDIT USER MODAL */}
      <AddUserModal
        open={addEditModalOpen}
        onClose={() => {
          setAddEditModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        mode={modalMode}
      />
    </div>
  );
};

export default UserList;
