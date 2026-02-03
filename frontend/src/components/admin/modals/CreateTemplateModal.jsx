import React, { useEffect } from "react";
import { Modal, Form, Input, Button } from "antd";
import dayjs from "dayjs";

const { TextArea } = Input;

const CreateTemplateModal = ({ visible, mode = "create", initialData = null, onClose, onCreate, onUpdate }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({ templates: [initialData] });
    } else {
      // Ensure at least one field is displayed when creating a new template
      form.setFieldsValue({ templates: [{ title: "", message: "" }] });
    }
  }, [initialData, form]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      const template = {
        ...values.templates[0],
        key: initialData?.key || Date.now(),
        updatedAt: dayjs().format("YYYY-MM-DD"),
      };
      if (mode === "create") onCreate(template);
      if (mode === "edit") onUpdate(template);
      onClose();
    });
  };

  return (
    <Modal
      title={mode === "create" ? "Create Template" : mode === "edit" ? "Edit Template" : "View Template"}
      open={visible}
      onCancel={onClose}
      width={750}
      footer={
        mode === "view"
          ? [<Button key="close" onClick={onClose}>Close</Button>]
          : [
              <Button key="cancel" onClick={onClose}>Cancel</Button>,
              <Button key="save" type="primary" onClick={handleSave}>Save</Button>,
            ]
      }
    >
      <Form form={form} layout="vertical">
        <Form.List name="templates">
          {(fields) =>
            fields.map(({ key, name }) => (
              <div key={key}>
                <Form.Item
                  label="Template Name"
                  name={[name, "title"]}
                  rules={[{ required: true, message: "Enter template name" }]}
                >
                  <Input placeholder="Template Name" readOnly={mode === "view"} />
                </Form.Item>
                <Form.Item
                  label="Message Content"
                  name={[name, "message"]}
                  rules={[{ required: true, message: "Enter message content" }]}
                >
                  <TextArea rows={3} placeholder="Message Content" readOnly={mode === "view"} />
                </Form.Item>
              </div>
            ))
          }
        </Form.List>
      </Form>
    </Modal>
  );
};

export default CreateTemplateModal;
