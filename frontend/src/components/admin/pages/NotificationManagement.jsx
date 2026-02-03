import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Switch,
  Tabs,
  DatePicker,
  message,
} from "antd";
import {
  BellOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  EditOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import adminTheme from "../../../theme/adminTheme";
import CreateRuleModal from "../modals/CreateRuleModal";
import CreateTemplateModal from "../modals/CreateTemplateModal";
import SendNotificationModal from "../modals/SendNotificationModal";

const { Title, Text } = Typography;
const { Option } = Select;

/* ----------------- HELPERS ----------------- */
const searchAllFields = (record, search) =>
  Object.values(record)
    .join(" ")
    .toLowerCase()
    .includes(search.toLowerCase());

/* ----------------- STATS ----------------- */
const stats = [
  { title: "Total Notifications", value: 64, icon: <BellOutlined style={{ color: adminTheme.token.colorPrimary }} /> },
  { title: "Active Automations", value: 38, icon: <ThunderboltOutlined style={{ color: adminTheme.token.colorPrimary }} /> },
  // { title: "Scheduled", value: 18, icon: <CheckCircleOutlined style={{ color: adminTheme.token.colorInfo }} /> },
  { title: "Delivered",value: 8, icon: <CheckCircleOutlined style={{ color: adminTheme.token.colorPrimary }}  /> },
  { title: "Failed", value: 8, icon: <CloseCircleOutlined style={{ color: adminTheme.token.colorPrimary }} /> },
];

/* ----------------- DATA ----------------- */
const notificationRules = [
  { key: 1, name: "Report Uploaded", type: "Email", trigger: "On Report Upload", status: "Active", lastRun: "2026-01-20" },
  { key: 2, name: "Payment Reminder", type: "WhatsApp", trigger: "Payment Pending", status: "Inactive", lastRun: "2026-01-18" },
  { key: 3, name: "Exam Completion", type: "SMS", trigger: "Exam Completed", status: "Active", lastRun: "2026-01-22" },
];

const templatesData = [
  { key: 1, title: "Payment Reminder Template", message: "Hi {name}, your payment is pending.", type: "WhatsApp", updatedAt: "2026-01-15" },
  { key: 2, title: "Report Upload Email", message: "Hi {name}, your report has been uploaded.", type: "Email", updatedAt: "2026-01-18" },
];

const usersList = [
  { id: "U1", name: "Rajesh Kumar" },
  { id: "U2", name: "Priya Sharma" },
  { id: "U3", name: "Amit Verma" },
];

/* ----------------- COLORS ----------------- */
const statusColorMap = {
  Active: adminTheme.token.colorSuccess,
  Inactive: adminTheme.token.colorError,
  Delivered: adminTheme.token.colorSuccess,
  Failed: adminTheme.token.colorError,
};

const typeColorMap = {
  Email: adminTheme.token.colorPrimary,
  SMS: adminTheme.token.colorInfo,
  WhatsApp: adminTheme.token.colorSuccess,
};

/* ----------------- COMPONENT ----------------- */
const NotificationManagement = () => {
  /* ----------------- STATE ----------------- */
  const [ruleSearch, setRuleSearch] = useState("");
  const [ruleType, setRuleType] = useState(null);
  const [ruleStatus, setRuleStatus] = useState(null);

  const [recentSearch, setRecentSearch] = useState("");
  const [recentType, setRecentType] = useState(null);
  const [recentDate, setRecentDate] = useState(null);

  const [templateSearch, setTemplateSearch] = useState("");
  const [templateType, setTemplateType] = useState(null);
  const [templateDate, setTemplateDate] = useState(null);

  const [isRuleModalVisible, setIsRuleModalVisible] = useState(false);
  const [rules, setRules] = useState(notificationRules);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleModalMode, setRuleModalMode] = useState("create"); // create | edit | view

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState(templatesData);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateModalMode, setTemplateModalMode] = useState("create"); // create | edit | view

  const [recentNotifications, setRecentNotifications] = useState([]);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);


  /* ----------------- SEND NOTIFICATION ----------------- */
  const sendNotification = ({ template, userIds }) => {
    const selectedUsers = usersList.filter((u) => userIds.includes(u.id));

    const newNotifications = selectedUsers.map((user) => ({
      key: Date.now() + Math.random(),
      title: template.title,
      studentName: user.name,
      type: template.type,
      status: Math.random() > 0.1 ? "Delivered" : "Failed",
      sentAt: dayjs().format("YYYY-MM-DD hh:mm A"),
    }));

    setRecentNotifications((prev) => [...newNotifications, ...prev]);
    message.success(`Notification sent to ${selectedUsers.length} user(s)`);
  };

  /* ----------------- FILTERED DATA ----------------- */
  const filteredRules = rules.filter(
    (r) =>
      searchAllFields(r, ruleSearch) &&
      (!ruleType || r.type === ruleType) &&
      (!ruleStatus || r.status === ruleStatus)
  );

  const filteredRecent = recentNotifications.filter(
    (r) =>
      searchAllFields(r, recentSearch) &&
      (!recentType || r.type === recentType) &&
      (!recentDate || dayjs(r.sentAt).format("YYYY-MM-DD") === dayjs(recentDate).format("YYYY-MM-DD"))
  );

  const filteredTemplates = templates.filter(
    (t) =>
      searchAllFields(t, templateSearch) &&
      (!templateType || t.type === templateType) &&
      (!templateDate || dayjs(t.updatedAt).format("YYYY-MM-DD") === dayjs(templateDate).format("YYYY-MM-DD"))
  );

  /* ----------------- COLUMNS ----------------- */
  const ruleColumns = [
    { title: "Sr. No", render: (_, __, i) => i + 1 },
    { title: "Rule Name", dataIndex: "name", render: (t) => <Text strong>{t}</Text> },
    { title: "Type", dataIndex: "type", render: (t) => <Tag color={typeColorMap[t]}>{t}</Tag> },
    { title: "Trigger", dataIndex: "trigger" },
    {
      title: "Status",
      dataIndex: "status",
      render: (status, record) => (
        <Space>
          <Switch
            size="small"
            checked={status === "Active"}
            onChange={(checked) => {
              setRules((prev) =>
                prev.map((r) =>
                  r.key === record.key ? { ...r, status: checked ? "Active" : "Inactive" } : r
                )
              );
            }}
          />
          <Tag color={statusColorMap[status]}>{status}</Tag>
        </Space>
      ),
    },
    {
      title: "Last Run",
      dataIndex: "lastRun",
      render: (value) =>
        value ? <Text>{dayjs(value).format("DD MMM YYYY, hh:mm A")}</Text> : <Text type="secondary">Never</Text>,
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setEditingRule(record);
              setRuleModalMode("view");
              setIsRuleModalVisible(true);
            }}
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRule(record);
              setRuleModalMode("edit");
              setIsRuleModalVisible(true);
            }}
          />
        </Space>
      ),
    },
  ];

  const recentColumns = [
    { title: "Sr. No", render: (_, __, i) => i + 1 },
    { title: "Notification", dataIndex: "title" },
    { title: "Student Name", dataIndex: "studentName" },
    { title: "Type", dataIndex: "type", render: (t) => <Tag color={typeColorMap[t]}>{t}</Tag> },
    { title: "Sent At", dataIndex: "sentAt" },
    { title: "Status", dataIndex: "status", render: (s) => <Tag color={statusColorMap[s]}>{s}</Tag> },
  ];

  const templateColumns = [
    { title: "Sr. No", render: (_, __, i) => i + 1 },
    { title: "Template Name", dataIndex: "title", render: (t) => <Text strong>{t}</Text> },
    { title: "Message", dataIndex: "message", render: (m) => <Text ellipsis={{ tooltip: m }}>{m}</Text> },
    { title: "Last Updated", dataIndex: "updatedAt" },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
  size="small"
  type="primary"
  onClick={() => {
    setSelectedTemplate(record);
    setIsSendModalOpen(true);
  }}
>
  Send
</Button>

          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setEditingTemplate(record);
              setTemplateModalMode("view");
              setIsTemplateModalOpen(true);
            }}
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingTemplate(record);
              setTemplateModalMode("edit");
              setIsTemplateModalOpen(true);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Title level={3}>Notification Management</Title>

      {/* STATS */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {stats.map((s, i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <Card style={{ textAlign: "center" }}>
              <Text>{s.title}</Text>
              <div style={{ fontSize: 26, margin: "8px 0" }}>{s.icon}</div>
              <Title level={3}>{s.value}</Title>
            </Card>
          </Col>
        ))}
      </Row>

      {/* TABS */}
      <Tabs style={{ marginTop: 24 }} tabBarGutter={16}>

           {/* RECENT */}
        <Tabs.TabPane tab={`Recent Notifications (${filteredRecent.length})`} key="recent">
          <Card>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="Search..."
                  onChange={(e) => setRecentSearch(e.target.value)}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select allowClear placeholder="Type" style={{ width: "100%" }} onChange={setRecentType}>
                  <Option value="Email">Email</Option>
                  <Option value="SMS">SMS</Option>
                  <Option value="WhatsApp">WhatsApp</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <DatePicker style={{ width: "100%" }} onChange={setRecentDate} />
              </Col>
            </Row>

            <Table
              columns={recentColumns}
              dataSource={filteredRecent}
              pagination={{ pageSize: 5 }}
              scroll={{ x: "max-content" }}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Tabs.TabPane>

        
        {/* TEMPLATES */}
        <Tabs.TabPane tab={`Templates (${filteredTemplates.length})`} key="templates">
          <Card>
            <Row
              gutter={[16, 16]}
              align="middle"
              justify="space-between"
              style={{ marginBottom: 16 }}
            >
              <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="Search template..."
                  onChange={(e) => setTemplateSearch(e.target.value)}
                />
              </Col>

              <Col xs={24} sm={12} md={6} lg={4} xl={3} style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="primary"
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateModalMode("create");
                    setIsTemplateModalOpen(true);
                  }}
                >
                  Create Template
                </Button>
              </Col>
            </Row>

            <Table
              columns={templateColumns}
              dataSource={filteredTemplates}
              pagination={{ pageSize: 5 }}
              scroll={{ x: "max-content" }}
            />
          </Card>
        </Tabs.TabPane>

        {/* RULES */}
        <Tabs.TabPane tab={`Notification Rules (${filteredRules.length})`} key="rules">
          <Card>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="Search..."
                  onChange={(e) => setRuleSearch(e.target.value)}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select allowClear placeholder="Type" style={{ width: "100%" }} onChange={setRuleType}>
                  <Option value="Email">Email</Option>
                  <Option value="SMS">SMS</Option>
                  <Option value="WhatsApp">WhatsApp</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select allowClear placeholder="Status" style={{ width: "100%" }} onChange={setRuleStatus}>
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Button
                  type="primary"
                  block
                  onClick={() => {
                    setEditingRule(null);
                    setRuleModalMode("create");
                    setIsRuleModalVisible(true);
                  }}
                >
                  Create Rule
                </Button>
              </Col>
            </Row>

            <Table
              columns={ruleColumns}
              dataSource={filteredRules}
              pagination={{ pageSize: 5 }}
              scroll={{ x: "max-content" }}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Tabs.TabPane>

     

      </Tabs>

      {/* MODALS */}
      <CreateRuleModal
        visible={isRuleModalVisible}
        mode={ruleModalMode}
        initialData={editingRule}
        onClose={() => {
          setIsRuleModalVisible(false);
          setEditingRule(null);
        }}
        onCreate={(newRule) => setRules([newRule, ...rules])}
        onUpdate={(updatedRule) => setRules((prev) => prev.map((r) => (r.key === updatedRule.key ? updatedRule : r)))}
      />

      <CreateTemplateModal
        visible={isTemplateModalOpen}
        mode={templateModalMode}
        initialData={editingTemplate}
        onClose={() => setIsTemplateModalOpen(false)}
        onCreate={(newTemplate) => setTemplates([newTemplate, ...templates])}
        onUpdate={(updatedTemplate) => setTemplates((prev) => prev.map((t) => (t.key === updatedTemplate.key ? updatedTemplate : t)))}
      />


      <SendNotificationModal
  visible={isSendModalOpen}
  template={selectedTemplate}
  users={usersList}
  onClose={() => setIsSendModalOpen(false)}
  onSend={({ template, userIds }) => {
    const newNotifications = userIds.map((id) => {
      const user = usersList.find((u) => u.id === id);
      return {
        key: Date.now() + Math.random(),
        title: template.title,
        studentName: user.name,
        type: template.type,
        status: Math.random() > 0.1 ? "Delivered" : "Failed",
        sentAt: dayjs().format("YYYY-MM-DD hh:mm A"),
      };
    });

    setRecentNotifications((prev) => [...newNotifications, ...prev]);
    message.success(`Notification sent to ${userIds.length} user(s)`);
    setIsSendModalOpen(false);
  }}
/>

    </div>
  );
};

export default NotificationManagement;
