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
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import adminTheme from "../../../theme/adminTheme";
import EditProfileModal from "../modals/EditProfileModal";
import { getProfile } from "../../../adminSlices/profileSlice";

const { Title, Text } = Typography;

const Profile = () => {
  const dispatch = useDispatch();
  const { profile, loading } = useSelector((state) => state.profile);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // ✅ Fetch profile on load
  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  // ✅ Loading state
  if (loading || !profile) {
    return <Spin fullscreen />;
  }

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
                {profile.role}
              </Text>

              <Space style={{ marginTop: 16 }}>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setIsEditModalVisible(true)}
                >
                  Edit
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
        {profile.role}
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
    </div>
  );
};

export default Profile;
