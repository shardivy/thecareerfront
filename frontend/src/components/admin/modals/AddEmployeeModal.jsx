import React, { useEffect } from "react";
import { Modal, Form, Input, Select, Button, Row, Col } from "antd";

const { Option } = Select;

const AddEmployeeModal = ({
  open,
  onCancel,
  onAdd,
  editingEmployee,
  mode = "add", // add | edit | view
}) => {
  const [form] = Form.useForm();
  const isView = mode === "view";

  useEffect(() => {
    if (editingEmployee) {
      const [firstName, lastName] = editingEmployee.name.split(" ");
      form.setFieldsValue({
        firstName,
        lastName,
        email: editingEmployee.email,
        mobile: editingEmployee.mobile,
        program: editingEmployee.role,
      });
    } else {
      form.resetFields();
    }
  }, [editingEmployee, form]);

  const handleFinish = (values) => {
    if (!isView) {
      onAdd(values);
      form.resetFields();
    }
  };

  return (
    <Modal
      title={
        mode === "view"
          ? "View Employee"
          : editingEmployee
          ? "Edit Employee"
          : "Add Employee"
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="First Name" name="firstName">
              <Input readOnly={isView} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Last Name" name="lastName">
              <Input readOnly={isView} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Email" name="email">
          <Input readOnly={isView} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="WhatsApp Mobile Number" name="mobile">
              <Input readOnly={isView} maxLength={10} />
            </Form.Item>
          </Col>

        <Col span={12}>
  <Form.Item label="Role" name="program">
    {isView ? (
      <Input value={form.getFieldValue("program")} readOnly />
    ) : (
      <Select>
        <Option value="Counsellor">Counsellor</Option>
        <Option value="UI/UX">UI/UX</Option>
        <Option value="Trainer">Trainer</Option>
      </Select>
    )}
  </Form.Item>
</Col>

        </Row>

        <Form.Item style={{ textAlign: "right" }}>
          <Button onClick={onCancel}>
            {isView ? "Close" : "Cancel"}
          </Button>

          {!isView && (
            <Button
              type="primary"
              htmlType="submit"
              style={{ marginLeft: 8 }}
            >
              {editingEmployee ? "Update Employee" : "Add Employee"}
            </Button>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddEmployeeModal;
