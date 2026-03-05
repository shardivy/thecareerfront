import React, { useState, useEffect} from "react";
import {
  Layout,
  Menu,
  Drawer,
  Button,
  Grid,
  Breadcrumb,
  Avatar,
  Typography,
  Dropdown,
  Space,
  Badge,
  theme,
} from "antd";
import {
  UserOutlined,
  MenuOutlined,
  LogoutOutlined,
  FileTextFilled,
  CalendarFilled,
  DashboardFilled,
  ReadFilled,
  ScheduleFilled,
  BookFilled,
  BellOutlined,
  CreditCardFilled,
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import NotificationDropdown from "../components/student/pages/Notification";
import { useDispatch, useSelector } from "react-redux";
import { getProfile, clearProfile } from "../adminSlices/profileSlice";

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;
const { Text } = Typography;

const SIDEBAR_WIDTH = 260;

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const { token } = theme.useToken();
  const dispatch = useDispatch();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const { profile } = useSelector((state) => state.profile);
  const tokenFromStorage = localStorage.getItem("studentToken");
  const selectedPackage = localStorage.getItem("selectedPackage");
  
  // Check if package exists in profile or localStorage
  const hasPackage = !!(profile?.package_id || selectedPackage);
  
  // Check if only program exists but no package
  const hasOnlyProgram = !!(profile?.program) && !hasPackage;

  const username = localStorage.getItem("username") || "Student";

  // Function to truncate name for smaller screens
  const truncatedUsername = screens.xs
    ? username.length > 10
      ? `${username.slice(0, 10)}...`
      : username
    : username;

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  const normalizedProgram = profile?.program?.trim().toLowerCase();

  const showExamAndReport =
    normalizedProgram === "pg counselling" ||
    normalizedProgram === "8-12 aptitude test";

  /* ===================== NOTIFICATIONS ===================== */
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Exam Scheduled",
      description: "Your exam is scheduled on 25 Jan",
      type: "exam",
      read: false,
    },
    {
      id: 2,
      title: "New Content Added",
      description: "New videos added in Content Library",
      type: "content",
      read: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ===================== BREADCRUMB ===================== */
  const breadcrumbNameMap = {
    "/student/dashboard": "Dashboard",
    "/student/program": "Program & Services",
    "/student/exam-management": "Exam Management",
    "/student/report-management": "Report Management",
    "/student/slot-booking": "Slot Booking",
    "/student/freecontent": "Free Content",
    "/student/content-library": "Content Library",
    "/student/student-profile": "Profile",
    "/student/payments":"Payments",
    "/student/payment-page":"Payment",
  };

  const pathSnippets = location.pathname.split("/").filter(Boolean);
  const extraBreadcrumbItems = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join("/")}`;
    return {
      key: url,
      title: breadcrumbNameMap[url] || url,
    };
  });

  const breadcrumbItems = [{ key: "/student/dashboard", title: ".." }, ...extraBreadcrumbItems.slice(1)];

/* ===================== MENU ITEMS ===================== */
const menuItems = [
  // Dashboard - Always first
  {
    key: "/student/dashboard",
    icon: <DashboardFilled />,
    label: "Dashboard",
    onClick: () => {
      navigate("/student/dashboard");
      setDrawerVisible(false);
    },
    style: { marginBottom: 12, marginTop: 24 },
  },

  // Program & Services - Always second
  {
    key: "/student/program",
    icon: <ReadFilled />,
    label: "Program & Services",
    onClick: () => {
      navigate("/student/program");
      setDrawerVisible(false);
    },
    style: { marginBottom: 12 },
  },
];

// Content Library item
const contentLibraryItem = {
  key: "/student/content-library",
  icon: <BookFilled />,
  label: "Content Library",
  onClick: () => {
    navigate("/student/content-library");
    setDrawerVisible(false);
  },
  style: { marginBottom: 12 },
};

// Insert Content Library based on user type
if (!hasPackage) {
  // Free user → insert at 3rd position
  menuItems.splice(2, 0, contentLibraryItem);
}

// Package-dependent items
if (hasPackage) {
  const packageItems = [
    ...(showExamAndReport
      ? [
          {
            key: "/student/exam-management",
            icon: <CalendarFilled />,
            label: "Exam Management",
            onClick: () => {
              navigate("/student/exam-management");
              setDrawerVisible(false);
            },
            style: { marginBottom: 12 },
          },
          {
            key: "/student/report-management",
            icon: <FileTextFilled />,
            label: "Report Management",
            onClick: () => {
              navigate("/student/report-management");
              setDrawerVisible(false);
            },
            style: { marginBottom: 12 },
          },
        ]
      : []),

    // Slot Booking
    {
      key: "/student/slot-booking",
      icon: <ScheduleFilled />,
      label: "Slot Booking",
      onClick: () => {
        navigate("/student/slot-booking");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

    // Payments
    {
      key: "/student/payments",
      icon: <CreditCardFilled />,
      label: "Payments",
      onClick: () => {
        navigate("/student/payments");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },
  ];

  // Paid user → insert Content Library as 2nd last item
  const insertIndex = packageItems.length - 1; // after Slot Booking & Payments
  packageItems.splice(insertIndex, 0, contentLibraryItem);

  // Merge package items
  menuItems.push(...packageItems);
}


  const handleLogout = () => {
    // Remove authentication & user info
    // localStorage.removeItem("studentToken");
    // localStorage.removeItem("username");

    // // Remove program/package stored from profile
    // localStorage.removeItem("selectedProgram");
    // localStorage.removeItem("selectedPackage");
    // localStorage.removeItem("studentId");

     localStorage.clear();
      // 2. Optional: reset Redux state
    dispatch(clearProfile());
    
    navigate("/", { replace: true });
  };

  const MenuContent = (
    <Menu
      mode="inline"
      items={menuItems}
      selectedKeys={[location.pathname]}
      style={{ background: "transparent", border: "none" }}
      onClick={() => setDrawerVisible(false)}
    />
  );

  const userMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "Profile",
        onClick: () => navigate("/student/student-profile"),
      },
    ],
  };

  const LogoutButton = ({ isMobile }) => (
    <div style={{ padding: 16, marginBottom: isMobile ? 24 : 0 }}>
      <Button
        type="primary"
        icon={<LogoutOutlined />}
        block
        onClick={handleLogout}
        style={{
          height: 40,
          color: token.colorPrimary,
          borderRadius: token.borderRadius,
          backgroundColor: "#FFFFFF",
        }}
      >
        Logout
      </Button>
    </div>
  );

  const isProfilePage = location.pathname === "/student/student-profile";

  return (
    <Layout style={{ minHeight: "100vh", background: token.colorBgLayout }}>
      {!isProfilePage && !screens.xs && (
        <Sider
          width={SIDEBAR_WIDTH}
          style={{
            background: token.colorPrimary,
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            boxShadow: token.boxShadow,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <h2 style={{ textAlign: "center", padding: 16, margin: 0, color: "#FFFFFF" }}>
              Student Panel
            </h2>

            <div style={{ flex: 1, padding: "8px 12px" }}>{MenuContent}</div>

            <LogoutButton />
          </div>
        </Sider>
      )}

      {screens.xs && !isProfilePage && (
        <Drawer
          title="Student Panel"
          placement="right"
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          bodyStyle={{ padding: 0, display: "flex", flexDirection: "column" }}
        >
          <div style={{ flex: 1, padding: 16 }}>{MenuContent}</div>
          <LogoutButton isMobile />
        </Drawer>
      )}

      <Layout style={{ marginLeft: !isProfilePage && !screens.xs ? SIDEBAR_WIDTH : 0 }}>
        {!isProfilePage && (
          <Header
            style={{
              background: token.colorBgContainer,
              padding: "0 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: token.boxShadow,
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <Breadcrumb items={breadcrumbItems} />

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Dropdown
                trigger={["click"]}
                dropdownRender={() => (
                  <NotificationDropdown
                    notifications={notifications}
                    setNotifications={setNotifications}
                  />
                )}
              >
                <Badge count={unreadCount} size="small">
                  <BellOutlined style={{ fontSize: 20, cursor: "pointer" }} />
                </Badge>
              </Dropdown>

              <Dropdown menu={userMenu} trigger={["click"]}>
                <Space style={{ cursor: "pointer" }}>
                  <Text strong>{truncatedUsername}</Text>
                  <Avatar
                    icon={<UserOutlined />}
                    style={{ background: token.colorPrimary }}
                  />
                </Space>
              </Dropdown>

              {screens.xs && (
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setDrawerVisible(true)}
                />
              )}
            </div>
          </Header>
        )}

        <Content
          style={{
            margin: 16,
            padding: 16,
            background: "#eeeeef",
            borderRadius: token.borderRadius,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}