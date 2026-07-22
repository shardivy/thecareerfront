import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Form,
    Input,
    Select,
    Button,
    Typography,
    Row,
    Col,
    message,
    ConfigProvider,
    theme,
    Modal,
} from "antd";
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    LockOutlined,
    TeamOutlined,
    PlayCircleOutlined,
    ArrowLeftOutlined,
} from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";
import { useDispatch, useSelector } from "react-redux";
// import { registerForExam, startExam, loginForExam } from "../../../adminSlices/examSlice";
import { saveExamRegister, launchTest, startExam } from "../../../adminSlices/examSlice";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { useToken } = theme;

const QUALIFICATION_OPTIONS = ["8th", "9th", "10th", "11th", "12th", "Graduate", "Professional"];
const QUALIFICATION_STATUS_OPTIONS = ["Appearing", "Pass"];
const INTERESTED_IN_OPTIONS = [
    "Assessment + Report",
];

const ExamRegistration = () => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [pwdVisible, setPwdVisible] = useState(true);
    const [confirmPwdVisible, setConfirmPwdVisible] = useState(true);
    const [beginTestDisabled, setBeginTestDisabled] = useState(false);
    const [allowEditContact, setAllowEditContact] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const { token } = useToken();

    // ---- Confirmation + countdown modal state ----
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [countdown, setCountdown] = useState(null); // null = not counting
    const pendingValuesRef = useRef(null);
    const timerRef = useRef(null);

    // Data passed from ExamManagement's navigate("/student/exam-register", { state: {...} })
    const {
        first_name,
        last_name,
        email: stateEmail,
        phone: statePhone,
        password: statePassword,
        qualification: stateQualification,
    } = location.state || {};

    const studentId = localStorage.getItem("studentId");
    const reduxProgramId = useSelector((state) => state.student?.selectedProgramId);
    const reduxPackageId = useSelector((state) => state.student?.selectedPackageId);
    const selectedProgramId = reduxProgramId || localStorage.getItem("selectedProgramId");
    const selectedPackageId = reduxPackageId || localStorage.getItem("selectedPackageId");

    // Prefill the "New User" form once we know what was passed via router state.
    // Ant Design forms don't pick up initialValues reactively, so setFieldsValue
    // is the reliable way to fill it in after the values arrive.
    useEffect(() => {
        if (location.state) {
            form.setFieldsValue({
                firstName: first_name || undefined,
                lastName: last_name || undefined,
                email: stateEmail || undefined,
                phone: statePhone || undefined,
                password: statePassword || undefined,
                confirmPassword: statePassword || undefined,
                qualification: stateQualification || undefined,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state]);

    // Clean up the countdown interval if the component unmounts mid-countdown
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const goToExam = () => {
        // window.open("https://www.careerfutura.com/ba/business-associate#", "_blank");
        navigate("/student/exam-management");
    };

    // Actual submission logic — now triggered after the countdown finishes,
    // not directly from the form's onFinish.
    const handleFinish = async (values) => {
        if (beginTestDisabled) return;

        setBeginTestDisabled(true);
        setSubmitting(true);

        try {
            const payload = {
                first_name: values.firstName,
                last_name: values.lastName,
                email: values.email,
                phone: values.phone,
                password: values.password,
                confirm_password: values.password,
                study_class:
                    values.qualification === "Graduate"
                        ? "13th"
                        : values.qualification === "Professional"
                            ? "14th"
                            : values.qualification,
                qualification_status: values.qualificationStatus,
                type: "1",
                program_id: selectedProgramId,
                package_id: selectedPackageId,
            };


            // 1. Save Registration
            const registerResponse = await dispatch(
                saveExamRegister({
                    studentId,
                    payload,
                })
            ).unwrap();

            console.log("Registration Response:", registerResponse);

            // 2. Get test_id from registration response
            const testId =
                registerResponse?.test_id ||
                registerResponse?.data?.test_id;

            if (!testId) {
                message.error("Test ID not found.");
                return;
            }

            // 3. Mark the exam as started
            await dispatch(
                startExam({
                    studentId,
                    programId: selectedProgramId,
                    packageId: selectedPackageId,
                })
            ).unwrap();

            // 4. Launch the test
            const launchResponse = await dispatch(
                launchTest({
                    studentId,
                    type: testId,
                })
            ).unwrap();
            message.success("Registration completed successfully.");

            if (launchResponse?.url) {
                // Navigate the CURRENT tab (not a new one) to the test URL.
                window.location.assign(launchResponse.url);
            } else {
                message.error("Launch URL not found.");
            }
        } catch (err) {
            console.log(err);
            setBeginTestDisabled(false);

            const errors = err?.response?.data || err;

            const fieldErrors = [];

            if (errors?.email || errors?.phone) {
                // Enable editing
                setAllowEditContact(true);
            }

            if (errors?.email) {
                fieldErrors.push({
                    name: "email",
                    errors: [
                        "Please enter a new email. This email is already registered.",
                    ],
                });
            }

            if (errors?.phone) {
                fieldErrors.push({
                    name: "phone",
                    errors: [
                        "Please enter a new mobile number. This mobile number is already registered.",
                    ],
                });
            }

            if (fieldErrors.length) {
                form.setFields(fieldErrors);
                return;
            }

            message.error(errors?.message || "Registration failed");
        } finally {
            setSubmitting(false);
        }
    };

    // Form's onFinish now just stashes the validated values and opens
    // the confirmation modal — it does NOT submit anything yet.
    const handleFormFinish = (values) => {
        pendingValuesRef.current = values;
        setConfirmOpen(true);
    };

    // User confirmed on the modal — close it, start the 10s countdown,
    // then run the real submission once it hits zero.
    const handleConfirmYes = () => {
        setConfirmOpen(false);
        setCountdown(10);

        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    const values = pendingValuesRef.current;
                    pendingValuesRef.current = null;
                    // Defer to next tick so the modal can close cleanly first
                    setTimeout(() => handleFinish(values), 0);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleConfirmNo = () => {
        setConfirmOpen(false);
        pendingValuesRef.current = null;
    };

    const handleLater = () => {
        message.info("You can complete registration anytime from your dashboard.");
        navigate("/student/exam-management");
    };

    // Icon "tile" background derived from theme colors (kept local since
    // adminTheme doesn't expose tinted/alpha variants of its tokens)
    const tint = (hex, alpha) => `${hex}${alpha}`;

    return (
        <ConfigProvider theme={adminTheme}>
            <div style={{ minHeight: "100vh", background: token.colorBgLayout }}>
                {/* ============ HERO BANNER ============ */}
                <div
                    style={{
                        background: `linear-gradient(120deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
                        padding: "3px 24px",
                    }}
                >
                    <Row align="middle" gutter={[24, 16]} style={{ maxWidth: 1200, margin: "0 auto" }}>
                        <Col xs={24} md={15}>


                            <Button
                                type="text"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate("/student/exam-management")}
                                style={{
                                    color: "#fff",
                                    fontWeight: 600,
                                    padding: 0,
                                    marginBottom: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    width: "fit-content",
                                }}
                            >
                                Back
                            </Button>
                            <Text
                                style={{
                                    color: token.colorWarning,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    letterSpacing: "1.5px",
                                    textTransform: "uppercase",
                                }}
                            >
                                Psychometric Assessment Test
                            </Text>
                            <Title
                                level={2}
                                style={{
                                    color: token.colorTextPrimary,
                                    margin: "8px 0 0",
                                    fontWeight: 700,
                                    lineHeight: 1.25,
                                }}
                            >
                                You're just 120 minutes away from your{" "}
                                <span style={{ color: token.colorWarning }}>successful career</span>
                            </Title>
                            <Paragraph
                                style={{
                                    color: token.colorTextTertiary,
                                    marginTop: 10,
                                    marginBottom: 0,
                                    fontSize: 15,
                                }}
                            >
                                Complete your registration below to unlock the assessment, your personalised
                                guidance report, and a one-on-one session with a career expert.
                            </Paragraph>
                        </Col>
                        <Col xs={0} md={9} style={{ textAlign: "center" }}>
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 96,
                                    height: 96,
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.14)",
                                    border: "1px solid rgba(255,255,255,0.28)",
                                }}
                            >
                                <TeamOutlined style={{ fontSize: 40, color: token.colorTextPrimary }} />
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* ============ FORM ============ */}
                <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 24px" }}>
                    {/* Important instruction note */}
                    {/* <div
                        style={{
                            background: tint(token.colorWarning, "14"),
                            border: `1px solid ${tint(token.colorWarning, "40")}`,
                            borderRadius: token.borderRadius,
                            padding: "10px 14px",
                            marginBottom: 16,
                        }}
                    >
                        <Text style={{ fontSize: 13.5, color: token.colorTextSecondary }}>
                            <Text strong style={{ color: token.colorWarning }}>
                                Note:
                            </Text>{" "}
                            If you already clicked{" "}
                            <Text strong>Begin Test</Text> but were unable to complete it, you can
                            start again by logging in with your previous credentials.{" "}
                            <a
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate("https://www.careerfutura.com/login");
                                }}
                                style={{ color: token.colorPrimary, fontWeight: 600, cursor: "pointer" }}
                            >
                                Click here
                            </a>
                            .
                        </Text>
                    </div> */}

                    <Row justify="center">
                        {/* Registration card (New User only, no tabs) */}
                        <Col xs={24}>
                            <div
                                style={{
                                    background: token.colorBgContainer,
                                    borderRadius: token.borderRadiusLG || 14,
                                    border: `1px solid ${token.colorBorder}`,
                                    boxShadow: token.boxShadow,
                                    overflow: "hidden",
                                }}
                            >
                                <div className="compact-exam-form" style={{ padding: "20px 26px 20px" }}>
                                    <style>{`
                                        .compact-exam-form .ant-form-item {
                                            margin-bottom: 10px;
                                        }
                                        .compact-exam-form .ant-form-item-label {
                                            padding-bottom: 4px;
                                        }
                                        .compact-exam-form .ant-form-item-label > label {
                                            height: 10px;
                                            font-size: 14px;
                                        }
                                        .compact-exam-form .ant-input,
                                        .compact-exam-form .ant-input-affix-wrapper,
                                        .compact-exam-form .ant-select-selector {
                                            font-size: 14px;
                                            min-height: 10px;
                                        }
                                        .compact-exam-form .ant-select-selector {
                                            display: flex;
                                            align-items: center;
                                        }
                                    `}</style>
                                    <div
                                        style={{
                                            background: tint(token.colorInfo, "12"),
                                            borderRadius: token.borderRadius,
                                            padding: "8px 14px",
                                            marginBottom: 16,
                                        }}
                                    >
                                        <Text strong style={{ color: token.colorPrimary, fontSize: 14 }}>
                                            New here? Please sign up
                                        </Text>
                                    </div>

                                    <Form form={form} layout="vertical" onFinish={handleFormFinish} requiredMark={false}>
                                        <Row gutter={12}>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    label="First Name"
                                                    name="firstName"
                                                    rules={[{ required: true, message: "Enter your first name" }]}
                                                >
                                                    <Input prefix={<UserOutlined />} placeholder="First name" readOnly />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    label="Last Name"
                                                    name="lastName"
                                                    rules={[{ required: true, message: "Enter your last name" }]}
                                                >
                                                    <Input prefix={<UserOutlined />} placeholder="Last name" readOnly />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item
                                            label="Email"
                                            name="email"
                                            rules={[
                                                { required: true, message: "Enter your email" },
                                                { type: "email", message: "Enter a valid email" },
                                            ]}
                                        >
                                            <Input prefix={<MailOutlined />} placeholder="you@example.com" readOnly={!allowEditContact} />
                                        </Form.Item>

                                        <Form.Item
                                            label="Mobile"
                                            name="phone"
                                            rules={[
                                                { required: true, message: "Enter your mobile number" },
                                                { pattern: /^[0-9]{10}$/, message: "Enter a valid 10-digit number" },
                                            ]}
                                        >
                                            <Input prefix={<PhoneOutlined />} placeholder="Mobile number" readOnly={!allowEditContact} />
                                        </Form.Item>

                                        <Row gutter={12}>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    label="Password"
                                                    name="password"
                                                    hasFeedback
                                                    rules={[
                                                        { required: true, message: "Enter a password" },
                                                        { min: 6, message: "At least 6 characters" },
                                                    ]}
                                                >
                                                    <Input.Password
                                                        prefix={<LockOutlined />}
                                                        placeholder="Password"
                                                        readOnly
                                                        visibilityToggle={{
                                                            visible: pwdVisible,
                                                            onVisibleChange: setPwdVisible,
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    label="Confirm Password"
                                                    name="confirmPassword"
                                                    dependencies={["password"]}
                                                    hasFeedback
                                                    rules={[
                                                        { required: true, message: "Confirm your password" },
                                                        ({ getFieldValue }) => ({
                                                            validator(_, value) {
                                                                if (!value || getFieldValue("password") === value) {
                                                                    return Promise.resolve();
                                                                }
                                                                return Promise.reject(new Error("Passwords do not match"));
                                                            },
                                                        }),
                                                    ]}
                                                >
                                                    <Input.Password
                                                        prefix={<LockOutlined />}
                                                        placeholder="Confirm password"
                                                        readOnly
                                                        visibilityToggle={{
                                                            visible: confirmPwdVisible,
                                                            onVisibleChange: setConfirmPwdVisible,
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={12}>
                                            <Col xs={12} sm={12}>
                                                <Form.Item
                                                    label="Qualification"
                                                    name="qualification"
                                                    rules={[{ required: true, message: "Select qualification" }]}
                                                >
                                                    <Select placeholder="Select">
                                                        {QUALIFICATION_OPTIONS.map((opt) => (
                                                            <Option key={opt} value={opt}>
                                                                {opt}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col xs={12} sm={12}>
                                                <Form.Item
                                                    label="Status"
                                                    name="qualificationStatus"
                                                    rules={[{ required: true, message: "Select status" }]}
                                                >
                                                    <Select placeholder="Select">
                                                        {QUALIFICATION_STATUS_OPTIONS.map((opt) => (
                                                            <Option key={opt} value={opt}>
                                                                {opt}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item
                                            label="Interested In"
                                            name="type"
                                            rules={[{ required: true, message: "Select an option" }]}
                                        >
                                            <Select placeholder="Assessment + Report">
                                                {INTERESTED_IN_OPTIONS.map((opt) => (
                                                    <Option key={opt} value={opt}>
                                                        {opt}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>

                                        <Row gutter={12} style={{ marginTop: 4 }}>
                                            {/* <Col xs={12}>
                        <Button block onClick={handleLater}>
                          Later
                        </Button>
                      </Col> */}
                                            <Col xs={24}>
                                                <Button
                                                    htmlType="submit"
                                                    block
                                                    size="large"
                                                    icon={<PlayCircleOutlined />}
                                                    loading={submitting}
                                                    disabled={beginTestDisabled || countdown !== null}
                                                    style={{
                                                        background: token.colorSuccess,
                                                        borderColor: token.colorSuccess,
                                                        color: "#fff",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Begin Test
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* ============ CONFIRMATION MODAL ============ */}
                <Modal
                    open={confirmOpen}
                    onOk={handleConfirmYes}
                    onCancel={handleConfirmNo}
                    okText="Begin Test"
                    cancelText="Cancel"
                    centered
                >
                    <Title level={4} style={{ marginTop: 0 }}>
                        Ready to Start Your Test?
                    </Title>

                    <Paragraph style={{ marginBottom: 0 }}>
                        Please ensure you have a stable internet connection and are ready to complete
                        the test before proceeding.
                    </Paragraph>
                </Modal>

                {/* ============ COUNTDOWN MODAL ============ */}
                <Modal
                    open={countdown !== null}
                    closable={false}
                    maskClosable={false}
                    footer={null}
                    centered
                >
                    <div style={{ textAlign: "center", padding: "24px 0" }}>
                        <Title level={2} style={{ color: token.colorPrimary, marginBottom: 8 }}>
                            {countdown}
                        </Title>
                        <Text>
                            Your test is starting in {countdown} second{countdown === 1 ? "" : "s"}...
                        </Text>
                    </div>
                </Modal>
            </div>
        </ConfigProvider>
    );
};

export default ExamRegistration;