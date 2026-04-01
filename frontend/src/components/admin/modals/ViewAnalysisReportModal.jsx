import React, { useEffect, useState } from "react";
import {
    Modal,
    Typography,
    Button,
    Form,
    Input,
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
import dayjs from "dayjs";
import { useDispatch } from "react-redux";
import { uploadAnalysisReport, updateAnalysisReport } from "../../../adminSlices/collegeAnalysisSlice";


const { Title } = Typography;

const ViewAnalyasisReportModal = ({ open, onCancel, data, mode = "upload", onSuccess }) => {
    const [form] = Form.useForm();

    const [previewUrl, setPreviewUrl] = useState("");
    const [uploadedFile, setUploadedFile] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [loading, setLoading] = useState(false);

    const isEditMode = mode === "edit";
    const isViewMode = mode === "view";
    const isUploadMode = mode === "upload";
    const dispatch = useDispatch();

    /* ================= PREFILL ================= */
    useEffect(() => {
        if (!data) return;

        form.setFieldsValue({
            name: `${data.first_name || ""} ${data.last_name || ""}`, // ✅ FIX
            program: data.program || "-",                         // ✅ FIX
            counselling_service: data.package || "-",            // ✅ FIX
            // status: data.status || "-",                               // ✅ FIX
            uploadedDate: data.uploadedDate
                ? dayjs(data.uploadedDate)
                : null,
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
    }, [data, form]);

    /* ================= FILE SELECT ================= */
    const handleFileSelect = (file) => {
        setUploadedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setFileList([file]);
        return false;
    };

    const handleRemove = () => {
        setUploadedFile(null);
        setPreviewUrl("");
        setFileList([]);
    };

    /* ================= DOWNLOAD ================= */
    const handleDownload = async () => {
        if (!previewUrl) return;

        try {
            const res = await fetch(previewUrl);
            const blob = await res.blob();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "Report.pdf";
            link.click();

            window.URL.revokeObjectURL(url);
        } catch {
            message.error("Download failed");
        }
    };

    /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!uploadedFile && isUploadMode) {
        message.warning("Please select a file");
        return;
    }

    if (!data?.id) {
        message.error("Report ID missing");
        return;
    }

    try {
        setLoading(true);

        const fileToSend = uploadedFile || data.file_path;

        let res;

        if (isEditMode) {
            res = await dispatch(
                updateAnalysisReport({
                    id: data.id, // ✅ safe now
                    file: fileToSend,
                    isExisting: !uploadedFile,
                })
            ).unwrap();
        } else {
            res = await dispatch(
                uploadAnalysisReport({
                    id: data.id,
                    file: uploadedFile,
                })
            ).unwrap();
        }

        message.success(res.message || "Success");

        if (onSuccess) onSuccess();
        onCancel();

    } catch (err) {
        message.error(err?.message || "Operation failed");
    } finally {
        setLoading(false);
    }
};

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            width={700}
            title={
                isUploadMode
                    ? "Upload Report"
                    : isEditMode
                        ? "Edit Report"
                        : "View Report"
            }
        >
            <div
                style={{
                    maxHeight: "75vh",
                    overflowY: "auto",
                    overflowX: "hidden", // ✅ FIX horizontal scroll
                    paddingRight: 4,
                }}
            >
                {/* ================= FORM ================= */}
                <Form form={form} layout="vertical" style={{ width: "100%" }}>
                    <Row gutter={12} style={{ margin: 0 }}>
                        <Col xs={24}>
                            <Form.Item label="Student Name" name="name">
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* ✅ Program + Counselling Service SAME ROW */}
                    <Row gutter={12} style={{ margin: 0 }}>
                        <Col xs={24} md={12}>
                            <Form.Item label="Program" name="program">
                                <Input readOnly />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Counselling Service"
                                name="counselling_service"
                            >
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                    </Row>

                </Form>

                {/* ================= PDF SECTION ================= */}
                <Title level={5}>
                    <FilePdfOutlined /> Upload / Preview
                </Title>

                <div
                    style={{
                        border: "1px solid #f0f0f0",
                        borderRadius: 8,
                        padding: 16,
                        width: "100%",
                        overflow: "hidden", // ✅ prevent overflow
                    }}
                >
                    <Row gutter={16} style={{ margin: 0 }}>
                        <Col xs={24} md={16}>
                            {previewUrl ? (
                                <iframe
                                    src={previewUrl}
                                    title="PDF Preview"
                                    style={{
                                        width: "100%",
                                        height: 220,
                                        border: "none",
                                    }}
                                />
                            ) : (
                                <Empty description="No file uploaded" />
                            )}
                        </Col>

                        <Col xs={24} md={8}>
                            {!isViewMode && (
                                <Upload
                                    accept=".pdf"
                                    beforeUpload={handleFileSelect}
                                    onRemove={handleRemove}
                                    fileList={fileList}
                                    maxCount={1}
                                >
                                    <Button
                                        icon={<UploadOutlined />}
                                        type="primary"
                                        block
                                    >
                                        Select PDF
                                    </Button>
                                </Upload>
                            )}

                            {isViewMode && previewUrl && (
                                <Button
                                    icon={<DownloadOutlined />}
                                    block
                                    style={{ marginTop: 10 }}
                                    onClick={handleDownload}
                                >
                                    Download
                                </Button>
                            )}
                        </Col>
                    </Row>
                </div>

                {/* ================= ACTION BUTTONS ================= */}
                {!isViewMode && (
                    <div style={{ textAlign: "right", marginTop: 20 }}>
                        <Button onClick={onCancel} style={{ marginRight: 8 }}>
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

export default ViewAnalyasisReportModal;