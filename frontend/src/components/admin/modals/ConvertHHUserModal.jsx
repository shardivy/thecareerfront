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
import { convertEnquiry } from "../../../adminSlices/convertEnquirySlice"; // adjust path
import { fetchPackagesByProgram } from "../../../adminSlices/packageSlice"; // adjust path


const { Option } = Select;

const ConvertHHUserModal = ({ open, onCancel, enquiryData }) => {
    const [form] = Form.useForm();
    const liveValues = Form.useWatch([], form);

    const dispatch = useDispatch();

    const { loading, error, fieldErrors, success, message: successMessage } =
        useSelector((state) => state.convertEnquiry);

    const { list: packages, loading: packagesLoading } = useSelector(
        (state) => state.packages
    );

    const [photo, setPhoto] = useState([]);
    const [resume, setResume] = useState([]);
    const [payment, setPayment] = useState([]);

    const [photoPreview, setPhotoPreview] = useState(null);
    const [resumePreview, setResumePreview] = useState(null);
    const [paymentPreview, setPaymentPreview] = useState(null);

    useEffect(() => {
        const programId =
            enquiryData?.programId || enquiryData?.program_id;

        if (open && programId) {
            dispatch(fetchPackagesByProgram(programId));
        }
    }, [open, enquiryData, dispatch]);


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
        if (!open || !enquiryData) return;

        const firstName = enquiryData.name?.split(" ")[0] || "";
        const lastName = enquiryData.name?.split(" ").slice(1).join(" ") || "";

        form.setFieldsValue({
            firstName,
            lastName,
            email: enquiryData.email,
            mobile: enquiryData.phone,
            program_name: enquiryData.program || "",
            program_id: enquiryData.programId || enquiryData.program_id || "",
            source: enquiryData.source || "",
            date: enquiryData.date || "",
            package_id: enquiryData.package_id || enquiryData.packageId,
        });

        // ✅ FIXED CONDITION (case insensitive)
        if (
            enquiryData.source?.toLowerCase() === "website" &&
            enquiryData.handholding_details
        ) {
            const hh = enquiryData.handholding_details;

            const photoList = urlToFileList(hh.photo);
            const resumeList = urlToFileList(hh.resume_file);
            const paymentList = urlToFileList(hh.proof_file);

            setPhoto(photoList);
            setResume(resumeList);
            setPayment(paymentList);

            setPhotoPreview(photoList[0]?.url || null);
            setResumePreview(resumeList[0]?.url || null);
            setPaymentPreview(paymentList[0]?.url || null);

            // ✅ ALSO SET PROFILE SWITCH VALUE
            form.setFieldsValue({
                city: hh.city || "",
                preferred_counselling_mode: hh.preferred_counselling_mode || "",
                show_profile: hh.show_profile ?? false,
                full_address: hh.full_address || "",


            });
        }
    }, [open, enquiryData, form]);

    /* ================= SUBMIT ================= */
    const handleSubmit = async (values) => {
        const formData = new FormData();
        const payload = {
            city: values.city ?? "",
            preferred_counselling_mode: values.preferred_counselling_mode ?? "",
            full_address: values.full_address ?? "",
            show_profile: values.show_profile ?? false,
            program: values.program_id ?? enquiryData?.programId ?? enquiryData?.program_id ?? "",
            package: values.package_id ?? "",
            last_name: values.lastName ?? "",
        };

        Object.entries(payload).forEach(([key, value]) => {
            formData.append(key, value);
        });

        if (photo[0]?.originFileObj) {
            formData.append("photo", photo[0].originFileObj);
        }
        if (resume[0]?.originFileObj) {
            formData.append("resume_file", resume[0].originFileObj);
        }
        if (payment[0]?.originFileObj) {
            formData.append("proof_file", payment[0].originFileObj);
        }

        try {
            await dispatch(
                convertEnquiry({
                    id: enquiryData?.id, // 👈 IMPORTANT
                    payload: formData,
                })
            ).unwrap();

            // message.success("User converted successfully ✅");

            form.resetFields();
            setPhoto([]);
            setResume([]);
            setPayment([]);

            onCancel(); // close modal
        } catch (err) {
            // console.log("Error:", err);

            if (err?.fieldErrors) {
                // Set backend validation errors on form
                const formattedErrors = Object.entries(err.fieldErrors).map(
                    ([name, errors]) => ({
                        name,
                        errors,
                    })
                );

                form.setFields(formattedErrors);
            } else {
                message.error(err?.generalError || "Conversion failed ❌");
            }
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
                                        <Input />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item name="lastName" label="Last Name">
                                        <Input />
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
                                    <Form.Item name="program_name" label="Program">
                                        <Input disabled />
                                    </Form.Item>
                                </Col>

                                <Form.Item name="program_id" hidden>
                                    <Input type="hidden" />
                                </Form.Item>

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
                                        name="package_id"
                                        label="Counselling Service"
                                        rules={[{ required: true, message: "Please select service" }]}
                                    >
                                        <Select
                                            placeholder={packagesLoading ? "Loading services..." : "Select service"}
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
                                <Button type="primary" htmlType="submit" loading={loading}>
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

                                <p><b>Program:</b> {liveValues?.program_name || "-"}</p>
                                <p><b>Source:</b> {liveValues?.source || "-"}</p>
                                <p><b>Enquiry Date:</b> {liveValues?.date || "-"}</p>

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

export default ConvertHHUserModal;
