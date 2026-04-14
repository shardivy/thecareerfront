import React, { useState, useEffect } from "react";
import {
  Modal,
  Typography,
  Card,
  Row,
  Col,
  Avatar,
  Divider,
  Space,
  Input,
  Button,
  message,
} from "antd";
import { UserOutlined, MailOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { updateAnswers } from "../../../adminSlices/collegeAnalysisSlice";

const { Title, Text } = Typography;

const ViewRequestModal = ({
  open,
  onClose,
  data,
  isEditMode = false,
  onSave,
}) => {
  const [answers, setAnswers] = useState([]);
  const dispatch = useDispatch();
  const { updateLoading } = useSelector((state) => state.collegeAnalysis);
  const { questions = [] } = useSelector((state) => state.questions);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const answerMap = new Map(
      (data?.answers || []).map((item) => [
        item.question_id,
        {
          ...item,
          answer: item.answer_text || "",
        },
      ])
    );

    const formatted = (questions || []).map((questionItem) => {
      const existingAnswer = answerMap.get(questionItem.id);

      return (
        existingAnswer || {
          question_id: questionItem.id,
          question: questionItem.question,
          answer_text: "",
          answer: "",
        }
      );
    });

    setAnswers(formatted);
  }, [data, questions]);

  /* ================= SPLIT INTO 3 COLUMNS ================= */
  const chunkSize = Math.ceil(answers.length / 3);

  const col1Answers = answers.slice(0, chunkSize);
  const col2Answers = answers.slice(chunkSize, chunkSize * 2);
  const col3Answers = answers.slice(chunkSize * 2);
  const noResponsesAvailable = answers.length === 0 && questions.length === 0;

  /* ================= HANDLE EDIT ================= */
  const handleAnswerChange = (index, value) => {
    const updated = answers.map((item, i) =>
      i === index ? { ...item, answer: value } : item
    );
    setAnswers(updated);
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    try {
      const payload = {
        studentId: data.student_id,
        answers: answers.map((item) => ({
          question_id: item.question_id,
          answer_text: item.answer,
        })),
      };

      const res = await dispatch(updateAnswers(payload)).unwrap();

      message.success(res.message || "Responses updated successfully");

      if (onSave) onSave();
      onClose();
    } catch (err) {
      message.error(err?.message || "Update failed");
    }
  };

  return (
    <Modal
      open={open}
      title={
        <Title level={4} style={{ margin: 0 }}>
          {isEditMode ? "Edit Responses" : "User Submission"}
        </Title>
      }
      onCancel={onClose}
      width={1400}
      centered
      footer={
        isEditMode &&
        data?.status !== "not_started" &&
        answers?.length > 0 && (
          <div style={{ textAlign: "right" }}>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSave}
              loading={updateLoading}
            >
              Save Changes
            </Button>
          </div>
        )
      }
      styles={{
        body: {
          padding: 12,
        },
      }}
    >
      {data && (
        <Row gutter={[12, 12]} align="stretch">



          {/* 🔹 COLUMN 1 - USER DETAILS */}
          <Col xs={24} md={6}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                height: "100%",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Avatar size={70} icon={<UserOutlined />} />

                <Title level={5} style={{ marginTop: 10 }}>
                  {data.name}
                </Title>

                <Text type="colorTextSecondary">
                  <MailOutlined /> {data.email}
                </Text>
              </div>

              <Divider />

              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <div>
                  <Text strong>Program</Text>
                  <div>{data.program_name}</div>
                </div>

                <div>
                  <Text strong>Counselling</Text>
                  <div>{data.package_name}</div>
                </div>

                <div>
                  <Text strong>Date</Text>
                  <div>
                    {data.created_at
                      ? dayjs(data.created_at).format("YYYY-MM-DD")
                      : "N/A"}
                  </div>
                </div>
              </Space>
            </Card>
          </Col>


          {/* 🔹 COLUMN 2 */}
          <Col xs={24} md={6}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                height: "70vh",
                overflowY: "auto",
                paddingRight: 6,
              }}
            >
              <Title level={5}>Responses</Title>

              {noResponsesAvailable && (
                <div
                  style={{
                    minHeight: "50vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: 24,
                  }}
                >
                  <Text type="colorTextSecondary">
                    No responses available for this request yet.
                  </Text>
                </div>
              )}

              {col1Answers.map((item, index) => (
                <Card
                  key={index}
                  size="small"
                  style={{
                    marginBottom: 10,
                    borderRadius: 8,
                    background: "#fafafa",
                  }}
                >
                  <Text strong>
                    Q{index + 1}. {item.question}
                  </Text>

                  {isEditMode ? (
                    <Input.TextArea
                      value={item.answer}
                      onChange={(e) =>
                        handleAnswerChange(index, e.target.value)
                      }
                      rows={2}
                      style={{ marginTop: 5 }}
                    />
                  ) : (
                    <div style={{ marginTop: 5 }}>
                      <Text type="colorTextSecondary">
                        {item.answer || item.answer_text || "No response available"}
                      </Text>
                    </div>
                  )}
                </Card>
              ))}
            </Card>
          </Col>

          {/* 🔹 COLUMN 3 */}
          <Col xs={24} md={6}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                height: "70vh",
                overflowY: "auto",
                paddingRight: 6,
              }}
            >
              <Title level={5} style={{ visibility: "hidden" }}>
                Hidden
              </Title>

              {col2Answers.map((item, index) => (
                <Card
                  key={index}
                  size="small"
                  style={{
                    marginBottom: 10,
                    borderRadius: 8,
                    background: "#fafafa",
                  }}
                >
                  <Text strong>
                    Q{index + chunkSize + 1}. {item.question}
                  </Text>

                  {isEditMode ? (
                    <Input.TextArea
                      value={item.answer}
                      onChange={(e) =>
                        handleAnswerChange(index + chunkSize, e.target.value)
                      }
                      rows={2}
                      style={{ marginTop: 5 }}
                    />
                  ) : (
                    <div style={{ marginTop: 5 }}>
                      <Text type="colorTextSecondary">
                        {item.answer || item.answer_text || "No response available"}
                      </Text>
                    </div>
                  )}
                </Card>
              ))}
            </Card>
          </Col>

          {/* 🔹 COLUMN 4 */}
          <Col xs={24} md={6}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                height: "70vh",
                overflowY: "auto",
                paddingRight: 6,
              }}
            >
              <Title level={5} style={{ visibility: "hidden" }}>
                Hidden
              </Title>

              {col3Answers.map((item, index) => (
                <Card
                  key={index}
                  size="small"
                  style={{
                    marginBottom: 10,
                    borderRadius: 8,
                    background: "#fafafa",
                  }}
                >
                  <Text strong>
                    Q{index + chunkSize * 2 + 1}. {item.question}
                  </Text>

                  {isEditMode ? (
                    <Input.TextArea
                      value={item.answer}
                      onChange={(e) =>
                        handleAnswerChange(
                          index + chunkSize * 2,
                          e.target.value
                        )
                      }
                      rows={2}
                      style={{ marginTop: 5 }}
                    />
                  ) : (
                    <div style={{ marginTop: 5 }}>
                      <Text type="colorTextSecondary">
                        {item.answer || item.answer_text || "No response available"}
                      </Text>
                    </div>
                  )}
                </Card>
              ))}
            </Card>
          </Col>

        </Row>
      )}
    </Modal>
  );
};

export default ViewRequestModal;
