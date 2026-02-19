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
  CloseCircleOutlined,
} from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";
import UserProfileModal from "../modals/UserProfileModal";
import AddUserModal from "../modals/AddUserModal";
import { fetchStudents, deleteUser } from "../../../adminSlices/userSlice";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";


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
  const [slotFilter, setSlotFilter] = useState(null);
  const [journeyFilter, setJourneyFilter] = useState(null);


  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });



  // ---------------- FILTERED DATA ----------------
  const filteredData = users.filter((user) => {
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    const program = typeof user.program === "string"
      ? user.program
      : user.program?.name || "";
    const packageName = typeof user.package === "string"
      ? user.package
      : user.package?.name || "";
    const email = user.email || "";

    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const search = searchText.toLowerCase();

    const matchesSearch =
      fullName.includes(search) ||
      program.toLowerCase().includes(search) ||
      packageName.toLowerCase().includes(search) ||
      email.toLowerCase().includes(search);

    const matchesPayment = paymentFilter
      ? user.paymentStatus === paymentFilter
      : true;

    const matchesExam = examFilter
      ? user.examStatus === examFilter
      : true;

    const matchesSlot = slotFilter
      ? (user.slotStatus || "Not Booked") === slotFilter
      : true;

    const matchesJourney = journeyFilter
      ? (user.journeyStatus || "Full Access") === journeyFilter
      : true;

    return (
      matchesSearch &&
      matchesPayment &&
      matchesExam &&
      matchesSlot &&
      matchesJourney
    );
  });


  const handleExportUsers = () => {
    if (!filteredData.length) return;

    const exportData = filteredData.map((user, index) => ({
      "Sr. No": index + 1,
      "Name": `${user.first_name || ""} ${user.last_name || ""}`,
      "Email": user.email,
      "Program": user.program,
      "Counselling Service": user.package,
      "Payment Status": user.paymentStatus,
      "Payment Amount": user.total_paid_amount,
      "Exam Status": user.examStatus,
      "Report Status": user.reportStatus,
      // "Review": user.review || "-",
      "Slot Status": user.slotStatus || "-",
      "Journey Status": user.journeyStatus || "-",

    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData, { origin: "A3" });

    // 🔥 Add Export Date (12hr AM/PM format)
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [`Exported On: ${dayjs().format("YYYY-MM-DD hh:mm A")}`],
        [`Total Records: ${filteredData.length}`],
        [],
      ],
      { origin: "A1" }
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "User List");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(fileData, `User List Report.xlsx`);
  };



  // TABLE COLUMNS (ALL columns visible)
  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },

    {
      title: "Name / Email",
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
      title: "Program / Counselling Services ",
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
  icon={
    status === "Completed" ? (
      <CheckCircleOutlined />
    ) : status === "Not Applicable" ? (
      <CloseCircleOutlined />
    ) : (
      <ClockCircleOutlined />
    )
  }
  color={
    status === "Completed"
      ? "success"
      : status === "Not Applicable"
      ? "error"
      : "warning"
  }
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
    // {
    //   title: "Review",
    //   dataIndex: "review",
    //   key: "review",
    //   render: (text) => text ? text : " - ",
    // },
    {
      title: "Slot Status",
      dataIndex: "slotStatus",
      key: "slotStatus",
      render: (status) => {
        let color = "default";

        if (status === "Booked") color = "processing";
        else if (status === "Completed") color = "success";
        else if (status === "Not Booked") color = "default";

        return <Tag color={color}>{status || "—"}</Tag>;
      },
    },

    {
      title: "Journey Status",
      dataIndex: "journeyStatus",
      key: "journeyStatus",
     render: (status) => {
  let color = "default";

  if (status === "Full Access") color = "success";
  else if (status === "Counselling Slot Booking") color = "processing";
  else if (status === "Exam") color = "warning";
  else if (status === "Payment") color = "#722ed1";


  return <Tag color={color}>{status || "—"}</Tag>;
},

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
          {/* <Button
            type="default"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button> */}
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
          <Space>
            <Button onClick={handleExportUsers}>
              Export to Excel
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddUser}
            >
              Add User
            </Button>
          </Space>
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
  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
  {/* Search */}
  <Col xs={24} sm={24} md={8}>
    <Input
      placeholder="Search user or program..."
      prefix={<SearchOutlined />}
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      allowClear
    />
  </Col>

  {/* Payment Status */}
  <Col xs={12} sm={12} md={4}>
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

  {/* Exam Status */}
  <Col xs={12} sm={12} md={4}>
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

  {/* Slot Status */}
  <Col xs={12} sm={12} md={4}>
    <Select
      placeholder="Slot Status"
      value={slotFilter}
      onChange={setSlotFilter}
      allowClear
      style={{ width: "100%" }}
    >
      <Option value="Booked">Booked</Option>
      <Option value="Completed">Completed</Option>
      <Option value="Not Booked">Not Booked</Option>
    </Select>
  </Col>

  {/* Journey Status */}
<Col xs={12} sm={12} md={4}>
  <Select
    placeholder="Journey Status"
    value={journeyFilter}
    onChange={setJourneyFilter}
    allowClear
    style={{ width: "100%" }}
  >
    <Option value="Exam">Exam</Option>
    <Option value="Counselling Slot Booking">
      Counselling Slot Booking
    </Option>
    <Option value="Full Access">Full Access</Option>
  </Select>
</Col>

</Row>


        {/* TABLE */}
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{
            defaultPageSize: 5,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20, 50],
            onChange: (page, pageSize) => {
              setPagination({
                current: page,
                pageSize: pageSize,
              });
            },
            // showTotal: (total, range) =>
            //   `${range[0]}-${range[1]} of ${total} users`,
          }}
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
