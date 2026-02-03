import React, { useEffect, useState } from "react";
import {
  Modal,
  Row,
  Col,
  Typography,
  Empty,
  Form,
  Input,
  Select,
  Button,
  Divider,
  Upload,
  message,
  Grid,
  DatePicker,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";
import dayjs from "dayjs";
import { useDispatch } from "react-redux";
import { verifyPayment, updatePayment } from "../../../adminSlices/paymentSlice";

const { Title, Text } = Typography;
const { Option } = Select;
const { token } = adminTheme;
const { useBreakpoint } = Grid;

/* ---------------- STYLES ---------------- */
const labelStyle = {
  fontSize: token.fontSize,
  color: token.colorTextSecondary,
};

const valueBoxStyle = {
  marginTop: 8,
  padding: "12px 14px",
  borderRadius: token.borderRadius,
  border: `1px solid ${token.colorBorder}`,
  background: token.colorBgContainer,
};

/* ---------------- COMPONENT ---------------- */
const PaymentProofModal = ({ open, onClose, data }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const mode = data?.mode || "view";
  const isEdit = mode === "edit";
  const isVerify = mode === "verify";

  const previewUrl = file ? URL.createObjectURL(file) : data?.proofUrl || null;

  useEffect(() => {
    if (open && data) {
      form.resetFields();
      form.setFieldsValue({
        ...data,
        paymentDate: data.paymentDate
          ? dayjs(data.paymentDate)
          : data.date && data.date !== "-"
          ? dayjs(data.date)
          : null,
      });
      setFile(null);
    }
  }, [open, data, form]);

  if (!data) return null;

  /* ---------------- HANDLERS ---------------- */
  const handleUpdate = () => {
    form.validateFields().then((values) => {
      const payload = new FormData();

      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null) {
          if (key === "paymentDate") {
            payload.append(key, values[key].format("YYYY-MM-DD"));
          } else {
            payload.append(key, values[key]);
          }
        }
      });

      if (file) payload.append("proof_file", file);

      dispatch(updatePayment({ id: data.key, payload }))
        .unwrap()
        .then((res) => {
          message.success(res.message || "Payment updated successfully");
          onClose();
        })
        .catch((err) => {
          message.error(err || "Failed to update payment");
        });
    });
  };

  const handleVerify = (status) => {
    form.validateFields().then((values) => {
      dispatch(
        verifyPayment({
          id: data.key,
          payload: {
            verifiedAmount: values.verifiedAmount || data.amount,
            action: status,
          },
        })
      )
        .unwrap()
        .then((res) => {
          res.success ? message.success(res.message) : message.error(res.error);
          onClose();
        })
        .catch((err) => message.error(err?.error));
    });
  };

  const uploadProps = {
    accept: ".pdf",
    beforeUpload: (file) => {
      if (file.type !== "application/pdf") {
        message.error("Only PDF files are allowed");
        return Upload.LIST_IGNORE;
      }
      setFile(file);
      return false;
    },
    maxCount: 1,
    showUploadList: false,
  };

  return (
    <Modal
      key={mode}
      open={open}
      centered
      destroyOnClose
      width={isMobile ? "95%" : 760}
      onCancel={onClose}
      title={<Title level={4}>Payment Details</Title>}
      footer={
        isEdit ? (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={handleUpdate}>
              Update
            </Button>
          </>
        ) : isVerify ? null : (
          <Button type="primary" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      {/* ================= FORM / VIEW ================= */}
      {isEdit ? (
        <Form form={form} layout="vertical">
          {/* Student + Package */}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Student Name" name="name">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Package" name="package">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          {/* Method + Amount */}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Payment Method" name="paymentMethod">
                <Select>
                  <Option value="upi">UPI</Option>
                  <Option value="cash">Cash</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Amount" name="amount">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          {/* Txn + Date */}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Transaction ID" name="txn">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Payment Date" name="paymentDate">
                <DatePicker
                  style={{ width: "100%", height: 36 }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      ) : (
        <>
          {/* Student + Package */}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Text style={labelStyle}>Student Name</Text>
              <div style={valueBoxStyle}>{data.name}</div>
            </Col>
            <Col xs={24} md={12}>
              <Text style={labelStyle}>Package</Text>
              <div style={valueBoxStyle}>{data.package}</div>
            </Col>
          </Row>

          {/* Method + Amount */}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Text style={labelStyle}>Payment Method</Text>
              <div style={valueBoxStyle}>{data.paymentMethod}</div>
            </Col>
            <Col xs={24} md={12}>
              <Text style={labelStyle}>Amount</Text>
              <div style={valueBoxStyle}>{data.amount}</div>
            </Col>
          </Row>

          {/* Txn + Date */}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Text style={labelStyle}>Transaction ID</Text>
              <div style={valueBoxStyle}>{data.txn}</div>
            </Col>
            <Col xs={24} md={12}>
              <Text style={labelStyle}>Payment Date</Text>
              <div style={valueBoxStyle}>
                {data.paymentDate
                  ? dayjs(data.paymentDate).format("YYYY-MM-DD")
                  : "-"}
              </div>
            </Col>
          </Row>
        </>
      )}

      {/* ================= RECEIPT ================= */}
      <Divider />
      <Title level={5} style={labelStyle}>
        Upload Receipt / Screenshot
      </Title>

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 20,
          padding: 24,
          borderRadius: 16,
          border: `1px dashed ${token.colorBorder}`,
        }}
      >
        {previewUrl ? (
          <iframe
            src={previewUrl}
            title="PDF Preview"
            style={{
              width: "100%",
              maxWidth: 360,
              height: 220,
              borderRadius: 12,
            }}
          />
        ) : (
          <Empty description="No receipt uploaded" />
        )}

        {isEdit && (
          <Upload {...uploadProps}>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              block={isMobile}
            >
              {previewUrl ? "Change" : "Upload Receipt"}
            </Button>
          </Upload>
        )}
      </div>

      {/* ================= VERIFY ================= */}
      {isVerify && (
        <>
          <Divider />
          <Row justify="end" gutter={8}>
            <Col>
              <Button danger onClick={() => handleVerify("reject")}>
                Reject
              </Button>
            </Col>
            <Col>
              <Button type="primary" onClick={() => handleVerify("approve")}>
                Approve
              </Button>
            </Col>
          </Row>
        </>
      )}
    </Modal>
  );
};

export default PaymentProofModal;