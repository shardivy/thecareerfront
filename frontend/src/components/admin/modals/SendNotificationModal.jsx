import React, { useState, useEffect } from "react";
import { Modal, Select, Button, message } from "antd";

const { Option } = Select;

const SendNotificationModal = ({
  visible,
  onClose,
  template,
  users = [],
  onSend,
}) => {
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    if (!visible) setSelectedUsers([]);
  }, [visible]);

  const handleChange = (values) => {
    // If "ALL" selected → select all users
    if (values.includes("ALL")) {
      const allUserIds = users.map((u) => u.id);

      // toggle behavior
      if (selectedUsers.length === allUserIds.length) {
        setSelectedUsers([]);
      } else {
        setSelectedUsers(allUserIds);
      }
      return;
    }

    setSelectedUsers(values);
  };

  const handleSend = () => {
    if (selectedUsers.length === 0) {
      message.error("Please select at least one user");
      return;
    }

    onSend({ template, userIds: selectedUsers });
    onClose();
  };

  return (
    <Modal
      title={`Send Notification: ${template?.title || ""}`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="send" type="primary" onClick={handleSend}>
          Send
        </Button>,
      ]}
    >
      <p>Select student(s) to send this notification:</p>

      <Select
        mode="multiple"
        style={{ width: "100%" }}
        placeholder="Select Students"
        value={selectedUsers}
        onChange={handleChange}
        optionFilterProp="children"
      >
        {/* Select All option */}
        <Option value="ALL">
          {selectedUsers.length === users.length
            ? "Unselect All"
            : "Select All"}
        </Option>

        {users.map((user) => (
          <Option key={user.id} value={user.id}>
            {user.name}
          </Option>
        ))}
      </Select>
    </Modal>
  );
};

export default SendNotificationModal;
