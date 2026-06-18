import React, { useState, useEffect } from "react";
import {
    Modal,
    Form,
    Input,
    Button,
    Row,
    Col,
    Upload,
    Select,
    Switch,
    Divider,
    Card,
    Empty,
    Image,
    message,
} from "antd";
import { UploadOutlined, EyeOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchPackagesByProgram } from "../../../adminSlices/packageSlice";
import { fetchActivePrograms } from "../../../adminSlices/programSlice";
import { createHandholdingParticipant, } from "../../../hhSlices/handholdingUsersSlice";

const { Option } = Select;

const AddHHUserModal = ({ open, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const liveValues = Form.useWatch([], form);

    const dispatch = useDispatch();

    const { activeList: programs, loading: programsLoading, } = useSelector((state) => state.programs);

    const { list: packages, loading: packagesLoading } = useSelector(
        (state) => state.packages
    );

    const { createLoading } = useSelector((state) => state.handholdingUsers);

    const [photo, setPhoto] = useState([]);
    const [resume, setResume] = useState([]);
    const [payment, setPayment] = useState([]);

    const [photoPreview, setPhotoPreview] = useState(null);
    const [resumePreview, setResumePreview] = useState(null);
    const [paymentPreview, setPaymentPreview] = useState(null);

    useEffect(() => {
        if (open) {
            dispatch(fetchActivePrograms());
        }
    }, [open, dispatch]);

    useEffect(() => {
        if (programs?.length) {
            const handHoldingProgram = programs.find(
                (p) => p.name?.toLowerCase() === "hand holding program"
            );

            if (handHoldingProgram) {
                form.setFieldsValue({
                    program_id: handHoldingProgram.id,
                });

                dispatch(fetchPackagesByProgram(handHoldingProgram.id));
            }
        }
    }, [programs, form, dispatch]);

    const urlToFileList = (url) => {
        if (!url) return [];
        return [
            {
                uid: "-1",
                name: url.split("/").pop(),
                status: "done",
                url: url.startsWith("http")
                    ? url
                    : `${process.env.REACT_APP_BASE_URL}${url}`,
            },
        ];
    };

    /* ================= FILE HANDLER ================= */
    const handleFile = (type) => (e) => {
        const fileList = e.fileList;
        const file = fileList[0];

        if (type === "photo") {
            setPhoto(fileList);
            setPhotoPreview(file?.originFileObj
                ? URL.createObjectURL(file.originFileObj)
                : file?.url || null);
        }

        if (type === "resume") {
            setResume(fileList);
            setResumePreview(file?.originFileObj
                ? URL.createObjectURL(file.originFileObj)
                : file?.url || null);
        }

        if (type === "payment") {
            setPayment(fileList);
            setPaymentPreview(file?.originFileObj
                ? URL.createObjectURL(file.originFileObj)
                : file?.url || null);
        }
    };

    /* ================= PREFILL ================= */
    useEffect(() => {
        if (open) {
            form.resetFields();

            setPhoto([]);
            setResume([]);
            setPayment([]);

            setPhotoPreview(null);
            setResumePreview(null);
            setPaymentPreview(null);

            const handHoldingProgram = programs?.find(
                (p) => p.name?.toLowerCase() === "hand holding program"
            );

            if (handHoldingProgram) {
                form.setFieldsValue({
                    program_name: "Hand Holding Program",
                    program_id: handHoldingProgram.id,
                });

                dispatch(fetchPackagesByProgram(handHoldingProgram.id));
            }
        }
    }, [open, form, programs, dispatch]);


    /* ================= SUBMIT ================= */
    const handleSubmit = async (values) => {
        try {
            const formData = new FormData();

            formData.append("first_name", values.firstName || "");
            formData.append("last_name", values.lastName || "");
            formData.append("email", values.email || "");
            formData.append("phone", values.mobile || "");
            formData.append("city", values.city || "");
            formData.append("full_address", values.full_address || "");
            formData.append("program", values.program_id || "");
            formData.append("package", values.package_id || "");
            formData.append(
                "preferred_counselling_mode",
                values.preferred_counselling_mode || ""
            );

            formData.append(
                "show_profile",
                values.show_profile ? "True" : "False"
            );

            if (photo[0]?.originFileObj) {
                formData.append("photo", photo[0].originFileObj);
            }

            if (resume[0]?.originFileObj) {
                formData.append("resume_file", resume[0].originFileObj);
            }

            if (payment[0]?.originFileObj) {
                formData.append("proof_file", payment[0].originFileObj);
            }

            await dispatch(createHandholdingParticipant(formData)).unwrap();

            message.success("HH User created successfully");

            form.resetFields();
            setPhoto([]);
            setResume([]);
            setPayment([]);
            setPhotoPreview(null);
            setResumePreview(null);
            setPaymentPreview(null);

            onSuccess();
        } catch (err) {
            console.error(err);

            message.error(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to create HH User"
            );
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            width="100%"
            style={{ maxWidth: 1100 }}
            centered
            destroyOnClose
            title="Add HH User"
        >
            <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>
                <Form layout="vertical" form={form} onFinish={handleSubmit}>
                    <Row gutter={[16, 16]}>

                        {/* ================= LEFT FORM ================= */}
                        <Col xs={24} lg={14}>
                            <Row gutter={[16, 16]}>

                                {/* BASIC DETAILS */}
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="firstName"
                                        label="First Name"
                                        rules={[
                                            { required: true, message: "Please enter first name" },
                                            {
                                                pattern: /^[A-Za-z\s]+$/,
                                                message: "Only letters are allowed",
                                            },
                                        ]}
                                    >
                                        <Input
                                            maxLength={50}
                                            onKeyPress={(e) => {
                                                if (!/^[A-Za-z ]$/.test(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="lastName"
                                        label="Last Name"
                                        rules={[
                                            {
                                                pattern: /^[A-Za-z\s]*$/,
                                                message: "Only letters are allowed",
                                            },
                                        ]}
                                    >
                                        <Input
                                            maxLength={50}
                                            onKeyPress={(e) => {
                                                if (!/^[A-Za-z ]$/.test(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="email"
                                        label="Email"
                                        rules={[
                                            { required: true, message: "Please enter email" },
                                            { type: "email", message: "Please enter a valid email address" },
                                        ]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="mobile"
                                        label="Mobile"
                                        rules={[
                                            { required: true, message: "Please enter mobile number" },
                                            {
                                                pattern: /^[0-9]{10}$/,
                                                message: "Mobile number must be 10 digits",
                                            },
                                        ]}
                                    >
                                        <Input maxLength={10} />
                                    </Form.Item>
                                </Col>

                                {/* PREFILLED */}
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="program_name"
                                        label="Program"
                                        initialValue="Hand Holding Program"
                                        rules={[
                                            { required: true, message: "Program is required" },
                                        ]}
                                    >
                                        <Input disabled />
                                    </Form.Item>

                                    <Form.Item name="program_id" hidden>
                                        <Input />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="package_id"
                                        label="Counselling Service"
                                        rules={[
                                            {
                                                required: true,
                                                message: "Please select counselling service",
                                            },
                                        ]}
                                    >
                                        <Select
                                            placeholder={
                                                packagesLoading
                                                    ? "Loading services..."
                                                    : "Select service"
                                            }
                                            loading={packagesLoading}
                                        >
                                            {packages.map((pkg) => (
                                                <Option key={pkg.id} value={pkg.id}>
                                                    {pkg.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>


                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="preferred_counselling_mode"
                                        label="Preferred Counselling Mode"
                                        rules={[{ required: true }]}
                                    >
                                        <Select placeholder="Select mode">
                                            <Option value="online">Online</Option>
                                            <Option value="offline">Offline</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>

                                
                                {/* USER INPUT */}
                                <Col xs={24} sm={12}>
                                    <Form.Item name="city" label="City" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                </Col>

                                <Col span={24}>
                                    <Form.Item name="full_address" label="Full Address">
                                        <Input.TextArea rows={3} />
                                    </Form.Item>
                                </Col>

                                <Divider />

                                {/* UPLOADS */}
                                <Col xs={24} sm={12}>
                                    <Form.Item label="Upload Photo">
                                        <Upload beforeUpload={() => false} maxCount={1} fileList={photo} onChange={handleFile("photo")}>
                                            <Button icon={<UploadOutlined />}>Upload Photo</Button>
                                        </Upload>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item label="Upload Resume">
                                        <Upload beforeUpload={() => false} maxCount={1} fileList={resume} onChange={handleFile("resume")}>
                                            <Button icon={<UploadOutlined />}>Upload Resume</Button>
                                        </Upload>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item label="Payment Proof">
                                        <Upload beforeUpload={() => false} maxCount={1} fileList={payment} onChange={handleFile("payment")}>
                                            <Button icon={<UploadOutlined />} block>
                                                Upload Payment
                                            </Button>
                                        </Upload>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="show_profile"
                                        label="Show HH User Profile"
                                        valuePropName="checked"
                                    >
                                        <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                                    </Form.Item>
                                </Col>

                            </Row>

                            {/* BUTTONS */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                <Button onClick={onCancel}>Cancel</Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={createLoading}
                                >
                                    Add HH User
                                </Button>
                            </div>
                        </Col>

                        {/* ================= RIGHT PREVIEW ================= */}
                        <Col xs={24} lg={10}>
                            <Card title="Live Preview">

                                <p><b>Name:</b> {liveValues?.firstName} {liveValues?.lastName}</p>
                                <p><b>Email:</b> {liveValues?.email}</p>
                                <p><b>Mobile:</b> {liveValues?.mobile}</p>

                                <p><b>Program:</b> Hand Holding Program</p>
                               
                                <p><b>City:</b> {liveValues?.city || "-"}</p>
                                <p><b>Preferred Counselling Mode:</b> {liveValues?.preferred_counselling_mode || "-"}</p>
                                <p><b>Full Address:</b> {liveValues?.full_address || "-"}</p>


                                <p>
                                    <b>Show Profile:</b>{" "}
                                    {liveValues?.show_profile ? "Yes" : "No"}
                                </p>

                                <Divider />

                                {/* PHOTO */}
                                <h4>Photo</h4>
                                {photoPreview ? (
                                    <Image src={photoPreview} style={{ width: "100%" }} />
                                ) : (
                                    <Empty description="No photo uploaded" />
                                )}

                                <Divider />

                                {/* RESUME */}
                                <h4>Resume</h4>
                                {resumePreview ? (
                                    <a href={resumePreview} target="_blank" rel="noreferrer">
                                        View Resume
                                    </a>
                                ) : (
                                    <Empty description="No resume uploaded" />
                                )}

                                <Divider />

                                {/* PAYMENT */}
                                <h4>Payment Proof</h4>
                                {paymentPreview ? (
                                    <Image src={paymentPreview} style={{ width: "100%" }} />
                                ) : (
                                    <Empty description="No payment uploaded" />
                                )}

                            </Card>
                        </Col>

                    </Row>
                </Form>
            </div>
        </Modal>
    );
};

export default AddHHUserModal;
