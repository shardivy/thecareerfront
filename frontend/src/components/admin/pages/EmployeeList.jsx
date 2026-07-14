import React, { useState } from "react";
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
  Space,
  DatePicker,
  message,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import adminTheme from "../../../theme/adminTheme";
import AddEmployeeModal from "../modals/AddEmployeeModal";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchRegisteredUsers, deleteUser } from "../../../adminSlices/employeeSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const EmployeeList = () => {

  const dispatch = useDispatch();


  const { employees, loading } = useSelector((state) => state.employee);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [modalMode, setModalMode] = useState("add");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const role = localStorage.getItem("adminRole");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  useEffect(() => {
    dispatch(fetchRegisteredUsers());
  }, [dispatch]);

  // ---------------- Filtered Data ----------------
  const filteredData = (employees || []).filter((emp) => {
    const search = searchText.toLowerCase();

    const matchesSearch =
      (emp?.name || "").toLowerCase().includes(search) ||
      (emp?.email || "").toLowerCase().includes(search) ||
      (emp?.mobile || "").toLowerCase().includes(search) ||
      (emp?.role || "").toLowerCase().includes(search) ||
      (emp?.Status || "").toLowerCase().includes(search);

    const matchesStatus = statusFilter
      ? emp?.Status === statusFilter
      : true;

    const matchesDate = selectedDate
      ? dayjs(emp?.date).isSame(dayjs(selectedDate), "day")
      : true;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleView = (record) => {
    setEditingEmployee(record);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingEmployee(record);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const showDeleteConfirm = (record) => {
    Modal.confirm({
      title: "Delete User",
      content: `Are you sure you want to delete ${record.name}?`,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      async onOk() {
        try {
          await dispatch(deleteUser(record.user_id)).unwrap();
          message.success("User deleted successfully");
        } catch (error) {
          message.error(error || "Delete failed");
        }
      },
    });
  };

  const handleSaveEmployee = () => {
    dispatch(fetchRegisteredUsers()); // refresh list
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  // ---------------- Table Columns ----------------
  const columns = [
    {
      title: "Sr. No",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "User Name / Email",
      render: (_, record) => (
        <>
          <Text strong>{record.name}</Text>
          <br />
          <Text type="colorTextSecondary">{record.email}</Text>
        </>
      ),
    },
    { title: "Mobile Number", dataIndex: "mobile" },
    {
      title: "Role",
      dataIndex: "role",
      render: (role) => {
        if (role === "ui_ux") return "UI/UX";
        if (role === "counsellor") return "Counsellor";
        return role;
      },
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (date) => date ? dayjs(date).format("DD-MM-YYYY") : "-",
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (status) => (
        <Tag color={status === "Active" ? "success" : "default"}>{status}</Tag>
      ),
    },
  {
  title: "Actions",
  render: (_, record) => {
    const isRestrictedUser = record.name === "Reena Bhutada";

    return (
      <Space wrap>
        <Button
          size="large"
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
        >
          View
        </Button>

        {role === "superadmin" && (
          <>
            <Button
              size="large"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={isRestrictedUser}
            >
              Edit
            </Button>

            <Button
              size="large"
              danger
              icon={<DeleteOutlined />}
              onClick={() => showDeleteConfirm(record)}
              disabled={isRestrictedUser}
            >
              Delete
            </Button>
          </>
        )}
      </Space>
    );
  },
},
  ];

  return (
    <>
      <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Title level={3} style={{ margin: 0 }}>User List</Title>
        </Col>
        <Col xs={24} sm={12} style={{ textAlign: "right" }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setModalMode("add"); setEditingEmployee(null); setIsModalOpen(true); }}
          >
            Add User
          </Button>
        </Col>
      </Row>

      <Card style={{ borderRadius: adminTheme.token.borderRadius, boxShadow: adminTheme.token.boxShadow }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {/* Search box stays full width */}
          <Col xs={24} sm={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search "
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: "100%" }}
            />
          </Col>

          {/* Status and Date filters in a nested Row */}
          <Col xs={24} sm={16}>
            <Row gutter={8} wrap={false}>
              <Col flex="1 1 50%">
                <Select
                  placeholder="Status"
                  allowClear
                  style={{ width: "100%" }}
                  value={statusFilter}
                  onChange={setStatusFilter}
                >
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                </Select>
              </Col>
              <Col flex="1 1 50%">
                <DatePicker
                  style={{ width: "100%" }}
                  value={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  format="YYYY-MM-DD"
                  allowClear
                  placeholder="Select Date"
                />
              </Col>
            </Row>
          </Col>
        </Row>


        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize });
            },
          }}
          scroll={{ x: 700 }}
        />
      </Card>

      <AddEmployeeModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onAdd={handleSaveEmployee}
        editingEmployee={editingEmployee}
        mode={modalMode}
      />
    </>
  );
};

export default EmployeeList;
