import React, { useState, useEffect } from "react";
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
  message,
  Empty,
  Modal,
  Tooltip,
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
  GlobalOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import UploadContentModal from "../modals/UploadContentModal";
import { useDispatch, useSelector } from "react-redux";
import { fetchContentList, fetchContentCount, deleteContent } from "../../../adminSlices/contentSlice";


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


  const dispatch = useDispatch();
  const { contentList, contentStats, loading } = useSelector(
    (state) => state.content
  );

  useEffect(() => {
    dispatch(fetchContentList());
    dispatch(fetchContentCount());
  }, [dispatch]);

  const dataSource = Array.isArray(contentList)
    ? contentList
    : [];

  const draftData = dataSource.filter((item) => item.is_draft);
  const publishedData = dataSource.filter((item) => !item.is_draft);

  const { token } = theme.useToken();

  const stats = [
    {
      title: "Total Content",
      value: contentStats?.total_content || 0,
      icon: <BookOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
    },
    {
      title: "Free Content",
      value: contentStats?.free_content || 0,
      subtitle: "Accessible to all users",
      icon: <UnlockOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
    },
    {
      title: "Premium Content",
      value: contentStats?.premium_content || 0,
      subtitle: "Paid package only",
      icon: <LockOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
    },
    {
      title: "Total Downloads",
      value: contentStats?.total_download || 0,
      icon: <DownloadOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
    },
    {
      title: "Drafts",
      value: contentStats?.draft_content || 0,
      subtitle: "Unsaved content",
      icon: <UnlockOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
    },
  ];

  // FILTERED DATA
  const baseData =
    activeTab === "drafts"
      ? draftData
      : publishedData;

  const filteredDataSource = baseData.filter((item) => {
    const matchesTab =
      activeTab === "all"
        ? true
        : activeTab === "study"
          ? item.category === "study_material"
          : activeTab === "tutorial"
            ? item.category === "tutorial"
            : activeTab === "guides"
              ? item.category === "guide"
              : activeTab === "drafts"
                ? true
                : true;

    const matchesSearch = Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesType = !typeFilter || item.type === typeFilter;
    const matchesAccess =
      !accessFilter ||
      (accessFilter === "Free" && item.free_content) ||
      (accessFilter === "Paid" && item.payment_required);
    const matchesDate = !dateFilter || dayjs(item.date).isSame(dayjs(dateFilter), "day");

    return matchesTab && matchesSearch && matchesCategory && matchesType && matchesAccess && matchesDate;
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
    Modal.confirm({
      title: "Delete Content",
      content: `Are you sure you want to delete "${record.title}" Content ?`,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",

      onOk: async () => {
        try {
          await dispatch(deleteContent(record.id)).unwrap();
          message.success("Content deleted successfully");
          dispatch(fetchContentCount());
        } catch (error) {
          message.error("Failed to delete content");
        }
      },
    });
  };

  const handleSaveContent = (data) => {
    if (drafts.find((d) => d.key === data.key)) {
      setDrafts((prev) => prev.filter((d) => d.key !== data.key));
    }

    if (data.key && dataSource.find((d) => d.key === data.key)) {
      setDataSource((prev) =>
        prev.map((item) =>
          item.key === data.key ? { ...item, ...data, date: dayjs().format("YYYY-MM-DD") } : item
        )
      );
    } else {
      const newRecord = {
        ...data,
        key: data.key || Date.now(),
        downloads: 0,
        date: dayjs().format("YYYY-MM-DD"),
      };
      setDataSource((prev) => [newRecord, ...prev]);
    }

    setIsUploadModalOpen(false);
    setEditRecord(null);
    setViewMode(false);
  };

  // const handleSaveDraft = (values) => {
  //   setDrafts((prev) => {
  //     if (values.key && prev.find((d) => d.key === values.key)) {
  //       return prev.map((d) => (d.key === values.key ? { ...d, ...values } : d));
  //     }
  //     return [...prev, { ...values, key: values.key || Date.now() }];
  //   });
  // };


  const handleSaveDraft = (values) => {
    if (viewMode) return;
    if (editRecord) return;

    setDrafts((prev) => {
      if (values.key && prev.find((d) => d.key === values.key)) {
        return prev.map((d) =>
          d.key === values.key ? { ...d, ...values } : d
        );
      }

      return [
        ...prev,
        { ...values, key: values.key || Date.now() },
      ];
    });

    // message.success("Draft saved successfully");
  };

  const getProgramDisplay = (program_details) => {
  if (!program_details || program_details.length === 0) {
    return <Tag color="default">-</Tag>;
  }

  // Single Program
  if (program_details.length === 1) {
    return <Tag color="blue">{program_details[0].name}</Tag>;
  }

  // Multiple Selected Programs
  return (
    <Tooltip title={program_details.map((p) => p.name).join(", ")}>
      <Tag color="green">
        {program_details.length} Programs Selected
      </Tag>
    </Tooltip>
  );
};


  // Helper function to get program display
  // const getProgramDisplay = (program_details) => {
  //   if (!program_details) {
  //     return <Tag color="default">-</Tag>;
  //   }

  //   if (program_details.length === 0) {
  //     return <Tag color="default">-</Tag>;
  //   }

  //   if (program_details.length === 1) {
  //     return <Tag color="blue">{program_details[0].name}</Tag>;
  //   }


  //   return (
  //     <Tooltip title={program_details.map(p => p.name).join(", ")}>
  //       <Tag color="green">All Programs</Tag>
  //     </Tooltip>
  //   );
  // };


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
        type === "pdf" ? (
          <Tag icon={<FilePdfOutlined />} color="error">
            PDF
          </Tag>
        ) : (
          <Tag icon={<VideoCameraOutlined />} color="purple">
            Video
          </Tag>
        ),
    },
    {
      title: "Category",
      dataIndex: "category",
      render: (value) => {
        if (!value) return "-";

        return value
          .replace(/_/g, " ")
          .replace(/\b\w/g, char => char.toUpperCase());
      },
    },
    {
      title: "Program",
      key: "program",
      render: (_, record) => getProgramDisplay(record.program_details),
    },
    {
      title: "Access",
      render: (_, record) =>
        record.free_content ? (
          <Tag icon={<UnlockOutlined />} color="success">
            Free
          </Tag>
        ) : record.payment_required ? (
          <Tag icon={<LockOutlined />} color="warning">
            Paid
          </Tag>
        ) : (
          "-"
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
      dataIndex: "download_count",
      render: (count) => (
        <Space>
          <DownloadOutlined />
          {count || 0}
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

          <Button type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>

          <Button
            type="default"
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
        loading={loading}
        items={[
          { key: "all", label: "All Content" },
          { key: "study", label: "Study Material" },
          { key: "tutorial", label: "Tutorial" },
          { key: "guides", label: "Guides" },
          { key: "drafts", label: `Drafts (${draftData.length})` }
        ]}
      />

      {/* TABLE */}
      <Card bordered={false} style={{ borderRadius: token.borderRadius }}>
        <Title level={5}>{activeTab === "drafts" ? "Drafts" : "All Content"}</Title>

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
              <Option value="study_material">Study Material</Option>
              <Option value="tutorial">Tutorial</Option>
              <Option value="guide">Guide</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              allowClear
              placeholder="Type"
              style={{ width: "100%" }}
              onChange={setTypeFilter}
            >
              <Option value="pdf">PDF</Option>
              <Option value="video">Video</Option>
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
          rowKey="id"
          pagination={{ pageSize: 5 }}
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No Content Available"
              />
            ),
          }}

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
        onSaveDraft={handleSaveDraft}
      />
    </div>
  );
};

export default ContentManagement;
