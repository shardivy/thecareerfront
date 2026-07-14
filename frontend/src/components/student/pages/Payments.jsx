import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Card,
  Typography,
  Table,
  Tag,
  Button,
  Divider,
  Progress,
  Grid,
} from "antd";
import {
  CreditCardOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

import UploadPaymentModal from "../modals/UploadPaymentModal";
import { useDispatch, useSelector } from "react-redux";
import { fetchStudentPaymentHistory, fetchStudentPaymentProgress, fetchPaymentReceipt } from "../../../adminSlices/paymentSlice";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;


/* ===================== COMPONENT ===================== */
const Payments = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();


  const { historyList, historyLoading } = useSelector(
    (state) => state.payment
  );

  const { progressData, progressLoading } = useSelector(
    (state) => state.payment
  );

  const totalFee = Number(progressData?.package_price) || Number(localStorage.getItem("packagePrice")) || 0;
  const paidAmount = Number(progressData?.total_paid) || 0;
  const dueAmount = Number(progressData?.remaining_amount) || 0;

  const summaryData = {
    totalFee,
    paidAmount,
    dueAmount,
  };

  const paymentProgress =
    totalFee > 0 ? Math.min((paidAmount / totalFee) * 100, 100) : 0;


  useEffect(() => {
    const studentId = localStorage.getItem("studentId");

    // console.log("Student ID from localStorage:", studentId);

    if (studentId) {
      dispatch(fetchStudentPaymentHistory(studentId));
      dispatch(fetchStudentPaymentProgress(studentId)).then((action) => {
        if (action.payload?.package_price) {
          localStorage.setItem("packagePrice", action.payload.package_price);
          // console.log("Package price stored in localStorage:", action.payload.package_price);
        }
      });
    }
  }, [dispatch]);



  const handleUploadPaymentClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleModalClose = () => {
    setIsUploadModalOpen(false);
  };

  const handleUploadSuccess = () => {
    // Refresh payments or summary if needed
    // console.log("Payment uploaded successfully");
  };

  const truncateAfterFive = (text = "") => {
    if (!text) return "-";
    return text.length > 5 ? `${text.slice(0, 5)}...` : text;
  };



  const formattedHistory = historyList.map((item, index) => {
    const rawDate = item.payment_date || item.created_at;
    const savedProgram = localStorage.getItem("selectedProgram");
    const savedPackageName = localStorage.getItem("selectedPackageName");
    const savedPackage = savedPackageName || localStorage.getItem("selectedPackage");
    return {
      key: item.id || index,
      studentId: item.student_id,
      srNo: index + 1,
      // program: item.program_name || item.program || "N/A",
      // package: item.package_name || item.package || "-",
      program:
        item.program_name ||
        item.program ||
        savedProgram ||
        "N/A",

      package:
        item.package_name ||
        item.package ||
        savedPackage ||
        "-",
      paidAmount: item.amount || 0,
      packagePrice: item.package_price || Number(localStorage.getItem("packagePrice")) || 0,
      status:
        item.status === "fully_paid" ||
          item.status === "paid" ||
          item.status === "verified"
          ? "fully_paid"
          : item.status === "partial_paid"
            ? "partial_paid"
             : item.status === "verification_pending"
        ? "verification_pending"
            : "not_paid",
      paymentMethod: item.method || "-",
      date: rawDate
        ? new Date(rawDate).toLocaleDateString("en-IN")
        : "-",
      txn: item.transaction_id || "-",
    };
  });

  /* ===================== TABLE COLUMNS ===================== */
  const columns = [
    {
      title: "Sr. No",
      dataIndex: "srNo",
      key: "srNo",
      width: 80,
    },
    {
      title: "Program / Counselling Service",
      width: 220,
      render: (_, record) => (
        <div>
          <Text strong>{record.program || "N/A"}</Text>
          <br />
          <Text
            type="colortextSecondary"
          >
            {record.package || "-"}
          </Text>
        </div>
      ),
    },
    {
      title: "Amount",
      render: (_, record) => {
        const paid = record.paidAmount || 0;
        const total = record.packagePrice || 0;

        return (
          <span>
            ₹{paid.toLocaleString("en-IN")}
            <Text type="colorTextSecondary">
              {" "}
              / ₹{total.toLocaleString("en-IN")}
            </Text>
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        if (status === "fully_paid") {
          return (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              Fully Paid
            </Tag>
          );
        }

        if (status === "partial_paid") {
          return (
            <Tag color="orange" icon={<ClockCircleOutlined />}>
              Partial Paid
            </Tag>
          );
        }

        if (status === "not_paid") {
          return (
            <Tag color="red" icon={<ClockCircleOutlined />}>
              Due
            </Tag>
          );
        }

         if (status === "verification_pending")
          return (
        <Tag color="orange">Verification Pending</Tag>
          );

    
        return <Tag>{status}</Tag>;
      },
    },

    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      render: (method) =>
        method === "-" ? <Text type="colorTextSecondary">-</Text> : <Tag>{method}</Tag>,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      responsive: ["md"],
    },
    {
      title: "Transaction ID",
      dataIndex: "txn",
      render: (txn) => truncateAfterFive(txn),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
     if (record.status === "not_paid") {
      return (
        <Button
          type="primary"
          size={isMobile ? "small" : "middle"}
          icon={<CreditCardOutlined />}
          onClick={() => navigate("/student/payment-page")}
          disabled={record.status === "verification_pending"} // safety
        >
          Pay Now
        </Button>
      );
    }

    // 🟠 VERIFICATION PENDING → DISABLED PAY NOW
    if (record.status === "verification_pending") {
      return (
        <Button
          type="primary"
          size={isMobile ? "small" : "middle"}
          icon={<ClockCircleOutlined />}
          disabled
        >
          Verification Pending
        </Button>
      );
    }

        // 🟢 FULLY PAID → View Invoice (ENABLED ✅)
        if (record.status === "fully_paid") {
          return (
            <div style={{ display: "flex", gap: 8 }}>

              {/* 🔍 VIEW BUTTON */}
              <Button
                size={isMobile ? "small" : "middle"}
                icon={<FileTextOutlined />}
                onClick={async () => {
                  try {
                    const studentId = localStorage.getItem("studentId");

                    const blob = await dispatch(
                      fetchPaymentReceipt(studentId)
                    ).unwrap();

                    const url = window.URL.createObjectURL(blob);
                    window.open(url, "_blank");

                  } catch (error) {
                    // console.error("View failed", error);
                  }
                }}
              >
                {isMobile ? "View Receipt" : "View Receipt"}
              </Button>

              {/* ⬇ DOWNLOAD BUTTON */}
              <Button
                size={isMobile ? "small" : "middle"}
                icon={<DownloadOutlined />}
                onClick={async () => {
                  try {
                    const studentId = localStorage.getItem("studentId");

                    const blob = await dispatch(
                      fetchPaymentReceipt(studentId)
                    ).unwrap();

                    const url = window.URL.createObjectURL(blob);

                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `Invoice.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();

                  } catch (error) {
                    // console.error("Download failed", error);
                  }
                }}
              >
                {isMobile ? "Download" : "Download"}
              </Button>

            </div>
          );
        }

        // 🟡 PARTIAL PAID → Optional behavior
        return (
          <Button
            size={isMobile ? "small" : "middle"}
            icon={<FileTextOutlined />}
            disabled
          >
            {isMobile ? "Invoice" : "View Invoice"}
          </Button>
        );
      },
    }
  ];



  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      {/* ===================== HEADER ===================== */}
      <Row justify="center">
        <Col>
          <Title
            level={isMobile ? 4 : 2}
            style={{ margin: 5, textAlign: "center" }}
          >
            Payments
          </Title>

          <Text
            type="colorTextSecondary"
            style={{ display: "block", textAlign: "center" }}
          >
            View your payment status, pending dues and invoices
          </Text>
        </Col>
      </Row>

      {/* ===================== UPLOAD BUTTON ===================== */}
      {/* <Row justify="end" style={{ marginTop: 16 }}>
        <Col>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            size={isMobile ? "middle" : "large"}
            onClick={handleUploadPaymentClick}
          >
            {isMobile ? "Upload" : "Upload Payment"}
          </Button>
        </Col>
      </Row> */}

      {/* ===================== SUMMARY CARDS ===================== */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false}>
            <Text>Total Fee</Text>
            <Title level={5}>₹{summaryData.totalFee}</Title>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card bordered={false}>
            <Text>Paid Amount</Text>
            <Title level={5} style={{ color: "#52c41a" }}>
              ₹{summaryData.paidAmount}
            </Title>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card bordered={false}>
            <Text>Remaining Due</Text>
            <Title level={5} style={{ color: "#ff4d4f" }}>
              ₹{summaryData.dueAmount}
            </Title>
          </Card>
        </Col>
      </Row>

      {/* ===================== PROGRESS ===================== */}
      <Card style={{ marginTop: 16 }} bordered={false}>
        <Text strong>Payment Progress</Text>
        <Progress
          percent={Math.round(paymentProgress)}
          strokeWidth={isMobile ? 6 : 8}
        />
      </Card>

      {/* ===================== TABLE ===================== */}
      <Card
        title="Invoices & Payment History"
        style={{ marginTop: 20 }}
        bordered={false}
      >
        <Table
          columns={columns}
          dataSource={formattedHistory}
          loading={historyLoading}
          size={isMobile ? "small" : "middle"}
          scroll={{ x: "max-content" }}
        />
      </Card>

      {/* ===================== UPLOAD PAYMENT MODAL ===================== */}
      <UploadPaymentModal
        open={isUploadModalOpen}
        onClose={handleModalClose}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default Payments;
