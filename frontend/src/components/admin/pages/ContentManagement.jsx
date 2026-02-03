import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Tabs,
  Table,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  theme,
  Popconfirm,
  message,
} from "antd";
import {
  PlusOutlined,
  BookOutlined,
  LockOutlined,
  UnlockOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilePdfOutlined,
  VideoCameraOutlined,
  SearchOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import UploadContentModal from "../modals/UploadContentModal";

const { Title, Text } = Typography;
const { Option } = Select;

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [accessFilter, setAccessFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  const [dataSource, setDataSource] = useState([
    {
      key: 1,
      title: "Engineering Entrance Exam Guide 2026",
      type: "PDF",
      category: "Study Material",
      program: "Engineering Career Path",
      access: "Free",
      downloads: 234,
      date: "2025-12-15",
    },
    {
      key: 2,
      title: "Career Assessment Video Tutorial",
      type: "Video",
      category: "Tutorial",
      program: "Career Assessment",
      access: "Paid",
      downloads: 45,
      date: "2026-01-05",
    },
    {
      key: 3,
      title: "Guide to Coding Interviews",
      type: "PDF",
      category: "Guide",
      program: "Career Prep",
      access: "Free",
      downloads: 150,
      date: "2026-01-10",
    },
  ]);

  const { token } = theme.useToken();

  // STATS
  const stats = [
    {
      title: "Total Content",
      value: dataSource.length,
      icon: <BookOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
    },
    {
      title: "Free Content",
      value: dataSource.filter((i) => i.access === "Free").length,
      subtitle: "Accessible to all users",
      icon: <UnlockOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
    },
    {
      title: "Premium Content",
      value: dataSource.filter((i) => i.access === "Paid").length,
      subtitle: "Paid package only",
      icon: <LockOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
    },
    {
      title: "Total Downloads",
      value: dataSource.reduce((sum, i) => sum + i.downloads, 0),
      icon: <DownloadOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
    },
  ];

  // FILTERED DATA BASED ON TAB + SEARCH + OTHER FILTERS
  const filteredDataSource = dataSource.filter((item) => {
    const matchesTab =
      activeTab === "all"
        ? true
        : activeTab === "study"
        ? item.category === "Study Material"
        : activeTab === "videos"
        ? item.type === "Video"
        : activeTab === "guides"
        ? item.category === "Guide"
        : true;

    const matchesSearch = Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesType = !typeFilter || item.type === typeFilter;
    const matchesAccess = !accessFilter || item.access === accessFilter;
    const matchesDate =
      !dateFilter || dayjs(item.date).isSame(dayjs(dateFilter), "day");

    return (
      matchesTab &&
      matchesSearch &&
      matchesCategory &&
      matchesType &&
      matchesAccess &&
      matchesDate
    );
  });

  // HANDLERS
  const handleEdit = (record) => {
    setEditRecord(record);
    setIsUploadModalOpen(true);
    setViewMode(false);
  };

  const handleView = (record) => {
    setEditRecord(record);
    setIsUploadModalOpen(true);
    setViewMode(true);
  };

  const handleDelete = (record) => {
    setDataSource((prev) => prev.filter((i) => i.key !== record.key));
    message.success(`Deleted: ${record.title}`);
  };

  const handleSaveContent = (data) => {
    if (data.key) {
      // Edit
      setDataSource((prev) =>
        prev.map((item) =>
          item.key === data.key
            ? { ...item, ...data, date: dayjs().format("YYYY-MM-DD") }
            : item
        )
      );
    } else {
      // Add
      const newRecord = {
        ...data,
        key: Date.now(),
        downloads: 0,
        date: dayjs().format("YYYY-MM-DD"),
      };
      setDataSource((prev) => [newRecord, ...prev]);
    }
    setIsUploadModalOpen(false);
    setEditRecord(null);
    setViewMode(false);
  };

  // TABLE COLUMNS
  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (type) =>
        type === "PDF" ? (
          <Tag icon={<FilePdfOutlined />} color="error">
            PDF
          </Tag>
        ) : (
          <Tag icon={<VideoCameraOutlined />} color="purple">
            Video
          </Tag>
        ),
    },
    { title: "Category", dataIndex: "category" },
    { title: "Program", dataIndex: "program" },
    {
      title: "Access",
      dataIndex: "access",
      render: (access) =>
        access === "Free" ? (
          <Tag icon={<UnlockOutlined />} color="success">
            Free
          </Tag>
        ) : (
          <Tag icon={<LockOutlined />} color="warning">
            Paid
          </Tag>
        ),
    },
    {
      title: "Uploaded Date",
      dataIndex: "date",
      render: (date) => (
        <Space>
          <CalendarOutlined />
          {dayjs(date).format("YYYY-MM-DD")}
        </Space>
      ),
    },
    {
      title: "Downloads",
      dataIndex: "downloads",
      render: (d) => (
        <Space>
          <DownloadOutlined />
          {d}
        </Space>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button type="" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            View
          </Button>

          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>

          <Popconfirm
            title="Delete Content"
            description="Are you sure you want to delete this content?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>Content Management</Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditRecord(null);
              setIsUploadModalOpen(true);
              setViewMode(false);
            }}
          >
            Upload Content
          </Button>
        </Col>
      </Row>

      {/* STATS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((item, index) => (
          <Col xs={24} sm={12} md={12} lg={6} key={index}>
            <Card
              bordered={false}
              style={{
                height: 140,
                borderRadius: token.borderRadius,
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
                  <Text style={{ color: token.colorTextSecondary, fontSize: 17 }}>
                    {item.title}
                  </Text>
                  <Title level={3} style={{ margin: "6px 0" }}>
                    {item.value}
                  </Title>
                  {item.subtitle && (
                    <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                      {item.subtitle}
                    </Text>
                  )}
                </div>
                <div style={{ fontSize: 28 }}>{item.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* TABS */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "all", label: "All Content" },
          { key: "study", label: "Study Material" },
          { key: "videos", label: "Videos" },
          { key: "guides", label: "Guides" },
        ]}
      />

      {/* TABLE */}
      <Card bordered={false} style={{ borderRadius: token.borderRadius }}>
        <Title level={5}>All Content</Title>

        {/* SEARCH & FILTER */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search content..."
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              allowClear
              placeholder="Category"
              style={{ width: "100%" }}
              onChange={setCategoryFilter}
            >
              <Option value="Study Material">Study Material</Option>
              <Option value="Tutorial">Tutorial</Option>
              <Option value="Guide">Guide</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              allowClear
              placeholder="Type"
              style={{ width: "100%" }}
              onChange={setTypeFilter}
            >
              <Option value="PDF">PDF</Option>
              <Option value="Video">Video</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              allowClear
              placeholder="Access"
              style={{ width: "100%" }}
              onChange={setAccessFilter}
            >
              <Option value="Free">Free</Option>
              <Option value="Paid">Paid</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <DatePicker
              allowClear
              style={{ width: "100%" }}
              placeholder="Filter by Date"
              onChange={(date) => setDateFilter(date)}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredDataSource}
          rowKey="key"
          pagination={{ pageSize: 5 }}
          scroll={{ x: "max-content" }}
        />
      </Card>

      {/* MODAL */}
      <UploadContentModal
        open={isUploadModalOpen}
        initialValues={editRecord}
        viewMode={viewMode}
        onCancel={() => {
          setIsUploadModalOpen(false);
          setEditRecord(null);
          setViewMode(false);
        }}
        onSubmit={handleSaveContent}
      />
    </div>
  );
};

export default ContentManagement;
