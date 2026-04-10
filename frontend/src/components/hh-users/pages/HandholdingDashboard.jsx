import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    Row,
    Col,
    Typography,
    Grid,
    theme,
    Progress,
    Button,
    Modal ,
} from "antd";
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CalendarOutlined,
    TrophyOutlined,
    PlayCircleOutlined,
    VideoCameraOutlined,
    CreditCardOutlined,
} from "@ant-design/icons";
import HhJourneySteps from "./HhJourneySteps";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const HandholdingDashboard = () => {
    const screens = useBreakpoint();
    const navigate = useNavigate();
    const { token } = theme.useToken();

    /* ================= DUMMY DATA ================= */
    const totalSessions = 10;
    const completedSessions = 4;

    const progressPercent = Math.round(
        (completedSessions / totalSessions) * 100
    );

    /* ================= STATS ================= */
    const stats = [
        {
            title: "Completed Sessions",
            value: completedSessions,
            icon: <CheckCircleOutlined />,
            color: token.colorSuccess,
        },
        {
            title: "Pending Sessions",
            value: totalSessions - completedSessions,
            icon: <ClockCircleOutlined />,
            color: token.colorWarning,
        },
        {
            title: "Next Session",
            value: "12 Apr",
            icon: <CalendarOutlined />,
            color: token.colorPrimary,
        },
        {
            title: "Progress",
            value: `${progressPercent}%`,
            icon: <TrophyOutlined />,
            color: token.colorInfo,
        },
    ];

    return (
        <div
            style={{
                padding: screens.xs ? "12px 12px 24px" : "30px 20px",
                maxWidth: 1200,
                margin: "0 auto",
            }}
        >
            {/* ===================== JOURNEY PROGRESS ===================== */}

            <HhJourneySteps
                totalSessions={10}
                completedSessions={4}
            />

            {/* ===================== CTA CARD ===================== */}
            <Card
                style={{
                    margin: "24px 0",
                    borderRadius: token.borderRadiusLG,
                    background: `linear-gradient(90deg, ${token.colorPrimary}, ${token.colorInfo})`,
                }}
            >
                <Row align="middle" justify="space-between" gutter={[16, 16]}>
                    <Col xs={24} md={16}>
                        <Title level={4} style={{ color: "#fff" }}>
                            Continue Your Handholding Journey
                        </Title>
                        <Text style={{ color: "#f0f0f0" }}>
                            Complete your next session to stay on track
                        </Text>
                    </Col>

                    <Col
                        xs={24}
                        md={8}
                        style={{
                            display: "flex",
                            justifyContent: screens.xs ? "center" : "flex-end",
                        }}
                    >
                        <Button
                            size="large"
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={() => navigate("/handholding/sessions")}
                            style={{
                                width: screens.xs ? "100%" : "auto",
                            }}
                        >
                            Go to Sessions
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* ===================== STATS ===================== */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {stats.map((stat, index) => (
                    <Col xs={24} sm={12} md={6} key={index}>
                        <Card
                            hoverable
                            style={{ borderRadius: token.borderRadiusLG }}
                        >
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ fontSize: 26, color: stat.color }}>
                                    {stat.icon}
                                </div>
                                <div>
                                    <Text type="colorTextSecondary">{stat.title}</Text>
                                    <Title level={4} style={{ margin: 0 }}>
                                        {stat.value}
                                    </Title>
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* ===================== FEATURE CARDS ===================== */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        hoverable
                        onClick={() => navigate("/handholding/sessions")}
                        style={{ borderRadius: token.borderRadiusLG }}
                    >
                        <VideoCameraOutlined
                            style={{ fontSize: 26, color: token.colorPrimary }}
                        />
                        <Title level={5} style={{ marginTop: 16 }}>
                            My Sessions
                        </Title>
                    </Card>
                </Col>

               <Col xs={24} sm={12} md={8}>
        <Card
          hoverable
          onClick={() => navigate("/handholding/certificates")}
          style={{ borderRadius: token.borderRadiusLG }}
        >
          <TrophyOutlined
            style={{ fontSize: 26, color: "#faad14" }}
          />
          <Title level={5} style={{ marginTop: 16 }}>
            Certificates
          </Title>
        </Card>
      </Col>

 <Col xs={24} sm={12} md={8}>
        <Card
          hoverable
          onClick={() => navigate("/handholding/payments")}
          style={{ borderRadius: token.borderRadiusLG}}
        >
          <CreditCardOutlined
            style={{ fontSize: 26, color: "#52c41a" }}
          />
          <Title level={5} style={{ marginTop: 16 }}>
            Payments
          </Title>
        </Card>
      </Col>
            </Row>
        </div>
    );
};

export default HandholdingDashboard;