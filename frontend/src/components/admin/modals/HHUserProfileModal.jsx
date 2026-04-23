import { useState, useEffect } from "react";
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
import HHSessionBookingModal from "../modals/HHSessionBookingModal";
import { useDispatch, useSelector } from "react-redux";
import { getParticipantSessions } from "../../../hhSlices/handholdingUsersSlice";
import { PlusOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const HHUserProfileModal = ({ open, onClose, user }) => {
    const { token } = theme.useToken();

    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [selectedSessionData, setSelectedSessionData] = useState(null);
    const dispatch = useDispatch();

    const {
        participantSessions,
        participantSessionsLoading,
    } = useSelector((state) => state.handholdingUsers);

    useEffect(() => {
        if (open && user?.id) {
            dispatch(getParticipantSessions(user.id));
        }
    }, [open, user, dispatch]);

    if (!user) return null;

    const totalSessions =
        participantSessions?.total_sessions ?? 0;

    const sessionHistory =
        participantSessions?.history ?? [];

    const journeyData = participantSessions?.journey ?? [];

    const completedSessions =
        sessionHistory.filter(s => s.status === "completed").length;


    const paymentStatusMap = {
        fully_paid: { label: "Fully Paid", color: "success" },
        partial_paid: { label: "Partial Paid", color: "warning" },
        not_paid: { label: "Not Paid", color: "error" },
    };

    const payment =
        paymentStatusMap[user.paymentStatus] || {
            label: user.paymentStatus || "Unknown",
            color: "default",
        };

    const allSteps = journeyData.map((item) => {
        let status = item.status?.toLowerCase();

        // 🔥 FIX: convert fully_paid → completed
        if (item.step?.toLowerCase() === "payment" && status === "fully_paid") {
            status = "completed";
        }

        return {
            label: item.step,
            status,
        };
    });
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
                                {user.program_name || "-"}
                            </Descriptions.Item>

                            <Descriptions.Item label="Counselling Service">
                                {user.package_name || "-"}
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
                                <Tag color={payment.color}>
                                    {payment.label}
                                </Tag>
                            </Descriptions.Item>


                            <Descriptions.Item label="Fees Paid">
                                ₹ {user.total_paid_amount ?? 0} / ₹ {user.package_price ?? 0}

                                {user.package_price > 0 && (
                                    <>
                                        <br />
                                        <Text type="colorTextSecondary">
                                            (Remaining: ₹ {user.remaining_amount ?? 0})
                                        </Text>
                                    </>
                                )}
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
                        {allSteps.map((step, index) => {
                            const stepNo = index + 1;

                            const journeyItem = journeyData[index];
                            // const status = journeyItem?.status?.toLowerCase();
                            const status = step.status;

                            const isCompleted = status === "completed";
                            const isActive = status === "in_progress" || status === "booked";
                            const isPartialPaid = status === "partial_paid";
                            const isNotPaid = status === "not_paid";
                            const isRescheduled = status === "rescheduled";

                            // 🎨 STEP COLOR LOGIC
                            let stepColor = token.colorBorder;

                            if (isCompleted) {
                                stepColor = token.colorSuccess;   // ✅ green
                            } else if (isPartialPaid) {
                                stepColor = "#fa8c16";            // 🟠 orange (AntD warning color)
                            } else if (isActive || isNotPaid) {
                                stepColor = token.colorPrimary;   // 🔵 blue
                            } else if (isRescheduled) {
                                stepColor = "#722ed1";            // 🟣 purple
                            }

                            // 🔗 CONNECTOR PROGRESS
                            let progressWidth = "0%";

                            if (isCompleted || isActive || isPartialPaid || isRescheduled || isNotPaid) {
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
                                        {step.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <Divider />

                {/* ================= SESSION HISTORY ================= */}
                <Title level={5}>Session Details</Title>

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

                    {sessionHistory.map((session, index) => {

                        const prevSession = sessionHistory[index - 1];

                        const isFirst = index === 0;

                        const isUnlocked =
                            isFirst ||
                            prevSession?.status?.toLowerCase() === "completed";

                        const isDisabled = !isUnlocked;

                        const status = session.status?.toLowerCase();

                        const isCompleted = status === "completed";
                        const isInProgress = status === "in_progress";
                        const isBooked = status === "booked";
                        const isRescheduled = status === "rescheduled";
                        const isNotBooked = status === "not_booked";

                        const isActive = isInProgress || isBooked;
                        const stepNo = index + 1;

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
                                                : isRescheduled
                                                    ? "#722ed1"
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
                                                            : isNotBooked
                                                                ? "default"
                                                                : isRescheduled
                                                                    ? "#722ed1"
                                                                    : "default"
                                                }
                                            >
                                                {isCompleted
                                                    ? "Completed"
                                                    : isInProgress
                                                        ? "In Progress"
                                                        : isBooked
                                                            ? "Booked"
                                                            : isNotBooked
                                                                ? "Not Booked"
                                                                : isRescheduled
                                                                    ? "Rescheduled"
                                                                    : "Pending"}
                                            </Tag>

                                            {/* 🔥 SHOW BUTTON ONLY IF NOT COMPLETED */}
                                            {status === "not_booked" && (
                                                <Button
                                                    size="small"
                                                    type="primary"
                                                    icon={<PlusOutlined />}
                                                    disabled={isDisabled}
                                                    onClick={() => {
                                                        if (isDisabled) {
                                                            message.warning("Complete previous session first");
                                                            return;
                                                        }

                                                        setSelectedSessionData({
                                                            participant_id: participantSessions.participant_id,
                                                            session_no: session.session_no,
                                                            status: session.status,
                                                            date: session.date,
                                                            student_name: user.name,
                                                            email: user.email,
                                                            phone: user.phone,
                                                            counsellor_name: session.counsellor,
                                                            slot: session.slot_id
                                                                ? {
                                                                    slot_id: session.slot_id,
                                                                    start_time: session.start_time,
                                                                    end_time: session.end_time,
                                                                    status: session.status,
                                                                    counsellor_name: session.counsellor,
                                                                }
                                                                : null,
                                                        });

                                                        setBookingModalOpen(true);
                                                    }}
                                                >
                                                    {isDisabled ? "Locked" : "Book Session"}
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
                                        {session.details || "No details available"}
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

            <HHSessionBookingModal
                visible={bookingModalOpen}
                onClose={() => setBookingModalOpen(false)}
                onSave={() => {
                    dispatch(getParticipantSessions(participantSessions.participant_id));
                }}

                data={selectedSessionData}
            />
        </Modal>
    );
};

export default HHUserProfileModal;
