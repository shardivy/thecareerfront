import React, { useState, useEffect } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import { getAdvertisements , getAdvertisementStats} from "../../../adminSlices/advertisementSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const Advertisement = () => {
  const { token } = theme.useToken();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  const [pagination, setPagination] = useState({ current: 1, pageSize: 5, });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedAd, setSelectedAd] = useState(null);

  const dispatch = useDispatch();

  const { advertisementList = [], statsData={}, loading } = useSelector((state) => state.advertisement);

  useEffect(() => {
    dispatch(getAdvertisements());
    dispatch(getAdvertisementStats());
  }, []);

  const data = Array.isArray(advertisementList) ? advertisementList : [];

  /* ================= STATS ================= */
  const stats = [
    {
      title: "Total Ads",
      value: statsData?.total_ads || 0,
      icon: <PictureOutlined style={{ fontSize: 22, color: token.colorPrimary }} />,
    },
    {
      title: "Live Ads",
       value: statsData?.live_ads || 0,
      icon: <CheckCircleOutlined style={{ fontSize: 22, color: token.colorSuccess }} />,
    },
    {
      title: "Scheduled",
     value: statsData?.scheduled_ads || 0,
      icon: <ClockCircleOutlined style={{ fontSize: 22, color: token.colorWarning }} />,
    },
    {
    title: "Completed",
    value: statsData?.completed_ads || 0,
    icon: (<CheckCircleOutlined style={{fontSize: 22,color: "#722ed1", }}/>),
  },
  ];


  /* ================= FILTER ================= */
const filteredData = data.filter((item) => {
  const campaign = (item?.advertisement_name || "").toLowerCase();
  const advertiser = (item?.advertiser_name || "").toLowerCase();
  const searchText = search.toLowerCase();

  const matchesSearch =
    campaign.includes(searchText) ||
    advertiser.includes(searchText);

  const matchesStatus =
    !statusFilter ||
    item?.ad_status?.toLowerCase() === statusFilter.toLowerCase();

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
      width: 170,
      dataIndex: "advertisement_name",
      render: (text) => <Text strong>{text || "-"}</Text>,
    },

    {
      title: "Advertiser Info",
      render: (_, record) => (
        <div>
          <div>
            <Text strong>{record?.advertiser_name || "-"}</Text>
          </div>
          <div>
            {record?.contact_email || "-"}
          </div>
        </div>
      ),
    },

    {
      title: "Advertiser Mobile",
      dataIndex: "contact_mobile",
      render: (text) => text || "-"
    },

    {
      title: "Amount",
      dataIndex: "amount",
      render: (val) => `₹${val || 0}`,
    },

    {
      title: "Date",
      dataIndex: "ad_date",
      render: (date) => date || "-"
    },

    {
  title: "Status",
  dataIndex: "ad_status",
  render: (status) => {
    const safeStatus = (status || "scheduled").toLowerCase();

    const color =
      safeStatus === "active"
        ? "green"
        : safeStatus === "scheduled"
        ? "orange"
        : safeStatus === "completed"
        ? "green"
        : "red"; 

    return (
      <Tag color={color}>
        {safeStatus.toUpperCase()}
      </Tag>
    );
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
                ad_date: record.ad_date
                  ? dayjs(record.ad_date)
                  : null,
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
                ad_date: record.ad_date
                  ? dayjs(record.ad_date)
                  : null,
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
      {/* STATS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {stats.map((item, index) => (
          <Col
            xs={24}
            sm={12}
            md={12}
            lg={6}
            key={index}
            style={{ display: "flex" }}
          >
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                padding: "14px 16px",
                width: "100%",
                height: "100%",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)", // 👈 light shadow
              }}
              bodyStyle={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  height: "100%",
                }}
              >
                {/* LEFT SIDE */}
                <div>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#8c8c8c",
                      fontWeight: 500,
                    }}
                  >
                    {item.title}
                  </Text>

                  <Title
                    level={2}
                    style={{
                      margin: "6px 0 0 0",
                      fontWeight: 600,
                    }}
                  >
                    {item.value}
                  </Title>

                  {item.subText && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#a0a0a0",
                      }}
                    >
                      {item.subText}
                    </Text>
                  )}
                </div>

                {/* ICON */}
                <div
                  style={{
                    fontSize: 28,
                    opacity: 0.85,
                  }}
                >
                  {item.icon}
                </div>
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
              <Option value="live">Live</Option>
              <Option value="scheduled">Scheduled</Option>
              <Option value="completed">Completed</Option>
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
         mode={modalMode}
        loading={false}
        onSubmit={(values) => {
          const payload = {
            ...values,
            ad_date: values.ad_date?.format("YYYY-MM-DD"),
          };

          // console.log("FINAL PAYLOAD:", payload);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Advertisement;
