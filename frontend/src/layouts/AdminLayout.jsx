import React, { useState, useEffect } from "react";
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
  Tag,
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
  BarChartOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import adminTheme from "../theme/adminTheme";
import { logout } from "../adminSlices/authSlice";
import NotificationDropdown from "../components/student/pages/Notification";
import { s, style } from "framer-motion/client";
import { color } from "chart.js/helpers";
import { fetchNotifications, markNotificationRead } from "../adminSlices/notificationSlice";

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
  const brandingLabel =
    role === "superadmin"
      ? "Superadmin Dashboard"
      : isCounsellorRole
        ? "Counsellor Dashboard"
        : isUiUxRole
          ? "UI/UX Dashboard"
          : "Admin Dashboard";

  const roleLabelMap = {
    superadmin: "Superadmin",
    admin: "Admin",
    counsellor: "Counsellor",
    lead_counsellor: "Lead Counsellor",
    ui_ux: "UI/UX",
  };

  const roleLabel = roleLabelMap[role] || role;

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



  const { list: notifications, loading } = useSelector(
    (state) => state.notifications
  );

  const [localNotifications, setLocalNotifications] = useState([]);

  useEffect(() => {
    if (role === "admin" || role === "superadmin") {
      // initial fetch
      dispatch(fetchNotifications());

      // poll every 30s
      const interval = setInterval(() => {
        dispatch(fetchNotifications());
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [dispatch, role]);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  /* ===================== NOTIFICATIONS ===================== */

  const unreadCount = localNotifications.filter(
    (n) => !n.is_read
  ).length;

  const handleRead = (id) => {
    dispatch(markNotificationRead(id)); // 🔥 API call

    // optional instant UI update
    setLocalNotifications((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

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
    "/s-admin/slotbooking": "Counselling Bookings",
    "/s-admin/createslot": "Create Counselling Slot ",
    "/s-admin/scheduler": "Scheduler",
    "/s-admin/followupManagement": "Follow Up Management",
    "/s-admin/contentManagement": "Content Management",
    "/s-admin/examManagements": "User Request List",
    "/s-admin/examlist": "Exam List",
    "/s-admin/employeeList": "User List",
    "/s-admin/notificationManagement": "Notification Management",
    "/s-admin/settings": "Settings",
    "/s-admin/collegeListAnalysis": "College List Analysis",

    "/s-admin/counsellor-dashboard": "Dashboard",
    "/s-admin/session-history": "Session History",

    "/s-admin/uiux-dashboard": "Dashboard",
    "/s-admin/sessions-history": "Session History",

    "/s-admin/hhManagement": "Handholding Management",

    "/s-admin/eventOutreach": "Event Outreach Management",
    "/s-admin/advertisement": "Advertisement Management",



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

    // (role === "admin" || role === "superadmin") && {
    //   key: "exam-management",
    //   icon: <CalendarFilled />,
    //   label: (
    //     <div style={{ lineHeight: "20px" }}>
    //       <div>Aptitude Test</div>
    //       <div>Management</div>
    //     </div>
    //   ),
    //   children: [
    // {
    //   key: "/s-admin/examlist",
    //   icon: <UnorderedListOutlined />,
    //   // label: "Exam List",
    //   label: (
    //     <div style={{ lineHeight: "20px" }}>
    //       <div>Aptitude Test</div>
    //       <div>List</div>
    //     </div>
    //   ),
    //   onClick: () => {
    //     navigate("/s-admin/examlist");
    //     setDrawerVisible(false);
    //   },
    // },

    //     (role === "admin" || role === "superadmin") && {
    //       key: "/s-admin/examManagements",
    //       icon: <SolutionOutlined />,
    //       label: "User Request List",
    //       onClick: () => {
    //         navigate("/s-admin/examManagements");
    //         setDrawerVisible(false);
    //       },
    //     },
    //   ],
    //   style: { marginBottom: 12 },
    // },

    (role === "admin" || role === "superadmin") && {
      key: "/s-admin/examManagements",
      icon: <CalendarFilled />,
      label: (
        <div style={{ lineHeight: "20px" }}>
          <div>Aptitude Test</div>
          <div>Management</div>
        </div>
      ),
      onClick: () => {
        navigate("/s-admin/examManagements");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },


    (role === "admin" || role === "superadmin") && {
      key: "/s-admin/reportsmanagement",
      icon: <FileTextFilled />,
      label: (
        <div style={{ lineHeight: "20px" }}>
          <div>Aptitude Test</div>
          <div>Reports</div>
        </div>
      ),
      onClick: () => {
        navigate("/s-admin/reportsmanagement");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },

    (role === "admin" || role === "superadmin") && {
      key: "/s-admin/collegeListAnalysis",
      icon: <BarChartOutlined />,
      // label: "College List Analysis",
      label: (
        <div style={{ lineHeight: "20px" }}>
          <div>College List</div>
          <div>Analysis</div>
        </div>
      ),
      onClick: () => {
        navigate("/s-admin/collegeListAnalysis");
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
      style: { marginBottom: 12 },

      children: [
        {
          key: "/s-admin/createslot",
          icon: <PlusCircleFilled />,
          // label: "Create Counselling Slot",
          label: (
            <div style={{ lineHeight: "20px" }}>
              <div>Create</div>
              <div>Counselling Slot</div>
            </div>
          ),
          onClick: () => {
            navigate("/s-admin/createslot");
            setDrawerVisible(false);
          },
        },
        {
          key: "/s-admin/slotbooking",
          icon: <ClockCircleFilled />,
          // label: "Counselling Bookings",
          label: (
            <div style={{ lineHeight: "20px" }}>
              <div>Counselling</div>
              <div>Bookings</div>
            </div>
          ),
          onClick: () => {
            navigate("/s-admin/slotbooking");
            setDrawerVisible(false);
          },
        },
      ],
    },



    (role === "admin" || role === "superadmin") && {
      key: "/s-admin/hhManagement",
      icon: <SolutionOutlined />, // you can change icon
      label: (
        <div style={{ lineHeight: "20px" }}>
          <div>Handholding</div>
          <div>Management</div>
        </div>
      ),
      onClick: () => {
        navigate("/s-admin/hhManagement");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },



        (role === "admin" || role === "superadmin") && {
      key: "/s-admin/eventOutreach",
      icon: <CalendarFilled />, // you can change icon
      label: (
        <div style={{ lineHeight: "20px" }}>
          <div>Event Outreach </div>
          <div>Management</div>
        </div>
      ),
      onClick: () => {
        navigate("/s-admin/eventOutreach");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
    },




// ✅ Advertisement Menu Item
(role === "admin" || role === "superadmin") && {
  key: "/s-admin/advertisement",
  icon: <NotificationFilled />,
  label: (
    <div style={{ lineHeight: "20px" }}>
      <div>Advertisement</div>
      <div>Management</div>
    </div>
  ),
  onClick: () => {
    navigate("/s-admin/advertisement");
    setDrawerVisible(false);
  },
  style: { marginBottom: 12 },
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

    (role === "ui_ux") && {
      key: "/s-admin/sessions-history",
      icon: <CalendarFilled />,
      label: "Session History",
      onClick: () => {
        navigate("/s-admin/sessions-history");
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
      key: "/s-admin/employeeList",
      icon: <TeamOutlined />,
      label: "User Management",
      onClick: () => {
        navigate("/s-admin/employeeList");
        setDrawerVisible(false);
      },
      style: { marginBottom: 12 },
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

  const getDashboardPath = () => {
    if (role === "superadmin" || role === "admin") return "/s-admin/dashboard";
    if (role === "counsellor" || role === "lead_counsellor") return "/s-admin/counsellor-dashboard";
    if (role === "ui_ux") return "/s-admin/uiux-dashboard";
    return "/s-admin/dashboard"; // fallback
  };

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

              {/* BRANDING */}
              <div
                style={{
                  padding: "20px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
                onClick={() => navigate(getDashboardPath())}
              >
                {/* LOGO */}
                <img
                  src="/Abhinav-logo.jpg"
                  alt="Career Counselling"
                  style={{
                    width: 120,
                    height: "auto",
                    objectFit: "contain",
                    marginBottom: 8,
                  }}
                />

                {/* TITLE */}
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: adminTheme.token.colorTextPrimary,
                    lineHeight: "24px",
                  }}
                >
                  Career Counselling
                </div>

                {/* SUBTITLE */}
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    marginTop: 4,
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
                onClick={() => {
                  navigate(getDashboardPath());
                  setDrawerVisible(false); // close drawer
                }}
              >
                <img
                  src="/Abhinav-logo.jpg"
                  alt="Career Counselling"
                  style={{
                    width: 66,
                    height: "auto",
                    objectFit: "contain",
                  }}
                />

                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: adminTheme.token.colorTextPrimary,
                      lineHeight: "18px",
                    }}
                  >
                    Career Counselling
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      marginTop: 2,
                      color: adminTheme.token.colorTextTertiary,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {brandingLabel}
                  </div>
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
              <Text
                strong
                style={{
                  fontSize: 13,
                  lineHeight: "16px",
                }}
              >
                {brandingLabel.split(" ")[0]} <br />
                {brandingLabel.split(" ")[1]}
              </Text>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

              {/* 🔔 NOTIFICATIONS */}
              <Dropdown
                trigger={["click"]}
                dropdownRender={() => (
                  <NotificationDropdown
                    notifications={localNotifications}
                    onRead={handleRead}
                  />
                )}
              >
                <span>
                  <Badge count={unreadCount} size="small">
                    <BellOutlined style={{ fontSize: 20, cursor: "pointer" }} />
                  </Badge>
                </span>
              </Dropdown>

              {/* <span>
                <Badge size="small">
                  <BellOutlined
                    style={{
                      fontSize: 20,
                      cursor: "default",
                      opacity: 0.6,   // optional: show disabled look
                    }}
                  />
                </Badge>
              </span> */}

              {/* 👤 USER */}
              <Dropdown menu={userMenu} trigger={["click"]}>
                <Space style={{ cursor: "pointer", alignItems: "center", gap: 10 }}>

                  <div style={{ lineHeight: "16px" }}>
                    <Text
                      strong
                      title={displayLabel}
                      style={{
                        display: "block",
                        fontSize: screens.xs ? 12 : 14,
                        maxWidth: 140,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {displayLabel}
                    </Text>

                    <Tag
                      color="blue"
                      style={{
                        marginTop: 2,
                        fontSize: 10,
                        padding: "0 6px",
                        lineHeight: "16px",
                      }}
                    >
                      {roleLabel}
                    </Tag>
                  </div>

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
