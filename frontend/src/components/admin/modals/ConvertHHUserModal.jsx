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
} from "antd";
import { UploadOutlined, EyeOutlined } from "@ant-design/icons";

const { Option } = Select;

const ConvertHHUserModal = ({ open, onCancel, enquiryData }) => {
    const [form] = Form.useForm();
    const liveValues = Form.useWatch([], form);

    const [photo, setPhoto] = useState([]);
    const [resume, setResume] = useState([]);
    const [payment, setPayment] = useState([]);

    const [photoPreview, setPhotoPreview] = useState(null);
    const [resumePreview, setResumePreview] = useState(null);
    const [paymentPreview, setPaymentPreview] = useState(null);

    /* ================= FILE HANDLER ================= */
    const handleFile = (type) => (e) => {
        const fileList = e.fileList;

        if (type === "photo") {
            setPhoto(fileList);
            if (fileList[0]?.originFileObj) {
                setPhotoPreview(URL.createObjectURL(fileList[0].originFileObj));
            }
        }

        if (type === "resume") {
            setResume(fileList);
            if (fileList[0]?.originFileObj) {
                setResumePreview(URL.createObjectURL(fileList[0].originFileObj));
            }
        }

        if (type === "payment") {
            setPayment(fileList);
            if (fileList[0]?.originFileObj) {
                setPaymentPreview(URL.createObjectURL(fileList[0].originFileObj));
            }
        }
    };

    /* ================= PREFILL ================= */
    useEffect(() => {
        if (!open || !enquiryData) return;

        const firstName = enquiryData.name?.split(" ")[0] || "";
        const lastName =
            enquiryData.name?.split(" ").slice(1).join(" ") || "";

        form.setFieldsValue({
            firstName,
            lastName,
            email: enquiryData.email,
            mobile: enquiryData.phone,
            program: enquiryData.program || "",
            source: enquiryData.source || "",
            date: enquiryData.date || "",
        });
    }, [open, enquiryData, form]);

    /* ================= SUBMIT ================= */
    const handleSubmit = (values) => {
        const formData = new FormData();

        Object.entries(values).forEach(([key, value]) => {
            formData.append(key, value ?? "");
        });

        if (photo[0]?.originFileObj) {
            formData.append("photo", photo[0].originFileObj);
        }
        if (resume[0]?.originFileObj) {
            formData.append("resume", resume[0].originFileObj);
        }
        if (payment[0]?.originFileObj) {
            formData.append("payment_proof", payment[0].originFileObj);
        }

        console.log("HH Payload:", formData);
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
            title="Convert to HH User"
        >
            <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>
                <Form layout="vertical" form={form} onFinish={handleSubmit}>
                    <Row gutter={[16, 16]}>

                        {/* ================= LEFT FORM ================= */}
                        <Col xs={24} lg={14}>
                            <Row gutter={[16, 16]}>

                                {/* BASIC DETAILS */}
                                <Col xs={24} sm={12}>
                                    <Form.Item name="firstName" label="First Name">
                                        <Input disabled />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item name="lastName" label="Last Name">
                                        <Input disabled />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item name="email" label="Email">
                                        <Input disabled />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item name="mobile" label="Mobile">
                                        <Input disabled />
                                    </Form.Item>
                                </Col>

                                {/* PREFILLED */}
                                <Col xs={24} sm={12}>
                                    <Form.Item name="program" label="Program">
                                        <Input disabled />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item name="source" label="Source">
                                        <Input disabled />
                                    </Form.Item>
                                </Col>

                                <Col xs={24}>
                                    <Form.Item name="date" label="Enquiry Date">
                                        <Input disabled />
                                    </Form.Item>
                                </Col>

                                {/* USER INPUT */}
                                <Col xs={24} sm={12}>
                                    <Form.Item name="city" label="City" rules={[{ required: true }]}>
                                        <Input />
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

                                <Col span={24}>
                                    <Form.Item name="address" label="Full Address">
                                        <Input.TextArea rows={3} />
                                    </Form.Item>
                                </Col>

                                <Divider />

                                {/* UPLOADS */}
                                <Col xs={24} sm={12}>
                                    <Form.Item label="Upload Photo">
                                        <Upload beforeUpload={() => false} maxCount={1} onChange={handleFile("photo")}>
                                            <Button icon={<UploadOutlined />}>Upload Photo</Button>
                                        </Upload>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item label="Upload Resume">
                                        <Upload beforeUpload={() => false} maxCount={1} onChange={handleFile("resume")}>
                                            <Button icon={<UploadOutlined />}>Upload Resume</Button>
                                        </Upload>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item label="Payment Proof">
                                        <Upload beforeUpload={() => false} maxCount={1} onChange={handleFile("payment")}>
                                            <Button icon={<UploadOutlined />} block>
                                                Upload Payment
                                            </Button>
                                        </Upload>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="showProfile"
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
                                <Button type="primary" htmlType="submit">
                                    Convert HH User
                                </Button>
                            </div>
                        </Col>

                        {/* ================= RIGHT PREVIEW ================= */}
                        <Col xs={24} lg={10}>
                            <Card title="Live Preview">

                                <p><b>Name:</b> {liveValues?.firstName} {liveValues?.lastName}</p>
                                <p><b>Email:</b> {liveValues?.email}</p>
                                <p><b>Mobile:</b> {liveValues?.mobile}</p>

                                <p><b>Program:</b> {liveValues?.program || "-"}</p>
                                <p><b>Source:</b> {liveValues?.source || "-"}</p>
                                <p><b>Enquiry Date:</b> {liveValues?.date || "-"}</p>

                                <p><b>City:</b> {liveValues?.city || "-"}</p>
                                <p><b>Preferred Counselling Mode:</b> {liveValues?.preferred_counselling_mode || "-"}</p>
                                <p><b>Address:</b> {liveValues?.address || "-"}</p>


                                <p>
                                    <b>Show Profile:</b>{" "}
                                    {liveValues?.showProfile ? "Yes" : "No"}
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

export default ConvertHHUserModal;