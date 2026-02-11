import React, { useEffect, useState, useRef } from "react";
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
import { UploadOutlined, FileImageOutlined } from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";
import dayjs from "dayjs";
import { useDispatch ,useSelector} from "react-redux";
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
const PaymentProofModal = ({ open, onClose, data,  onSuccess  }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

const {
  verifyLoading,
  updateLoading
} = useSelector((state) => state.payment);


  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isImage, setIsImage] = useState(true);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // Store blob URLs to revoke later
  const blobUrlsRef = useRef(new Set());

  const mode = data?.mode || "view";
  const isEdit = mode === "edit";
  const isVerify = mode === "verify";

  // Helper to check if URL is an image
  const isImageUrl = (url) => {
    if (!url) return false;
    
    const hasImageExtension = url.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg|jfif)$/i) !== null;
    const hasImagePath = url.includes('/image/') || 
                         url.includes('/media/') || 
                         url.includes('/uploads/') ||
                         url.includes('/payment/report/');
    const isBlob = url.startsWith('blob:');
    
    return hasImageExtension || hasImagePath || isBlob;
  };

  // Extract data from nested structure
  const extractData = (rawData) => {
    if (!rawData) return {};
    
    const source = rawData.originalData || rawData;
    
    console.log("🔍 Extracting data from source:", source);
    
    return {
      name: source.name || source.user_name || source.student_name || "Student Name",
      package: source.package_name || source.package || source.program || "-",
      package_id: source.package_id || source.program_id || "",

      paymentMethod: source.paymentMethod || source.method || source.payment_method || "-",
      amount: source.amount || "0",
      txn: source.txn || source.transaction_id || "-",
      paymentDate: source.paymentDate || source.date || source.payment_date || "-",
      key: source.key || source.id || "",
      proof_file_url: source.proof_file_url || "",
      status: source.status || source.payment_status || "-",
      // Store original data for reference
      originalSource: source,
      // Store user_id for student_profile
      user_id: source.user_id || ""
    };
  };

  // Get the extracted safe data
  const safeData = extractData(data);
  console.log("📋 Extracted safe data:", safeData);
  
  // Get the original proof URL
  const originalProofUrl = safeData.proof_file_url || "";

  // Helper to revoke blob URLs
  const revokeBlobUrls = () => {
    blobUrlsRef.current.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    blobUrlsRef.current.clear();
  };

  // Helper to create and track blob URL
  const createBlobUrl = (file) => {
    const blobUrl = URL.createObjectURL(file);
    blobUrlsRef.current.add(blobUrl);
    return blobUrl;
  };

  useEffect(() => {
    if (open && data) {
      console.log("🔄 Modal opened with data:", data);
      console.log("📋 Safe data for form:", safeData);
      
      form.setFieldsValue({
      name: safeData.name,
      package: safeData.package,
      paymentMethod: safeData.paymentMethod,
      amount: safeData.amount,
      txn: safeData.txn,
      paymentDate:
        safeData.paymentDate && safeData.paymentDate !== "-"
          ? dayjs(safeData.paymentDate)
          : null,
    });

    setFile(null);
    setPreviewUrl(originalProofUrl);
    setIsImage(isImageUrl(originalProofUrl));
  }

  return () => {
    revokeBlobUrls();
  };
  }, [open]);

  // Don't render anything if modal is not open
  if (!open) return null;

/* ---------------- HANDLERS ---------------- */
const handleUpdate = () => {
  form.validateFields().then((values) => {
    const payload = new FormData();

    // Get original data to access IDs
    const source = safeData.originalSource;
    
    console.log("🔍 Original data source:", source);
    console.log("📝 Form values:", values);
    console.log("📦 Safe data package_id from extract:", safeData.package_id);
    
    // REQUIRED: student_profile (user ID)
    if (source.id) {
      payload.append("student_profile", source.student_id);
      console.log("👤 Student profile ID:", source.student_id);
    } else {
      message.error("Student profile ID is required");
      return;
    }
    
    // REQUIRED: package (package ID)
    const packageId = source.package_id || safeData.package_id;
    
    if (packageId) {
      const packageIdNum = parseInt(packageId);
      if (!isNaN(packageIdNum)) {
        payload.append("package", packageIdNum);
        console.log("📦 Sending numeric Package ID:", packageIdNum);
      } else {
        console.error("❌ Package ID is not a number:", packageId);
        message.error("Package ID must be a number");
        return;
      }
    } else {
      console.error("❌ No package_id found anywhere!");
      message.error("Package ID is required but not found in payment data");
      return;
    }
    
    // REQUIRED: amount
    if (values.amount) {
      const amountStr = values.amount.toString();
      const amountValue = amountStr.replace(/[^\d.]/g, '');
      const amountNumber = parseFloat(amountValue) || 0;
      payload.append("amount", amountNumber);
      console.log("💰 Amount:", amountNumber);
    } else {
      message.error("Amount is required");
      return;
    }
    
    // REQUIRED: payment_type (online/cash)
    let paymentType = "online";
    if (values.paymentMethod === "cash") {
      paymentType = "cash";
    }
    payload.append("payment_type", paymentType);
    console.log("💳 Payment type:", paymentType);
    
    // REQUIRED: method (upi/cash)
    if (values.paymentMethod) {
      payload.append("method", values.paymentMethod.toLowerCase());
      console.log("🏦 Method:", values.paymentMethod.toLowerCase());
    } else {
      message.error("Payment method is required");
      return;
    }
    
    // REQUIRED: transaction_id
    if (values.txn) {
      payload.append("transaction_id", values.txn);
      console.log("🆔 Transaction ID:", values.txn);
    } else {
      message.error("Transaction ID is required");
      return;
    }
    
    // REQUIRED: payment_date
    if (values.paymentDate) {
      payload.append("payment_date", values.paymentDate.format("YYYY-MM-DD"));
      console.log("📅 Payment date:", values.paymentDate.format("YYYY-MM-DD"));
    } else {
      message.error("Payment date is required");
      return;
    }
    
 
    if (file) {
      // New file selected - send the file with correct field name
      payload.append("proof_file", file); 
      console.log("📎 New file attached as 'proof_file':", file.name, file.type, file.size);
    } else if (originalProofUrl && originalProofUrl !== "") {
      
      
      // Option 1: Send empty string (if backend accepts it)
      payload.append("proof_file", ""); 
      console.log("📎 Sending empty 'proof_file' field (keep existing file)");
      

    } else {
      // No file at all - send empty
      payload.append("proof_file", ""); // ← CORRECT FIELD NAME
      console.log("📎 No file - sending empty 'proof_file' field");
    }

    // Log FormData contents for debugging
    console.log("📤 FormData contents to be sent:");
    for (let [key, value] of payload.entries()) {
      if (key === 'proof_file' && value instanceof File) {
        console.log(`${key}: File - ${value.name} (${value.type}, ${value.size} bytes)`);
      } else if (key === 'proof_file' && value === "") {
        console.log(`${key}: (empty string)`);
      } else {
        console.log(`${key}:`, value);
      }
    }

    // Also log what fields are actually being sent
    const formDataEntries = [];
    for (let [key, value] of payload.entries()) {
      formDataEntries.push({ key, value: value instanceof File ? `File: ${value.name}` : value });
    }
    console.log("📋 FormData entries array:", formDataEntries);

    dispatch(updatePayment({ id: safeData.key, payload }))
      .unwrap()
      .then((res) => {
        console.log("✅ Update response:", res);
        message.success(res.message || "Payment updated successfully");
          onSuccess?.();
        onClose();
      })
      .catch((err) => {
        console.error("❌ Update error details:", err);
        // Check if error mentions proof_file
        if (err.message && err.message.includes("proof_file")) {
          message.error("Proof file error: " + err.message);
        } else {
          message.error(err.message || err.toString() || "Failed to update payment");
        }
      });
  });
};
  const handleVerify = (status) => {
    form.validateFields().then((values) => {
      dispatch(
        verifyPayment({
          id: safeData.key,
          payload: {
            verifiedAmount: values.verifiedAmount || safeData.amount,
            action: status,
          },
        })
      )
        .unwrap()
        .then((res) => {
          res.success ? message.success(res.message) : message.error(res.error);
          onSuccess?.();
          onClose();
        })
        .catch((err) => message.error(err?.error));
    });
  };

  const handleFileChange = (selectedFile) => {
    const isImageFile = selectedFile.type.startsWith('image/');
    const isPdf = selectedFile.type === 'application/pdf';
    
    if (!isImageFile && !isPdf) {
      message.error("Only image and PDF files are allowed");
      return Upload.LIST_IGNORE;
    }
    
    // Create new blob URL for preview
    const newPreviewUrl = createBlobUrl(selectedFile);
    
    setFile(selectedFile);
    setPreviewUrl(newPreviewUrl);
    setIsImage(isImageFile);
    
    return false;
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(originalProofUrl); // Revert to original URL
    
    if (originalProofUrl) {
      setIsImage(isImageUrl(originalProofUrl));
    } else {
      setIsImage(true);
    }
  };

  const uploadProps = {
    accept: "image/*,.pdf",
    beforeUpload: handleFileChange,
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
            <Button type="primary" onClick={handleUpdate} loading={updateLoading}>
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
              <div style={valueBoxStyle}>{safeData.name}</div>
            </Col>
            <Col xs={24} md={12}>
              <Text style={labelStyle}>Package</Text>
              <div style={valueBoxStyle}>
                {safeData.package && safeData.package !== "-"
                  ? safeData.package.charAt(0).toUpperCase() + safeData.package.slice(1)
                  : "-"}
              </div>
            </Col>
          </Row>

          {/* Method + Amount */}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Text style={labelStyle}>Payment Method</Text>
              <div style={valueBoxStyle}>{safeData.paymentMethod}</div>
            </Col>
            <Col xs={24} md={12}>
              <Text style={labelStyle}>Amount</Text>
              <div style={valueBoxStyle}>{safeData.amount}</div>
            </Col>
          </Row>

          {/* Txn + Date */}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Text style={labelStyle}>Transaction ID</Text>
              <div style={valueBoxStyle}>{safeData.txn}</div>
            </Col>
            <Col xs={24} md={12}>
              <Text style={labelStyle}>Payment Date</Text>
              <div style={valueBoxStyle}>
                {safeData.paymentDate && safeData.paymentDate !== "-"
                  ? dayjs(safeData.paymentDate).format("YYYY-MM-DD")
                  : "-"}
              </div>
            </Col>
          </Row>
        </>
      )}

      {/* ================= RECEIPT ================= */}
      <Divider />
      <Title level={5} style={labelStyle}>
        Payment Receipt / Proof
      </Title>

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 20,
          padding: 24,
          borderRadius: 16,
          border: `1px dashed ${token.colorBorder}`,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 220
        }}
      >
        {previewUrl ? (
          <>
            {isImage || isImageUrl(previewUrl) ? (
              <div style={{ textAlign: 'center' }}>
                <img
                  key={previewUrl} // Key forces re-render when URL changes
                  src={previewUrl}
                  alt="Payment Proof"
                  style={{
                    width: "100%",
                    maxWidth: 360,
                    maxHeight: 220,
                    objectFit: "contain",
                    borderRadius: 12,
                    border: "1px solid #eee",
                  }}
                  onError={(e) => {
                    console.error("Image load error:", previewUrl, e);
                    message.error("Failed to load receipt image");
                  }}
                />
                <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {file && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </Text>
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  maxWidth: 360,
                  height: 220,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 12,
                  border: "1px solid #eee",
                  backgroundColor: "#f5f5f5",
                }}
              >
                <FileImageOutlined style={{ fontSize: 48, color: "#999", marginBottom: 16 }} />
                <Text strong>PDF Receipt</Text>
                {file && (
                  <>
                    <Text type="secondary" style={{ marginTop: 4, fontSize: '12px' }}>
                      {file.name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {(file.size / 1024).toFixed(2)} KB
                    </Text>
                  </>
                )}
                <Text type="secondary" style={{ marginTop: 8 }}>
                  {previewUrl.startsWith('blob:') ? 'New upload' : 'View PDF'}
                </Text>
              </div>
            )}
          </>
        ) : (
          <Empty 
            description={
              <div>
                <div>No receipt uploaded</div>
                <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
                  The payment has no proof image attached
                </Text>
              </div>
            }
          />
        )}

        {isEdit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
            <Upload {...uploadProps}>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                block={isMobile}
              >
                {previewUrl && previewUrl !== originalProofUrl ? "Change File" : "Upload Receipt"}
              </Button>
            </Upload>
            
            {file && (
              <Button
                danger
                onClick={handleRemoveFile}
                block={isMobile}
              >
                Remove File
              </Button>
            )}
          </div>
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
              <Button type="primary" onClick={() => handleVerify("approve")} loading={verifyLoading}>
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