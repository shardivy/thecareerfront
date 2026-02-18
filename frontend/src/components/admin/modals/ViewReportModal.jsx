import React, { useEffect, useState } from "react";
import {
  Modal,
  Typography,
  Button,
  Form,
  Input,
  Select,
  Row,
  Col,
  Upload,
  Empty,
  message,
} from "antd";
import {
  DownloadOutlined,
  UploadOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";
import dayjs from "dayjs";
import { useDispatch } from "react-redux";
import {
  uploadReport,
  fetchCompletedExamReports,
} from "../../../adminSlices/reportSlice";

const { Title } = Typography;
const { Option } = Select;
const { token } = adminTheme;

const ViewReportModal = ({ open, onCancel, data, mode }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  const isEditMode = mode === "edit";
  const isViewMode = mode === "view";
  const isBulkMode = mode === "bulkUpload";
  const isUploadMode = mode === "upload"; // This will be true for pending reports

  /* ---------------- LOG MODE WHEN MODAL OPENS ---------------- */
  useEffect(() => {
    if (open) {
      console.log("📱 MODAL OPENED");
      console.log("📋 Mode:", mode);
      console.log("📊 Data received:", data);
      console.log("🎭 Mode details:");
      console.log("  - isEditMode:", isEditMode);
      console.log("  - isViewMode:", isViewMode);
      console.log("  - isBulkMode:", isBulkMode);
      console.log("  - isUploadMode:", isUploadMode);
      console.log("  - Modal Title:", 
        isUploadMode ? "Upload Report" : 
        isEditMode ? "Edit Report" : 
        "Report Details"
      );
    }
  }, [open, mode, data, isEditMode, isViewMode, isBulkMode, isUploadMode]);

  /* ---------------- PREFILL ---------------- */
  useEffect(() => {
    if (!data || isBulkMode) return;

    form.setFieldsValue({
      ...data,
      uploadedDate: data.uploadedDate ? dayjs(data.uploadedDate) : null,
    });

    if (data.file_path) {
      setPreviewUrl(data.file_path);
      setFileList([
        {
          uid: "-1",
          name: "Report.pdf",
          status: "done",
          url: data.file_path,
        },
      ]);
      console.log("📄 Existing file found:", data.file_path);
    } else {
      setPreviewUrl("");
      setFileList([]);
      console.log("📄 No existing file");
    }

    setUploadedFile(null);
  }, [data, isBulkMode, form]);

  /* ---------------- FILE SELECT ---------------- */
  const handleFileSelect = (file) => {
    console.log("📁 File selected:", file.name);
    console.log("🎭 Current mode for file selection:", mode);
    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFileList([file]);
    return false;
  };

  const handleRemove = () => {
    console.log("🗑️ File removed");
    setUploadedFile(null);
    setPreviewUrl("");
    setFileList([]);
  };

  /* ---------------- DOWNLOAD ---------------- */
  const handleDownload = async () => {
    console.log("⬇️ Download initiated");
    if (!previewUrl) {
      console.log("❌ No file to download");
      return;
    }

    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Report.pdf";
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log("✅ Download successful");
    } catch {
      console.error("❌ Download failed");
      message.error("Failed to download report");
    }
  };

  /* ---------------- UPLOAD / UPDATE ---------------- */
  const handleSubmit = async () => {
    console.log("🚀 Submit button clicked");
    console.log("🎭 Current mode on submit:", mode);
    console.log("📦 Uploaded file:", uploadedFile?.name || "None");
    console.log("🔗 Preview URL exists:", !!previewUrl);

    if (isUploadMode && !uploadedFile) {
      console.log("⚠️ Upload mode requires file but none selected");
      message.warning("Please select a PDF file");
      return;
    }

    if (isEditMode && !uploadedFile && !previewUrl) {
      console.log("⚠️ Edit mode requires file but none exists or selected");
      message.warning("Please upload a file or keep the existing one");
      return;
    }

    try {
      const values = form.getFieldsValue();
      const formData = new FormData();
      
      console.log("📝 Form values:", values);

      // For edit mode, send status and payment changes
      if (isEditMode) {
        console.log("✏️ Edit mode - adding status/payment data");
        if (values.status) {
          formData.append("status", values.status);
          console.log("➕ Added status:", values.status);
        }
        if (values.paymentStatus) {
          formData.append("payment_status", values.paymentStatus);
          console.log("➕ Added payment_status:", values.paymentStatus);
        }
      } else {
        console.log("⬆️ Upload mode - only file will be sent");
      }
      
      // For upload mode, we only need the file
      if (uploadedFile) {
        formData.append("file_path", uploadedFile);
        console.log("➕ Added file:", uploadedFile.name);
      } else {
        console.log("📄 No new file to upload");
      }

      console.log("📤 Sending form data...");
      setLoading(true);

      await dispatch(
        uploadReport({
          reportId: data.id,
          formData,
        })
      ).unwrap();

      const successMessage = isUploadMode 
        ? "Report uploaded successfully" 
        : "Report updated successfully";
      
      console.log("✅ " + successMessage);
      message.success(successMessage);

      dispatch(fetchCompletedExamReports());
      onCancel();
    } catch (error) {
      console.error("❌ Operation failed:", error);
      message.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- LOG WHEN MODE CHANGES ---------------- */
  useEffect(() => {
    console.log("🔄 Mode changed to:", mode);
    console.log("📋 Current mode configuration:");
    console.log("  Title:", 
      isUploadMode ? "Upload Report" : 
      isEditMode ? "Edit Report" : 
      "Report Details"
    );
    console.log("  Submit button text:", isUploadMode ? "Upload" : "Update");
    console.log("  Show status dropdown:", isEditMode);
    console.log("  Show status readonly:", isUploadMode || isViewMode);
  }, [mode, isEditMode, isViewMode, isUploadMode]);

  return (
    <Modal
      open={open}
      onCancel={() => {
        console.log("❌ Modal closed");
        onCancel();
      }}
      footer={null}
      width={720}
      title={
        isUploadMode
          ? "Upload Report"
          : isEditMode
          ? "Edit Report"
          : "Report Details"
      }
    >
      {!isBulkMode && (
        <Form form={form} layout="vertical">
          <Row gutter={[16, 12]}>
            <Col xs={24}>
              <Form.Item label="Student Name" name="name">
                <Input readOnly />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item label="Program" name="program">
                <Input readOnly />
              </Form.Item>
            </Col>

            {/* For upload mode: show status and payment status as readonly */}
            {isUploadMode && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item label="Status" name="status">
                    <Input readOnly />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Payment Status" name="paymentStatus">
                    <Input readOnly />
                  </Form.Item>
                </Col>
              </>
            )}

            {/* For edit mode: show editable dropdowns */}
            {isEditMode && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item label="Status" name="status">
                    <Select>
                      <Option value="Unlocked">Unlocked</Option>
                      <Option value="Locked">Locked</Option>
                      <Option value="Pending Upload">Pending Upload</Option>
                      <Option value="Review Verification Pending">
                        Review Verification Pending
                      </Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Payment Status" name="paymentStatus">
                    <Select>
                      <Option value="Fully Paid">Fully Paid</Option>
                      <Option value="Partial Paid">Partial Paid</Option>
                      <Option value="Pending">Pending</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </>
            )}

            {/* For view mode: show readonly inputs */}
            {isViewMode && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item label="Status" name="status">
                    <Input readOnly />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Payment Status" name="paymentStatus">
                    <Input readOnly />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
        </Form>
      )}

      <Title level={5}>
        <FilePdfOutlined /> Upload / Preview
      </Title>

      <div
        style={{
          border: `1px solid ${token.colorBorder}`,
          borderRadius: token.borderRadius,
          padding: 16,
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={16}>
            {previewUrl ? (
              <iframe
                src={previewUrl}
                title="PDF Preview"
                style={{ width: "100%", height: 220 }}
              />
            ) : (
              <Empty description="No file uploaded" />
            )}
          </Col>

          <Col xs={24} md={8}>
            {/* Show upload button for edit, upload, and bulk modes */}
            {(isEditMode || isUploadMode || isBulkMode) && (
              <Upload
                accept=".pdf"
                beforeUpload={handleFileSelect}
                onRemove={handleRemove}
                fileList={fileList}
                maxCount={1}
              >
                <Button 
                  icon={<UploadOutlined />} 
                  block 
                  type="primary"
                  onClick={() => console.log("📁 Select PDF button clicked in", mode, "mode")}
                >
                  Select PDF
                </Button>
              </Upload>
            )}

            {/* Show download button for view mode with existing file */}
            {isViewMode && previewUrl && (
              <Button
                icon={<DownloadOutlined />}
                block
                style={{ marginTop: 12 }}
                onClick={handleDownload}
              >
                Download
              </Button>
            )}
          </Col>
        </Row>
      </div>

      {/* Show submit buttons for non-view modes */}
      {!isViewMode && (
        <div style={{ textAlign: "right", marginTop: 20 }}>
          <Button 
            onClick={() => {
              console.log("🚫 Cancel button clicked");
              onCancel();
            }} 
            style={{ marginRight: 8 }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
          >
            {isUploadMode ? "Upload" : "Update"}
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default ViewReportModal;