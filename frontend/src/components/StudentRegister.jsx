import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Row,
  Col,
  DatePicker,
  Select,
  Divider,
  ConfigProvider,
  message,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import adminTheme from "../theme/adminTheme";

const { Title, Text } = Typography;
const { Option } = Select;

const StudentRegister = () => {
  const navigate = useNavigate();

  const [parentMode, setParentMode] = useState("compact"); // compact | full
  const [parentExists, setParentExists] = useState(null); // null | true | false
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [form] = Form.useForm();
  const [parentMobileValue, setParentMobileValue] = useState(""); // tracks parent mobile input

  const onFinish = (values) => {
    if (!otpVerified) {
      message.error("Please verify parent mobile before creating account");
      return;
    }
    console.log(values);
    message.success("Account created (demo)");
  };

  /* ---------- CHECK PARENT & SEND OTP ---------- */
  const handleParentCheck = () => {
    const mobile = form.getFieldValue("parentMobile");

    if (!mobile || mobile.length !== 10) {
      message.error("Please enter a valid 10 digit mobile number");
      return;
    }

    setSendingOtp(true);

    // 🔁 Simulated API
    setTimeout(() => {
      const exists = mobile === "9999999999"; // demo existing parent

      setParentExists(exists);
      setSendingOtp(false);

      if (exists) {
        message.success("Parent found. OTP sent");
        setOtpSent(true);
      } else {
        message.info("Parent not found. Please enter parent details");
        setParentMode("full");
      }
    }, 1000);
  };

  /* ---------- SEND OTP (FOR NEW PARENT) ---------- */
  const handleSendOtp = (mobileParam) => {
    const mobile = mobileParam ?? form.getFieldValue("parentMobile");

    if (!mobile || mobile.length !== 10) {
      message.error("Please enter a valid 10 digit mobile number");
      return;
    }

    setSendingOtp(true);
    setTimeout(() => {
      setSendingOtp(false);
      setOtpSent(true);
      message.success(`OTP sent to +91 ${mobile}`);
    }, 800);
  }; 

  /* ---------- VERIFY OTP ---------- */
  const handleVerifyOtp = () => {
    if (!otpValue || otpValue.trim().length < 4) {
      message.error("Enter a valid OTP");
      return;
    }

    setVerifyingOtp(true);
    setTimeout(() => {
      setVerifyingOtp(false);
      setOtpVerified(true);
      message.success("OTP verified successfully");
    }, 800);
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
   {/* LEFT INFO PANEL */}
            <Col
              xs={24}
              md={10}
              style={{
                color: "#FFFFFF",
                padding: "70px 32px",
              }}
            >
              <Title
                style={{
                  color: "#FFFFFF",
                  fontSize: 32,
                  fontWeight: 700,
                }}
              >
                Start Your Journey 🎓
              </Title>

              <Text
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 16,
                  lineHeight: 1.6,
                }}
              >
                Create your account to access career assessments, expert
                counselling, and a personalized student dashboard.
              </Text>

              <ul
                style={{
                  marginTop: 30,
                  paddingLeft: 20,
                  lineHeight: "30px",
                }}
              >
                <li>✔ Career Assessment</li>
                <li>✔ Expert Counselling</li>
                <li>✔ Progress Tracking</li>
              </ul>
            </Col>

            {/* RIGHT FORM PANEL */}
            <Col
              xs={24}
              md={14}
              style={{
                padding: "48px 40px",
                background: "#fff",
                borderRadius: "0 24px 24px 0",
              }}
            >
              <Title level={3}>Student Registration</Title>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onValuesChange={(changedValues) => {
                  if (changedValues.parentMobile !== undefined) setParentMobileValue(changedValues.parentMobile || "");
                }}
                style={{ marginTop: 28 }}
              >
                <Divider orientation="left">Student Details</Divider>

                {/* --- Student fields (UNCHANGED) --- */}
                <Row gutter={16}>
                  <Col md={12}>
                    <Form.Item label="Student Name" name="studentName" rules={[{ required: true }]}>
                      <Input size="large" prefix={<UserOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col md={12}>
                    <Form.Item label="Date of Birth" name="dob" rules={[{ required: true }]}>
                      <DatePicker size="large" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col md={12}>
                    <Form.Item label="Email" name="email" rules={[{ type: "email", required: true }]}>
                      <Input size="large" prefix={<MailOutlined />} />
                    </Form.Item>
                  </Col>

                  <Col md={12}>
                    <Form.Item label="Mobile Number" name="mobile">
                      <Input size="large" prefix={<PhoneOutlined />} maxLength={10} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col md={12}>
                    <Form.Item label="Class" name="class" rules={[{ required: true }]}> 
                      <Select size="large" placeholder="Select Class">
                        {[...Array(12)].map((_, i) => (
                          <Option key={i + 5} value={`Class ${i + 5}`}>
                            Class {i + 5}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col md={12}>
                    <Form.Item label="Stream" name="stream">
                      <Select size="large" placeholder="Optional">
                        <Option>Science</Option>
                        <Option>Commerce</Option>
                        <Option>Arts</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Divider orientation="left">Parent Details</Divider>

                {/* ---------- COMPACT MODE ---------- */}
                {parentMode === "compact" && (
                  <>
                    <Row gutter={16}>
                      <Col md={12}>
                        <Form.Item
                          label="Mobile Number(WhatsApp)"
                          name="parentMobile"
                          rules={[{ required: true }]}
                        >
                          <Input size="large" maxLength={10} prefix={<PhoneOutlined />} />
                        </Form.Item>
                      </Col>
                      <Col md={12}>
                        <Form.Item label="Email" name="parentEmail">
                          <Input size="large" prefix={<MailOutlined />} />
                        </Form.Item>
                      </Col>
                    </Row>

                    {parentMobileValue && parentMobileValue.toString().length === 10 ? (
                      <Button
                        type="primary"
                        loading={sendingOtp}
                        onClick={handleParentCheck}
                      >
                        Send OTP
                      </Button>
                    ) : (
                      <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                        {/* Enter parent mobile to send OTP */}
                      </Text>
                    )}
                  </>
                )}

                {/* ---------- FULL PARENT DETAILS (ONLY IF NOT EXISTS) ---------- */}
                {parentMode === "full" && parentExists === false && (
                  <>
                    <Row gutter={16}>
                      <Col md={12}>
                        <Form.Item
                          label="Mobile Number (WhatsApp)"
                          name="parentMobile"
                          rules={[{ required: true }]}
                        >
                          <Input size="large" maxLength={10} prefix={<PhoneOutlined />} />
                        </Form.Item>
                      </Col>

                      <Col md={12}>
                        <Form.Item label="Email" name="parentEmail" rules={[{ type: "email" }]}> 
                          <Input size="large" prefix={<MailOutlined />} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      label="Parent Name"
                      name="parentName"
                      rules={[{ required: true }]}
                    >
                      <Input size="large" prefix={<UserOutlined />} />
                    </Form.Item>

                    {parentMobileValue && parentMobileValue.toString().length === 10 ? (
                      <Button
                        type="primary"
                        loading={sendingOtp}
                        onClick={() => handleSendOtp(form.getFieldValue("parentMobile"))}
                      >
                        Send OTP
                      </Button>
                    ) : (
                      <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                        {/* Enter parent mobile to send OTP */}
                      </Text>
                    )}
                  </>
                )}

                {/* ---------- OTP SECTION ---------- */}
                {otpSent && !otpVerified && (
                  <Row gutter={16} align="middle" style={{ marginTop: 16 }}>
                    <Col md={8}>
                      <Input
                        placeholder="Enter OTP"
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Button
                        type="primary"
                        loading={verifyingOtp}
                        onClick={handleVerifyOtp}
                      >
                        Verify OTP
                      </Button>
                    </Col>
                  </Row>
                )}

                {otpVerified && (
                  <Text type="success" style={{ display: "block", marginTop: 12 }}>
                    Parent mobile verified ✓
                  </Text>
                )}

                {/* --- Password section (UNCHANGED) --- */}
                <Divider />

                <Row gutter={16}>
                  <Col md={12}>
                    <Form.Item label="Password" name="password" rules={[{ required: true, min: 8 }]}>
                      <Input.Password size="large" prefix={<LockOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col md={12}>
                    <Form.Item
                      label="Confirm Password"
                      name="confirmPassword"
                      dependencies={["password"]}
                      rules={[
                        { required: true },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || value === getFieldValue("password")) {
                              return Promise.resolve();
                            }
                            return Promise.reject("Passwords do not match");
                          },
                        }),
                      ]}
                    >
                      <Input.Password size="large" prefix={<LockOutlined />} />
                    </Form.Item>
                  </Col>
                </Row>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  disabled={!otpVerified}
                >
                  Create Account
                </Button>

                 <Divider />

                <Text
                  style={{
                    display: "block",
                    textAlign: "center",
                  }}
                >
                  Already have an account?{" "}
                  <Text
                    type="primary"
                    style={{
                      cursor: "pointer",
                      color: "#1890ff",
                      textDecoration: "underline",
                    }}
                    onClick={() => navigate("/")}
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

export default StudentRegister;
