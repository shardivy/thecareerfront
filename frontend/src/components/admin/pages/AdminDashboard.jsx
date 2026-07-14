import React, { useEffect, useState } from "react";
import { Row, Col, Card, Typography, Table, Tag, Spin, Alert, Space, Select } from "antd";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title as ChartTitle, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { FileTextOutlined, TeamOutlined, CalendarOutlined, CreditCardOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardStats, fetchLeadStats, fetchActivityLogs } from "../../../adminSlices/dashboardSlice";
import { getProfile } from "../../../adminSlices/profileSlice";
import adminTheme from "../../../theme/adminTheme";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, ChartTitle, Tooltip, Legend);

const { Title, Text } = Typography;
const { Option } = Select;

const AdminDashboard = () => {

  const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(5);
  
const dispatch = useDispatch();
 const { stats: dashboardStats, leadStats, activities, loading, error } =
  useSelector((state) => state.dashboard);

  const { profile } = useSelector((state) => state.profile);

  const [chartPeriod, setChartPeriod] = useState("monthly"); // Weekly / Monthly / Yearly
    const role = localStorage.getItem("adminRole");

  
   
useEffect(() => {
  dispatch(fetchDashboardStats());
  dispatch(fetchLeadStats(chartPeriod));
    dispatch(fetchActivityLogs()); 
  dispatch(getProfile());
}, [dispatch, chartPeriod]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        padding: 24,
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spin size="large" tip="Loading dashboard data..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: 24, minHeight: '100vh' }}>
        <Alert
          message="Error Loading Dashboard"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  // =================== SUMMARY STATS ===================
  const stats = [
    {
      title: "Total Enquiries",
      value: dashboardStats?.leads?.total_leads || 0,
      converted: dashboardStats?.leads?.total_converted || 0,
      nonConverted: dashboardStats?.leads?.total_enquiry || 0,
      icon: <FileTextOutlined />,
    },
    {
      title: "Registered Students",
      value: dashboardStats?.students?.registered_students || 0,
      icon: <TeamOutlined />,
    },
   ...((role === "superadmin")
    ? [
        {
          title: "Expected Revenue",
          value: `₹${dashboardStats?.payments?.total_expected || 0}`,
          icon: <CreditCardOutlined />,
        },
        {
          title: "Total Collected",
          value: `₹${dashboardStats?.payments?.total_collected || 0}`,
          icon: <CreditCardOutlined />,
        },
      ]
    : []),
    {
      title: "Today's Sessions",
      value: dashboardStats?.today_sessions?.total || 0,
      booked: dashboardStats?.today_sessions?.booked || 0,
      completed: dashboardStats?.today_sessions?.completed || 0,
      icon: <CalendarOutlined />,
    },
    {
      title: "Exam Applicants",
      value: dashboardStats?.user_exams?.total || 0,
      inProgress: dashboardStats?.user_exams?.in_progress || 0,
      completed: dashboardStats?.user_exams?.completed || 0,
      icon: <CalendarOutlined />,
    },
    {
      title: "Reports",
      value: dashboardStats?.reports?.pending_uploaded || 0,
      uploadPending: dashboardStats?.reports?.pending_uploaded || 0,
      icon: <FileTextOutlined />,
    },
    {
      title: "Total Content",
      value: dashboardStats?.content?.total || 0,
      free: dashboardStats?.content?.free || 0,
      premium: dashboardStats?.content?.premium || 0,
      icon: <FileTextOutlined />,
    },
  ];

  // =================== CHART DATA ===================
  const monthlyEnquiries = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Total Enquiries",
        data: [62, 58, 78, 75, 92, 98],
        backgroundColor: adminTheme.token.colorPrimary,
        barThickness: 40,
        maxBarThickness: 50,
      },
      {
        label: "Converted",
        data: [30, 25, 40, 38, 50, 55],
        backgroundColor: adminTheme.token.colorSuccess,
        barThickness: 40,
        maxBarThickness: 50,
      },
    ],
  };

const getEnquiriesData = () => {
  if (!leadStats) {
    return {
      labels: [],
      datasets: [],
    };
  }

  return {
    labels: leadStats.labels || [],
    datasets: [
      {
        label: "Total Enquiries",
        data: leadStats.total || [],
        backgroundColor: adminTheme.token.colorPrimary,
        barPercentage: 0.4,       // ✅ controls bar width
        categoryPercentage: 0.6,  // ✅ controls group spacing
      },
      {
        label: "Total Converted",
        data: leadStats.converted || [],
        backgroundColor: adminTheme.token.colorSuccess,
        barPercentage: 0.4,
        categoryPercentage: 0.6,
      },
    ],
  };
};

const barOptions = {
  responsive: true,
  plugins: {
    legend: { position: "top" },
  },
  scales: {
    x: {
      stacked: false, // ❌ make sure not stacked
    },
    y: {
      beginAtZero: true,
    },
  },
};

const collectedRevenue = dashboardStats?.payments?.total_collected || 0;
const pendingRevenue = dashboardStats?.payments?.total_pending || 0;
const paymentComparison = {
  labels: ["Collected Revenue", "Pending Revenue"],
  datasets: [
    {
      data: [
        collectedRevenue,
        pendingRevenue,
      ],
      backgroundColor: [
        adminTheme.token.colorSuccess,
        adminTheme.token.colorPrimary,
      ],
    },
  ],
};

  const paymentChartOptions = {
    cutout: "50%",
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: { enabled: true },
    },
  };

  const breakAfterWords = (text = "", count = 8) => {
  const words = text.split(" ");
  let lines = [];

  for (let i = 0; i < words.length; i += count) {
    lines.push(words.slice(i, i + count).join(" "));
  }

  return lines.join("\n");
};

  // =================== RECENT ACTIVITIES ===================
const formatTime = (dateString) => {
  if (!dateString) return "-";

  const now = new Date();
  const past = new Date(dateString);
  const diff = Math.floor((now - past) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

  return `${Math.floor(diff / 86400)} day ago`;
};

const recentActivities = (activities || []).map((item) => ({
  key: item.id,

  // ✅ Proper readable activity
activity:
  item.description ||
  `${item.action?.toUpperCase()} ${item.model_name} (ID: ${item.object_id})`,

  // ✅ formatted time
  time: formatTime(item.created_at),

  // ✅ status
  status: item.action ? item.action.toUpperCase() : "UNKNOWN",
}));

  const activityColumns = [
   {
  title: "Activity",
  dataIndex: "activity",
  key: "activity",
  width:500,
  render: (text) => (
    <div style={{ whiteSpace: "pre-line" }}>
      {breakAfterWords(text, 8)}
    </div>
  ),
},
    { title: "Time", dataIndex: "time", key: "time" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
     render: (status) => {
  let color = "default";

  if (status.includes("CREATE")) color = "green";
  else if (status.includes("DELETE")) color = "red";
  else if (status.includes("UPDATE")) color = "blue";

  return <Tag color={color}>{status}</Tag>;
},
    },
  ];

  return (
    <div style={{ padding: 1, minHeight: "100vh" }}>
      <Title level={3} style={{ color: adminTheme.token.colorTextBase }}>Dashboard</Title>

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
              <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 24, color: adminTheme.token.colorPrimary, marginRight: 8 }}>
                  {item.icon}
                </span>
                <Text type="secondary" style={{ color: adminTheme.token.colorTextSecondary }}>
                  {item.title}
                </Text>
              </div>
              <Title level={3} style={{ margin: "4px 0", color: adminTheme.token.colorTextBase }}>
                {item.value}
              </Title>

              {/* CONDITIONAL DETAILS */}
              {item.title === "Total Enquiries" && (
                <Space size="large" style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 12, color: adminTheme.token.colorSuccess }}>
                    Converted: {item.converted}
                  </Text>
                  <Text style={{ fontSize: 12, color: adminTheme.token.colorSuccess }}>
                    Non-Converted: {item.nonConverted}
                  </Text>
                </Space>
              )}

              {item.title === "Today's Sessions" && (
                <Space size="large" style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 12, color: adminTheme.token.colorSuccess }}>
                    Completed: {item.completed}
                  </Text>
                  <Text style={{ fontSize: 12, color: adminTheme.token.colorSuccess }}>
                    Booked: {item.booked}
                  </Text>
                </Space>
              )}

              {item.title === "Exam Applicants" && (
                <Space size="large" style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 12, color: adminTheme.token.colorSuccess }}>
                    In Progress: {item.inProgress}
                  </Text>
                  <Text style={{ fontSize: 12, color: adminTheme.token.colorSuccess }}>
                    Completed: {item.completed}
                  </Text>
                </Space>
              )}

              {item.title === "Total Content" && (
                <Space size="large" style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 12, color: adminTheme.token.colorSuccess }}>
                    Free: {item.free}
                  </Text>
                  <Text style={{ fontSize: 12, color: adminTheme.token.colorSuccess }}>
                    Premium: {item.premium}
                  </Text>
                </Space>
              )}

              {item.title === "Reports" && (
  <Space size="large" style={{ marginTop: 6 }}>
    <Text style={{ fontSize: 12, color: adminTheme.token.colorSuccess }}>
      Pending Upload: {item.uploadPending}
    </Text>
  </Space>
)}
            </Card>
          </Col>
        ))}
      </Row>

      {/* =================== CHARTS =================== */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={16}>
          <Card
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Monthly Enquiries</span>
                <Select
                  value={chartPeriod}
                  onChange={(value) => setChartPeriod(value)}
                  options={[
                    { label: "Weekly", value: "weekly" },
                    { label: "Monthly", value: "monthly" },
                    { label: "Yearly", value: "yearly" },
                  ]}
                  size="small"
                  style={{ width: 120 }}
                />
              </div>
            }
            style={{ borderRadius: adminTheme.token.borderRadius, boxShadow: adminTheme.token.boxShadow }}
          >
            <Bar data={getEnquiriesData()} options={barOptions}/>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            title="Payment Comparison"
            style={{
              borderRadius: adminTheme.token.borderRadius,
              boxShadow: adminTheme.token.boxShadow,
              height: 440,
            }}
          >
            <Doughnut data={paymentComparison} options={paymentChartOptions} />
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
              style={{ borderColor: adminTheme.token.colorBorder }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;