import React, { useState, useEffect } from "react";
import {
  Modal,
  Typography,
  Input,
  Button,
  Space,
  Card,
  message,
  Row,
  Col,
} from "antd";
import { useDispatch } from "react-redux";
import { submitAnswers, fetchCollegeAnalysis, fetchCollegeAnalysisStatus } from "../../../adminSlices/collegeAnalysisSlice";

const { Title, Text } = Typography;
const { TextArea } = Input;

const QUESTIONS_PER_PAGE = 5;

const EngineeringQuestionnaireModal = ({
  open,
  onClose,
  onSubmit,
  questions = [],
  draftAnswers = {},
}) => {
  const [answers, setAnswers] = useState({});
  const [page, setPage] = useState(0);

  const dispatch = useDispatch();

  const handleChange = (id, value) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Pagination Logic
  const startIndex = page * QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(
    startIndex,
    startIndex + QUESTIONS_PER_PAGE
  );
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);

  // ✅ Free navigation: no required answers
  const nextPage = () => setPage(page + 1);
  const prevPage = () => setPage(page - 1);

  // ✅ Submit allows empty answers
  const handleSubmit = () => {
    const formattedAnswers = questions.map((q) => ({
      question_id: q.id,
      answer_text: answers[q.id] || "",
    }));

    const payload = {
      student_id: localStorage.getItem("studentId"),
      program_id: localStorage.getItem("selectedProgramId"),
      package_id: localStorage.getItem("selectedPackageId"),
      answers: formattedAnswers,
      is_final_submit: true,
    };

   dispatch(submitAnswers(payload))
  .unwrap()
  .then(() => {

    dispatch(
      fetchCollegeAnalysisStatus({
        studentId: payload.student_id,
        programId: payload.program_id,
        packageId: payload.package_id,
      })
    );

  dispatch(
  fetchCollegeAnalysis({
    studentId: payload.student_id,
    programId: payload.program_id,
    packageId: payload.package_id,
  })
);

    onSubmit && onSubmit(answers);
    onClose();

    setPage(0);
    setAnswers({});
  })
  .catch(() => {
    message.error("Submission failed");
  });
  };

  const handleClose = () => {
    const studentId = localStorage.getItem("studentId");
    const programId = localStorage.getItem("selectedProgramId");
    const packageId = localStorage.getItem("selectedPackageId");

    const formattedAnswers = questions.map((q) => ({
      question_id: q.id,
      answer_text: answers[q.id] || "",
    }));

    const payload = {
      student_id: studentId,
      program_id: programId,
      package_id: packageId,
      answers: formattedAnswers,
      is_final_submit: false,
    };

    // ✅ CALL SAME API AS SUBMIT
  dispatch(submitAnswers(payload))
  .unwrap()
  .then(() => {

    dispatch(
      fetchCollegeAnalysisStatus({
        studentId,
        programId,
        packageId,
      })
    );

  dispatch(
  fetchCollegeAnalysis({
    tab: "draft",
    studentId,
    programId,
    packageId,
  })
);

    onClose();
  })
  .catch(() => {
    message.error("Failed to save progress");
    onClose();
  });
  };


  useEffect(() => {
    if (open && draftAnswers) {
      setAnswers(draftAnswers);   // ✅ PREFILL HERE
    }
  }, [open, draftAnswers]);


  return (
    <Modal
      title={<Title level={4}>Engineering Questionnaire</Title>}
      open={open}
      centered
      onCancel={handleClose}
      width={800}
      footer={null}
    >
      {/* HEADER */}
      <div style={{ marginBottom: 12 }}>
        <Text type="colorTextSecondary">
          Page {page + 1} of {totalPages}
        </Text>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div
        style={{
          maxHeight: "50vh",
          overflowY: "auto",
          paddingRight: 8,
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {currentQuestions.map((q, index) => (
            <Card
              key={q.id}
              bordered={false}
              style={{
                borderRadius: 14,
                boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                background: "#fafafa",
                border: "none",
              }}
            >
              <Text strong>
                Q{startIndex + index + 1}. {q.question}
              </Text>

              <TextArea
                rows={3}
                placeholder="Write your answer..."
                value={answers[q.id] || ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
                style={{ marginTop: 10, borderRadius: 8 }}
              />
            </Card>
          ))}
        </Space>
      </div>

      {/* FOOTER */}
      <Row
        justify="space-between"
        style={{ marginTop: 20, borderTop: "1px solid #f0f0f0", paddingTop: 12 }}
      >
        <Col>
          <Button disabled={page === 0} onClick={prevPage}>
            Previous
          </Button>
        </Col>

        <Col>
          {page < totalPages - 1 ? (
            <Button type="primary" onClick={nextPage}>
              Next
            </Button>
          ) : (
            <Button type="primary" onClick={handleSubmit}>
              Submit
            </Button>
          )}
        </Col>
      </Row>
    </Modal>
  );
};

export default EngineeringQuestionnaireModal;