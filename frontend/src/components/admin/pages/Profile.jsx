import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
  Typography,
  Avatar,
  Button,
  Space,
  Spin,
  Modal, 
  Form, 
  Input,
  message,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  SafetyOutlined,
  LockOutlined ,
} from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";
import EditProfileModal from "../modals/EditProfileModal";
import { getProfile } from "../../../adminSlices/profileSlice";
import { resetPassword } from "../../../adminSlices/resetPasswordSlice"

const { Title, Text } = Typography;

const Profile = () => {
  const dispatch = useDispatch();
  const { profile, loading } = useSelector((state) => state.profile);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

const { loading: passwordLoading } = useSelector(
  (state) => state.resetPassword
);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // ✅ Fetch profile on load
  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  // ✅ Loading state
  if (loading || !profile) {
    return <Spin fullscreen />;
  }

  const formatRole = (role) => {
  if (!role) return "";

  if (role === "ui_ux") return "UI/UX";

  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};


const validatePassword = (_, value) => {
  if (!value) return Promise.reject("Password is required");

  if (value.length < 8)
    return Promise.reject("Minimum 8 characters required");

  if (!/[A-Z]/.test(value))
    return Promise.reject("At least one uppercase letter required");

  if (!/[a-z]/.test(value))
    return Promise.reject("At least one lowercase letter required");

  if (!/\d/.test(value))
    return Promise.reject("At least one number required");

  return Promise.resolve();
};

const handlePasswordChange = async (values) => {
  try {
    await dispatch(
      resetPassword({
        email: profile.email,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      })
    ).unwrap();

    message.success("Password changed successfully");

    setIsPasswordModalOpen(false);

  } catch (err) {
    message.error(err || "Password update failed");
  }
};

  return (
    <div style={{ padding: 16, minHeight: "100vh" }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        My Profile
      </Title>

      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={12} xl={10}>
          <Card
            style={{
              borderRadius: adminTheme.token.borderRadius,
              boxShadow: adminTheme.token.boxShadow,
              overflow: "hidden",
            }}
            bodyStyle={{ padding: 0 }}
          >
            {/* Header */}
            <div
              style={{
                background: `linear-gradient(135deg, ${adminTheme.token.colorPrimary}, ${adminTheme.token.colorInfo})`,
                padding: 32,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <Avatar
                size={120}
                icon={<UserOutlined />}
                style={{
                  border: `4px solid ${adminTheme.token.colorBgContainer}`,
                  backgroundColor: "#000",
                  marginBottom: 16,
                }}
              />

              <Title level={3} style={{ color: "#fff", marginBottom: 4 }}>
                {profile.first_name} {profile.last_name}
              </Title>

              <Text style={{ color: "#E0E7FF", fontSize: 16 }}>
               {formatRole(profile.role)}
              </Text>

              <Space style={{ marginTop: 16 }}>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setIsEditModalVisible(true)}
                >
                  Edit
                </Button>

                  <Button
    icon={<LockOutlined />}
    onClick={() => setIsPasswordModalOpen(true)}
  >
    Change Password
  </Button>
              </Space>
            </div>


{/* Info Section */}
<div style={{ padding: 24 }}>
  <Row gutter={[16, 16]}>
    <Col xs={24} sm={24}>
      <Text strong>
        <MailOutlined /> Email:
      </Text>
      <Text style={{ marginLeft: 8 }}>
        {profile.email}
      </Text>
    </Col>

    {/* Full width */}
    <Col xs={24} sm={24}>
      <Text strong>
        <PhoneOutlined /> WhatsApp Mobile Number:
      </Text>
      <Text style={{ marginLeft: 8 }}>
        {profile.phone}
      </Text>
    </Col>

    <Col xs={24} sm={12}>
      <Text strong>
        <SafetyOutlined /> Role:
      </Text>
      <Text style={{ marginLeft: 8 }}>
       {formatRole(profile.role)}
      </Text>
    </Col>
  </Row>
</div>
   </Card>
        </Col>
      </Row>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        userData={profile}   // ✅ Redux data
      />


      <Modal
  title="Change Password"
  open={isPasswordModalOpen}
  onCancel={() => !passwordLoading && setIsPasswordModalOpen(false)}
  footer={null}
>
  <Form layout="vertical" onFinish={handlePasswordChange}>
    
    <Form.Item
      label="New Password"
      name="new_password"
      rules={[{ validator: validatePassword }]}
    >
      <Input.Password
        prefix={<LockOutlined />}
        placeholder="Enter new password"
      />
    </Form.Item>

    <Form.Item
      label="Confirm Password"
      name="confirm_password"
      dependencies={["new_password"]}
      rules={[
        { required: true, message: "Confirm password is required" },
        ({ getFieldValue }) => ({
          validator(_, value) {
            if (!value || getFieldValue("new_password") === value) {
              return Promise.resolve();
            }
            return Promise.reject("Passwords do not match");
          },
        }),
      ]}
    >
      <Input.Password
        prefix={<LockOutlined />}
        placeholder="Confirm password"
      />
    </Form.Item>

  <Row gutter={12} justify="end">
  <Col>
    <Button
      onClick={() => setIsPasswordModalOpen(false)}
      disabled={passwordLoading}
    >
      Cancel
    </Button>
  </Col>

  <Col>
    <Button
      type="primary"
      htmlType="submit"
      loading={passwordLoading}
    >
      {passwordLoading ? "Updating..." : "Update Password"}
    </Button>
  </Col>
</Row>

  </Form>
</Modal>
    </div>
  );
};

export default Profile;
