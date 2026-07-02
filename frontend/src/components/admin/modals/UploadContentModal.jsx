
import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Switch,
  Button,
  Row,
  Col,
  Empty,
  Typography,
  Tag,
  Tooltip,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  EyeOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import adminTheme from "../../../theme/adminTheme";
import { fetchActivePrograms } from "../../../adminSlices/programSlice";
import {
  fetchPackagesByMultiplePrograms,
  clearPackages,
} from "../../../adminSlices/packageSlice";
import { uploadContent, updateContent, resetContentState, fetchContentList } from "../../../adminSlices/contentSlice";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ALL_PROGRAM_VALUE = "__ALL__";

const getFileNameFromUrl = (url = "") => {
  try {
    return decodeURIComponent(url.split("/").pop()?.split("?")[0] || "");
  } catch {
    return url.split("/").pop()?.split("?")[0] || "";
  }
};

const isPdfSource = (source = "") => {
  if (!source) return false;
  return /\.pdf($|\?)/i.test(source) || source.toLowerCase().includes("application/pdf");
};

const getFileExtension = (source = "", fallback = "pdf") => {
  const match = source.match(/\.([a-z0-9]+)($|\?)/i);
  return match?.[1]?.toLowerCase() || fallback;
};

const getDocumentUrl = (content = {}) =>
  content.file_url || content.file || content.document_url || content.document || "";

const UploadContentModal = ({
  open,
  onCancel,
  onSubmit,
  onSaveDraft,
  initialValues,
  viewMode = false,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { token } = adminTheme;

  const { activeList: programs, loading: programLoading } = useSelector(
    (state) => state.programs
  );

  const { list: packages, programsData, loading: packageLoading, } = useSelector((state) => state.packages);

  const { loading } = useSelector((state) => state.content);

  const [fileType, setFileType] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [thumbnailFileList, setThumbnailFileList] = useState([]);
  const [isPdfFile, setIsPdfFile] = useState(false);
  const [previewLoadError, setPreviewLoadError] = useState(false);
  const [iframePreviewUrl, setIframePreviewUrl] = useState(null);

  const isEditMode = !!initialValues;
  const isFree = Form.useWatch("is_free", form);
  const showAccessControls = Form.useWatch("show_access_controls", form);
  const shouldShowAccessControls = showAccessControls !== undefined ? showAccessControls : false;

  const availableStreams = programsData
    .filter((program) =>
      selectedPrograms.includes(program.id)
    )
    .flatMap((program) => program.streams || [])
    .filter(
      (stream, index, self) =>
        index === self.findIndex((s) => s.id === stream.id)
    );

  /* ---------------- LOG MODE WHEN MODAL OPENS ---------------- */
  // useEffect(() => {
  //   if (open) {
  //     console.log("📱 CONTENT MODAL OPENED");
  //     console.log("📋 Mode:", viewMode ? "view" : isEditMode ? "edit" : "upload");
  //     console.log("📊 Initial values:", initialValues);
  //     console.log("📋 Programs available:", programs);
  //   }
  // }, [open, viewMode, isEditMode, initialValues, programs]);

  useEffect(() => {
    if (open) {
      dispatch(fetchActivePrograms());
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (open && initialValues) {
      // Reset form and all states first to clear any previous values
      form.resetFields();
      setFileType(null);
      setPreviewUrl(null);
      setIsPdfFile(false);
      setPreviewLoadError(false);
      setUploadedFile(null);
      setFileList([]);
      setSelectedPrograms([]);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setThumbnailFileList([]);
      dispatch(clearPackages());

      // console.log("📄 Setting initial values:", initialValues);

      // Handle program selection from program_details array
      let programValues = [];

      // Check if program_details exists and has items
      if (initialValues.program_details && initialValues.program_details.length > 0) {
        programValues = initialValues.program_details.map(p => p.id);
        // console.log("📌 Program details found, setting to program IDs:", programValues);
      } else {
        // Empty array means no programs assigned
        programValues = [];
        // console.log("⚠️ Empty program_details - no programs assigned");
      }

      // Get package ID from package_details if exists
      let packageValue = [];

      if (
        initialValues.package_details &&
        initialValues.package_details.length > 0
      ) {
        packageValue = initialValues.package_details.map(
          (pkg) => pkg.id
        );
      }


      form.setFieldsValue({
        title: initialValues.title,
        type: initialValues.type,
        category: initialValues.category,
        description: initialValues.description,
        program: programValues,
        package: packageValue, // Use the package ID
        stream:
          initialValues.stream_details?.length > 0
            ? initialValues.stream_details.map((s) => s.id)
            : [],

        video_link: initialValues.video_link,
        show_access_controls: Boolean(initialValues.is_student_visible),
        full_payment: initialValues.payment_required,
        is_free: initialValues.free_content,
      });

      setFileType(initialValues.type);
      setSelectedPrograms(programValues);

      // ✅ Set PDF preview if exists
      const documentUrl = getDocumentUrl(initialValues);

      if (documentUrl) {
        const url = documentUrl;
        const fileName = getDisplayFileName(initialValues, url);
        const isPdf =
          isPdfSource(url) ||
          isPdfSource(fileName) ||
          initialValues.type === "pdf";

        setIsPdfFile(isPdf);
        setPreviewUrl(url);
        setPreviewLoadError(false);

        setFileList([
          {
            uid: "-1",
            name: fileName,
            status: "done",
            url,
          },
        ]);
      } else {
        setIsPdfFile(initialValues.type === "pdf");
        setPreviewUrl(null);
        setPreviewLoadError(false);
        setFileList([]);
      }
      // ✅ Thumbnail handling (ALWAYS reset first)
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setThumbnailFileList([]);

      // ✅ Thumbnail preview for edit mode
      if (initialValues.image) {
        setThumbnailPreview(initialValues.image);
        setThumbnailFileList([
          {
            uid: "-1",
            name: "Thumbnail",
            status: "done",
            url: initialValues.image,
          },
        ]);
      }
      // Only fetch packages if a single program is selected
      if (programValues.length > 0) {
        dispatch(
          fetchPackagesByMultiplePrograms(programValues)
        );
      } else {
        // Clear packages for multiple selections or no selection
        dispatch(clearPackages());
      }
    }

    if (open && !initialValues) {
      form.resetFields();
      form.setFieldsValue({
        show_access_controls: false,
        full_payment: false,
        is_free: false,
      });
      setFileType(null);
      setPreviewUrl(null);
      setIsPdfFile(false);
      setPreviewLoadError(false);
      setUploadedFile(null);
      setFileList([]);
      setSelectedPrograms([]);
      dispatch(clearPackages());

      // ✅ ADD THIS
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setThumbnailFileList([]);
    }
  }, [open, initialValues, dispatch, form]);


  useEffect(() => {
    let objectUrl = null;

    const loadPdfPreview = async () => {
      if (!open || !previewUrl || !isPdfFile) {
        setIframePreviewUrl(null);
        return;
      }

      if (previewUrl.startsWith("blob:")) {
        setIframePreviewUrl(previewUrl);
        return;
      }

      try {
        const response = await fetch(previewUrl);
        const blob = await response.blob();

        if (blob.type && blob.type !== "application/pdf") {
          setIframePreviewUrl(null);
          setPreviewLoadError(true);
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setIframePreviewUrl(objectUrl);
        setPreviewLoadError(false);
      } catch (error) {
        // console.error("Preview fetch failed:", error);
        setIframePreviewUrl(null);
        setPreviewLoadError(true);
      }
    };

    loadPdfPreview();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [open, previewUrl, isPdfFile]);

  const getDisplayFileName = (content = {}, url = "") => {
    if (content?.file_name) return content.file_name;
    return getFileNameFromUrl(url) || content?.title || "File";
  };

  /* ---------------- FILE HANDLING ---------------- */
  const handleFileSelect = (file) => {
    // console.log("📁 File selected:", file.name);

    const isPdf =
      file.type === "application/pdf" ||
      /\.pdf$/i.test(file.name);

    setIsPdfFile(isPdf);
    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewLoadError(false);
    setFileList([file]);

    return false;
  };

  const handleRemove = () => {
    // console.log("🗑️ File removed");
    setUploadedFile(null);

    // If in edit mode and there's an existing file, restore the preview
    const existingDocumentUrl = getDocumentUrl(initialValues);

    if (isEditMode && existingDocumentUrl) {
      setPreviewUrl(existingDocumentUrl);
      setIsPdfFile(
        isPdfSource(existingDocumentUrl) ||
        isPdfSource(initialValues.title) ||
        initialValues?.type === "pdf"
      );
      setPreviewLoadError(false);
      setFileList([
        {
          uid: "-1",
          name: getDisplayFileName(initialValues, existingDocumentUrl),
          status: "done",
          url: existingDocumentUrl,
        },
      ]);
    } else {
      setPreviewUrl(null);
      setIsPdfFile(false);
      setPreviewLoadError(false);
      setFileList([]);
    }
  };

  // const handleOpenPreview = () => {
  //   if (!previewUrl) return;
  //   window.open(previewUrl, "_blank", "noopener,noreferrer");
  // };

  /* ---------------- PREVIEW ---------------- */
  const handleOpenPreview = () => {
    if (!previewUrl) return;

    // If it's blob → open directly
    if (previewUrl.startsWith("blob:")) {
      window.open(previewUrl, "_blank");
      return;
    }

    // If it's backend file → open normally
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  /* ---------------- DOWNLOAD ---------------- */
  const handleDownload = async () => {
    // console.log("⬇️ Download initiated");
    if (!previewUrl) {
      // console.log("❌ No file to download");
      return;
    }

    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const existingName = initialValues?.file_name || fileList?.[0]?.name || getFileNameFromUrl(previewUrl);
      const extension = getFileExtension(existingName || previewUrl, isPdfFile ? "pdf" : "file");
      const baseName =
        existingName?.replace(/\.[^.]+$/, "") ||
        (form.getFieldValue("title") || initialValues?.title || "Content").trim();
      link.download = existingName || `${baseName}.${extension}`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      // console.log("✅ Download successful");
       message.success("File downloaded successfully");
    } catch (error) {
      // console.error("❌ Download failed:", error);
      message.error("Failed to download file");
    }
  };

  const beforeUpload = (file) => {
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

    if (file.size / 1024 / 1024 > 500) {
      message.error("File must be smaller than 500MB!");
      return Upload.LIST_IGNORE;
    }

    return handleFileSelect(file);
  };

  const handleThumbnailSelect = (file) => {
    if (!file.type.startsWith("image/")) {
      message.error("Only image files (JPG/PNG) allowed");
      return Upload.LIST_IGNORE;
    }

    if (file.size / 1024 / 1024 > 5) {
      message.error("Thumbnail must be smaller than 5MB");
      return Upload.LIST_IGNORE;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setThumbnailFileList([file]);

    return false; // prevent auto upload
  };

  const handleThumbnailRemove = () => {
    setThumbnailFile(null);
    if (isEditMode && initialValues?.image) {
      setThumbnailPreview(initialValues.image);
      setThumbnailFileList([
        {
          uid: "-1",
          name: "Thumbnail",
          status: "done",
          url: initialValues.image,
        },
      ]);
    } else {
      setThumbnailPreview(null);
      setThumbnailFileList([]);
    }
  };

  const handleFinish = async (values, isDraft = false) => {
    try {
      const formData = new FormData();

      if (
        values.type === "pdf" &&
        !uploadedFile &&
        !getDocumentUrl(initialValues)
      ) {
        message.error("Please upload a document file");
        return;
      }

      // ✅ Always required in normal upload
      if (values.title) formData.append("title", values.title);
      if (values.type) formData.append("type", values.type);
      if (values.category) formData.append("category", values.category);
      if (values.description) formData.append("description", values.description);

      // ---------------- PROGRAM ----------------

      const contentMapping = values.program.map((programId) => ({
        program: programId,
        package: values.package || [],
        stream: values.stream || [],
      }));

      formData.append(
        "content_mapping",
        JSON.stringify(contentMapping)
      );

      // ---------------- VISIBILITY ----------------
      if (values.show_access_controls !== undefined) {
        formData.append(
          "is_student_visible",
          values.show_access_controls ? "true" : "false"
        );
      }
      // ---------------- PAYMENT FLAGS ----------------
      if (values.full_payment !== undefined) {
        formData.append("payment_required", values.full_payment ? "true" : "false");
      }

      if (values.is_free !== undefined) {
        formData.append("free_content", values.is_free ? "true" : "false");
      }

      // ---------------- DRAFT ----------------
      formData.append("is_draft", isDraft ? "true" : "false");

      // ---------------- VIDEO ----------------
      if (values.type === "video" && values.video_link) {
        formData.append("video_link", values.video_link);
      }

      // ---------------- PDF ----------------
      if (values.type === "pdf") {
        if (uploadedFile) {
          formData.append("file_url", uploadedFile);
        }
      }

      // ---------------- THUMBNAIL ----------------
      if (thumbnailFile) {
        formData.append("image", thumbnailFile);
      }

      // 🔍 Debug
      // console.log("📤 Clean FormData:");
      for (let pair of formData.entries()) {
        // console.log(pair[0], pair[1]);
      }

      if (isEditMode && initialValues?.id) {
        await dispatch(updateContent({ id: initialValues.id, formData })).unwrap();
        message.success("Content updated successfully!");
      } else {
        await dispatch(uploadContent(formData)).unwrap();
        message.success(isDraft ? "Draft saved successfully!" : "Content uploaded successfully!");
      }

      dispatch(resetContentState());
      dispatch(fetchContentList());

      form.resetFields();
      setPreviewUrl(null);
      setPreviewLoadError(false);
      setUploadedFile(null);
      setFileList([]);
      setFileType(null);
      setSelectedPrograms([]);
      onCancel();

    } catch (error) {
      // console.log("Backend Error:", error);

      if (error?.errors) {
        Object.entries(error.errors).forEach(([field, msgs]) => {
          message.error(`${field}: ${msgs[0]}`);
        });
      } else {
        message.error("Something went wrong");
      }
    }
  };

  const handleClose = async () => {
    if (viewMode) {
      onCancel();
      return;
    }

    try {
      const values = form.getFieldsValue();

      const hasData =
        values.title ||
        values.description ||
        values.type ||
        uploadedFile ||
        values.video_link;

      // Only auto-save draft in CREATE mode (not edit)
      if (hasData && !isEditMode) {
        await submitAsDraft();
      }

      onCancel();
    } catch (error) {
      // console.log("Close Error:", error);
      onCancel();
    }
  };

  const submitAsDraft = async () => {
    try {
      const values = form.getFieldsValue();

      // Check if at least one important field is filled
      const hasImportantData =
        values.title ||
        values.description ||
        values.type ||
        uploadedFile ||
        values.video_link;

      if (!hasImportantData) {
        return;
      }

      await handleFinish(values, true); // pass draft = true
       message.success("Draft saved successfully");
    } catch (error) {
      // console.log("Draft Save Error:", error);
    }
  };

  return (
    <Modal
      title={
        viewMode
          ? "View Content"
          : isEditMode
            ? "Edit Content"
            : "Upload New Content"
      }
      open={open}
      centered
      onCancel={handleClose}
      okText={viewMode ? "Close" : isEditMode ? "Update" : "Upload Content"}
      onOk={() => (!viewMode ? form.submit() : handleClose())}
      okButtonProps={{
        loading: loading,
      }}
      destroyOnClose
      width={800}
    >
      <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          {/* Title */}
          <Form.Item
            label="Content Title"
            name="title"
            rules={[{ required: true, message: "Please enter content title" }]}
          >
            <Input
              placeholder="e.g., Engineering Entrance Exam Guide 2026"
              readOnly={viewMode}
            />
          </Form.Item>

          {/* Type & Category */}
          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item
              label="Content Type"
              name="type"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select
                placeholder="Select type"
                disabled={viewMode}
                onChange={(value) => {
                  setFileType(value);
                  if (value === "video") {
                    setPreviewUrl(null);
                    setIsPdfFile(false);
                    setPreviewLoadError(false);
                    setUploadedFile(null);
                    setFileList([]);
                  } else {
                    form.setFieldsValue({ video_link: null });
                  }
                }}
              >
                <Option value="pdf">Document</Option>
                <Option value="video">Video</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Select category" disabled={viewMode}>
                <Option value="study_material">Study Material</Option>
                <Option value="tutorial">Tutorial</Option>
                <Option value="guide">Guide</Option>
              </Select>
            </Form.Item>
          </div>

          {/* Description */}
          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true }]}
          >
            <TextArea
              placeholder="Brief description of the content"
              rows={3}
              readOnly={viewMode}
            />
          </Form.Item>

          {/* Video Link */}
          {fileType === "video" && (
            <Form.Item
              label="Video Link"
              name="video_link"
              rules={[
                { required: true, message: "Please enter video link" },
                { type: "url", message: "Enter valid URL" },
              ]}
            >
              <Input
                placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                readOnly={viewMode}
              />
            </Form.Item>
          )}

          {/* PDF Section with Preview */}
          {fileType === "pdf" && (
            <>
              <Title level={5} style={{ marginBottom: 8 }}>
                <FilePdfOutlined /> Document Preview / Upload
              </Title>

              <div
                style={{
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: token.borderRadius,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={16}>
                    {previewUrl ? (
                      isPdfFile && iframePreviewUrl && !previewLoadError ? (
                        <iframe
                          key={iframePreviewUrl}
                          src={iframePreviewUrl}
                          title="PDF Preview"
                          style={{ width: "100%", height: 250, border: "none" }}
                          onLoad={() => setPreviewLoadError(false)}
                          onError={() => setPreviewLoadError(true)}
                        />
                      ) : (
                        <div style={{ textAlign: "center", padding: 20 }}>
                          <FilePdfOutlined style={{ fontSize: 40, color: "#999" }} />
                          <p style={{ marginTop: 10, color: "#666" }}>
                            {isPdfFile
                              ? "Preview not available for this file type."
                              : "Preview not available for this file type."}
                          </p>
                          {!viewMode && previewUrl && (
                            <Button
                              type="default"
                              icon={<DownloadOutlined />}
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
                    {/* Upload button for non-view modes */}
                    {!viewMode && (
                      <Upload
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        beforeUpload={beforeUpload}
                        onRemove={handleRemove}
                        fileList={fileList}
                        maxCount={1}
                        customRequest={({ onSuccess }) => {
                          setTimeout(() => onSuccess("ok"));
                        }}
                      >
                        <Button
                          icon={<UploadOutlined />}
                          block
                          type="primary"
                        >
                          Select File
                        </Button>
                      </Upload>
                    )}

                    {/* Download button only for view mode */}
                    {viewMode && previewUrl && (
                      <>
                        {/* <Button
                        icon={<EyeOutlined />}
                        block
                        onClick={handleOpenPreview}
                      >
                        View File
                      </Button> */}
                        <Button
                          icon={<DownloadOutlined />}
                          block
                          style={{ marginTop: 8 }}
                          onClick={handleDownload}
                        >
                          Download File
                        </Button>
                      </>
                    )}

                    {/* Show message about existing file in edit mode */}
                    {isEditMode && !viewMode && getDocumentUrl(initialValues) && !uploadedFile && (
                      <div style={{ marginTop: 12, color: token.colorInfo, fontSize: 12 }}>
                        <EyeOutlined /> Current file will be kept if no new file is selected
                      </div>
                    )}
                  </Col>
                </Row>
              </div>

              {/* Hidden form item for validation */}
              <Form.Item
                name="file"
                hidden
                rules={[
                  {
                    validator: (_, value) => {
                      if (!uploadedFile && !getDocumentUrl(initialValues)) {
                        return Promise.reject(new Error("Please upload a document file"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input hidden />
              </Form.Item>
            </>
          )}


          <Row gutter={16}>
            {/* Program Field */}
            <Col
              xs={24}
              sm={24}
              md={selectedPrograms.length === 1 && !selectedPrograms.includes(ALL_PROGRAM_VALUE) ? 8 : 24}
            >
              <Form.Item
                label="Assign to Program"
                name="program"
                rules={[{ required: true, message: "Please select program(s)" }]}
              >
                <Select
                  mode="multiple"
                  disabled={viewMode}
                  loading={programLoading}
                  allowClear
                  placeholder="Select programs"
                  maxTagCount="responsive"
                  onChange={(values) => {
                    setSelectedPrograms(values);

                    if (values.includes(ALL_PROGRAM_VALUE)) {
                      const allProgramIds = programs.map((p) => p.id);
                      form.setFieldsValue({ program: allProgramIds, package: null, stream: null });
                      setSelectedPrograms(allProgramIds);
                      dispatch(clearPackages());
                    } else {
                      const hadAllPrograms = selectedPrograms.includes(ALL_PROGRAM_VALUE);
                      if (hadAllPrograms) {
                        form.setFieldsValue({ program: [], package: null, stream: null });
                        setSelectedPrograms([]);
                        dispatch(clearPackages());
                      } else {
                        setSelectedPrograms(values);
                        form.setFieldsValue({
                          package: null,
                          stream: null,
                        });

                        if (values.length > 0) {
                          dispatch(
                            fetchPackagesByMultiplePrograms(values)
                          );
                        } else {
                          dispatch(clearPackages());
                        }
                      }
                    }
                  }}
                  value={selectedPrograms}
                >
                  <Option value={ALL_PROGRAM_VALUE}>
                    <GlobalOutlined /> Select All Programs
                  </Option>
                  {programs.map((program) => (
                    <Option key={program.id} value={program.id}>
                      {program.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Package Field */}
            {selectedPrograms.length > 0 && !selectedPrograms.includes(ALL_PROGRAM_VALUE) && (
              <>
                <Col xs={24} sm={24} md={8}>
                  <Form.Item
                    label="Counselling Service"
                    name="package"
                  // rules={[
                  //   {
                  //     required: true,
                  //     message: "Please select a counselling service when a single program is selected",
                  //   },
                  // ]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="Select counselling service"
                      loading={packageLoading}
                      disabled={viewMode}
                      allowClear={false}
                    >
                      {packages.length > 0 ? (
                        packages.map((pkg) => (
                          <Option key={pkg.id} value={pkg.id}>
                            {pkg.name}
                          </Option>
                        ))
                      ) : (
                        <Option value="" disabled>
                          No counselling services available for this program
                        </Option>
                      )}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={24} md={8}>
                  <Form.Item
                    label="Stream"
                    name="stream"
                  >
                    <Select
                      mode="tags"
                      placeholder="Select or type Stream"
                      allowClear
                      disabled={viewMode}
                      onChange={(values) => {
                        const existingStreamNames = availableStreams.map((s) =>
                          s.name.trim().toLowerCase()
                        );

                        const filteredValues = [];
                        let duplicateFound = false;

                        values.forEach((value) => {
                          const streamObj = availableStreams.find(
                            (s) => String(s.id) === String(value)
                          );

                          const normalized = streamObj
                            ? streamObj.name.trim().toLowerCase()
                            : String(value).trim().toLowerCase();

                          if (
                            !streamObj && // typed value
                            existingStreamNames.includes(normalized)
                          ) {
                            duplicateFound = true;
                            return; // don't add it
                          }

                          if (!filteredValues.includes(value)) {
                            filteredValues.push(value);
                          }
                        });

                        if (duplicateFound) {
                          message.error("This stream already exists");
                        }

                        form.setFieldsValue({
                          stream: filteredValues,
                        });
                      }}
                    >
                      {availableStreams.map((stream) => (
                        <Option key={stream.id} value={stream.id}>
                          {stream.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>

          {/* Warning Message */}
          {selectedPrograms.length === 1 &&
            !selectedPrograms.includes(ALL_PROGRAM_VALUE) &&
            packages.length === 0 &&
            !packageLoading && (
              <div style={{ color: token.colorWarning, marginBottom: 16 }}>
                ⚠️ No counselling services available for the selected program
              </div>
            )}
          {/* Thumbnail Upload */}
          <Title level={5} style={{ marginBottom: 8 }}>
            Thumbnail Image
          </Title>

          <div
            style={{
              border: `1px solid ${token.colorBorder}`,
              borderRadius: token.borderRadius,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Row gutter={16}>
              <Col xs={24} md={16}>
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail Preview"
                    style={{
                      width: "100%",
                      height: 200,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                  />
                ) : (
                  <Empty
                    description="No Thumbnail Selected"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Col>

              <Col xs={24} md={8}>
                {!viewMode && (
                  <Upload
                    accept="image/*"
                    beforeUpload={handleThumbnailSelect}
                    onRemove={handleThumbnailRemove}
                    fileList={thumbnailFileList}
                    maxCount={1}
                    customRequest={({ onSuccess }) => {
                      setTimeout(() => onSuccess("ok"));
                    }}
                  >
                    <Button icon={<UploadOutlined />} block type="primary">
                      Select Thumbnail
                    </Button>
                  </Upload>
                )}
              </Col>
            </Row>
          </div>

          <Form.Item
            label="Make accessible to all users?"
            name="show_access_controls"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Yes"
              unCheckedChildren="No"
              disabled={viewMode}
              onChange={(checked) => {
                if (!checked) {
                  form.setFieldsValue({
                    full_payment: false,
                    is_free: false,
                  });
                }
              }}
            />
          </Form.Item>


          {shouldShowAccessControls && (
            <div style={{ display: "flex", gap: 40 }}>

              <Form.Item
                label="Full Payment Required"
                name="full_payment"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="On"
                  unCheckedChildren="Off"
                  disabled={viewMode || isFree}
                  onChange={(checked) => {
                    if (checked) {
                      form.setFieldsValue({
                        is_free: false,
                      });
                    }
                  }}
                />
              </Form.Item>

              <Form.Item
                label="Free Content"
                name="is_free"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="On"
                  unCheckedChildren="Off"
                  disabled={viewMode}
                  onChange={(checked) => {
                    if (checked) {
                      form.setFieldsValue({
                        full_payment: false,
                      });
                    }
                  }}
                />
              </Form.Item>
            </div>
          )}
        </Form>
      </div>
    </Modal>
  );
};

export default UploadContentModal;
