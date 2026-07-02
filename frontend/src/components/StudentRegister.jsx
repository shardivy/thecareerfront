import React, { useState, useEffect } from "react";
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
  CheckCircleOutlined,
} from "@ant-design/icons";
import adminTheme from "../theme/adminTheme";
import { useDispatch, useSelector } from "react-redux";
import { fetchActivePrograms } from "../adminSlices/programSlice";
import { fetchStreams } from "../adminSlices/streamSlice";
import {
  sendOtp,
  resetOtpState,
  verifyOtpRegister,
  studentRegister,
} from "../adminSlices/studentSlice";
import { registerHH } from "../hhSlices/hhRegisterSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const StudentRegister = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // State
  // const [parentMode, setParentMode] = useState("compact");
  const [parentExists, setParentExists] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [parentMobileValue, setParentMobileValue] = useState("");
  const [parentEmailValue, setParentEmailValue] = useState("");
  const [specializationOptions, setSpecializationOptions] = useState([]);
  const [parentNameFromApi, setParentNameFromApi] = useState("");

  const selectedProgram = Form.useWatch("program", form);

  // Redux selectors
  const {
    sendOtpLoading,
    verifyOtpLoading,
    registerLoading
  } = useSelector((state) => state.student || {});
  const { activeList: programList = [], loading: programsLoading } = useSelector(
    (state) => state.programs
  );
  const handHoldingProgramId = programList.find((p) => p.name === "Hand Holding Program")?.id;
  const hideParentSection = handHoldingProgramId
    ? Array.isArray(selectedProgram)
      ? selectedProgram.includes(handHoldingProgramId)
      : selectedProgram === handHoldingProgramId
    : false;

  const { streamList, loading: streamsLoading } = useSelector(
    (state) => state.streams
  );

  const [classOptions] = useState([
    "8", "9", "10", "11", "12", "Engineering", "Medical",
    "Law", "Design", "Commerce", "Arts", "BBA", "UG", "PG", "Others",
  ]);

  const specializationMap = {
    "11": ["PCM (Physics, Chemistry, Mathematics)", "PCB (Physics, Chemistry, Biology)", "PCMB", "Commerce", "Arts / Humanities"],
    "12": ["PCM (Physics, Chemistry, Mathematics)", "PCB (Physics, Chemistry, Biology)", "PCMB", "Commerce", "Arts / Humanities"],
    "Engineering": ["Computer Science Engineering (CSE)", "Information Technology (IT)", "AI/ML", "Data Science", "Electronics & Telecommunication (ENTC)"],
    "Medical": ["MBBS", "BDS (Dental)", "BAMS (Ayurveda)", "BHMS (Homeopathy)", "BPT (Physiotherapy)"],
    "Law": ["Criminal Law", "Corporate Law", "Civil Law", "Constitutional Law"],
    "Design": ["Fashion Design", "Interior Design", "Graphic Design", "UI/UX Design"],
    "Commerce": ["B.Com General", "B.Com Accounting", "B.Com Finance", "CA", "CS"],
    "Arts": ["BA English", "BA Psychology", "BA Sociology", "BA History"],
    "BBA": ["Finance", "Marketing", "HR", "International Business"],
  };

  // Fetch programs and streams
  useEffect(() => {
    dispatch(fetchActivePrograms());
    dispatch(fetchStreams());
  }, [dispatch]);

  // Cleanup OTP state
  useEffect(() => {
    return () => dispatch(resetOtpState());
  }, [dispatch]);

  // Helper
  // const canSendOtp =
  //   parentMobileValue.length === 10 && parentEmailValue && !otpVerified && !otpSent;
  const studentEmail = Form.useWatch("email", form);

  const canSendOtp =
    studentEmail &&
    !otpVerified &&
    !otpSent;

  // Handlers
  const handleParentCheck = () => {
    const mobile = parentMobileValue;
    const email = parentEmailValue;

    if (!mobile || mobile.length !== 10) {
      message.error("Please enter a valid 10 digit mobile number");
      return;
    }
    if (!email) {
      message.error("Please enter parent email");
      return;
    }

    dispatch(sendOtp({ student_email: form.getFieldValue("email"), }))
      .unwrap()
      .then((res) => {
        setOtpSent(true);
        message.success(res.message || "OTP sent successfully");
        if (res.parent_exists === false) {
          setParentMode("full");
          setParentExists(false);
        } else {
          setParentExists(true);
        }
      })
      .catch((err) => message.error(err));
  };

  const handleSendOtp = () => {
    const studentEmail = form.getFieldValue("email");

    if (!studentEmail) {
      message.error("Please enter student email");
      return;
    }

    dispatch(
      sendOtp({
        student_email: studentEmail,
      })
    )
      .unwrap()
      .then((res) => {
        setOtpSent(true);
        message.success(res.message || "OTP sent successfully");
      })
      .catch((err) => message.error(err));
  };

  const handleVerifyOtp = () => {
    const studentEmail = form.getFieldValue("email");
    const parentEmail = form.getFieldValue("parentEmail");

    if (!studentEmail) {
      message.error("Enter student email");
      return;
    }

    if (!parentEmail) {
      message.error("Enter parent email");
      return;
    }

    if (!otpValue) {
      message.error("Enter OTP");
      return;
    }

    dispatch(
      verifyOtpRegister({
        student_email: studentEmail,
        parent_email: parentEmail,
        otp: otpValue,
      })
    )
      .unwrap()
      .then((res) => {
        setOtpVerified(true);

        // save parent existence
        setParentExists(res.parent_exists);

        // Existing Parent
        if (res.parent_exists === true) {
          setParentNameFromApi(res.parent_name || "");

          form.setFieldsValue({
            parentName: res.parent_name || "",
          });
        }

        // New Parent
        if (res.parent_exists === false) {
          form.setFieldsValue({
            parentName: "",
          });
        }

        message.success(res.message || "OTP verified successfully");
      })
      .catch((err) => message.error(err));
  };

  const onFinish = (values) => {
    const selectedProgramIds = Array.isArray(values.program)
      ? values.program
      : [values.program];
    const isHandHolding = handHoldingProgramId
      ? selectedProgramIds.includes(handHoldingProgramId)
      : false;

    // 👉 HAND HOLDING FLOW
    if (isHandHolding) {
      const formData = new FormData();

      // split name safely
      const firstName = values.firstName || "";
      const lastName = values.lastName || "";

      formData.append("first_name", firstName);
      formData.append("last_name", lastName);

      formData.append("email", values.email || "");
      formData.append("mobile", values.mobile || "");
      formData.append("city", values.city || "");
      formData.append("full_address", values.address || "");

      formData.append(
        "preferred_counselling_mode",
        values.preferred_counselling_mode || ""
      );

      formData.append("password", values.password || "");
      formData.append("confirm_password", values.confirmPassword || "");

      // optional (if needed by backend)
      const programValue = Array.isArray(values.program)
        ? JSON.stringify(values.program)
        : values.program;
      formData.append("program", programValue);

      dispatch(registerHH(formData))
        .unwrap()
        .then((res) => {
          message.success(res.message || "Hand Holding registration successful");
          navigate("/");
        })
        .catch((err) => message.error(err));

      return;
    }

    // 👉 NORMAL FLOW (existing logic)
    if (!otpVerified) {
      message.error("Please verify parent mobile before creating account");
      return;
    }

    const payload = {
      student_name: `${values.firstName} ${values.lastName}`,
      dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
      student_email: values.email,
      student_mobile: values.mobile || "",
      study_class: values.class,
      specialization: values.specialization || "",
      stream: values.stream || "",
      parent_mobile: values.parentMobile,
      parent_email: values.parentEmail,
      parent_name: values.parentName,
      program: Array.isArray(values.program)
        ? values.program
        : [values.program],
      password: values.password,
      confirm_password: values.confirmPassword,
    };

    dispatch(studentRegister(payload))
      .unwrap()
      .then((res) => {
        message.success(res.message || "Account created successfully");
        navigate("/");
      })
      .catch((err) => message.error(err));
  };

  // const onFinish = (values) => {
  //   if (!otpVerified) {
  //     message.error("Please verify parent mobile before creating account");
  //     return;
  //   }

  //   const payload = {
  //     student_name: values.studentName,
  //     dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
  //     student_email: values.email,
  //     student_mobile: values.mobile || "",
  //     study_class: values.class,
  //     specialization: values.specialization || "",
  //     stream: values.stream || "",
  //     parent_mobile: values.parentMobile,
  //     parent_email: values.parentEmail,
  //     parent_name: values.parentName,
  //     program: programList.find((p) => p.name === values.program)?.id,
  //     password: values.password,
  //     confirm_password: values.confirmPassword,
  //   };

  //   dispatch(studentRegister(payload))
  //     .unwrap()
  //     .then((res) => {
  //       message.success(res.message || "Account created successfully");
  //       navigate("/");
  //     })
  //     .catch((err) => message.error(err));
  // };

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
            <Col xs={24} md={10} style={{ color: "#FFFFFF", padding: "70px 32px" }}>
              <Title style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 700 }}>
                Start Your Journey 🎓
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16, lineHeight: 1.6 }}>
                Create your account to access career assessments, expert counselling, and a personalized student dashboard.
              </Text>
            </Col>

            {/* RIGHT FORM PANEL */}
            <Col xs={24} md={14} style={{ padding: "48px 40px", background: "#fff", borderRadius: "0 24px 24px 0" }}>
              {/* LOGO + TITLE */}
              <div style={{ marginBottom: 16 }}>
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
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#1E40AF",
                  }}
                >
                  Career Counselling Platform
                </div>

                <Title
                  level={3}
                  style={{
                    marginTop: 12,
                    marginBottom: 24,
                  }}
                >
                  Student / User Registration
                </Title>
              </div>
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onValuesChange={(changedValues) => {
                  if (changedValues.parentMobile !== undefined) {
                    const newMobile = changedValues.parentMobile || "";
                    setParentMobileValue(newMobile);

                    // 🔄 Reset OTP flow if mobile changed after sending OTP
                    if (otpSent) {
                      setOtpSent(false);
                      setOtpVerified(false);
                      setOtpValue("");
                    }
                  }

                  if (changedValues.parentEmail !== undefined) {
                    const newEmail = changedValues.parentEmail || "";
                    setParentEmailValue(newEmail);

                    // 🔄 Reset OTP flow if email changed after sending OTP
                    if (otpSent) {
                      setOtpSent(false);
                      setOtpVerified(false);
                      setOtpValue("");
                    }
                  }
                }}
                style={{ marginTop: 28 }}
              >



                {/* 🔥 PROGRAM FIRST */}
                <Divider orientation="left">Select Program</Divider>

                <Row gutter={16}>
                  <Col md={24}>
                    <Form.Item label="Interested Program" name="program" rules={[{ required: true }]}>
                      <Select
                        key={hideParentSection ? "single" : "multiple"}  // ✅ forces remount on mode change
                        size="large"
                        mode={hideParentSection ? undefined : "multiple"}
                        placeholder={programsLoading ? "Loading programs..." : "Select Interested Programs"}
                        loading={programsLoading}
                        allowClear
                        onChange={(value) => {
                          // When switching to HH (single), clear field then set
                          if (value === handHoldingProgramId ||
                            (Array.isArray(value) && value.includes(handHoldingProgramId))) {
                            form.setFieldsValue({ program: handHoldingProgramId });
                          }
                        }}
                      >
                        {programList.map((program) => (
                          <Option key={program.id} value={program.id}>
                            {program.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Divider orientation="left">Student Details</Divider>
                <Row gutter={16}>
                  <Col md={12}>
                    <Form.Item
                      label="First Name"
                      name="firstName"
                      rules={[{ required: true, message: "Enter first name" }]}
                    >
                      <Input size="large" prefix={<UserOutlined />} />
                    </Form.Item>
                  </Col>

                  <Col md={12}>
                    <Form.Item
                      label="Last Name"
                      name="lastName"
                      rules={[{ required: true, message: "Enter last name" }]}
                    >
                      <Input size="large" prefix={<UserOutlined />} />
                    </Form.Item>
                  </Col>
                </Row>


                {hideParentSection && (
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[{ type: "email", required: true }]}
                      >
                        <Input size="large" prefix={<MailOutlined />} />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Mobile Number"
                        name="mobile"
                        rules={[{ required: true, message: "Enter mobile number" }]}
                      >
                        <Input size="large" prefix={<PhoneOutlined />} maxLength={10} />
                      </Form.Item>
                    </Col>
                  </Row>
                )}
                {!hideParentSection && (
                  <>
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item label="Date of Birth" name="dob">
                          <DatePicker size="large" style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Email"
                          name="email"
                          rules={[{ type: "email", required: true }]}
                        >
                          <Input size="large" prefix={<MailOutlined />} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item label="Mobile Number" name="mobile">
                          <Input size="large" prefix={<PhoneOutlined />} maxLength={10} />
                        </Form.Item>
                      </Col>

                      {!hideParentSection && (
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="Class"
                            name="class"
                            rules={[{ required: true }]}
                          >
                            <Select
                              size="large"
                              placeholder="Select Class"
                              onChange={(value) => {
                                const specs = specializationMap[value] || [];
                                setSpecializationOptions(specs);
                                form.setFieldsValue({ specialization: undefined });
                              }}
                            >
                              {classOptions.map((cls) => (
                                <Option key={cls} value={cls}>
                                  {cls}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      )}
                    </Row>
                  </>
                )}



                <Row gutter={16}>
                  {!hideParentSection && (
                    <Col md={12}>
                      <Form.Item label="Specialization" name="specialization">
                        <Select size="large" placeholder="Select Specialization" disabled={specializationOptions.length === 0}>
                          {specializationOptions.map((spec) => (
                            <Option key={spec} value={spec}>
                              {spec}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  )}

                  {!hideParentSection && (
                    <Col md={12}>
                      <Form.Item label="Current Stream" name="stream">
                        <Select
                          size="large"
                          placeholder={streamsLoading ? "Loading streams..." : "Select Stream"}
                          loading={streamsLoading}
                          allowClear
                        >
                          {streamList.map((stream) => (
                            <Option key={stream.id} value={stream.name}>
                              {stream.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  )}

                </Row>

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
                            if (!value || value === getFieldValue("password")) return Promise.resolve();
                            return Promise.reject("Passwords do not match");
                          },
                        }),
                      ]}
                    >
                      <Input.Password size="large" prefix={<LockOutlined />} />
                    </Form.Item>
                  </Col>
                </Row>

                {!hideParentSection && (
                  <>
                    <Divider orientation="left">Parent Details</Divider>

                    {/* Parent Mobile & Email */}
                    <Row gutter={16}>
                      <Col md={12}>
                        <Form.Item
                          label="Mobile Number (WhatsApp)"
                          name="parentMobile"
                          rules={[
                            { required: true, message: "Parent mobile number is required" }
                          ]}
                        >
                          <Input size="large" prefix={<PhoneOutlined />} maxLength={10} />
                        </Form.Item>
                      </Col>

                      <Col md={12}>
                        <Form.Item
                          label="Email"
                          name="parentEmail"
                          rules={[
                            { required: true, message: "Parent email is required" },
                            { type: "email", message: "Enter a valid email address" }
                          ]}
                        >
                          <Input size="large" prefix={<MailOutlined />} />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Full Parent Mode */}
                    {otpVerified && (
                      <Form.Item
                        label="Parent Name"
                        name="parentName"
                        rules={[
                          {
                            required: true,
                            message: "Please enter parent name",
                          },
                        ]}
                      >
                        <Input
                          size="large"
                          prefix={<UserOutlined />}
                          placeholder={
                            parentExists
                              ? "Parent name"
                              : "Enter parent name"
                          }
                          disabled={parentExists === true}
                        />
                      </Form.Item>
                    )}

                    {/* Send OTP Button */}
                    {canSendOtp && (
                      <Button
                        type="primary"
                        loading={sendOtpLoading}
                        onClick={handleSendOtp}
                      >
                        Send OTP
                      </Button>
                    )}

                    {/* OTP Verification */}
                    {otpSent && !otpVerified && (
                      <>
                        <div
                          style={{
                            marginTop: 12,
                            marginBottom: 16,
                            padding: "12px 16px",
                            borderRadius: 8,
                            background: "#f6ffed",
                            border: "1px solid #b7eb8f",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <MailOutlined
                            style={{
                              color: "#52c41a",
                              fontSize: 18,
                            }}
                          />

                          <Text style={{ color: "#389e0d" }}>
                            OTP has been sent to your student email:
                            <strong> {form.getFieldValue("email")}</strong>
                          </Text>
                        </div>

                        <Row gutter={16} align="middle">
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
                              onClick={handleVerifyOtp}
                              loading={verifyOtpLoading}
                            >
                              Verify OTP
                            </Button>
                          </Col>
                        </Row>
                      </>
                    )}

                    {/* {otpVerified && (
                      <Text type="success" style={{ display: "block", marginTop: 12 }}>
                        Student Email verified ✓
                      </Text>
                    )} */}

                    {otpVerified && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: "12px 16px",
                          borderRadius: 8,
                          background: "#f6ffed",
                          border: "1px solid #b7eb8f",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <CheckCircleOutlined
                          style={{
                            color: "#52c41a",
                            fontSize: 18,
                          }}
                        />

                        <Text style={{ color: "#389e0d" }}>
                          Student email verified successfully
                        </Text>
                      </div>
                    )}
                  </>
                )}
                <Divider />

                <Button type="primary" htmlType="submit" block size="large" loading={registerLoading} disabled={hideParentSection ? false : !otpVerified}>
                  Create Account
                </Button>

                <Divider />

                <Text style={{ display: "block", textAlign: "center" }}>
                  Already have an account?{" "}
                  <Text type="primary" style={{ cursor: "pointer", textDecoration: "underline", color: "#1890ff", }} onClick={() => navigate("/")}>
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