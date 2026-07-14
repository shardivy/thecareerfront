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
    Tabs,
    Alert,
    message,
    Tag,
} from "antd";
import {
    DownloadOutlined,
    UploadOutlined,
    FilePdfOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { updateAnalysisReport } from "../../../adminSlices/collegeAnalysisSlice";

const { Title, Text } = Typography;

/* ─────────────────────────────────────────
   Helper — extract a display filename
───────────────────────────────────────── */
const getDisplayFileName = (data = {}) => {
    if (data?.file_name) return data.file_name;
    return (
        data?.file_path
            ?.split("/")
            .filter(Boolean)
            .pop()
            ?.split("?")[0]
            ?.split("#")[0] || "Report.pdf"
    );
};

/* ─────────────────────────────────────────
   VersionPanel
   readOnly  → preview + download only
   editable  → preview + "Replace file" picker
               Update button lives OUTSIDE the tab (in the modal footer)
───────────────────────────────────────── */
const VersionPanel = ({
    versionKey,
    label,
    data,
    readOnly,
    stagedFile,
    onFileChange,
    updateCount,
}) => {
    const [previewUrl, setPreviewUrl] = useState("");
    const [isPdfFile, setIsPdfFile] = useState(false);
    const [previewLoadError, setPreviewLoadError] = useState(false);
    const [fileList, setFileList] = useState([]);

    /* Sync preview when data/tab changes */
    useEffect(() => {
        if (!data?.file_path) {
            setPreviewUrl("");
            setIsPdfFile(false);
            setPreviewLoadError(false);
            setFileList([]);
            return;
        }
        const fileName = getDisplayFileName(data);
        const isPdf = fileName.toLowerCase().endsWith(".pdf");
        setIsPdfFile(isPdf);
        setPreviewUrl(data.file_path);
        setPreviewLoadError(false);
        setFileList([{ uid: "-1", name: fileName, status: "done", url: data.file_path }]);
    }, [data, versionKey]);

    /* When a staged file arrives from parent, update local preview */
    useEffect(() => {
        if (!stagedFile) {
            // Restore original file preview if user cleared selection
            if (data?.file_path) {
                const fileName = getDisplayFileName(data);
                setIsPdfFile(fileName.toLowerCase().endsWith(".pdf"));
                setPreviewUrl(data.file_path);
                setFileList([{ uid: "-1", name: fileName, status: "done", url: data.file_path }]);
            } else {
                setPreviewUrl("");
                setFileList([]);
                setIsPdfFile(false);
            }
            setPreviewLoadError(false);
            return;
        }
        const isPdf = stagedFile.type === "application/pdf";
        setIsPdfFile(isPdf);
        setPreviewUrl(URL.createObjectURL(stagedFile));
        setPreviewLoadError(false);
        setFileList([stagedFile]);
    }, [stagedFile]);

    const handleFileSelect = (file) => {
        const allowed = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];
        if (!allowed.includes(file.type)) {
            message.error("Only PDF, Word, and Excel files are allowed");
            return Upload.LIST_IGNORE;
        }
        onFileChange(file);
        return false;
    };

    const handleRemove = () => {
        onFileChange(null);
    };

    const handleDownload = async () => {
        const url = data?.file_path;
        if (!url) return;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = getDisplayFileName(data);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            message.success("Report downloaded successfully");
        } catch {
            message.error("Failed to download report");
        }
    };

    const hasExistingFile = !!data?.file_path;
    const hasNewFile = !!stagedFile;
    const showPreview = hasExistingFile || hasNewFile;

    return (
        <div>
            {readOnly && (
                <Alert
                    type="info"
                    showIcon
                    message="This version was uploaded by the student. Viewing and downloading only — editing is not permitted."
                    style={{ marginBottom: 16, borderRadius: 8 }}
                />
            )}

            <Title
                level={5}
                style={{
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}
            >
                <FilePdfOutlined />
                {label}

                <Tag color="blue">
                    Updates: {updateCount || 0}
                </Tag>
            </Title>

            <div
                style={{
                    border: "1px solid #f0f0f0",
                    borderRadius: 8,
                    padding: 16,
                    overflow: "hidden",
                }}
            >
                <Row gutter={16} style={{ margin: 0 }}>
                    {/* ── Preview ── */}
                    <Col xs={24} md={16}>
                        {showPreview ? (
                            isPdfFile && !previewLoadError ? (
                                <iframe
                                    key={previewUrl}
                                    src={previewUrl}
                                    title={`${versionKey.toUpperCase()} PDF Preview`}
                                    style={{ width: "100%", height: 220, border: "none", borderRadius: 6 }}
                                    onLoad={() => setPreviewLoadError(false)}
                                    onError={() => setPreviewLoadError(true)}
                                />
                            ) : (
                                <div style={{ textAlign: "center", padding: 20, background: "#fafafa", borderRadius: 6 }}>
                                    <FilePdfOutlined style={{ fontSize: 40, color: "#999" }} />
                                    <p style={{ marginTop: 10, marginBottom: 0, color: "#666" }}>
                                        {isPdfFile
                                            ? "Inline preview not available for this file."
                                            : "Preview not available for this file type."}
                                    </p>
                                </div>
                            )
                        ) : (
                            <Empty description="No file uploaded" style={{ padding: "24px 0" }} />
                        )}
                    </Col>

                    {/* ── Actions ── */}
                    <Col xs={24} md={8}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {/* Replace-file picker — editable panels only */}
                            {!readOnly && (
                                <Upload
                                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                                    beforeUpload={handleFileSelect}
                                    onRemove={handleRemove}
                                    fileList={hasNewFile ? fileList : []}
                                    maxCount={1}
                                    showUploadList={hasNewFile}
                                >
                                    <Button icon={<UploadOutlined />} block>
                                        {hasNewFile ? "Replace again" : hasExistingFile ? "Replace file" : "Select file"}
                                    </Button>
                                </Upload>
                            )}

                            {/* Download — always visible when a server file exists */}
                            {hasExistingFile && (
                                <Button icon={<DownloadOutlined />} block onClick={handleDownload}>
                                    Download
                                </Button>
                            )}

                            {/* Staged file indicator */}
                            {hasNewFile && (
                                <div style={{
                                    fontSize: 12,
                                    color: "#389e0d",
                                    background: "#f6ffed",
                                    border: "1px solid #b7eb8f",
                                    borderRadius: 6,
                                    padding: "4px 8px",
                                    wordBreak: "break-all",
                                }}>
                                    ✓ Staged: {stagedFile.name}
                                </div>
                            )}

                            {!hasExistingFile && !hasNewFile && (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="No report uploaded"
                                />
                            )}
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────
   ViewAnalyasisReportModal

   VIEW mode → tabbed previews (V1 / V2 / V3), read-only
   EDIT mode → same tabbed UI, V1 + V3 tabs have file pickers
               Single "Update" button below tabs sends ONE PUT
               with whichever files were staged across any tab
───────────────────────────────────────── */
const ViewAnalyasisReportModal = ({
    open,
    onCancel,
    data,
    mode = "view",
    onSuccess,
    defaultTab = "v1",
    visibleTabs = ["v1", "v2", "v3"],
}) => {
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(defaultTab);

    // Files staged across tabs — lifted to modal level so they persist when switching tabs
    const [v1File, setV1File] = useState(null);
    const [v3File, setV3File] = useState(null);

    const isViewMode = mode === "view";

    /* Reset staged files + active tab when modal opens */
    useEffect(() => {
        if (!open) return;
        setV1File(null);
        setV3File(null);
        if (defaultTab === "v3" && data?.report_status_v2 !== "v2_received") {
            setActiveTab("v1");
        } else {
            setActiveTab(defaultTab);
        }
    }, [open, defaultTab, data]);

    /* Populate student info fields */
    useEffect(() => {
        if (!data) return;
        form.setFieldsValue({
            name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            program: data.program || "-",
            counselling_service: data.package || "-",
        });
    }, [data, form]);

    /* ─────────────────────────────────────
       Single PUT — sends whichever files are staged
    ───────────────────────────────────── */
    const handleUpdate = async () => {
        if (!v1File && !v3File) {
            message.warning("Please select at least one file to update");
            return;
        }

        const id = data?.id;
        if (!id) return message.error("Report ID missing");

        const formData = new FormData();
        if (v1File) formData.append("file_path", v1File);
        if (v3File) formData.append("file_path2", v3File);

        try {
            setLoading(true);
            const res = await dispatch(updateAnalysisReport({ id, formData })).unwrap();
            message.success(res?.message || "Report updated successfully");
            onSuccess?.();
            onCancel();
        } catch (err) {
            message.error(err?.message || "Failed to update report");
        } finally {
            setLoading(false);
        }
    };

    /* Derive per-version data objects */
    const v1Data = data
        ? { file_path: data.v1_file_path || data.file_path, file_name: data.v1_file_name || data.file_name }
        : null;
    const v2Data = data
        ? { file_path: data.v2_file_path || data.file_path1, file_name: data.v2_file_name || data.file_name1 }
        : null;
    const v3Data = data
        ? { file_path: data.v3_file_path || data.file_path2, file_name: data.v3_file_name || data.file_name2 }
        : null;

    /* Dynamic update button label */
    const updateLabel = v1File && v3File
        ? "Update V1 & V3"
        : v1File
            ? "Update V1"
            : v3File
                ? "Update V3"
                : "Update";

    const allTabItems = [
        {
            key: "v1",
            label: (
                <span>
                    V1 — Admin report
                    <Tag
                        color="blue"
                        style={{ marginLeft: 8 }}
                    >
                        {data?.file_path_count || 0}
                    </Tag>
                    {v1File && (
                        <span style={{
                            display: "inline-block",
                            width: 7, height: 7,
                            borderRadius: "50%",
                            background: "#52c41a",
                            marginLeft: 6,
                            verticalAlign: "middle",
                        }} />
                    )}
                </span>
            ),
            children: (
                <VersionPanel
                    key={`v1-${data?.id}`}
                    versionKey="v1"
                    label="V1 Report (Admin)"
                    data={v1Data}
                    readOnly={isViewMode}
                    stagedFile={v1File}
                    onFileChange={setV1File}
                    updateCount={data?.file_path_count || 0}
                />
            ),
        },
        {
            key: "v2",
            label: (
                <span>
                    V2 — Student Report
                    <Tag
                        color="purple"
                        style={{ marginLeft: 8 }}
                    >
                        {data?.file_path1_count || 0}
                    </Tag>
                </span>
            ),
            children: (
                <VersionPanel
                    key={`v2-${data?.id}`}
                    versionKey="v2"
                    label="V2 Report (Student upload — view only)"
                    data={v2Data}
                    readOnly
                    stagedFile={null}
                    onFileChange={() => { }}
                    updateCount={data?.file_path1_count || 0}
                />
            ),
        },
        {
            key: "v3",
            label: (
                <span
                    title={
                        data?.report_status_v2 !== "v2_received"
                            ? "Student V2 report must be received before updating V3"
                            : ""
                    }
                >
                    V3 — Final report
                    <Tag
                        color="cyan"
                        style={{ marginLeft: 8 }}
                    >
                        {data?.file_path2_count || 0}
                    </Tag>
                    {v3File && (
                        <span style={{
                            display: "inline-block",
                            width: 7, height: 7,
                            borderRadius: "50%",
                            background: "#52c41a",
                            marginLeft: 6,
                            verticalAlign: "middle",
                        }} />
                    )}
                </span>
            ),
            disabled: data?.report_status_v2 !== "v2_received",
            children: (
                <VersionPanel
                    key={`v3-${data?.id}`}
                    versionKey="v3"
                    label="V3 Report (Admin — Final)"
                    data={v3Data}
                    readOnly={isViewMode}
                    stagedFile={v3File}
                    onFileChange={setV3File}
                    updateCount={data?.file_path2_count || 0}
                />
            ),
        },
    ];

    const tabItems = allTabItems.filter((t) => visibleTabs.includes(t.key));

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            width={720}
            destroyOnClose
            centered
            title={
                <span>
                    {isViewMode ? "View report" : "Edit report"}
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
            <div style={{ maxHeight: "82vh", overflowY: "auto", overflowX: "hidden", paddingRight: 4 }}>

                {/* ── Student info ── */}
                <Form form={form} layout="vertical" style={{ marginBottom: 8 }}>
                    <Row gutter={12} style={{ margin: 0 }}>
                        <Col xs={24}>
                            <Form.Item label="Student name" name="name">
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={12} style={{ margin: 0 }}>
                        <Col xs={24} md={12}>
                            <Form.Item label="Program" name="program">
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Counselling service" name="counselling_service">
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>

                {/* ── Tabs (same in both view and edit mode) ── */}
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    type="card"
                    size="small"
                />

                {/* ── Single Update button — edit mode only, outside the tabs ── */}
                {!isViewMode && (
                    <div style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 16,
                        paddingTop: 12,
                        borderTop: "1px solid #f0f0f0",
                    }}>
                        {/* Summary of staged files */}
                        {(v1File || v3File) && (
                            <Text type="colorTextSecondary" style={{ fontSize: 12, marginRight: "auto" }}>
                                Staged:{" "}
                                {[v1File && "V1", v3File && "V3"]
                                    .filter(Boolean)
                                    .join(" + ")}
                            </Text>
                        )}
                        <Button onClick={onCancel} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            loading={loading}
                            disabled={!v1File && !v3File}
                            onClick={handleUpdate}
                        >
                            {updateLabel}
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ViewAnalyasisReportModal;