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

const UploadPaymentModal = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  // const { loading, success, error } = useSelector(
  //   (state) => state.payment
  // );
  const { list: students, loading: studentsLoading } = useSelector(
    (state) => state.users
  );
  const { list: packageList, loading: packageLoading } = useSelector(
    (state) => state.packages
  );

  const {
    submitLoading,
    submitSuccess,
    submitError
  } = useSelector((state) => state.payment);

  const [fileList, setFileList] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");

  /* -------------------- FETCH DATA -------------------- */
  useEffect(() => {
    if (open) {
      dispatch(fetchStudents());
      dispatch(fetchPackages());
    }
  }, [open, dispatch]);

  /* -------------------- PREVIEW -------------------- */
  useEffect(() => {
    if (fileList.length > 0 && fileList[0].originFileObj) {
      setPreviewUrl(URL.createObjectURL(fileList[0].originFileObj));
    } else {
      setPreviewUrl("");
    }
  }, [fileList]);

  /* -------------------- SUBMIT -------------------- */
  const handleSubmit = (values) => {
    const formData = new FormData();

    formData.append("student_profile", values.student_profile);
    formData.append("package", values.package);
    formData.append("amount", values.amount);
    formData.append("payment_type", values.paymentType);
    formData.append("method", values.paymentMethod);

    if (values.transactionId) {
      formData.append("transaction_id", values.transactionId);
    }

    formData.append(
      "payment_date",
      dayjs(values.paymentDate).format("YYYY-MM-DD")
    );

    // ✅ OPTIONAL RECEIPT
    if (fileList.length && fileList[0].originFileObj) {
      formData.append("proof_file", fileList[0].originFileObj);
    }

    dispatch(submitPayment(formData));
  };


  /* -------------------- SUCCESS / ERROR -------------------- */
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
        typeof submitError === "string"
          ? submitError
          : JSON.stringify(submitError)
      );
    }
  }, [submitSuccess, submitError, dispatch, form, onClose, onSuccess]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Upload Payment"
      okText="Submit Payment"
      onOk={() => form.submit()}
      confirmLoading={submitLoading}
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

          if (
            Object.prototype.hasOwnProperty.call(
              changedValues,
              "paymentMethod"
            ) &&
            changedValues.paymentMethod !== "upi"
          ) {
            form.setFieldsValue({ transactionId: undefined });
          }
        }}
      >
        {/* STUDENT & PACKAGE */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Select Student"
              name="student_profile"
              rules={[{ required: true, message: "Please select student" }]}
            >
              <Select
                placeholder="Select student"
                loading={studentsLoading}
                showSearch
                optionFilterProp="children"
                onChange={(studentId) => {
                  const student = students.find(
                    (s) => s.id === studentId
                  );
                  form.setFieldsValue({
                    package: student?.package_id,
                  });
                }}
              >
                {students.map((student) => (
                  <Option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name}
                    <div style={{ fontSize: 12 }}>{student.email}</div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Counselling Service"
              name="package"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select counselling service" loading={packageLoading}>
                {packageList.map((pkg) => (
                  <Option key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* PAYMENT */}
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

        {/* METHOD + TXN */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Payment Method"
              name="paymentMethod"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select method">
                <Option value="upi">UPI</Option>
                <Option value="cash">Cash</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item shouldUpdate>
              {({ getFieldValue }) =>
                getFieldValue("paymentMethod") === "upi" ? (
                  <Form.Item
                    label="Transaction ID"
                    name="transactionId"
                    rules={[{ required: false }]}
                  >
                    <Input />
                  </Form.Item>
                ) : null
              }
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

        >
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              border: "1px dashed #d9d9d9",
              padding: 16,
              borderRadius: 8,
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
                }}
              />
            ) : (
              <Empty description="No receipt uploaded" />
            )}

            <Upload
              beforeUpload={() => false}   // 🚫 stop auto upload
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
              <Button icon={<UploadOutlined />}>Upload Receipt</Button>
            </Upload>
          </div>
        </Form.Item>

      </Form>
    </Modal>
  );
};

export default UploadPaymentModal;
