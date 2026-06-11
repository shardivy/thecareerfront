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
  "Not Received": adminTheme.token.colorWarning,
  "Received & Unlocked": adminTheme.token.colorSuccess,
  "Received & Locked": adminTheme.token.colorError,
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
  "Not Received": <UploadOutlined />,
  "Received & Unlocked": <UnlockOutlined />,
  "Received & Locked": <LockOutlined />,
  "Review Verification Pending": <FileSyncOutlined />,
};

const formatText = (text) => {
  if (!text) return "";

  return text
    .replace(/_/g, " ")        // replace underscores
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize words
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
      title: "Received & Unocked",
      value: stats?.received_unlocked || 0,
      icon: <UnlockOutlined style={{ color: adminTheme.token.colorSuccess }} />,
    },
    {
      title: "Received & Locked",
      value: stats?.received_locked || 0,
      icon: <LockOutlined style={{ color: adminTheme.token.colorError }} />,
    },
    {
      title: "Not Received",
      value: stats?.not_received || 0,
      icon: <UploadOutlined style={{ color: adminTheme.token.colorWarning }} />,
    },
    // {
    //   title: "Review Pending",
    //   value: stats?.review_pending || 0,
    //   icon: <FileSyncOutlined style={{ color: adminTheme.token.colorInfo }} />,
    // },
  ];

  /* ----------------- MAP API → UI DATA ----------------- */
  const mappedReports = useMemo(() => {
    if (!Array.isArray(rawReports)) return [];

    return rawReports.map((item) => ({
      id: item.id,
      name: `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim(),
      email: item.email,
      program: item.program ?? "—",
      package: item.package ?? "—",
      status:
        item.report_status === "not_received"
          ? "Not Received"
          : item.report_status === "review_pending"
            ? "Review Verification Pending"
            : item.report_status === "received_unlocked"
              ? "Received & Unlocked"
              : item.report_status === "received_locked"
                ? "Received & Locked"
                : formatText(item.report_status),

      paymentStatus:
        item.payment_status === "fully_paid"
          ? "Fully Paid"
          : item.payment_status === "partial_paid"
            ? "Partial Paid"
            : item.payment_status === "not_paid"
              ? "Not Paid"
              : formatText(item.payment_status),

      examStatus:
        item.exam_status === "completed"
          ? "Completed"
          : item.exam_status === "pending"
            ? "Pending"
            : formatText(item.exam_status),
      uploadedDate: item.uploaded_at
        ? new Date(item.uploaded_at).toISOString().split("T")[0]
        : "—",
      file_path: item.file_path || "",
      file_name: item.file_name || "",
    }));
  }, [rawReports]);

  /* ----------------- FILTER DATA ----------------- */
  const filteredData = useMemo(() => {
    const search = searchText.toLowerCase();

    const filtered = mappedReports.filter((item) => {
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

    /* ----------------- CUSTOM SORTING ----------------- */
    const statusPriority = {
      "Not Received": 1,
      "Received & Locked": 2,
      "Received & Unlocked": 3,
    };

    return filtered.sort((a, b) => {
      const priorityDiff =
        (statusPriority[a.status] || 99) -
        (statusPriority[b.status] || 99);

      if (priorityDiff !== 0) return priorityDiff;

      // ✅ If same status AND status is Pending Upload or Locked
      if (
        a.status === "Not Received" ||
        a.status === "Received & Locked"
      ) {
        return new Date(a.uploadedDate) - new Date(b.uploadedDate);
      }

      return 0;
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
        disabled: record.status !== "Not Received",
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
      title: "Program / Counselling Service",
      width: 190,
      render: (_, record) => (
        <div>
          <Text strong>{record.program || "N/A"}</Text>
          <br />
          <Text type="colorTextSecondary" >
            {record.package || "-"}
          </Text>
        </div>
      ),
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
      title: "Actions",
      render: (_, record) => (
        <Space wrap>
          {record.status === "Not Received" ? (
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => {
                        setSelectedReport(record);
                setModalMode("upload"); // FIXED: Changed from "edit" to "upload"
                setOpenViewModal(true);
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
                      setSelectedReport(record);
                  setModalMode("edit");
                  setOpenViewModal(true);
                }}
              >
                Edit
              </Button>
            </>
          )}
        </Space>
      ),
    },
    {
      title: "Uploaded Date",
      dataIndex: "uploadedDate",
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
              style={{ borderRadius: 16, textAlign: "center", fontSize: 16 }}
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
              placeholder="Report Status"
              allowClear
              style={{ width: "100%" }}
              onChange={setStatusFilter}
            >
              <Option value="Not Received">Not Received</Option>
              <Option value="Received & Locked">Received & Locked</Option>
              <Option value="Received & Unlocked">Received & Unlocked</Option>


              {/* <Option value="Review Verification Pending">
                Review Verification Pending
              </Option> */}
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
              <Option value="Verification Pending">Verification Pending</Option>
              <Option value="Not Paid">Not Paid</Option>
            </Select>
          </Col>

          {/* <Col xs={24} sm={12} md={5}>
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
          </Col> */}
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