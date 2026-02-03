import React from "react";
import { Modal, Form, Input, Button } from "antd";

const EditProfileModal = ({ visible, onCancel, profileData, onSave }) => {
  return (
    <Modal
      title="Edit Profile"
      open={visible}
      onCancel={onCancel}
      footer={null}
      centered
      bodyStyle={{ borderRadius: 12 }}
    >
      <Form
        layout="vertical"
        initialValues={profileData}
        onFinish={onSave}
      >
        <Form.Item label="Name" name="name">
          <Input />
        </Form.Item>

        <Form.Item label="Email" name="email">
          <Input />
        </Form.Item>

        <Form.Item label="Phone" name="phone">
          <Input />
        </Form.Item>

        <Form.Item label="Date of Birth" name="dob">
          <Input />
        </Form.Item>

        <Form.Item label="Program" name="program">
          <Input />
        </Form.Item>

        <Form.Item label="Package" name="package">
          <Input />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
