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
  updateReport,
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
  const [isPdfFile, setIsPdfFile] = useState(false);

  const isEditMode = mode === "edit";
  const isViewMode = mode === "view";
  const isBulkMode = mode === "bulkUpload";
  const isUploadMode = mode === "upload";


  /* ---------------- PREFILL ---------------- */
  useEffect(() => {
    if (!data || isBulkMode) return;

    form.setFieldsValue({
      ...data,
      uploadedDate: data.uploadedDate ? dayjs(data.uploadedDate) : null,
    });

    if (data.file_path) {
const fileName = getDisplayFileName(data);
      const isPdf = fileName.toLowerCase().endsWith(".pdf");
      setIsPdfFile(isPdf);
      setPreviewUrl(data.file_path);
      setFileList([
        {
          uid: "-1",
          name: fileName,
          status: "done",
          url: data.file_path,
        },
      ]);
    } else {
      setPreviewUrl("");
      setIsPdfFile(false);
      setFileList([]);
    }

    setUploadedFile(null);
  }, [data, isBulkMode, form]);

  /* ---------------- FILE SELECT ---------------- */
  const handleFileSelect = (file) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      message.error("Only PDF, Word, and Excel files are allowed");
      return Upload.LIST_IGNORE;
    }


    const isPdf = file.type === "application/pdf";
    setIsPdfFile(isPdf);
    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFileList([file]);

    return false;
  };

  const handleRemove = () => {
    setUploadedFile(null);
    setPreviewUrl("");
    setIsPdfFile(false);
    setFileList([]);
  };


  const handleView = () => {
    if (!previewUrl) return;

    const fileUrl = previewUrl;

    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;

    window.open(viewerUrl, "_blank");
  };

  const getDisplayFileName = (data = {}) => {
    if (data?.file_name) return data.file_name;

    const filePathName = data?.file_path
      ?.split("/")
      .filter(Boolean)
      .pop()
      ?.split("?")[0]
      ?.split("#")[0];

    return filePathName;
  };

  /* ---------------- DOWNLOAD ---------------- */
  const handleDownload = async () => {
    if (!previewUrl) {
          return;
    }

    try {
      const response = await fetch(previewUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Use the actual filename from the file_path
const fileName = getDisplayFileName(data);
      link.download = fileName;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success("Report downloaded successfully");
    } catch (error) {
          message.error("Failed to download report");
    }
  };


  /* ---------------- UPLOAD / UPDATE ---------------- */
  const handleSubmit = async () => {

    if (isUploadMode && !uploadedFile) {
      message.warning("Please select a PDF file");
      return;
    }

    if (isEditMode && !uploadedFile && !previewUrl) {
      message.warning("Please upload a file or keep the existing one");
      return;
    }

    try {
      const formData = new FormData();

      if (uploadedFile) {
        // Case 1: New file is uploaded - send as binary
        formData.append("file_path", uploadedFile);
      } else if (isEditMode && data?.file_path) {

        try {
          // Fetch the existing file
          const response = await fetch(data.file_path);
          const blob = await response.blob();

          // Create a File object from the blob
const fileName = getDisplayFileName(data);
          const existingFile = new File([blob], fileName, { type: "application/pdf" });

          // Append to formData
          formData.append("file_path", existingFile);
         } catch (fetchError) {
          message.error("Failed to process existing file");
          setLoading(false);
          return;
        }
      }

      // Log FormData contents for debugging
      console.log("📤 Final FormData contents:");
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`  ${pair[0]}: File (binary) - ${pair[1].name}, size: ${pair[1].size} bytes`);
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }

      console.log("📤 Sending request...");
      setLoading(true);

      // Choose the correct action based on mode
      let response;
      if (isUploadMode) {
        // For upload mode, use uploadReport
        response = await dispatch(
          uploadReport({
            reportId: data.id,
            formData,
          })
        ).unwrap();
      } else if (isEditMode) {
        // For edit mode, use updateReport

        response = await dispatch(
          updateReport({
            reportId: data.id,
            formData,
          })
        ).unwrap();
      }

      const successMessage = isUploadMode
        ? "Report uploaded successfully"
        : "Report updated successfully";

      message.success(successMessage);

      // Refresh the reports list
      dispatch(fetchCompletedExamReports());

      // Close the modal
      onCancel();
    } catch (error) {
      message.error("Operation failed: " + (error.response?.data?.message || "Please try again"));
    } finally {
      setLoading(false);
    }
  };


  return (
    <Modal
      open={open}
      onCancel={() => {
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
      <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>
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

              {/* Display hidden IDs for debugging (optional) */}
              {/* {process.env.NODE_ENV === 'development' && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item label="Student ID (debug)" name="student_id">
                    <Input readOnly value={data?.student_id} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Program ID (debug)" name="program_id">
                    <Input readOnly value={data?.program_id} />
                  </Form.Item>
                </Col>
              </>
            )} */}

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

              {/* For edit mode: NO status and payment status fields - just student and program names */}
              {/* This section is intentionally left empty - no fields for edit mode */}

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
                isPdfFile || uploadedFile?.type === "application/pdf" ? (
                  <iframe
                    src={previewUrl}
                    title="PDF Preview"
                    style={{ width: "100%", height: 220, border: "none" }}
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: 20 }}>
                    <FilePdfOutlined style={{ fontSize: 40, color: "#999" }} />
                    <p style={{ marginTop: 10, marginBottom: 0, color: "#666" }}>
                      Preview not available for this file type
                    </p>
                    {isEditMode && (
                      <Button
                        icon={<DownloadOutlined />}
                        style={{ marginTop: 10 }}
                        onClick={handleDownload}
                      >
                        Download File
                      </Button>
                    )}
                  </div>
                )
              ) : (
                <Empty description="No file uploaded" />
              )}
            </Col>

            <Col xs={24} md={8}>
              {/* Show upload button for edit, upload, and bulk modes */}
              {(isEditMode || isUploadMode || isBulkMode) && (
                <Upload
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
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
                    Select File
                  </Button>
                </Upload>
              )}

              {/* Show download button for view mode with existing file */}
              {isViewMode && previewUrl && (
                <Button
                  icon={<DownloadOutlined />}
                  block
                  style={{ marginTop: 8 }}
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
      </div>
    </Modal>
  );
};

export default ViewReportModal;