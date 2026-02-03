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
import { MailOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const Forgot_Password = () => {
  const navigate = useNavigate();

  const onFinish = (values) => {
    console.log("Forgot Password Email:", values);
    // Call forgot password API here
    navigate("/reset-password"); // next step
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
          {/* LEFT PANEL – Hidden on Mobile */}
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
              Reset Password 🔐
            </Title>

            <Text
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 16,
              }}
            >
              Don’t worry! We’ll help you recover your account.
            </Text>

            <ul style={{ marginTop: 30, lineHeight: 2 }}>
              <li>✔ Secure password reset</li>
              <li>✔ Email verification</li>
              <li>✔ Quick access recovery</li>
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
              Forgot Password
            </Title>

            <Text type="secondary">
              Enter your registered email address. We’ll send you a password
              reset link.
            </Text>

            <Form
              layout="vertical"
              onFinish={onFinish}
              style={{ marginTop: 24 }}
            >
              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: "Please enter your email" },
                  { type: "email", message: "Enter a valid email" },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  size="large"
                  placeholder="example@email.com"
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
                Send Reset Link
              </Button>
            </Form>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Forgot_Password;
