import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, Form, Input, Select, Button, Row, Col, message } from "antd";
import { updateProfile } from "../../../adminSlices/profileSlice";

const { Option } = Select;

const EditProfileModal = ({ visible, onClose, userData }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.profile);

  useEffect(() => {
    if (visible && userData) {
      form.setFieldsValue({
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
      });
    }
  }, [visible, userData, form]);

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone,
      };

      await dispatch(updateProfile(payload)).unwrap();

      message.success("Profile updated successfully");
      onClose();
    } catch (err) {
      message.error(err?.message || "Validation failed");
    }
  };

  return (
    <Modal
      title="Edit Profile"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="update"
          type="primary"
          onClick={handleUpdate}
          loading={loading}
        >
          Update
        </Button>,
      ]}
      centered
    >
      <Form form={form} layout="vertical">
        {/* First & Last Name */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="First Name"
              name="first_name"
              rules={[
                { required: true, message: "First name is required" },
                {
                  pattern: /^[A-Za-z\s]+$/,
                  message: "Only letters are allowed",
                },
                {
                  min: 2,
                  message: "Minimum 2 characters required",
                },
              ]}
            >
              <Input placeholder="Enter first name" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Last Name"
              name="last_name"
              rules={[
                { required: true, message: "Last name is required" },
                {
                  pattern: /^[A-Za-z\s]+$/,
                  message: "Only letters are allowed",
                },
                {
                  min: 2,
                  message: "Minimum 2 characters required",
                },
              ]}
            >
              <Input placeholder="Enter last name" />
            </Form.Item>
          </Col>
        </Row>

        {/* Email (Disabled but validated) */}
        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              type: "email",
              message: "Enter a valid email address",
            },
          ]}
        >
          <Input disabled />
        </Form.Item>

{/* WhatsApp Mobile Number */}
        <Form.Item
          label="WhatsApp Mobile Number"
          name="phone"
          rules={[
            { required: true, message: "WhatsApp mobile number is required" },
            {
              pattern: /^[6-9]\d{9}$/, 
              message: "Enter a valid 10-digit mobile number",
            },
          ]}
        >
          <Input maxLength={10} placeholder="Enter WhatsApp number" />
        </Form.Item>

        {/* Role (Disabled) */}
        <Form.Item label="Role" name="role">
          <Select disabled>
            <Option value="Admin">Admin</Option>
            <Option value="Superadmin">Superadmin</Option>
            <Option value="Counsellor">Counsellor</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
