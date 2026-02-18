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
  Modal ,
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

} from "@ant-design/icons";
import dayjs from "dayjs";
import CreateSessionModal from "../modals/CreateSessionModal";
import {
  fetchCounsellingBookings,
  fetchCounsellingSessionCount,
  deleteCounsellingBooking,
} from "../../../adminSlices/counsellingBookingSlice";
import { fetchLeadCounsellors } from "../../../adminSlices/counsellorSlice";


const { Title, Text } = Typography;
const { Option } = Select;

const SlotBooking = () => {
  const dispatch = useDispatch();
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

  const [statsPeriod, setStatsPeriod] = useState("today"); // default period

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [rescheduleData, setRescheduleData] = useState(null);
  const [counsellorFilter, setCounsellorFilter] = useState(null);



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
    title: `${statsPeriod.charAt(0).toUpperCase() + statsPeriod.slice(1)} Sessions`,
    value: stats?.period_sessions ?? 0,
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
      studentName: `${item.student?.first_name || ""} ${
        item.student?.last_name || ""
      }`,
      email: item.student?.email || "—",
     counsellorDisplay: Array.isArray(item.counsellors)
  ? item.counsellors.map((c) => ({
      id: c.counsellor.id,   // ✅ ADD ID
      name: `${c.counsellor.first_name} ${c.counsellor.last_name}`,
      type: c.role,
    }))
  : [],

      time: item.slot
        ? `${item.slot.start_time} - ${item.slot.end_time}`
        : "—",
      modeLabel: item.slot?.mode
        ? item.slot.mode.charAt(0).toUpperCase() + item.slot.mode.slice(1)
        : "—",
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
    const statusMatch = !statusFilter || item.status === statusFilter;
    const dateMatch = !dateFilter || dayjs(item.date).isSame(dateFilter, "day");
  const counsellorMatch =
  !counsellorFilter ||
  item.counsellorDisplay.some(
    (c) => c.id === counsellorFilter
  );


    return (
      text.includes(searchText.toLowerCase()) &&
      modeMatch &&
      statusMatch &&
      dateMatch &&
      counsellorMatch
    );
  })
  .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));


  /* ================= DELETE HANDLER ================= */
const handleDelete = (record) => {
  Modal.confirm({
    title: "Delete Booking?",
    content: `Are you sure you want to delete session for ${record.studentName}?`,
    okText: "Yes, Delete",
    okType: "danger",
    cancelText: "Cancel",
    centered: true,

    onOk: () => {
      return dispatch(deleteCounsellingBooking(record.id))
        .unwrap()
        .then(() => {
          // Optional: refetch (not required because we already filter in slice)
          dispatch(fetchCounsellingBookings());
        });
    },
  });
};



  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      title: "Sr.",
      width: 60,
      render: (_, __, i) => i + 1,
    },
    {
      title: "User Name",
      width: 200,
      render: (_, r) => (
        <>
          <Text strong>{r.studentName}</Text>
          <br />
          <Text type="colorTextSecondary">{r.email}</Text>
        </>
      ),
    },
    {
      title: "Counsellors",
      render: (_, r) =>
        r.counsellorDisplay.length ? (
          r.counsellorDisplay.map((c, i) => (
            <div key={i}>
              <Text strong>{c.name}</Text>
              <br />
              <Tag color={c.type === "lead" ? "blue" : "green"}>{c.type}</Tag>
            </div>
          ))
        ) : (
          <Text type="colorTextSsecondary">—</Text>
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
      title: "Mode",
      dataIndex: "modeLabel",
      width: 100,
      render: (m) => <Tag>{m}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 110,
      render: (s) => <Tag>{s}</Tag>,
    },
    {
      title: "Actions",
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="large"
            icon={<EyeOutlined />}
            onClick={() => {
              setRescheduleData(record);
              setModalMode("view");
              setIsModalOpen(true);
            }}
          >
            View
          </Button>
          <Button
            size="large"
            icon={<EditOutlined />}
            type="primary"
            onClick={() => {
              setRescheduleData(record);
              setModalMode("edit");
              setIsModalOpen(true);
            }}
          >
            Edit
          </Button>
         <Button
  size="large"
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

      {/* ================= FILTERS ================= */}
      <Card>
        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
          <Col xs={24} md={10}>
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
              <Option value="booked">Booked</Option>
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <DatePicker style={{ width: "100%" }} onChange={setDateFilter} />
          </Col>
        </Row>

        {/* ================= TABLE ================= */}
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="key"
          size="small"
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <CreateSessionModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => dispatch(fetchCounsellingBookings())}
        mode={modalMode}
        data={rescheduleData}
      />
    </div>
  );
};

export default SlotBooking;
