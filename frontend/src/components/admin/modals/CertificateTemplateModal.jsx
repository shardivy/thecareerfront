import React, { useState } from "react";
import { Modal, Card, Row, Col, Button, Typography } from "antd";

const { Title } = Typography;

const templates = [
  {
    id: 1,
    name: "Classic Certificate",
    preview: "/cert1.png",
  },
  {
    id: 2,
    name: "Modern Certificate",
    preview: "/cert2.png",
  },
  {
    id: 3,
    name: "Professional Certificate",
    preview: "/cert3.png",
  },
];

const CertificateTemplateModal = ({ open, onClose, onSelect }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  return (
    <Modal
      title="Select Certificate Template"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
    >
      <Row gutter={[16, 16]}>
        {templates.map((tpl) => (
          <Col xs={24} sm={12} md={8} key={tpl.id}>
            <Card
              hoverable
              onClick={() => setSelectedTemplate(tpl)}
              style={{
                border:
                  selectedTemplate?.id === tpl.id
                    ? "2px solid #1677ff"
                    : "1px solid #eee",
              }}
              cover={
                <img
                  alt={tpl.name}
                  src={tpl.preview}
                  style={{ height: 150, objectFit: "cover" }}
                />
              }
            >
              <Title level={5}>{tpl.name}</Title>

              <Button
                type={
                  selectedTemplate?.id === tpl.id
                    ? "primary"
                    : "default"
                }
                block
                onClick={() => onSelect(tpl)}
              >
                Select
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </Modal>
  );
};

export default CertificateTemplateModal;