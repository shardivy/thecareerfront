import React, { useState } from "react";
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
} from "antd";
import {
    CalendarFilled,
    CheckCircleOutlined,
    BellOutlined,
    EyeOutlined,
    EditOutlined,
    PlusOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import AddEventModal from "../modals/AddEventModal";


const { Title, Text } = Typography;

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

    /* ================= STATS ================= */
    const stats = [
        {
            title: "Total Events",
            value: 12,
            icon: <CalendarFilled style={{ fontSize: 22, color: token.colorPrimary }} />,
        },
        {
            title: "Upcoming Events",
            value: 4,
            subText: `Seminar: ${3} | Webinar: ${1}`,
            icon: <ClockCircleOutlined style={{ fontSize: 22, color: token.colorSuccess }} />,
        },
        {
            title: "Completed",
            value: 8,
            icon: <CheckCircleOutlined style={{ fontSize: 22, color: token.colorWarning }} />,
        },
        {
            title: "Reminders Sent",
            value: 150,
            icon: <BellOutlined style={{ fontSize: 22, color: token.colorError }} />,
        },
    ];

    const data = [
        {
            id: 1,
            eventName: "Career Guidance Webinar",
            eventType: "webinar",
            link: "https://meet.google.com/xyz",
            date: "2026-04-10",
            time: "10:00 AM",
            person: "John Doe",
            email: "john@example.com",
            sessionType: "free",
            attendees: 120,
            status: "upcoming",
        },
        {
            id: 2,
            eventName: "UI/UX Seminar",
            eventType: "seminar",
            venue: "Pune Office",
            date: "2026-04-05",
            time: "02:00 PM",
            person: "Jane Smith",
            email: "jane@example.com",
            sessionType: "paid",
            attendees: 80,
            status: "completed",
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

    const filteredData = data.filter((item) =>
        (item.eventName || item.title || "")
            .toLowerCase()
            .includes(search.toLowerCase())
    );

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
            width: 150,
            render: (_, record) => (
                <div>
                    <Text strong>{record.eventName}</Text>
                    <div>
                        {record.date} | {record.time}
                    </div>
                </div>
            ),
        },

        /* EVENT TYPE */
        {
            title: "Type",
            dataIndex: "eventType",
            render: (type) => (
                <Tag color={type === "webinar" ? "blue" : "purple"}>
                    {type === "webinar" ? "Webinar" : "Seminar"}
                </Tag>
            ),
        },

        /* LINK / VENUE */
        {
            title: "Location / Link",
            width: 150,
            render: (_, record) => {
                if (record.eventType === "webinar") {
                    return (
                        <a
                            href={record.link}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontWeight: 500 }}
                        >
                            View Link
                        </a>
                    );
                }

                return (
                    <div>
                        {formatText(record.venue).map((line, index) => (
                            <div key={index}>{line}</div>
                        ))}
                    </div>
                );
            },
        },
        /* ORGANIZER */
        {
            title: "Organizer",
            render: (_, record) => (
                <div>
                    <Text>{record.person}</Text>
                    <div>
                        {record.email}
                    </div>
                </div>
            ),
        },

        /* SESSION TYPE */
        {
            title: "Session",
            dataIndex: "sessionType",
            render: (type) => (
                <Tag color={type === "free" ? "green" : "gold"}>
                    {type === "free" ? "Free" : "Paid"}
                </Tag>
            ),
        },

        /* ATTENDEES */
        // {
        //     title: "Attendees",
        //     dataIndex: "attendees",
        // },

        /* STATUS */
        {
            title: "Status",
            render: (_, record) => (
                <Tag color={record.status === "completed" ? "success" : "processing"}>
                    {record.status === "completed" ? "Completed" : "Upcoming"}
                </Tag>
            ),
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

                    <Button icon={<BellOutlined />}>
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
                                boxShadow: token.boxShadowSecondary,
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
            {/* TABLE */}
            <Card>
                <Row gutter={[12, 12]} style={{ marginBottom: 16 }} align="middle">

                    {/* 🔍 SEARCH */}
                    <Col xs={24} sm={12} md={8}>
                        <Input
                            placeholder="Search events..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            allowClear
                            size="large"
                        />
                    </Col>

                    {/* ➕ ADD BUTTON (RIGHT SIDE) */}
                    <Col xs={24} sm={12} md={8} style={{ marginLeft: "auto" }}>
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
