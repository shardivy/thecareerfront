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
  Divider,
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
  MinusCircleOutlined,
  DownOutlined,
  CalendarOutlined,
  SyncOutlined,

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
    const program = Array.isArray(user.programs) && user.programs.length > 0
      ? user.programs
        .map((item) => item.program_name || item.program?.name)
        .filter(Boolean)
        .join(", ")
      : typeof user.program === "string"
        ? user.program
        : user.program?.name || "";
    const packageName = Array.isArray(user.programs) && user.programs.length > 0
      ? user.programs
        .map((item) => item.package?.name || item.package_name)
        .filter(Boolean)
        .join(", ")
      : typeof user.package === "string"
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

    const exportData = [];

    filteredData.forEach((user, userIndex) => {
      if (user.programs?.length > 0) {
        user.programs.forEach((program, programIndex) => {
          exportData.push({
            "User Sr No": userIndex + 1,
            "Name": `${user.first_name || ""} ${user.last_name || ""}`,
            "Email": user.email || "",
            "Program":
              program.program_name ||
              program.program?.name ||
              "-",
            "Counselling Service":
              program.package?.name ||
              program.package_name ||
              "-",
            "Preferred Counselling Mode":
              user.preferred_counselling_mode || "-",
            "Payment Status": user.paymentStatus || "-",
            "Payment Amount": user.total_paid_amount || "-",
            "Exam Status": (() => {
              const exam = program.exam_status;

              if (!exam) return "-";

              if (typeof exam === "object") {
                if (Number(exam.completed) > 0) return "Completed";
                if (Number(exam.in_progress) > 0) return "In Progress";
                if (Number(exam.pending_approval) > 0) return "Pending Approval";
                if (Number(exam.not_started) > 0) return "Not Started";

                const values = Object.values(exam);
                if (values.every(v => v === "not_applicable")) {
                  return "Not Applicable";
                }
              }

              return exam;
            })(),
            "Report Status":
              typeof program.report_status === "object"
                ? Object.values(program.report_status).join(", ")
                : program.report_status || "-",
            "Questionnaire Status":
              program.analysis_status || "-",
            "Counselling Booking Status":
              program.slot_status || "-",
            "Journey Status":
              program.journey_status || "-",
            "Created At":
              user.created_at
                ? dayjs(user.created_at).format(
                  "DD MMM YYYY hh:mm A"
                )
                : "-",
          });
        });
      } else {
        exportData.push({
          "User Sr No": userIndex + 1,
          "Name": `${user.first_name || ""} ${user.last_name || ""}`,
          "Email": user.email || "",
          "Program": "-",
          "Counselling Service": "-",
          "Preferred Counselling Mode":
            user.preferred_counselling_mode || "-",
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData, {
      origin: "A4",
    });

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [`Exported On: ${dayjs().format("DD MMM YYYY hh:mm A")}`],
        [`Total Users: ${filteredData.length}`],
        [`Total Program Records: ${exportData.length}`],
        [],
      ],
      { origin: "A1" }
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Students Report"
    );

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(
      new Blob([excelBuffer], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      }),
      `Students_Report_${dayjs().format(
        "YYYYMMDD_HHmm"
      )}.xlsx`
    );
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
      width: 160,
      render: (_, record) => (
        <div>
          <Text strong>{`${record.first_name || ""} ${record.last_name || ""}`}</Text>
          <br />
          <Text type="colorTextSecondary">{record.email}</Text>
        </div>
      ),
    },

    {
      title: "Program / Counselling Service",
      width: 240,
      key: "program",
      render: (_, record) => (
        <div>
          {Array.isArray(record.programs) && record.programs.length > 0 ? (
            record.programs.map((item, idx) => (
              <div key={idx}>
                <div style={{ marginBottom: 10 }}>
                  <Text strong>
                    {`${idx + 1}. ${item.program_name || item.program?.name || "-"}`}
                  </Text>
                  <br />
                  <Text type="colorTextSecondary">
                    {item.package?.name || item.package_name || "-"}
                  </Text>
                </div>
                {idx !== record.programs.length - 1 && (
                  <Divider style={{ margin: "10px 0" }} />
                )}
              </div>
            ))
          ) : (
            <>
              <Text strong>{record.program || "N/A"}</Text>
              <br />
              <Text type="colorTextSecondary">{record.package || "N/A"}</Text>
            </>
          )}
        </div>
      ),
    },
    {
      title: "Preferred Counselling Mode",
      dataIndex: "preferred_counselling_mode",
      width: 150,
      render: (mode) => {
        if (!mode || mode === "Not Specified")
          return <Tag>Not Specified</Tag>;

        const formatted =
          mode.charAt(0).toUpperCase() + mode.slice(1);

        const color =
          mode === "online"
            ? "blue"
            : mode === "offline"
              ? "green"
              : "default";

        return <Tag color={color}>{formatted}</Tag>;
      },
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
      key: "examStatus",
      render: (_, record) => (
        <>
          {record.programs?.map((item, idx) => {
            const exam = item.exam_status;

            let status = "Not Started";

            if (exam === "not_applicable") {
              status = "Not Applicable";
            } else if (typeof exam === "object") {
              if (Number(exam.completed) > 0) {
                status = "Completed";
              } else if (Number(exam.in_progress) > 0) {
                status = "In Progress";
              } else if (Number(exam.pending_approval) > 0) {
                status = "Pending Approval";
              } else if (Number(exam.not_started) > 0) {
                status = "Not Started";
              }
            }

            return (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <Divider dashed style={{ margin: "8px 0" }} />
                )}

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
                        : status === "Pending Approval"
                          ? "warning"
                          : status === "In Progress"
                            ? "processing"
                            : "default"
                  }
                  style={{
                    textAlign: "center",
                    lineHeight: "16px",
                  }}
                >
                  {status === "Not Applicable" ? (
                    <>
                      Not <br />
                      Applicable
                    </>
                  ) : (
                    status
                  )}
                </Tag>
              </React.Fragment>
            );
          })}
        </>
      ),
    },
 
    {
      title: "Report Status",
      key: "reportStatus",
      render: (_, record) => (
        <>
          {record.programs?.map((item, idx) => {
            const reportStatus = item.report_status;

            const renderReportTag = (status) => {
              const normalizedStatus = status?.toLowerCase()?.trim();

              let color = "default";
              let icon = <LockOutlined />;
              let label = status;

              if (normalizedStatus === "received_unlocked") {
                color = "success";
                icon = <UnlockOutlined />;
                label = "Received & Unlocked";
              } else if (normalizedStatus === "received_locked") {
                color = "processing";
                icon = <LockOutlined />;
                label = "Received & Locked";
              } else if (normalizedStatus === "not_received") {
                color = "default";
                icon = <CloseCircleOutlined />;
                label = "Not Received";
              } else if (normalizedStatus === "all_received") {
                color = "success";
                icon = <UnlockOutlined />;
                label = "All Received";
              }  else if (normalizedStatus === "v1_received") {
  color = "success";
  icon = <CheckCircleOutlined />;
  label = "V1 Received";
} else if (normalizedStatus === "v2_received") {
  color = "success";
  icon = <CheckCircleOutlined />;
  label = "V2 Received";
} else if (normalizedStatus === "v3_received") {
  color = "success";
  icon = <CheckCircleOutlined />;
  label = "V3 Received";
} else if (normalizedStatus === "in_progress") {
  color = "processing";
  icon = <ClockCircleOutlined />;
  label = "In Progress";
} 
              
              else if (normalizedStatus === "v1_not_received") {
                color = "error";
                icon = <CloseCircleOutlined />;
                label = "V1 Not Received";
              } else if (normalizedStatus === "v2_not_received") {
                color = "error";
                icon = <CloseCircleOutlined />;
                label = "V2 Not Received";
              } else if (normalizedStatus === "v3_not_received") {
                color = "error";
                icon = <CloseCircleOutlined />;
                label = "V3 Not Received";
              } else if (normalizedStatus === "not_applicable") {
                color = "default";
                icon = <MinusCircleOutlined />;
                label = (
                  <>
                    Not <br />
                    Applicable
                  </>
                );
              }

              return (
                <Tag
                  icon={icon}
                  color={color}
                  style={{
                    marginBottom: 4,
                    whiteSpace: "normal",
                    lineHeight: "16px",
                  }}
                >
                  {label}
                </Tag>
              );
            };

            return (
              <div key={idx}>
                {idx > 0 && (
                  <Divider dashed style={{ margin: "8px 0" }} />
                )}

                {typeof reportStatus === "object" ? (
                  <>
                    {renderReportTag(reportStatus.v1)}
                    <br />
                    {renderReportTag(reportStatus.v2)}
                    <br />
                    {renderReportTag(reportStatus.v3)}
                  </>
                ) : (
                  renderReportTag(reportStatus)
                )}
              </div>
            );
          })}
        </>
      ),
    },

    {
      title: "Questionnaire Status",
      key: "analysis_status",
      render: (_, record) => (
        <>
          {record.programs?.map((item, idx) => {
            const status = item.analysis_status;
            const normalized = status?.toLowerCase()?.trim();

            let color = "default";
            let icon = <ClockCircleOutlined />;
            let label = "—";

            if (normalized === "completed") {
              color = "success";
              icon = <CheckCircleOutlined />;
              label = "Completed";
            } else if (normalized === "not_started") {
              color = "default";
              icon = <MinusCircleOutlined />;
              label = "Not Started";
            } else if (normalized === "in_progress") {
              color = "processing";
              icon = <ClockCircleOutlined />;
              label = "In Progress";
            } else if (normalized === "not_applicable") {
              color = "error";
              icon = <CloseCircleOutlined />;
              label = (
                <>
                  Not <br />
                  Applicable
                </>
              );
            } else {
              color = "default";
              icon = <MinusCircleOutlined />;
              label = status || "—";
            }


            return (
              <div key={idx}>
                {idx > 0 && (
                  <Divider dashed style={{ margin: "8px 0" }} />
                )}

                <Tag
                  icon={icon}
                  color={color}
                  style={{
                    textAlign: "center",
                    lineHeight: "16px",
                  }}
                >
                  {label}
                </Tag>
              </div>
            );
          })}
        </>
      ),
    },
    // {
    //   title: "Review",
    //   dataIndex: "review",
    //   key: "review",
    //   render: (text) => text ? text : " - ",
    // },
    {
      title: "Counselling Booking Status",
      key: "slotStatus",
      render: (_, record) => (
        <>
          {record.programs?.map((item, idx) => {
            const status = item.slot_status;

            const label = status
              ? status
                .split("_")
                .map(
                  word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                )
                .join(" ")
              : "—";

            let color = "default";
            let icon = <MinusCircleOutlined />;

            if (status === "booked") {
              color = "processing";
              icon = <CalendarOutlined />;
            } else if (status === "pending") {
              color = "warning";
              icon = <ClockCircleOutlined />;
            } else if (status === "rescheduled") {
              color = "purple";
              icon = <SyncOutlined spin />;
            } else if (status === "completed") {
              color = "success";
              icon = <CheckCircleOutlined />;
            } else if (status === "not_booked") {
              color = "default";
              icon = <MinusCircleOutlined />;
            }

            return (
              <div key={idx}>
                {idx > 0 && (
                  <Divider dashed style={{ margin: "8px 0" }} />
                )}

                <Tag
                  icon={icon}
                  color={color}
                  style={{
                    textAlign: "center",
                    lineHeight: "16px",
                  }}
                >
                  {label}
                </Tag>
              </div>
            );
          })}
        </>
      ),
    },
    {
      title: "Journey Status",
      key: "journeyStatus",
      render: (_, record) => (
        <>
          {record.programs?.map((item, idx) => {
            const status = item.journey_status;

            let color = "default";
            let icon = <MinusCircleOutlined />;

            const normalized = (status || "").toLowerCase();

            if (normalized === "full access") {
              color = "success";
              icon = <CheckCircleOutlined />;
            } else if (normalized === "counselling slot booking") {
              color = "processing";
              icon = <CalendarOutlined />;
            } else if (normalized === "exam") {
              color = "warning";
              icon = <ClockCircleOutlined />;
            } else if (normalized === "payment") {
              color = "purple";
              icon = <LockOutlined />;
            } else if (
              normalized === "counselling service selection"
            ) {
              color = "cyan";
              icon = <EditOutlined />;
            }

            return (
              <div key={idx}>
                {idx > 0 && (
                  <Divider
                    dashed
                    style={{
                      margin: "8px 0",
                      borderColor: "#d9d9d9",
                    }}
                  />
                )}

                <Tag
                  icon={icon}
                  color={color}
                  style={{
                    minWidth: 200,
                    textAlign: "center",
                    marginBottom: 4,
                  }}
                >
                  {status || "Payment"}
                </Tag>
              </div>
            );
          })}
        </>
      ),
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
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      render: (date) =>
        date ? dayjs(date).format("DD MMM YYYY, hh:mm A") : "—",
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
          {/* <Title level={3}>User Lists</Title> */}
          <Title level={3}>Students Enrolled</Title>
        </Col>
        <Col>
          <Space>
            <Button onClick={handleExportUsers} icon={<DownOutlined />} >
              Export to Excel
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddUser}
            >
              Add Student
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
