import React, { useState, useEffect } from "react";
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
  Modal,
  message,
} from "antd";
import dayjs from "dayjs";
import adminTheme from "../../../theme/adminTheme";
import { EditOutlined, PlusOutlined, SearchOutlined, DeleteOutlined, DownOutlined } from "@ant-design/icons";
import { deleteEnquiry } from "../../../adminSlices/updateEnquirySlice";
import AddEnquiryModal from "../modals/AddEnquiryModal";
import { fetchEnquiries } from "../../../adminSlices/enquiryListSlice";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ConvertHHUserModal from "../modals/ConvertHHUserModal";


const { Title, Text } = Typography;
const { Option } = Select;

const Enquiry = () => {

  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((state) => state.enquiryList);
  const role = localStorage.getItem("adminRole") || "";



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
  const [pageSize, setPageSize] = useState(5);


  // 🔥 NEW STATES (FOR CONVERT)
  const [modalMode, setModalMode] = useState("add"); // add | convert
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [openHHModal, setOpenHHModal] = useState(false);

  // ---------------- FILTER LOGIC ----------------
  const filteredEnquiries = enquiriesData.filter((enquiry) => {
    const search = searchText.toLowerCase();

    const programText = Array.isArray(enquiry.program_detail)
      ? enquiry.program_detail.map((p) => p.name).join(" ").toLowerCase()
      : Array.isArray(enquiry.program)
      ? enquiry.program.join(" ").toLowerCase()
      : typeof enquiry.program === "string"
      ? enquiry.program.toLowerCase()
      : "";

    const matchesSearch =
      (enquiry.name?.toLowerCase() || "").includes(search) ||
      programText.includes(search) ||
      (enquiry.source?.toLowerCase() || "").includes(search) ||
      (enquiry.email?.toLowerCase() || "").includes(search) ||
      (enquiry.phone || "").includes(searchText);

    const matchesStatus = statusFilter
      ? enquiry.status?.toLowerCase() === statusFilter.toLowerCase()
      : true;

    const matchesSource = sourceFilter
      ? enquiry.source?.toLowerCase() === sourceFilter.toLowerCase()
      : true;

    const matchesDate =
      dateFilter && enquiry.date !== "N/A"
        ? dayjs(enquiry.date).isSame(dateFilter, "day")
        : !dateFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesSource &&
      matchesDate
    );
  });


  const handleExport = () => {
    if (!filteredEnquiries.length) return;

    const exportData = filteredEnquiries.map((item, index) => ({
      "Sr. No": index + 1,
      "User Name": item.name,
      "Email": item.email,
      "Mobile Number": item.phone,
      "Program of Interest": item.program,
      "Source": item.source,
      "Date": item.date,
      "Status": item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData, { origin: "A3" });

    // 🔥 Add Download Date at Top
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [`Exported On: ${dayjs().format("YYYY-MM-DD hh:mm A")}`],
        [`Total Records: ${filteredEnquiries.length}`],
        [], // empty row
      ],
      { origin: "A1" }
    );


    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enquiry & Leads");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(fileData, `Enquiry & Leads.xlsx`);
  };



  // ---------------- TABLE COLUMNS ----------------
  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1, // Page-aware serial number
    },
    {
      title: "Name / Email",
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
          <Text>{record.phone || "N/A"}</Text>
        </div>
      ),
    },
{
  title: "Program of Interest",
  dataIndex: "program_detail",
  key: "program",
  render: (program_detail, record) => {
    if (Array.isArray(program_detail) && program_detail.length > 0) {
      return (
        <div>
          {program_detail.map((p, index) => (
            <div key={p.id || index}>
              {index + 1}. {p.name}
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(record.program) && record.program.length > 0) {
      return (
        <div>
          {record.program.map((p, index) => (
            <div key={index}>
              {index + 1}. {p}
            </div>
          ))}
        </div>
      );
    }

    if (
      typeof record.program === "string" &&
      record.program.trim() !== ""
    ) {
      return `1. ${record.program}`;
    }

    return "N/A";
  },
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

  const normalizedProgram = record.program
    ?.toLowerCase()
    .replace(/\s+/g, "");

  const isHHProgram = normalizedProgram.includes("handholding");

  return (
    <Space>
      <Button
        type="primary"
        style={{
          borderRadius: adminTheme.token.borderRadius,

          // ✅ PRIORITY: Converted → Gray
          backgroundColor: isConverted
            ? adminTheme.token.disabledBg
            : isHHProgram
            ? "#3b82f6" 
            : adminTheme.token.colorPrimary, 

          borderColor: isConverted
            ? adminTheme.token.disabledBg
            : isHHProgram
            ? "#3b82f6"
            : adminTheme.token.colorPrimary,

          color: isConverted ? "#888" : "#fff", 
        }}
       onClick={() => {
  if (isHHProgram) {
    setSelectedEnquiry(record);
    setOpenHHModal(true);
  } else {
    setModalMode("convert");
    setSelectedEnquiry(record);
    setOpenAddModal(true);
  }
}}
        disabled={isConverted}
      >
        {isConverted
          ? "Converted"
          : isHHProgram
          ? "Convert to HH User"
          : "Convert to User"}
      </Button>

      {!isConverted && (
        <>
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => {
              setModalMode("edit");
              setSelectedEnquiry(record);
              setOpenAddModal(true);
            }}
          >
            Edit
          </Button>

          {role === "superadmin" && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  centered: true,
                  title: `Delete enquiry for ${record.name}?`,
                  content: `Are you sure you want to delete this enquiry? This action cannot be undone.`,
                  okText: "Yes",
                  cancelText: "No",
                  onOk: async () => {
                    try {
                      await dispatch(deleteEnquiry(record.id)).unwrap();
                      message.success("Enquiry deleted");
                      dispatch(fetchEnquiries());
                    } catch (err) {
                      // console.error("Delete failed", err);
                      message.error(err || "Failed to delete enquiry");
                    }
                  },
                });
              }}
            >
              Delete
            </Button>
          )}
        </>
      )}
    </Space>
  );
}
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
          <Space>
            <Button
               icon={<DownOutlined />}
              onClick={handleExport}
              style={{
                borderRadius: adminTheme.token.borderRadius,
              }}
            >
              Export to Excel
            </Button>

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
          </Space>
        </Col>

      </Row>

      {/* Filters */}
      <Card
        style={{
          marginTop: 30,
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

          {/* Status Filter */}
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="enquiry">Enquiry</Option>
              <Option value="Converted">Converted</Option>
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
            current: currentPage,
            pageSize: pageSize,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20, 50],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
          rowClassName={() => "enquiry-row"}
          scroll={{ x: "max-content" }}
          loading={loading}
          locale={{
            emptyText: error ? `Error: ${error}` : "No enquiries found",
          }}
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
        readonly={modalMode === "convert"}

      />
      <ConvertHHUserModal
  open={openHHModal}
  onCancel={() => setOpenHHModal(false)}
  enquiryData={selectedEnquiry}
/>

    </div>
  );
};

export default Enquiry;
