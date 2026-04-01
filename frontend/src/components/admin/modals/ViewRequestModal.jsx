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
import {
  UserOutlined,
  MailOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch , useSelector } from "react-redux";
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

  /* ================= LOAD DATA ================= */
 useEffect(() => {
  const formatted = (data?.answers || []).map((item) => ({
    ...item,
    answer: item.answer_text || "", // ✅ map backend → frontend
  }));

  setAnswers(formatted);
}, [data]);
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
      studentId: data.student_id, // ✅ from backend
      answers: answers.map((item) => ({
        question_id: item.question_id,
        answer_text: item.answer, // ✅ MUST be answer_text
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
      width={850}
      centered
    footer={
  isEditMode &&
  data?.status !== "not_started" &&
  answers?.length > 0 && (   // ✅ NEW CONDITION
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
          maxHeight: "75vh",
          overflowY: "auto",
          overflowX: "hidden", // ✅ FIX horizontal scroll
          paddingRight: 8,
        },
      }}
    >
      {data && (
        <Row gutter={[16, 16]} style={{ margin: 0 }}>
          
          {/* 🔹 LEFT PANEL (READ ONLY USER INFO) */}
          <Col xs={24} md={8}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                overflow: "hidden", // ✅ prevents overflow
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Avatar size={80} icon={<UserOutlined />} />

                <Title level={5} style={{ marginTop: 10 }}>
                  {data.name}
                </Title>

                <Text type="colorTextSecondary">
                  <MailOutlined /> {data.email}
                </Text>
              </div>

              <Divider />

              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <Text strong>Program</Text>
                  <div>{data.program_name}</div>
                </div>

                <div>
                  <Text strong>Counselling Service</Text>
                  <div>{data.package_name}</div>
                </div>

                <div>
                  <Text strong>Submission Date</Text>
                  <div>{data.created_at ? dayjs
                  (data.created_at).format("YYYY-MM-DD") : "N/A"}</div>
                </div>
              </Space>
            </Card>
          </Col>

          {/* 🔹 RIGHT PANEL (RESPONSES) */}
          <Col xs={24} md={16}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              }}
            >
              <Title level={5} style={{ marginBottom: 12 }}>
                Responses
              </Title>

              {answers?.length ? (
                answers.map((item, index) => (
                  <Card
                    key={index}
                    size="small"
                    style={{
                      marginBottom: 12,
                      borderRadius: 10,
                      background: "#fafafa",
                    }}
                  >
                    {/* QUESTION */}
                    <Text strong>
                      Q{index + 1}. {item.question}
                    </Text>

                    {/* ANSWER */}
                    {isEditMode ? (
                      <Input.TextArea
                        value={item.answer}
                        onChange={(e) =>
                          handleAnswerChange(index, e.target.value)
                        }
                        rows={2}
                        style={{ marginTop: 6 }}
                      />
                    ) : (
                      <div
                        style={{
                          marginTop: 6,
                          padding: 8,
                          background: "#ffffff",
                          borderRadius: 6,
                          border: "1px solid #eee",
                        }}
                      >
                        <Text type="colorTextSecondary">
                       {item.answer || item.answer_text}
                        </Text>
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                <Text type="colorTextSecondary">No responses available</Text>
              )}
            </Card>
          </Col>

        </Row>
      )}
    </Modal>
  );
};

export default ViewRequestModal;