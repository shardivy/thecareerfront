import React from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Row,
  Col,
} from "antd";
import {
  LockOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const Reset_Password = () => {
  const navigate = useNavigate();

  const onFinish = (values) => {
    console.log("Reset Password Values:", values);
    navigate("/reset-password-success"); // or error page
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <Card
        bordered={false}
        style={{
          width: "100%",
          maxWidth: 900,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        <Row>
          {/* LEFT PANEL (Hidden on Mobile) */}
          <Col
            xs={0}
            md={10}
            style={{
              background: "linear-gradient(180deg,#5f72ff,#9b23ea)",
              color: "#fff",
              padding: "60px 30px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Title style={{ color: "#fff" }}>
              Create New Password 🔐
            </Title>

            <Text
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 16,
              }}
            >
              Set a strong password to keep your account secure.
            </Text>

            <ul style={{ marginTop: 30, lineHeight: 2 }}>
              <li>✔ Minimum 8 characters</li>
              <li>✔ One uppercase letter</li>
              <li>✔ One number & symbol</li>
            </ul>
          </Col>

          {/* RIGHT PANEL */}
          <Col
            xs={24}
            md={14}
            style={{
              padding: "40px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/login")}
              style={{ paddingLeft: 0 }}
            >
              Back to Login
            </Button>

            <Title level={3} style={{ marginTop: 8 }}>
              Reset Password
            </Title>

            <Text type="secondary">
              Enter your new password and confirm it below.
            </Text>

            <Form
              layout="vertical"
              onFinish={onFinish}
              style={{ marginTop: 24 }}
            >
              <Form.Item
                label="New Password"
                name="password"
                rules={[
                  { required: true, message: "Please enter new password" },
                  {
                    min: 8,
                    message: "Password must be at least 8 characters",
                  },
                ]}
                hasFeedback
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  size="large"
                  placeholder="********"
                />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={["password"]}
                hasFeedback
                rules={[
                  { required: true, message: "Please confirm password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Passwords do not match")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  size="large"
                  placeholder="********"
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                style={{
                  borderRadius: 30,
                  height: 48,
                  fontSize: 16,
                  marginTop: 10,
                }}
              >
                Update Password
              </Button>
            </Form>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Reset_Password;
