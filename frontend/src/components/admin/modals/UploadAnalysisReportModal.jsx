import React, { useState, useEffect } from "react";
import {
    Modal,
    Typography,
    Button,
    Form,
    Input,
    Row,
    Col,
    Upload,
    message,
} from "antd";
import { UploadOutlined, FilePdfOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import {
    uploadAnalysisReport,
    updateAnalysisReport,
    uploadEngineeringV3Report,
} from "../../../adminSlices/collegeAnalysisSlice";

const { Title, Text } = Typography;

/**
 * UploadReportModal
 *
 * Props:
 *  open         — boolean
 *  onCancel     — () => void
 *  onSuccess    — () => void   (called after a successful upload)
 *  data         — the report record (same shape as selectedReport in CollegeListAnalysis)
 *  version      — "v1" | "v3"
 */
const UploadAnalysisReportModal = ({ open, onCancel, onSuccess, data, version = "v1" }) => {
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [fileList, setFileList] = useState([]);

    /* ── Populate read-only student fields ── */
    useEffect(() => {
        if (!data) return;
        form.setFieldsValue({
            name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            program: data.program || data.program_name || "-",
            counselling_service: data.package || data.package_name || "-",
        });
    }, [data, form]);

    /* ── Reset file state when modal opens/closes ── */
    useEffect(() => {
        if (!open) {
            setUploadedFile(null);
            setFileList([]);
        }
    }, [open]);

    const ALLOWED_TYPES = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    const handleFileSelect = (file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            message.error("Only PDF, Word, and Excel files are allowed");
            return Upload.LIST_IGNORE;
        }
        setUploadedFile(file);
        setFileList([file]);
        return false; // prevent auto-upload
    };

    const handleRemove = () => {
        setUploadedFile(null);
        setFileList([]);
    };

    /* ── Submit ── */
    const handleSubmit = async () => {
        if (!uploadedFile) {
            message.warning("Please select a file before uploading");
            return;
        }

        try {
            setLoading(true);

            if (version === "v1") {
                const reportId = data?.v1_report_id ?? data?.id;
                if (!reportId) return message.error("Report ID missing");

                const alreadyUploaded = !!(data?.v1_file_path || data?.file_path);

                if (!alreadyUploaded) {
                    // POST — first upload
                    const formData = new FormData();
                    formData.append("file_path", uploadedFile);
                    const res = await dispatch(
                        uploadAnalysisReport({ id: reportId, formData })
                    ).unwrap();
                    message.success(res?.message || "V1 report uploaded successfully");
                } else {
                    // PUT — replace existing
                    const res = await dispatch(
                        updateAnalysisReport({ id: reportId, file: uploadedFile, isExisting: false })
                    ).unwrap();
                    message.success(res?.message || "V1 report updated successfully");
                }
            } else {
                // version === "v3"
                const reportId = data?.v3_report_id ?? data?.id;
                if (!reportId) return message.error("Report ID missing");

                const alreadyUploaded = !!(data?.v3_file_path || data?.file_path2);

                if (!alreadyUploaded) {
                    // POST — V3-specific endpoint
                    const formData = new FormData();
                    formData.append("file_path2", uploadedFile);
                    const res = await dispatch(
                        uploadEngineeringV3Report({ reportId, formData })
                    ).unwrap();
                    message.success(res?.message || "V3 report uploaded successfully");
                } else {
                    // PUT — shared update with version flag
                    const res = await dispatch(
                        updateAnalysisReport({
                            id: reportId,
                            file: uploadedFile,
                            isExisting: false,
                            version: "v3",
                        })
                    ).unwrap();
                    message.success(res?.message || "V3 report updated successfully");
                }
            }

            onSuccess?.();
            onCancel();
        } catch (err) {
            message.error(err?.message || "Upload failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const versionLabel = version === "v1" ? "V1 — Admin Report" : "V3 — Final Report";

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            destroyOnClose
            width={700}
            centered
            footer={null}
            title={
                <span>
                    Upload Report
                    {data && (
                        <Text
                            type="colorTextSecondary"
                            style={{ fontWeight: 400, marginLeft: 8, fontSize: 14 }}
                        >
                            — {`${data.first_name || ""} ${data.last_name || ""}`.trim()}
                        </Text>
                    )}
                </span>
            }
        >
            {/* ── Student info (read-only) ── */}
            <Form form={form} layout="vertical" style={{ marginBottom: 4 }}>
                <Form.Item label="Student Name" name="name">
                    <Input readOnly />
                </Form.Item>
                <Row gutter={12}>
                    <Col xs={24} md={12}>
                        <Form.Item label="Program" name="program">
                            <Input readOnly />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Counselling Service" name="counselling_service">
                            <Input readOnly />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>

            {/* ── Upload section ── */}
            <div
                style={{
                    border: "1px dashed #d9d9d9",
                    borderRadius: 8,
                    padding: "20px 16px",
                    textAlign: "center",
                    background: "#fafafa",
                    marginBottom: 20,
                }}
            >
                <FilePdfOutlined style={{ fontSize: 36, color: "#bfbfbf", marginBottom: 8 }} />
                <div style={{ marginBottom: 12, color: "#595959", fontSize: 13 }}>
                    <strong>{versionLabel}</strong>
                    <br />
                    <span style={{ color: "#8c8c8c" }}>PDF, Word, or Excel files accepted</span>
                </div>

                <Upload
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    beforeUpload={handleFileSelect}
                    onRemove={handleRemove}
                    fileList={fileList}
                    maxCount={1}
                >
                    <Button icon={<UploadOutlined />} type="primary">
                        {fileList.length > 0 ? "Replace File" : "Select File"}
                    </Button>
                </Upload>
            </div>

            {/* ── Footer actions ── */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Button onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    type="primary"
                    loading={loading}
                    disabled={!uploadedFile}
                    onClick={handleSubmit}
                >
                    Upload
                </Button>
            </div>
        </Modal>
    );
};

export default UploadAnalysisReportModal;