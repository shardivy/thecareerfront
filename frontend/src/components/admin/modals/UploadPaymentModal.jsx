import React, { useEffect, useState } from "react";
import {
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    Upload,
    Button,
    Row,
    Col,
    message,
    Empty,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { fetchPackages } from "../../../adminSlices/packageSlice";

import {
    submitPayment,
    resetPaymentState,
} from "../../../adminSlices/paymentSlice";
import { fetchStudents } from "../../../adminSlices/userSlice";

const { Option } = Select;

const UploadPaymentModal = ({ open, onClose }) => {
    const [form] = Form.useForm();
    const dispatch = useDispatch();

    const { loading, success, error } = useSelector(
        (state) => state.payment
    );
    const { list: students, loading: studentsLoading } = useSelector(
        (state) => state.users
    );

    const { list: packageList, loading: packageLoading } = useSelector(
        (state) => state.packages
    );

    const [fileList, setFileList] = useState([]);
    const [previewUrl, setPreviewUrl] = useState("");

    // Fetch students when modal opens
    useEffect(() => {
        if (open) dispatch(fetchStudents());
        if (open) dispatch(fetchPackages());
    }, [open, dispatch]);

    // Generate preview
    useEffect(() => {
        if (fileList.length > 0) {
            setPreviewUrl(
                URL.createObjectURL(fileList[0].originFileObj)
            );
        } else {
            setPreviewUrl("");
        }
    }, [fileList]);

    const handleSubmit = (values) => {
        const formData = new FormData();

        formData.append("student_profile", values.student_profile);
        formData.append("package", values.package); // ✅ ID
        formData.append("amount", values.amount);
        formData.append("payment_type", values.paymentType);
        formData.append("method", values.paymentMethod); // ✅ FIX
        if (values.transactionId) {
            formData.append("transaction_id", values.transactionId);
        }
        formData.append(
            "payment_date",
            dayjs(values.paymentDate).format("YYYY-MM-DD")
        );

        if (fileList.length > 0) {
            formData.append("receipt", fileList[0].originFileObj);
        }

        dispatch(submitPayment(formData));
    };

    // Success / Error handling
    useEffect(() => {
        if (success) {
            message.success("Payment submitted successfully");
            form.resetFields();
            setFileList([]);
            setPreviewUrl("");
            dispatch(resetPaymentState());
            onClose();
        }

        if (error) {
            message.error(error);
        }
    }, [success, error, dispatch, form, onClose]);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title="Upload Payment"
            okText="Submit Payment"
            onOk={() => form.submit()}
            confirmLoading={loading}
            width={600}
            centered
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onValuesChange={(changedValues) => {
                    if (changedValues.paymentType) {
                        form.setFieldsValue({
                            paymentMethod: undefined,
                            transactionId: undefined,
                        });
                    }

                    // If payment method changed and it's not UPI, clear transactionId
                    if (Object.prototype.hasOwnProperty.call(changedValues, 'paymentMethod') && changedValues.paymentMethod !== 'upi') {
                        form.setFieldsValue({ transactionId: undefined });
                    }
                }}
            >
                {/* STUDENT */}
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Select Student"
                            name="student_profile"
                            rules={[
                                { required: true, message: "Please select student" },
                            ]}
                        >
                            <Select
                                placeholder="Select student"
                                loading={studentsLoading}
                                showSearch
                                optionFilterProp="children"
                                onChange={(studentId) => {
                                    const selectedStudent = students.find(
                                        (s) => s.id === studentId
                                    );

                                    form.setFieldsValue({
                                        package: selectedStudent?.package_id,
                                    });
                                }}
                            >
                                {students.map((student) => (
                                    <Option key={student.id} value={student.id}>
                                        {student.first_name} {student.last_name}
                                        <div style={{ fontSize: 12 }}>
                                            {student.email}
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Package"
                            name="package"
                            rules={[
                                { required: true, message: "Please select package" },
                            ]}
                        >
                            <Select
                                placeholder="Select package"
                                loading={packageLoading}
                                allowClear
                            >
                                {packageList.map((pkg) => (
                                    <Option key={pkg.id} value={pkg.id}>
                                        {pkg.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Amount Paid"
                            name="amount"
                            rules={[{ required: true }]}
                        >
                            <Input placeholder="₹ Amount" />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Payment Type"
                            name="paymentType"
                            rules={[{ required: true }]}
                        >
                            <Select placeholder="Select payment type">
                                <Option value="online">Online</Option>
                                <Option value="offline">Offline</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16} style={{ width: '100%', marginBottom: 8 }}>
                    <Col xs={24} md={12}>
                        <Form.Item shouldUpdate>
                            {({ getFieldValue }) => {
                                const paymentType = getFieldValue("paymentType");

                                return (
                                    <Form.Item
                                        label="Payment Method"
                                        name="paymentMethod"
                                        rules={[
                                            { required: true, message: "Please select payment method" },
                                        ]}
                                    >
                                        <Select
                                            placeholder={
                                                paymentType
                                                    ? "Select payment method"
                                                    : "Select payment type first"
                                            }
                                            disabled={!paymentType}
                                        >
                                            {paymentType === "online" && (
                                                <Option value="upi">UPI</Option>
                                            )}

                                            {paymentType === "offline" && (
                                                <Option value="cash">Cash</Option>
                                            )}
                                        </Select>
                                    </Form.Item>
                                );
                            }}
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item shouldUpdate>
                            {({ getFieldValue }) => {
                                const method = getFieldValue('paymentMethod');
                                return method === 'upi' ? (
                                    <Form.Item
                                        label="Transaction ID"
                                        name="transactionId"
                                        rules={[{ required: true, message: 'Please enter transaction id for UPI' }]}
                                    >
                                        <Input placeholder="Transaction ID" />
                                    </Form.Item>
                                ) : (
                                    <div style={{ height: 56 }} />
                                );
                            }}
                        </Form.Item>
                    </Col>
                </Row> 


                <Form.Item
                    label="Payment Date"
                    name="paymentDate"
                    rules={[{ required: true }]}
                >
                    <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                {/* RECEIPT UPLOAD */}
                <Form.Item
                    label="Upload Receipt"
                    name="receipt"
                    rules={[
                        {
                            required: true,
                            message: "Please upload receipt",
                        },
                    ]}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: 16,
                            alignItems: "center",
                            border: "1px dashed #d9d9d9",
                            padding: 16,
                            borderRadius: 8,
                            justifyContent: "space-between",
                        }}
                    >
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Receipt Preview"
                                style={{
                                    width: 160,
                                    height: 160,
                                    objectFit: "cover",
                                    borderRadius: 8,
                                    border: "1px solid #d9d9d9",
                                }}
                            />
                        ) : (
                            <Empty description="No receipt uploaded" />
                        )}

                        <Upload
                            beforeUpload={() => false}
                            maxCount={1}
                            fileList={fileList}
                            showUploadList={false}
                            onChange={({ fileList }) => {
                                setFileList(fileList);
                                form.setFieldsValue({
                                    receipt: fileList,
                                });
                            }}
                        >
                            <Button
                                type="primary"
                                icon={<UploadOutlined />}
                            >
                                Upload Receipt
                            </Button>
                        </Upload>
                    </div>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default UploadPaymentModal;
