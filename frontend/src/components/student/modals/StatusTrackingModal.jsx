import React, { useEffect, useMemo } from "react";
import { Modal, Button, Typography, Tag, Spin } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchExamTracker } from "../../../adminSlices/examSlice";

const { Text } = Typography;

const StatusTrackingModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const studentId = localStorage.getItem("studentId");

  const { tracker, trackerLoading } = useSelector(
    (state) => state.exam
  );

  // Redux values
  const selectedProgramId = useSelector(
    (state) => state.auth?.selectedProgramId
  );

  const selectedPackageId = useSelector(
    (state) => state.auth?.selectedPackageId
  );

  // Fallback to localStorage
  const programId =
    selectedProgramId ||
    localStorage.getItem("selectedProgramId");

  const packageId =
    selectedPackageId ||
    localStorage.getItem("selectedPackageId");

  /* ---------------- FETCH WHEN MODAL OPENS ---------------- */
  useEffect(() => {
    if (!open || !studentId || !programId || !packageId) return;

    dispatch(
      fetchExamTracker({
        studentId,
        programId,
        packageId,
      })
    );
  }, [
    open,
    dispatch,
    studentId,
    programId,
    packageId,
  ]);

  /* ---------------- DATE FORMAT FUNCTION (ADDED) ---------------- */
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  /* ---------------- CONVERT API RESPONSE → STEPS ---------------- */
  const steps = useMemo(() => {
    if (!tracker) return [];

    return [
      {
        title: "Exam Started",
        time: tracker.exam_started?.date
          ? formatDateTime(tracker.exam_started.date)
          : "Not Started",
        status: tracker.exam_started?.status ? "done" : "pending",
      },
      {
        title: "Exam Submitted",
        time: tracker.exam_submitted?.date
          ? formatDateTime(tracker.exam_submitted.date)
          : "Not Submitted",
        status: tracker.exam_submitted?.status ? "done" : "pending",
      },
      {
        title: "Approved by Admin",
        time: tracker.awaiting_approval?.status
          ? "Approved"
          : "Waiting for Approval",
        status: tracker.awaiting_approval?.status
          ? "done"
          : tracker.exam_submitted?.status
            ? "current"
            : "pending",
      },
      {
        title: "Report Generation",
        time:
          tracker.report_generation?.report_status === "received_unlocked"
            ? "Unlocked"
            : tracker.report_generation?.report_status === "received_locked"
              ? "Locked"
              : "Pending Upload",

        status:
          tracker.report_generation?.report_status === "received_unlocked"
            ? "done"
            : tracker.report_generation?.report_status === "received_locked"
              ? "current"
              : "pending_uploaded",
      },

    ];
  }, [tracker]);

  /* ---------------- ICON LOGIC ---------------- */
  const getIcon = (status) => {
    if (status === "done") return <CheckCircleOutlined />;
    if (status === "current") return <ClockCircleOutlined />;
    return <FileTextOutlined />;
  };

  const getColor = (status) => {
    if (status === "done") return "#52c41a";
    if (status === "current") return "#faad14";
    if (status === "pending_uploaded") return "#bfbfbf";
    return "#bfbfbf";
  };
  const getTagLabel = (status) => {
    if (status === "done") return "Completed";
    if (status === "current") return "In Progress";
    if (status === "pending_uploaded") return "Pending Upload";
    return "Pending";
  };

  /* ---------------- CURRENT STATUS LABEL ---------------- */
  const currentStatus =
    tracker?.report_generation?.report_status === "received_unlocked"
      ? "Report Unlocked"
      : tracker?.report_generation?.report_status === "received_locked"
        ? "Report Locked"
        : tracker?.report_generation?.report_status === "not_received"
          ? "Pending Upload"
          : tracker?.awaiting_approval?.status
            ? "Approved by Admin"
            : tracker?.exam_submitted?.status
              ? "Submitted - Waiting Approval"
              : tracker?.exam_started?.status
                ? "In Progress"
                : "Not Started";

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
        {trackerLoading ? (
          <Spin />
        ) : (
          <>
            {steps.map((step, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  position: "relative",
                  paddingBottom:
                    index !== steps.length - 1 ? 36 : 0,
                }}
              >
                {/* ICON */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: `2px solid ${getColor(step.status)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: getColor(step.status),
                    background:
                      step.status === "done"
                        ? "#f6ffed"
                        : "#fff",
                    zIndex: 2,
                    fontSize: 16,
                  }}
                >
                  {getIcon(step.status)}
                </div>

                {/* CONNECTOR LINE */}
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
                          ? getColor(step.status)
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
                    <Tag color={getColor(step.status)} style={{ marginTop: 6 }}>
                      {getTagLabel(step.status)}
                    </Tag>
                  )}
                </div>
              </div>
            ))}

            {/* CURRENT STATUS BOX */}
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
                  style={{
                    fontSize: 14,
                    padding: "2px 10px",
                  }}
                >
                  {currentStatus}
                </Tag>
              </div>

              {!tracker?.awaiting_approval?.status && (
                <Text
                  type="colorTextSecondary"
                  style={{
                    display: "block",
                    marginTop: 8,
                    fontSize: 13,
                  }}
                >
                  You will receive a notification once your exam
                  is approved.
                </Text>
              )}
            </div>

          </>
        )}
      </div>
    </Modal>
  );
};

export default StatusTrackingModal;


