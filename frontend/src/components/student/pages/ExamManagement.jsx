import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  List,
  Button,
  Divider,
  Tag,
  Badge,
  ConfigProvider,
  theme,
} from "antd";
import {
  ClockCircleOutlined,
  FileTextOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  LockOutlined,
  AppstoreOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";
import StatusTrackingModal from "../modals/StatusTrackingModal";
import InstructionsModal from "../modals/InstructionsModal";

const { Title, Text } = Typography;

const ExamManagement = () => {
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [instructionsModalVisible, setInstructionsModalVisible] =
    useState(false);

  // exam status state
  const [examStatus, setExamStatus] = useState("not_started");
  // not_started | in_progress | completed

  const { useToken } = theme;

  const handleStartExam = () => {
    window.open("https://external-exam-platform.com", "_blank");
    setExamStatus("in_progress");
  };

  const handleMarkCompleted = () => {
    setExamStatus("completed");
  };

  const PageContent = () => {
    const { token } = useToken();

    return (
      <div style={{ minHeight: "100vh" }}>
        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Title level={2} style={{ marginBottom: 6 }}>
            Career Assessment Test
          </Title>
          <Text type="colorTextSecondary" style={{ fontSize: 15 }}>
            Discover your strengths, interests, and ideal career path
          </Text>
        </div>

        {/* ACTION BUTTONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <Button
            size="large"
            icon={<QuestionCircleOutlined />}
            style={{
              borderRadius: 8,
              backgroundColor: token.colorPrimary,
              color: "#fff",
              fontWeight: 600,
              border: "none",
            }}
            onClick={() => setInstructionsModalVisible(true)}
          >
            Instructions
          </Button>

          <Button
            size="large"
            style={{
              borderRadius: 8,
              backgroundColor: token.colorSuccess,
              color: "#fff",
              fontWeight: 600,
              border: "none",
            }}
            onClick={() => setStatusModalVisible(true)}
          >
            Track Status
          </Button>
        </div>

        <Row gutter={[32, 32]} justify="center">
          {/* LEFT COLUMN */}
          <Col xs={24} md={16}>
            <Title level={5} style={{ marginBottom: 18 }}>
              <AppstoreOutlined /> Exam Sections
            </Title>

            <Row gutter={[20, 20]}>
              {[
                { title: "Aptitude & Reasoning", meta: "30 questions • 20 minutes" },
                {
                  title: "Interest & Personality",
                  meta: "40 questions • 25 minutes",
                },
                {
                  title: "Subject Preference",
                  meta: "20 questions • 10 minutes",
                },
                { title: "Career Values", meta: "10 questions • 5 minutes" },
              ].map((section, index) => (
                <Col xs={24} md={12} key={index}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: 14,
                      boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                    }}
                  >
                    <Title level={5} style={{ marginBottom: 6 }}>
                      {section.title}
                    </Title>
                    <Tag color="blue">{section.meta}</Tag>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* BEFORE YOU BEGIN */}
            <Card
              style={{
                borderRadius: 14,
                marginTop: 32,
                boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
              }}
            >
              <Title level={5}>
                <InfoCircleOutlined
                  style={{ color: token.colorPrimary, marginRight: 6 }}
                />
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
                    <CheckCircleOutlined
                      style={{ color: token.colorSuccess, marginRight: 6 }}
                    />
                    <Text>{item}</Text>
                  </List.Item>
                )}
              />
            </Card>

            {/* PAYMENT STATUS */}
            <Card
              style={{
                borderRadius: 14,
                marginTop: 32,
                background: "linear-gradient(90deg,#fff7e6,#fff1b8)",
                border: "1px solid #faad14",
              }}
            >
              <Title level={5}>
                <LockOutlined /> Payment Status
              </Title>
              <Text strong>
                Included in <Tag color="gold">Premium Package</Tag>
              </Text>
            </Card>
          </Col>

          {/* RIGHT COLUMN */}
          <Col xs={24} md={8}>
            <div style={{ position: "sticky", top: 100 }}>
              <Badge.Ribbon text="Recommended" color="blue">
                <Card
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
                  }}
                >
                  <Title level={4}>
                    Exam Details{" "}
                    <Tag
                      color={
                        examStatus === "completed"
                          ? "green"
                          : examStatus === "in_progress"
                          ? "orange"
                          : "blue"
                      }
                    >
                      {examStatus.replace("_", " ").toUpperCase()}
                    </Tag>
                  </Title>

                  <Divider />

                  <List
                    size="small"
                    dataSource={[
                      {
                        icon: <ClockCircleOutlined />,
                        label: "Duration",
                        value: "60 Minutes",
                      },
                      {
                        icon: <FileTextOutlined />,
                        label: "Questions",
                        value: "100 MCQs",
                      },
                      {
                        icon: <SafetyOutlined />,
                        label: "Marking",
                        value: "No Negative Marking",
                      },
                    ]}
                    renderItem={(item) => (
                      <List.Item>
                        <Text strong>
                          {item.icon} {item.label}:
                        </Text>
                        <Text style={{ marginLeft: 6 }}>{item.value}</Text>
                      </List.Item>
                    )}
                  />

                  <Divider />

                  {/* BUTTON STATES */}
                  {examStatus === "not_started" && (
                    <Button
                      type="primary"
                      size="large"
                      block
                      style={{ borderRadius: 10, height: 48 }}
                      onClick={handleStartExam}
                    >
                      Start Exam
                    </Button>
                  )}

                  {examStatus === "in_progress" && (
                    <>
                      <Button
                        block
                        disabled
                        style={{
                          borderRadius: 10,
                          height: 48,
                          background: "#fff7e6",
                          borderColor: "#faad14",
                          color: "#fa8c16",
                          fontWeight: 600,
                        }}
                      >
                        Exam In Progress
                      </Button>

                      <Text
                        type="colorTextSecondary"
                        style={{
                          display: "block",
                          marginTop: 12,
                          fontSize: 13,
                          textAlign: "center",
                        }}
                      >
                        Complete the exam on the external platform.
                        <br />
                        Click below after final submission.
                      </Text>

                      <Button
                        type="primary"
                        block
                        style={{
                          marginTop: 12,
                          background: "#52c41a",
                          borderColor: "#52c41a",
                        }}
                        onClick={handleMarkCompleted}
                      >
                        Mark as Completed
                      </Button>
                    </>
                  )}

                  {examStatus === "completed" && (
                    <Button
                      block
                      disabled
                      style={{
                        borderRadius: 10,
                        height: 48,
                        background: "#f6ffed",
                        borderColor: "#b7eb8f",
                        color: "#389e0d",
                        fontWeight: 600,
                      }}
                    >
                      ✅ Exam Completed
                    </Button>
                  )}

                  <Text
                    type="colorTextSecondary"
                    style={{
                      display: "block",
                      textAlign: "center",
                      marginTop: 10,
                      fontSize: 12,
                    }}
                  >
                    External assessment platform
                  </Text>
                </Card>
              </Badge.Ribbon>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <ConfigProvider theme={adminTheme}>
      <PageContent />

      <InstructionsModal
        open={instructionsModalVisible}
        onClose={() => setInstructionsModalVisible(false)}
      />

      <StatusTrackingModal
        open={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
      />
    </ConfigProvider>
  );
};

export default ExamManagement;