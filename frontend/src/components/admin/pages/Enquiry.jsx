import React, { useState, useEffect  } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Tag,
  Button,
  Typography,
  Card,
  Space,
  Input,
  Select,
  Row,
  Col,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import adminTheme from "../../../theme/adminTheme";
import { EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import AddEnquiryModal from "../modals/AddEnquiryModal";
import { fetchEnquiries } from "../../../adminSlices/enquiryListSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const Enquiry = () => {

  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((state) => state.enquiryList);



    useEffect(() => {
      dispatch(fetchEnquiries());  
    }, [dispatch]);

    // Use dynamic list from Redux instead of static data
    const enquiriesData = Array.isArray(list) ? list : [];

  // Source color mapping - handles different case variations
  const getSourceColor = (source) => {
    const normalized = source.toLowerCase().replace(/\s+/g, "");
    const colorMap = {
      "website": adminTheme.token.colorPrimary,
      "whatsapp": adminTheme.token.colorSuccess,
      "call": adminTheme.token.colorWarning,
      "walkin": adminTheme.token.colorInfo,
    };
    return colorMap[normalized] || adminTheme.token.colorPrimary;
  };

  // Status color mapping
  const getStatusColor = (status) => {
    const normalized = status.toLowerCase();
    if (normalized === "converted") {
      return adminTheme.token.colorSuccess;
    } else if (normalized === "contacted") {
      return adminTheme.token.colorWarning;
    }
    return adminTheme.token.colorPrimary;
  };

  // Old color map (keeping for reference)
  const sourceColorMap = {
    Website: adminTheme.token.colorPrimary,
    WhatsApp: adminTheme.token.colorSuccess,
    Call: adminTheme.token.colorWarning,
    "Walk-In": adminTheme.token.colorInfo,
  };

  // ---------------- STATES ----------------
  const [searchText, setSearchText] = useState("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [sourceFilter, setSourceFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // 🔥 NEW STATES (FOR CONVERT)
  const [modalMode, setModalMode] = useState("add"); // add | convert
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // ---------------- FILTER LOGIC ----------------
  const filteredEnquiries = enquiriesData.filter((enquiry) => {
    const matchesSearch =
      enquiry.name.toLowerCase().includes(searchText.toLowerCase()) ||
      enquiry.program.toLowerCase().includes(searchText.toLowerCase()) ||
      enquiry.source.toLowerCase().includes(searchText.toLowerCase()) ||
      enquiry.email.toLowerCase().includes(searchText.toLowerCase()) ||
      enquiry.phone.includes(searchText);

    const matchesStatus = statusFilter
      ? enquiry.status.toLowerCase() === statusFilter.toLowerCase()
      : true;

    const matchesSource = sourceFilter
      ? enquiry.source.toLowerCase() === sourceFilter.toLowerCase()
      : true;

    const matchesDate = dateFilter && enquiry.date !== "N/A"
      ? dayjs(enquiry.date).isSame(dateFilter, "day")
      : !dateFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesSource &&
      matchesDate
    );
  });

  // ---------------- TABLE COLUMNS ----------------
  const columns = [
     {
    title: "Sr. No",
    key: "srno",
    render: (_, __, index) => (currentPage - 1) * pageSize + index + 1, // Page-aware serial number
    responsive: ["xs", "sm", "md", "lg", "xl"],
  },
{
  title: "User Name",
  dataIndex: "name",
  key: "name",
  render: (text, record) => (
    <>
      <Text strong style={{ color: adminTheme.token.colorTextBase }}>
        {text}
      </Text>
      <br />
      <Text type="colorTextSecondary">{record.email}</Text>
    </>
  ),
},
    {
      title: "Mobile Number",
      key: "contact",
      render: (_, record) => (
        <div>
          <Text>{record.phone}</Text>
          </div>
      ),
    },
    {
      title: "Program of Interest",
      dataIndex: "program",
      key: "program",
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (text) => (
        <Tag color={getSourceColor(text)}>{text}</Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
{
  title: "Action",
  key: "action",
  render: (_, record) => {
    const isConverted = record.status.toLowerCase() === "converted";

    return (
      <Space>
        {/* Convert Button */}
        <Button
          type="primary"
          style={{
            borderRadius: adminTheme.token.borderRadius,
            backgroundColor: adminTheme.token.disabledBg,
          }}
          onClick={() => {
            setModalMode("convert");
            setSelectedEnquiry(record);
            setOpenAddModal(true);
          }}
          disabled={isConverted} // Disable if already converted
        >
          {isConverted ? "Converted" : "Convert to User"}
        </Button>

        {/* Only show Edit button if not converted */}
        {!isConverted && (
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => {
              setModalMode("edit"); // edit mode
              setSelectedEnquiry(record);
              setOpenAddModal(true);
            }}
          >
            Edit
          </Button>
        )}
      </Space>
    );
  },
}

  ];

  // ---------------- JSX ----------------
  return (
    <div style={{ padding: 1 }}>
      {/* Header */}
      <Row justify="space-between" align="middle">
        <Col>
          <Space direction="vertical" size={0}>
            <Title level={3} style={{ marginBottom: 0 }}>
              Enquiry & Leads
            </Title>
          </Space>
        </Col>

        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{
              borderRadius: adminTheme.token.borderRadius,
              backgroundColor: adminTheme.token.colorPrimary,
            }}
            onClick={() => {
              setModalMode("add");
              setSelectedEnquiry(null);
              setOpenAddModal(true);
            }}
          >
            Add Enquiry
          </Button>
        </Col>
      </Row>

      {/* Filters */}
      <Card
        style={{
          marginTop:30,
          borderRadius: adminTheme.token.borderRadius,
          boxShadow: adminTheme.token.boxShadow,
        }}
      >
      <Row gutter={[16, 16]} align="middle">
  {/* Search - LEFT */}
  <Col xs={24} sm={24} md={10}>
    <Input
      prefix={
        <SearchOutlined
          style={{ color: adminTheme.token.colorTextSecondary }}
        />
      }
      placeholder="Search..."
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      allowClear
       />
  </Col>

  {/* Status Filter */}
  <Col xs={24} sm={8} md={4}>
    <Select
      placeholder="Status"
      value={statusFilter}
      onChange={setStatusFilter}
      allowClear
      style={{ width: "100%" }}
    >
      <Option value="New">New</Option>
      <Option value="Contacted">Contacted</Option>
      <Option value="Converted">Converted</Option>
    </Select>
  </Col>

  {/* Source Filter */}
  <Col xs={24} sm={8} md={4}>
    <Select
      placeholder="Source"
      value={sourceFilter}
      onChange={setSourceFilter}
      allowClear
      style={{ width: "100%" }}
    >
      <Option value="Website">Website</Option>
      <Option value="WhatsApp">WhatsApp</Option>
      <Option value="Call">Call</Option>
      <Option value="Walk-In">Walk-In</Option>
    </Select>
  </Col>

  {/* Date Filter */}
  <Col xs={24} sm={8} md={4}>
    <DatePicker
      placeholder="Filter by Date"
      value={dateFilter}
      onChange={(date) => setDateFilter(date)}
      style={{ width: "100%" }}
      allowClear
    />
  </Col>
</Row>


        {/* Table */}
        <Table
          style={{ marginTop: 16 }}
          columns={columns}
          dataSource={filteredEnquiries}
          pagination={{ 
            pageSize: pageSize,
            current: currentPage,
            onChange: (page) => setCurrentPage(page),
          }}
          rowClassName={() => "enquiry-row"}
          scroll={{ x: "max-content" }}
          loading={loading}
          locale={{ emptyText: error ? `Error: ${error}` : "No enquiries found" }}
        />
      </Card>

      {/* Hover Effect (UNCHANGED) */}
      {/* <style jsx>{`
        .enquiry-row:hover {
          background-color: ${adminTheme.components.Table.rowHoverBg};
        }
      `}</style> */}

      {/* SAME MODAL FOR ADD + CONVERT */}
   <AddEnquiryModal
  open={openAddModal}
  onCancel={() => setOpenAddModal(false)}
  mode={modalMode}
  enquiryData={selectedEnquiry}
  readonly={modalMode === "convert"} // READONLY WHEN CONVERTING
/>

    </div>
  );
};

export default Enquiry;
