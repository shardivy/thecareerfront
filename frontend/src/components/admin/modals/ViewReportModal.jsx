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
  DatePicker,
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

  /* -------------------- DEBUG -------------------- */
  useEffect(() => {
    console.log("MODAL DATA 👉", data);
  }, [data]);

  /* -------------------- PREFILL FORM & FILE -------------------- */
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
    } else {
      setPreviewUrl("");
      setFileList([]);
    }

    setUploadedFile(null);
  }, [data, isBulkMode, form]);

  /* -------------------- FILE SELECT -------------------- */
  const handleFileSelect = (file) => {
    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFileList([file]); // Update Upload preview
    return false; // prevent auto upload
  };

  /* -------------------- REMOVE FILE -------------------- */
  const handleRemove = () => {
    setUploadedFile(null);
    setPreviewUrl("");
    setFileList([]);
  };

  /* -------------------- DOWNLOAD -------------------- */
  const handleDownload = () => {
    if (!previewUrl) return;

    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = "Report.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* -------------------- UPDATE REPORT -------------------- */
  const handleUpdate = async () => {
    if (!data?.id) {
      message.error("Report ID missing");
      console.error("Invalid report data:", data);
      return;
    }

    try {
      const values = form.getFieldsValue();
      const formData = new FormData();

      if (values.status) formData.append("status", values.status);
      if (values.paymentStatus) formData.append("payment_status", values.paymentStatus);
      if (values.uploadedDate)
        formData.append(
          "uploaded_date",
          dayjs(values.uploadedDate).format("YYYY-MM-DD")
        );
      if (uploadedFile) formData.append("file", uploadedFile);

      setLoading(true);

      await dispatch(
        uploadReport({
          reportId: data.id,
          formData,
        })
      ).unwrap();

      message.success("Report updated successfully");
      dispatch(fetchCompletedExamReports());
      onCancel();
    } catch (error) {
      console.error(error);
      message.error("Failed to update report");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width="90%"
      style={{ maxWidth: 720 }}
      title={
        isBulkMode
          ? "Bulk Upload Reports"
          : isEditMode
          ? "Edit Report"
          : "Report Details"
      }
    >
      {/* ================= FORM ================= */}
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

            <Col xs={24} md={12}>
              <Form.Item label="Status" name="status">
                {isEditMode ? (
                  <Select>
                    <Option value="Unlocked">Unlocked</Option>
                    <Option value="Locked">Locked</Option>
                    <Option value="Pending Upload">Pending Upload</Option>
                  </Select>
                ) : (
                  <Input readOnly />
                )}
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Payment Status" name="paymentStatus">
                {isEditMode ? (
                  <Select>
                    <Option value="Fully Paid">Fully Paid</Option>
                    <Option value="Partial Paid">Partial Paid</Option>
                    <Option value="Pending">Pending</Option>
                  </Select>
                ) : (
                  <Input readOnly />
                )}
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Exam Status" name="examStatus">
                <Input readOnly />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )}

      <br />

      {/* ================= UPLOAD / PREVIEW ================= */}
      <Title level={5}>
        <FilePdfOutlined />{" "}
        {isEditMode || isBulkMode ? "Upload Report" : "Uploaded Report"}
      </Title>

      <div
        style={{
          border: `1px solid ${token.colorBorder}`,
          borderRadius: token.borderRadius,
          padding: 20,
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            {previewUrl ? (
              <iframe
                src={previewUrl}
                title="PDF Preview"
                style={{ width: "100%", height: 220 }}
              />
            ) : (
              <Empty description="No report uploaded yet" />
            )}
          </Col>

          <Col xs={24} md={8}>
            {(isEditMode || isBulkMode) && (
              <Upload
                showUploadList={{
                  showRemoveIcon: true,
                  showPreviewIcon: true,
                }}
                accept=".pdf"
                fileList={fileList}
                onRemove={handleRemove}
                beforeUpload={handleFileSelect}
              >
                <Button type="primary" icon={<UploadOutlined />} block>
                  Select File
                </Button>
              </Upload>
            )}

            {isViewMode && previewUrl && (
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                block
                onClick={handleDownload}
                style={{ marginTop: 12 }}
              >
                Download Report
              </Button>
            )}
          </Col>
        </Row>
      </div>

      {/* ================= FOOTER ================= */}
      {!isBulkMode && !isViewMode && (
        <div style={{ textAlign: "right", marginTop: 20 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          {isEditMode && (
            <Button type="primary" onClick={handleUpdate} loading={loading}>
              Update
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ViewReportModal;
