import { useEffect } from "react";
import { Row, Col, Card, Typography, Table, Tag, Space } from "antd";
import {
    BookOutlined,
    UnlockOutlined,
    LockOutlined,
    DownloadOutlined,
    CalendarOutlined,
    FilePdfOutlined,
    VideoCameraOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import adminTheme from "../../../theme/adminTheme";
import { useDispatch, useSelector } from "react-redux";
import { fetchContentCount } from "../../../adminSlices/contentSlice";

const { Title, Text } = Typography;
const { token } = adminTheme;

const UiUxDashboard = () => {
    const dispatch = useDispatch();

    const { contentStats, loading } = useSelector((state) => state.content);

    useEffect(() => {
        dispatch(fetchContentCount());
    }, [dispatch]);


    // ================ DUMMY DATA =================
    const dataSource = [
        {
            key: 1,
            title: "Engineering Entrance Exam Guide 2026",
            type: "PDF",
            category: "Study Material",
            program: "Engineering Career Path",
            access: "Free",
            downloads: 234,
            date: "2026-01-12",
        },
        {
            key: 2,
            title: "Career Assessment Video Tutorial",
            type: "Video",
            category: "Tutorial",
            program: "Career Assessment",
            access: "Paid",
            downloads: 45,
            date: "2026-01-10",
        },
        {
            key: 3,
            title: "Guide to Coding Interviews",
            type: "PDF",
            category: "Guide",
            program: "Career Prep",
            access: "Free",
            downloads: 150,
            date: "2026-01-08",
        },
        {
            key: 4,
            title: "Soft Skills Video Workshop",
            type: "Video",
            category: "Tutorial",
            program: "Career Development",
            access: "Free",
            downloads: 67,
            date: "2026-01-06",
        },
        {
            key: 5,
            title: "Mathematics Problem Solving Guide",
            type: "PDF",
            category: "Study Material",
            program: "Engineering Prep",
            access: "Paid",
            downloads: 89,
            date: "2026-01-05",
        },
    ];

    // ================== STATS ==================
    const stats = [
        {
            title: "Total Content",
            value: contentStats?.total_content || 0,
            icon: <BookOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
        },
        {
            title: "Free Content",
            value: contentStats?.free_content || 0,
            subtitle: "Accessible to all users",
            icon: <UnlockOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
        },
        {
            title: "Premium Content",
            value: contentStats?.premium_content || 0,
            subtitle: "Paid package only",
            icon: <LockOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
        },
        {
            title: "Total Downloads",
            value: contentStats?.total_download || 0,
            icon: <DownloadOutlined style={{ fontSize: 20, color: token.colorPrimary }} />,
        },
    ];
    // ================== RECENT UPLOADS ==================
    const recentUploads = [...dataSource]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5); // latest 5 uploads

    const recentColumns = [
        { title: "Title", dataIndex: "title", key: "title", render: (text) => <Text strong>{text}</Text> },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (type) =>
                type === "PDF" ? (
                    <Tag icon={<FilePdfOutlined />} color="error">
                        PDF
                    </Tag>
                ) : (
                    <Tag icon={<VideoCameraOutlined />} color="purple">
                        Video
                    </Tag>
                ),
        },
        { title: "Category", dataIndex: "category", key: "category" },
        { title: "Program", dataIndex: "program", key: "program" },
        {
            title: "Access",
            dataIndex: "access",
            key: "access",
            render: (access) =>
                access === "Free" ? (
                    <Tag icon={<UnlockOutlined />} color="success">
                        Free
                    </Tag>
                ) : (
                    <Tag icon={<LockOutlined />} color="warning">
                        Paid
                    </Tag>
                ),
        },
        {
            title: "Uploaded Date",
            dataIndex: "date",
            key: "date",
            render: (date) => (
                <Space>
                    <CalendarOutlined />
                    {dayjs(date).format("YYYY-MM-DD")}
                </Space>
            ),
        },
        {
            title: "Downloads",
            dataIndex: "downloads",
            key: "downloads",
            render: (d) => (
                <Space>
                    <DownloadOutlined />
                    {d}
                </Space>
            ),
        },
    ];

    return (
        <div style={{ fontFamily: token.fontFamily, padding: 0 }}>
            {/* DASHBOARD HEADER */}
            <Row justify="space-between" align="middle" style={{ marginBottom: 15 }}>
                <Col>
                    <Title level={3}>Dashboard</Title>
                </Col>
            </Row>

            {/* STATS CARDS */}
            {/* <Row gutter={[16, 16]} style={{ marginBottom: 24 }}> */}
            <Row gutter={[32, 24]} justify="center" style={{ marginBottom: 24 }}>
                {stats.map((item, index) => (
                    // <Col xs={24} sm={12} md={12} lg={6} key={index}>
                    <Col xs={24} sm={12} md={12} lg={10} key={index}>
                        <Card
                            bordered={false}
                            style={{
                                height: 140,
                                borderRadius: token.borderRadius,
                                boxShadow: token.boxShadow,
                                background: token.colorBgContainer,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    height: "100%",
                                }}
                            >
                                <div>
                                    <Text style={{ color: token.colorTextSecondary, fontSize: 17 }}>
                                        {item.title}
                                    </Text>
                                    <Title level={3} style={{ margin: "6px 0" }}>
                                        {item.value}
                                    </Title>
                                    {item.subtitle && (
                                        <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                                            {item.subtitle}
                                        </Text>
                                    )}
                                </div>
                                <div style={{ fontSize: 28 }}>{item.icon}</div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* RECENT UPLOADS TABLE */}
            {/* <Row>
                <Col xs={24}>
                    <Card
                        title="Recent Uploads"
                        style={{
                            borderRadius: token.borderRadius,
                            boxShadow: token.boxShadow,
                            marginBottom: 24,
                        }}
                    >
                        <Table
                            columns={recentColumns}
                            dataSource={recentUploads}
                            pagination={false}
                            rowKey="key"
                            scroll={{ x: "max-content" }}
                        />
                    </Card>
                </Col>
            </Row> */}
        </div>
    );
};

export default UiUxDashboard;