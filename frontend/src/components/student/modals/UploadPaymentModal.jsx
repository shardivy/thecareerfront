import React, { useState, useEffect } from "react";
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
  Typography,
  Card,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";

import {
  fetchStudentPaymentHistory,
  submitStudentPayment,
  resetPaymentState,
} from "../../../adminSlices/paymentSlice";

const { Option } = Select;
const { Title } = Typography;

const UploadPaymentModal = ({ open, onClose, onSuccess, historyList, remainingAmount, historyLoading }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { submitLoading, submitSuccess, submitError, studentName, studentEmail } = useSelector((state) => state.payment);

  const [fileList, setFileList] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");

  const studentId = localStorage.getItem("studentId");
  const latestPayment = historyList?.[historyList.length - 1];
  const paymentStatus = latestPayment?.status;

  useEffect(() => {
    if (studentName || studentEmail) {
      form.setFieldsValue({
        student_profile: `${studentName}\n${studentEmail}`,

        package:
          historyList?.[0]?.programs
            ?.map((p) => p.package?.name)
            .filter(Boolean)
            .join("\n") || "",
      });
    }
  }, [studentName, studentEmail, historyList, form]);

  useEffect(() => {
    if (paymentStatus === "partial_paid") {
      form.setFieldsValue({
        amount: remainingAmount,
      });
    }
  }, [paymentStatus, remainingAmount]);

  /* ================= FILE PREVIEW ================= */
  useEffect(() => {
    if (fileList.length > 0 && fileList[0].originFileObj) {
      setPreviewUrl(URL.createObjectURL(fileList[0].originFileObj));
    } else {
      setPreviewUrl("");
    }
  }, [fileList]);

  /* ================= SUBMIT ================= */
  const handleSubmit = (values) => {
    const formData = new FormData();

    // required fields
    historyList?.[0]?.programs?.forEach((item) => {
      if (item.package?.id) {
        formData.append("package", item.package.id);
      }
    });
    formData.append("amount", values.amount);
    formData.append("payment_type", values.payment_type);
    formData.append("method", values.method);

    // date
    formData.append(
      "payment_date",
      values.paymentDate
        ? dayjs(values.paymentDate).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD")
    );

    // optional transaction id
    if (values.transactionId) {
      formData.append("transaction_id", values.transactionId);
    }

    // file (IMPORTANT)
    if (fileList.length && fileList[0].originFileObj) {
      formData.append("proof_file", fileList[0].originFileObj);
    }

    // 🔥 DEBUG (optional but recommended)
    for (let pair of formData.entries()) {
      // console.log(pair[0], pair[1]);
    }

    dispatch(
      submitStudentPayment({
        studentId,
        payload: formData,
      })
    );
  };

  /* ================= SUCCESS / ERROR ================= */
  useEffect(() => {
    if (submitSuccess) {
      message.success("Payment submitted successfully");
      form.resetFields();
      setFileList([]);
      setPreviewUrl("");
      dispatch(resetPaymentState());
      onSuccess?.();
      onClose();
    }

    if (submitError) {
  message.error(
    submitError?.errors ||
    submitError?.message ||
    "Something went wrong"
  );
}
  }, [submitSuccess, submitError]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<span style={{ fontWeight: 600 }}>Upload Payment</span>}
      okText="Submit Payment"
      onOk={() => form.submit()}
      confirmLoading={submitLoading}
      width={650}
      centered

    >
      <Form form={form} layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={(changedValues) => {
          if (changedValues.payment_type) {
            form.setFieldsValue({
              method: changedValues.payment_type === "online" ? "upi" : "cash",
            });
          }
        }}
      >

        {/* ===== STUDENT ===== */}
        <Title level={5}>Student Details</Title>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Student Name"
              name="student_profile"
              rules={[{ required: true, message: "Enter student name" }]}

            >
              <Input.TextArea rows={2} disabled style={{ resize: "none" }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Counselling Services"
              name="package"
              rules={[{ required: true }]}
            >
              <Input.TextArea
                rows={2}
                disabled
                style={{ resize: "none" }}
              />
            </Form.Item>
          </Col>
        </Row>


        <Card
          size="small"
          style={{
            marginBottom: 20,
            borderRadius: 10,
            background: "#fff7e6",
            border: "1px solid #ffd591",
          }}
        >
          <strong>Remaining Amount:</strong>{" "}
          {historyLoading ? "Loading..." : `₹ ${remainingAmount}`}
        </Card>


        {/* ===== PAYMENT DETAILS ===== */}
        {/* <Title level={5}>Payment Details</Title> */}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Amount Paid"
              name="amount"
              rules={[
                { required: true, message: "Please enter the amount paid" },
                {
                  validator: (_, value) => {
                    const numericValue = Number(value);

                    if (!value && value !== 0) {
                      return Promise.resolve();
                    }

                    if (isNaN(numericValue)) {
                      return Promise.reject("Amount must be a valid number");
                    }

                    if (numericValue < 0) {
                      return Promise.reject("Amount cannot be negative");
                    }

                    if (numericValue !== 0 && numericValue % 100 !== 0) {
                      return Promise.reject(
                        "Amount must be ₹0 or in multiples of ₹100"
                      );
                    }

                    if (numericValue > remainingAmount) {
                      return Promise.reject(
                        `Amount cannot exceed ₹${remainingAmount}`
                      );
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                placeholder={
                  paymentStatus === "partial_paid"
                    ? "Remaining amount auto-filled"
                    : "₹ Enter amount"
                }
                disabled={paymentStatus === "partial_paid"}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="payment_type"
              label="Payment Type"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select type">
                <Option value="online">Online</Option>
                <Option value="offline">Offline</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item shouldUpdate>
              {({ getFieldValue }) => {
                const type = getFieldValue("payment_type");

                return (
                  <Form.Item
                    name="method"
                    label="Payment Method"
                    rules={[{ required: true }]}
                  >
                    <Select disabled={!type}>
                      {type === "online" && <Option value="upi">UPI</Option>}
                      {type === "offline" && <Option value="cash">Cash</Option>}
                    </Select>
                  </Form.Item>
                );
              }}
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item shouldUpdate>
              {({ getFieldValue }) =>
                getFieldValue("method") === "upi" ? (
                  <Form.Item label="Transaction ID" name="transactionId" rules={[
                    {
                      required: true,
                      message: "Please enter transaction ID",
                    },
                  ]}>
                    <Input placeholder="Enter transaction ID" />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </Col>
        </Row>

        {/* ===== DATE ===== */}
        {/* <Form.Item
          label="Payment Date"
          name="paymentDate"
          rules={[{ required: true }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item> */}

        {/* ===== FILE UPLOAD ===== */}
        <Title level={5}>Upload Receipt</Title>

        <Card
          size="small"
          style={{
            borderRadius: 12,
            border: "1px dashed #d9d9d9",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
            }}
          >
            {/* LEFT - PREVIEW */}
            <div style={{ textAlign: "center", flex: 1 }}>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{
                    width: 180,
                    height: 180,
                    objectFit: "cover",
                    borderRadius: 10,
                  }}
                />
              ) : (
                <Empty description="No receipt uploaded" />
              )}
            </div>

            {/* RIGHT - BUTTON */}
            <div style={{ textAlign: "right" }}>
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                showUploadList={false}
                fileList={fileList}
                onChange={({ fileList }) => {
                  setFileList(fileList);

                  if (fileList[0]?.originFileObj) {
                    setPreviewUrl(
                      URL.createObjectURL(fileList[0].originFileObj)
                    );
                  } else {
                    setPreviewUrl("");
                  }
                }}
              >
                <Button icon={<UploadOutlined />} type="primary">
                  Upload Receipt
                </Button>
              </Upload>
            </div>
          </div>
        </Card>
      </Form>
    </Modal>
  );
};

export default UploadPaymentModal;