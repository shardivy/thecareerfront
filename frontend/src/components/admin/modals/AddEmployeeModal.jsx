import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Button, Row, Col, message } from "antd";
import { useDispatch } from "react-redux";
import {
  registerUser,
  updateUser,
  fetchRegisteredUsers,
} from "../../../adminSlices/employeeSlice";

const { Option } = Select;

const AddEmployeeModal = ({
  open,
  onCancel,
  editingEmployee,
  mode = "add",
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const isView = mode === "view";

  useEffect(() => {
    if (editingEmployee) {
      const [firstName, lastName] = editingEmployee.name.split(" ");
      form.setFieldsValue({
        firstName,
        lastName,
        email: editingEmployee.email,
        phone: editingEmployee.mobile,
        program: editingEmployee.role,
      });
    } else {
      form.resetFields();
    }
  }, [editingEmployee, form]);

  const handleFinish = async (values) => {
    if (isView) return;

    const payload = {
      first_name: values.firstName,
      last_name: values.lastName,
      email: values.email,
      phone: values.phone,
      role: values.program,
    };

    try {
      setLoading(true);

      if (editingEmployee && mode === "edit") {
        await dispatch(
          updateUser({
            userId: editingEmployee.user_id,
            payload,
          })
        ).unwrap();

        message.success("User updated successfully");
      } else {
        await dispatch(registerUser(payload)).unwrap();
        message.success("User added successfully");
      }

      dispatch(fetchRegisteredUsers());
      form.resetFields();
      onCancel();

    } catch (error) {
      message.error(error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        mode === "view"
          ? "View User"
          : editingEmployee
          ? "Edit User"
          : "Add User"
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="First Name" name="firstName" rules={[{ required: true }]}>
              <Input readOnly={isView} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Last Name" name="lastName" rules={[{ required: true }]}>
              <Input readOnly={isView} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
          <Input readOnly={isView} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="WhatsApp Mobile Number" name="phone" rules={[{ required: true }]}>
              <Input readOnly={isView} maxLength={10} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Role" name="program" rules={[{ required: true }]}>
              {isView ? (
                <Input readOnly />
              ) : (
                <Select>
                  <Option value="counsellor">Counsellor</Option>
                  <Option value="ui_ux">UI/UX</Option>
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
              loading={loading}
              style={{ marginLeft: 8 }}
            >
              {editingEmployee ? "Update User" : "Add User"}
            </Button>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddEmployeeModal;