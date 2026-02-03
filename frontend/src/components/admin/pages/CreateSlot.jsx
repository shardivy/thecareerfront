import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  Tag,
  Typography,
  message,
  Popconfirm,
  Space,
  Button,
  Input,
  DatePicker,
  Row,
  Col,
  Select,
  Spin,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import CreateSlotModal from "../modals/CreateSlotModal";
import {
  createCounsellingSlot,
  fetchCounsellingSlots,
  deleteCounsellingSlot,
  updateCounsellingSlot
} from "../../../adminSlices/counsellingSlotSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const CreateSlot = () => {
  const dispatch = useDispatch();

  const { list: slots, loading ,error} = useSelector(
    (state) => state.counsellingSlots
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [searchText, setSearchText] = useState("");
  const [filterDate, setFilterDate] = useState(null);
  const [filterMode, setFilterMode] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    dispatch(fetchCounsellingSlots());
  }, [dispatch]);

const handleSubmit = (values) => {
  const payload = {
    lead_counsellor: values.lead_counsellor,
    normal_counsellor: values.normalCounsellor || null,
    date: values.date ? dayjs(values.date).format("YYYY-MM-DD") : null,
    start_time: values.start_time
      ? dayjs(values.start_time).format("hh:mm A")
      : null,
    mode: values.mode,
    duration_minutes: values.duration,
  };

  const action =
    modalMode === "edit"
      ? updateCounsellingSlot({ id: editingSlot.id, payload }) // ✅ UPDATE
      : createCounsellingSlot(payload);                         // ✅ CREATE

  dispatch(action)
    .unwrap()
    .then(() => {
      message.success(
        modalMode === "edit"
          ? "Slot updated successfully"
          : "Slot created successfully"
      );
      setModalOpen(false);
      setEditingSlot(null);
      setModalMode("create");
      dispatch(fetchCounsellingSlots());
    })
    .catch((err) => {
      message.error(err || "Operation failed");
    });
};
  const handleDelete = (id) => {
    dispatch(deleteCounsellingSlot(id))
      .unwrap()
      .then(() => message.success("Slot deleted successfully"))
      .catch(() => message.error("Failed to delete slot"));
  };

  // Filter logic
  const filteredSlots = slots.filter((slot) => {
    const search = searchText.toLowerCase();

    const counsellorMatch =
      slot.counsellors?.some((c) =>
        c.name.toLowerCase().includes(search)
      ) || false;

    const matchesOther =
      slot.date?.includes(search) ||
      slot.start_time?.includes(search) ||
      slot.mode?.includes(search);

    const matchesDate = filterDate
      ? slot.date === dayjs(filterDate).format("YYYY-MM-DD")
      : true;

    const matchesMode = filterMode ? slot.mode === filterMode : true;

    return (counsellorMatch || matchesOther) && matchesDate && matchesMode;
  });

  // Table columns
const columns = [
 {
    title: "Sr. No.",
    render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    width: 70,
  },
  {
    title: "Counsellors",
    render: (_, record) =>
      record.counsellors?.length ? (
        record.counsellors.map((c, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            <Text strong>{c.name}</Text>
            <br />
            <Tag color={c.type === "lead" ? "blue" : "default"}>
              {c.type === "lead" ? "Lead" : "Normal"}
            </Tag>
          </div>
        ))
      ) : (
        <Text type="secondary">Not assigned</Text>
      ),
  },
  {
    title: "Date",
    dataIndex: "date",
    key: "date",
  },
  {
    title: "Start Time",
    dataIndex: "start_time",
    key: "start_time",
  },
  {
    title: "Duration (mins)",
    dataIndex: "duration_minutes",
    key: "duration_minutes",
  },
  {
    title: "Mode",
    dataIndex: "mode",
    render: (m) => <Tag>{m}</Tag>,
  },
  {
    title: "Actions",
    render: (_, record) => (
      <Space wrap>
        <Button
          icon={<EyeOutlined />}
          size="large"
          onClick={() => {
            setEditingSlot(record);
            setModalMode("view");
            setModalOpen(true);
          }}
        >
          View
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          size="large"
          onClick={() => {
            setEditingSlot(record);
            setModalMode("edit");
            setModalOpen(true);
          }}
        >
          Edit
        </Button>
        <Popconfirm
          title="Delete this slot?"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button danger icon={<DeleteOutlined />} size="large">
            Delete
          </Button>
        </Popconfirm>
      </Space>
    ),
  },
];


  return (
    <div style={{ padding: 16 }}>
      <Row
        justify="space-between"
        align="middle"
        gutter={[8, 8]}
        style={{ marginBottom: 16 }}
      >
        <Col xs={24} sm={12}>
          <Title level={4}>Manage Counselling Slots</Title>
        </Col>
        <Col xs={24} sm={12} style={{ textAlign: "right" }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingSlot(null);
              setModalMode("create");
              setModalOpen(true);
            }}
          >
            Create Slot
          </Button>
        </Col>
      </Row>

      <Card>
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Select
              placeholder="Filter by mode"
              allowClear
              style={{ width: "100%" }}
              value={filterMode}
              onChange={setFilterMode}
            >
              <Option value="online">Online</Option>
              <Option value="offline">Offline</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={6}>
            <DatePicker
              placeholder="Filter by date"
              style={{ width: "100%" }}
              value={filterDate}
              onChange={setFilterDate}
            />
          </Col>
        </Row>

        {/* Table with loader overlay */}
        <Spin spinning={loading} tip="Loading slots...">
<Table
  columns={columns}
  dataSource={filteredSlots}
  rowKey="id"
  pagination={{
    current: currentPage,
    pageSize: pageSize,
    onChange: (page, size) => {
      setCurrentPage(page);
      setPageSize(size);
    },
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20"],
  }}
  scroll={{ x: "max-content" }}
  loading={loading}
  locale={{ emptyText: error ? `Error: ${error}` : "No slots found" }}
/>



        </Spin>
      </Card>

      <CreateSlotModal
        open={modalOpen}
        editingSlot={editingSlot}
        mode={modalMode}
        onCancel={() => {
          setModalOpen(false);
          setEditingSlot(null);
          setModalMode("create");
        }}
        onCreate={handleSubmit}
      />
    </div>
  );
};

export default CreateSlot;
