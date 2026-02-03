import React from "react";
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
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

/* ===================== MOCK DATA ===================== */
const summaryData = {
  totalFee: 20000,
  paidAmount: 10000,
  dueAmount: 10000,
};

const invoiceData = [
  {
    key: "1",
    srNo: 1,
    package: "Basic",
    amount: 499,
    status: "Paid",
    date: "10 Jan 2026",
  },
  {
    key: "2",
    srNo: 2,
    package: "Standard",
    amount: 5999,
    status: "Paid",
    date: "25 Jan 2026",
  },
  {
    key: "3",
    srNo: 3,
    package: "Premium",
    amount: 9999,
    status: "Due",
    date: "15 Feb 2026",
  },
];

/* ===================== COMPONENT ===================== */
const Payments = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const paymentProgress =
    (summaryData.paidAmount / summaryData.totalFee) * 100;

  /* ===================== TABLE COLUMNS ===================== */
  const columns = [
    {
      title: "Sr. No",
      dataIndex: "srNo",
      key: "srNo",
      width: 80,
    },
    {
      title: "Package",
      dataIndex: "package",
      key: "package",
      ellipsis: true,
    },
    {
      title: "Amount (₹)",
      dataIndex: "amount",
      key: "amount",
      render: (amt) => <Text strong>₹{amt}</Text>,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      responsive: ["md"],
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        status === "Paid" ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Paid
          </Tag>
        ) : (
          <Tag color="red" icon={<ClockCircleOutlined />}>
            Due
          </Tag>
        ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) =>
        record.status === "Due" ? (
          <Button
            type="primary"
            size={isMobile ? "small" : "middle"}
            icon={<CreditCardOutlined />}
          >
            {isMobile ? "" : "Pay Now"}
          </Button>
        ) : (
          <Button
            size={isMobile ? "small" : "middle"}
            icon={<FileTextOutlined />}
          >
            {isMobile ? "" : "Invoice"}
          </Button>
        ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      {/* PAGE TITLE */}
      <div style={{ textAlign: "center" }}>
        <Title level={isMobile ? 4 : 3}>Payments</Title>
        <Text type="colorTextSecondary" style={{ fontSize: isMobile ? 12 : 14 }}>
          View your payment status, pending dues and invoices
        </Text>
      </div>

      <Divider />

      {/* ===================== SUMMARY CARDS ===================== */}
      <Row gutter={[16, 16]}>
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
          dataSource={invoiceData}
          pagination={false}
          size={isMobile ? "small" : "middle"}
            scroll={{ x: "max-content" }}
        />
      </Card>
    </div>
  );
};

export default Payments;
