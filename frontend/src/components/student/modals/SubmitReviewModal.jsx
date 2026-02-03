import React from "react";
import { Modal, Typography, Rate, Input, Divider, Space } from "antd";
import {
  StarFilled,
  SmileOutlined,
  HeartFilled,
} from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";

const { Title, Text } = Typography;
const { TextArea } = Input;

// const ratingLabels = {
//   1: "Very Poor 😞",
//   2: "Poor 😕",
//   3: "Average 😐",
//   4: "Good 🙂",
//   5: "Excellent 🤩",
// };

const SubmitReviewModal = ({
  open,
  onCancel,
  onSubmit,
  rating,
  setRating,
  feedback,
  setFeedback,
}) => {
  const { token } = adminTheme;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={onSubmit}
      okText="Submit Review"
      width={520}
      title={
        <Space>
          {/* <StarFilled style={{ color: token.colorWarning }} /> */}
          <span>Rate Your Overall Experience</span>
        </Space>
      }
      okButtonProps={{
        style: {
          backgroundColor: token.colorPrimary,
          borderColor: token.colorPrimary,
          borderRadius: token.borderRadius,
          fontWeight: 500,
        },
      }}
      cancelButtonProps={{
        style: { borderRadius: token.borderRadius },
      }}
    ><br></br>
      {/* ⭐ Rating */}
      <Title level={5} style={{ marginBottom: 6 }}>
        How was your experience on our platform?
      </Title>

      <Rate
        value={rating}
        onChange={setRating}
        style={{ fontSize: 24 }}
      />

      {/* <Text
        style={{
          display: "block",
          marginTop: 6,
          fontWeight: 500,
          color: token.colorTextSecondary,
        }}
      >
        {rating ? ratingLabels[rating] : "Tap a star to rate"}
      </Text> */}

      <Divider />

      {/* 💬 Feedback */}
      <Title level={5} style={{ marginBottom: 6 }}>
        <SmileOutlined style={{ marginRight: 6 }} />
        Share your thoughts
      </Title>

      <TextArea
        rows={4}
        placeholder="Tell us about your overall experience — guidance, reports, usability, and support..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        maxLength={400}
        showCount
        style={{
          borderRadius: token.borderRadius,
          resize: "none",
        }}
      />

      {/* ❤️ Footer */}
      <div style={{ textAlign: "center", marginTop: 14 }}>
        <Text style={{ color: token.colorTextSecondary }}>
          <HeartFilled
            style={{
              color: token.colorError,
              marginRight: 6,
            }}
          />
          Your feedback helps us improve
        </Text>
      </div>
    </Modal>
  );
};

export default SubmitReviewModal;
