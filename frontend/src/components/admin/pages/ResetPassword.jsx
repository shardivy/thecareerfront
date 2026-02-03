import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Row,
  Col,
  Divider,
  ConfigProvider,
  message,
} from "antd";
import {
  LockOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";
import {
  resetPassword,
  clearResetPasswordState,
} from "../../../adminSlices/resetPasswordSlice";
import {
  clearForgotPasswordState,
} from "../../../adminSlices/forgotPasswordSlice";

const { Title, Text } = Typography;

const ResetPassword = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { loading, error, success, successMessage } = useSelector(
    (state) => state.resetPassword
  );

  let { email } = useSelector((state) => state.forgotPassword);

  // Fallback to localStorage
  if (!email) {
    email = localStorage.getItem("resetEmail");
  }

  /* ================= SUBMIT ================= */
  const onFinish = (values) => {
    dispatch(
      resetPassword({
        email,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      })
    );
  };

  /* ================= SUCCESS ================= */
  useEffect(() => {
    if (success) {
      message.success(
        successMessage ||
          "Password reset successfully. Please login with your new password."
      );

      localStorage.removeItem("resetEmail");
      dispatch(clearResetPasswordState());
      dispatch(clearForgotPasswordState());

      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    }
  }, [success, successMessage, dispatch]);

  /* ================= ERROR ================= */
  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  /* ================= PASSWORD VALIDATION ================= */
  const validatePassword = (_, value) => {
    if (!value) return Promise.reject("Password is required");
    if (value.length < 8)
      return Promise.reject("Minimum 8 characters required");
    if (!/[A-Z]/.test(value))
      return Promise.reject("At least one uppercase letter required");
    if (!/[a-z]/.test(value))
      return Promise.reject("At least one lowercase letter required");
    if (!/\d/.test(value))
      return Promise.reject("At least one number required");
    if (!/[@$!%*?&]/.test(value))
      return Promise.reject("At least one special character required");
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
            {/* ===== LEFT INFO PANEL ===== */}
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
                Create New Password 🔒
              </Title>

              <Text
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 16,
                  marginTop: 12,
                  lineHeight: 1.6,
                }}
              >
                Choose a strong password to keep your account secure.
              </Text>

              <div style={{ marginTop: 40, paddingLeft: 10 }}>
                <Text style={{ color: "#E0E7FF", display: "block" }}>
                  ✔ Strong password rules
                </Text>
                <Text style={{ color: "#E0E7FF", display: "block" }}>
                  ✔ Secure account access
                </Text>
                <Text style={{ color: "#E0E7FF", display: "block" }}>
                  ✔ One-time reset flow
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
              <Title level={3} style={{ marginBottom: 6 }}>
                Reset Password
              </Title>

              <Text type="colorTextSecondary">
                Enter and confirm your new password
              </Text>

              <Form
                layout="vertical"
                form={form}
                onFinish={onFinish}
                style={{ marginTop: 28 }}
              >
                {/* NEW PASSWORD */}
                <Form.Item
                  label="New Password"
                  name="new_password"
                  hasFeedback
                  rules={[{ validator: validatePassword }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    size="large"
                    placeholder="Enter new password"
                    style={{ borderRadius: 12 }}
                  />
                </Form.Item>

                {/* CONFIRM PASSWORD */}
                <Form.Item
                  label="Confirm Password"
                  name="confirm_password"
                  dependencies={["new_password"]}
                  hasFeedback
                  rules={[
                    { required: true, message: "Confirm password is required" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value)
                          return Promise.reject("Confirm password required");
                        if (value !== getFieldValue("new_password"))
                          return Promise.reject("Passwords do not match");
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    size="large"
                    placeholder="Re-enter new password"
                    style={{ borderRadius: 12 }}
                  />
                </Form.Item>

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
                  Reset Password
                </Button>

                <Divider style={{ margin: "28px 0" }} />

                {/* FOOTER */}
                <Text
                  style={{
                    textAlign: "center",
                    display: "block",
                    cursor: "pointer",
                    color: "#1890ff",
                  }}
                  onClick={() => (window.location.href = "/")}
                >
                  Back to Login
                </Text>
              </Form>
            </Col>
          </Row>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default ResetPassword;