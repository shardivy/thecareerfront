import React from "react";
import {
  Modal,
  Typography,
  List,
  Button,
  Divider,
  Card,
  Row,
  Col,
  Tag,
  theme,
} from "antd";
import {
  SafetyOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  LockOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { useToken } = theme;

const InstructionsModal = ({ open, onClose }) => {
  const { token } = useToken();

  return (
    <Modal
      title="Detailed Exam Instructions"
      open={open}
      onCancel={onClose}
      width={750}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="start"
          type="primary"
          onClick={() => {
            console.log("Start Exam after reading instructions");
            onClose();
          }}
        >
         OK, I Understand
        </Button>,
      ]}
    >
      <div style={{ padding: "10px 0 20px 0" }}>
        {/* IMPORTANT INSTRUCTIONS CARD */}
        <Card
          style={{
            borderRadius: 14,
            background: "#ffffff",
            marginBottom: 24,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <Title level={5}>
            <SafetyOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
            Important Instructions
          </Title>

          <List
            size="small"
            dataSource={[
              "Exam duration: 60 minutes",
              "Total questions: 100 (Multiple Choice)",
              "You can save and resume within 24 hours",
              "Once submitted, you cannot retake the exam",
              "Results will be available after admin approval",
            ]}
            renderItem={(item) => (
              <List.Item>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 14 }} />
                  <Text style={{ fontSize: 14 }}>{item}</Text>
                </div>
              </List.Item>
            )}
          />
        </Card>

        {/* EXAM GUIDELINES */}
        <Title level={4} style={{ marginBottom: 20, color: token.colorPrimary }}>
          <SafetyOutlined style={{ marginRight: 8 }} />
          Exam Guidelines
        </Title>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={8}>
            <Card
              title="Technical Requirements"
              size="small"
              style={{ height: "100%" }}
            >
              <List
                size="small"
                dataSource={[
                  "Stable internet connection (minimum 2 Mbps)",
                  "Updated web browser (Chrome/Firefox)",
                  "Enable JavaScript and cookies",
                  "Do not refresh or close browser",
                ]}
                renderItem={(item) => (
                  <List.Item style={{ padding: "6px 0" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <CheckCircleOutlined 
                        style={{ 
                          color: token.colorSuccess, 
                          fontSize: 12, 
                          marginTop: 4 
                        }} 
                      />
                      <Text style={{ fontSize: 13 }}>{item}</Text>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              title="Exam Rules"
              size="small"
              style={{ height: "100%" }}
            >
              <List
                size="small"
                dataSource={[
                  "No external help allowed",
                  "No switching between tabs/windows",
                  "Timer continues if browser closed",
                  "One attempt per question",
                ]}
                renderItem={(item) => (
                  <List.Item style={{ padding: "6px 0" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <CheckCircleOutlined 
                        style={{ 
                          color: token.colorSuccess, 
                          fontSize: 12, 
                          marginTop: 4 
                        }} 
                      />
                      <Text style={{ fontSize: 13 }}>{item}</Text>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              title="Submission Process"
              size="small"
              style={{ height: "100%" }}
            >
              <List
                size="small"
                dataSource={[
                  "Review answers before submission",
                  "Click 'Submit' to complete exam",
                  "Results in 24-48 hours",
                  "Contact support for issues",
                ]}
                renderItem={(item) => (
                  <List.Item style={{ padding: "6px 0" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <CheckCircleOutlined 
                        style={{ 
                          color: token.colorSuccess, 
                          fontSize: 12, 
                          marginTop: 4 
                        }} 
                      />
                      <Text style={{ fontSize: 13 }}>{item}</Text>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        {/* EXAM SECTIONS */}
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <AppstoreOutlined />
            Exam Sections Overview
          </Title>
          
          <Row gutter={[12, 12]}>
            {[
              { title: "Aptitude & Reasoning", meta: "30 questions • 20 minutes", color: "blue" },
              { title: "Interest & Personality", meta: "40 questions • 25 minutes", color: "green" },
              { title: "Subject Preference", meta: "20 questions • 10 minutes", color: "purple" },
              { title: "Career Values", meta: "10 questions • 5 minutes", color: "orange" },
            ].map((section, index) => (
              <Col xs={24} sm={12} key={index}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 8,
                  }}
                  bodyStyle={{ padding: "12px" }}
                >
                  <Text strong style={{ display: "block", marginBottom: 4, fontSize: 14 }}>
                    {section.title}
                  </Text>
                  <Tag color={section.color}>{section.meta}</Tag>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* BEFORE YOU BEGIN */}
        <Card
          style={{
            borderRadius: 14,
            marginBottom: 24,
            background: "#fafafa",
          }}
        >
          <Title level={5} style={{ marginBottom: 12 }}>
            <InfoCircleOutlined style={{ color: token.colorPrimary, marginRight: 6 }} />
            Before You Begin
          </Title>

          <List
            size="small"
            dataSource={[
              "Stable internet connection required",
              "Find a quiet place without distractions",
              "Have a pen and paper for rough work (optional)",
            ]}
            renderItem={(item) => (
              <List.Item>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircleOutlined style={{ color: token.colorSuccess }} />
                  <Text style={{ fontSize: 14 }}>{item}</Text>
                </div>
              </List.Item>
            )}
          />
        </Card>

        {/* IMPORTANT NOTES */}
        <Card
          type="inner"
          title="Important Notes"
          style={{ 
            backgroundColor: "#f6ffed", 
            borderColor: "#b7eb8f",
            marginBottom: 16 
          }}
        >
          <List
            size="small"
            dataSource={[
              "Save your progress every 10 questions",
              "Network issues pause timer (max 5 minutes)",
              "Use 'Flag for Review' for uncertain questions",
              "Results include detailed career recommendations",
            ]}
            renderItem={(item) => (
              <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <InfoCircleOutlined style={{ color: token.colorWarning }} />
                  <Text style={{ fontSize: 13 }}>{item}</Text>
                </div>
              </List.Item>
            )}
          />
        </Card>

        {/* PAYMENT STATUS */}
        <Card
          style={{
            borderRadius: 14,
            marginTop: 16,
            marginBottom: 16,
            background: "linear-gradient(90deg,#fff7e6,#fff1b8)",
          }}
        >
          <Title level={5} style={{ marginBottom: 8 }}>
            <LockOutlined style={{ marginRight: 8, color: token.colorWarning }} />
            Payment Status
          </Title>
          <Text strong>
            This exam is included in your <Tag color="gold">Premium Package</Tag>
          </Text>
        </Card>

        {/* FINAL REMINDER */}
        <div style={{ backgroundColor: "#f0f5ff", padding: 16, borderRadius: 8, marginTop: 16 }}>
          <Title level={5} style={{ color: token.colorPrimary, marginBottom: 8 }}>
            ⚠️ Important Reminder
          </Title>
          <Text style={{ fontSize: 14 }}>
            Once you start the exam, the timer will begin immediately. Make sure you're ready 
            and won't be interrupted for the next 60 minutes. You cannot pause the exam once started.
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default InstructionsModal;