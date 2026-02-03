import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  Row,
  Col,
  Button,
} from "antd";

const { Option } = Select;

const CompleteFollowupModal = ({ open, onCancel, onSubmit, record }) => {
  const [form] = Form.useForm();

  // ✅ Prefill when editing / opening
  useEffect(() => {
    if (open && record) {
      form.setFieldsValue({
        mode: record.mode,
        priority: record.priority,
      });
    }
  }, [open, record, form]);

  const handleFinish = (values) => {
    onSubmit({
      ...values,
      followupId: record?.key,
    });
    form.resetFields();
  };

  return (
    <Modal
      open={open}
      title="Mark Follow-Up as Completed"
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
      destroyOnClose
      width={600}
    >
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        {/* Outcome */}
        <Form.Item
          label="Session Outcome"
          name="outcome"
          rules={[{ required: true, message: "Please select outcome" }]}
        >
          <Select placeholder="Select outcome">
            <Option value="Completed">Completed Successfully</Option>
            <Option value="No Answer">No Answer</Option>
            <Option value="Rescheduled">Rescheduled</Option>
            <Option value="Not Interested">Not Interested</Option>
          </Select>
        </Form.Item>

        {/* Mode + Priority (Same Line) */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Mode"
              name="mode"
              rules={[{ required: true, message: "Please select mode" }]}
            >
              <Select placeholder="Select mode">
                <Option value="Call">Call</Option>
                <Option value="WhatsApp">WhatsApp</Option>
                <Option value="Video Call">Video Call</Option>
                <Option value="In Person">In Person</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Priority"
              name="priority"
              rules={[{ required: true, message: "Please select priority" }]}
            >
              <Select placeholder="Select priority">
                <Option value="Low">Low</Option>
                <Option value="Medium">Medium</Option>
                <Option value="High">High</Option>
                <Option value="Critical">Critical</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Notes */}
        <Form.Item label="Session Notes" name="notes">
          <Input.TextArea
            rows={4}
            placeholder="Summary of discussion, decisions, concerns..."
          />
        </Form.Item>

        {/* Next Follow-Up */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Next Follow-Up Required?"
              name="nextRequired"
              rules={[{ required: true, message: "Please select" }]}
            >
              <Select placeholder="Select">
                <Option value="Yes">Yes</Option>
                <Option value="No">No</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* ✅ Show date ONLY if Yes */}
          <Col span={12}>
            <Form.Item shouldUpdate>
              {({ getFieldValue }) =>
                getFieldValue("nextRequired") === "Yes" ? (
                  <Form.Item
                    label="Next Follow-Up Date"
                    name="nextDate"
                    rules={[
                      {
                        required: true,
                        message: "Please select next follow-up date",
                      },
                    ]}
                  >
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </Col>
        </Row>

        {/* Footer */}
        <Row justify="end" gutter={12}>
          <Col>
            <Button onClick={onCancel}>Cancel</Button>
          </Col>
          <Col>
            <Button type="primary" htmlType="submit">
              Mark Completed
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CompleteFollowupModal;