import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Select,
  DatePicker,
  Input,
  ConfigProvider,
  theme,
} from "antd";
import {
  EyeOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

import adminTheme from "../../../theme/adminTheme";
import BookFollowupSessionModal from "../modals/BookFollowupSessionModal";
import CompleteFollowupModal from "../modals/CompleteFollowupModal";


const { Title, Text } = Typography;
const { Option } = Select;

const FollowUpManagement = () => {
  const { token } = theme.useToken();

 const [isModalOpen, setIsModalOpen] = useState(false);
 const [rescheduleData, setRescheduleData] = useState(null);
 const [completeModalOpen, setCompleteModalOpen] = useState(false);
 const [selectedRecord, setSelectedRecord] = useState(null);



  
  /* =====================
     DATA (EXTENDED ONLY)
  ====================== */
 const [tableData, setTableData] = useState([
  {
    key: "1",
    sr: 1,
    student: "Amit Sharma",
    program: "Engineering Career Path",
    counsellors: [
      { name: "Dr. Ramesh Gupta", type: "lead" },
      { name: "Ms. Priya Menon", type: "normal" },
    ],
    lastSession: "2026-01-10",
    nextFollowUp: "2026-01-20",
    mode: "Call",
    priority: "High",
    status: "Scheduled",
  },
  {
    key: "2",
    sr: 2,
    student: "Priya Verma",
    program: "Medical Career Guidance",
    counsellors: [{ name: "Dr. Ramesh Gupta", type: "lead" }],
    lastSession: "2026-01-08",
    nextFollowUp: "2026-01-14",
    mode: "WhatsApp",
    priority: "Critical",
    status: "Overdue",
  },
]);


  /* =====================
     TABLE COLUMNS
  ====================== */
  const columns = [
    {
      title: "Sr No",
      dataIndex: "sr",
      width: 70,
    },
    {
      title: "Student Name",
      dataIndex: "student",
    },

    /* 🔹 ADDED */
    {
      title: "Program",
      dataIndex: "program",
    },

    /* 🔹 EXISTING – COUNSELLORS KEPT */
    {
      title: "Counsellors",
      render: (_, record) => (
        <>
          {record.counsellors.map((c, index) => (
            <div key={index} style={{ marginBottom: 6 }}>
              <Text strong>{c.name}</Text>
              <br />
              <Tag
                style={{
                  background:
                    c.type === "lead" ? "#EEF2FF" : "#F1F5F9",
                  color:
                    c.type === "lead"
                      ? token.colorPrimary
                      : token.colorTextSecondary,
                  border: "none",
                  borderRadius: 6,
                }}
              >
                {c.type === "lead" ? "Lead Counsellor" : "Normal Counsellor"}
              </Tag>
            </div>
          ))}
        </>
      ),
    },

    /* 🔹 ADDED */
    {
      title: "Last Session",
      dataIndex: "lastSession",
      render: (date) => (
        <Space>
          <CalendarOutlined />
          <Text type="colorTextSecondary">{date}</Text>
        </Space>
      ),
    },

    /* 🔹 ADDED */
    {
      title: "Next Follow-Up",
      dataIndex: "nextFollowUp",
      render: (date) => (
        <Space>
          <ClockCircleOutlined />
          <Text type="colorTextSecondary">{date}</Text>
        </Space>
      ),
    },

    /* 🔹 EXISTING */
    {
      title: "Mode",
      dataIndex: "mode",
      render: (mode) => (
        <Tag color={mode === "Call" ? "blue" : "purple"}>
          {mode}
        </Tag>
      ),
    },

    /* 🔹 ADDED */
    {
      title: "Priority",
      dataIndex: "priority",
      render: (priority) => {
        const map = {
          High: ["#FEF3C7", "#92400E"],
          Medium: ["#FEF9C3", "#854D0E"],
          Critical: ["#FEE2E2", "#991B1B"],
        };
        return (
          <Tag
            style={{
              background: map[priority][0],
              color: map[priority][1],
              border: "none",
              borderRadius: 8,
              fontWeight: 500,
            }}
          >
            {priority}
          </Tag>
        );
      },
    },

    /* 🔹 EXISTING STATUS (EXTENDED) */
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const map = {
          Completed: {
            color: "success",
            icon: <CheckCircleOutlined />,
          },
          Pending: {
            color: "warning",
            icon: <ClockCircleOutlined />,
          },
          Scheduled: {
            bg: "#E0EAFF",
            color: "#1E40AF",
            icon: <CalendarOutlined />,
          },
          "Due Today": {
            bg: "#FEF3C7",
            color: "#92400E",
            icon: <ExclamationCircleOutlined />,
          },
          Overdue: {
            bg: "#FEE2E2",
            color: "#991B1B",
            icon: <ExclamationCircleOutlined />,
          },
        };

        if (map[status].bg) {
          return (
            <Tag
              icon={map[status].icon}
              style={{
                background: map[status].bg,
                color: map[status].color,
                border: "none",
                borderRadius: 8,
              }}
            >
              {status}
            </Tag>
          );
        }

        return (
          <Tag icon={map[status].icon} color={map[status].color}>
            {status}
          </Tag>
        );
      },
    },

    /* 🔹 EXISTING */
 {
  title: "Action",
  render: (_, record) => (
    <Space>
      <Button icon={<EyeOutlined />} />

      {record.status !== "Completed" && (
        <Button
          type="default"
          onClick={() => {
            setSelectedRecord(record);
            setCompleteModalOpen(true);
          }}
        >
          Mark Completed
        </Button>
      )}
    </Space>
  ),
},

  ];

  return (
    <ConfigProvider theme={adminTheme}>
      <div style={{ padding: 16 }}>
        {/* TITLE */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Col>
            <Title level={4}>Follow-Up Management</Title>
          </Col>
          <Col>
            <Button type="primary" onClick={() => {
  setRescheduleData(null);   // new follow-up
  setIsModalOpen(true);
}}>
  Schedule Follow-Up
</Button>

          </Col>
        </Row>

        {/* STATS */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col md={6}><Card><Text>Total Follow-Ups</Text><Title level={3}>48</Title></Card></Col>
          <Col md={6}><Card><Text>Pending</Text><Title level={3} style={{ color: token.colorWarning }}>18</Title></Card></Col>
          <Col md={6}><Card><Text>Completed</Text><Title level={3} style={{ color: token.colorSuccess }}>30</Title></Card></Col>
          <Col md={6}><Card><Text>Today’s Follow-Ups</Text><Title level={3}>6</Title></Card></Col>
        </Row>

        {/* FILTER + TABLE */}
        <Card>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col md={6}><Input placeholder="Search Student" allowClear /></Col>
            <Col md={6}>
              <Select placeholder="Priority" allowClear style={{ width: "100%" }}>
                <Option value="High">High</Option>
                <Option value="Medium">Medium</Option>
                <Option value="Critical">Critical</Option>
              </Select>
            </Col>
            <Col md={6}>
              <Select placeholder="Status" allowClear style={{ width: "100%" }}>
                <Option value="Scheduled">Scheduled</Option>
                <Option value="Due Today">Due Today</Option>
                <Option value="Overdue">Overdue</Option>
              </Select>
            </Col>
            <Col md={6}><DatePicker style={{ width: "100%" }} /></Col>
          </Row>

          <Table
            rowKey="key"
            columns={columns}
            dataSource={tableData}
            pagination={{ pageSize: 5 }}
             scroll={{ x: "max-content" }}
          />
        </Card>

        <BookFollowupSessionModal
  open={isModalOpen}
  editData={rescheduleData}
  onCancel={() => setIsModalOpen(false)}
  onSubmit={(data) => {
    console.log("Follow-up data:", data);
    setIsModalOpen(false);
  }}
/>

<CompleteFollowupModal
  open={completeModalOpen}
  record={selectedRecord}
  onCancel={() => setCompleteModalOpen(false)}
  onSubmit={(completedData) => {
    console.log("Completed Follow-up:", completedData);

    // 🔥 STATUS MAPPING
    const statusMap = {
      Completed: "Completed",
      "No Answer": "Pending",
      Rescheduled: "Scheduled",
      "Not Interested": "Closed",
    };

    const newStatus = statusMap[completedData.outcome];

    setTableData((prev) =>
      prev.map((row) => {
        if (row.key === completedData.followupId) {
          return {
            ...row,
            status: newStatus,
            priority: completedData.priority || row.priority,
            mode: completedData.mode || row.mode,

            // Update next follow-up if required
            nextFollowUp:
              completedData.nextRequired === "Yes" &&
              completedData.nextDate
                ? completedData.nextDate.format("YYYY-MM-DD")
                : row.nextFollowUp,

            // Update last session to today
            lastSession: new Date().toISOString().slice(0, 10),
          };
        }
        return row;
      })
    );

    setCompleteModalOpen(false);
  }}
/>


      </div>
    </ConfigProvider>
  );
};

export default FollowUpManagement; 