import React from "react";
import { Modal, Typography, List, Divider, Button } from "antd";
import { InfoCircleOutlined, CheckCircleOutlined, GlobalOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const EngineeringInstructionsModal = ({ open, onClose }) => {
  const instructions = [
    "Read each question carefully before answering.",
    "All questions are mandatory.",
    "Provide honest and thoughtful answers.",
    "Do not refresh or close the window during the test.",
    "Ensure a stable internet connection.",
    "You can submit only once.",
    "Complete the questionnaire in one sitting.",
  ];

  return (
    <Modal
      title={<Title level={4}>Instructions</Title>}
      open={open}
      centered
      onCancel={onClose}
      footer={null}
      width={600}
    >
      {/* Instructions Section */}
      <Text type="colorTextSecondary">
        Please follow the instructions carefully before starting:
      </Text>

      <List
        style={{ marginTop: 16 }}
        dataSource={instructions}
        renderItem={(item, index) => (
          <List.Item key={index}>
            <Text>
              <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
              {item}
            </Text>
          </List.Item>
        )}
      />

      <Divider />

      {/* Contact / About Section */}
      <div
        style={{
          borderRadius: 12,
          background: "linear-gradient(135deg,#f0f5ff,#d6e4ff)",
          padding: "12px 16px",
          marginBottom: 16,
        }}
      >
        <Title level={5} style={{ marginBottom: 6 }}>
          <GlobalOutlined style={{ marginRight: 8 }} />
          About Abhinav Career Scope
        </Title>
        <Text>Career guidance company based in Bavdhan, Pune.</Text>

        <Divider style={{ margin: "10px 0" }} />

        <Text strong>📱 Contact:</Text> 9922695424 <br />
        <Text strong>📧 Email:</Text> abhinavcareerscope@gmail.com <br />
        <Text strong>🌐 Website:</Text> www.abhinavcareerscope.com
      </div>

      {/* Confirmation Button */}
      <div style={{ textAlign: "right", marginTop: 16 }}>
        <Button
          type="primary"
          size="large"
          onClick={onClose}
          style={{ borderRadius: 8 }}
        >
          OK, I Understand
        </Button>
      </div>
    </Modal>
  );
};

export default EngineeringInstructionsModal;