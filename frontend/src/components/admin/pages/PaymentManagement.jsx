import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Card,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  ConfigProvider,
  Input,
  Select,
  DatePicker,
} from "antd";
import {
  EyeOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  PayCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  UploadOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import adminTheme from "../../../theme/adminTheme";
import PaymentProofModal from "../modals/PaymentProofModal";
import UploadPaymentModal from "../modals/UploadPaymentModal";
import { fetchPaymentStats, fetchPayments } from "../../../adminSlices/paymentSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const PaymentManagement = () => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const dispatch = useDispatch();

  const { stats, statsLoading, list, listLoading } = useSelector(
    (state) => state.payment
  );

  useEffect(() => {
    dispatch(fetchPaymentStats());
    dispatch(fetchPayments());
  }, [dispatch]);

  // Debug: Log the payment list
  useEffect(() => {
    console.log("📊 Payment list in component:", list);
    if (list.length > 0) {
      console.log("🔍 First payment item:", list[0]);
      console.log("🔍 Date fields in first item:", {
        payment_date: list[0].payment_date,
        date: list[0].date,
        original_payment_date: list[0].original_payment_date,
        original_created_at: list[0].original_created_at
      });
    }
  }, [list]);

  const handleEditPayment = (record) => {
    setSelectedPayment(record);
    setIsModalOpen(true);
  };

  /* ---------------- STATS ---------------- */
  const statsCards = [
    {
      title: "Total Collected",
      value: `₹${stats?.total_collected ?? 0}`,
      icon: (
        <DollarCircleOutlined
          style={{ fontSize: 28, color: adminTheme.token.colorPrimary }}
        />
      ),
    },
    {
      title: "Pending Verification",
      value: `₹${stats?.pending_verification ?? 0}`,
      icon: (
        <FileTextOutlined
          style={{ fontSize: 28, color: adminTheme.token.colorPrimary }}
        />
      ),
    },
    {
      title: "Partial Payments",
      value: `₹${stats?.partial_paid ?? 0}`,
      icon: (
        <PayCircleOutlined
          style={{ fontSize: 28, color: adminTheme.token.colorPrimary }}
        />
      ),
    },
    {
      title: "Fully Pending",
      value: `₹${stats?.pending ?? 0}`,
      icon: (
        <CloseCircleOutlined
          style={{ fontSize: 28, color: adminTheme.token.colorPrimary }}
        />
      ),
    },
  ];

  /* ---------------- STATUS COLORS ---------------- */
  const statusColorMap = {
    "Fully Paid": "success",
    "Partial Paid": "warning",
    "Verification Pending": "processing",
    Pending: "error",
  };

  /* ---------------- UTILITY FUNCTIONS ---------------- */
  const toTitle = (str) => {
    if (!str) return "Pending";
    return str
      .toString()
      .replace(/_/g, " ")
      .split(" ")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  };

  const formatAmt = (val) => {
    const num = Number(val);
    if (Number.isFinite(num)) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(num);
    }
    return val ?? "-";
  };

  const extractName = (userName) => {
    if (!userName) return "N/A";
    if (userName.includes(" - ")) {
      const parts = userName.split(" - ");
      return parts[parts.length - 1].trim();
    }
    return userName;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  /* ---------------- API -> TABLE DATA ---------------- */
  const apiPaymentRecords = Array.isArray(list)
    ? list.map((p, idx) => {
      console.log(`📋 Processing payment ${idx} for table:`, p);

      const cleanName = extractName(p.user_name);
      const packageName = p.package_name || p.package || "N/A";

      // ✅ Paid + Total
      const paidAmount = Number(p.amount || 0);
      const packagePrice = Number(p.package_price || 0);

      const status = toTitle(p.payment_status);
      const paymentMethod = (p.payment_method || "-").toString().toUpperCase();
      const date = p.date || p.payment_date || "-";
      const txn = p.transaction_id || p.txn || "-";

      return {
        key: p.payment_id || p.id || `payment-${idx}`,
        id: p.payment_id || p.id,
        name: cleanName,
        package: packageName,

        // ✅ Store both separately (better than merging string)
        paidAmount,
        packagePrice,

        status,
        paymentMethod,
        date,
        txn,
        proof: !!(p.proof_file_url || p.proof_file || p.receipt_url),
        originalData: p
      };
    })
    : [];

  /* ---------------- FILTER LOGIC ---------------- */
  const filteredData = apiPaymentRecords.filter((item) => {
    const search = searchText.toLowerCase();

    const matchesSearch = Object.values(item)
      .filter((val) => typeof val === "string")
      .join(" ")
      .toLowerCase()
      .includes(search);

    const matchesStatus = statusFilter ? item.status === statusFilter : true;

    const matchesDate = selectedDate
      ? item.date !== "-" && dayjs(item.date).isSame(selectedDate, "day")
      : true;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const breakAfterThreeWords = (text = "") => {
    if (!text) return "-";
    const words = text.split(" ");
    let lines = [];
    for (let i = 0; i < words.length; i += 3) {
      lines.push(words.slice(i, i + 3).join(" "));
    }
    return lines.join("\n");
  };

  const truncateAfterFive = (text = "") => {
    if (!text) return "-";
    return text.length > 5 ? `${text.slice(0, 5)}...` : text;
  };

  /* ---------------- TABLE COLUMNS ---------------- */
  const columns = [
    {
      title: "Sr. No.",
      render: (_, __, index) => index + 1,
      width: 50,
    },
    {
      title: "User Name",
      dataIndex: "name",
      render: (name) => name || "N/A"
    },
    {
      title: "Counselling Services",
      dataIndex: "package",
      render: (pkg) => pkg || "N/A"
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
      title: "Payment Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={statusColorMap[status] || "default"}>
          <div style={{ whiteSpace: "pre-line" }}>
            {breakAfterThreeWords(status)}
          </div>
        </Tag>
      ),
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      render: (method) =>
        method === "-" ? <Text type="colorTextSecondary">-</Text> : <Tag>{method}</Tag>,
    },
    {
      title: "Payment Date",
      dataIndex: "date",
      width: 150,
      render: (date) => {
        if (date === "-") {
          return "-";
        }

        // Parse the date string
        let displayDate = date;
        try {
          // If it's already in YYYY-MM-DD format, use as is
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            displayDate = date;
          } else {
            // Otherwise format it
            displayDate = new Date(date).toISOString().split('T')[0];
          }
        } catch (e) {
          console.error("❌ Error formatting display date:", date, e);
        }

        return (
          <Space>
            <CalendarOutlined />
            {displayDate}
          </Space>
        );
      },
    },
    {
      title: "Transaction ID",
      dataIndex: "txn",
      render: (txn) => truncateAfterFive(txn),
    },
    {
      title: "Action",
      render: (_, record) => {
        // Only show Verify button for Verification Pending
        if (record.status === "Verification Pending") {
          return (
            <Button
              size="large"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setSelectedPayment({
                  ...record,
                  mode: "verify",
                  paymentDate: record.date !== "-" ? record.date : null,
                });
                setIsModalOpen(true);
              }}
            >
              Verify
            </Button>
          );
        }

        // For all other statuses, always show View + Edit
        return (
          <Space>
            <Button
              size="large"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedPayment({ ...record, mode: "view" });
                setIsModalOpen(true);
              }}
            >
              View
            </Button>

            <Button
              size="large"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedPayment({ ...record, mode: "edit" });
                setIsModalOpen(true);
              }}
            >
              Edit
            </Button>
          </Space>
        );
      },
    }
  ];

  return (
    <ConfigProvider theme={adminTheme}>
      <div style={{ padding: 16 }}>
        <Title level={3}>Payment Management</Title>

        {/* ---------------- STATS ---------------- */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          {statsCards.map((stat, i) => (
            <Col xs={24} sm={12} md={6} key={i}>
              <Card loading={statsLoading} style={{ textAlign: "center" }}>
                <Space direction="vertical" align="center" size={6}>
                  <Text strong>{stat.title}</Text>
                  {stat.icon}
                  <Title level={4} style={{ margin: 0 }}>
                    {stat.value}
                  </Title>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* ---------------- TABLE ---------------- */}
        <Card>
          {/* HEADER WITH UPLOAD BUTTON */}
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={5} style={{ margin: 10 }}>
                Payment Records ({filteredData.length})
              </Title>
            </Col>

            <Col>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setIsUploadModalOpen(true)}
              >
                Upload Payment
              </Button>
            </Col>
          </Row>

          {/* FILTERS */}
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={8}>
              <Input
                placeholder="Search"
                prefix={<SearchOutlined />}
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>

            <Col xs={24} md={6}>
              <Select
                placeholder="Payment Status"
                allowClear
                style={{ width: "100%" }}
                onChange={setStatusFilter}
              >
                {Object.keys(statusColorMap).map((status) => (
                  <Option key={status}>{status}</Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} md={6}>
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Select date"
                onChange={setSelectedDate}
              />
            </Col>
          </Row>

          {/* TABLE */}
          <Table
            loading={listLoading}
            columns={columns}
            dataSource={filteredData}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 1000 }}
            locale={{ emptyText: listLoading ? 'Loading payments...' : 'No payments found' }}
          />
        </Card>

        {/* VIEW PAYMENT MODAL */}
        <PaymentProofModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={selectedPayment}
          onSuccess={() => dispatch(fetchPayments())}
        />

        <UploadPaymentModal
          open={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => dispatch(fetchPayments())}
        />
      </div>
    </ConfigProvider>
  );
};

export default PaymentManagement;