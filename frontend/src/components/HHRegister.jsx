import React from "react";
import { useNavigate } from "react-router-dom";
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
  Select,
  Upload,
  message,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import adminTheme from "../theme/adminTheme";
import { registerHH } from "../hhSlices/hhRegisterSlice";
import { useDispatch, useSelector } from "react-redux";

const { Title, Text } = Typography;
const { Option } = Select;

const HHRegister = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const dispatch = useDispatch();
const { loading } = useSelector((state) => state.hhRegister);

  /* ================= SUBMIT ================= */
const onFinish = async (values) => {
  try {
    const payload = new FormData();

    payload.append("first_name", values.firstName);
    payload.append("last_name", values.lastName);
    payload.append("email", values.email);
    payload.append("mobile", values.mobile);
    payload.append("city", values.city);
    payload.append("full_address", values.address);
    payload.append("preferred_counselling_mode", values.preferred_counselling_mode);

    if (values.photo?.[0]?.originFileObj) {
      payload.append("photo", values.photo[0].originFileObj);
    }

    if (values.resume?.[0]?.originFileObj) {
      payload.append("resume", values.resume[0].originFileObj);
    }

    if (values.payment?.[0]?.originFileObj) {
      payload.append("payment", values.payment[0].originFileObj);
    }

    // 🔥 API CALL
    await dispatch(registerHH(payload)).unwrap();

    message.success("Registered successfully 🎉");
    navigate("/hhlogin");

  } catch (err) {
    message.error(err?.message || "Registration failed ❌");
  }
};

  return (
    <ConfigProvider theme={adminTheme}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          background: "linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)",
        }}
      >
        <Card
          bordered={false}
          style={{
            width: "100%",
            maxWidth: 980,
            borderRadius: 24,
            overflow: "hidden",
            background: "linear-gradient(135deg, #1E40AF, #6b85db)",
            boxShadow: "0 30px 70px rgba(30, 64, 175, 0.35)",
          }}
        >
          <Row>
            {/* LEFT PANEL */}
            <Col xs={24} md={10} style={{ color: "#fff", padding: "70px 32px" }}>
              <Title style={{ color: "#fff", fontSize: 32 }}>
                Handholding Program 🤝
              </Title>

              <Text style={{ color: "rgba(255,255,255,0.9)" }}>
                Get personalized guidance, career clarity, and mentorship
                support to achieve your goals faster.
              </Text>
            </Col>

            {/* RIGHT FORM */}
            <Col
              xs={24}
              md={14}
              style={{
                padding: "48px 40px",
                background: "#fff",
                borderRadius: "0 24px 24px 0",
              }}
            >
              {/* LOGO + TITLE */}
              <div style={{ marginBottom: 16 }}>
                <img
                  src="/Abhinav-logo.jpg"
                  alt="Career Counselling"
                  style={{
                    width: 150,
                    marginBottom: 6,
                  }}
                />

                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#1E40AF",
                  }}
                >
                  Career Counselling Platform
                </div>

                <Title level={3} style={{ marginTop: 12 }}>
                  Handholding Program Registration
                </Title>
              </div>

              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Divider orientation="left">Basic Details</Divider>

                <Row gutter={16}>
                  <Col md={12}>
                    <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                      <Input prefix={<UserOutlined />} />
                    </Form.Item>
                  </Col>

                  <Col md={12}>
                    <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                      <Input prefix={<UserOutlined />} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col md={12}>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
                      <Input prefix={<MailOutlined />} />
                    </Form.Item>
                  </Col>

                  <Col md={12}>
                    <Form.Item name="mobile" label="Mobile Number" rules={[{ required: true }]}>
                      <Input prefix={<PhoneOutlined />} maxLength={10} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                    
                  <Col md={12}>
                    <Form.Item name="preferred_counselling_mode" label="Preferred Counselling Mode" rules={[{ required: true }]}>
                      <Select placeholder="Select Mode">
                        <Option value="online">Online</Option>
                        <Option value="offline">Offline</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  
                  <Col md={12}>
                    <Form.Item name="city" label="City" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>

                </Row>

                <Form.Item name="address" label="Full Address" rules={[{ required: true }]}>
                  <Input.TextArea rows={3} />
                </Form.Item>

          <Row gutter={16}>
  <Col xs={24} md={12}>
    <Form.Item
      name="photo"
      label="Upload Photo"
      valuePropName="fileList"
      getValueFromEvent={(e) => e.fileList}
    >
      <Upload beforeUpload={() => false} maxCount={1}>
        <Button icon={<UploadOutlined />}>Upload Photo</Button>
      </Upload>
    </Form.Item>
  </Col>

  <Col xs={24} md={12}>
    <Form.Item
      name="resume"
      label="Upload Resume"
      valuePropName="fileList"
      getValueFromEvent={(e) => e.fileList}
    >
      <Upload beforeUpload={() => false} maxCount={1}>
        <Button icon={<UploadOutlined />}>Upload Resume</Button>
      </Upload>
    </Form.Item>
  </Col>

  <Col xs={24} md={12}>
    <Form.Item
      name="payment"
      label="Payment Details"
      valuePropName="fileList"
      getValueFromEvent={(e) => e.fileList}
    >
      <Upload beforeUpload={() => false} maxCount={1}>
        <Button icon={<UploadOutlined />}>
          Upload Payment
        </Button>
      </Upload>
    </Form.Item>
  </Col>
</Row>

                <Divider />

                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                  Register
                </Button>

                <Divider />

                <Text style={{ display: "block", textAlign: "center" }}>
                  Already have an account?{" "}
                  <Text
                    type="primary"
                    style={{
                      cursor: "pointer",
                      textDecoration: "underline",
                      color: "#1890ff",
                    }}
                    onClick={() => navigate("/hhlogin")}
                  >
                    Login
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

export default HHRegister;
