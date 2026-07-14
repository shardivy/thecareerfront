import React, { useState, useEffect } from "react";
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

    const goToExam = () => {
        // window.open("https://www.careerfutura.com/ba/business-associate#", "_blank");
        navigate("/student/exam-management");
    };

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

            // 1. Start Exam (fires now, on "Begin Test", instead of on the
            // exam-management page's "Start Exam" button)
            await dispatch(
                startExam({
                    studentId,
                    programId: selectedProgramId,
                    packageId: selectedPackageId,
                })
            ).unwrap();

            // 2. Save Registration
            const registerResponse = await dispatch(
                saveExamRegister({
                    studentId,
                    payload,
                })
            ).unwrap();

            console.log("Registration Response:", registerResponse);

            // 3. Get test_id from response
            const testId =
                registerResponse?.test_id ||
                registerResponse?.data?.test_id;

            if (!testId) {
                message.error("Test ID not found.");
                return;
            }

            // 4. Launch Test
            const launchResponse = await dispatch(
                launchTest({
                    studentId,
                    type: testId,
                })
            ).unwrap();

            message.success("Registration completed successfully.");

            if (launchResponse?.url) {
                window.location.href = launchResponse.url;
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

                                    <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
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
                                                    disabled={beginTestDisabled}
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
            </div>
        </ConfigProvider>
    );
};

export default ExamRegistration;