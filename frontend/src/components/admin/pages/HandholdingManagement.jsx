import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Tabs,
  Table,
  Button,
  Progress,
  Space,
  Tag,
  theme,
  Grid,
  Modal,
  message,
  Input,
  Select,
  Spin,
} from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import HHSessionModal from "../modals/HHSessionModal";
import { p, title } from "framer-motion/client";
import HHUserProfileModal from "../modals/HHUserProfileModal";
import EditHHUserModal from "../modals/EditHHUserModal";
import CertificateTemplateModal from "../modals/CertificateTemplateModal";
import HHSessionBookingModal from "../modals/HHSessionBookingModal";
import GenerateCertificateModal from "../modals/GenerateCertificateModal";
import { deleteHHSession, getHHSession } from "../../../hhSlices/handholdingSessionSlice";
import { getSessionBookings, cancelSession } from "../../../hhSlices/sessionBookingSlice";
import { getHandholdingParticipants ,getCardStats ,updateHandholdingParticipant} from "../../../hhSlices/handholdingUsersSlice";
import { getCertificateTemplates } from "../../../hhSlices/certificateSlice";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const HandholdingManagement = () => {
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("users"); // ✅ default
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionSearch, setSessionSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [certificateSearch, setCertificateSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [certificationFilter, setCertificationFilter] = useState("");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [selectedCertificateUser, setSelectedCertificateUser] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingMode, setBookingMode] = useState("create"); // create | edit | view
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [certificateMode, setCertificateMode] = useState("issue"); // "issue" | "preview"
  const [issuedModalOpen, setIssuedModalOpen] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("booked_group");
  const [bookingSearch, setBookingSearch] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedCancelBooking, setSelectedCancelBooking] = useState(null);
 const [previewModalOpen, setPreviewModalOpen] = useState(false);
const [previewTemplate, setPreviewTemplate] = useState(null);



  /* ================= PAGINATION STATE ================= */
  const [sessionPagination, setSessionPagination] = useState({ current: 1, pageSize: 5, });
  const [issuedPagination, setIssuedPagination] = useState({ current: 1, pageSize: 5, });
  const [userPagination, setUserPagination] = useState({ current: 1, pageSize: 5, });
  const [bookingPagination, setBookingPagination] = useState({ current: 1, pageSize: 5, });
  const { list: bookingsData, loading: bookingsLoading, } = useSelector((state) => state.sessionBooking);
  const {participants,participantsLoading,} = useSelector((state) => state.handholdingUsers);
  const { cardStats, cardStatsLoading } = useSelector((state) => state.handholdingUsers);
  const { templates, loading: templateLoading } = useSelector((state) => state.certificate);

  useEffect(() => {
    if (activeTab === "bookings") {
      dispatch(getSessionBookings());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (activeTab === "users") {
      dispatch(getHandholdingParticipants());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
  dispatch(getCardStats());
}, [dispatch]);

useEffect(() => {
  if (activeTab === "certificates") {
    dispatch(getCertificateTemplates());
  }
}, [activeTab, dispatch]);  



  const formattedBookings = bookingsData.map((item) => {
    const statusMap = {
      not_started: "not_booked",  // 👈 temporary backend mismatch fix
      not_booked: "not_booked",
      booked: "booked",
      rescheduled: "rescheduled",
      pending: "pending",
      completed: "completed",
      cancelled: "cancelled",
    };

    return {
      id: item.id,
      name: `${item.first_name} ${item.last_name}`,
      email: item.email,
      participant_id: item.participant_id,
      session: `Session ${item.session_no}`,
      session_no: item.session_no,
      date: item.session_date?.split("T")[0],
      time:
        item.start_time && item.end_time
          ? `${item.start_time} - ${item.end_time}`
          : "-",
      status: statusMap[item.status] || "not_booked",
      preferred_counselling_mode: item.preferred_counselling_mode
        ? item.preferred_counselling_mode.charAt(0).toUpperCase() + item.preferred_counselling_mode.slice(1)
        : "-",

    };
  });


  const handleEditBooking = (record) => {
    setSelectedBooking(record);
    setBookingMode("edit");   // 🔥 IMPORTANT
    setBookingModalOpen(true);
  };

  const handleViewBooking = (record) => {
    setSelectedBooking(record);
    setBookingMode("view");
    setBookingModalOpen(true);
  };

  const handleDeleteClick = (record) => {
    setSelectedSession(record);
    setDeleteModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingSession(record);
    setModalOpen(true);
  };

  const handleCancel = (record) => {
    setSelectedCancelBooking(record);
    setCancelModalOpen(true);
  };

  const confirmCancelBooking = async () => {
    try {
      await dispatch(
        cancelSession({
          participant_id: selectedCancelBooking.participant_id,
          session_no: selectedCancelBooking.session_no,
        })
      ).unwrap();

      message.success("Booking cancelled successfully");

      dispatch(getSessionBookings()); // refresh list
    } catch (err) {
      message.error(err?.message || "Cancel failed");
    } finally {
      setCancelModalOpen(false);
      setSelectedCancelBooking(null);
    }
  };


  const confirmDelete = async () => {
    try {
      await dispatch(deleteHHSession(selectedSession.id)).unwrap();

      message.success("Session deleted successfully");
    } catch (err) {
      message.error(err?.message || "Delete failed");
    } finally {
      setDeleteModalOpen(false);
      setSelectedSession(null);
    }
  };

const handlePreview = (record) => {
  window.open(record.template_file, "_blank");
};

  /* ================= STATS ================= */
 const stats = [
  {
    title: "Total Sessions",
    value: cardStats?.total_sessions || 0,
    icon: <FileTextOutlined style={{ fontSize: 22, color: token.colorPrimary }} />,
  },
  {
    title: "Active Users",
    value: cardStats?.active_users_count || 0,
    icon: <UserOutlined style={{ fontSize: 22, color: token.colorSuccess }} />,
  },
  {
    title: "Completed Users",
    value: cardStats?.completed_users_count || 0,
    icon: <CheckCircleOutlined style={{ fontSize: 22, color: token.colorWarning }} />,
  },
  {
    title: "Certificates Issued",
    value: cardStats?.certificate_issued_count || 0,
    icon: <TrophyOutlined style={{ fontSize: 22, color: token.colorError }} />,
  },
];

const colors = ["#6366f1", "#10b981"]; // indigo, green (you can change 2nd)


  /* ================= SESSION TEMPLATE ================= */
  const { sessions, loading } = useSelector((state) => state.hhSession);



  useEffect(() => {
    dispatch(getHHSession());
  }, [dispatch]);


  const sessionColumns = [
    {
      title: "Sr No",
      width: 80,
      render: (_, __, index) =>
        (sessionPagination.current - 1) * sessionPagination.pageSize +
        index +
        1,
    },
    {
      title: "Session",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* GREEN TICK */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "2px solid #22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ecfdf5",
            }}
          >
            <CheckCircleOutlined
              style={{
                color:
                  record.status === "completed" ? "#22c55e" : "#d1d5db",
              }}
            />
          </div>

          {/* TEXT */}
          <div>
            <Text strong>{record.title}</Text>
            <div style={{ color: "#888" }}>{record.description}</div>
          </div>
        </div>
      ),
    },
    // {
    //   title: "Status",
    //   align: "right",
    //   render: (_, record) => (
    //     <Tag
    //       color={record.status === "completed" ? "success" : "default"}
    //       style={{ borderRadius: 20 }}
    //     >
    //       {record.status === "completed" ? "Completed" : "Pending"}
    //     </Tag>
    //   ),
    // },
    {
      title: "Action",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteClick(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    }
  ];

  /* ================= USERS ================= */
  const users = (participants || []).map((item) => ({
    id: item.id,

    // UI FORM FIELDS (IMPORTANT)
    firstName: item.first_name || "",
    lastName: item.last_name || "",
    email: item.email || "",
    mobile: item.mobile || "",

    city: item.city || "",
    address: item.full_address || "",
    preferred_counselling_mode: item.preferred_counselling_mode || "",
    showProfile: item.show_profile ?? false,

    photo: item.photo || null,
    resume: item.resume_file || null,
    payment_proof: item.proof_file || null,

    // TABLE FIELDS
    name: `${item.first_name || ""} ${item.last_name || ""}`,
    progressPercent: item.progress?.percentage || 0,
    progressLabel: item.progress?.label || "0/0",
    sessionStatus: item.session_status || "pending",
    paymentStatus: (item.payment_status || "not_paid").toLowerCase(),
    certificationStatus: item.certificate_issued ? "issued" : "pending",
    program_name: item.program_name || "-",
    package_name: item.package_name || "-",
    package_price: item.package_price || 0,
    total_paid_amount: item.total_paid_amount || 0,
    remaining_amount: item.remaining_amount || 0,
  }));

  // ✅ NOW it's safe
  const issuedUsers = users.filter(
    (u) => u.certificationStatus === "issued"
  );

  const userColumns = [
    {
      title: "Sr No",
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Username / Email",
      width: 120,
      render: (_, record) => (
        <div>
          <Text strong>{record.name}</Text>
          <div>{record.email}</div>
        </div>
      ),
    },
    {
      title: "Progress",
      render: (_, record) => (
        <div>
          <Progress
            percent={record.progressPercent}
            size={screens.xs ? "small" : "default"}
          />
          <Text>{record.progressLabel} Sessions</Text>
        </div>
      ),
    },
    {
      title: "Session Status",
      width: 120,
      render: (_, record) => {
        const status = record.sessionStatus;

        let color = "default";
        let label = "Pending";

        if (status === "completed") {
          color = "success";
          label = "Completed";
        } else if (status === "in_progress") {
          color = "processing";
          label = "In Progress";
        } else if (status === "not_started") {
          color = "default";
          label = "Not Started";
        }

        return <Tag color={color}>{label}</Tag>;
      }
    },
    {
      title: "Payment Status",
      render: (_, record) => {
        const status = record.paymentStatus?.toLowerCase();

        let color = "default";
        let label = status;

        if (status === "fully_paid") {
          color = "success";
          label = "Fully Paid";
        } else if (status === "partial_paid") {
          color = "warning";
          label = "Partial Paid";
        } else if (status === "not_paid") {
          color = "error";
          label = "Not Paid";
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Certification Status",
      width: 120,
      render: (_, record) => {
        const isIssued = record.certificationStatus === "issued";

        return (
          <Tag color={isIssued ? "success" : "warning"}>
            {isIssued ? "Issued" : "Pending"}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      render: (_, record) => {
        const isCompleted =
          record.completedSessions === record.totalSessions;

        return (
          <Space wrap>
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedUser(record);
                setUserModalOpen(true);
              }}
            >
              View
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedUser(record);
                setEditModalOpen(true);    // ✅ open edit modal
              }}
            >
              Edit
            </Button>

            {/* ✅ SHOW ONLY IF COMPLETED */}
            {isCompleted && (
              <Button
                type="primary"
                onClick={() => {
                  setSelectedCertificateUser(record); // ✅ correct user
                  setCertificateModalOpen(true);
                  setCertificateMode("issue");
                }}
              >
                Issue Certificate
              </Button>
            )}
          </Space>
        );
      },
    }
  ];

  /* ================= CERTIFICATION ================= */
  const completedUsers = users.filter(
    (u) => u.completedSessions === u.totalSessions
  );

  const certificateColumns = [
    {
      title: "Sr No",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "User",
      render: (_, record) => (
        <div>
          <Text strong>{record.name}</Text>
          <div>{record.email}</div>
        </div>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space wrap>
          <Button icon={<EyeOutlined />}>View</Button>
          <Button icon={<EditOutlined />}>Edit</Button>
        </Space>
      ),
    },
  ];


  const filteredSessions = sessions?.filter((item) =>
    item.title?.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  const filteredUsers = users.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      item.email.toLowerCase().includes(userSearch.toLowerCase());

    const matchesPayment =
      !paymentFilter || item.paymentStatus === paymentFilter;

    const matchesCertification =
      !certificationFilter || item.certificationStatus === certificationFilter;

    return matchesSearch && matchesPayment && matchesCertification;
  });


  const filteredCertificates = completedUsers.filter((item) =>
    item.name.toLowerCase().includes(certificateSearch.toLowerCase()) ||
    item.email.toLowerCase().includes(certificateSearch.toLowerCase())
  );

  // const bookingsData = [
  //   {
  //     id: 1,
  //     name: "Rahul Sharma",
  //     email: "rahul@gmail.com",
  //     session: "Session 1",
  //     date: "2026-04-03",
  //     time: "10:00 AM - 11:00 AM",
  //     status: "booked",
  //   },
  //   {
  //     id: 2,
  //     name: "Priya Singh",
  //     email: "priya@gmail.com",
  //     session: "Session 2",
  //     date: "2026-04-04",
  //     time: "12:00 PM - 01:00 PM",
  //     status: "rescheduled",
  //   },
  //   {
  //     id: 3,
  //     name: "Rahul Sharma",
  //     email: "rahul@gmail.com",
  //     session: "Session 1",
  //     date: "2026-04-03",
  //     time: "10:00 AM - 11:00 AM",
  //     status: "pending",
  //   },
  //   {
  //     id: 4,
  //     name: "Priya Singh",
  //     email: "priya@gmail.com",
  //     session: "Session 2",
  //     date: "2026-04-04",
  //     time: "12:00 PM - 01:00 PM",
  //     status: "completed",
  //   },
  //   {
  //     id: 5,
  //     name: "Amit Kumar",
  //     email: "amit@gmail.com",
  //     session: "Session 3",
  //     date: "2026-04-05",
  //     time: "02:00 PM - 03:00 PM",
  //     status: "cancelled",
  //   },
  //   {
  //     id: 6,
  //     name: "Amit Kumar",
  //     email: "amit@gmail.com",
  //     session: "Session 3",
  //     date: "2026-04-05",
  //     time: "02:00 PM - 03:00 PM",
  //     status: "not_booked",
  //   },
  // ];
  const bookingColumns = React.useMemo(() => {
    const baseColumns = [
      {
        title: "Sr No",
        width: 60,
        render: (_, __, index) => index + 1,
      },
      {
        title: "Username / Email",
        width: 150,
        render: (_, record) => (
          <div>
            <Text strong>{record.name}</Text>
            <div>{record.email}</div>
          </div>
        ),
      },
      {
        title: "Date & Time",
        render: (_, record) => (
          <div>
            <Text strong>{record.date}</Text>
            <div>{record.time}</div>
          </div>
        ),
      },
      {
        title: "Preferred Counselling Mode",
        width: 150,
        render: (_, record) => {
          let color = "default";
          let text = record.preferred_counselling_mode;

          if (record.preferred_counselling_mode === "Online") {
            color = "blue";
            text = "Online";
          } else if (record.preferred_counselling_mode === "Offline") {
            color = "green";
            text = "Offline";
          } else {
            color = "default";
            text = record.preferred_counselling_mode || "N/A";
          }

          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        title: "Status",
        render: (_, record) => {
          let color = "default";
          let text = record.status;

          if (record.status === "booked") {
            color = "green";
            text = "Booked";
          } else if (record.status === "rescheduled") {
            color = "orange";
            text = "Rescheduled";
          } else if (record.status === "not_booked") {
            color = "red";
            text = "Not Booked";
          } else if (record.status === "pending") {
            color = "blue";
            text = "Pending";
          } else if (record.status === "completed") {
            color = "green";
            text = "Completed";
          } else if (record.status === "cancelled") {
            color = "red";
            text = "Cancelled";
          }

          return <Tag color={color}>{text}</Tag>;
        },
      },
    ];

    // ❌ REMOVE ACTION COLUMN FOR CANCELLED TAB
    if (bookingStatusFilter === "cancelled") {
      return baseColumns;
    }

    // ✅ ADD ACTION COLUMN FOR OTHER TABS
    return [
      ...baseColumns,
      {
        title: "Actions",
        render: (_, record) => {

          if (record.status === "not_booked") {
            return (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setSelectedBooking(record);
                  setBookingMode("create");
                  setBookingModalOpen(true);
                }}
              >
                Book Session
              </Button>
            );
          }

          if (["booked", "rescheduled"].includes(record.status)) {
            return (
              <Space>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => handleEditBooking(record)}
                >
                  Reschedule
                </Button>

                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleCancel(record)}
                >
                  Cancel
                </Button>
              </Space>
            );
          }

          if (record.status === "completed") {
            return (
              <Space>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => handleEditBooking(record)}
                >
                  Reschedule
                </Button>

                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleCancel(record)}
                >
                  Cancel
                </Button>
              </Space>
            );
          }

          if (record.status === "pending") {
            return (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => handleEditBooking(record)}
              >
                Reschedule
              </Button>
            );
          }

          return null;
        },
      },
    ];
  }, [bookingStatusFilter]);
  const issuedColumns = [
    {
      title: "Sr No",
      render: (_, __, index) =>
        (issuedPagination.current - 1) * issuedPagination.pageSize + index + 1,
    },
    {
      title: "User",
      render: (_, record) => (
        <div>
          <Text strong>{record.name}</Text>
          <div style={{ color: "#888" }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: "Sessions",
      render: (_, record) => (
        <Text>
          {record.completedSessions}/{record.totalSessions}
        </Text>
      ),
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => handlePreview(record)}
        >
          View
        </Button>
      ),
    }
  ];

  const filteredBookings = formattedBookings.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      item.email?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      item.session?.toLowerCase().includes(bookingSearch.toLowerCase());

    let matchesStatus = true;

    if (bookingStatusFilter === "booked_group") {
      matchesStatus = ["booked", "rescheduled"].includes(item.status);
    } else if (bookingStatusFilter) {
      matchesStatus = item.status === bookingStatusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col span={24}>
          <Title level={3} style={{ marginBottom: 0 }}>
            Handholding Management
          </Title>
        </Col>
      </Row>

      {/* STATS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {stats.map((item, index) => (
          <Col xs={24} sm={12} md={12} lg={6} key={index}>
            <Card
              bordered={false}
              style={{
                height: screens.xs ? 110 : 130,
                borderRadius: 12,
                boxShadow: token.boxShadow,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <div>
                  <Text style={{ color: token.colorTextSecondary, fontSize: 16 }}>
                    {item.title}
                  </Text>
                <Title level={3}>
  {cardStatsLoading ? <Spin size="small" /> : item.value}
</Title>
                </div>
                {item.icon}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* TABS */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);

          // ✅ When clicking "Session Bookings"
          if (key === "bookings") {
            setBookingStatusFilter("booked_group"); // 👈 force active sub-tab
          }
        }}
        items={[
          { key: "users", label: "Handholding Users" },
          { key: "sessions", label: "Session Template" },
          { key: "bookings", label: "Session Bookings" },
          { key: "certificates", label: "Certification" },
        ]}
      />

      <Card>
        {/* SESSION TEMPLATE */}
        {activeTab === "sessions" && (
          <>
            <Row style={{ marginBottom: 16 }} gutter={10}>
              <Col xs={24} md={12}>
                <Input
                  placeholder="Search session..."
                  prefix={<SearchOutlined />}
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  allowClear
                />
              </Col>

              <Col xs={24} md={12} style={{ textAlign: "right" }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingSession(null);
                    setModalOpen(true);
                  }}
                >
                  Add Session
                </Button>
              </Col>
            </Row>

            <Table
              columns={sessionColumns}
              dataSource={filteredSessions}
              rowKey="id"
              loading={loading}
              rowClassName={() => "custom-row"}
              pagination={{
                ...sessionPagination,
                showSizeChanger: true,

                pageSizeOptions: [5, 10, 20, 50],
              }}
              onChange={(pag) => setSessionPagination(pag)}
              scroll={{ x: "max-content" }}
            />
          </>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <>
            <Row
              style={{ marginBottom: 16 }}
              gutter={[12, 12]}
            >
              {/* SEARCH - BIGGER */}
              <Col xs={24} sm={24} md={12} lg={14}>
                <Input
                  placeholder="Search..."
                  prefix={<SearchOutlined />}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  allowClear
                  size="large"
                />
              </Col>

              {/* PAYMENT FILTER - SMALLER */}
              <Col xs={24} sm={12} md={6} lg={5}>
                <Select
                  placeholder="Payment Status"
                  value={paymentFilter || undefined}
                  onChange={(value) => setPaymentFilter(value)}
                  allowClear
                  size="large"
                  style={{ width: "100%" }}
                >
                  <Select.Option value="fully_paid">Fully Paid</Select.Option>
                  <Select.Option value="partial_paid">Partial Paid</Select.Option>
                  <Select.Option value="not_paid">Not Paid</Select.Option>
                </Select>
              </Col>

              {/* CERTIFICATION FILTER - SMALLER */}
              <Col xs={24} sm={12} md={6} lg={5}>
                <Select
                  placeholder="Certification Status"
                  value={certificationFilter || undefined}
                  onChange={(value) => setCertificationFilter(value)}
                  allowClear
                  size="large"
                  style={{ width: "100%" }}
                >
                  <Select.Option value="issued">Issued</Select.Option>
                  <Select.Option value="pending">Pending</Select.Option>
                </Select>
              </Col>
            </Row>

            {/* TABLE */}
            <Table
              columns={userColumns}
              dataSource={filteredUsers}
              rowKey="id"
              loading={participantsLoading}
              scroll={{ x: "max-content" }}
              pagination={{
                ...userPagination,
                showSizeChanger: true,
                pageSizeOptions: [5, 10, 20, 50],
              }}
              onChange={(pag) => setUserPagination(pag)}

            />
          </>
        )}

        {/* CERTIFICATES */}
        {activeTab === "certificates" && (
          <>
            {/* ================= TOP STATUS CARDS ================= */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>

              {/* Pending */}
              <Col xs={24} md={8}>
                <Card
                  style={{
                    borderRadius: 16,
                    background: "#fff7e6",
                    border: "1px solid #ffe7ba",
                  }}
                >
                  <Space direction="vertical">
                    <Space>
                      <TrophyOutlined style={{ color: "#d97706", fontSize: 18 }} />
                      <Text strong>Pending Generation</Text>
                    </Space>

                    <Title level={2} style={{ margin: 0 }}>1</Title>

                    <Text type="colorTextSecondary">
                      Students awaiting certificates
                    </Text>

                    <Button block style={{ marginTop: 10 }} onClick={() => setGenerateModalOpen(true)}>
                      Generate Certificates
                    </Button>
                  </Space>
                </Card>
              </Col>

              {/* Ready */}
              <Col xs={24} md={8}>
                <Card
                  style={{
                    borderRadius: 16,
                    background: "#f0f5ff",
                    border: "1px solid #d6e4ff",
                  }}
                >
                  <Space direction="vertical">
                    <Space>
                      <CheckCircleOutlined style={{ color: "#2563eb", fontSize: 18 }} />
                      <Text strong>Ready to Issue</Text>
                    </Space>

                    <Title level={2} style={{ margin: 0 }}>1</Title>

                    <Text type="colorTextSecondary">
                      Certificates ready for delivery
                    </Text>

                    {/* Spacer to maintain card height */}
                    <div style={{ height: 42, marginTop: 10 }}></div>
                  </Space>
                </Card>
              </Col>

              {/* Issued */}
              <Col xs={24} md={8}>
                <Card
                  style={{
                    borderRadius: 16,
                    background: "#f6ffed",
                    border: "1px solid #b7eb8f",
                  }}
                >
                  <Space direction="vertical">
                    <Space>
                      <CheckCircleOutlined style={{ color: "#16a34a", fontSize: 18 }} />
                      <Text strong>Issued</Text>
                    </Space>

                    <Title level={2} style={{ margin: 0 }}>
                      {issuedUsers.length}
                    </Title>

                    <Text type="colorTextSecondary">
                      Successfully delivered
                    </Text>

                    <Button
                      block
                      style={{ marginTop: 10 }}
                      onClick={() => setIssuedModalOpen(true)}
                    >
                      View All
                    </Button>
                  </Space>
                </Card>
              </Col>
            </Row>

            {/* ================= CERTIFICATE TEMPLATES ================= */}


            <Card
              title={
                <div style={{ fontSize: screens.xs ? 16 : 18, fontWeight: 600 }}>
                  🎓 Certificate Templates
                </div>
              }
              bodyStyle={{
                padding: screens.xs ? 8 : 20,   // 🔥 reduce internal padding
              }}
              style={{
                borderRadius: 20,
                border: "none",
                background: "linear-gradient(135deg, #f9fafb, #eef2ff)",
                padding: 0, // ❗ remove extra outer padding
              }}
            >
          <Row gutter={[16, 16]}>
  {templateLoading ? (
    <Spin />
  ) : (
    
    templates?.map((item, index) => {
      const bgColor = colors[index % colors.length]; // 🔥 alternating

      return (
        <Col xs={24} sm={24} md={12} key={item.id || index}>
          <Card
            hoverable
            style={{
              borderRadius: 18,
              overflow: "hidden",
              border: "none",
              background: "#ffffffcc",
              backdropFilter: "blur(10px)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
            }}
          >
            {/* TOP STRIP */}
            <div
              style={{
                height: 5,
                background: bgColor, // ✅ dynamic color here also
                borderRadius: 10,
                marginBottom: 10,
              }}
            />

            <Space direction="vertical" style={{ width: "100%" }}>
              
              {/* HEADER */}
              <Row justify="space-between" align="middle">
                <Text strong>{item.name}</Text>
                <Tag color="success">Active</Tag>
              </Row>

              {/* DESCRIPTION */}
              <Text style={{ color: "#6b7280" }}>
                {item.description}
              </Text>

              {/* PREVIEW BOX */}
              <div
                style={{
                  height: 120,
                  borderRadius: 10,
                  background: "#f5f5f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                📄 Preview
              </div>

              {/* BUTTON */}
              <Button
                block
                icon={<EyeOutlined />}
                onClick={() => handlePreview(item)}
                style={{
                  marginTop: 10,
                  background: bgColor, // ✅ alternating color
                  color: "#fff",
                  border: "none",
                }}
              >
                Preview
              </Button>
            </Space>
          </Card>
        </Col>
      );
    })
  )}
</Row>
            </Card>
          </>
        )}

        {/* BOOKINGS TAB */}


        {activeTab === "bookings" && (
          <>
            {/* SEARCH */}
            <Row style={{ marginBottom: 16 }} gutter={10}>
              <Col xs={24} md={12}>
                <Input
                  placeholder="Search..."
                  prefix={<SearchOutlined />}
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  allowClear
                />
              </Col>
            </Row>

            {/* 🔥 SUB TABS */}
            <Tabs
              activeKey={bookingStatusFilter}
              onChange={(key) => setBookingStatusFilter(key)}
              items={[
                { key: "not_booked", label: "Not Booked" },
                { key: "booked_group", label: "Booked / Rescheduled" },
                { key: "pending", label: "Pending" },
                { key: "completed", label: "Completed" },
                { key: "cancelled", label: "Cancelled" },
              ]}
              style={{ marginBottom: 16 }}
            />

            {/* TABLE */}
            <Table
              columns={bookingColumns}
              dataSource={filteredBookings}
              rowKey="id"
              loading={bookingsLoading}
              scroll={{ x: "max-content" }}
              pagination={{
                ...bookingPagination,
                showSizeChanger: true,
                pageSizeOptions: [5, 10, 20, 50],
              }}
              onChange={(pag) => setBookingPagination(pag)}
            />
          </>
        )}

      </Card>

      {/* CUSTOM CSS */}
      <style>
        {`
          .custom-row {
            background: #f9fafb;
          }

          .ant-table-tbody > tr.custom-row > td {
            border-bottom: none !important;
            padding: 16px !important;
          }

          .ant-table-tbody > tr.custom-row {
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            border-radius: 12px;
          }

          .ant-table {
            background: transparent !important;
          }
        `}
      </style>
      <HHSessionModal
        open={modalOpen}
        centered
        onCancel={() => {
          setModalOpen(false);
          setEditingSession(null);
        }}
        initialValues={editingSession}
      />

      <HHUserProfileModal
        open={userModalOpen}
        onClose={() => {
          setUserModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <EditHHUserModal
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        userData={selectedUser}
        onSubmit={async (formData) => {
          try {
            await dispatch(updateHandholdingParticipant({
              id: formData.get("id"),
              payload: formData
            })).unwrap();

            message.success("User updated successfully");

            // ✅ REFRESH USERS LIST
            dispatch(getHandholdingParticipants());

            setEditModalOpen(false);
            setSelectedUser(null);

          } catch (err) {
            message.error(err?.message || "Update failed");
          }
        }}
      />

      <CertificateTemplateModal
        open={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
        onSelect={(template) => {
          if (certificateMode === "issue") {
            message.success(`Certificate issued using ${template.name}`);
          }
          setCertificateModalOpen(false);
        }}
        showSelectButton={certificateMode === "issue"} // ✅ dynamic
      />

      <GenerateCertificateModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
       />

      <Modal
        title="Issued Certificates"
        open={issuedModalOpen}
        onCancel={() => setIssuedModalOpen(false)}
        footer={null}
        width={800}
        centered
      >
        <Table
          columns={issuedColumns}
          dataSource={issuedUsers}
          rowKey="id"
          pagination={issuedPagination}
          onChange={(pag) => setIssuedPagination(pag)}
        />
      </Modal>

      <HHSessionBookingModal
        visible={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setSelectedBooking(null);
        }}
        mode={bookingMode}   // 🔥 edit / view / create
        data={selectedBooking}  // 🔥 pass selected row
        onSave={() => {
          // message.success("Booking updated");

          dispatch(getSessionBookings());
        }}
      />

      <Modal
        title="Cancel Booking"
        open={cancelModalOpen}
        centered
        onOk={confirmCancelBooking}
        onCancel={() => {
          setCancelModalOpen(false);
          setSelectedCancelBooking(null);
        }}
        okText="Yes, Cancel"
        okType="default"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to cancel session for{" "}
          <strong>{selectedCancelBooking?.name}</strong>?
        </p>
      </Modal>

      <Modal
        title="Delete Session"
        open={deleteModalOpen}
        centered
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setSelectedSession(null);
        }}
        okText="Delete"
        okType="default"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to delete{" "}
          <strong>{selectedSession?.title}</strong>?
        </p>
      </Modal>

     
    </div>
  );
};

export default HandholdingManagement;
