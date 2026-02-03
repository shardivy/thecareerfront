import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Button,
  message,
  Typography,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { Option } = Select;
const { Text } = Typography;

const UploadContentModal = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  viewMode = false,
}) => {
  const [form] = Form.useForm();
  const [fileType, setFileType] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const isEditMode = !!initialValues;

  useEffect(() => {
    if (open && initialValues) {
      form.setFieldsValue({
        title: initialValues.title,
        type: initialValues.type,
        category: initialValues.category,
        access: initialValues.access,
      });
      setFileType(initialValues.type);

      // For view mode, automatically show file preview if available
      setPreviewFile(initialValues.file || null);
    }

    if (open && !initialValues) {
      form.resetFields();
      setFileType(null);
      setPreviewFile(null);
    }
  }, [open, initialValues, form]);

  const handleFileChange = ({ fileList }) => {
    if (fileList.length > 0) {
      const file = fileList[0].originFileObj;
      setPreviewFile(URL.createObjectURL(file));
    } else {
      setPreviewFile(null);
    }
  };

  const beforeUpload = (file) => {
    if (fileType === "PDF" && file.type !== "application/pdf") {
      message.error("Please upload a PDF file.");
      return Upload.LIST_IGNORE;
    }
    if (fileType === "Video" && !file.type.startsWith("video/")) {
      message.error("Please upload a video file.");
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
    };

    message.success(
      isEditMode
        ? "Content updated successfully!"
        : "Content uploaded successfully!"
    );

    onSubmit(payload);
    form.resetFields();
    setPreviewFile(null);
    setFileType(null);
  };

  return (
    <Modal
      title={
        viewMode
          ? "View Content"
          : isEditMode
          ? "Edit Content"
          : "Upload Content"
      }
      open={open}
      onCancel={onCancel}
      okText={viewMode ? "Close" : isEditMode ? "Update" : "Upload"}
      onOk={() => {
        if (!viewMode) form.submit();
        else onCancel();
      }}
      destroyOnClose
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter content title" }]}
        >
          <Input
            placeholder="Enter content title"
            readOnly={viewMode}
          />
        </Form.Item>

        <Form.Item
          label="Type"
          name="type"
          rules={[{ required: true, message: "Please select content type" }]}
        >
          <Select
            placeholder="Select content type"
            onChange={(value) => setFileType(value)}
            readOnly={viewMode}
          >
            <Option value="PDF">PDF</Option>
            <Option value="Video">Video</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Category"
          name="category"
          rules={[{ required: true, message: "Please select category" }]}
        >
          <Select placeholder="Select category" readOnly={viewMode}>
            <Option value="Study Material">Study Material</Option>
            <Option value="Tutorial">Tutorial</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Access"
          name="access"
          rules={[{ required: true, message: "Please select access type" }]}
        >
          <Select placeholder="Select access type" readOnly={viewMode}>
            <Option value="Free">Free</Option>
            <Option value="Paid">Paid</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Upload File"
          name="file"
          valuePropName="fileList"
          getValueFromEvent={(e) => e && e.fileList}
        >
          <Upload
            beforeUpload={beforeUpload}
            onChange={handleFileChange}
            maxCount={1}
            multiple={false}
            readOnly={viewMode}
            fileList={previewFile ? [{ name: "Preview", url: previewFile }] : []}
          >
            {!viewMode && <Button icon={<UploadOutlined />}>Select File</Button>}
          </Upload>
        </Form.Item>

        {/* Previews */}
        {previewFile && fileType === "Video" && (
          <div style={{ marginBottom: 16, textAlign: "center" }}>
            <Text strong style={{ marginBottom: 8, display: "block" }}>
              Video Preview:
            </Text>
            <video
              src={previewFile}
              controls
              style={{ width: "80%", maxWidth: 400, height: 200, borderRadius: 8 }}
            />
          </div>
        )}

        {previewFile && fileType === "PDF" && (
          <div style={{ marginBottom: 16, textAlign: "center" }}>
            <Text strong style={{ marginBottom: 8, display: "block" }}>
              PDF Preview:
            </Text>
            <iframe
              src={previewFile}
              title="PDF Preview"
              style={{
                width: "80%",
                maxWidth: 330,
                height: 200,
                borderRadius: 8,
                overflow: "hidden",
              }}
            />
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default UploadContentModal;
