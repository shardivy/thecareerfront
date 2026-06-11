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
  Tag,
} from "antd";
import { UploadOutlined, FileImageOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { verifyPayment, updatePayment, fetchStudentPaymentHistory } from "../../../adminSlices/paymentSlice";
import { fetchHandholdingPaymentDetails } from "../../../hhSlices/handholdingPaymentSlice";

const { Title, Text } = Typography;
const { Option } = Select;
const { token } = adminTheme;
const { useBreakpoint } = Grid;
const { confirm } = Modal;


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
const PaymentProofModal = ({ open, onClose, data, onSuccess }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const {
    verifyLoading,
    updateLoading,
    historyLoading,
    historyList,
    remainingAmount,
    verifyApproveLoading,
    verifyRejectLoading,
  } = useSelector((state) => state.payment);

  const { details: handholdingDetails, loading: handholdingLoading } =
    useSelector((state) => state.handholdingPayment);

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

    // console.log("🔍 Extracting data from source:", source);

    const packageIds = Array.isArray(source.package_ids)
      ? source.package_ids
      : Array.isArray(rawData.packageIds)
        ? rawData.packageIds
        : source.package_id
          ? [source.package_id]
          : [];

    const packageId = packageIds.length > 0 ? packageIds[0] : undefined;

    return {
      name: source.name || source.user_name || source.student_name || "Student Name",
      package_id: packageId,
      packageIds,
      package: source.package_name ||
        (Array.isArray(source.packages) ? source.packages.join(", ") : "") ||
        source.package ||
        source.program ||
        "-",

      paymentMethod: source.paymentMethod || source.method || source.payment_method || "-",
      amount: source.amount || "0",
      txn: source.txn || source.transaction_id || "",
      paymentDate: source.paymentDate || source.date || source.payment_date || "-",
      key: source.key || source.id || "",
      proof_file_url: source.proof_file_url || "",
      status: source.status || source.payment_status || "-",
      // Store original data for reference
      originalSource: source,
      student_id: source.student_id || "",
      participant_id: source.handholding_participant_id || "",
    };
  };

  // Get the extracted safe data
  const safeData = extractData(data);
  // console.log("📋 Extracted safe data:", safeData);

  // Prepare package lines for edit display (each service on its own line)
  const packageLines = safeData.package
    ? String(safeData.package)
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .join('\n')
    : '';

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

      // ✅ SWITCH API
      if (mode === "view") {
        if (data?.type === "handholding") {
          if (safeData.participant_id) {
            dispatch(fetchHandholdingPaymentDetails(safeData.participant_id));
          } else {
            // console.error("❌ participant_id missing");
          }
        } else {
          dispatch(fetchStudentPaymentHistory(safeData.student_id));
        }
      }
    }

    return () => {
      revokeBlobUrls();
    };
  }, [open, data]);
  // Don't render anything if modal is not open
  if (!open) return null;

  /* ---------------- HANDLERS ---------------- */
  const handleUpdate = () => {
    form.validateFields().then((values) => {
      const payload = new FormData();

      // Get original data to access IDs
      const source = safeData.originalSource;


      // REQUIRED: student_profile (user ID)
      if (source.id) {
        payload.append("student_profile", source.student_id);
        // console.log("👤 Student ID:", source.student_id);
      } else {
        message.error("Student profile ID is required");
        return;
      }

      // REQUIRED: package(s)
      const packageIds = Array.isArray(safeData.packageIds) && safeData.packageIds.length > 0
        ? safeData.packageIds
        : source.package_ids && Array.isArray(source.package_ids)
          ? source.package_ids
          : source.package_id
            ? [source.package_id]
            : [];

      if (packageIds.length > 0) {
        let invalidPackageFound = false;
        for (const id of packageIds) {
          const packageIdNum = parseInt(id, 10);
          if (isNaN(packageIdNum)) {
            // console.error("❌ Package ID is not a number:", id);
            message.error("Package ID must be a number");
            invalidPackageFound = true;
            break;
          }
          payload.append("package", packageIdNum);
          // console.log("📦 Sending numeric Package ID:", packageIdNum);
        }

        if (invalidPackageFound) {
          return;
        }
      } else {
        message.error("Package ID is required but not found in payment data");
        return;
      }

      // REQUIRED: amount
      if (values.amount) {
        const amountStr = values.amount.toString();
        const amountValue = amountStr.replace(/[^\d.]/g, '');
        const amountNumber = parseFloat(amountValue) || 0;
        payload.append("amount", amountNumber);

      } else {
        message.error("Amount is required");
        return;
      }

      // REQUIRED: payment_type (online/cash)
      let paymentType = "offline"; // default to offline
      if (values.paymentMethod === "online") {
        paymentType = "offline";
      }
      payload.append("payment_type", paymentType);

      // REQUIRED: method (upi/cash)
      if (values.paymentMethod) {
        payload.append("method", values.paymentMethod.toLowerCase());
      } else {
        message.error("Payment method is required");
        return;
      }

      // Transaction ID (OPTIONAL - for both UPI & Cash)
      if (values.txn && values.txn !== "-") {
        payload.append("transaction_id", values.txn);
      }

      // REQUIRED: payment_date
      if (values.paymentDate) {
        payload.append("payment_date", values.paymentDate.format("YYYY-MM-DD"));
      } else {
        message.error("Payment date is required");
        return;
      }


      if (file) {
        // New file selected
        payload.append("proof_file", file);
      } else {
        // console.log("📎 No new file selected - keeping existing proof file");
        // Do NOT append proof_file
      }


      // Log FormData contents for debugging

      // for (let [key, value] of payload.entries()) {
      //   if (key === 'proof_file' && value instanceof File) {
      //     console.log(`${key}: File - ${value.name} (${value.type}, ${value.size} bytes)`);
      //   } else if (key === 'proof_file' && value === "") {
      //     console.log(`${key}: (empty string)`);
      //   } else {
      //     console.log(`${key}:`, value);
      //   }
      // }

      // Also log what fields are actually being sent
      const formDataEntries = [];
      for (let [key, value] of payload.entries()) {
        formDataEntries.push({ key, value: value instanceof File ? `File: ${value.name}` : value });
      }
      dispatch(updatePayment({ id: safeData.key, payload }))
        .unwrap()
        .then((res) => {
          message.success(res.message || "Payment updated successfully");
          onSuccess?.();
          onClose();
        })
        .catch((err) => {
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
    setPreviewUrl(originalProofUrl);

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


  const handleApproveConfirm = () => {
    confirm({
      title: "Approve Payment?",
      icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      content:
        "Are you sure you want to approve this payment? This action will mark the payment as verified.",
      centered: true,
      okText: "Yes, Approve",
      okButtonProps: {
        style: { background: "#52c41a", borderColor: "#52c41a" },
      },
      cancelText: "Cancel",

      async onOk() {
        try {
          const res = await dispatch(
            verifyPayment({
              id: safeData.key,
              payload: {
                verifiedAmount:
                  form.getFieldValue("amount") || safeData.amount,
                action: "approve",
              },
            })
          ).unwrap();

          message.success(res?.message || "Payment approved successfully");
          onSuccess?.();
          onClose();
        } catch (err) {
          message.error(
            typeof err === "string"
              ? err
              : err?.message || "Something went wrong"
          );
        }
      },
    });
  };

  const handleRejectConfirm = () => {
    confirm({
      title: "Reject Payment?",
      icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
      content:
        "Are you sure you want to reject this payment? This action cannot be undone.",
      centered: true,
      okText: "Yes, Reject",
      okButtonProps: {
        danger: true,
      },
      cancelText: "Cancel",

      async onOk() {
        try {
          const res = await dispatch(
            verifyPayment({
              id: safeData.key,
              payload: {
                verifiedAmount:
                  form.getFieldValue("amount") || safeData.amount,
                action: "reject",
              },
            })
          ).unwrap();

          message.success(res?.message || "Payment rejected successfully");
          onSuccess?.();
          onClose();
        } catch (err) {
          message.error(
            typeof err === "string"
              ? err
              : err?.message || "Something went wrong"
          );
        }
      },
    });
  };



  return (
    <Modal
      key={mode}
      open={open}
      centered
      destroyOnClose
      width={isMobile ? "95%" : "85%"}
      style={{ maxWidth: 900 }}
      onCancel={onClose}
      title={<Title level={4}>Payment Details</Title>}
      footer={
        isEdit ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >

            {/* LEFT SIDE - Reject (Only for fully paid) */}
            <div style={{ display: "flex", gap: 8 }}>
              {["fully_paid", "partial_paid"].includes(
                safeData.status?.toLowerCase().replace(" ", "_")
              ) && (
                  <Button
                    danger
                    onClick={handleRejectConfirm}
                    loading={verifyRejectLoading}
                  >
                    Reject
                  </Button>
                )}
            </div>


            {/* RIGHT SIDE - Cancel / Update */}
            <div style={{ display: "flex", gap: 8 }}>
              <Button onClick={onClose}>Cancel</Button>

              <Button
                type="primary"
                onClick={handleUpdate}
                loading={updateLoading}
              >
                Update
              </Button>
            </div>
          </div>
        ) : isVerify ? null : (
          <Button type="primary" onClick={onClose}>
            Close
          </Button>
        )
      }

    >

      <div
        className="custom-scroll"
        style={{
          maxHeight: "75vh",
          overflowY: "auto",
          paddingRight: 8,
        }}
      >
        {/* ================= FORM / VIEW ================= */}
        {isEdit ? (
          <Form form={form} layout="vertical">
            {/* Student + Package */}
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Student Name" name="name">
                  <Input disabled={isEdit} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Text style={labelStyle}>Counselling Service</Text>
                <div style={valueBoxStyle} >
                  {safeData.package && safeData.package !== "-" ? (
                    <div>
                      {String(safeData.package)
                        .split(',')
                        .map((p) => p.trim())
                        .filter(Boolean)
                        .map((p, i, arr) => (
                          <div key={i} style={{ marginBottom: i < arr.length - 1 ? 8 : 0 }}>
                            <Text>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                          </div>
                        ))}
                    </div>
                  ) : (
                    "-"
                  )}
                </div>
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
                <Form.Item label="Fees Paid" name="amount">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            {/* Txn + Date */}
            {/* Txn + Date */}
            <Form.Item shouldUpdate={(prev, curr) => prev.paymentMethod !== curr.paymentMethod} noStyle>
              {({ getFieldValue }) => {
                const method = getFieldValue("paymentMethod");
                return (
                  <Row gutter={16}>
                    {method !== "cash" && (
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Transaction ID"
                          name="txn"
                          rules={[
                            {
                              required: method === "upi",
                              message: "Transaction ID is required for UPI payments",
                            },
                          ]}
                        >
                          <Input placeholder="Enter UPI Transaction ID" />
                        </Form.Item>
                      </Col>
                    )}
                    <Col xs={24} md={method !== "cash" ? 12 : 24}>
                      <Form.Item
                        label="Payment Date"
                        name="paymentDate"
                        rules={[{ required: true, message: "Payment date is required" }]}
                      >
                        <DatePicker style={{ width: "100%", height: 36 }} format="YYYY-MM-DD" />
                      </Form.Item>
                    </Col>
                  </Row>
                );
              }}
            </Form.Item>
          </Form>
        ) : (
          <>
            {/* ONLY THIS SHOULD EXIST IN VIEW MODE */}
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Text style={labelStyle}>Student Name</Text>
                <div style={valueBoxStyle}>{safeData.name}</div>
              </Col>

              <Col xs={24} md={12}>
                <Text style={labelStyle}>Counselling Service</Text>
                <div
                  style={{
                    ...valueBoxStyle,
                    maxHeight: 50,
                    overflowY: "auto",
                    paddingRight: 6,
                  }}
                  className="custom-scroll"
                >
                  {safeData.package && safeData.package !== "-" ? (
                    String(safeData.package)
                      .split(",")
                      .map((p) => p.trim())
                      .filter(Boolean)
                      .map((p, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "4px 0",
                          }}
                        >
                          <Text>
                            {i + 1}. {p.charAt(0).toUpperCase() + p.slice(1)}
                          </Text>
                        </div>
                      ))
                  ) : (
                    "-"
                  )}
                </div>
              </Col>
            </Row>
          </>
        )}
        {mode !== "view" && !isVerify && (

          <>
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
                    <div style={{ textAlign: "center" }}>
                      <img
                        key={previewUrl}
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
                          message.error("Failed to load receipt image");
                        }}
                      />
                      {file && (
                        <Text type="colortextSecondary" style={{ fontSize: 12, marginTop: 8 }}>
                          Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </Text>
                      )}
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
                      <FileImageOutlined
                        style={{ fontSize: 48, color: "#999", marginBottom: 16 }}
                      />
                      <Text strong>PDF Receipt</Text>

                      {file && (
                        <>
                          <Text type="colortextSecondary" style={{ fontSize: 12 }}>
                            {file.name}
                          </Text>
                          <Text type="colortextSecondary" style={{ fontSize: 11 }}>
                            {(file.size / 1024).toFixed(2)} KB
                          </Text>
                        </>
                      )}

                      <Text type="colortextSecondary" style={{ marginTop: 8 }}>
                        {previewUrl.startsWith("blob:")
                          ? "New upload"
                          : "View PDF"}
                      </Text>
                    </div>
                  )}
                </>
              ) : (
                <Empty
                  description={
                    <div>
                      <div>No receipt uploaded</div>
                      <Text
                        type="secondary"
                        style={{ fontSize: 12, marginTop: 8 }}
                      >
                        The payment has no proof image attached
                      </Text>
                    </div>
                  }
                />
              )}
            </div>
          </>
        )}

        {/* ================= VERIFY ================= */}
        {isVerify && (
          <>
            <Divider />

            <Form form={form} layout="vertical">
              {/* Method + Amount */}
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Payment Method" name="paymentMethod">
                    <Select disabled>
                      <Option value="upi">UPI</Option>
                      <Option value="cash">Cash</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Amount" name="amount">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>

              {/* Txn + Date */}
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Transaction ID" name="txn">
                    <Input disabled />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Payment Date" name="paymentDate">
                    <DatePicker
                      style={{ width: "100%", height: 36 }}
                      format="YYYY-MM-DD"
                      disabled
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>

            {/* ================= RECEIPT AT LAST ================= */}
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
                minHeight: 220,
              }}
            >
              {previewUrl ? (
                isImage || isImageUrl(previewUrl) ? (
                  <img
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
                  />
                ) : (
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    View PDF
                  </a>
                )
              ) : (
                <Empty description="No receipt uploaded" />
              )}
            </div>

            {/* Buttons */}
            <Divider />
            <Row justify="end" gutter={8}>
              <Col>
                <Button danger onClick={() => handleVerify("reject")} loading={verifyRejectLoading}>
                  Reject
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  onClick={() => handleVerify("approve")}
                  loading={verifyApproveLoading}
                >
                  Approve
                </Button>
              </Col>
            </Row>
          </>
        )}


        {/* ================= PAYMENT HISTORY ================= */}
        {mode === "view" && (
          <>
            {(() => {
              const isHandholding = data?.type === "handholding";

              const payments = isHandholding
                ? handholdingDetails?.data || []
                : historyList || [];

              const totalRemaining = isHandholding
                ? handholdingDetails?.remaining_amount || 0
                : remainingAmount || 0;

              const remainingPayments = payments.filter(
                (p) => p.status === "not_paid"
              );

              const completedPayments = payments.filter(
                (p) => p.status !== "not_paid"
              );
              return (
                <>
                  {/* ================= PAYMENT REMAINING ================= */}
                  {remainingPayments.length > 0 && (
                    <>
                      <Divider />
                      <Title
                        level={5}
                        style={{ marginBottom: 16, color: "#ff4d4f" }}
                      >
                        Payment Remaining
                      </Title>

                      {/* Total Remaining */}
                      <div
                        style={{
                          padding: 20,
                          borderRadius: 16,
                          background: "#ffffff",
                          border: "1px solid #ffa39e",
                          marginBottom: 16,
                        }}
                      >
                        <Text type="colorTextSecondary">
                          Total Pending Amount
                        </Text>
                        <div
                          style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: "#cf1322",
                          }}
                        >
                          ₹ {totalRemaining.toLocaleString()}
                        </div>
                      </div>

                      {/* <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {remainingPayments.map((payment, index) => (
                  <div
                    key={payment.id || index}
                    style={{
                      padding: 20,
                      borderRadius: 16,
                      background: "#fff2f0",
                      border: "1px solid #ffccc7",
                    }}
                  >
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Text type="colorTextSecondary">
                          Amount Pending
                        </Text>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 600,
                            color: "#ff4d4f",
                          }}
                        >
                          ₹{" "}
                          {parseFloat(
                            payment.amount || 0
                          ).toLocaleString()}
                        </div>
                      </Col>

                      <Col>
                        <Tag color="red">NOT PAID</Tag>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div> */}
                    </>
                  )}

                  {/* ================= PAYMENT HISTORY ================= */}
                  <Divider />
                  <Title level={5} style={{ marginBottom: 16 }}>
                    Payment History
                  </Title>

                  {historyLoading ? (
                    <Text>Loading payment history...</Text>
                  ) : completedPayments.length ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      {completedPayments
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(b.created_at || 0) -
                            new Date(a.created_at || 0)
                        )
                        .map((payment, index) => {
                          return (
                            <div
                              key={payment.id || index}
                              style={{
                                padding: 20,
                                borderRadius: 16,
                                background: "#ffffff",
                                boxShadow:
                                  "0 4px 12px rgba(0,0,0,0.05)",
                                border: "1px solid #f0f0f0",
                              }}
                            >
                              <Row
                                justify="space-between"
                                align="middle"
                              >
                                <Col>
                                  <Text type="colorTextSecondary">
                                    Amount
                                  </Text>
                                  <div
                                    style={{
                                      fontSize: 20,
                                      fontWeight: 600,
                                      color: "#1677ff",
                                    }}
                                  >
                                    ₹{" "}
                                    {parseFloat(
                                      payment.amount || 0
                                    ).toLocaleString()}
                                  </div>
                                </Col>

                                <Col>
                                  <Tag
                                    color={
                                      payment.status ===
                                        "fully_paid"
                                        ? "green"
                                        : payment.status ===
                                          "partially_paid"
                                          ? "orange"
                                          : "red"
                                    }
                                  >
                                    {payment.status
                                      ?.replace("_", " ")
                                      .toUpperCase()}
                                  </Tag>
                                </Col>
                              </Row>

                              <Divider
                                style={{ margin: "12px 0" }}
                              />

                              <Row gutter={[16, 12]}>
                                <Col xs={24} md={8}>
                                  <Text type="colorTextSecondary">
                                    Method
                                  </Text>
                                  <div>
                                    {payment.method
                                      ?.toUpperCase() || "-"}
                                  </div>
                                </Col>

                                <Col xs={24} md={8}>
                                  <Text type="colorTextSecondary">
                                    Date
                                  </Text>
                                  <div>
                                    {payment.created_at
                                      ? dayjs(
                                        payment.created_at
                                      ).format(
                                        "DD MMM YYYY, hh:mm A"
                                      )
                                      : "-"}
                                  </div>
                                </Col>

                                <Col xs={24} md={8}>
                                  <Text type="colorTextSecondary">
                                    Transaction ID
                                  </Text>
                                  <div
                                    style={{
                                      wordBreak: "break-all",
                                    }}
                                  >
                                    {payment.transaction_id ||
                                      "-"}
                                  </div>
                                </Col>
                              </Row>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <Empty description="No completed payments found" />
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>
    </Modal>
  );
};

export default PaymentProofModal;