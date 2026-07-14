import React, { useState, useEffect } from "react";
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
  message
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  LaptopOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import adminTheme from "../../../theme/adminTheme";
import StatusTrackingModal from "../modals/StatusTrackingModal";
import InstructionsModal from "../modals/InstructionsModal";
import { useDispatch, useSelector } from "react-redux";
import {
  sendExamForApproval,
  fetchExamStatus
} from "../../../adminSlices/examSlice";

const { Title, Text } = Typography;

const ExamManagement = () => {
  const navigate = useNavigate();
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [instructionsModalVisible, setInstructionsModalVisible] = useState(false);
  const [instructionsMode, setInstructionsMode] = useState("view");
  const [examStatus, setExamStatus] = useState("not_started");
  const [onInstructionsConfirm, setOnInstructionsConfirm] = useState(null);

  const { tracker } = useSelector((state) => state.exam);
  const dispatch = useDispatch();
  const studentId = localStorage.getItem("studentId");
  const reduxProgramId = useSelector(
    (state) => state.student?.selectedProgramId
  );

  const reduxPackageId = useSelector(
    (state) => state.student?.selectedPackageId
  );

  const { profile } = useSelector((state) => state.profile);

  // Fallback to localStorage
  const selectedProgramId =
    reduxProgramId || localStorage.getItem("selectedProgramId");

  const selectedPackageId =
    reduxPackageId || localStorage.getItem("selectedPackageId");


  useEffect(() => {
    if (studentId && selectedProgramId && selectedPackageId) {
      dispatch(
        fetchExamStatus({
          studentId,
          programId: selectedProgramId,
          packageId: selectedPackageId,
        })
      );
    }
  }, [
    dispatch,
    studentId,
    selectedProgramId,
    selectedPackageId,
  ]);

  useEffect(() => {
    if (tracker?.status) {
      setExamStatus(tracker.status);
    }
  }, [tracker]);

  // START EXAM
  // Note: the startExam API call no longer happens here. It now fires when
  // the student clicks "Begin Test" on the registration page. Here we just
  // route them to that page (prefilled with whatever profile data we have).
  const handleStartExam = () => {
    setInstructionsMode("start");

    setOnInstructionsConfirm(() => () => {
      navigate("/student/exam-register", {
        state: {
          // first_name: profile?.first_name,
          first_name: profile?.first_name?.split("-").pop().trim(),
          last_name: profile?.last_name,
          email: profile?.email,
          phone: profile?.phone,
          password: profile?.password,
          qualification: profile?.study_class,
        },
      });
    });

    setInstructionsModalVisible(true);
  };

  // MARK COMPLETED
  const handleMarkCompleted = async () => {
    try {
      await dispatch(sendExamForApproval(studentId)).unwrap();
      setExamStatus("pending_approval");
      message.success("Exam sent for admin approval!");
    } catch (error) {
      message.error("Failed to send for approval");
    }
  };

  const { token } = theme.useToken();

  // STATUS CONDITIONS
  const showStartButton = examStatus === "not_started";

  const isInProgress = examStatus === "in_progress";
  const isPendingApproval = examStatus === "pending_approval";
  const isCompleted = examStatus === "completed";
  // 🔒 Lock UI when completed
  const isExamLocked = isCompleted || isInProgress || isPendingApproval;

  return (
    <ConfigProvider theme={adminTheme}>
      <div style={{ minHeight: "100vh" }}>
        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Title level={2}>Career Assessment Test</Title>
          <Text type="colorTextSecondary">
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
            onClick={() => {
              setInstructionsMode("view");
              setInstructionsModalVisible(true);
            }}
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
          {/* LEFT CARD */}
          <Col xs={24} md={16}>
            <Card
              style={{
                borderRadius: 14,
                marginTop: 32,
                opacity: isExamLocked ? 0.6 : 1,
                pointerEvents: isExamLocked ? "none" : "auto",
              }}
            >
              <Title level={5}>
                <InfoCircleOutlined style={{ marginRight: 6 }} />
                Important Notice
              </Title>

              {!isInProgress && !isPendingApproval && !isCompleted && (
                <Text>
                  Please read the complete instructions before starting the exam.
                  Ensure you are using a laptop/desktop and have a stable internet
                  connection.
                </Text>
              )}

              {isInProgress && (
                <Text>
                  Your exam is currently in progress. Once you have completed the exam,
                  please click the <b>"Mark as Completed"</b> button to submit it for
                  admin approval.
                </Text>
              )}

              {isPendingApproval && (
                <Text>
                  Your exam has been submitted successfully and is currently
                  waiting for admin approval. You will be notified once the
                  approval is completed.
                </Text>
              )}

              <Divider style={{ margin: "12px 0" }} />

              {isCompleted && (
                <Text
                  type="colorTextSecondary"
                  style={{ display: "block", marginTop: 8 }}
                >
                  You have successfully completed the Exam. Great job!
                </Text>
              )}
            </Card>

            <Divider style={{ margin: "12px 0" }} />

            {tracker?.description && (
              <div
                style={{
                  marginTop: 16,
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #f6ffed, #ffffff)",
                  border: "1px solid #b7eb8f",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                  <CheckCircleOutlined
                    style={{
                      color: "#52c41a",
                      fontSize: 18,
                      marginRight: 8,
                    }}
                  />
                  <Text strong style={{ fontSize: 14 }}>
                    Admin Feedback
                  </Text>
                </div>

                {/* Comment */}
                <Text
                  style={{
                    display: "block",
                    fontSize: 14,
                    color: "#262626",
                    lineHeight: "1.6",
                  }}
                >
                  {tracker.description}
                </Text>
              </div>
            )}
          </Col>

          {/* RIGHT SIDE CARD */}
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
                        isCompleted
                          ? "green"
                          : isPendingApproval
                            ? "purple"
                            : isInProgress
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
                        icon: <LaptopOutlined />,
                        text: "Use Laptop/Desktop only",
                      },
                      {
                        icon: <ClockCircleOutlined />,
                        text: "Exam Window: 11:00 AM – 6:00 PM",
                      },
                      {
                        icon: <InfoCircleOutlined />,
                        text: "Approx. Duration: 2 Hours",
                      },
                      {
                        icon: <CheckCircleOutlined />,
                        text: "Complete all sections before submission",
                      },
                    ]}
                    renderItem={(item, index) => (
                      <List.Item key={index}>
                        <Text>
                          <span style={{ marginRight: 8 }}>
                            {item.icon}
                          </span>
                          {item.text}
                        </Text>
                      </List.Item>
                    )}
                  />

                  <Divider />

                  {showStartButton && (
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

                  {isInProgress && (
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

                      {/* New Text Link */}
                      <Text
                        style={{
                          display: "block",
                          marginTop: 10,
                          fontSize: 13,
                          textAlign: "center",
                        }}
                      >
                        Visit the site to know more:{" "}
                        <a
                          href="https://abhinavcareerscope.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontWeight: 600 }}
                        >
                          Click Here
                        </a>
                      </Text>
                    </>
                  )}

                  {isPendingApproval && (
                    <Button
                      block
                      disabled
                      style={{
                        borderRadius: 10,
                        height: 48,
                        background: "#f9f0ff",
                        borderColor: "#d3adf7",
                        color: "#722ed1",
                        fontWeight: 600,
                      }}
                    >
                      ⏳ Waiting for Admin Approval
                    </Button>
                  )}

                  {isCompleted && (
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
                </Card>
              </Badge.Ribbon>
            </div>
          </Col>
        </Row>
      </div>

      <InstructionsModal
        open={instructionsModalVisible}
        onClose={() => setInstructionsModalVisible(false)}
        onConfirm={() => {
          setInstructionsModalVisible(false);
          if (onInstructionsConfirm) onInstructionsConfirm();
        }}
        showStartTestButton={instructionsMode === "start"}
      />

      <StatusTrackingModal
        open={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
      />
    </ConfigProvider>
  );
};

export default ExamManagement;