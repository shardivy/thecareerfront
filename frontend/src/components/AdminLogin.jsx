import React, { useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Divider,
  ConfigProvider,
  message,
} from "antd";
import {
  MailOutlined,
  LockOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import adminTheme from "../theme/adminTheme";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../adminSlices/authSlice";

const { Title, Text } = Typography;

const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, error, success, successMessage, user } = useSelector(
    (state) => state.auth
  );

  /* ========= SUCCESS ========= */
  useEffect(() => {
    if (success && user) {
      message.success(successMessage);

      // 🔑 ROLE-BASED REDIRECT (backend driven)
      switch (user.role) {
        case "admin":
        case "superadmin":
        case "employee":
          navigate("/admin/dashboard");
          break;

        case "lead_counsellor":
        case "counsellor":
          navigate("/admin/dashboard");
          break;

        case "student":
          navigate("/student/dashboard");
          break;

        default:
          navigate("/student/dashboard");
      }
    }
  }, [success, successMessage, user, navigate]);

  /* ========= ERROR ========= */
  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  /* ========= SUBMIT ========= */
  const onFinish = (values) => {
    console.log("Login Payload:", values);
    dispatch(loginUser(values)); // only email + password
  };

  return (
    <ConfigProvider theme={adminTheme}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          background:
            "linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)",
        }}
      >
        <Card
          bordered={false}
          style={{
            width: "100%",
            maxWidth: 920,
            borderRadius: 24,
            overflow: "hidden",
            background:
              "linear-gradient(135deg, #1E40AF, #6b85db)",
            boxShadow:
              "0 30px 70px rgba(30, 64, 175, 0.35)",
          }}
        >
          <Row>
            {/* ===== LEFT BRAND PANEL ===== */}
            <Col
              xs={0}
              md={10}
              style={{
                color: "#FFFFFF",
                padding: "70px 40px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Title
                style={{
                  color: "#FFFFFF",
                  fontSize: 34,
                  fontWeight: 700,
                }}
              >
                Welcome Back 👋
              </Title>

              <Text
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 16,
                  marginTop: 12,
                  lineHeight: 1.6,
                }}
              >
                Login to continue your learning, counselling, or management
                journey.
              </Text>

              <div style={{ marginTop: 40, paddingLeft: 10 }}>
                <Text style={{ color: "#E0E7FF", display: "block" }}>
                  ✔ Student Dashboard
                </Text>
                <Text style={{ color: "#E0E7FF", display: "block" }}>
                  ✔ Counsellor Panel
                </Text>
                <Text style={{ color: "#E0E7FF", display: "block" }}>
                  ✔ Admin Management
                </Text>
              </div>
            </Col>

            {/* ===== RIGHT FORM PANEL ===== */}
            <Col
              xs={24}
              md={14}
              style={{
                padding: "48px 36px",
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(10px)",
                borderRadius: "0 24px 24px 0",
              }}
            >
              <Title level={3} style={{ marginBottom: 4 }}>
                Login
              </Title>

              <Text type="colorTextSecondary">
             Enter your credentials to access your account
              </Text>

              <Form
                layout="vertical"
                onFinish={onFinish}
                style={{ marginTop: 28 }}
              >
                {/* EMAIL */}
                <Form.Item
                  label="Email Address"
                  name="email"
                  rules={[
                    { required: true, message: "Email is required" },
                    { type: "email", message: "Enter a valid email" },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    size="large"
                    placeholder="you@example.com"
                    style={{ borderRadius: 12 }}
                  />
                </Form.Item>

                {/* PASSWORD */}
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: "Password is required" },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="••••••••"
                    size="large"
                    style={{ borderRadius: 12 }}
                  />
                </Form.Item>

                {/* FORGOT */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 20,
                  }}
                >
                  <Text
                    type="primary"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/forgotpassword")}
                  >
                    Forgot Password?
                  </Text>
                </div>

                {/* SUBMIT */}
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  icon={<SafetyOutlined />}
                  style={{
                    height: 50,
                    borderRadius: 30,
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  Login
                </Button>

                <Divider style={{ margin: "28px 0" }} />
                
                                <Text style={{ textAlign: "center", display: "block" }}>
                                  Don’t have an student account?{" "}
                                  <Text
                                    type="primary"
                                    style={{
                                      cursor: "pointer",
                                        color: "#1890ff",
                                      textDecoration: "underline",
                                    }}
                                    onClick={() => navigate("/register")}
                                  >
                                    Register
                                  </Text>
                </Text>
              </Form>
            </Col>
          </Row>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default AdminLogin;