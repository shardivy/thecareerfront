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

  const { loading, error, success, successMessage, complete_profile, user } = useSelector(
    (state) => state.auth
  );

  /* ========= SUCCESS ========= */
  useEffect(() => {
    if (success && user) {
      sessionStorage.removeItem("profileWarningShown");
      message.success(successMessage);

      const programPackages =
        JSON.parse(localStorage.getItem("programPackages") || "[]") || [];

      // 🔑 ROLE-BASED REDIRECT (backend driven)
      switch (user.role) {
        case "admin":
        case "superadmin":
        case "employee":
          navigate("/s-admin/dashboard");
          break;

        case "lead_counsellor":
        case "counsellor":
          navigate("/s-admin/counsellor-dashboard");
          break;

        case "ui_ux":
          navigate("/s-admin/uiux-dashboard");
          break;

        case "basic_user":
          navigate("/student/dashboard");
          break;

        case "student": {
          if (programPackages.length === 1) {
            const [onlyProgram] = programPackages;
            localStorage.setItem("selectedProgramId", onlyProgram.program_id);
            localStorage.setItem("selectedProgram", onlyProgram.program_name);
            localStorage.setItem("selectedPackageId", onlyProgram.package_id);
            localStorage.setItem("selectedPackage", onlyProgram.package_name);
            navigate("/student/student-profile");
          } else {
            navigate("/program-selection");
          }
          break;
        }

        case "handholding":
          navigate("/handholding/dashboard");
          break;

        default:
          message.warning("No dashboard assigned for this role");
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
  const onFinish = (values, event) => {
    if (event?.preventDefault) {
      event.preventDefault(); // 🔥 STOP PAGE RELOAD
    }

    // console.log("Login Payload:", values);
    dispatch(loginUser(values));
  };

  const validatePassword = (_, value) => {
    if (!value) return Promise.reject("Password is required");
    if (value.length < 8)
      return Promise.reject("Minimum 8 characters required");
    // if (!/[A-Z]/.test(value))
    //   return Promise.reject("At least one uppercase letter required");
    if (!/[a-z]/.test(value))
      return Promise.reject("At least one lowercase letter required");
    // if (!/\d/.test(value))
    //   return Promise.reject("At least one number required");
    // if (!/[@$!%*?&]/.test(value))
    //   return Promise.reject("At least one special character required");
    return Promise.resolve();
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
              {/* LOGO */}
              <div style={{ marginBottom: 20 }}>
                <img
                  src="/Abhinav-logo.jpg"
                  alt="Career Counselling"
                  style={{
                    width: 150,
                    height: "auto",
                    objectFit: "contain",
                    marginBottom: 6,
                  }}
                />

                <div
                  style={{
                    fontSize: 28,   // bigger like Title
                    fontWeight: 700,
                    color: "#1E40AF",
                  }}
                >
                  Career Counselling Platform
                </div>
              </div>

              <Title level={3} style={{ marginBottom: 4 }}>
                Login
              </Title>

              <Text type="colorTextSecondary">
                Enter your credentials to access your account
              </Text>

              <Form
                layout="vertical"
                onFinish={onFinish}
                onFinishFailed={() => console.log("Validation Failed")}
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
                  hasFeedback
                  rules={[
                    { required: true, message: "Password is required" }
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
                  Want to watch video?{" "}
                  <Text
                    type="primary"
                    style={{
                      cursor: "pointer",
                      textDecoration: "underline",
                      color: "#1677ff",
                      fontWeight: "500",
                    }}
                    onClick={() => navigate("/welcome", { state: { openVideo: true } })}
                  >
                    Click here
                  </Text>
                </Text>

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