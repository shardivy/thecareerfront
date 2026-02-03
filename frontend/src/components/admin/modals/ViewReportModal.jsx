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
} from "antd";
import {
  DownloadOutlined,
  UploadOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";
import dayjs from "dayjs";


const { Title } = Typography;
const { Option } = Select;
const { token } = adminTheme;

const ViewReportModal = ({ open, onCancel, data, mode }) => {
  const [form] = Form.useForm();
  const [previewUrl, setPreviewUrl] = useState("");

  const isEditMode = mode === "edit";
  const isViewMode = mode === "view";
  const isBulkMode = mode === "bulkUpload";

  const labelStyle = {
    fontSize: token.fontSize,
    color: token.colorTextSecondary,
    fontFamily: token.fontFamily,
  };

useEffect(() => {
  if (data && !isBulkMode) {
    const formValues = {
      ...data,
      uploadedDate:
        data.uploadedDate && data.uploadedDate !== "-"
          ? isEditMode
            ? dayjs(data.uploadedDate) // for DatePicker in edit mode
            : dayjs(data.uploadedDate).format("YYYY-MM-DD") // for Input in view mode
          : null,
    };
    form.setFieldsValue(formValues);

    if (data.pdfUrl) setPreviewUrl(data.pdfUrl);
  }
}, [data, form, isBulkMode, isEditMode]);


  const handleUpload = (file) => {
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
    return false;
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = "Report.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  

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
      {/* ================= FORM SECTION ================= */}
      {!isBulkMode && (
        <Form
          form={form}
          layout="vertical"
          style={{ rowGap: 4 }}
        >
          <Row gutter={[16, 12]}>
            <Col xs={24}>
              <Form.Item
                label="Student Name"
                name="name"
                style={{ marginBottom: 8 }}
                labelCol={{ span: 24 }}
              >
                <Input
                  readOnly={!isEditMode}
                  style={{
                    marginTop: 4,
                    height: 36,
                    borderRadius: token.borderRadius,
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Program"
                name="program"
                style={{ marginBottom: 8 }}
              >
                <Input
                  readOnly={!isEditMode}
                  style={{
                    marginTop: 4,
                    height: 36,
                    borderRadius: token.borderRadius,
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Status"
                name="status"
                style={{ marginBottom: 8 }}
              >
                {isEditMode ? (
                  <Select
                    style={{
                      marginTop: 4,
                      height: 36,
                      borderRadius: token.borderRadius,
                    }}
                  >
                    <Option value="Unlocked">Unlocked</Option>
                    <Option value="Locked">Locked</Option>
                    <Option value="Pending Upload">Pending Upload</Option>
                  </Select>
                ) : (
                  <Input
                    readOnly
                    style={{
                      marginTop: 4,
                      height: 36,
                      borderRadius: token.borderRadius,
                    }}
                  />
                )}
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Payment Status"
                name="paymentStatus"
                style={{ marginBottom: 8 }}
              >
                {isEditMode ? (
                  <Select
                    style={{
                      marginTop: 4,
                      height: 36,
                      borderRadius: token.borderRadius,
                    }}
                  >
                    <Option value="Fully Paid">Fully Paid</Option>
                    <Option value="Partial Paid">Partial Paid</Option>
                    <Option value="Pending">Pending</Option>
                  </Select>
                ) : (
                  <Input
                    readOnly
                    style={{
                      marginTop: 4,
                      height: 36,
                      borderRadius: token.borderRadius,
                    }}
                  />
                )}
              </Form.Item>
            </Col>

<Col xs={24} md={12}>
  <Form.Item
    label="Uploaded Date"
    name="uploadedDate"
    style={{ marginBottom: 8 }}
  >
    {isEditMode ? (
      <DatePicker
        style={{
          width: "100%",
          marginTop: 4,
          height: 36,
          borderRadius: token.borderRadius,
        }}
        format="YYYY-MM-DD"
      />
    ) : (
      <Input
        readOnly
        style={{
          marginTop: 4,
          height: 36,
          borderRadius: token.borderRadius,
        }}
      />
    )}
  </Form.Item>
</Col>



            <Col xs={24} md={12}>
              <Form.Item
                label="Exam Status"
                name="examStatus"
                style={{ marginBottom: 8 }}
              >
                <Input
                  readOnly
                  style={{
                    marginTop: 4,
                    height: 36,
                    borderRadius: token.borderRadius,
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )}

      <br />

      {/* ================= UPLOAD / PREVIEW LABEL OUTSIDE ================= */}
      <div style={{ marginBottom: 16 }}>
        <Title style={labelStyle} level={5}>
          <FilePdfOutlined />{" "}
          {isBulkMode
            ? "Upload Reports"
            : isEditMode
            ? "Upload Report"
            : "Uploaded Report"}
        </Title>
      </div>

      {/* ================= UPLOAD / PREVIEW SECTION ================= */}
      <div
        style={{
          border: `1px solid ${token.colorBorder}`,
          borderRadius: token.borderRadius,
          padding: 20,
          backgroundColor: token.colorBgContainer,
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          {/* PDF Preview */}
          <Col
            xs={24}
            md={isBulkMode ? 24 : 16}
            style={{ display: "flex", justifyContent: "center" }}
          >
            {previewUrl ? (
              <iframe
                src={previewUrl}
                title="PDF Preview"
                style={{
                  width: "100%",
                  maxWidth: 360,
                  height: 220,
                  borderRadius: token.borderRadius,
                  border: `1px solid ${token.colorBorder}`,
                  background: token.colorBgElevated,
                }}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Empty description="No receipt / screenshot uploaded yet" />
              </div>
            )}
          </Col>

          {/* ACTION BUTTONS */}
          <Col xs={24} md={isBulkMode ? 24 : 8}>
            {(isEditMode || isBulkMode) && (
              <Upload
                showUploadList={false}
                beforeUpload={handleUpload}
                multiple={isBulkMode}
              >
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  block
                  style={{
                    height: 48,
                    backgroundColor: token.colorPrimary,
                    borderRadius: token.borderRadius,
                  }}
                >
                  {isBulkMode ? "Upload Selected Reports" : "Upload Report"}
                </Button>
              </Upload>
            )}

            {isViewMode && previewUrl && (
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                block
                style={{
                  height: 48,
                  marginTop: 16,
                  backgroundColor: token.colorPrimary,
                  borderRadius: token.borderRadius,
                }}
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
            <Button
              type="primary"
              onClick={() => {
                console.log("Updated Values:", form.getFieldsValue());
                onCancel();
              }}
              style={{
                backgroundColor: token.colorPrimary,
                borderRadius: token.borderRadius,
              }}
            >
              Save Changes
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ViewReportModal;
