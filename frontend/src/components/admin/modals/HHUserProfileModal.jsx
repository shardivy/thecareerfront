import React from "react";
import {
    Modal,
    Typography,
    Row,
    Col,
    Descriptions,
    Tag,
    Divider,
    theme,
    Button,
} from "antd";

const { Title, Text } = Typography;

const HHUserProfileModal = ({ open, onClose, user }) => {
    const { token } = theme.useToken();

    if (!user) return null;

    const percent =
        (user.completedSessions / user.totalSessions) * 100;

    /* 🧠 MOCK SESSION HISTORY */
    const sessionHistory = Array.from(
        { length: user.completedSessions },
        (_, i) => ({
            title: `Session ${i + 1}`,
            status: "completed",
            date: "2026-03-30",
        })
    );

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={1000}
            centered
            title={<Title level={4}>User Session Profile</Title>}
        >
            <div style={{ maxHeight: "85vh", overflowY: "auto", paddingRight: 18 }}>
                {/* ================= DETAILS ================= */}
                <Row gutter={24}>
                    {/* USER DETAILS */}
                    <Col xs={24} md={12}>
                        <Title level={5}>User Details</Title>
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="Name">
                                {user.name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                                {user.email}
                            </Descriptions.Item>
                        </Descriptions>
                    </Col>

                    {/* PROGRAM DETAILS (NEW) */}
                    <Col xs={24} md={12}>
                        <Title level={5}>Program Details</Title>
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="Program">
                                {user.program || "-"}
                            </Descriptions.Item>

                            <Descriptions.Item label="Counselling Service">
                                {user.package || "-"}
                            </Descriptions.Item>

                            <Descriptions.Item label="Preferred Counselling Mode">
                                {user.preferred_counselling_mode ? (
                                    <Tag
                                        color={
                                            user.preferred_counselling_mode.toLowerCase() === "online"
                                                ? "blue"
                                                : user.preferred_counselling_mode.toLowerCase() === "offline"
                                                    ? "green"
                                                    : "default"
                                        }
                                    >
                                        {user.preferred_counselling_mode.toUpperCase()}
                                    </Tag>
                                ) : (
                                    <Tag>Not Specified</Tag>
                                )}
                            </Descriptions.Item>

                            <Descriptions.Item label="Payment Status">
                                <Tag
                                    color={
                                        user.paymentStatus === "Fully Paid"
                                            ? "success"
                                            : user.paymentStatus === "Partial Paid"
                                                ? "warning"
                                                : "error"
                                    }
                                >
                                    {user.paymentStatus}
                                </Tag>
                            </Descriptions.Item>

                            <Descriptions.Item label="Certification">
                                <Tag
                                    color={
                                        user.certificationStatus === "issued"
                                            ? "success"
                                            : "warning"
                                    }
                                >
                                    {user.certificationStatus === "issued"
                                        ? "Issued"
                                        : "Pending"}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>
                    </Col>
                </Row>

                <Divider />

                {/* ================= SESSION PROGRESS JOURNEY ================= */}
                <Title level={5}>Session Progress Journey</Title>

                <div
                    style={{
                        marginTop: 16,
                        background: token.colorBgContainer,
                        padding: 24,
                        borderRadius: 16,
                        border: `1px solid ${token.colorBorder}`,
                        overflowX: "auto",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            minWidth: user.totalSessions * 100,
                        }}
                    >
                        {Array.from({ length: user.totalSessions }, (_, index) => {
                            const stepNo = index + 1;

                            const isCompleted = index < user.completedSessions;
                            const isActive = index === user.completedSessions;

                            // 🎨 STEP COLOR LOGIC
                            let stepColor = token.colorBorder;

                            if (isCompleted) {
                                stepColor = token.colorSuccess;
                            } else if (isActive) {
                                stepColor = token.colorPrimary;
                            }

                            // 🔗 CONNECTOR PROGRESS
                            let progressWidth = "0%";

                            if (isCompleted || isActive) {
                                progressWidth = "100%";
                            }

                            return (
                                <div
                                    key={index}
                                    style={{
                                        position: "relative",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        width: 140,
                                        flexShrink: 0,
                                        minHeight: 100,
                                    }}
                                >
                                    {/* CONNECTOR LINE */}
                                    {index !== 0 && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 20,
                                                left: "-70px",
                                                width: "140px",
                                                height: 4,
                                                background: token.colorBorder,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: "100%",
                                                    background: token.colorPrimary,
                                                    width: progressWidth,
                                                    transition: "width 0.3s ease",
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* STEP CIRCLE */}
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: "50%",
                                            fontWeight: 600,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: stepColor,
                                            color:
                                                stepColor === token.colorBorder
                                                    ? token.colorTextSecondary
                                                    : "#fff",
                                            zIndex: 1,
                                        }}
                                    >
                                        {isCompleted ? "✓" : stepNo}
                                    </div>

                                    {/* LABEL */}
                                    <div
                                        style={{
                                            marginTop: 10,
                                            fontSize: 13,
                                            textAlign: "center",
                                            maxWidth: 120,
                                        }}
                                    >
                                        Session {stepNo}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <Divider />

                {/* ================= SESSION HISTORY ================= */}
                <Title level={5}>Session History</Title>

                <div
                    style={{
                        marginTop: 20,
                        position: "relative",
                        paddingLeft: 30,
                        maxHeight: 360,
                        overflowY: "auto",
                    }}
                >
                    {/* VERTICAL LINE */}
                    <div
                        style={{
                            position: "absolute",
                            left: 15,
                            top: 0,
                            bottom: 0,
                            width: 3,
                            background: token.colorBorder,
                        }}
                    />

                    {Array.from({ length: user.totalSessions }, (_, index) => {
                        const stepNo = index + 1;
                        const isCompleted = index < user.completedSessions;
                        const isActive = index === user.completedSessions;

                        return (
                            <div
                                key={index}
                                style={{ position: "relative", marginBottom: 28 }}
                            >
                                {/* STEP CIRCLE */}
                                <div
                                    style={{
                                        position: "absolute",
                                        left: -2,
                                        top: 5,
                                        width: 30,
                                        height: 30,
                                        borderRadius: "50%",
                                        background: isCompleted
                                            ? token.colorSuccess
                                            : isActive
                                                ? token.colorPrimary
                                                : token.colorBorder,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#fff",
                                        fontWeight: 600,
                                        zIndex: 1,
                                    }}
                                >
                                    {isCompleted ? "✓" : stepNo}
                                </div>

                                {/* CARD */}
                                <div
                                    style={{
                                        marginLeft: 40,
                                        padding: 16,
                                        borderRadius: 12,
                                        background: token.colorBgContainer,
                                        border: `1px solid ${token.colorBorder}`,
                                        boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
                                    }}
                                >
                                    <Row justify="space-between" align="middle">
                                        <Col>
                                            <Text strong>Session {stepNo}</Text>
                                        </Col>

                                        <Col style={{ display: "flex", gap: 8 }}>
                                            <Tag
                                                color={
                                                    isCompleted
                                                        ? "success"
                                                        : isActive
                                                            ? "processing"
                                                            : "default"
                                                }
                                            >
                                                {isCompleted
                                                    ? "Completed"
                                                    : isActive
                                                        ? "In Progress"
                                                        : "Pending"}
                                            </Tag>

                                            {/* 🔥 SHOW BUTTON ONLY IF NOT COMPLETED */}
                                            {!isCompleted && !isActive && (
                                                <Button
                                                    size="small"
                                                    type="primary"
                                                    onClick={() => {
                                                        // 👉 Navigate or trigger booking
                                                        console.log("Book session clicked for", stepNo);

                                                        // Example:
                                                        // navigate("/student/slot-booking");
                                                    }}
                                                >
                                                    Book Session
                                                </Button>
                                            )}
                                        </Col>
                                    </Row>

                                    <div
                                        style={{
                                            marginTop: 8,
                                            fontSize: 14,
                                            color: token.colorTextSecondary,
                                        }}
                                    >
                                        {isCompleted
                                            ? "Session completed successfully"
                                            : isActive
                                                ? "Currently ongoing session"
                                                : "Not started yet"}
                                    </div>

                                    <div
                                        style={{
                                            marginTop: 6,
                                            fontSize: 12,
                                            color: token.colorTextSecondary,
                                        }}
                                    >
                                        {isCompleted ? "30 Mar 2026" : "—"}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};

export default HHUserProfileModal;