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
  Badge,
  theme,
  Alert,
  Modal,
  Select,
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
  FormOutlined,
  ExclamationCircleFilled,
  SwapOutlined,
  RetweetOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import NotificationDropdown from "../components/student/pages/Notification";
import { useDispatch, useSelector } from "react-redux";
import { getProfile, clearProfile } from "../adminSlices/profileSlice";
import { logout } from "../adminSlices/authSlice";
import { ConfigProvider } from "antd";
import adminTheme from "../theme/adminTheme";
import { setSelection } from "../adminSlices/studentSelectionSlice";
import {clearCollegeAnalysisDraft} from "../adminSlices/collegeAnalysisSlice";

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
  // const selectedPackage = localStorage.getItem("selectedPackage");
  const getDashboardPath = () => "/student/dashboard";
  const adminRole = localStorage.getItem("adminRole");
  const isBasicUser = adminRole === "basic_user";
  const profileRole = String(profile?.role || "").toLowerCase();
  const isFreeUser =
    profileRole === "basic_user" ||
    (!profileRole && !profile?.package_id && !profile?.program_id);
  const [showModal, setShowModal] = useState(false);


  const selectedProgramRedux = useSelector(
    (state) => state.programs?.selectedProgram
  );

  const selectedPackageRedux = useSelector(
    (state) => state.packages?.selectedPackage
  );

  const selectedProgramIdRedux = useSelector(
    (state) => state.programs?.selectedProgramId
  );

  const selectedPackageIdRedux = useSelector(
    (state) => state.packages?.selectedPackageId
  );

  const selectedProgram =
    selectedProgramRedux ||
    localStorage.getItem("selectedProgram");

  const selectedProgramId =
    selectedProgramIdRedux ||
    Number(localStorage.getItem("selectedProgramId"));

  const selectedPackage =
    selectedPackageRedux ||
    localStorage.getItem("selectedPackage");

  const selectedPackageId =
    selectedPackageIdRedux ||
    Number(localStorage.getItem("selectedPackageId"));

  const programPackages =
    profile?.program_packages ||
    JSON.parse(localStorage.getItem("programPackages")) ||
    [];

  const selectedProgramItem =
    programPackages.find(
      (item) =>
        String(item.program_id) === String(selectedProgramId) &&
        String(item.package_id) === String(selectedPackageId)
    ) ||
    programPackages.find(
      (item) => String(item.program_id) === String(selectedProgramId)) ||
    {};

  // Persist program packages from profile if available
  useEffect(() => {
    if (profile?.program_packages) {
      localStorage.setItem(
        "programPackages",
        JSON.stringify(profile.program_packages)
      );
    }
  }, [profile?.program_packages]);

  useEffect(() => {
  if (profile?.stream) {
    localStorage.setItem(
      "selectedStreamId",
      String(profile.stream.stream_id)
    );

    localStorage.setItem(
      "selectedStream",
      profile.stream.stream_name
    );
  } else {
    // Optional: remove if stream is null
    localStorage.removeItem("selectedStreamId");
    localStorage.removeItem("selectedStream");
  }
}, [profile]);

  // Check if modal should be shown on component mount
  useEffect(() => {
    const modalTriggered = localStorage.getItem("showConversionModal");
    const handled = localStorage.getItem("conversionHandled");
    if (modalTriggered === "true" && !handled) {
      setShowModal(true);
    }
  }, []);

  const hasPackage = !!selectedPackageId;
  const hasOnlyProgram = !!selectedProgramId && !hasPackage;

  const username = localStorage.getItem("username") || "Student";
  const userRole = profile?.role;

  const showConversionMsg = profile?.is_converted_lead === false;

  // Function to truncate name for smaller screens
  const truncatedUsername = screens.xs
    ? username.length > 10
      ? `${username.slice(0, 10)}...`
      : username
    : username;

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  useEffect(() => {
  const disableRightClick = (e) => {
    e.preventDefault();
  };

  document.addEventListener("contextmenu", disableRightClick);

  return () => {
    document.removeEventListener("contextmenu", disableRightClick);
  };
}, []);

  useEffect(() => {
    if (profile?.role) {
      const oldRole = localStorage.getItem("adminRole");

      // First time login → just store role
      if (!oldRole) {
        localStorage.setItem("adminRole", profile.role);
        return;
      }

      // 🔥 Detect role change
      if (oldRole !== profile.role) {
        console.log("Role changed detected");

        // Clear old cached UI data
        localStorage.removeItem("dashboardConfig");
        localStorage.removeItem("selectedPackage");
        localStorage.removeItem("aptitude_test");
        localStorage.removeItem("engineering_test_analysis");

        // Update new role
        localStorage.setItem("adminRole", profile.role);

        // 🔥 Reload UI
        window.location.reload();
      }
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.aptitude_test !== undefined) {
      localStorage.setItem("aptitude_test", profile.aptitude_test);
    }

    if (profile?.engineering_test_analysis !== undefined) {
      localStorage.setItem("engineering_test_analysis", profile.engineering_test_analysis);
    }
  }, [profile]);


  const aptitudeTestFromStorage = localStorage.getItem("aptitude_test");

  const showExamAndReport =
    selectedProgramItem?.aptitude_test === true ||
    selectedProgramItem?.aptitude_test === "true" ||
    aptitudeTestFromStorage === "true";

  const showEngineering =
    (selectedProgramItem?.engineering_test_analysis === true ||
      selectedProgramItem?.engineering_test_analysis === "true" ||
      localStorage.getItem("engineering_test_analysis") === "true") &&
    adminRole !== "basic_user";

  const shouldShowSlotBooking = !isFreeUser;
  const showSlotBookingAfterExam = showExamAndReport && !showEngineering;
  const showSlotBookingAfterEngineering = showEngineering;
  const showSlotBookingForOtherPrograms =
    shouldShowSlotBooking &&
    !showSlotBookingAfterExam &&
    !showSlotBookingAfterEngineering;

  // const prevConverted = localStorage.getItem("prev_converted_lead");

  // useEffect(() => {
  //   if (profile?.is_converted_lead !== undefined) {
  //     const prev = localStorage.getItem("prev_converted_lead");
  //     const handled = localStorage.getItem("conversionHandled");

  //     // Show modal only if just converted (false → true) and not already handled
  //     if (prev === "false" && profile.is_converted_lead === true && !handled) {
  //       setShowModal(true);
  //       localStorage.setItem("showConversionModal", "true");
  //     }

  //     // update previous state
  //     localStorage.setItem(
  //       "prev_converted_lead",
  //       profile.is_converted_lead
  //     );
  //   }
  // }, [profile]);

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
    "/student/exam-management": "Aptitude Test Management",
    "/student/report-management": "Aptitude Test Report",
    "/student/slot-booking": "Counselling Slot Booking",
    "/student/freecontent": "Free Content",
    "/student/content-library": "Content Library",
    "/student/student-profile": "Profile",
    "/student/payments": "Payments",
    "/student/payment-page": "Payment",
    "/student/engineering-questionnaires": "Engineering Questionnaires",
    "/student/analysis-report": "Analysis Report",
    "/student/write-review": "Write a Review",
    "/student/program-selection": "Program Selection",
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
      style: { marginBottom: 12, marginTop: 8 },
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
      style: { marginBottom: 14 },
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
    style: { marginBottom: 10 },
  };


  const engineeringQuestionnairesItem = {
    key: "/student/engineering-questionnaires",
    icon: <FormOutlined />,
    label: (
      <div style={{ lineHeight: "20px" }}>
        {/* <div>Engineering</div> */}
        <div>Questionnaires</div>
      </div>
    ),
    onClick: () => {
      navigate("/student/engineering-questionnaires");
      setDrawerVisible(false);
    },
    style: { marginBottom: 10 },
  };

  const slotBookingItem = {
    key: "/student/slot-booking",
    icon: <ScheduleFilled />,
    label: (
      <div style={{ lineHeight: "20px" }}>
        <div>Counselling</div>
        <div>Slot Booking</div>
      </div>
    ),
    onClick: () => {
      navigate("/student/slot-booking");
      setDrawerVisible(false);
    },
    style: { marginBottom: 18 },
  };

  if (isBasicUser || !hasPackage) {
    menuItems.push(contentLibraryItem);
  }

  const writeReviewItem = {
    key: "/student/write-review",
    icon: <FormOutlined />,
    label: (
      <div style={{ lineHeight: "20px" }}>
        <div>Write A Review</div>

      </div>
    ),
    onClick: () => {
      navigate("/student/write-review");
      setDrawerVisible(false);
    },
    style: { marginBottom: 12 },
  };

  // Package-dependent items
  if (hasPackage) {
    const packageItems = [
      // ================= APTITUDE =================
      ...(showExamAndReport
        ? [
          {
            key: "/student/exam-management",
            icon: <CalendarFilled />,
            label: (
              <div style={{ lineHeight: "20px" }}>
                <div>Aptitude Test</div>
                <div>Management</div>
              </div>
            ),
            onClick: () => {
              navigate("/student/exam-management");
              setDrawerVisible(false);
            },
            style: { marginBottom: 18 },
          },

          // SLOT BOOKING AFTER EXAM MANAGEMENT
          ...(showSlotBookingAfterExam
            ? [slotBookingItem]
            : []),

          ...(!isBasicUser
            ? [
              // WRITE REVIEW
              writeReviewItem,
            ]
            : []),

          // REPORT AFTER REVIEW
          {
            key: "/student/report-management",
            icon: <FileTextFilled />,
            label: (
              <div style={{ lineHeight: "20px" }}>
                <div>Aptitude Test</div>
                <div>Reports</div>
              </div>
            ),
            onClick: () => {
              navigate("/student/report-management");
              setDrawerVisible(false);
            },
            style: { marginBottom: 18 },
          },
        ]
        : []),

      // ================= ENGINEERING =================
      ...(showEngineering
        ? [
          engineeringQuestionnairesItem,

          // SLOT BOOKING AFTER QUESTIONNAIRES
          ...(!isBasicUser
            ? [
              {
                key: "/student/analysis-report",
                icon: <FileTextFilled />,
                label: (
                  <div style={{ lineHeight: "20px" }}>
                    <div>Analysis Report</div>
                  </div>
                ),
                onClick: () => {
                  navigate("/student/analysis-report");
                  setDrawerVisible(false);
                },
                style: { marginBottom: 18 },
              },

              ...(showSlotBookingAfterEngineering ? [slotBookingItem] : []),

              // WRITE REVIEW
              writeReviewItem,
            ]
            : []),

          // ANALYSIS REPORT AFTER REVIEW

        ]
        : []),

      ...(showSlotBookingForOtherPrograms ? [slotBookingItem] : []),


      // WRITE REVIEW FOR REMAINING PROGRAMS
      ...(
        !isBasicUser &&
          !showExamAndReport &&
          !showEngineering
          ? [writeReviewItem]
          : []
      ),
      // ================= PAYMENTS =================
      ...(!isBasicUser
        ? [
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
        ]
        : []),
    ];


    // Merge package items
    menuItems.push(...packageItems);

    if (!isBasicUser) {
      // Paid user → place before Payments
      const secondLastIndex = menuItems.length - 1;
      menuItems.splice(secondLastIndex, 0, contentLibraryItem);
    }
  }


  const handleLogout = () => {
    // Mark as handled and clear modal flag
    localStorage.setItem("conversionHandled", "true");
    localStorage.removeItem("showConversionModal");

    // Clear persisted auth/profile data
    localStorage.clear();
    dispatch(clearProfile());
    dispatch(logout());

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
      ...(userRole !== "basic_user"
        ? [
          {
            key: "profile",
            icon: <UserOutlined />,
            label: "Profile",
            onClick: () => navigate("/student/student-profile"),
          },
        ]
        : []),
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

  // Handler for program/package change
  const handleProgramChange = (value) => {
    const allPrograms =
      profile?.program_packages ||
      JSON.parse(localStorage.getItem("programPackages")) ||
      [];

    const selectedItem = allPrograms.find(
      (item) => `${item.program_id}_${item.package_id}` === value
    );

    if (!selectedItem) return;

     // Clear old program-specific data
      dispatch(clearCollegeAnalysisDraft());

    // Reset program-specific flags
    localStorage.removeItem("paymentCompleted");
    localStorage.removeItem("examCompleted");
    localStorage.removeItem("report_status");

    // Update Redux
    dispatch(
      setSelection({
        programId: selectedItem.program_id,
        programName: selectedItem.program_name,
        packageId: selectedItem.package_id,
        packageName: selectedItem.package_name,
      })
    );

    // Update LocalStorage
    localStorage.setItem("selectedProgramId", selectedItem.program_id);
    localStorage.setItem("selectedProgram", selectedItem.program_name);
    localStorage.setItem("selectedPackageId", selectedItem.package_id);
    localStorage.setItem("selectedPackage", selectedItem.package_name);

    if (selectedItem.aptitude_test !== undefined) {
      localStorage.setItem(
        "aptitude_test",
        String(selectedItem.aptitude_test)
      );
    }
    if (selectedItem.engineering_test_analysis !== undefined) {
      localStorage.setItem(
        "engineering_test_analysis",
        String(selectedItem.engineering_test_analysis)
      );
    }

    // Dispatch custom event to notify dashboard of program change
    window.dispatchEvent(
      new CustomEvent("programChanged", {
        detail: {
          programId: selectedItem.program_id,
          packageId: selectedItem.package_id,
        },
      })
    );

    navigate("/student/dashboard");
  };

  // On mount, if no selection in LocalStorage, set defaults
  useEffect(() => {
    if (!selectedProgramId && allPrograms.length > 0) {
      const first = allPrograms[0];

      localStorage.setItem("selectedProgramId", first.program_id);
      localStorage.setItem("selectedProgram", first.program_name);
      localStorage.setItem("selectedPackageId", first.package_id);
      localStorage.setItem("selectedPackage", first.package_name);

      dispatch(
        setSelection({
          programId: first.program_id,
          programName: first.program_name,
          packageId: first.package_id,
          packageName: first.package_name,
        })
      );
    }
  }, []);

  const allPrograms =
    profile?.program_packages ||
    JSON.parse(localStorage.getItem("programPackages")) || [];

  const showProgramDropdown =
    !isBasicUser && !isFreeUser && allPrograms.length > 1;

  const programOptions = allPrograms.map((item) => ({
    value: `${item.program_id}_${item.package_id}`,
    label: `${item.program_name} - ${item.package_name}`,
  }));

  return (
    <ConfigProvider theme={adminTheme}>
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

              {/* BRANDING */}
              <div style={{
                textAlign: "center", padding: "20px 16px", cursor: "pointer",

              }}
                onClick={() => navigate(getDashboardPath())}
              >

                {/* LOGO */}
                <img
                  src="/Abhinav-logo.jpg"
                  alt="Student Panel"
                  style={{
                    width: 120,
                    height: "auto",
                    objectFit: "contain",
                    marginBottom: 6,
                  }}
                />

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
                  Student Dashboard
                </div>

              </div>

              {/* MENU */}
              <div
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  overflowY: "auto",
                  maxHeight: "calc(100vh - 200px)",
                }}
              >
                {MenuContent}
              </div>

              {/* LOGOUT */}
              <LogoutButton />

            </div>
          </Sider>
        )}

        {screens.xs && !isProfilePage && (
          <Drawer
            placement="right"
            open={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            closable
            title={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  width: "100%",
                  paddingTop: 4,
                  cursor: "pointer",
                }}
                onClick={() => {
                  navigate(getDashboardPath());
                  setDrawerVisible(false); // close drawer
                }}
              >
                {/* LOGO */}
                <img
                  src="/Abhinav-logo.jpg"
                  alt="Career Counselling"
                  style={{
                    width: 60,
                    height: "auto",
                    objectFit: "contain",
                    marginBottom: 6,
                  }}
                />

                {/* TITLE */}
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: adminTheme.token.colorTextPrimary,
                    lineHeight: "20px",
                  }}
                >
                  Career Counselling
                </div>

                {/* SUBTITLE */}
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    marginTop: 3,
                    color: adminTheme.token.colorTextTertiary,
                    letterSpacing: "0.6px",
                    textTransform: "uppercase",
                  }}
                >
                  Student Panel
                </div>
              </div>
            }
            styles={{
              header: {
                background: token.colorPrimary,
                borderBottom: "none",
                direction: "rtl",
              },
              body: {
                background: token.colorPrimary,
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

        <Layout style={{ marginLeft: !isProfilePage && !screens.xs ? SIDEBAR_WIDTH : 0 }}>
          {!isProfilePage && (
            <Header
              style={{
                background: token.colorBgContainer,
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: token.boxShadow,
                position: "sticky",
                top: 0,
                zIndex: 10,
                height: screens.xs ? 56 : 64,
              }}
            >
              {/* LEFT SIDE */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                {/* Hide breadcrumb on mobile */}
                {!screens.xs && (
                  <Breadcrumb style={{ fontSize: 15, whiteSpace: "nowrap" }}>
                    {breadcrumbItems.map((item) => (
                      <Breadcrumb.Item key={item.key}>
                        {item.title}
                      </Breadcrumb.Item>
                    ))}
                  </Breadcrumb>
                )}

                {/* Program Dropdown */}
                {showProgramDropdown && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#fff",
                      border: "1px solid #d9d9d9",
                      borderRadius: 12,
                      padding: screens.xs ? "4px 8px" : "5px 10px",
                      marginLeft: screens.xs ? 0 : 12,
                      maxWidth: screens.xs ? "100%" : "auto",
                    }}
                  >
                    <RetweetOutlined style={{ color: "#1E40AF", fontSize: 14 }} />
                    <Select
                      bordered={false}
                      value={`${selectedProgramId}_${selectedPackageId}`}
                      options={programOptions}
                      onChange={handleProgramChange}
                      size={screens.xs ? "small" : "middle"}
                      style={{
                        width: screens.xs ? 150 : 280,
                        fontSize: screens.xs ? 12 : 14,
                      }}
                    />
                  </div>
                )}

                {/* Show page title on mobile instead of breadcrumb */}
                {screens.xs && !showProgramDropdown && (
                  <Text
                    strong
                    style={{
                      fontSize: 14,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 160,
                    }}
                  >
                    {breadcrumbNameMap[location.pathname] || "Dashboard"}
                  </Text>
                )}
              </div>

              {/* RIGHT SIDE */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: screens.xs ? 6 : 14,
                  flexShrink: 0,
                }}
              >
                {/* Notification */}
                <Badge size="small">
                  <BellOutlined style={{ fontSize: screens.xs ? 16 : 18 }} />
                </Badge>

                {/* Username + Avatar - hide username text on mobile */}
                <Dropdown menu={userMenu} trigger={["click"]}>
                  <Space style={{ cursor: "pointer", alignItems: "center", gap: 6 }}>
                    {!screens.xs && (
                      <Text
                        strong
                        style={{ fontSize: 15 }}
                      >
                        {truncatedUsername}
                      </Text>
                    )}
                    <Avatar
                      icon={<UserOutlined />}
                      size={screens.xs ? 28 : 32}
                      style={{ background: token.colorPrimary }}
                    />
                  </Space>
                </Dropdown>

                {/* Mobile Menu Button */}
                {screens.xs && (
                  <Button
                    type="text"
                    icon={<MenuOutlined />}
                    size="small"
                    onClick={() => setDrawerVisible(true)}
                  />
                )}
              </div>
            </Header>
          )}



          {/* <Modal
            open={showModal}
            centered
            closable={false}
            maskClosable={false}
            footer={null}
          >
            <div style={{ textAlign: "center", padding: "10px 5px" }}>


              <ExclamationCircleFilled
                style={{
                  fontSize: 48,
                  color: "#faad14",
                  marginBottom: 12,
                }}
              />


              <h2 style={{ marginBottom: 8, fontWeight: 600 }}>
                Profile Updated
              </h2>


              <p
                style={{
                  color: "#555",
                  fontSize: 14,
                  lineHeight: "22px",
                  marginBottom: 24,
                }}
              >
                Your profile has been updated by admin. <br />
                Please logout and login again to access your dashboard.
              </p>


              <Button
                type="primary"
                danger
                size="large"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{
                  borderRadius: 6,
                  padding: "0 30px",
                  height: 42,
                  fontWeight: 500,
                }}
              >
                Logout Now
              </Button>
            </div>
          </Modal> */}

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
    </ConfigProvider>
  );
}
