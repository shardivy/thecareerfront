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
  Popconfirm,
  Space,
  DatePicker,
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

const { Title, Text } = Typography;
const { Option } = Select;

const EmployeeList = () => {
  const employeeData = [
    {
      key: 1,
      name: "Priya Sharma",
      email: "priya.sharma@email.com",
      mobile: "9876543210",
      role: "Counsellor",
      date: "2026-01-23",
      Status: "Active",
    },
    {
      key: 2,
      name: "Rajesh Kumar",
      email: "rajesh.k@email.com",
      mobile: "9123456789",
      role: "UI/UX",
      date: "2025-05-23",
      Status: "Inactive",
    },
    {
      key: 3,
      name: "Anjali Verma",
      email: "anjali.v@email.com",
      mobile: "9012345678",
      role: "Trainer",
      date: "2026-01-28",
      Status: "Active",
    },
  ];

  const [employees, setEmployees] = useState(employeeData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [modalMode, setModalMode] = useState("add");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null); // <-- single date filter

  // ---------------- Filtered Data ----------------
  const filteredData = employees.filter((emp) => {
    const search = searchText.toLowerCase();

    const matchesSearch =
      emp.name.toLowerCase().includes(search) ||
      emp.email.toLowerCase().includes(search) ||
      emp.mobile.toLowerCase().includes(search) ||
      emp.role.toLowerCase().includes(search) ||
      emp.Status.toLowerCase().includes(search);

    const matchesStatus = statusFilter ? emp.Status === statusFilter : true;

    const matchesDate = selectedDate
      ? dayjs(emp.date).isSame(dayjs(selectedDate), "day")
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

  const handleSaveEmployee = (values) => {
    const fullName = `${values.firstName} ${values.lastName}`;

    if (modalMode === "edit") {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.key === editingEmployee.key
            ? {
                ...emp,
                name: fullName,
                email: values.email,
                mobile: values.mobile,
                role: values.program,
                date: values.date,
              }
            : emp
        )
      );
    } else {
      setEmployees((prev) => [
        ...prev,
        {
          key: Date.now(),
          name: fullName,
          email: values.email,
          mobile: values.mobile,
          role: values.program,
          date: values.date,
          Status: "Active",
        },
      ]);
    }

    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  // ---------------- Table Columns ----------------
  const columns = [
    { title: "Sr. No", render: (_, __, index) => index + 1, responsive: ["sm"] },
    {
      title: "Employee",
      render: (_, record) => (
        <>
          <Text strong>{record.name}</Text>
          <br />
          <Text type="colorTextSecondary">{record.email}</Text>
        </>
      ),
    },
    { title: "WhatsApp Mobile Number", dataIndex: "mobile", responsive: ["sm"] },
    { title: "Role", dataIndex: "role" },
    {
      title: "Date",
      dataIndex: "date",
      render: (date) => <Text>{date}</Text>,
      responsive: ["sm"],
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
      render: (_, record) => (
        <Space wrap>
          <Button size="large" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            View
          </Button>
          <Button size="large" type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this Employee?"
            onConfirm={() => setEmployees((prev) => prev.filter((e) => e.key !== record.key))}
          >
            <Button size="large" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Title level={3} style={{ margin: 0 }}>Employee List</Title>
        </Col>
        <Col xs={24} sm={12} style={{ textAlign: "right" }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setModalMode("add"); setEditingEmployee(null); setIsModalOpen(true); }}
          >
            Add Employee
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
          pagination={{ pageSize: 5 }}
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
