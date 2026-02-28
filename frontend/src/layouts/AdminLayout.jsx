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
  AppstoreFilled,
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
  const isUiUxRole = role === "ui_ux";
  const brandingLabel = isCounsellorRole ? "Counsellor Dashboard" : isUiUxRole ? "UI/UX Dashboard" : "Admin Dashboard";

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
    "/s-admin/profile": "Profile",
    "/s-admin/dashboard": "Dashboard",
    "/s-admin/enquiry-leads": "Enquiry & Leads",
    "/s-admin/users": "Users",
    "/s-admin/programs": "Programs & Services",
    "/s-admin/exams": "Exams",
    "/s-admin/reportsmanagement": "Report Management",
    "/s-admin/paymentmanagement": "Payment Management",
    "/s-admin/slotbooking": "Slot Booking Management",
    "/s-admin/createslot": "Create Slot ",
    "/s-admin/followupManagement": "Follow Up Management",
    "/s-admin/contentManagement": "Content Management",
    "/s-admin/examManagements": "User Request List",
    "/s-admin/examlist": "Exam List",
    "/s-admin/employeeList": "User List",
    "/s-admin/notificationManagement": "Notification Management",
    "/s-admin/settings": "Settings",

    "/s-admin/counsellor-dashboard": "Dashboard",
    "/s-admin/session-history": "Session History",

    "/s-admin/uiux-dashboard": "Dashboard",


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
    { key: "/s-admin/dashboard", title: ".." },
    ...extraBreadcrumbItems.slice(1),
  ];

  /* ===================== MENU ITEMS ===================== */
  const menuItems = [
    (role !== "counsellor" && role !== "ui_ux") && {
      key: "/s-admin/dashboard",
      icon: <DashboardFilled />,
      label: "Dashboard",
      onClick: () => {
        navigate("/s-admin/dashboard");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12, marginTop: 24 },
    },


    (role === "counsellor") && {
      key: "/s-admin/counsellor-dashboard",
      icon: <DashboardFilled />,
      label: "Dashboard",
      onClick: () => {
        navigate("/s-admin/counsellor-dashboard");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

    (role === "counsellor") && {
      key: "/s-admin/session-history",
      icon: <CalendarFilled />,
      label: "Session History",
      onClick: () => {
        navigate("/s-admin/session-history");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

    // (role === "admin" || role === "superadmin") && {
    (role === "ui_ux") && {
      key: "/s-admin/uiux-dashboard",
      icon: <DashboardFilled />,
      label: "Dashboard",
      onClick: () => {
        navigate("/s-admin/uiux-dashboard");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },


    /* ================= ADMIN / SUPERADMIN ONLY ================= */
    (role === "admin" || role === "superadmin") && {
      key: "/s-admin/enquiry-leads",
      icon: <FileTextFilled />,
      label: "Enquiry & Leads",
      onClick: () => {
        navigate("/s-admin/enquiry-leads");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

    (role === "admin" || role === "superadmin" || role === "lead_counsellor") && {
      key: "/s-admin/users",
      icon: <TeamOutlined />,
      label: "Students Enrolled",
      onClick: () => {
        navigate("/s-admin/users");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

    (role === "admin" || role === "superadmin") && {
      key: "/s-admin/programs",
      icon: <BookFilled />,
      label: "Program & Services",
      onClick: () => {
        navigate("/s-admin/programs");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

    (role === "admin" || role === "superadmin") && {
      key: "/s-admin/paymentmanagement",
      icon: <CreditCardFilled />,
      label: "Payments",
      onClick: () => {
        navigate("/s-admin/paymentmanagement");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

    (role === "admin" || role === "superadmin") && {
      key: "exam-management",
      icon: <CalendarFilled />,
      label: (
        <div style={{ lineHeight: "20px" }}>
          <div>Aptitude Test</div>
          <div>Management</div>
        </div>
      ),
      children: [
        {
          key: "/s-admin/examlist",
          icon: <UnorderedListOutlined />,
          label: "Exam List",
          onClick: () => {
            navigate("/s-admin/examlist");
            setDrawerVisible(false);
          },
        },

        (role === "admin" || role === "superadmin") && {
          key: "/s-admin/examManagements",
          icon: <SolutionOutlined />,
          label: "User Request List",
          onClick: () => {
            navigate("/s-admin/examManagements");
            setDrawerVisible(false);
          },
        },
      ],
      style: { marginBottom: 12 },
    },


    (role === "admin" || role === "superadmin") && {
      key: "/s-admin/reportsmanagement",
      icon: <FileTextFilled />,
      label: "Aptitude Test Reports",
      onClick: () => {
        navigate("/s-admin/reportsmanagement");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

    (role === "admin" || role === "superadmin") && {
      key: "slot-booking",
      icon: <CalendarFilled />,
      // label: "Counselling Slot Booking",
      label: (
        <div style={{ lineHeight: "20px" }}>
          <div>Counselling</div>
          <div>Slot Booking</div>
        </div>
      ),

      children: [
        {
          key: "/s-admin/createslot",
          icon: <PlusCircleFilled />,
          label: "Create Slot",
          onClick: () => {
            navigate("/s-admin/createslot");
            setDrawerVisible(false);
          },
        },
        {
          key: "/s-admin/slotbooking",
          icon: <ClockCircleFilled />,
          label: "Slot Booking",
          onClick: () => {
            navigate("/s-admin/slotbooking");
            setDrawerVisible(false);
          },
        },
      ],
    },

    // (role === "admin" || role === "superadmin") &&
    //   {
    //     key: "/s-admin/followupManagement",
    //     icon: <PhoneFilled />,
    //     label: "Follow-Up Management",
    //     onClick: () => {
    //       navigate("/s-admin/followupManagement");
    //       setDrawerVisible(false);
    //     },
    //     style: { marginBottom: 12 },
    //   },

    (role === "admin" || role === "superadmin" || role === "ui_ux") && {
      key: "/s-admin/content-management",
      icon: <BookFilled />,
      label: "Content Management",
      onClick: () => {
        navigate("/s-admin/contentManagement");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

    // (role === "admin" || role === "superadmin") &&{
    //     key: "/s-admin/notificationManagement",
    //     icon: <NotificationFilled />,
    //     label: "Notification Management",
    //     onClick: () => {
    //       navigate("/s-admin/notificationManagement");
    //       setDrawerVisible(false);
    //     },
    //     style: { marginBottom: 12 },
    //   },

    (role === "admin" || role === "superadmin") && {
      key: "/s-admin/userManagement",
      icon: <TeamOutlined />,
      label: "User Management",
      children: [
        {
          key: "/s-admin/employeeList",
          icon: <UnorderedListOutlined />,
          label: "User List",
          onClick: () => {
            navigate("/s-admin/employeeList");
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
        onClick: () => navigate("/s-admin/profile"),
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
              {/* <Dropdown
                trigger={["click"]}
                dropdownRender={() => <NotificationDropdown notifications={notifications} setNotifications={setNotifications} />}
              >
                <span>
                  <Badge count={unreadCount} size="small">
                    <BellOutlined style={{ fontSize: 20, cursor: "pointer" }} />
                  </Badge>
                </span>
              </Dropdown> */}

              <span>
                <Badge count={unreadCount} size="small">
                  <BellOutlined
                    style={{
                      fontSize: 20,
                      cursor: "default",
                      opacity: 0.6,   // optional: show disabled look
                    }}
                  />
                </Badge>
              </span>

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
