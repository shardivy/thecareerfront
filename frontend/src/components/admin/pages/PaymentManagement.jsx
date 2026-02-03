import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Row,
    Col,
    Card,
    Typography,
    Table,
    Tag,
    Button,
    Space,
    ConfigProvider,
    Input,
    Select,
    DatePicker,
} from "antd";
import {
    EyeOutlined,
    CalendarOutlined,
    DollarCircleOutlined,
    FileTextOutlined,
    PayCircleOutlined,
    CloseCircleOutlined,
    SearchOutlined,
    UploadOutlined,
    EditOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import adminTheme from "../../../theme/adminTheme";
import PaymentProofModal from "../modals/PaymentProofModal";
import UploadPaymentModal from "../modals/UploadPaymentModal";
import { fetchPaymentStats, fetchPayments } from "../../../adminSlices/paymentSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const PaymentManagement = () => {
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const dispatch = useDispatch();


    const { stats, statsLoading, list, listLoading } = useSelector(
        (state) => state.payment
    );

    useEffect(() => {
        dispatch(fetchPaymentStats());
        dispatch(fetchPayments());
    }, [dispatch]);

    const handleEditPayment = (record) => {
        setSelectedPayment(record);
        setIsModalOpen(true);
    };



    /* ---------------- STATS ---------------- */
    const statsCards = [
        {
            title: "Total Collected",
            value: `₹${stats?.total_collected ?? 0}`,
            icon: (
                <DollarCircleOutlined
                    style={{ fontSize: 28, color: adminTheme.token.colorPrimary }}
                />
            ),
        },
        {
            title: "Pending Verification",
            value: `₹${stats?.pending_verification ?? 0}`,
            icon: (
                <FileTextOutlined
                    style={{ fontSize: 28, color: adminTheme.token.colorPrimary }}
                />
            ),
        },
        {
            title: "Partial Payments",
            value: `₹${stats?.partial_paid ?? 0}`,
            icon: (
                <PayCircleOutlined
                    style={{ fontSize: 28, color: adminTheme.token.colorPrimary }}
                />
            ),
        },
        {
            title: "Fully Pending",
            value: `₹${stats?.pending ?? 0}`,
            icon: (
                <CloseCircleOutlined
                    style={{ fontSize: 28, color: adminTheme.token.colorPrimary }}
                />
            ),
        },
    ];
    /* ---------------- DATA ---------------- */
    // const paymentRecords = [
    //     {
    //         key: 1,
    //         name: "Priya Sharma",
    //         package: "Premium",
    //         amount: "₹25,000",
    //         status: "Fully Paid",
    //         paymentMethod: "UPI",
    //         date: "2025-12-20",
    //         txn: "TXN1234567890",
    //         proof: true,
    //     },
    //     {
    //         key: 2,
    //         name: "Rajesh Kumar",
    //         package: "Standard",
    //         amount: "₹7,500 / ₹15,000",
    //         status: "Partial Paid",
    //         paymentMethod: "Cash",
    //         date: "2026-01-05",
    //         txn: "TXN1234567891",
    //         proof: true,
    //     },
    //     {
    //         key: 3,
    //         name: "Anjali Verma",
    //         package: "Basic",
    //         amount: "₹10,000",
    //         status: "Verification Pending",
    //         paymentMethod: "UPI",
    //         date: "2026-01-08",
    //         txn: "TXN1234567892",
    //         proof: true,
    //     },
    //     {
    //         key: 4,
    //         name: "Vikram Singh",
    //         package: "Premium",
    //         amount: "₹25,000",
    //         status: "Pending",
    //         paymentMethod: "-",
    //         date: "-",
    //         txn: "-",
    //         proof: false,
    //     },
    // ];

    /* ---------------- STATUS COLORS ---------------- */
    const statusColorMap = {
        "Fully Paid": "success",
        "Partial Paid": "warning",
        "Verification Pending": "processing",
        Pending: "error",
    };

    /* ---------------- API -> TABLE DATA (DEFENSIVE MAPPING) ---------------- */
    const toTitle = (str) =>
        str
            .toString()
            .replace(/_/g, " ")
            .split(" ")
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(" ");

    const formatAmt = (val) => {
        const num = Number(val);
        if (Number.isFinite(num)) {
            return new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
            }).format(num);
        }
        return val ?? "-";
    };

    const apiPaymentRecords = Array.isArray(list)
        ? list.map((p, idx) => ({
            key: p.id ?? p.key ?? idx,
            name:
                (p.user_first_name || p.user_first_name === "")
                    ? `${p.user_first_name || ""} ${p.user_last_name || ""}`.trim() || p.user_email || "N/A"
                    : p.student_name ?? p.name ?? p.user?.name ?? "N/A",
            package: p.package_name ?? p.package?.name ?? p.package ?? "N/A",
            amount: formatAmt(p.amount ?? p.package_price ?? p.amount_display),
            status: toTitle(p.status ?? p.payment_status ?? "pending"),
            paymentMethod:
                (p.method ?? p.payment_method ?? p.paymentMethod ?? "-").toString().toUpperCase(),
            date: p.payment_date ?? p.date ?? "-",
            txn: p.transaction_id ?? p.txn ?? "-",
            proof: !!(p.proof_file || p.receipt_url || p.proof || p.has_receipt),
        }))
        : [];

    /* ---------------- FILTER LOGIC ---------------- */
    const filteredData = apiPaymentRecords.filter((item) => {
        const search = searchText.toLowerCase();

        const matchesSearch = Object.values(item)
            .filter((val) => typeof val === "string")
            .join(" ")
            .toLowerCase()
            .includes(search);

        const matchesStatus = statusFilter ? item.status === statusFilter : true;

        const matchesDate = selectedDate
            ? item.date !== "-" && dayjs(item.date).isSame(selectedDate, "day")
            : true;

        return matchesSearch && matchesStatus && matchesDate;
    });



    /* ---------------- TABLE COLUMNS ---------------- */
    const columns = [
        { title: "User Name", dataIndex: "name" },
        { title: "Package", dataIndex: "package" },
        { title: "Amount", dataIndex: "amount" },
        {
            title: "Payment Status",
            dataIndex: "status",
            render: (status) => (
                <Tag color={statusColorMap[status]}>
                    {status}
                </Tag>
            ),
        },
        {
            title: "Payment Method",
            dataIndex: "paymentMethod",
            render: (method) =>
                method === "-" ? <Text type="secondary">-</Text> : <Tag>{method}</Tag>,
        },
        {
            title: "Payment Date",
            dataIndex: "date",
            render: (date) =>
                date === "-" ? "-" : (
                    <Space>
                        <CalendarOutlined />
                        {date}
                    </Space>
                ),
        },
        { title: "Transaction ID", dataIndex: "txn" },
        {
            title: "Action",
            render: (_, record) => {
                // Only show Verify button for Verification Pending
                if (record.status === "Verification Pending") {
                    return (
                        <Button
                            size="large"
                            type="primary"
                            icon={<CheckCircleOutlined />}
                          onClick={() => {
    setSelectedPayment({
        ...record,
        mode: "verify",
        paymentDate: record.date !== "-" ? record.date : null, // <-- ADD THIS
    });
    setIsModalOpen(true);
}}
                        >
                            Verify
                        </Button>
                    );
                }

                // For all other statuses, always show View + Edit
                return (
                    <Space>
                        <Button
                            size="large"
                            icon={<EyeOutlined />}
                            onClick={() => {
                                setSelectedPayment({ ...record, mode: "view" });
                                setIsModalOpen(true);
                            }}
                        >
                            View
                        </Button>

                        <Button
                            size="large"
                            icon={<EditOutlined />}
                            onClick={() => {
                                setSelectedPayment({ ...record, mode: "edit" });
                                setIsModalOpen(true);
                            }}
                        >
                            Edit
                        </Button>
                    </Space>
                );
            },
        }



    ];


    return (
        <ConfigProvider theme={adminTheme}>
            <div style={{ padding: 16 }}>
                <Title level={3}>Payment Management</Title>

                {/* ---------------- STATS ---------------- */}
                <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    {statsCards.map((stat, i) => (
                        <Col xs={24} sm={12} md={6} key={i}>
                            <Card loading={statsLoading} style={{ textAlign: "center" }}>
                                <Space direction="vertical" align="center" size={6}>
                                    <Text strong>{stat.title}</Text>
                                    {stat.icon}
                                    <Title level={4} style={{ margin: 0 }}>
                                        {stat.value}
                                    </Title>
                                </Space>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* ---------------- TABLE ---------------- */}
                <Card>
                    {/* HEADER WITH UPLOAD BUTTON */}
                    <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                        <Col>
                            <Title level={5} style={{ margin: 10 }}>
                                Payment Records ({filteredData.length})
                            </Title>
                        </Col>

                        <Col>
                            <Button
                                type="primary"
                                icon={<UploadOutlined />}
                                onClick={() => setIsUploadModalOpen(true)}
                            >
                                Upload Payment
                            </Button>

                        </Col>
                    </Row>

                    {/* FILTERS */}
                    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                        <Col xs={24} md={8}>
                            <Input
                                placeholder="Search"
                                prefix={<SearchOutlined />}
                                allowClear
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </Col>

                        <Col xs={24} md={6}>
                            <Select
                                placeholder="Payment Status"
                                allowClear
                                style={{ width: "100%" }}
                                onChange={setStatusFilter}
                            >
                                {Object.keys(statusColorMap).map((status) => (
                                    <Option key={status}>{status}</Option>
                                ))}
                            </Select>
                        </Col>

                        <Col xs={24} md={6}>
                            <DatePicker
                                style={{ width: "100%" }}
                                placeholder="Select date"
                                onChange={setSelectedDate}
                            />
                        </Col>
                    </Row>

                    {/* TABLE */}
                    <Table
                        loading={listLoading}
                        columns={columns}
                        dataSource={filteredData}
                        pagination={{ pageSize: 5 }}
                        scroll={{ x: 1000 }}
                        locale={{ emptyText: listLoading ? 'Loading payments...' : 'No payments found' }}
                    />
                </Card>

                {/* VIEW PAYMENT MODAL */}
                <PaymentProofModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    data={selectedPayment}
                />


                <UploadPaymentModal
                    open={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                />

            </div>
        </ConfigProvider>
    );
};

export default PaymentManagement;
