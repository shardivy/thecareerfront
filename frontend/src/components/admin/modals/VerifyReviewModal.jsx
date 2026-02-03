import React from "react";
import { Modal, Typography, Rate, Tag, Descriptions, Button, Space } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";

const { Text, Title } = Typography;

const VerifyReviewModal = ({ open, onCancel, reviewData, onVerify }) => {
  if (!reviewData) return null;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
    //   title="Verify Student Review"
      width={600}
    >
      <Title level={5}>Student Review Details</Title>

      <Descriptions bordered column={1} size="middle">
        <Descriptions.Item label="Student Name">
          <Text strong>{reviewData.name}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="Program">
          {reviewData.program}
        </Descriptions.Item>

        <Descriptions.Item label="Rating">
          <Rate disabled defaultValue={reviewData.rating || 4} />
        </Descriptions.Item>

        <Descriptions.Item label="Feedback">
          <Text>
            {reviewData.feedback ||
              "This report was very helpful and clearly explained my career path."}
          </Text>
        </Descriptions.Item>

        <Descriptions.Item label="Review Status">
          <Tag color={adminTheme.token.colorInfo}>
            Verification Pending
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 24, textAlign: "right" }}>
        <Space>
          <Button
            icon={<CloseCircleOutlined />}
            onClick={onCancel}
          >
            Reject
          </Button>

          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            style={{
              backgroundColor: adminTheme.token.colorSuccess,
              borderColor: adminTheme.token.colorSuccess,
            }}
            onClick={() => {
              onVerify(reviewData);
              onCancel();
            }}
          >
            Verify & Unlock Report
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default VerifyReviewModal;
