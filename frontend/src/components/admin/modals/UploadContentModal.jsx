import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Switch,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchActivePrograms } from "../../../adminSlices/programSlice";
import {
  fetchPackagesByProgram,
  clearPackages,
} from "../../../adminSlices/packageSlice";
import adminTheme from "../../../theme/adminTheme";

const { Option } = Select;
const { TextArea } = Input;

const ALL_PROGRAM_VALUE = "__ALL__";

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

  const { list: packages, loading: packageLoading } = useSelector(
    (state) => state.packages
  );

  const [fileType, setFileType] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const isEditMode = !!initialValues;
  const isFree = Form.useWatch("is_free", form);

  useEffect(() => {
    if (open) {
      dispatch(fetchActivePrograms());
    }
  }, [open, dispatch]);

  const handleProgramChange = (value) => {
    form.setFieldsValue({ counselling_service: undefined });
    if (value === ALL_PROGRAM_VALUE) {
      dispatch(clearPackages());
      return;
    }
    dispatch(fetchPackagesByProgram(value));
  };

  useEffect(() => {
    if (open && initialValues) {
      form.setFieldsValue({
        ...initialValues,
        program: initialValues.is_all_program
          ? ALL_PROGRAM_VALUE
          : initialValues.program,
      });
      setFileType(initialValues.type);
      setPreviewFile(initialValues.file || null);

      if (initialValues.program && !initialValues.is_all_program) {
        dispatch(fetchPackagesByProgram(initialValues.program));
      }
    }

    if (open && !initialValues) {
      form.resetFields();
      setFileType(null);
      setPreviewFile(null);
      dispatch(clearPackages());
    }
  }, [open, initialValues, dispatch, form]);

  const handleFileChange = ({ fileList }) => {
    if (fileList.length > 0) {
      const file = fileList[0].originFileObj;
      if (file) setPreviewFile(URL.createObjectURL(file));
    } else setPreviewFile(null);
  };

  const beforeUpload = (file) => {
    if (file.type !== "application/pdf") {
      message.error("Only PDF files are allowed.");
      return Upload.LIST_IGNORE;
    }
    if (file.size / 1024 / 1024 > 500) {
      message.error("File must be smaller than 500MB!");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleFinish = (values) => {
    const payload = {
      ...initialValues,
      ...values,
      program:
        values.program === ALL_PROGRAM_VALUE ? null : values.program,
      is_all_program: values.program === ALL_PROGRAM_VALUE,
      file: fileType === "PDF" ? previewFile : null,
      video_link: fileType === "Video" ? values.video_link : null,
    };
    message.success(
      isEditMode ? "Content updated successfully!" : "Content uploaded successfully!"
    );
    onSubmit(payload);
    form.resetFields();
    setPreviewFile(null);
    setFileType(null);
  };

  const handleClose = () => {
    const values = form.getFieldsValue();
    const hasData = Object.values(values).some(
      (v) => v !== undefined && v !== null && v !== ""
    );
    if (hasData) {
      onSaveDraft({ ...initialValues, ...values });
      message.info("Content saved as draft");
    }
    onCancel();
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
      onCancel={handleClose}
      okText={viewMode ? "Close" : isEditMode ? "Update" : "Upload Content"}
      onOk={() => (!viewMode ? form.submit() : handleClose())}
      destroyOnClose
      width={700}
    >
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
                if (value === "Video") {
                  form.setFieldsValue({ file: null });
                  setPreviewFile(null);
                } else {
                  form.setFieldsValue({ video_link: null });
                }
              }}
            >
              <Option value="PDF">PDF</Option>
              <Option value="Video">Video</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Select placeholder="Select category" disabled={viewMode}>
              <Option value="Study Material">Study Material</Option>
              <Option value="Tutorial">Tutorial</Option>
              <Option value="Guide">Guide</Option>
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
        {fileType === "Video" && (
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

        {/* PDF Upload */}
        {fileType === "PDF" && (
          <Form.Item
            label="Upload File"
            name="file"
            valuePropName="fileList"
            getValueFromEvent={(e) => e && e.fileList}
            rules={[{ required: true, message: "Please upload PDF file" }]}
          >
            <Upload.Dragger
              beforeUpload={beforeUpload}
              onChange={handleFileChange}
              maxCount={1}
              disabled={viewMode}
              fileList={
                previewFile
                  ? [{ uid: "-1", name: "Preview File", url: previewFile }]
                  : []
              }
              style={{
                padding: "20px",
                border: `2px dashed ${token.colorPrimary}`,
                borderRadius: token.borderRadius,
                backgroundColor: token.colorBgContainer,
              }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: "24px", color: token.colorPrimary }} />
              </p>
              <p>Click to upload or drag and drop</p>
              <p style={{ fontSize: "12px", color: "#888" }}>
                PDF, Video, or Image files (Max 50MB)
              </p>
            </Upload.Dragger>
          </Form.Item>
        )}

        {/* Program & Counselling */}
        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item
            label="Assign to Program"
            name="program"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Select
              placeholder="Select program"
              disabled={viewMode}
              loading={programLoading}
              showSearch
              optionFilterProp="children"
              onChange={handleProgramChange}
            >
              <Option value={ALL_PROGRAM_VALUE}>All Programs</Option>
              {programs.map((program) => (
                <Option key={program.id} value={program.id}>
                  {program.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {packages.length > 0 && (
            <Form.Item
              label="Package Access"
              name="counselling_service"
              style={{ flex: 1 }}
            >
              <Select
                placeholder="Select package"
                loading={packageLoading}
                disabled={viewMode}
              >
                {packages.map((pkg) => (
                  <Option key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </div>

        {/* Toggles */}
        <div style={{ display: "flex", gap: 40 }}>
          <Form.Item
            label="Full Payment Required"
            name="full_payment"
            valuePropName="checked"
            extra={<span style={{ color: 'red' }}>Only unlocked after payment</span>}
          >
            <Switch
              checkedChildren="On"
              unCheckedChildren="Off"
              disabled={viewMode || isFree}
            />
          </Form.Item>

          <Form.Item
            label="Free Content"
            name="is_free"
            valuePropName="checked"
            extra={<span style={{ color: 'green' }}>Make accessible to all users</span>}
          >
            <Switch
              checkedChildren="On"
              unCheckedChildren="Off"
              disabled={viewMode}
            />
          </Form.Item>
        </div>


      </Form>
    </Modal>
  );
};

export default UploadContentModal;