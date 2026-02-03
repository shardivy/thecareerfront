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
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import adminTheme from "../../../theme/adminTheme";
import {
  sendResetLink,
  verifyOtp,
  clearForgotPasswordState,
  resetOtpState,
  setEmailInState,
} from "../../../adminSlices/forgotPasswordSlice";

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { loading, successMessage, error, otpSent, otpVerified } = useSelector(
    (state) => state.forgotPassword
  );

  /* ========= SUCCESS ========= */
  useEffect(() => {
    if (successMessage) {
      message.success(successMessage);

      if (otpVerified) {
        navigate("/resetpassword", { replace: true });
      } else {
        dispatch(clearForgotPasswordState());
      }
    }
  }, [successMessage, otpVerified, navigate, dispatch]);

  /* ========= ERROR ========= */
  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearForgotPasswordState());
    }
  }, [error, dispatch]);

  /* ========= EMAIL SUBMIT ========= */
  const onFinishEmail = ({ email }) => {
    localStorage.setItem("resetEmail", email);
    dispatch(setEmailInState(email));
    dispatch(sendResetLink({ email }));
  };

  /* ========= OTP SUBMIT ========= */
  const onFinishOtp = ({ email, otp }) => {
    dispatch(
      verifyOtp({
        email,
        otp,
      })
    );
  };

  const handleChangeEmail = () => {
    form.resetFields();
    dispatch(resetOtpState());
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
                Reset Password 🔐
              </Title>

              <Text
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 16,
                  marginTop: 12,
                  lineHeight: 1.6,
                }}
              >
                Secure your account by verifying your email and OTP.
              </Text>

              <div style={{ marginTop: 40, paddingLeft: 10 }}>
                <Text style={{ color: "#E0E7FF", display: "block" }}>
                  ✔ Email Verification
                </Text>
                <Text style={{ color: "#E0E7FF", display: "block" }}>
                  ✔ OTP Authentication
                </Text>
                <Text style={{ color: "#E0E7FF", display: "block" }}>
                  ✔ Password Recovery
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
                Forgot Password
              </Title>

              <Text type="colorTextSecondary">
                {otpSent
                  ? "Enter the OTP sent to your email"
                  : "Enter your registered email to receive OTP"}
              </Text>

              <Form
                layout="vertical"
                form={form}
                onFinish={otpSent ? onFinishOtp : onFinishEmail}
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
                    disabled={otpSent}
                    style={{ borderRadius: 12 }}
                  />
                </Form.Item>

                {/* OTP */}
                {otpSent && (
                  <Form.Item
                    label="OTP Code"
                    name="otp"
                    rules={[
                      { required: true, message: "OTP is required" },
                      { pattern: /^\d{4,6}$/, message: "Enter valid OTP" },
                    ]}
                  >
                    <Input
                      prefix={<LockOutlined />}
                      size="large"
                      placeholder="Enter OTP"
                      maxLength={6}
                      style={{ borderRadius: 12 }}
                    />
                  </Form.Item>
                )}

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
                  {otpSent ? "Verify OTP" : "Send OTP"}
                </Button>

                <Divider style={{ margin: "28px 0" }} />

                {/* FOOTER LINKS */}
                <Text
                  style={{
                    textAlign: "center",
                    display: "block",
                    cursor: "pointer",
                    color: "#1890ff",
                  }}
                  onClick={() =>
                    otpSent ? handleChangeEmail() : navigate("/")
                  }
                >
                  {otpSent ? "Change Email" : "Back to Login"}
                </Text>
              </Form>
            </Col>
          </Row>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default ForgotPassword;