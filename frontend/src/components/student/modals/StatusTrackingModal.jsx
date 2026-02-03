import React from "react";
import { Modal, Button, Typography, Tag } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const StatusTrackingModal = ({ open, onClose }) => {
  const steps = [
    {
      title: "Exam Started",
      time: "2026-01-07 14:00",
      status: "done",
      icon: <CheckCircleOutlined />,
      color: "#52c41a",
    },
    {
      title: "Exam Submitted",
      time: "2026-01-07 14:58",
      status: "done",
      icon: <CheckCircleOutlined />,
      color: "#52c41a",
    },
    {
      title: "Awaiting Approval",
      time: "Pending admin review",
      status: "current",
      icon: <ClockCircleOutlined />,
      color: "#1677ff",
    },
    {
      title: "Report Generation",
      time: "Will be available after approval",
      status: "pending",
      icon: <FileTextOutlined />,
      color: "#bfbfbf",
    },
  ];

  return (
    <Modal
      title="Exam Status Tracker"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <div style={{ padding: "16px 12px" }}>
        {steps.map((step, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              position: "relative",
              paddingBottom: index !== steps.length - 1 ? 36 : 0,
            }}
          >
            {/* ICON */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: `2px solid ${step.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: step.color,
                background:
                  step.status === "done"
                    ? "#f6ffed"
                    : "#fff",
                zIndex: 2,
                fontSize: 16,
              }}
            >
              {step.icon}
            </div>

            {/* CONNECTOR */}
            {index !== steps.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  left: 22,
                  top: 48,
                  width: 2,
                  height: 34,
                  background:
                    step.status === "done"
                      ? step.color
                      : "#e5e7eb",
                }}
              />
            )}

            {/* TEXT */}
            <div>
              <Text strong style={{ fontSize: 15 }}>
                {step.title}
              </Text>
              <br />
              <Text
                type="colorTextSecondary"
                style={{
                  fontSize: 13,
                  display: "block",
                  marginTop: 2,
                }}
              >
                {step.time}
              </Text>

              {step.status === "current" && (
                <Tag
                  color="blue"
                  style={{ marginTop: 6 }}
                >
                  In Progress
                </Tag>
              )}
            </div>
          </div>
        ))}

        {/* CURRENT STATUS */}
        <div
          style={{
            marginTop: 28,
            padding: 16,
            borderRadius: 10,
            background: "#f5f7ff",
            border: "1px solid #adc6ff",
          }}
        >
          <Text strong>Current Status</Text>

          <div style={{ marginTop: 8 }}>
            <Tag
              color="blue"
              style={{ fontSize: 14, padding: "2px 10px" }}
            >
              Submitted – Awaiting Approval
            </Tag>
          </div>

          <Text
            type="colorTextSecondary"
            style={{
              display: "block",
              marginTop: 8,
              fontSize: 13,
            }}
          >
            You will receive a notification once your exam is approved.
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default StatusTrackingModal;
