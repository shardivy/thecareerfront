import React, { useState, useEffect } from "react";
import {
    Row,
    Col,
    Card,
    Typography,
    Tabs,
    Table,
    Space,
    Input,
    Button,
    theme,
    Modal,
    Form,
    message,
    DatePicker,
    Tag,
    Select,
    Grid,
} from "antd";
import {
    FileTextOutlined,
    UserOutlined,
    BarChartOutlined,
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import adminTheme from "../../../theme/adminTheme";
import AddQuestionModal from "../modals/AddQuestionModal";
import ViewRequestModal from "../modals/ViewRequestModal";
import ViewAnalyasisReportModal from "../modals/ViewAnalysisReportModal";
import UploadAnalysisReportModal from "../modals/UploadAnalysisReportModal"; // ← NEW
import { useDispatch, useSelector } from "react-redux";
import { fetchQuestions, deleteQuestion } from "../../../adminSlices/questionSlice";
import { fetchCollegeAnalysis, fetchCompletedReports, fetchAnalysisDashboard } from "../../../adminSlices/collegeAnalysisSlice";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

/* ── Shared report-status filter options ── */
const REPORT_STATUS_OPTIONS = [
    { label: "V1 — Not Received", value: "v1_not_received" },
    { label: "V1 — Received", value: "v1_received" },
    { label: "V2 — Not Received", value: "v2_not_received" },
    { label: "V2 — Received", value: "v2_received" },
    { label: "V3 — Not Received", value: "v3_not_received" },
    { label: "V3 — Received", value: "v3_received" },
];

/* ── Shared report-status tag map ── */
const REPORT_STATUS_MAP = {
    v1_not_received: { color: "orange", label: "V1 — Not Received" },
    v1_received: { color: "green", label: "V1 — Received" },
    v2_not_received: { color: "orange", label: "V2 — Not Received" },
    v2_received: { color: "blue", label: "V2 — Received" },
    v3_not_received: { color: "orange", label: "V3 — Not Received" },
    v3_received: { color: "green", label: "V3 — Received" },
};

const renderReportStatusTag = (status) => {
    const current = REPORT_STATUS_MAP[status] || { color: "default", label: status || "-" };
    return (
        <Tag color={current.color} style={{ whiteSpace: "normal", lineHeight: "16px" }}>
            {current.label}
        </Tag>
    );
};

/* ── Returns the most advanced report status for display ── */
const getLatestReportStatus = (record) => {
    const v3 = record?.report_status_v3;
    const v2 = record?.report_status_v2;
    const v1 = record?.report_status;

    if (v3 && v3 !== "v3_not_received") return v3;
    if (v2 && v2 !== "v2_not_received") return v2;
    return v1;
};

const CollegeListAnalysis = () => {
    const { token } = theme.useToken();
    const screens = useBreakpoint();

    const [activeTab, setActiveTab] = useState("requests");
    const [searchText, setSearchText] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // ── View/Edit modal (unchanged) ──
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportMode, setReportMode] = useState("upload");
    const [defaultTab, setDefaultTab] = useState("v1");
    const [visibleTabs, setVisibleTabs] = useState(["v1", "v2", "v3"]);

    // ── NEW: Upload-only modal ──
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadVersion, setUploadVersion] = useState("v1"); // "v1" | "v3"
    const [uploadTarget, setUploadTarget] = useState(null);  // the mapped record

    const [statusFilter, setStatusFilter] = useState(null);
    const [paymentFilter, setPaymentFilter] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [reportFilter, setReportFilter] = useState(null);

    const [form] = Form.useForm();

    const dispatch = useDispatch();
    const { questions, loading } = useSelector((state) => state.questions);
    const {
        requests: userRequests,
        completedReports,
        loading: requestLoading,
    } = useSelector((state) => state.collegeAnalysis);
    const { dashboardStats } = useSelector((state) => state.collegeAnalysis);

    useEffect(() => {
        dispatch(fetchQuestions());
        dispatch(fetchCollegeAnalysis());
        dispatch(fetchCompletedReports());
        dispatch(fetchAnalysisDashboard());
    }, [dispatch]);

    /* ================= STATS ================= */
    const stats = [
        {
            title: "Total Templates",
            value: dashboardStats?.total_templates_questions || 0,
            icon: <FileTextOutlined style={{ fontSize: 22, color: token.colorPrimary }} />,
        },
        {
            title: "User Requests",
            value: dashboardStats?.engineering_test_analysis_users || 0,
            icon: <UserOutlined style={{ fontSize: 22, color: token.colorSuccess }} />,
        },
        {
            title: "Analysis Reports Upload",
            value: dashboardStats?.reports_uploaded || 0,
            icon: <BarChartOutlined style={{ fontSize: 22, color: token.colorWarning }} />,
        },
        {
            title: "Pending Reports Upload",
            value: dashboardStats?.pending_report_upload || 0,
            icon: <UserOutlined style={{ fontSize: 22, color: token.colorError }} />,
        },
    ];

    const renderStatus = (status) => {
        const statusMap = {
            completed: { color: "success", label: "Completed" },
            in_progress: { color: "processing", label: "In Progress" },
            rejected: { color: "error", label: "Rejected" },
            not_started: { color: "default", label: "Not Started" },
        };
        const current = statusMap[status] || { color: "default", label: status };
        return <Tag color={current.color}>{current.label}</Tag>;
    };

    const paymentStatusColorMap = {
        fully_paid: adminTheme.token.colorSuccess,
        partial_paid: adminTheme.token.colorWarning,
        pending: adminTheme.token.colorError,
    };

    const formatStatus = (status) =>
        status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    /* ================= FILTERS ================= */
    const filteredRequests = (userRequests || []).filter((req) => {
        const fullName = `${req?.first_name || ""} ${req?.last_name || ""}`.toLowerCase();
        const email = req?.email?.toLowerCase() || "";

        const matchesSearch = fullName.includes(searchText.toLowerCase()) || email.includes(searchText.toLowerCase());
        const matchesStatus = !statusFilter || req?.status === statusFilter;
        const matchesPayment = !paymentFilter || req?.payment_status === paymentFilter;
        const matchesReport = !reportFilter || req?.report_status === reportFilter.trim();

        return matchesSearch && matchesStatus && matchesPayment && matchesReport;
    });

    const filteredQuestions = questions.filter((q) =>
        q.question.toLowerCase().includes(searchText.toLowerCase())
    );

    const filteredReports = (completedReports || []).filter((item) => {
        const fullName = `${item?.first_name || ""} ${item?.last_name || ""}`.toLowerCase();
        const email = item?.email?.toLowerCase() || "";

        const matchesSearch = fullName.includes(searchText.toLowerCase()) || email.includes(searchText.toLowerCase());
        const matchesReport = !reportFilter || getLatestReportStatus(item) === reportFilter.trim();
        const matchesStatus = !statusFilter || item?.analysis_status === statusFilter;

        return matchesSearch && matchesReport && matchesStatus;
    });

    /* ================= HANDLERS ================= */
    const openAddModal = () => {
        setEditingRecord(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleViewRequest = (record) => {
        setSelectedRequest(record);
        setIsEditMode(false);
        setViewModalOpen(true);
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        form.setFieldsValue({ question: record.question, date: dayjs(record.date) });
        setIsModalOpen(true);
    };

    const handleEditRequest = (record) => {
        setSelectedRequest(record);
        setIsEditMode(true);
        setViewModalOpen(true);
    };

    const handleDelete = (record) => {
        Modal.confirm({
            title: "Delete Question",
            content: "Are you sure you want to delete this question?",
            okType: "danger",
            centered: true,
            onOk: async () => {
                try {
                    const res = await dispatch(deleteQuestion(record.id)).unwrap();
                    message.success(res.message || "Deleted successfully");
                } catch (err) {
                    message.error(err?.message || "Delete failed");
                }
            },
        });
    };

    const formatQuestion = (text, wordsPerLine = 8) => {
        const words = text.split(" ");
        const lines = [];
        for (let i = 0; i < words.length; i += wordsPerLine) {
            lines.push(words.slice(i, i + wordsPerLine).join(" "));
        }
        return lines;
    };

    /* ── Helper: build mapped record for view/edit modal ── */
    const buildMappedRecord = (record) => ({
        ...record,
        v1_file_path: record.file_path,
        v1_file_name: record.file_name,
        v2_file_path: record.file_path1,
        v2_file_name: record.file_name1,
        v3_file_path: record.file_path2,
        v3_file_name: record.file_name2,
    });

    /* ── Helper: open the new upload modal ── */
    const openUploadModal = (record, version) => {
        setUploadTarget(buildMappedRecord(record));
        setUploadVersion(version);
        setUploadModalOpen(true);
    };

    /* ── Shared success callback — refetch both lists ── */
    const handleReportSuccess = () => {
        dispatch(fetchCollegeAnalysis());
        dispatch(fetchCompletedReports());
    };

    /* ================= TABLE COLUMNS ================= */
    const questionColumns = [
        {
            title: "Sr. No",
            width: 90,
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: "Question",
            dataIndex: "question",
            render: (text) => (
                <Text strong>
                    {formatQuestion(text).map((line, i) => <div key={i}>{line}</div>)}
                </Text>
            ),
        },
        {
            title: "Date",
            dataIndex: "date",
            render: (_, record) => dayjs(record.updated_at).format("YYYY-MM-DD"),
        },
        {
            title: "Actions",
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record)}>Delete</Button>
                </Space>
            ),
        },
    ];

    const requestColumns = [
        {
            title: "Sr. No",
            width: 60,
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: "Username / Email",
            render: (_, record) => (
                <div>
                    <Text strong>{record.first_name} {record.last_name}</Text>
                    <div>{record.email}</div>
                </div>
            ),
        },
        {
            title: "Program / Counselling Service",
            width: 150,
            render: (_, record) => (
                <div>
                    <Text strong>{record.program_name}</Text>
                    <div>{record.package_name}</div>
                </div>
            ),
        },
        {
            title: "Submitted On",
            width: 120,
            render: (_, record) => dayjs(record.created_at).format("YYYY-MM-DD"),
        },
        {
            title: "Payment Status",
            width: 120,
            dataIndex: "payment_status",
            render: (status) => (
                <Tag color={paymentStatusColorMap[status]}>{formatStatus(status)}</Tag>
            ),
        },
        {
            title: "Report Status",
            width: 140,
            render: (_, record) => renderReportStatusTag(getLatestReportStatus(record)),
        },
        {
            title: "Questionnaire Status",
            width: 120,
            dataIndex: "status",
            render: (status) => renderStatus(status),
        },
        {
            title: "Actions",
            render: (_, record) => (
                <Space>
                    <Button icon={<EyeOutlined />} onClick={() => handleViewRequest(record)}>View</Button>
                    <Button icon={<EditOutlined />} onClick={() => handleEditRequest(record)}>Edit</Button>
                </Space>
            ),
        },
    ];

    const analysisColumns = [
        {
            title: "Sr. No",
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: "Username / Email",
            width: 120,
            render: (_, record) => (
                <div>
                    <Text strong>{record.first_name} {record.last_name}</Text>
                    <div>{record.email}</div>
                </div>
            ),
        },
        {
            title: "Program / Counselling Service",
            width: 170,
            render: (_, record) => (
                <div>
                    <Text strong>{record.program}</Text>
                    <div>{record.package}</div>
                </div>
            ),
        },
        {
            title: "Uploaded On",
            width: 120,
            render: (_, record) =>
                record.uploaded_at ? dayjs(record.uploaded_at).format("YYYY-MM-DD") : "-",
        },
        {
            title: "Questionnaire Status",
            width: 120,
            render: (_, record) => renderStatus(record.analysis_status),
        },
        {
            title: "Report Status",
            width: 140,
            render: (_, record) => renderReportStatusTag(getLatestReportStatus(record)),
        },
        {
            title: "Actions",
            render: (_, record) => {
                const v2Received =
                    record.report_status_v2 === "v2_received" ||
                    record.report_status_v2 === "v2_received_unlocked";

                // ── Case 1: V1 not yet uploaded → Upload V1 (new modal) ──
                if (!record.file_path) {
                    return (
                        <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            onClick={() => openUploadModal(record, "v1")}
                        >
                            Upload V1 Report
                        </Button>
                    );
                }

                // ── Case 2: V2 received, V3 not yet uploaded → Upload V3 (new modal) + View/Edit (existing modal) ──
                if (v2Received && !record.file_path2) {
                    return (
                        <Space wrap>
                            <Button
                                type="primary"
                                icon={<UploadOutlined />}
                                onClick={() => openUploadModal(record, "v3")}
                            >
                                Upload V3 Report
                            </Button>

                            <Button
                                icon={<EyeOutlined />}
                                onClick={() => {
                                    setSelectedReport(buildMappedRecord(record));
                                    setReportMode("view");
                                    setDefaultTab("v2");
                                    setVisibleTabs(["v1", "v2"]);
                                    setReportModalOpen(true);
                                }}
                            >
                                View
                            </Button>

                            <Button
                                icon={<EditOutlined />}
                                onClick={() => {
                                    setSelectedReport(buildMappedRecord(record));
                                    setReportMode("edit");
                                    setDefaultTab("v2");
                                    setVisibleTabs(["v1", "v2"]);
                                    setReportModalOpen(true);
                                }}
                            >
                                Edit
                            </Button>
                        </Space>
                    );
                }

                // ── Case 3: All other states → View / Edit only (existing modal) ──
                return (
                    <Space wrap>
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => {
                                setSelectedReport(buildMappedRecord(record));
                                setReportMode("view");
                                setDefaultTab("v1");
                                setVisibleTabs(["v1", "v2", "v3"]);
                                setReportModalOpen(true);
                            }}
                        >
                            View
                        </Button>
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => {
                                setSelectedReport(buildMappedRecord(record));
                                setReportMode("edit");
                                setDefaultTab("v1");
                                setVisibleTabs(["v1", "v2", "v3"]);
                                setReportModalOpen(true);
                            }}
                        >
                            Edit
                        </Button>
                    </Space>
                );
            },
        },
    ];

    return (
        <div>
            {/* HEADER */}
            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                <Col>
                    <Title level={3}>College List Analysis</Title>
                </Col>
            </Row>

            {/* STATS */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                {stats.map((item, index) => (
                    <Col xs={24} sm={12} md={12} lg={6} key={index}>
                        <Card
                            bordered={false}
                            style={{ height: 130, borderRadius: 12, boxShadow: token.boxShadow }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "100%" }}>
                                <div>
                                    <Text style={{ color: token.colorTextSecondary, fontSize: 16 }}>{item.title}</Text>
                                    <Title level={3}>{item.value}</Title>
                                </div>
                                {item.icon}
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* TABS */}
            <Tabs
                activeKey={activeTab}
                onChange={(key) => {
                    setActiveTab(key);
                    setSearchText("");
                    setStatusFilter(null);
                    setPaymentFilter(null);
                    setReportFilter(null);
                    setCurrentPage(1);
                }}
                items={[
                    { key: "template", label: "Question Template" },
                    { key: "requests", label: "User Requests / Submission" },
                    { key: "analysis", label: "Analysis Reports Upload" },
                ]}
            />

            {/* TABLE */}
            <Card>
                <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                    {/* SEARCH */}
                    <Col xs={24} sm={12} md={8}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Search..."
                            value={searchText}
                            style={{ width: "100%" }}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>

                    {/* REQUESTS TAB FILTERS */}
                    {activeTab === "requests" && (
                        <>
                            <Col xs={24} sm={12} md={5}>
                                <Select
                                    value={paymentFilter}
                                    onChange={setPaymentFilter}
                                    style={{ width: "100%" }}
                                    placeholder="Payment Status"
                                    allowClear
                                    options={[
                                        { label: "Fully Paid", value: "fully_paid" },
                                        { label: "Partial Paid", value: "partial_paid" },
                                        { label: "Pending", value: "pending" },
                                    ]}
                                />
                            </Col>

                            <Col xs={24} sm={12} md={5}>
                                <Select
                                    value={reportFilter}
                                    onChange={setReportFilter}
                                    style={{ width: "100%" }}
                                    placeholder="Report Status"
                                    allowClear
                                    options={REPORT_STATUS_OPTIONS}
                                />
                            </Col>

                            <Col xs={24} sm={12} md={5}>
                                <Select
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    style={{ width: "100%" }}
                                    placeholder="Questionnaire Status"
                                    allowClear
                                    options={[
                                        { label: "Not Started", value: "not_started" },
                                        { label: "In Progress", value: "in_progress" },
                                        { label: "Completed", value: "completed" },
                                    ]}
                                />
                            </Col>
                        </>
                    )}

                    {/* ANALYSIS TAB FILTERS */}
                    {activeTab === "analysis" && (
                        <>
                            <Col xs={24} sm={12} md={6}>
                                <Select
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    style={{ width: "100%" }}
                                    placeholder="Questionnaire Status"
                                    allowClear
                                    options={[
                                        { label: "Not Started", value: "not_started" },
                                        { label: "In Progress", value: "in_progress" },
                                        { label: "Completed", value: "completed" },
                                    ]}
                                />
                            </Col>

                            <Col xs={24} sm={12} md={6}>
                                <Select
                                    value={reportFilter}
                                    onChange={setReportFilter}
                                    style={{ width: "100%" }}
                                    placeholder="Report Status"
                                    allowClear
                                    options={REPORT_STATUS_OPTIONS}
                                />
                            </Col>
                        </>
                    )}

                    {/* ADD BUTTON — template tab only */}
                    {activeTab === "template" && (
                        <Col xs={24} sm={12} md={8} style={{ marginLeft: "auto" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    block={screens.xs}
                                    onClick={openAddModal}
                                >
                                    Add Question
                                </Button>
                            </div>
                        </Col>
                    )}
                </Row>

                <Table
                    columns={
                        activeTab === "template"
                            ? questionColumns
                            : activeTab === "requests"
                                ? requestColumns
                                : analysisColumns
                    }
                    dataSource={
                        activeTab === "template"
                            ? filteredQuestions
                            : activeTab === "requests"
                                ? filteredRequests
                                : filteredReports
                    }
                    rowKey="id"
                    loading={activeTab === "template" ? loading : requestLoading}
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

            {/* ── MODALS ── */}
            <AddQuestionModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                editingRecord={editingRecord}
            />

            <ViewRequestModal
                open={viewModalOpen}
                onClose={() => {
                    setViewModalOpen(false);
                    setIsEditMode(false);
                }}
                data={selectedRequest}
                isEditMode={isEditMode}
                onSave={() => dispatch(fetchCollegeAnalysis())}
            />

            {/* Existing view/edit modal — untouched */}
            <ViewAnalyasisReportModal
                open={reportModalOpen}
                onCancel={() => setReportModalOpen(false)}
                data={selectedReport}
                mode={reportMode}
                defaultTab={defaultTab}
                visibleTabs={visibleTabs}
                onSuccess={handleReportSuccess}
            />

            {/* NEW upload-only modal */}
            <UploadAnalysisReportModal
                open={uploadModalOpen}
                onCancel={() => setUploadModalOpen(false)}
                data={uploadTarget}
                version={uploadVersion}
                onSuccess={handleReportSuccess}
            />
        </div>
    );
};

export default CollegeListAnalysis;