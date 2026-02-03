import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Row,
  Col,
  Typography,
  Badge,
  Grid,
  theme,
} from "antd";
import {
  BookOutlined,
  ContainerOutlined,
  FileTextOutlined,
  LockOutlined,
} from "@ant-design/icons";
import JourneySteps from "./JourneySteps";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const StudentDashboard = () => {
  const screens = useBreakpoint();
  const navigate = useNavigate();

  // 🔥 Access theme tokens
  const { token } = theme.useToken();

  return (
    <div
      style={{
        padding: screens.xs ? "8px" : "30px 20px",
        maxWidth: 1200,
        margin: "0 auto",
        // background: token.colorBgLayout,
        color:"black",
      }}
    >
      {/* ===================== PROGRESS STEPS ===================== */}
      <div style={{ overflowX: "auto", paddingBottom: 10 ,}}>
        <JourneySteps currentStep={1} />
      </div>

      {/* ===================== CHOOSE YOUR PATH ===================== */}
      <Card
        style={{
          margin: "32px 0",
          borderRadius: token.borderRadiusLG,
          background: `linear-gradient(90deg, ${token.colorPrimary}, ${token.colorInfo})`,
          color: token.colorTextSecondary,
        }}
      >
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Title level={4} style={{ color: token.colorTextPrimary }}>
              Choose Your Path
            </Title>
            <Text style={{ color: token.colorTextTertiary, fontSize: 15 }}>
              Select a program and package to begin your career counselling journey
            </Text>
          </Col>

          <Col
            xs={24}
            md={8}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <Button
              size="large"
              onClick={() => navigate("/student/program")}
            >
              View Programs & Packages →
            </Button>
          </Col>
        </Row>
      </Card>

      {/* ===================== DASHBOARD CARDS ===================== */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            onClick={() => navigate("/student/freecontent")}
            style={{ borderRadius: token.borderRadiusLG }}
          >
            <Row align="middle" justify="space-between">
              <BookOutlined
                style={{ fontSize: 26, color: token.colorSuccess }}
              />
              <Badge
                count="Free"
                style={{ backgroundColor: token.colorSuccess }}
              />
            </Row>
            <Title level={5} style={{ marginTop: 16 }}>
              Free Content Library
            </Title>
            <Text type="colorTextSecondary">
              Explore free videos, articles and guidance
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            onClick={() => navigate("/student/program")}
            style={{ borderRadius: token.borderRadiusLG }}
          >
            <ContainerOutlined
              style={{ fontSize: 26, color: token.colorPrimary }}
            />
            <Title level={5} style={{ marginTop: 16 }}>
              My Program
            </Title>
            <Text type="colorTextSecondary">
              View your enrolled counselling program
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            onClick={() => navigate("/student/report-management")}
            style={{ borderRadius: token.borderRadiusLG }}
          >
            <FileTextOutlined
              style={{ fontSize: 26, color: token.colorInfo }}
            />
            <Title level={5} style={{ marginTop: 16 }}>
              My Assessment Report
            </Title>
            <Text type="colorTextSecondary">
              Download your career assessment results
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card hoverable style={{ borderRadius: token.borderRadiusLG }}>
            <LockOutlined
              style={{ fontSize: 26, color: token.colorError }}
            />
            <Title level={5} style={{ marginTop: 16 }}>
              Locked Content
            </Title>
            <Text type="colorTextSecondary">
              Complete steps to unlock premium features
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentDashboard;
