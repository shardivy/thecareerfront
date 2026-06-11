import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Tabs,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  BellOutlined,

} from "@ant-design/icons";
import dayjs from "dayjs";
import CreateSessionModal from "../modals/CreateSessionModal";
import {
  fetchCounsellingBookings,
  fetchCounsellingSessionCount,
  cancelCounsellingBooking,
  sendCounsellingReminder,
  markCounsellingBookingCompleted
  // deleteCounsellingBooking,
} from "../../../adminSlices/counsellingBookingSlice";
import { fetchLeadCounsellors, fetchCounsellingNote } from "../../../adminSlices/counsellorSlice";
import SessionNotesModal from "../../counsellor/modals/SessionNotesModal";

const { Title, Text } = Typography;
const { Option } = Select;

const SlotBooking = () => {
  const dispatch = useDispatch();
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const { data = [], loading, stats, statsLoading } = useSelector(
    (state) => state.counsellingBooking
  );

  const { list: counsellorList = [] } = useSelector(
    (state) => state.counsellors
  );


  const [searchText, setSearchText] = useState("");
  const [modeFilter, setModeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const [statsPeriod, setStatsPeriod] = useState("today");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [rescheduleData, setRescheduleData] = useState(null);
  const [counsellorFilter, setCounsellorFilter] = useState(null);
  const [activeTab, setActiveTab] = useState("booked");

  /* ================= FETCH BOOKINGS ================= */
  useEffect(() => {
    dispatch(fetchCounsellingBookings());
    dispatch(fetchCounsellingSessionCount(statsPeriod));
    dispatch(fetchLeadCounsellors());
  }, [dispatch, statsPeriod]);

  /* ----------------- STATS DATA ----------------- */
  const statsCards = [
    {
      title: "Total Sessions",
      value: stats?.total_sessions ?? 0,
      icon: <CalendarOutlined />,
    },
    {
      title: "Today's Sessions",
      value: stats?.today_sessions?.total ?? 0,
      sub: `Completed: ${stats?.today_sessions?.completed ?? 0} | Upcoming: ${stats?.today_sessions?.upcoming ?? 0}`,
      icon: <ClockCircleOutlined />,
    },
    {
      title: `Pending Sessions`,
      value: stats?.pending_sessions ?? 0,
      icon: <CalendarOutlined />,
    },
    {
      title: "Completed",
      value: stats?.completed_sessions ?? 0,
      icon: <CheckCircleOutlined />,
    },
  ];


  /* ================= MAP API → TABLE ================= */
  const dataSource = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      ...item,
      key: item.id,
      studentName: `${item.student?.first_name || ""} ${item.student?.last_name || ""
        }`,
      email: item.student?.email || "—",
      programId: item.program?.id || null,
      packageId: item.package?.id || null,
      programName: item.program?.name || "—",
      packageName: item.package?.name || "—",
      counsellorDisplay: Array.isArray(item.counsellors)
        ? item.counsellors.map((c) => ({
          id: c.counsellor.id,   // ✅ ADD ID
          name: `${c.counsellor.first_name} ${c.counsellor.last_name}`,
          type: c.role,
        }))
        : [],

      time: item.slot
        ? `${item.slot.start_time} `
        : "—",
      modeLabel: item.student?.preferred_counselling_mode
        ? item.student.preferred_counselling_mode.charAt(0).toUpperCase() +
        item.student.preferred_counselling_mode.slice(1)
        : "—",

      status: item.status,

      // ✅ Separate property for filtering/tabs (booked + rescheduled → booked tab)
      filterStatus: item.status === "rescheduled" ? "booked" : item.status,
    }));
  }, [data]);

  /* ================= FILTER ================= */
  // const filteredData = dataSource
  //   .filter((item) => {
  //     const text = Object.values(item).join(" ").toLowerCase();
  //     return (
  //       text.includes(searchText.toLowerCase()) &&
  //       (!modeFilter || item.mode === modeFilter) &&
  //       (!statusFilter || item.status === statusFilter) &&
  //       (!dateFilter || dayjs(item.date).isSame(dateFilter, "day"))
  //     );
  //   })
  //   .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));

  const filteredData = dataSource
    .filter((item) => {
      const text = Object.values(item).join(" ").toLowerCase();
      const modeMatch = !modeFilter || item.mode === modeFilter;
      const statusMatch = !statusFilter || item.filterStatus === statusFilter;
      const dateMatch = !dateFilter || dayjs(item.date).isSame(dateFilter, "day");
      const counsellorMatch =
        !counsellorFilter || item.counsellorDisplay.some((c) => c.id === counsellorFilter);

      const tabMatch = activeTab === "all" ? true : item.filterStatus === activeTab;

      return (
        text.includes(searchText.toLowerCase()) &&
        modeMatch &&
        statusMatch &&
        dateMatch &&
        counsellorMatch &&
        tabMatch
      );
    })
    .sort((a, b) => {
      if (a.filterStatus === "booked" && b.filterStatus !== "booked") return -1;
      if (a.filterStatus !== "booked" && b.filterStatus === "booked") return 1;
      return dayjs(a.date).diff(dayjs(b.date));
    });

  /* ================= DELETE HANDLER ================= */
  const handleCancel = (record) => {
    Modal.confirm({
      title: "Cancel Booking?",
      content: `Are you sure you want to cancel session for ${record.studentName}?`,
      okText: "Yes, Cancel",
      okType: "danger",
      cancelText: "No",
      centered: true,

      onOk: () => {
        return dispatch(cancelCounsellingBooking(record.id))
          .unwrap()
          .then(() => {
            dispatch(fetchCounsellingBookings()); // optional refresh
          });
      },
    });
  };

  const handleMarkCompleted = (record) => {
    Modal.confirm({
      title: "Mark Session as Completed",
      content: `Are you sure you want to mark session for ${record.studentName} as completed?`,
      okText: "Yes",
      cancelText: "No",
      centered: true,

      onOk: () => {
        return dispatch(markCounsellingBookingCompleted(record.id))
          .unwrap()
          .then(() => {
            message.success("Session marked as completed");

            // refresh table + stats
            dispatch(fetchCounsellingBookings());
            dispatch(fetchCounsellingSessionCount(statsPeriod));
          })
          .catch((err) => {
            message.error(err || "Failed to mark session completed");
          });
      },
    });
  };

  const handleSendReminder = (record) => {
    Modal.confirm({
      title: "Send Reminder?",
      content: `Send reminder to ${record.studentName}?`,
      okText: "Yes",
      cancelText: "No",
      centered: true,
      maskClosable: true, // ✅ allow outside click

      onOk: () => {
        return dispatch(sendCounsellingReminder(record.id))
          .unwrap()
          .then((res) => {
            message.success(res.message || "Reminder sent successfully");
            // Modal closes automatically after .then()
          })
          .catch((err) => {
            message.error(err || "Failed to send reminder");
          });
      },
    });
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: "Sr.",
        width: 60,
        render: (_, __, index) =>
          (currentPage - 1) * pageSize + index + 1,
      },
      {
        title: "User Name",
        width: 150,
        render: (_, r) => (
          <>
            <Text strong>{r.studentName}</Text>
            <br />
            <Text type="colorTextSecondary">{r.email}</Text>
          </>
        ),
      },
      {
        title: "Program / Counselling Service",
        width: 250,
        render: (_, record) => (
          <>
            <div style={{ fontWeight: 500 }}>
              {record.programName}
            </div>

            <div type="colorTextSecondary"
            >
              {record.packageName}
            </div>
          </>
        ),
      },
      {
        title: "Counsellors",
        width: 150,
        render: (_, r) =>
          r.counsellorDisplay.length ? (
            r.counsellorDisplay.map((c, i) => (
              <div key={i}>
                <Text strong>{c.name}</Text>
                <br />
                <Tag color={c.type === "lead" ? "blue" : "green"}>
                  {c.type}
                </Tag>
              </div>
            ))
          ) : (
            <Text type="colorTextSecondary">—</Text>
          ),
      },
      {
        title: "Date & Time",
        width: 170,
        render: (_, r) => (
          <>
            <Text>{r.date}</Text>
            <br />
            <Text type="colorTextSecondary">{r.time}</Text>
          </>
        ),
      },
      {
        title: "Preferred Counselling Mode",
        dataIndex: "modeLabel",
        width: 100,
        render: (m) => <Tag>{m}</Tag>,
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 110,
        render: (status) => {
          const formatted =
            status?.charAt(0).toUpperCase() + status?.slice(1);

          const color =
            status === "booked"
              ? "blue"
              : status === "rescheduled"
                ? "orange"
                : status === "completed"
                  ? "green"
                  : status === "pending"
                    ? "gold"
                    : status === "cancelled"
                      ? "red"
                      : "default";

          return <Tag color={color}>{formatted}</Tag>;
        },
      },
    ];

    // ❌ DO NOT ADD ACTION COLUMN IF CANCELLED TAB
    if (activeTab === "cancelled") {
      return baseColumns;
    }

    // ✅ Add Actions column only for other tabs
    return [
      ...baseColumns,
      {
        title: "Actions",
        width: 160,
        render: (_, record) => {
          if (record.status === "not_booked") {
            return (
              <Space>

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setModalMode("edit");
                    setRescheduleData(record);
                    setIsModalOpen(true);
                  }}
                >
                  Book Session
                </Button>

                <Button icon={<BellOutlined />} onClick={() => handleSendReminder(record)}>
                  Send Reminder
                </Button>
              </Space>

            );
          }

          if (record.status === "completed") {
            return (
              <Space>
                <Button
                  onClick={() => {
                    dispatch(fetchCounsellingNote(record.id)).then(() => {
                      setSelectedSession(record);
                      setNotesModalOpen(true);
                    });
                  }}
                >
                  View / Add Notes
                </Button>

                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    // console.log("Edit Record:", record);
                    setRescheduleData(record);
                    setModalMode("edit");
                    setIsModalOpen(true);
                  }}
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

          return (
            <Space >
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => {
                  setRescheduleData(record);
                  setModalMode("edit");
                  setIsModalOpen(true);
                }}
              >
                {activeTab === "booked" ? "Edit / Reschedule" : "Reschedule"}
              </Button>

              {(() => {
                const sessionDate = dayjs(record.date).format("YYYY-MM-DD");

                const slotStart = dayjs(
                  `${sessionDate} ${record.slot?.start_time}`,
                  "YYYY-MM-DD hh:mm A"
                );

                const fifteenMinutesBefore = slotStart.subtract(15, "minute");

                const markCompletedEnabled = dayjs().isAfter(fifteenMinutesBefore);

                return (
                  (record.status === "booked" ||
                    record.status === "rescheduled") && (
                    <Button
                      type="primary"
                      disabled={!markCompletedEnabled}
                      style={{
                        backgroundColor: markCompletedEnabled
                          ? "#349304"
                          : "#d9d9d9",
                        borderColor: markCompletedEnabled
                          ? "#349304"
                          : "#d9d9d9",
                        color: markCompletedEnabled
                          ? "#fff"
                          : "rgba(0,0,0,0.25)",
                      }}
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleMarkCompleted(record)}
                    >
                      Mark Completed
                    </Button>
                  )
                );
              })()}

              <Button icon={<BellOutlined />}
                onClick={() => handleSendReminder(record)}
              >
                Send Reminder
              </Button>

              {record.status !== "pending" && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleCancel(record)}
                >
                  Cancel
                </Button>
              )}
            </Space>
          );
        },
      },
    ];
  }, [activeTab, currentPage, pageSize, dispatch, statsPeriod]);

  return (
    <div style={{ padding: "12px" }}>
      {/* ================= HEADER ================= */}
      <Row
        gutter={[12, 12]}
        align="middle"
        justify="space-between"
        style={{ marginBottom: 16 }}
      >
        <Col xs={24} sm={12}>
          <Title level={3} style={{ margin: 0 }}>
            Counselling Sessions
          </Title>
        </Col>
        <Col xs={24} sm={6} style={{ textAlign: "right" }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled
            block={window.innerWidth < 576}
            onClick={() => {
              setModalMode("create");
              setRescheduleData(null);
              setIsModalOpen(true);
            }}
          >
            Create Session
          </Button>
        </Col>
      </Row>

      {/* ================= STATS FILTER DROPDOWN ================= */}
      <Row gutter={[16, 16]} style={{ marginBottom: 12 }} align="middle">
        <Col xs={24} sm={6}>
          <Select
            value={statsPeriod}
            onChange={setStatsPeriod}
            style={{ width: "100%" }}
          >
            <Option value="today">Today</Option>
            <Option value="weekly">Weekly</Option>
            <Option value="monthly">Monthly</Option>
            <Option value="yearly">Yearly</Option>
          </Select>
        </Col>
      </Row>


      {/* ================= STATS CARDS ================= */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statsCards.map((item, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card
              loading={statsLoading}
              style={{
                height: 140,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                textAlign: "center",
              }}
            >
              <Text>{item.title}</Text>

              <Title level={2} style={{ margin: 0 }}>
                {item.value}
              </Title>

              <Text style={{ minHeight: 22 }}>{item.sub || ""}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 16 }}
        items={[
          { key: "not_booked", label: `Not Booked (${dataSource.filter(d => d.status === "not_booked").length})` },
          { key: "booked", label: `Booked / Rescheduled (${dataSource.filter(d => d.status === "booked" || d.status === "rescheduled").length})`, },
          { key: "completed", label: `Completed (${dataSource.filter(d => d.status === "completed").length})` },
          {
            key: "pending",
            label: `Pending (${dataSource.filter(d => d.status === "pending").length})`
          },
          {
            key: "cancelled",
            label: `Cancelled (${dataSource.filter(d => d.status === "cancelled").length})`
          },

        ]}
      />

      {/* ================= FILTERS ================= */}
      <Card>
        <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 12 }}>

          <Col xs={24} md={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>

          <Col xs={12} md={4}>
            <Select
              placeholder="Select Counsellor"
              allowClear
              value={counsellorFilter}
              onChange={setCounsellorFilter}
              style={{ width: "100%" }}
            >
              {counsellorList.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={12} md={4}>
            <Select
              placeholder="Mode"
              allowClear
              onChange={setModeFilter}
              style={{ width: "100%" }}
            >
              <Option value="Online">Online</Option>
              <Option value="Offline">Offline</Option>
            </Select>
          </Col>

          <Col xs={12} md={4}>
            <Select
              placeholder="Status"
              allowClear
              onChange={setStatusFilter}
              style={{ width: "100%" }}
            >
              <Option value="not_booked">Not Booked</Option>
              <Option value="booked">Booked</Option>
              <Option value="completed">Completed</Option>
              <Option value="pending">Pending</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>

          <Col xs={12} md={4}>
            <DatePicker
              style={{ width: "100%" }}
              onChange={setDateFilter}
            />
          </Col>

        </Row>




        {/* ================= TABLE ================= */}
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="key"
          size="small"
          scroll={{ x: "max-content" }}
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
        />
      </Card>

      <CreateSessionModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => dispatch(fetchCounsellingBookings())}
        mode={modalMode}
        data={rescheduleData}
      />

      {notesModalOpen && (
        <Modal
          open={notesModalOpen}
          footer={null}
          onCancel={() => setNotesModalOpen(false)}
          centered
          width={1000}
          destroyOnClose
        >
          <SessionNotesModal
            session={selectedSession}
            onClose={() => setNotesModalOpen(false)}
            isViewMode={false} // false = add/edit mode
            hideSessionDetails={true}
            showStudentName={true}
          />
        </Modal>
      )}
    </div>
  );
};

export default SlotBooking;
