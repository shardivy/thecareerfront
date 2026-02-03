import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Divider,
  Alert,
  Tag,
} from "antd";
import {
  FilePdfOutlined,
  LockOutlined,
  DownloadOutlined,
  EyeOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  StarOutlined,
} from "@ant-design/icons";
import SubmitReviewModal from "../modals/SubmitReviewModal";

const { Title, Text } = Typography;

const ReportManagement = () => {
  /* ---------------- REVIEW STATE ---------------- */
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(4);
  const [feedback, setFeedback] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  /* ---------------- HANDLERS ---------------- */
  const handleSubmitReview = () => {
    setReviewSubmitted(true);
    setReviewModalOpen(false);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/Career Counselling & Assessment Platform.pdf";
    link.download = "Career_Report.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = () => {
    window.open("/Career Counselling & Assessment Platform.pdf", "_blank");
  };

  /* ---------------- REPORT CARD ---------------- */
  const ReportCard = ({ title, locked, reason }) => (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
        height: "100%",
      }}
    >
      {/* Header */}
      <Row justify="space-between">
        <Title level={5}>{title}</Title>
        <Tag color={locked ? "red" : "green"}>
          {locked ? "Locked" : "Unlocked"}
        </Tag>
      </Row>

      <Divider />

      {/* Preview */}
      <div
        style={{
          height: 220,
          borderRadius: 12,
          background: locked
            ? "linear-gradient(180deg,#020617,#0f172a)"
            : "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        {locked ? (
          <LockOutlined style={{ fontSize: 46, color: "#fff" }} />
        ) : (
          <FilePdfOutlined style={{ fontSize: 46 }} />
        )}
      </div>

      {/* Info */}
      <Row gutter={16} style={{ marginBottom: 12 }}>
        <Col>
          <CalendarOutlined /> <Text>07 Jan 2026</Text>
        </Col>
        <Col>
          <InfoCircleOutlined /> <Text>2.4 MB</Text>
        </Col>
      </Row>

      <Divider />

      {/* Actions */}
      {!locked ? (
        <>
          <Button
            block
            icon={<EyeOutlined />}
            style={{ marginBottom: 10 }}
            onClick={handleView}
          >
            View Report
          </Button>
          <Button block icon={<DownloadOutlined />} onClick={handleDownload}>
            Download PDF
          </Button>
        </>
      ) : reason === "payment" ? (
        <Alert
          type="warning"
          showIcon
          message="Payment Pending"
          description="Complete payment to unlock this report"
        />
      ) : (
        <>
          {!reviewSubmitted ? (
            <>
              <Alert
                type="info"
                showIcon
                message="Review Required"
                description="Submit your review to unlock the report"
                style={{ marginBottom: 12 }}
              />
              <Button
                block
                icon={<StarOutlined />}
                type="primary"
                onClick={() => setReviewModalOpen(true)}
              >
                Submit Review
              </Button>
            </>
          ) : (
            <Alert
              type="info"
              showIcon
              message="Review Submitted"
              description="Waiting for admin verification"
            />
          )}
        </>
      )}
    </Card>
  );

  return (
    <div style={{ padding: 16 }}>
      <Title level={2} style={{ textAlign: "center" }}>
        My Reports
      </Title>
      <Text
        type="colorTextSecondary"
        style={{ display: "block", textAlign: "center" }}
      >
        View and manage your assessment reports
      </Text>

      <Divider />

      <Row gutter={[24, 24]}>
        {/* 1️⃣ Unlocked */}
        <Col xs={24} md={8}>
          <ReportCard title="Career Assessment Report" locked={false} />
        </Col>

        {/* 2️⃣ Locked – Payment Pending */}
        <Col xs={24} md={8}>
          <ReportCard title="Career Assessment Report" locked reason="payment" />
        </Col>

        {/* 3️⃣ Locked – Review Pending */}
        <Col xs={24} md={8}>
          <ReportCard title="Career Assessment Report" locked reason="review" />
        </Col>

        </Row>

      {/* ---------------- REVIEW MODAL ---------------- */}
      <SubmitReviewModal
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        onSubmit={handleSubmitReview}
        rating={rating}
        setRating={setRating}
        feedback={feedback}
        setFeedback={setFeedback}
      />
    </div>
  );
};

export default ReportManagement;
