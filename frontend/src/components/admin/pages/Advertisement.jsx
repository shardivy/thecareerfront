import React, { useState } from "react";
import dayjs from "dayjs";
import {
  Row,
  Col,
  Card,
  Typography,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  theme,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  PictureOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BellOutlined,
} from "@ant-design/icons";
import AddAdvertisementModal from "../modals/AddAdvertisementModal";

const { Title, Text } = Typography;
const { Option } = Select;

const Advertisement = () => {
  const { token } = theme.useToken();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedAd, setSelectedAd] = useState(null);

  /* ================= STATS ================= */
  const stats = [
    {
      title: "Total Ads",
      value: 18,
      icon: <PictureOutlined style={{ fontSize: 22, color: token.colorPrimary }} />,
    },
    {
      title: "Active Ads",
      value: 10,
      icon: <CheckCircleOutlined style={{ fontSize: 22, color: token.colorSuccess }} />,
    },
    {
      title: "Scheduled",
      value: 5,
      icon: <ClockCircleOutlined style={{ fontSize: 22, color: token.colorWarning }} />,
    },
    {
      title: "Notifications",
      value: 2400,
      icon: <BellOutlined style={{ fontSize: 22, color: token.colorError }} />,
    },
  ];

  /* ================= DATA ================= */
  const data = [
    {
      id: 1,
      campaignName: "Summer Course Banner",
      advertiserName: "ABC Pvt Ltd",
      advertiserEmail: "abc@gmail.com",
      mobile: "9876543210",
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      amount: 5000,
      status: "active",
    },
    {
      id: 2,
      campaignName: "Scholarship Popup",
      advertiserName: "XYZ Ltd",
      advertiserEmail: "xyz@gmail.com",
      mobile: "9123456780",
      startDate: "2026-04-10",
      endDate: "2026-05-10",
      amount: 8000,
      status: "scheduled",
    },
  ];

  /* ================= FILTER ================= */
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.campaignName.toLowerCase().includes(search.toLowerCase()) ||
      item.advertiserName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  /* ================= COLUMNS ================= */
  const columns = [
    {
      title: "Sr No",
      width: 80,
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
   {
  title: "Advertisement / Campaign Name",
  dataIndex: "campaignName",
  render: (text) => <Text strong>{text}</Text>,
},
   {
  title: "Advertiser Info",
  render: (_, record) => (
    <div>
      <div>
        <Text strong>{record.advertiserName}</Text>
      </div>
      <div>
        {record.advertiserEmail}
      </div>
    </div>
  ),
},
    {
      title: "Advertiser Mobile",
      dataIndex: "mobile",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (val) => `₹${val}`,
    },
   {
  title: "Start Date",
  dataIndex: "startDate",
  render: (date) => <span>{date}</span>,
},
{
  title: "End Date",
  dataIndex: "endDate",
  render: (date) => <span>{date}</span>,
},
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const color =
          status === "active"
            ? "green"
            : status === "scheduled"
            ? "orange"
            : "red";

        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedAd({
                ...record,
                startDate: record.startDate ? dayjs(record.startDate) : null,
                endDate: record.endDate ? dayjs(record.endDate) : null,
              });
              setModalMode("view");
              setIsModalOpen(true);
            }}
          >
            View
          </Button>

          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedAd({
                ...record,
                startDate: record.startDate ? dayjs(record.startDate) : null,
                endDate: record.endDate ? dayjs(record.endDate) : null,
              });
              setModalMode("edit");
              setIsModalOpen(true);
            }}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={3}>Advertisement Management</Title>
        </Col>

        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedAd(null);
              setModalMode("add");
              setIsModalOpen(true);
            }}
          >
            Add Advertisement
          </Button>
        </Col>
      </Row>

      {/* STATS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {stats.map((item, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card style={{ borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <Text>{item.title}</Text>
                  <Title level={3} style={{ margin: 0 }}>
                    {item.value}
                  </Title>
                </div>
                <div>{item.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* TABLE */}
      <Card>
        {/* FILTER */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12}>
            <Input
              placeholder="Search campaign or advertiser..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              allowClear
              placeholder="Filter status"
              style={{ width: "100%" }}
              onChange={(val) => setStatusFilter(val)}
            >
              <Option value="active">Active</Option>
              <Option value="scheduled">Scheduled</Option>
              <Option value="expired">Expired</Option>
            </Select>
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50"],
          }}
          onChange={(pag) => setPagination(pag)}
          scroll={{ x: "max-content" }}
        />
      </Card>

      <AddAdvertisementModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        initialValues={selectedAd}
        loading={false}
        onSubmit={(values) => {
          const payload = {
            ...values,
            startDate: values.startDate?.format("YYYY-MM-DD"),
            endDate: values.endDate?.format("YYYY-MM-DD"),
          };

          console.log("FINAL PAYLOAD:", payload);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Advertisement;