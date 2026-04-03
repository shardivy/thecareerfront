import React, { useState } from "react";
import { Modal, Card, Row, Col, Space, Button, Tag, Select, Typography, message } from "antd";
import { TrophyOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Title } = Typography;

const GenerateCertificateModal = ({ open, onClose, templates, students }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const handleSubmit = () => {
    if (!selectedTemplate || selectedStudents.length === 0) {
      message.warning("Please select a template and at least one student");
      return;
    }

    console.log("Template:", selectedTemplate);
    console.log("Students:", selectedStudents);

    message.success(`Certificates issued to ${selectedStudents.length} student(s)`);
    onClose();
    setSelectedTemplate(null);
    setSelectedStudents([]);
  };

  return (
    <Modal
      title="Generate Certificates"
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>Generate</Button>
      ]}
    >
      <Title level={5}>Select Certificate Template</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {templates.map((template, index) => (
          <Col xs={24} md={12} key={index}>
            <Card
              hoverable
              onClick={() => setSelectedTemplate(template)}
              style={{
                borderRadius: 12,
                border: selectedTemplate?.id === template.id ? "2px solid #2563eb" : "1px solid #f0f0f0",
              }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Row justify="space-between">
                  <span style={{ fontWeight: 600 }}>{template.name}</span>
                  <Tag color="green">Active</Tag>
                </Row>
                <span style={{ color: "#888" }}>{template.description}</span>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Title level={5}>Select Students</Title>
      <Select
        mode="multiple"
        allowClear
        placeholder="Select students"
        style={{ width: "100%", marginBottom: 20 }}
        value={selectedStudents}
        onChange={setSelectedStudents}
      >
        {students.map((s) => (
          <Select.Option key={s.id} value={s.id}>
            {s.name} ({s.email})
          </Select.Option>
        ))}
      </Select>
    </Modal>
  );
};

export default GenerateCertificateModal;