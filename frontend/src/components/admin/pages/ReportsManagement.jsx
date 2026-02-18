import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Card,
  Typography,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  message,
} from "antd";
import {
  FileOutlined,
  UnlockOutlined,
  LockOutlined,
  UploadOutlined,
  EyeOutlined,
  EditOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  FileSyncOutlined,
  DownOutlined,
} from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";
import ViewReportModal from "../modals/ViewReportModal";
import VerifyReviewModal from "../modals/VerifyReviewModal";
import { fetchCompletedExamReports } from "../../../adminSlices/reportSlice";
import { fetchReportStats } from "../../../adminSlices/reportSlice";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const { Title, Text } = Typography;
const { Option } = Select;

/* ----------------- STATUS COLOR MAPS ----------------- */
const statusColorMap = {
  Unlocked: adminTheme.token.colorSuccess,
  Locked: adminTheme.token.colorError,
  "Pending Upload": adminTheme.token.colorWarning,
  "Review Verification Pending": adminTheme.token.colorInfo,
};

const paymentStatusColorMap = {
  "Fully Paid": adminTheme.token.colorSuccess,
  "Partial Paid": adminTheme.token.colorWarning,
  Pending: adminTheme.token.colorError,
};

const examStatusColorMap = {
  Completed: adminTheme.token.colorSuccess,
  Pending: adminTheme.token.colorWarning,
  "Not Started": adminTheme.token.colorTextSecondary,
};

const statusIconMap = {
  Unlocked: <UnlockOutlined />,
  Locked: <LockOutlined />,
  "Pending Upload": <UploadOutlined />,
  "Review Verification Pending": <FileSyncOutlined />,
};

/* ----------------- COMPONENT ----------------- */
const ReportsManagement = () => {
  const dispatch = useDispatch();

  const { reports: rawReports = [], stats, loading } = useSelector(
    (state) => state.reports
  );

  const [openViewModal, setOpenViewModal] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalMode, setModalMode] = useState("view");

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState(null);
  const [examFilter, setExamFilter] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);


  /* ----------------- FETCH DATA ----------------- */
  useEffect(() => {
    dispatch(fetchCompletedExamReports());
    dispatch(fetchReportStats());
  }, [dispatch]);

  /* ----------------- STATS DATA ----------------- */
  const statsCards = [
    {
      title: "Total Reports",
      value: stats?.total_reports || 0,
      icon: <FileOutlined style={{ color: adminTheme.token.colorPrimary }} />,
    },
    {
      title: "Unlocked",
      value: stats?.unlocked || 0,
      icon: <UnlockOutlined style={{ color: adminTheme.token.colorSuccess }} />,
    },
    {
      title: "Locked",
      value: stats?.locked || 0,
      icon: <LockOutlined style={{ color: adminTheme.token.colorError }} />,
    },
    {
      title: "Pending Upload",
      value: stats?.pending_uploaded || 0,
      icon: <UploadOutlined style={{ color: adminTheme.token.colorWarning }} />,
    },
    {
      title: "Review Pending",
      value: stats?.review_pending || 0,
      icon: <FileSyncOutlined style={{ color: adminTheme.token.colorInfo }} />,
    },
  ];

  /* ----------------- MAP API → UI DATA ----------------- */
  const mappedReports = useMemo(() => {
    if (!Array.isArray(rawReports)) return [];

    return rawReports.map((item) => ({
      id: item.id,
      name: `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim(),
      email: item.email,
      program: item.program ?? "—",
      status:
        item.report_status === "pending_uploaded"
          ? "Pending Upload"
          : item.report_status === "review_pending"
            ? "Review Verification Pending"
            : item.report_status === "unlocked"
              ? "Unlocked"
              : item.report_status === "locked"
                ? "Locked"
                : "Unknown",
     paymentStatus:
  item.payment_status === "fully_paid"
    ? "Fully Paid"
    : item.payment_status === "partial_paid"
      ? "Partial Paid"
      : "Pending",

      examStatus:
        item.exam_status === "completed"
          ? "Completed"
          : item.exam_status === "pending"
            ? "Pending"
            : "Not Started",
      uploadedDate: item.uploaded_at
        ? new Date(item.uploaded_at).toISOString().split("T")[0]
        : "—",
      file_path: item.file_path || "",
    }));
  }, [rawReports]);

  /* ----------------- FILTER DATA ----------------- */
  const filteredData = useMemo(() => {
    const search = searchText.toLowerCase();

    return mappedReports.filter((item) => {
      const matchesSearch = Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(search);

      const matchesStatus = statusFilter ? item.status === statusFilter : true;
      const matchesPayment = paymentFilter
        ? item.paymentStatus === paymentFilter
        : true;
      const matchesExam = examFilter ? item.examStatus === examFilter : true;

      return matchesSearch && matchesStatus && matchesPayment && matchesExam;
    });
  }, [mappedReports, searchText, statusFilter, paymentFilter, examFilter]);

  /* ----------------- BULK UPLOAD ----------------- */
  const handleBulkUpload = () => {
    if (!showCheckboxes) {
      setShowCheckboxes(true);
      message.info(
        "Select reports for bulk upload. Only 'Pending Upload' reports are selectable."
      );
      return;
    }

    if (!selectedRowKeys.length) {
      message.warning("Please select at least one report.");
      return;
    }

    const selectedReports = filteredData.filter((item) =>
      selectedRowKeys.includes(item.id)
    );

    setSelectedReport(selectedReports);
    setModalMode("bulkUpload");
    setOpenViewModal(true);

    setShowCheckboxes(false);
    setSelectedRowKeys([]);
  };

  /* ----------------- ROW SELECTION ----------------- */
  const rowSelection = showCheckboxes
    ? {
      selectedRowKeys,
      onChange: (keys) => setSelectedRowKeys(keys),
      getCheckboxProps: (record) => ({
        disabled: record.status !== "Pending Upload",
      }),
    }
    : null;

  /* ----------------- TABLE COLUMNS ----------------- */
  const columns = [
    {
      title: "Sr. No",
      render: (_, __, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "User Name",
      dataIndex: "name",
      render: (text, record) => (
        <>
          <Text strong>{text}</Text>
          <br />
          <Text type="colorTextSecondary">{record.email}</Text>
        </>
      ),
    },
    {
      title: "Program",
      dataIndex: "program",
    },
    {
      title: "Report Status",
      dataIndex: "status",
      render: (status) => (
        <Tag
          color={statusColorMap[status]}
          icon={statusIconMap[status]}
          style={{ borderRadius: 20, padding: "2px 10px" }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Payment Status",
      dataIndex: "paymentStatus",
      render: (text) => (
        <Tag color={paymentStatusColorMap[text]} style={{ borderRadius: 20 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Exam Status",
      dataIndex: "examStatus",
      render: (text) => (
        <Tag color={examStatusColorMap[text]} style={{ borderRadius: 20 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Uploaded Date",
      dataIndex: "uploadedDate",
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space wrap>
          {record.status === "Pending Upload" ? (
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => {
                console.log("📤 Upload button clicked for:", record.name);
                console.log("📋 Setting modal mode to: upload");
                setSelectedReport(record);
                setModalMode("upload"); // FIXED: Changed from "edit" to "upload"
                setOpenViewModal(true);
                console.log("✅ Modal opened with mode:", "upload");
              }}
            >
              Upload
            </Button>
          ) : record.status === "Review Verification Pending" ? (
            <>
              <Button
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedReport(record);
                  setModalMode("view");
                  setOpenViewModal(true);
                }}
              >
                View
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                style={{
                  backgroundColor: adminTheme.token.colorSuccess,
                  borderColor: adminTheme.token.colorSuccess,
                }}
                onClick={() => {
                  setSelectedReport(record);
                  setVerifyModalOpen(true);
                }}
              >
                Verify Review
              </Button>
            </>
          ) : (
            <>
              <Button
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedReport(record);
                  setModalMode("view");
                  setOpenViewModal(true);
                }}
              >
                View
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  console.log("✏️ Edit button clicked for:", record.name);
                  console.log("📋 Setting modal mode to: edit");
                  setSelectedReport(record);
                  setModalMode("edit");
                  setOpenViewModal(true);
                  console.log("✅ Modal opened with mode:", "edit");
                }}
              >
                Edit
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];


  const handleExportToExcel = () => {
    // Prepare export data
    const exportData =
      filteredData.length > 0
        ? filteredData.map((item, index) => ({
          "Sr. No": index + 1,
          "User Name": item.name,
          Email: item.email,
          Program: item.program,
          "Report Status": item.status,
          "Payment Status": item.paymentStatus,
          "Exam Status": item.examStatus,
          "Uploaded Date": item.uploadedDate,
        }))
        : [
          {
            "Sr. No": "",
            "User Name": "No records found",
            Email: "",
            Program: "",
            "Report Status": "",
            "Payment Status": "",
            "Exam Status": "",
            "Uploaded Date": "",
          },
        ];

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(data, `Reports_${new Date().toISOString().split("T")[0]}.xlsx`);

    message.success("Excel file downloaded successfully!");
  };


  return (
    <div style={{ padding: 16 }}>
      <Title level={3}>Report Management</Title>

      {/* ----------------- STATS ----------------- */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {statsCards.map((item, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card
              hoverable
              onClick={() => item.tabKey && setActiveTab(item.tabKey)}
              style={{ borderRadius: 16, textAlign: "center" }}
            >
              <Text>{item.title}</Text>
              <div style={{ marginTop: 8 }}>
                {React.cloneElement(item.icon, {
                  style: {
                    fontSize: 28,
                    color: adminTheme.token.colorPrimary,
                  },
                })}
              </div>
              <Title level={2} style={{ fontSize: 22 }}>
                {item.value}
              </Title>
            </Card>
          </Col>
        ))}
      </Row>

      <br /><br /><br />

      {/* ACTION BUTTONS */}
      <Row
        gutter={[8, 8]}
        style={{ marginBottom: 16 }}
        justify={{ xs: "center", sm: "end" }}
      >
        {/* <Col xs={24} sm={12} md={4}>
          <Button
            block
            type="primary"
            icon={<UploadOutlined />}
            onClick={handleBulkUpload}
            disabled={
              filteredData.filter((i) => i.status === "Pending Upload").length === 0
            }
          >
            {showCheckboxes
              ? `Upload Selected (${selectedRowKeys.length})`
              : "Bulk Upload"}
          </Button>
        </Col> */}

        <Col xs={24} sm={12} md={4}>
          <Button
            block
            icon={<DownOutlined />}
            onClick={handleExportToExcel}
          >
            Export to Excel
          </Button>

        </Col>
      </Row>

      {/* FILTERS + TABLE */}
      <Card>
        <Col>
          <Title level={5} style={{ margin: 10 }}>
            Report Records ({filteredData.length})
          </Title>
        </Col>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>

          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Status"
              allowClear
              style={{ width: "100%" }}
              onChange={setStatusFilter}
            >
              <Option value="Unlocked">Unlocked</Option>
              <Option value="Locked">Locked</Option>
              <Option value="Pending Upload">Pending Upload</Option>
              <Option value="Review Verification Pending">
                Review Verification Pending
              </Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Payment Status"
              allowClear
              style={{ width: "100%" }}
              onChange={setPaymentFilter}
            >
              <Option value="Fully Paid">Fully Paid</Option>
              <Option value="Partial Paid">Partial Paid</Option>
              <Option value="Pending">Pending</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Exam Status"
              allowClear
              style={{ width: "100%" }}
              onChange={setExamFilter}
            >
              <Option value="Completed">Completed</Option>
              <Option value="Pending">Pending</Option>
              <Option value="Not Started">Not Started</Option>
            </Select>
          </Col>
        </Row>

        <br />

        <Table
          loading={loading}
          rowKey="id"
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredData}
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

          scroll={{ x: "max-content" }}
        />
      </Card>

      <ViewReportModal
        open={openViewModal}
        onCancel={() => setOpenViewModal(false)}
        data={selectedReport}
        mode={modalMode}
      />

      <VerifyReviewModal
        open={verifyModalOpen}
        onCancel={() => setVerifyModalOpen(false)}
        reviewData={selectedReport}
        onVerify={(data) =>
          message.success(`Review verified for ${data.name}`)
        }
      />
    </div>
  );
};

export default ReportsManagement;