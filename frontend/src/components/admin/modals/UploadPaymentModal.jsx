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
import { FacebookFilled, UploadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";

import { fetchPackages } from "../../../adminSlices/packageSlice";
import {
  submitPayment,
  resetPaymentState,
  fetchStudentPaymentSummary,
} from "../../../adminSlices/paymentSlice";
import { fetchStudents } from "../../../adminSlices/userSlice";

const { Option } = Select;

const UploadPaymentModal = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { list: students = [], loading: studentsLoading } = useSelector(
    (state) => state.users
  );

  const { list: packageList = [], loading: packageLoading } = useSelector(
    (state) => state.packages
  );

  const {
    submitLoading,
    submitSuccess,
    submitError,
    summaryLoading,
    summaryData,
      summaryError, 
  } = useSelector((state) => state.payment);

  const [fileList, setFileList] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");

  /* ================= FETCH STUDENTS & PACKAGES ================= */
  useEffect(() => {
    if (open) {
      dispatch(fetchStudents());
      dispatch(fetchPackages());
    }
  }, [open, dispatch]);

  /* ================= FILE PREVIEW ================= */
  useEffect(() => {
    if (fileList.length > 0 && fileList[0].originFileObj) {
      setPreviewUrl(URL.createObjectURL(fileList[0].originFileObj));
    } else {
      setPreviewUrl("");
    }
  }, [fileList]);

  useEffect(() => {
  if (summaryError) {
    message.error(summaryError);
  }
}, [summaryError]);

useEffect(() => {
  if (summaryData?.remaining_amount !== undefined) {
    form.setFieldsValue({
      amount: summaryData.remaining_amount,
    });
  }
}, [summaryData, form]);

  /* ================= SUBMIT ================= */
  const handleSubmit = (values) => {
    const formData = new FormData();

    formData.append("student_profile", values.student_profile);
    formData.append("package", values.package);
    formData.append("amount", values.amount);
    formData.append("payment_type", values.payment_type);
    formData.append("method", values.method);

    if (values.transactionId) {
      formData.append("transaction_id", values.transactionId);
    }

    formData.append(
      "payment_date",
      dayjs(values.paymentDate).format("YYYY-MM-DD")
    );

    if (fileList.length && fileList[0].originFileObj) {
      formData.append("proof_file", fileList[0].originFileObj);
    }

    dispatch(submitPayment(formData));
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
        typeof submitError === "string"
          ? submitError
          : JSON.stringify(submitError)
      );
    }
  }, [submitSuccess, submitError, dispatch, form, onClose, onSuccess]);

  /* ================= HANDLE STUDENT SELECT ================= */
  const handleStudentChange = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    const packageId = student?.package_id;

    // Auto set package
    form.setFieldsValue({
      package: packageId,
    });

    // Fetch summary immediately
    if (studentId && packageId) {
      dispatch(
        fetchStudentPaymentSummary({
          studentId,
          packageId,
        })
      );
    }
  };

  /* ================= HANDLE PACKAGE CHANGE ================= */
  const handlePackageChange = (packageId) => {
    const studentId = form.getFieldValue("student_profile");

    if (studentId && packageId) {
      dispatch(
        fetchStudentPaymentSummary({
          studentId,
          packageId,
        })
      );
    }
  };

const disableFutureDates = (current) => {
  return current && current > dayjs().endOf("day");
};


  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Upload Payment"
      okText="Submit Payment"
      onOk={() => form.submit()}
      confirmLoading={submitLoading}
      width={650}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={(changedValues) => {
          if (changedValues.payment_type) {
            form.setFieldsValue({
              method: undefined,
              transactionId: undefined,
            });
          }

          if (
            Object.prototype.hasOwnProperty.call(changedValues, "method") &&
            changedValues.method !== "upi"
          ) {
            form.setFieldsValue({ transactionId: undefined });
          }
        }}
      >
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
                onChange={handleStudentChange}
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
              <Select
                placeholder="Select counselling service"
                loading={packageLoading}
                onChange={handlePackageChange}
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

    <Row>
  <Col span={24}>
    <Form.Item label="Amount Due" name="amount">
      <Input disabled />
    </Form.Item>
  </Col>
</Row>


        <Row gutter={16}>
          {/* <Col span={12}>
            <Form.Item
              label="Amount Paid"
              name="amount"
              rules={[{ required: true }]}
            >
              <Input placeholder="₹ Amount" />
            </Form.Item>
          </Col> */}

         <Col span={12}>
  <Form.Item
    name="payment_type"
    label="Payment Type"
    rules={[{ required: true, message: "Please select payment type" }]}
  >
    <Select
      onChange={(value) => {
        if (value === "online") {
          form.setFieldsValue({
            method: "upi",
            transactionId: undefined,
          });
        } else if (value === "offline") {
          form.setFieldsValue({
            method: "cash",
            transactionId: undefined,
          });
        }
      }}
    >
      <Option value="online">Online</Option>
      <Option value="offline">Offline</Option>
    </Select>
  </Form.Item>
</Col>


          <Col span={12}>
            <Form.Item shouldUpdate>
              {({ getFieldValue }) => {
                const paymentType = getFieldValue("payment_type");

                return (
                  <Form.Item
                    name="method"
                    label="Payment Method"
                    rules={[{ required: true }]}
                  >
                    <Select disabled={!paymentType}>
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

          <Col span={12}>
<Form.Item shouldUpdate>
  {({ getFieldValue }) =>
    getFieldValue("method") === "upi" ? (
      <Form.Item
        label="Transaction ID"
        name="transactionId"
        validateTrigger="onChange"
        rules={[
          {
            required: false,
            
          },
          {
            pattern: /^[0-9]{12,16}$/,
            message:
              "Transaction ID must be 12-16 digits only",
          },
        ]}
      >
        <Input
          placeholder="Enter 12-16 digit UPI Transaction ID"
          maxLength={16}
        />
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
          <DatePicker style={{ width: "100%" }} disabledDate={disableFutureDates}  />
        </Form.Item>

        <Form.Item label="Upload Receipt">
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
              <Button icon={<UploadOutlined />}>
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
