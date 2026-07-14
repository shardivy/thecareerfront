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
  message,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  FormOutlined,
} from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";
import EngineeringQuestionnaireModal from "../modals/EngineeringQuestionnaireModal";
import EngineeringInstructionsModal from "../modals/EngineeringInstructionsModal";
import { useDispatch, useSelector } from "react-redux";
import { fetchQuestions } from "../../../adminSlices/questionSlice";
import { startCollegeAnalysis, fetchCollegeAnalysisStatus, fetchCollegeAnalysis } from "../../../adminSlices/collegeAnalysisSlice";

const { Title, Text } = Typography;

const EngineeringQuestionaries = () => {
  // const [status, setStatus] = useState("not_started");
  const [modalOpen, setModalOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  const { token } = theme.useToken();

  const dispatch = useDispatch();
  const { questions, loading } = useSelector((state) => state.questions);
  // const { status } = useSelector((state) => state.collegeAnalysis);
  const { status, draftAnswers } = useSelector((state) => state.collegeAnalysis);

  // STATUS FLAGS
  const isNotStarted = status === "not_started";
  const isInProgress = status === "in_progress";
  const isCompleted = status === "completed";

  const studentId = localStorage.getItem("studentId");
  const programId = localStorage.getItem("selectedProgramId");
  const packageId = localStorage.getItem("selectedPackageId");

  const draftKey =`${studentId}_${programId}_${packageId}`;
 const currentDraft = draftAnswers?.[draftKey] || {};

  useEffect(() => {
    dispatch(fetchQuestions());

    if (studentId && programId && packageId) {
      dispatch(
        fetchCollegeAnalysisStatus({
          studentId,
          programId,
          packageId,
        })
      );
    }
  }, [dispatch, studentId, programId, packageId]);

  // START
  const handleStart = () => {
    const studentId = localStorage.getItem("studentId");
    const programId = localStorage.getItem("selectedProgramId");
    const packageId = localStorage.getItem("selectedPackageId");

  dispatch(
  startCollegeAnalysis({
    studentId,
    programId,
    packageId,
  })
)
      .unwrap()
      .then((res) => {
        if (res.analysis_status === "completed") {
          message.info("Already completed");
          dispatch(
            fetchCollegeAnalysisStatus({
              studentId,
              programId,
              packageId,
            })
          );
          return;
        }

        setModalOpen(true);
        // message.success("Questionnaire started!");

        dispatch(fetchCollegeAnalysisStatus({ studentId, programId, packageId })); // ✅ correct
      })
      .catch((err) => {
        message.error(err?.message || "Failed to start questionnaire");
      });
  };

  const handleResume = () => {

    dispatch(fetchCollegeAnalysis({
      tab: "draft",
      studentId,
      programId,
      packageId,


    }))
      .unwrap()
      .then(() => {
        setModalOpen(true);
      })
      .catch(() => {
        message.error("Failed to load draft data");
      });
  };

  return (
    <ConfigProvider theme={adminTheme}>
      <div style={{ minHeight: "100vh" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Title level={2}>Engineering Questionnaires</Title>
          <Text type="colorTextSecondary">
            Answer curated questions to explore engineering career paths
          </Text>
        </div>

        {/* INSTRUCTIONS BUTTON */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
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
            onClick={() => setInstructionsOpen(true)}

          >
            Instructions
          </Button>
        </div>

        <Row gutter={[32, 32]} justify="center">

          {/* LEFT CARD */}
          <Col xs={24} md={16}>
            <Card style={{ borderRadius: 14, marginTop: 32 }}>
              <Title level={5}>
                <InfoCircleOutlined style={{ marginRight: 6 }} />
                Important Notice
              </Title>

              {isNotStarted && (
                <Text>
                  Please read all instructions carefully before starting the questionnaire.
                </Text>
              )}

              {isInProgress && (
                <Text>
                  Your questionnaire is in progress. Complete all questions.
                </Text>
              )}

              {isCompleted && (
                <Text>
                  You have successfully completed the questionnaire. Great job!
                </Text>
              )}

              <Divider />


              <Button type="primary" onClick={() => setInstructionsOpen(true)}>
                View Instructions
              </Button>


              {/* {isCompleted && (
                <Text type="colorTextSecondary">
                  Instructions are no longer available.
                </Text>
              )} */}
            </Card>
          </Col>

          {/* RIGHT CARD */}
          <Col xs={24} md={8}>
            <div style={{ position: "sticky", top: 100 }}>
              <Badge.Ribbon text="New" color="blue">
                <Card
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
                  }}
                >
                  <Title level={4}>
                    Questionnaire Details{" "}
                    <Tag
                      color={
                        isCompleted
                          ? "green"
                          : isInProgress
                            ? "orange"
                            : "blue"
                      }
                    >
                      {status.replace("_", " ").toUpperCase()}
                    </Tag>
                  </Title>

                  <Divider />

                  <List
                    size="small"
                    dataSource={[
                      {
                        icon: <FormOutlined />,
                        text: "Multiple engineering domains covered",
                      },
                      {
                        icon: <ClockCircleOutlined />,
                        text: "Duration: 30–45 Minutes",
                      },
                      {
                        icon: <InfoCircleOutlined />,
                        text: "Answer honestly",
                      },
                      {
                        icon: <CheckCircleOutlined />,
                        text: "All questions mandatory",
                      },
                    ]}
                    renderItem={(item, index) => (
                      <List.Item key={index}>
                        <Text>
                          <span style={{ marginRight: 8 }}>{item.icon}</span>
                          {item.text}
                        </Text>
                      </List.Item>
                    )}
                  />

                  <Divider />

                  {isNotStarted && (
                    <Button
                      type="primary"
                      size="large"
                      block
                      onClick={handleStart}
                      style={{ borderRadius: 10, height: 48 }}
                    >
                      Start Questionnaire
                    </Button>
                  )}

                  {isInProgress && (
                    <Button
                      type="primary"
                      size="large"
                      block
                      onClick={handleResume}
                      style={{ borderRadius: 10, height: 48 }}
                    >
                      Resume Questionnaire
                    </Button>
                  )}

                  {isCompleted && (
                    <Button block disabled style={{ borderRadius: 10, height: 48 }}>
                      ✅ Completed
                    </Button>
                  )}
                </Card>
              </Badge.Ribbon>
            </div>
          </Col>
        </Row>

        {/* INSTRUCTIONS MODAL */}
        <EngineeringInstructionsModal
          open={instructionsOpen}
          onClose={() => setInstructionsOpen(false)}
        />

        {/* QUESTION MODAL */}
        <EngineeringQuestionnaireModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          questions={questions}
          loading={loading}
          // draftAnswers={draftAnswers}
            draftAnswers={currentDraft}

          onSubmit={(answers) => {
            const studentId = localStorage.getItem("studentId");
            const programId = localStorage.getItem("selectedProgramId");
            const packageId = localStorage.getItem("selectedPackageId");

            // console.log("User Answers:", answers);

            setModalOpen(false);

            // ✅ 1. Refresh status
            dispatch(
              fetchCollegeAnalysisStatus({
                studentId,
                programId,
                packageId,
              })
            );

            // ✅ 2. CALL YOUR GET API HERE
            dispatch(fetchCollegeAnalysis());

            message.success("Submitted Successfully!");
          }}
        />
      </div>
    </ConfigProvider>
  );
};

export default EngineeringQuestionaries;