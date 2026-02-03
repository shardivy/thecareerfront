import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Typography,
  Card,
} from "antd";
import { MessageOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;
const { Text, Title } = Typography;

const BookFollowupSessionModal = ({ open, onCancel, onSubmit, editData }) => {
  const [form] = Form.useForm();

  /* =====================
     PREFILL FOR EDIT
  ====================== */
  useEffect(() => {
    if (editData) {
      form.setFieldsValue({
        studentId: editData.student || undefined,
        leadCounsellorId: editData.counsellors?.find(c => c.type === "lead")?.name,
        normalCounsellorId: editData.counsellors?.find(c => c.type === "normal")?.name,
        followUpDate: editData.nextFollowUp
          ? dayjs(editData.nextFollowUp)
          : null,
        priority: editData.priority || undefined,
        notes: "",
      });
    } else {
      form.resetFields();
    }
  }, [editData, form]);

  /* =====================
     SUBMIT
  ====================== */
  const handleFinish = (values) => {
    const payload = {
      studentId: values.studentId,
      counsellors: [
        { type: "lead", id: values.leadCounsellorId },
        ...(values.normalCounsellorId
          ? [{ type: "normal", id: values.normalCounsellorId }]
          : []),
      ],
      followUpDate: values.followUpDate?.format("YYYY-MM-DD"),
      priority: values.priority,
      notes: values.notes,
    };

    onSubmit(payload);
    form.resetFields();
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
      width={720}
      destroyOnClose
    >
      {/* HEADER */}
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 4 }}>
          Schedule Follow-Up Session
        </Title>

      </div>

      <Form layout="vertical" form={form} onFinish={handleFinish}>
        {/* Select Student */}
        <Form.Item
          label="Select Student Name"
          name="studentId"
          rules={[{ required: true, message: "Please select a student" }]}
        >
          <Select placeholder="Choose student" allowClear>
            <Option value="Amit Sharma">Amit Sharma</Option>
            <Option value="Priya Verma">Priya Verma</Option>
          </Select>
        </Form.Item>

        {/* COUNSELLORS - SAME LINE */}
        <Row gutter={16}>
          {/* Lead Counsellor (REQUIRED) */}
          <Col span={12}>
            <Form.Item
              label="Lead Counsellor"
              name="leadCounsellorId"
              rules={[
                { required: true, message: "Please select lead counsellor" },
              ]}
            >
              <Select placeholder="Select lead counsellor" allowClear>
                <Option value="Dr. Ramesh Gupta">Dr. Ramesh Gupta</Option>
                <Option value="Dr. Neha Singh">Dr. Neha Singh</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Normal Counsellor (OPTIONAL) */}
          <Col span={12}>
            <Form.Item
              label="Normal Counsellor (Optional)"
              name="normalCounsellorId"
            >
              <Select placeholder="Select normal counsellor" allowClear>
                <Option value="Ms. Priya Menon">Ms. Priya Menon</Option>
                <Option value="Mr. Rahul Verma">Mr. Rahul Verma</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* DATE + PRIORITY */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Follow-Up Date"
              name="followUpDate"
              rules={[
                { required: true, message: "Please select follow-up date" },
              ]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Priority"
              name="priority"
              rules={[
                { required: true, message: "Please select priority" },
              ]}
            >
              <Select placeholder="Select priority" allowClear>
                <Option value="High">High</Option>
                <Option value="Medium">Medium</Option>
                <Option value="Critical">Critical</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Notes / Agenda */}
        <Form.Item label="Notes / Agenda" name="notes">
          <Input.TextArea
            rows={4}
            placeholder="What needs to be discussed in this follow-up?"
          />
        </Form.Item>

        {/* Automated Reminders Info */}
        <Card
          bordered={false}
          style={{
            background: "#F5F9FF",
            border: "1px solid #D6E4FF",
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <Row gutter={12} align="middle">
            <Col>
              <MessageOutlined style={{ fontSize: 20, color: "#3B82F6" }} />
            </Col>
            <Col flex="auto">
              <Text strong>Automated Reminders</Text>
              <div>
                <Text type="secondary">
                  WhatsApp and Email reminders will be sent to student 24 hours
                  before the follow-up session.
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* FOOTER BUTTONS */}
        <Row justify="end" gutter={12}>
          <Col>
            <Button onClick={onCancel}>Cancel</Button>
          </Col>
          <Col>
            <Button type="primary" htmlType="submit">
              Schedule Follow-Up
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default BookFollowupSessionModal;
