import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Upload,
  Button,
  message,
  Slider,
  InputNumber,
  Row,
  Col,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import {
  createCertificateTemplate,
  getCertificateTemplates,
} from "../../../hhSlices/certificateSlice";

const UploadCertificateTemplateModal = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const [fileList, setFileList] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [namePos, setNamePos] = useState({ x: 100, y: 100 });
  const [datePos, setDatePos] = useState({ x: 100, y: 200 });

  const handleUploadChange = ({ fileList }) => {
    setFileList(fileList);

    if (fileList.length > 0) {
      const file = fileList[0].originFileObj;
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!fileList.length) {
        message.error("Please upload template file");
        return;
      }

      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("template_file", fileList[0].originFileObj);

      formData.append("name_x", namePos.x);
      formData.append("name_y", namePos.y);
      formData.append("date_x", datePos.x);
      formData.append("date_y", datePos.y);

      formData.append("name_font_size", 40);
      formData.append("date_font_size", 30);
      formData.append("text_color", "0,0,0");

      await dispatch(createCertificateTemplate(formData)).unwrap();

      message.success("Template uploaded successfully");

      dispatch(getCertificateTemplates());

      form.resetFields();
      setFileList([]);
      setPreviewUrl(null);
      onClose();

    } catch (err) {
      message.error(err?.message || "Upload failed");
    }
  };

  return (
    <Modal
      title="Upload Certificate Template"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      width={700}
      centered
    >
      <Form layout="vertical" form={form}>
        {/* TEMPLATE NAME */}
        <Form.Item
          label="Template Name"
          name="name"
          rules={[{ required: true, message: "Enter template name" }]}
        >
          <Input placeholder="Enter template name" />
        </Form.Item>

        {/* FILE UPLOAD */}
        <Form.Item label="Upload Template" required>
          <Upload
            beforeUpload={() => false}
            fileList={fileList}
            onChange={handleUploadChange}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Select File</Button>
          </Upload>
        </Form.Item>

        {/* 🎯 POSITION CONTROLS */}
        {previewUrl && (
          <>
            <h3>Adjust Name Position</h3>
            <Row gutter={10}>
              <Col span={12}>
                X:
                <Slider
                  min={0}
                  max={800}
                  value={namePos.x}
                  onChange={(val) =>
                    setNamePos((prev) => ({ ...prev, x: val }))
                  }
                />
              </Col>
              <Col span={12}>
                <InputNumber
                  min={0}
                  max={800}
                  value={namePos.x}
                  onChange={(val) =>
                    setNamePos((prev) => ({ ...prev, x: val }))
                  }
                  style={{ width: "100%" }}
                />
              </Col>
            </Row>

            <Row gutter={10}>
              <Col span={12}>
                Y:
                <Slider
                  min={0}
                  max={600}
                  value={namePos.y}
                  onChange={(val) =>
                    setNamePos((prev) => ({ ...prev, y: val }))
                  }
                />
              </Col>
              <Col span={12}>
                <InputNumber
                  min={0}
                  max={600}
                  value={namePos.y}
                  onChange={(val) =>
                    setNamePos((prev) => ({ ...prev, y: val }))
                  }
                  style={{ width: "100%" }}
                />
              </Col>
            </Row>

            <h3 style={{ marginTop: 20 }}>Adjust Date Position</h3>

            <Row gutter={10}>
              <Col span={12}>
                X:
                <Slider
                  min={0}
                  max={800}
                  value={datePos.x}
                  onChange={(val) =>
                    setDatePos((prev) => ({ ...prev, x: val }))
                  }
                />
              </Col>
              <Col span={12}>
                <InputNumber
                  min={0}
                  max={800}
                  value={datePos.x}
                  onChange={(val) =>
                    setDatePos((prev) => ({ ...prev, x: val }))
                  }
                  style={{ width: "100%" }}
                />
              </Col>
            </Row>

            <Row gutter={10}>
              <Col span={12}>
                Y:
                <Slider
                  min={0}
                  max={600}
                  value={datePos.y}
                  onChange={(val) =>
                    setDatePos((prev) => ({ ...prev, y: val }))
                  }
                />
              </Col>
              <Col span={12}>
                <InputNumber
                  min={0}
                  max={600}
                  value={datePos.y}
                  onChange={(val) =>
                    setDatePos((prev) => ({ ...prev, y: val }))
                  }
                  style={{ width: "100%" }}
                />
              </Col>
            </Row>

            {/* 🔥 LIVE PREVIEW */}
            <div
              style={{
                position: "relative",
                marginTop: 20,
                border: "1px solid #ddd",
              }}
            >
              <img src={previewUrl} style={{ width: "100%" }} />

              <div
                style={{
                  position: "absolute",
                  left: namePos.x,
                  top: namePos.y,
                  fontWeight: "bold",
                  background: "rgba(255,255,255,0.6)",
                  padding: "2px 6px",
                }}
              >
                John Doe
              </div>

              <div
                style={{
                  position: "absolute",
                  left: datePos.x,
                  top: datePos.y,
                  background: "rgba(255,255,255,0.6)",
                  padding: "2px 6px",
                }}
              >
                01 Jan 2026
              </div>
            </div>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default UploadCertificateTemplateModal;