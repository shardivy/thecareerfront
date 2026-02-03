import React, { useState } from "react";
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
  ConfigProvider,
  Badge,
} from "antd";
import {
  UserOutlined,
  MenuOutlined,
  LogoutOutlined,
  DashboardFilled,
  TeamOutlined,
  BookFilled,
  FileTextFilled,
  CalendarFilled,
  CreditCardFilled,
  SettingFilled,
  CloseOutlined,
  BellOutlined,
  PlusCircleOutlined,
  PlusCircleFilled,
  ClockCircleFilled,
  SolutionOutlined,
  UnorderedListOutlined,
  PhoneFilled,
  NotificationFilled,
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import adminTheme from "../theme/adminTheme";
import { logout } from "../adminSlices/authSlice";
import NotificationDropdown from "../components/student/pages/Notification";
import { s, style } from "framer-motion/client";
import { color } from "chart.js/helpers";

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;
const { Text } = Typography;

const SIDEBAR_WIDTH = 260;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const dispatch = useDispatch();

  const userEmail = localStorage.getItem("userEmail") || "";
  const storedAdminName = localStorage.getItem("adminName") || "";
  const role = localStorage.getItem("adminRole"); // "admin" | "superadmin" | "counsellor"

  // Branding label: show 'Counsellor Dashboard' for counsellors and 'Admin Dashboard' otherwise
  const isCounsellorRole = role === "lead_counsellor" || role === "counsellor";
  const brandingLabel = isCounsellorRole ? "Counsellor Dashboard" : "Admin Dashboard";

  // Prefer profile name after profile is loaded/updated; fall back to email
  const profile = useSelector((state) => state.profile.profile);

  // Compute display label: if profile has a name, show it; otherwise show email
  const profileHasName = profile && (profile.first_name || profile.last_name || profile.name);
  const displayLabel = profileHasName
    ? `${(profile.first_name || "").trim()} ${(profile.last_name || "").trim()}`.trim() || profile.name
    : (storedAdminName || userEmail || "Admin");

  // Truncate to 5 characters for header display and show full value on hover
  const truncate = (s, n = 5) => (s && s.length > n ? `${s.slice(0, n)}...` : s);
  const truncatedLabel = truncate(displayLabel, 8);
  // Slightly longer truncation for mobile so the label is still readable
  const truncatedLabelMobile = truncate(displayLabel, 8);

  // Header padding responsive
  const headerPadding = screens.xs ? "0 8px" : "0 16px";

  // Keep adminName in localStorage up-to-date when profile name changes
  React.useEffect(() => {
    if (profileHasName) {
      const nameToStore = displayLabel;
      localStorage.setItem("adminName", nameToStore);
    }
  }, [profileHasName, displayLabel]);

  /* ===================== NOTIFICATIONS ===================== */
  const [notifications, setNotifications] = useState([
    { id: 1, title: "New Student Registered", description: "John Doe joined today", type: "student", read: false },
    { id: 2, title: "Payment Received", description: "Payment received from Jane Smith", type: "payment", read: false },
  ]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ===================== BREADCRUMB ===================== */
  const breadcrumbNameMap = {
    "/admin/profile": "Profile",
    "/admin/dashboard": "Dashboard",
    "/admin/enquiry-leads": "Enquiry & Leads",
    "/admin/users": "Users",
    "/admin/programs": "Programs",
    "/admin/exams": "Exams",
    "/admin/reportsmanagement": "Report Management",
    "/admin/paymentmanagement": "Payment Management",
    "/admin/slotbooking": "Slot Booking Management",
    "/admin/createslot": "Create Slot ",
    "/admin/followupManagement": "Follow Up Management",
    "/admin/contentManagement": "Content Management",
    "/admin/examManagements": "User Request List",
    "/admin/examlist": "Exam List",
    "/admin/employeeList": "Employee List",
    "/admin/notificationManagement": "Notification Management",
    "/admin/settings": "Settings",


    // "/admin/leadlist": "Lead List",
  };

  const pathSnippets = location.pathname.split("/").filter(Boolean);
  const extraBreadcrumbItems = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join("/")}`;
    return {
      key: url,
      title: breadcrumbNameMap[url] || url,
    };
  });

  const breadcrumbItems = [
    { key: "/admin/dashboard", title: ".." },
    ...extraBreadcrumbItems.slice(1),
  ];

  /* ===================== MENU ITEMS ===================== */
  const menuItems = [
    {
      key: "/admin/dashboard",
      icon: <DashboardFilled />,
      label: "Dashboard",
      onClick: () => {
        navigate("/admin/dashboard");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12, marginTop: 24 },
    },
    /* ================= ADMIN / SUPERADMIN ONLY ================= */
  (role === "admin" || role === "superadmin") && {
      key: "/admin/enquiry-leads",
      icon: <FileTextFilled />,
      label: "Enquiry & Leads",
      onClick: () => {
        navigate("/admin/enquiry-leads");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

 (role === "admin" || role === "superadmin" || role === "lead_counsellor" || role === "counsellor" ) && {
      key: "/admin/users",
      icon: <TeamOutlined />,
      label: "Users",
      onClick: () => {
        navigate("/admin/users");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

  (role === "admin" || role === "superadmin") && {
      key: "/admin/programs",
      icon: <BookFilled />,
      label: "Program & Packages",
      onClick: () => {
        navigate("/admin/programs");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

  (role === "admin" || role === "superadmin") && {
      key: "/admin/paymentmanagement",
      icon: <CreditCardFilled />,
      label: "Payments",
      onClick: () => {
        navigate("/admin/paymentmanagement");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

  (role === "admin" || role === "superadmin") && {
      key: "exam-management",
      icon: <CalendarFilled />,
      label: "Exam Management",
      children: [
        {
          key: "/admin/examlist",
          icon: <UnorderedListOutlined />,
          label: "Exam List",
          onClick: () => {
            navigate("/admin/examlist");
            setDrawerVisible(false);
          },
        },

    (role === "admin" || role === "superadmin") && {
          key: "/admin/examManagements",
          icon: <SolutionOutlined />,
          label: "User Request List",
          onClick: () => {
            navigate("/admin/examManagements");
            setDrawerVisible(false);
          },
        },
      ],
      style: { marginBottom: 12 },
    },


  (role === "admin" || role === "superadmin") && {
      key: "/admin/reportsmanagement",
      icon: <FileTextFilled />,
      label: "Report Management",
      onClick: () => {
        navigate("/admin/reportsmanagement");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

  (role === "admin" || role === "superadmin") && {
      key: "slot-booking",
      icon: <CalendarFilled />,
      label: "Slot Booking",
      children: [
        {
          key: "/admin/createslot",
          icon: <PlusCircleFilled />,
          label: "Create Slot",
          onClick: () => {
            navigate("/admin/createslot");
            setDrawerVisible(false);
          },
        },
        {
          key: "/admin/slotbooking",
          icon: <ClockCircleFilled />,
          label: "Slot Booking",
          onClick: () => {
            navigate("/admin/slotbooking");
            setDrawerVisible(false);
          },
        },
      ],
    },

  (role === "admin" || role === "superadmin") &&
    {
      key: "/admin/followupManagement",
      icon: <PhoneFilled />,
      label: "Follow-Up Management",
      onClick: () => {
        navigate("/admin/followupManagement");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

    (role === "admin" || role === "superadmin") && {
      key: "/admin/content-management",
      icon: <BookFilled />,
      label: "Content Management",
      onClick: () => {
        navigate("/admin/contentManagement");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

  (role === "admin" || role === "superadmin") &&{
      key: "/admin/notificationManagement",
      icon: <NotificationFilled />,
      label: "Notification Management",
      onClick: () => {
        navigate("/admin/notificationManagement");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

      (role === "admin" || role === "superadmin") && {
      key: "employee-management",
      icon: <TeamOutlined />,
      label: "Employee Management",
      children: [
        {
          key: "/admin/employeeList",
          icon: <UnorderedListOutlined />,
          label: "Employee List",
          onClick: () => {
            navigate("/admin/employeeList");
            setDrawerVisible(false);
          },
        },
      ],
    },

  //    (role === "lead_counsellor" || role === "counsellor") &&{
  //   key: "/admin/leadlist",
  //   icon: <UnorderedListOutlined />,
  //   label: "Lead List",
  //   onClick: () => {
  //     navigate("/admin/leadlist");
  //     setDrawerVisible(false);
  //   },
  //   style: { marginBottom: 12 },
  // },



    // {
    //   key: "/admin/settings",
    //   icon: <SettingFilled />,
    //   label: "Settings",
    //   onClick: () => {
    //     navigate("/admin/settings");
    //     setDrawerVisible(false);
    //   },
    //   style: { marginBottom: 12 },
    // },
  ];

  /* ===================== LOGOUT ===================== */
  const handleLogout = () => {
    // Clear stored tokens and user info
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("adminName");
    // legacy key
    localStorage.removeItem("adminToken");

    // Clear redux auth state
    dispatch(logout());

    navigate("/", { replace: true });
    setDrawerVisible(false);
  };

  const MenuContent = (
    <Menu
      mode="inline"
      items={menuItems}
      selectedKeys={[location.pathname]}
      style={{
        background: "transparent",
        border: "none",
        color: "#fff",
      }}
      className="admin-sidebar-menu"
    />
  );

  const userMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "Profile",
        onClick: () => navigate("/admin/profile"),
      },
    ],
  };

  const LogoutButton = ({ isMobile }) => (
    <div style={{ padding: 16, marginBottom: isMobile ? 24 : 0 }}>
      <Button
        type="primary"
        icon={<LogoutOutlined />}
        onClick={handleLogout}
        block
        style={{
          background: adminTheme.token.colorBgContainer,
          borderColor: adminTheme.token.colorPrimary,
          height: 40,
          borderRadius: 10,
          color: adminTheme.token.colorInfo,
        }}
      >
        Logout
      </Button>
    </div>
  );

  return (
    <ConfigProvider theme={adminTheme}>
      <Layout style={{ minHeight: "100vh" }}>
        {/* ===================== SIDEBAR ===================== */}
        {!screens.xs && (
          <Sider
            width={SIDEBAR_WIDTH}
            style={{
              background: adminTheme.token.colorPrimary,
              position: "fixed",
              left: 0,
              top: 0,
              bottom: 0,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {/* BRANDING */}
              <div style={{ padding: "24px 16px", textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: adminTheme.token.colorTextPrimary,
                    lineHeight: "26px",
                  }}
                >
                  Career Counselling
                </div>

                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    marginTop: 6,
                    color: adminTheme.token.colorTextTertiary,
                    letterSpacing: "0.6px",
                    textTransform: "uppercase",
                  }}
                >
                  {brandingLabel}
                </div>
              </div>


              {/* MENU - scrollable with small width scrollbar */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "10px 16px",
                  scrollbarWidth: "thin", // Firefox
                }}
              >
                {MenuContent}

                <style>
                  {`
      /* Chrome, Edge, Safari */
      div::-webkit-scrollbar {
        width: 6px;
      }
      div::-webkit-scrollbar-track {
        background: transparent;
      }
      div::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.3);
        border-radius: 3px;
      }
      div::-webkit-scrollbar-thumb:hover {
        background-color: rgba(0, 0, 0, 0.5);
      }
    `}
                </style>
              </div>


              <LogoutButton />
            </div>
          </Sider>
        )}

        {/* ===================== MOBILE DRAWER ===================== */}
        {screens.xs && (
          <Drawer
            placement="right"
            open={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            closable={false}
            title={
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: adminTheme.token.colorTextPrimary,
                  }}
                >
                  Career Counselling
                </div>
                <div
                  style={{
                    fontSize: 12,
                    marginTop: 4,
                    color: adminTheme.token.colorTextTertiary,
                    letterSpacing: "0.6px",
                  }}
                >
                  {brandingLabel}
                </div>
              </div>
            }
            extra={
              <Button
                type="text"
                onClick={() => setDrawerVisible(false)}
                icon={<CloseOutlined />}
                style={{
                  color: adminTheme.token.colorTextPrimary,
                  fontSize: 18,
                }}
              />
            }
            styles={{
              header: {
                background: adminTheme.token.colorPrimary,
                borderBottom: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              },
              body: {
                background: adminTheme.token.colorPrimary,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              },
            }}
          >
            <div style={{ flex: 1, padding: "10px 16px" }}>
              {MenuContent}
            </div>

            <LogoutButton isMobile />
          </Drawer>
        )}


        {/* ===================== MAIN LAYOUT ===================== */}
        <Layout style={{ marginLeft: screens.xs ? 0 : SIDEBAR_WIDTH }}>
          <Header
            style={{
              background: adminTheme.token.colorBgContainer,
              padding: headerPadding,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: adminTheme.token.boxShadow,
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            {!screens.xs ? (
              <Breadcrumb items={breadcrumbItems} />
            ) : (
              <Text strong style={{ fontSize: 16 }}>{brandingLabel}</Text>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

              {/* 🔔 NOTIFICATIONS */}
              <Dropdown
                trigger={["click"]}
                dropdownRender={() => <NotificationDropdown notifications={notifications} setNotifications={setNotifications} />}
              >
                <span>
                  <Badge count={unreadCount} size="small">
                    <BellOutlined style={{ fontSize: 20, cursor: "pointer" }} />
                  </Badge>
                </span>
              </Dropdown>

              {/* 👤 USER */}
              <Dropdown menu={userMenu} trigger={["click"]}>
                <Space style={{ cursor: "pointer", alignItems: "center", gap: 8 }}>
                  <Text
                    strong
                    title={displayLabel}
                    style={{ fontSize: screens.xs ? 12 : undefined, maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    {screens.xs ? truncatedLabelMobile : truncatedLabel}
                  </Text>
                  <Avatar
                    size={screens.xs ? 32 : 40}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: adminTheme.token.colorPrimary }}
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

          <Content
            style={{
              margin: 16,
              padding: 16,
              background: "#eeeeef",
              borderRadius: 12,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default AdminLayout;
