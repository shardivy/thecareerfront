import React, { useState, useEffect } from "react";
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
    theme,
    Select,
    message,
} from "antd";
import {
    CalendarFilled,
    CheckCircleOutlined,
    BellOutlined,
    EyeOutlined,
    EditOutlined,
    PlusOutlined,
    ClockCircleOutlined,
    CalendarOutlined,
} from "@ant-design/icons";
import AddEventModal from "../modals/AddEventModal";
import { getEvents } from "../../../adminSlices/eventSlice";
import { useDispatch, useSelector } from "react-redux";
import { sendReminder, getEventDashboardCount } from "../../../adminSlices/eventSlice";


const { Title, Text } = Typography;
const { Option } = Select;

const SeminarWebinarManagement = () => {
    const { token } = theme.useToken();

    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5,
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add"); // add | edit | view
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [typeFilter, setTypeFilter] = useState(null);
    const [loadingId, setLoadingId] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);

    const dispatch = useDispatch();

    const { eventList = [], loading, dashboardCount } = useSelector(
        (state) => state.event
    );

    useEffect(() => {
        dispatch(getEvents());
        dispatch(getEventDashboardCount());
    }, []);

    const handleSendReminder = async (id) => {
        try {
            setLoadingId(id); // ✅ set only this row loading

            await dispatch(sendReminder(id)).unwrap();

            message.success("Reminder sent successfully");
        } catch (err) {
            message.error(err || "Failed to send reminder");
        } finally {
            setLoadingId(null); // ✅ reset after done
        }
    };


    const seminarCount =
        dashboardCount?.upcoming_events?.event_type?.find(
            (i) => i.type === "seminar"
        )?.count || 0;

    const webinarCount =
        dashboardCount?.upcoming_events?.event_type?.find(
            (i) => i.type === "webinar"
        )?.count || 0;

    const upcomingTotal = dashboardCount?.upcoming_events?.total || 0;


    const paidCount =
        dashboardCount?.session_type?.find((i) => i.type === "paid")?.count || 0;

    const freeCount =
        dashboardCount?.session_type?.find((i) => i.type === "free")?.count || 0;


    /* ================= STATS ================= */
    const stats = [
        {
            title: "Total Events",
            value: dashboardCount?.total_events || 0,
            icon: <CalendarFilled style={{ fontSize: 22, color: token.colorPrimary }} />,
        },
        {
            title: "Upcoming Events",
            value: upcomingTotal, // ✅ FIXED
            subText: `Seminar: ${seminarCount} | Webinar: ${webinarCount}`, // ✅ FIXED
            icon: <ClockCircleOutlined style={{ fontSize: 22, color: token.colorSuccess }} />,
        },
        {
            title: "Event Pricing",
            value: `${freeCount} / ${paidCount}`,
            subText: `Free: ${freeCount} | Paid: ${paidCount}`,
            icon: <CalendarOutlined style={{ fontSize: 22, color: token.colorError }} />,
        },
        {
            title: "Completed",
            value: dashboardCount?.completed_events || 0,
            icon: <CheckCircleOutlined style={{ fontSize: 22, color: token.colorWarning }} />,
        },
    ];

    const formatText = (text, wordsPerLine = 4) => {
        if (!text) return "-";

        const words = text.split(" ");
        const lines = [];

        for (let i = 0; i < words.length; i += wordsPerLine) {
            lines.push(words.slice(i, i + wordsPerLine).join(" "));
        }

        return lines;
    };

    const filteredData = (Array.isArray(eventList) ? eventList : []).filter((item) => {
        const matchesSearch = (item.seminar_webinar_name || "")
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesType = !typeFilter || item.event_type === typeFilter;

        const matchesStatus =
            !statusFilter ||
            (statusFilter === "upcoming"
                ? item.session_status !== "completed"
                : item.session_status === "completed");

        return matchesSearch && matchesType && matchesStatus;
    });

    const formatLabel = (text) => {
        if (!text) return "-";

        if (text.toLowerCase() === "upi") return "UPI";

        return text.charAt(0).toUpperCase() + text.slice(1);
    };

    const columns = [
        {
            title: "Sr No",
            width: 60,
            render: (_, __, index) =>
                (pagination.current - 1) * pagination.pageSize + index + 1,
        },

        /* EVENT NAME */
        {
            title: "Event",
            width: 160,
            render: (_, record) => (
                <div>
                    <Text strong>{record.seminar_webinar_name}</Text>
                    <div>
                        {record.event_start_date} | {record.event_end_date}
                    </div>
                </div>
            ),
        },

        /* EVENT TYPE */
        {
            title: "Type",
            dataIndex: "event_type",
            render: (type) => (
                <Tag color={type === "webinar" ? "blue" : "purple"}>
                    {type === "webinar" ? "Webinar" : "Seminar"}
                </Tag>
            ),
        },

        /* LINK / VENUE */
        {
            title: "Location / Link",
            width: 180,
            render: (_, record) => {
                if (record.event_type === "webinar") {
                    return record.registration_link ? (
                        <a
                            href={record.registration_link}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontWeight: 500 }}
                        >
                            View Link
                        </a>
                    ) : (
                        "-"
                    );
                }

                return (
                    <div>
                        <Text strong>{record.address || "-"}</Text>
                        <div style={{ fontSize: 12, color: "#888" }}>
                            {record.venue_type || ""}
                        </div>
                    </div>
                );
            },
        },

        /* ORGANIZER */
        {
            title: "Concerned Person",
            render: (_, record) => (
                <div>
                    <Text strong>{record.concerned_person_name}</Text>
                    <div>{record.concerned_person_email}</div>
                </div>
            ),
        },

        /* SESSION TYPE */
        {
            title: "Event Pricing",
            dataIndex: "is_paid",
            render: (isPaid) => (
                <Tag color={isPaid ? "gold" : "green"}>
                    {isPaid ? "Paid" : "Free"}
                </Tag>
            ),
        },

        /* PAYMENT INFO */
        {
            title: "Payment",
            render: (_, record) => {
                return (
                    <div>
                        <Text strong>{formatLabel(record.payment_type)}</Text>
                        <div>
                            ({record.payment_method ? formatLabel(record.payment_method) : "-"})
                        </div>
                    </div>
                );
            },
        },

        {
            title: "Status",
            render: (_, record) => {
                const status = record.session_status;

                return (
                    <Tag
                        color={
                            status === "completed"
                                ? "green"
                                : status === "upcoming"
                                    ? "blue"
                                    : "default"
                        }
                    >
                        {status
                            ? status.charAt(0).toUpperCase() + status.slice(1)
                            : "Upcoming"}
                    </Tag>
                );
            },
        },

        /* ACTIONS */
        {
            title: "Actions",
            render: (_, record) => (
                <Space wrap>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setSelectedEvent(record);
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
                            setSelectedEvent(record);
                            setModalMode("edit");
                            setIsModalOpen(true);
                        }}
                    >
                        Edit
                    </Button>

                    <Button
                        icon={<BellOutlined />}
                        loading={loadingId === record.id}
                        onClick={() => handleSendReminder(record.id)}
                    >
                        Send Reminder
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
                    <Title level={3}>Event Outreach Management</Title>
                </Col>

            </Row>

            {/* STATS */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                {stats.map((item, index) => (
                    <Col xs={24} sm={12} md={12} lg={6} key={index} style={{ display: "flex" }}>
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: 16,
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",

                                padding: "10px 14px",
                                width: "100%",
                                height: "100%", // ✅ Equal height
                            }}
                            bodyStyle={{
                                height: "100%", // ✅ Stretch content
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between", // ✅ Balanced spacing
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
                                {/* LEFT CONTENT */}
                                <div>
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            color: token.colorTextSecondary,
                                        }}
                                    >
                                        {item.title}
                                    </Text>

                                    <Title
                                        level={2}
                                        style={{
                                            margin: "4px 0",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {item.value}
                                    </Title>

                                    {item.subText && (
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: "#888",
                                            }}
                                        >
                                            {item.subText}
                                        </Text>
                                    )}
                                </div>

                                {/* RIGHT ICON */}
                                <div>{item.icon}</div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* TABLE */}
            <Card>
                <Row gutter={[12, 12]} style={{ marginBottom: 16 }} align="middle">

                    {/* 🔍 SEARCH */}
                    <Col xs={24} sm={12} md={10}>
                        <Input
                            placeholder="Search events..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            allowClear
                            size="large"
                        />
                    </Col>

                    {/* 🎯 TYPE FILTER */}
                    <Col xs={24} sm={12} md={4}>
                        <Select
                            value={typeFilter}
                            onChange={(value) => setTypeFilter(value)}
                            allowClear
                            placeholder="Filter by Type"
                            size="large"
                            style={{ width: "100%" }}
                        >
                            <Option value="webinar">Webinar</Option>
                            <Option value="seminar">Seminar</Option>
                        </Select>
                    </Col>

                    {/* 📌 STATUS FILTER */}
                    <Col xs={24} sm={12} md={4}>
                        <Select
                            value={statusFilter}
                            onChange={(value) => setStatusFilter(value)}
                            allowClear
                            placeholder="Filter by Status"
                            size="large"
                            style={{ width: "100%" }}
                        >
                            <Option value="upcoming">Upcoming</Option>
                            <Option value="completed">Completed</Option>
                        </Select>
                    </Col>

                    {/* ➕ ADD BUTTON */}
                    <Col xs={24} sm={12} md={6} style={{ marginLeft: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setSelectedEvent(null);
                                    setModalMode("add");
                                    setIsModalOpen(true);
                                }}
                            >
                                Add Event
                            </Button>
                        </div>
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

            {/* ✅ MODAL */}
            <AddEventModal
                open={isModalOpen}
                mode={modalMode}
                data={selectedEvent}
                onCancel={() => {
                    setIsModalOpen(false);
                    setSelectedEvent(null);
                }}
            />
        </div>
    );
};

export default SeminarWebinarManagement;
