import React from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Row,
  Col,
} from "antd";

const AddAdvertisementModal = ({
  open,
  onCancel,
  onSubmit,
  loading = false,
  initialValues = null,
}) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        ...values,
      };

      onSubmit?.(payload);
      form.resetFields();
    } catch (err) {
      console.log("Validation failed:", err);
    }
  };

  return (
    <Modal
      open={open}
      title={initialValues ? "Edit Advertisement" : "Add Advertisement"}
      onCancel={() => {
        form.resetFields();
        onCancel?.();
      }}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Save"
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues || {}}
      >
        {/* Campaign Name */}
        <Form.Item
          name="campaignName"
          label="Advertisement / Campaign Name"
          rules={[{ required: true, message: "Please enter campaign name" }]}
        >
          <Input placeholder="Enter campaign name" />
        </Form.Item>

        {/* Advertiser Info */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="advertiserName"
              label="Advertiser Name"
              rules={[{ required: true, message: "Enter advertiser name" }]}
            >
              <Input placeholder="Enter advertiser name" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="advertiserEmail"
              label="Advertiser Email"
              rules={[
                { required: true, message: "Enter email" },
                { type: "email", message: "Invalid email" },
              ]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>
          </Col>
        </Row>

        {/* Mobile */}
        <Form.Item
          name="mobile"
          label="Mobile Number"
          rules={[
            { required: true, message: "Enter mobile number" },
            {
              pattern: /^[0-9]{10}$/,
              message: "Enter valid 10-digit number",
            },
          ]}
        >
          <Input placeholder="Enter mobile number" maxLength={10} />
        </Form.Item>

        {/* Dates */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startDate"
              label="Start Date"
              rules={[{ required: true, message: "Select start date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="endDate"
              label="End Date"
              rules={[{ required: true, message: "Select end date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        {/* Amount */}
        <Form.Item
          name="amount"
          label="Amount"
          rules={[{ required: true, message: "Enter amount" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            placeholder="Enter amount"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddAdvertisementModal;