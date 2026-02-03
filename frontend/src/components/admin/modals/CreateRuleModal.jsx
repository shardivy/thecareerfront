import React, { useEffect } from "react";
import { Modal, Form, Input, Select, Button } from "antd";

const { Option } = Select;

const CreateRuleModal = ({
  visible,
  onClose,
  onCreate,
  onUpdate,
  initialData,
  mode = "create", // create | edit | view
}) => {
  const [form] = Form.useForm();
  const isEdit = mode === "edit";
  const isView = mode === "view";

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        name: initialData.name,
        type: initialData.type,
        trigger: initialData.trigger,
      });
    } else {
      form.resetFields();
    }
  }, [initialData, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const ruleData = {
        key: initialData?.key || Date.now(),
        name: values.name,
        type: values.type,
        trigger: values.trigger,
        status: initialData?.status || "Active",
        lastRun: initialData?.lastRun || "-",
      };

      isEdit ? onUpdate(ruleData) : onCreate(ruleData);
      form.resetFields();
      onClose();
    });
  };

  return (
    <Modal
      title={
        isView
          ? "View Notification Rule"
          : isEdit
          ? "Edit Notification Rule"
          : "Create Notification Rule"
      }
      open={visible}
      onCancel={onClose}
      footer={
        isView
          ? [
              <Button key="close" onClick={onClose}>
                Close
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={onClose}>
                Cancel
              </Button>,
              <Button key="submit" type="primary" onClick={handleSubmit}>
                {isEdit ? "Update" : "Create"}
              </Button>,
            ]
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Rule Name" name="name">
          <Input readOnly={isView} />
        </Form.Item>

      <Form.Item label="Type">
  {isView ? (
    <Input value={initialData?.type} readOnly />
  ) : (
    <Form.Item
      name="type"
      noStyle
      rules={[{ required: true, message: "Please select type" }]}
    >
      <Select>
        <Option value="Email">Email</Option>
        <Option value="SMS">SMS</Option>
        <Option value="WhatsApp">WhatsApp</Option>
      </Select>
    </Form.Item>
  )}
</Form.Item>


        <Form.Item label="Trigger" name="trigger">
          <Input readOnly={isView} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateRuleModal;
