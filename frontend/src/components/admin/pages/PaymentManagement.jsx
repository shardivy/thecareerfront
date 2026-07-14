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
  Tabs,
  Modal,
  message,
  Tooltip
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
  BellOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import adminTheme from "../../../theme/adminTheme";
import PaymentProofModal from "../modals/PaymentProofModal";
import UploadPaymentModal from "../modals/UploadPaymentModal";
import { fetchPaymentStats, fetchPayments, sendPaymentReminder } from "../../../adminSlices/paymentSlice";
import { fetchActivePrograms } from "../../../adminSlices/programSlice";
import { fetchPackagesByProgram, clearPackages } from "../../../adminSlices/packageSlice";
import { sendHandholdingPaymentReminder } from "../../../hhSlices/handholdingPaymentSlice";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const PaymentManagement = () => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [programFilter, setProgramFilter] = useState(null);
  const [serviceFilter, setServiceFilter] = useState(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [reminderLoadingId, setReminderLoadingId] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [activeTab, setActiveTab] = useState("normal");
  const dispatch = useDispatch();

  const { stats, statsLoading, list, listLoading } = useSelector(
    (state) => state.payment
  );
  const { activeList: activePrograms = [], loading: programLoading } = useSelector(
    (state) => state.programs
  );
  const { list: packages = [], loading: packageLoading } = useSelector(
    (state) => state.packages
  );

  const role = localStorage.getItem("adminRole");

  useEffect(() => {
    dispatch(fetchPaymentStats());
    dispatch(fetchPayments());
    dispatch(fetchActivePrograms());
  }, [dispatch]);

  useEffect(() => {
    setServiceFilter(null);

    if (programFilter) {
      dispatch(fetchPackagesByProgram(programFilter));
    } else {
      dispatch(clearPackages());
    }
  }, [dispatch, programFilter]);

  // Debug: Log the payment list
  // useEffect(() => {
  //   console.log("📊 Payment list in component:", list);
  //   if (list.length > 0) {
  //     console.log("🔍 First payment item:", list[0]);
  //     console.log("🔍 Date fields in first item:", {
  //       payment_date: list[0].payment_date,
  //       date: list[0].date,
  //       original_payment_date: list[0].original_payment_date,
  //       original_created_at: list[0].original_created_at
  //     });
  //   }
  // }, [list]);

  const handleEditPayment = (record) => {
    setSelectedPayment(record);
    setIsModalOpen(true);
  };

  const statsCards = [
    ...((role === "superadmin")
      ? [
        {
          title: "Expected Revenue",
          amount: stats?.total_expected_collection?.expected_amount ?? 0,
          users: stats?.total_expected_collection?.total_users ?? 0,
          icon: <DollarCircleOutlined style={{ fontSize: 28, color: "#722ed1" }} />,
        },
        {
          title: "Total Collected",
          amount: stats?.total_collected ?? 0,
          users:
            (stats?.partial_paid?.total_users ?? 0) +
            (stats?.fully_paid?.total_users ?? 0),
          icon: <DollarCircleOutlined style={{ fontSize: 28, color: "#52c41a" }} />,
        },


        {
          title: "Partial Payments",
          amount: stats?.partial_paid?.total_amount ?? 0,
          users: stats?.partial_paid?.total_users ?? 0,
          icon: <PayCircleOutlined style={{ fontSize: 28, color: "#faad14" }} />,
        },
        {
          title: "Fully Paid",
          amount: stats?.fully_paid?.total_amount ?? 0,
          users: stats?.fully_paid?.total_users ?? 0,
          icon: <CheckCircleOutlined style={{ fontSize: 28, color: "#13c2c2" }} />,
        },
        {
          title: "Pending Verification",
          amount: stats?.verification_pending?.total_amount ?? 0,
          users: stats?.verification_pending?.total_users ?? 0,
          icon: <FileTextOutlined style={{ fontSize: 28, color: "#fa541c" }} />,
        },
      ]
      : []),

    ...((role === "admin")
      ? [
        {
          title: "Partial Payments",
          amount: null,
          users: stats?.partial_paid?.total_users ?? 0,
          icon: (
            <PayCircleOutlined
              style={{ fontSize: 28, color: "#faad14" }}
            />
          ),
        },
        {
          title: "Fully Paid",
          amount: null,
          users: stats?.fully_paid?.total_users ?? 0,
          icon: (
            <CheckCircleOutlined
              style={{ fontSize: 28, color: "#13c2c2" }}
            />
          ),
        },
        {
          title: "Pending Verification",
          amount: null,
          users: stats?.verification_pending?.total_users ?? 0,
          icon: (
            <FileTextOutlined
              style={{ fontSize: 28, color: "#fa541c" }}
            />
          ),
        },
      ]
      : []),
  ];


  /* ---------------- STATUS COLORS ---------------- */
  const statusColorMap = {
    "Fully Paid": "success",
    "Partial Paid": "warning",
    "Verification Pending": "processing",
    "Not Paid": "error",
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
      // console.log(`📋 Processing payment ${idx} for table:`, p);

      // const cleanName = extractName(p.user_name);
      const packageName = Array.isArray(p.packages)
        ? p.packages.join(", ")
        : p.package_name || p.package || "N/A";
      const programName = Array.isArray(p.programs)
        ? p.programs.join(", ")
        : p.program_name || p.program || "N/A";

      const programIds = Array.isArray(p.program_ids)
        ? p.program_ids
        : p.program_id
        ? [p.program_id]
        : [];
      const packageIds = Array.isArray(p.package_ids)
        ? p.package_ids
        : p.package_id
        ? [p.package_id]
        : [];

      // ✅ Paid + Total
      const paidAmount = Number(p.total_paid || 0);
      const packagePrice = Number(p.package_price || 0);

      const status = toTitle(p.payment_status);
      const paymentMethod = (p.payment_method || "-").toString().toUpperCase();
      const date = p.date || p.payment_date || "-";
      const txn = p.transaction_id || p.txn || "-";

      // Prefer arrays from the formatted item, otherwise fall back to the raw API payload
      const programsArr = Array.isArray(p.programs)
        ? p.programs
        : Array.isArray(p.originalData?.programs)
        ? p.originalData.programs
        : p.program_name
        ? [p.program_name]
        : [];

      const packagesArr = Array.isArray(p.packages)
        ? p.packages
        : Array.isArray(p.originalData?.packages)
        ? p.originalData.packages
        : p.package_name
        ? [p.package_name]
        : [];

      // debug first few rows to help trace missing backend fields
      if (idx < 3) {
        // eslint-disable-next-line no-console
        // console.debug("payment-row-debug", { idx, programsArr, packagesArr, raw: p });
      }

      return {
        key: p.payment_id || p.id || `payment-${idx}`,
        id: p.payment_id || p.id,
        name: p.user_name || "N/A",   // ✅ Keep full name with PE26
        email: p.email || "-",
        programIds,
        packageIds,
        package_id: packageIds[0] || p.package_id,  // ✅ Add singular package_id for modal
        programs: programsArr,
        packages: packagesArr,

        // ✅ Store both separately (better than merging string)
        paidAmount,
        packagePrice,

        status,
        paymentMethod,
        date,
        txn,
        proof: !!(p.proof_file_url || p.proof_file || p.receipt_url),
        is_handholding: p.is_handholding,
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

    const matchesProgram = programFilter
      ? Array.isArray(item.programIds)
        ? item.programIds.includes(programFilter)
        : item.programId === programFilter
      : true;

    const matchesService = serviceFilter
      ? Array.isArray(item.packageIds)
        ? item.packageIds.includes(serviceFilter)
        : item.packageId === serviceFilter
      : true;

    const matchesPaymentMethod = paymentMethodFilter
      ? item.paymentMethod === paymentMethodFilter
      : true;

    const matchesDateRange =
      selectedDateRange && selectedDateRange.length === 2
        ? (() => {
          if (item.date === "-") return false;
          const itemDate = dayjs(item.date);
          if (!itemDate.isValid()) return false;

          const [startDate, endDate] = selectedDateRange;
          return (
            itemDate.valueOf() >= startDate.startOf("day").valueOf() &&
            itemDate.valueOf() <= endDate.endOf("day").valueOf()
          );
        })()
        : true;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProgram &&
      matchesService &&
      matchesPaymentMethod &&
      matchesDateRange
    );
  });

  const tabData = filteredData.filter((item) =>
    activeTab === "handholding"
      ? item.is_handholding === true
      : item.is_handholding !== true
  );

  const uniquePrograms = [
    ...new Set(
      activePrograms
        .filter((program) => program?.id && program?.name && program.name !== "N/A" && program.name !== "-")
        .map((program) => JSON.stringify({ value: program.id, label: program.name }))
    ),
  ].map((item) => JSON.parse(item));
  const uniqueServices = [
    ...new Set(
      packages
        .filter((pkg) => pkg?.id && pkg?.name && pkg.name !== "N/A" && pkg.name !== "-")
        .map((pkg) => JSON.stringify({ value: pkg.id, label: pkg.name }))
    ),
  ].map((item) => JSON.parse(item));
  const uniquePaymentMethods = [
    { label: "Cash", value: "CASH" },
    { label: "UPI", value: "UPI" },
  ];

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


  const handleSendReminder = (record) => {
    const id =
      activeTab === "handholding"
        ? record.originalData?.handholding_participant_id
        : record.originalData?.student_id;

    if (!id) {
      message.error("ID not found");
      return;
    }

    const modal = Modal.confirm({
      title: "Send Payment Reminder?",
      content: `Send reminder to ${record.name}?`,
      okText: "Yes",
      cancelText: "No",
      centered: true,
      maskClosable: true,

      onOk: async () => {
        try {
          setReminderLoadingId(id); // ✅ FIXED

          const res =
            activeTab === "handholding"
              ? await dispatch(sendHandholdingPaymentReminder(id)).unwrap()
              : await dispatch(sendPaymentReminder(id)).unwrap();

          message.success(res?.message || "Reminder sent successfully");

          setReminderLoadingId(null);
          modal.destroy();
        } catch (error) {
          message.error(error || "Failed to send reminder");
          setReminderLoadingId(null);
        }
      },
    });
  };


  const handleBulkSendReminder = async () => {
    if (selectedRowKeys.length === 0) return;

    setReminderLoadingId("bulk");

    try {
      const selectedPayments = filteredData.filter((p) =>
        selectedRowKeys.includes(p.key)
      );

      const ids = selectedPayments
        .map((p) =>
          activeTab === "handholding"
            ? p.originalData?.handholding_participant_id
            : p.originalData?.student_id
        )
        .filter(Boolean);

      if (ids.length === 0) {
        message.error("No valid IDs found");
        return;
      }

      await Promise.all(
        ids.map((id) =>
          activeTab === "handholding"
            ? dispatch(sendHandholdingPaymentReminder(id)).unwrap()
            : dispatch(sendPaymentReminder(id)).unwrap()
        )
      );

      const label = activeTab === "handholding" ? "users" : "students";

      message.success(`Reminder sent to ${ids.length} ${label}!`);
      setSelectedRowKeys([]);
    } catch (error) {
      message.error("Failed to send reminders");
    } finally {
      setReminderLoadingId(null);
    }
  };




  /* ---------------- TABLE COLUMNS ---------------- */
  const columns = [
    {
      title: "Sr. No.",
      render: (_, __, index) =>
        (currentPage - 1) * pageSize + index + 1,
      width: 50,
    },
    {
      title: "Name / Email",
      render: (_, record) => (
        <div>
          <Text strong>{record.name || "N/A"}</Text>
          <br />
          <Text
            type="colorTextSecondary"
          >
            {record.email || "-"}
          </Text>
        </div>
      ),
      width: 140,
    },

   {
  title: "Program / Counselling Service",
  width: 300,
  render: (_, record) => {
    const programs = record.programs || [];
    const packages = record.packages || [];

    if (!programs.length) {
      return <Text type="colorTextSecondary">N/A</Text>;
    }

    return (
      <div>
        {programs.map((program, index) => (
          <div
            key={index}
            style={{
              marginBottom: 10,
              borderBottom:
                index !== programs.length - 1
                  ? "1px solid #f0f0f0"
                  : "none",
              paddingBottom: 6,
            }}
          >
            <Text strong>
              {index + 1}. {program}
            </Text>

            <br />

            <Text type="colorTextSecondary">
              {packages[index] || "-"}
            </Text>
          </div>
        ))}
      </div>
    );
  },
},

    {
      title: "Fees Paid",
      width: 100,
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
      width: 100,
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
      width: 100,
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
          // console.error("❌ Error formatting display date:", date, e);
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
      title: "Action",
      render: (_, record) => {
        const id =
          activeTab === "handholding"
            ? record.originalData?.handholding_participant_id
            : record.originalData?.student_id;

        // ✅ NOT PAID → Upload only
        if (record.status === "Not Paid") {
          return (
            <Space>
              <Tooltip title="Upload">
                <Button
                  size="large"
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => {
                    setSelectedPayment({ ...record, type: activeTab });
                    setIsUploadModalOpen(true);
                  }}
                >
                  {/* Upload Payment */}
                </Button>
              </Tooltip>

              <Tooltip title="Send Reminder">
                <Button
                  size="large"
                  icon={<BellOutlined />}
                  disabled={!id}
                  loading={reminderLoadingId === id}
                  onClick={() => handleSendReminder(record)}
                />
              </Tooltip>
            </Space>
          );
        }

        // ✅ PARTIAL PAID → Upload + View + Edit
        if (record.status === "Partial Paid") {
          return (
            <Space>
              <Tooltip title="Upload">
                <Button
                  size="large"
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => {
                    setSelectedPayment({ ...record, type: activeTab });
                    setIsUploadModalOpen(true);
                  }}
                >
                  {/* Upload Payment */}
                </Button>
              </Tooltip>

              <Tooltip title="Send Reminder">
                <Button
                  size="large"
                  icon={<BellOutlined />}
                  onClick={() => handleSendReminder(record)}
                >
                  {/* Send Reminder */}
                </Button>
              </Tooltip>

              <Tooltip title="View">
                <Button
                  size="large"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setSelectedPayment({
                      ...record,
                      mode: "view",
                      type: activeTab, // ✅ ADD THIS
                    });
                    setIsModalOpen(true);
                  }}
                >
                  {/* View */}
                </Button>
              </Tooltip>

              <Tooltip title="Edit">
                <Button
                  size="large"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setSelectedPayment({ ...record, mode: "edit" });
                    setIsModalOpen(true);
                  }}
                >
                  {/* Edit */}
                </Button>
              </Tooltip>
            </Space>
          );
        }

        // ✅ Verification Pending → Verify
        if (record.status === "Verification Pending") {
          return (
            <Tooltip title="Verify Payment">
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
            </Tooltip>
          );
        }

        // ✅ Other statuses → View + Edit
        return (
          <Space>
            <Tooltip title="View">
              <Button
                size="large"
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedPayment({
                    ...record,
                    mode: "view",
                    type: activeTab, // ✅ ADD THIS
                  });
                  setIsModalOpen(true);
                }}
              >
                {/* View */}
              </Button>
            </Tooltip>

            <Tooltip title="Edit">
              <Button
                size="large"
                icon={<EditOutlined />}
                onClick={() => {
                  setSelectedPayment({ ...record, mode: "edit" });
                  setIsModalOpen(true);
                }}
              >
                {/* Edit */}
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: "Transaction ID",
      dataIndex: "txn",
      render: (txn) => truncateAfterFive(txn),
    },


  ];

  const renderTableContent = (data) => (
    <>
      {/* HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={5} style={{ margin: 10 }}>
            Payment Records ({data.length})
          </Title>
        </Col>

        <Col>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => {
              setSelectedPayment({ type: activeTab });
              setIsUploadModalOpen(true);
            }}
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

        <Col xs={24} md={4}>
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

        <Col xs={24} md={4}>
          <Select
            placeholder="Program"
            allowClear
            loading={programLoading}
            style={{ width: "100%" }}
            value={programFilter}
            onChange={setProgramFilter}
            options={uniquePrograms}
          />
        </Col>

        <Col xs={24} md={4}>
          <Select
            placeholder="Counselling Service"
            allowClear
            loading={packageLoading}
            disabled={!programFilter}
            style={{ width: "100%" }}
            value={serviceFilter}
            onChange={setServiceFilter}
            options={uniqueServices}
          />
        </Col>

        <Col xs={24} md={4}>
          <Select
            placeholder="Payment Method"
            allowClear
            style={{ width: "100%" }}
            value={paymentMethodFilter}
            onChange={setPaymentMethodFilter}
            options={uniquePaymentMethods}

          />
        </Col>

        <Col xs={24} md={6}>
          <RangePicker
            style={{ width: "100%" }}
            value={selectedDateRange}
            onChange={setSelectedDateRange}
            allowClear
          />
        </Col>

        {["Not Paid", "Partial Paid"].includes(statusFilter) && (
          <Col xs={24} md={4}>
            <Button
              type="primary"
              icon={<BellOutlined />}
              disabled={selectedRowKeys.length === 0}
              loading={reminderLoadingId === "bulk"}
              onClick={handleBulkSendReminder}
              style={{
                width: "100%",
                backgroundColor:
                  selectedRowKeys.length === 0 ? "#f5f5f5" : "#fa8c16",
                borderColor:
                  selectedRowKeys.length === 0 ? "#d9d9d9" : "#fa8c16",
                color:
                  selectedRowKeys.length === 0
                    ? "rgba(0,0,0,0.25)"
                    : "#fff",
              }}
            >
              Send Reminder
            </Button>
          </Col>
        )}
      </Row>

      {/* TABLE */}
      <Table
        rowSelection={
          ["Not Paid", "Partial Paid"].includes(statusFilter)
            ? {
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
              getCheckboxProps: (record) => ({
                disabled: !["Not Paid", "Partial Paid"].includes(
                  record.status
                ),
              }),
            }
            : null
        }
        loading={listLoading}
        columns={columns}
        dataSource={data}
        pagination={{
          current: currentPage,
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50],
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
        scroll={{ x: "max-content" }}
        locale={{
          emptyText: listLoading
            ? "Loading payments..."
            : "No payments found",
        }}
      />
    </>
  );

  return (
    <ConfigProvider theme={adminTheme}>
      <div style={{ padding: 16 }}>
        <Title level={3}>Payment Management</Title>

        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          {statsCards.map((stat, i) => (
            <Col xs={24} sm={12} md={6} key={i}>
              <Card
                loading={statsLoading}
                bodyStyle={{ padding: "18px 12px", textAlign: "center" }}
              >
                <Text type="colorTextSecondary" style={{ fontSize: 16 }}>
                  {stat.title}
                </Text>

                {/* <Title level={3} style={{ margin: "6px 0" }}>
                  ₹ {stat.amount.toLocaleString()}
                </Title> */}

                {stat.amount !== null && stat.amount !== undefined ? (
                  // SUPERADMIN VIEW → SHOW AMOUNT BIG
                  <Title level={3} style={{ margin: "6px 0" }}>
                    ₹ {Number(stat.amount).toLocaleString("en-IN")}
                  </Title>
                ) : (
                  // ADMIN VIEW → SHOW USERS BIG
                  <Title level={3} style={{ margin: "6px 0" }}>
                    {stat.users} Users
                  </Title>
                )}


                {stat.amount !== null && stat.amount !== undefined && (
                  <Text type="colorTextSecondary" style={{ fontSize: 12 }}>
                    {stat.users} Users
                  </Text>
                )}
              </Card>
            </Col>
          ))}
        </Row>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>


          {/* 🔹 TAB 1: NORMAL PAYMENTS */}
          <Tabs.TabPane tab="Student Payments" key="normal">
            <Card>
              {renderTableContent(
                filteredData.filter(
                  (item) => item.is_handholding !== true
                )
              )}
            </Card>
          </Tabs.TabPane>

          {/* 🔹 TAB 2: HANDHOLDING PAYMENTS */}
          <Tabs.TabPane tab="Handholding Payments" key="handholding">
            <Card>
              {renderTableContent(
                filteredData.filter(
                  (item) => item.is_handholding === true
                )
              )}
            </Card>
          </Tabs.TabPane>

        </Tabs>




        {/* VIEW PAYMENT MODAL */}
        <PaymentProofModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={selectedPayment}
          onSuccess={() => dispatch(fetchPayments())}
        />

        <UploadPaymentModal
          open={isUploadModalOpen}
          paymentData={selectedPayment}
          onClose={() => {
            setSelectedPayment(null);
            setIsUploadModalOpen(false);
          }}
          onSuccess={() => dispatch(fetchPayments())}
        />
      </div>
    </ConfigProvider>
  );
};

export default PaymentManagement;
