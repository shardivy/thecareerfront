// src/pages/AdminDashboard.jsx
import React from "react";
import { Row, Col, Card, Typography, Table, Tag } from "antd";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title as ChartTitle, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { FileTextOutlined, TeamOutlined, CalendarOutlined, CreditCardOutlined } from "@ant-design/icons";

import adminTheme from "../../../theme/adminTheme";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, ChartTitle, Tooltip, Legend);

const { Title, Text } = Typography;

const AdminDashboard = () => {
  // =================== SUMMARY STATS ===================
  const stats = [
    { title: "Total Enquiries", value: 482, change: "+12.5%", icon: <FileTextOutlined /> },
    { title: "Registered Users", value: 342, change: "+8.2%", icon: <TeamOutlined /> },
    { title: "Payment Pending", value: 28, change: "", icon: <CreditCardOutlined /> },
    { title: "Today's Sessions", value: 12, change: "5 completed, 7 scheduled", icon: <CalendarOutlined /> },
    { title: "Exams Pending", value: 15, change: "", icon: <CalendarOutlined /> },
    { title: "Exams Completed", value: 127, change: "", icon: <CalendarOutlined /> },
    { title: "Follow-Ups Due", value: 23, change: "", icon: <FileTextOutlined /> },
    { title: "Reports Pending", value: 8, change: "", icon: <FileTextOutlined /> },
  ];

  // =================== CHART DATA ===================
  const monthlyEnquiries = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Enquiries",
        data: [62, 58, 78, 75, 92, 98],
        backgroundColor: adminTheme.token.colorPrimary,
      },
    ],
  };

  const enquirySources = {
    labels: ["Website", "WhatsApp", "Call", "Walk-in"],
    datasets: [
      {
        data: [45, 30, 15, 10],
        backgroundColor: [
          adminTheme.token.colorPrimary,
          adminTheme.token.colorSuccess,
          adminTheme.token.colorWarning,
          adminTheme.token.colorInfo,
        ],
      },
    ],
  };

  // =================== RECENT ACTIVITIES ===================
  const recentActivities = [
    { key: 1, activity: "Priya Sharma - Payment Verified ₹15,000", time: "2 min ago", status: "Completed" },
    { key: 2, activity: "New Enquiry - Rajesh Kumar (WhatsApp)", time: "15 min ago", status: "New" },
    { key: 3, activity: "Session Completed - Anjali Verma", time: "1 hour ago", status: "New" },
    { key: 4, activity: "Exam Completed - Vikram Singh", time: "2 hours ago", status: "Pending" },
    { key: 5, activity: "Report Uploaded - Neha Patel", time: "3 hours ago", status: "Completed" },
  ];

  const activityColumns = [
    { title: "Activity", dataIndex: "activity", key: "activity" },
    { title: "Time", dataIndex: "time", key: "time" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color =
          status === "Completed"
            ? adminTheme.token.colorSuccess
            : status === "New"
              ? adminTheme.token.colorInfo
              : adminTheme.token.colorWarning;
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: 1, minHeight: "100vh" }}>
      <Title level={3} style={{ color: adminTheme.token.colorTextBase }}>Dashboard</Title>
      {/* <Text style={{ color: adminTheme.token.colorTextSecondary }}>
        Welcome back! Here's what's happening today.
      </Text> */}

      {/* =================== SUMMARY CARDS =================== */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {stats.map((item, index) => (
          <Col xs={24} sm={12} md={12} lg={6} key={index}>
            <Card
              style={{
                height: 150,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
                borderRadius: adminTheme.token.borderRadius,
                boxShadow: adminTheme.token.boxShadow,
              }}
            >
              {/* ICON + TITLE */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 24, color: adminTheme.token.colorPrimary, marginRight: 8 }}>
                  {item.icon}
                </span>
                <Text type="secondary" style={{ color: adminTheme.token.colorTextSecondary }}>
                  {item.title}
                </Text>
              </div>

              {/* VALUE */}
              <Title level={3} style={{ margin: "4px 0", color: adminTheme.token.colorTextBase }}>
                {item.value}
              </Title>

              {/* CHANGE */}
              {item.change && <Text style={{ color: adminTheme.token.colorSuccess }}>{item.change}</Text>}
            </Card>
          </Col>
        ))}
      </Row>

      {/* =================== CHARTS =================== */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={16}>
          <Card
            title="Monthly Enquiries"
            style={{ borderRadius: adminTheme.token.borderRadius, boxShadow: adminTheme.token.boxShadow }}
          >
            <Bar data={monthlyEnquiries} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title="Enquiry Sources"
            style={{ borderRadius: adminTheme.token.borderRadius, boxShadow: adminTheme.token.boxShadow }}
          >
            <Pie data={enquirySources} />
          </Card>
        </Col>
      </Row>

      {/* =================== RECENT ACTIVITIES =================== */}
      <Row style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title="Recent Activity"
            style={{ borderRadius: adminTheme.token.borderRadius, boxShadow: adminTheme.token.boxShadow }}
          >
            <Table
              columns={activityColumns}
              dataSource={recentActivities}
              pagination={false}
              scroll={{ x: "max-content" }}
              style={{ borderColor: adminTheme.token.colorBorder }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
