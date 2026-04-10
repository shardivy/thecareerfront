import React, { useState } from "react";
import {
  Layout,
  Menu,
  Drawer,
  Button,
  Grid,
  Avatar,
  Typography,
  Space,
  ConfigProvider,
  Breadcrumb,
} from "antd";
import {
  UserOutlined,
  MenuOutlined,
  DashboardFilled,
  FileTextFilled,
  CalendarFilled,
  LogoutOutlined,
  CloseOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import adminTheme from "../theme/adminTheme";

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;
const { Text } = Typography;

const SIDEBAR_WIDTH = 260;

export default function HandholdingLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();

  const [drawerVisible, setDrawerVisible] = useState(false);

  const username = localStorage.getItem("username") || "Handholding User";

  const truncatedUsername = screens.xs
  ? username.length > 10
    ? `${username.slice(0, 10)}...`
    : username
  : username;

  /* ================= MENU ================= */
  const menuItems = [
    {
      key: "/handholding/dashboard",
      icon: <DashboardFilled />,
      label: "Dashboard",
      onClick: () => {
        navigate("/handholding/dashboard");
        setDrawerVisible(false);
      },
    },
    {
      key: "/handholding/sessions",
      icon: <CalendarFilled />,
      label: "Sessions",
      onClick: () => {
        navigate("/handholding/sessions");
        setDrawerVisible(false);
      },
    },
    {
      key: "/handholding/certificates",
      icon: <FileTextFilled />,
      label: "Certificates",
      onClick: () => {
        navigate("/handholding/certificates");
        setDrawerVisible(false);
      },
    },
    {
    key: "/handholding/payments", // ✅ NEW
    icon: <CreditCardOutlined />,   // 💳 better icon
    label: "Payments",
    onClick: () => {
      navigate("/handholding/payments");
      setDrawerVisible(false);
    },
  },
    
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  /* ================= BREADCRUMB ================= */
  const breadcrumbNameMap = {
    "/handholding/dashboard": "Dashboard",
    "/handholding/sessions": "Sessions",
    "/handholding/payments": "Payments",
    "/handholding/certificates": "Certificates",
  };

  const pathSnippets = location.pathname.split("/").filter(Boolean);

  const breadcrumbItems = [
    { key: "/handholding/dashboard", title: ".." },
    ...pathSnippets.slice(1).map((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 2).join("/")}`;
      return {
        key: url,
        title: breadcrumbNameMap[url] || url,
      };
    }),
  ];

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
    />
  );

  return (
    <ConfigProvider theme={adminTheme}>
      <Layout style={{ minHeight: "100vh" }}>
        
        {/* ================= SIDEBAR ================= */}
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
              <div
                style={{
                  padding: "20px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
                onClick={() => navigate("/handholding/dashboard")}
              >
                <img
                  src="/Abhinav-logo.jpg"
                  alt="Handholding"
                  style={{ width: 110, marginBottom: 8 }}
                />

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
                    fontSize: 11,
                    marginTop: 4,
                    color: adminTheme.token.colorTextTertiary,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  Handholding Panel
                </div>
              </div>

              {/* MENU */}
              <div style={{ flex: 1, padding: "10px 16px", overflowY: "auto" }}>
                {MenuContent}
              </div>

              {/* LOGOUT */}
              <div style={{ padding: 16 }}>
                <Button
                  icon={<LogoutOutlined />}
                  block
                  onClick={handleLogout}
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                  }}
                >
                  Logout
                </Button>
              </div>
            </div>
          </Sider>
        )}

        {/* ================= MOBILE DRAWER ================= */}
        {screens.xs && (
          <Drawer
            placement="right"
            open={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            closable={false}
            title={
              <div
                style={{ display: "flex", alignItems: "center", gap: 10 }}
                onClick={() => {
                  navigate("/handholding/dashboard");
                  setDrawerVisible(false);
                }}
              >
                <img src="/Abhinav-logo.jpg" width={60} />
                <div>
                  <div style={{ fontWeight: 700, color: "#fff" }}>
                    Career Counselling
                  </div>
                  <div style={{ fontSize: 11, color: "#fff" }}>
                    Handholding Panel
                  </div>
                </div>
              </div>
            }
            extra={
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setDrawerVisible(false)}
              />
            }
            styles={{
              header: {
                background: adminTheme.token.colorPrimary,
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
            {/* MENU */}
            <div style={{ flex: 1, padding: "10px 16px", overflowY: "auto" }}>
              {MenuContent}
            </div>

            {/* LOGOUT FIXED BOTTOM */}
            <div style={{ padding: 16 }}>
              <Button block onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </Drawer>
        )}

        {/* ================= MAIN ================= */}
        <Layout style={{ marginLeft: screens.xs ? 0 : SIDEBAR_WIDTH }}>
          
          {/* HEADER */}
          <Header
            style={{
              background: "#fff",
              padding: "0 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: adminTheme.token.boxShadow,
            }}
          >
            {/* BREADCRUMB */}
            <div
              style={{
                maxWidth: screens.xs ? "60%" : "50%",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              <Breadcrumb
                style={{
                  fontSize: screens.xs ? 13 : 15,
                }}
              >
                {breadcrumbItems.map((item) => (
                  <Breadcrumb.Item key={item.key}>
                    <span
                      style={{
                        display: "inline-block",
                        maxWidth: screens.xs ? 100 : "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </span>
                  </Breadcrumb.Item>
                ))}
              </Breadcrumb>
            </div>

            {/* USER */}
            <Space>
              <Text> {truncatedUsername}</Text>
              <Avatar icon={<UserOutlined />} />

              {screens.xs && (
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setDrawerVisible(true)}
                />
              )}
            </Space>
          </Header>

          {/* CONTENT */}
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
}