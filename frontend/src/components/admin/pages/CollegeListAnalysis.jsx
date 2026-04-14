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
import { useDispatch, useSelector } from "react-redux";
import { fetchQuestions, deleteQuestion } from "../../../adminSlices/questionSlice";
import { fetchCollegeAnalysis, fetchCompletedReports, fetchAnalysisDashboard } from "../../../adminSlices/collegeAnalysisSlice";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

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
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportMode, setReportMode] = useState("upload");
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
        loading: requestLoading
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

        const current = statusMap[status] || {
            color: "default",
            label: status,
        };

        return <Tag color={current.color}>{current.label}</Tag>;
    };

    const paymentStatusColorMap = {
        fully_paid: adminTheme.token.colorSuccess,
        partial_paid: adminTheme.token.colorWarning,
        pending: adminTheme.token.colorError,
    };

    const reportStatusMap = {
        not_received: { color: "orange", label: "Not Received" },
        received_unlocked: { color: "green", label: "Received & Unlocked" },
        received_locked: { color: "red", label: "Received & Locked" },
    };

    const formatStatus = (status) =>
        status
            ?.replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());

    const filteredRequests = (userRequests || []).filter((req) => {
        const fullName = `${req?.first_name || ""} ${req?.last_name || ""}`.toLowerCase();
        const email = req?.email?.toLowerCase() || "";

        const matchesSearch =
            fullName.includes(searchText.toLowerCase()) ||
            email.includes(searchText.toLowerCase());

        const matchesStatus =
            !statusFilter || req?.status === statusFilter;

        const matchesPayment =
            !paymentFilter || req?.payment_status === paymentFilter;

        const matchesReport =
            !reportFilter || req?.report_status === reportFilter; // ✅ NEW

        return matchesSearch && matchesStatus && matchesPayment && matchesReport;
    });

    /* ================= FILTER ================= */
    const filteredQuestions = questions.filter((q) =>
        q.question.toLowerCase().includes(searchText.toLowerCase())
    );

    const completedRequests = userRequests.filter(
        (req) => req.status === "completed"
    );

    const filteredReports = (completedReports || []).filter((item) => {
        const fullName = `${item?.first_name || ""} ${item?.last_name || ""}`.toLowerCase();
        const email = item?.email?.toLowerCase() || "";

        const matchesSearch =
            fullName.includes(searchText.toLowerCase()) ||
            email.includes(searchText.toLowerCase());

        const matchesReport =
            !reportFilter || item?.report_status === reportFilter;

        const matchesStatus =
            !statusFilter || item?.analysis_status === statusFilter; // ✅ ADD THIS

        return matchesSearch && matchesReport && matchesStatus; // ✅ include it
    });

    /* ================= HANDLERS ================= */

    const openAddModal = () => {
        setEditingRecord(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleViewRequest = (record) => {
        setSelectedRequest(record);
        setIsEditMode(false); // 👈 IMPORTANT
        setViewModalOpen(true);
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        form.setFieldsValue({
            question: record.question,
            date: dayjs(record.date),
        });
        setIsModalOpen(true);
    };

    const handleEditRequest = (record) => {
        setSelectedRequest(record);
        setIsEditMode(true);   // ✅ enable edit mode
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

    const handleUploadReport = (record) => {
        console.log("Upload clicked:", record);

        setSelectedReport(record);

        // If file exists → edit mode, else upload mode
        if (record.file_path) {
            setReportMode("edit");
        } else {
            setReportMode("upload");
        }

        setReportModalOpen(true);
    };


    /* ================= TABLE COLUMNS ================= */
    const questionColumns = [
        {
            title: "Sr. No",
            width: 90,
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1
        },
        {
            title: "Question",
            dataIndex: "question",
            // width:490,
            render: (text) => (
                <Text strong>
                    {formatQuestion(text).map((line, i) => (
                        <div key={i}>{line}</div>
                    ))}
                </Text>
            ),
        },
        {
            title: "Date",
            dataIndex: "date",
            render: (_, record) =>
                dayjs(record.updated_at).format("YYYY-MM-DD")
        },
        {
            title: "Actions",
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                        Edit
                    </Button>

                    <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDelete(record)}
                    >
                        Delete
                    </Button>
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

        /* 🔹 NAME + EMAIL */
        {
            title: "Username / Email",
            render: (_, record) => (
                <div>
                    <Text strong>
                        {record.first_name} {record.last_name}
                    </Text>
                    <div>
                        {record.email}
                    </div>
                </div>
            ),
        },

        /* 🔹 PROGRAM + SERVICE */
        {
            title: "Program / Counselling Service",
            width: 150,
            render: (_, record) => (
                <div>
                    <Text strong>{record.program_name}</Text>
                    <div>
                        {record.package_name}
                    </div>
                </div>
            ),
        },

        {
            title: "Submitted On",
            width: 120,
            dataIndex: "submittedOn",
            render: (_, record) =>
                dayjs(record.created_at).format("YYYY-MM-DD")
        },
        {
            title: "Payment Status",
            width: 120,
            dataIndex: "payment_status",
            render: (status) => (
                <Tag color={paymentStatusColorMap[status]}>
                    {formatStatus(status)}
                </Tag>
            ),
        },
        {
            title: "Report Status",
            width: 120,
            dataIndex: "report_status",
            render: (status) => {
                const current = reportStatusMap[status] || {
                    color: "default",
                    label: status,
                };

                return (
                    <Tag
                        color={current.color}
                        style={{
                            whiteSpace: "normal",   // ✅ allow wrapping
                            lineHeight: "16px",     // better spacing
                            textAlign: "center",    // optional: center text
                        }}
                    >
                        {current.label}
                    </Tag>
                );
            },
        },

        {
            title: "Questionnaire Status",
            width: 120,
            dataIndex: "status",
            render: (status) => renderStatus(status)
        },
        {
            title: "Actions",
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => handleViewRequest(record)}
                    >
                        View
                    </Button>

                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEditRequest(record)}
                    >
                        Edit
                    </Button>
                </Space>
            ),
        }
    ];

    const analysisColumns = [
        {
            title: "Sr. No",
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1
        },
        {
            title: "Username / Email",
            width: 120,
            render: (_, record) => (
                <div>
                    <Text strong>
                        {record.first_name} {record.last_name}
                    </Text>
                    <div>{record.email}</div>
                </div>
            ),
        },
        {
            title: "Program / Counselling Service",
            width: 170,
            render: (_, record) => (
                <div>
                    <Text strong>{record.program}</Text> {/* ✅ FIX */}
                    <div>{record.package}</div> {/* ✅ FIX */}
                </div>
            ),
        },
        {
            title: "Uploaded On",
            width: 120,
            render: (_, record) =>
                record.uploaded_at
                    ? dayjs(record.uploaded_at).format("YYYY-MM-DD")
                    : "-",
        },
        {
            title: "Questionnaire Status",
            width: 120,
            render: (_, record) => renderStatus(record.analysis_status), // ✅ FIX
        },
        {
            title: "Report Status",
            width: 120,
            render: (_, record) => {
                const map = {
                    received_locked: { color: "red", label: "Received & Locked" },
                    received_unlocked: { color: "green", label: "Received & Unlocked" },
                    not_received: { color: "orange", label: "Not Received" },
                };

                const current = map[record.report_status] || {
                    color: "default",
                    label: record.report_status,
                };

                return <Tag color={current.color}>{current.label}</Tag>;
            },
        },
        {
            title: "Actions",
            render: (_, record) => (
                <Space wrap>
                    {!record.file_path ? (
                        <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            onClick={() => handleUploadReport(record)}
                        >
                            Upload Report
                        </Button>
                    ) : (
                        <>
                            <Button
                                icon={<EyeOutlined />}
                                onClick={() => {
                                    setSelectedReport(record);
                                    setReportMode("view");
                                    setReportModalOpen(true);
                                }}
                            >
                                View
                            </Button>

                            <Button
                                icon={<EditOutlined />}
                                onClick={() => {
                                    setSelectedReport(record);
                                    setReportMode("edit");
                                    setReportModalOpen(true);
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
                            style={{
                                height: 130,
                                borderRadius: 12,
                                boxShadow: token.boxShadow,
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "100%" }}>
                                <div>
                                    <Text style={{ color: token.colorTextSecondary , fontSize: 16}}>
                                        {item.title}
                                    </Text>
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
                onChange={setActiveTab}
                items={[
                    { key: "template", label: "Question Template" },
                    { key: "requests", label: "User Requests / Submission" },
                    { key: "analysis", label: "Analysis Reports Upload" },
                ]}
            />

            {/* TABLE */}
            <Card>
                <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>

                    {/* 🔍 SEARCH */}
                    <Col xs={24} sm={12} md={8}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Search..."
                            style={{ width: "100%" }}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>

                    {/* 🔽 STATUS FILTER (ONLY FOR REQUEST TAB) */}
                    {activeTab === "requests" && (
                        <>
                            {/* PAYMENT FILTER */}
                            <Col xs={24} sm={12} md={5}>
                                <Select
                                    value={paymentFilter}
                                    onChange={(value) => setPaymentFilter(value)}
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

                            {/* ✅ REPORT STATUS FILTER */}
                            <Col xs={24} sm={12} md={5}>
                                <Select
                                    value={reportFilter}
                                    onChange={(value) => setReportFilter(value)}
                                    style={{ width: "100%" }}
                                    placeholder="Report Status"
                                    allowClear
                                    options={[
                                        { label: "Not Received", value: "not_received" },
                                        { label: "Received & Unlocked", value: "received_unlocked" },
                                        { label: "Received & Locked", value: "received_locked" },
                                    ]}
                                />
                            </Col>

                            {/* STATUS FILTER */}
                            <Col xs={24} sm={12} md={5}>
                                <Select
                                    value={statusFilter}
                                    onChange={(value) => setStatusFilter(value)}
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

                    {activeTab === "analysis" && (
                        <>

                            {/* ✅ QUESTIONNAIRE STATUS */}
                            <Col xs={24} sm={12} md={6}>
                                <Select
                                    value={statusFilter}
                                    onChange={(value) => setStatusFilter(value)}
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

                            {/* REPORT STATUS */}
                            <Col xs={24} sm={12} md={6}>
                                <Select
                                    value={reportFilter}
                                    onChange={(value) => setReportFilter(value)}
                                    style={{ width: "100%" }}
                                    placeholder="Report Status"
                                    allowClear
                                    options={[
                                        { label: "Not Received", value: "not_received" },
                                        { label: "Received & Unlocked", value: "received_unlocked" },
                                        { label: "Received & Locked", value: "received_locked" },
                                    ]}
                                />
                            </Col>


                        </>
                    )}

                    {/* ➕ ADD BUTTON */}
                    {activeTab === "template" && (
                        <Col xs={24} sm={12} md={8} style={{ marginLeft: "auto" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: screens.xs ? "flex-end" : "flex-end",
                                }}
                            >
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

            {/* MODAL */}
            <AddQuestionModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                editingRecord={editingRecord}
            />


            <ViewRequestModal
                open={viewModalOpen}
                onClose={() => {
                    setViewModalOpen(false);
                    setIsEditMode(false); // reset
                }}
                data={selectedRequest}
                isEditMode={isEditMode}
                onSave={() => {
                    dispatch(fetchCollegeAnalysis());
                }}
            />

            <ViewAnalyasisReportModal
                open={reportModalOpen}
                onCancel={() => setReportModalOpen(false)}
                data={selectedReport}
                mode={reportMode}
                onSuccess={() => {
                    dispatch(fetchCollegeAnalysis());
                    dispatch(fetchCompletedReports());
                }}
            />
        </div>

    );
};

export default CollegeListAnalysis;