import React, { useState } from "react";
import { Row, Col, Card, Avatar, Typography, Button, Tag } from "antd";
import {
  UserOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  BookOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import EditProfileModal from "../modals/EditProfileModal";
import adminTheme from "../../../theme/adminTheme";

const { Title, Text } = Typography;

const infoItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 0",
};

const StudentProfile = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [profile, setProfile] = useState({
    name: "Shrutika Desai",
    email: "shrutika@gmail.com",
    phone: "+91 98765 43210",
    dob: "12 March 2002",
    program: "Career Counselling Program",
    package: "Premium",
    joinedOn: "15 Jan 2026",
  });

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => setIsModalVisible(false);

  const handleSave = (values) => {
    setProfile(values);
    setIsModalVisible(false);
  };

  return (
    <div style={{ padding: 20 }}>
      {/* ===== PAGE TITLE ===== */}
      <Title level={3} style={{ marginBottom: 12 }}>
        Profile Overview
      </Title>

      {/* ===== TOP PROFILE BANNER ===== */}
      <Card
        bordered={false}
        style={{
          background: adminTheme.token.colorPrimary,
          color: "#fff",
          marginBottom: 0,
        }}
      >
        <Row align="middle" gutter={24}>
          <Col>
            <Avatar
              size={110}
              icon={<UserOutlined />}
              style={{
                backgroundColor: "#ffffff33",
                border: "3px solid #fff",
              }}
            />
          </Col>

          <Col flex="auto">
            <Title level={3} style={{ color: "#fff", marginBottom: 4 }}>
              {profile.name}
            </Title>
            <Text style={{ color: "#e6f4ff" }}>Student</Text>

            <div style={{ marginTop: 12 }}>
              <Tag color="gold" icon={<CrownOutlined />} style={{ marginRight: 8 }}>
                {profile.package} Member
              </Tag>
              <Tag color="green">Active</Tag>
            </div>
          </Col>

          <Col>
            <Button
              icon={<EditOutlined />}
              style={{
                background: "#fff",
                border: "none",
                fontWeight: 500,
              }}
              onClick={showModal}
            >
              Edit Profile
            </Button>
          </Col>
        </Row>
      </Card>

      {/* ===== DETAILS SECTION ===== */}
      <Card bordered={false} style={{ marginTop: 0 }}>
        <Row gutter={0}>
          <Col xs={24} md={12} style={{ paddingRight: 24 }}>
            <div style={infoItemStyle}>
              <MailOutlined style={{ color: "#1677ff", fontSize: 18 }} />
              <div>
                <Text type="colorTextSecondary">Email</Text>
                <br />
                <Text strong>{profile.email}</Text>
              </div>
            </div>

            <div style={infoItemStyle}>
              <PhoneOutlined style={{ color: "#1677ff", fontSize: 18 }} />
              <div>
                <Text type="colorTextSecondary">Phone</Text>
                <br />
                <Text strong>{profile.phone}</Text>
              </div>
            </div>

            <div style={infoItemStyle}>
              <CalendarOutlined style={{ color: "#1677ff", fontSize: 18 }} />
              <div>
                <Text type="colorTextSecondary">Date of Birth</Text>
                <br />
                <Text strong>{profile.dob}</Text>
              </div>
            </div>
          </Col>

          <Col xs={24} md={12} style={{ paddingLeft: 24 }}>
            <div style={infoItemStyle}>
              <BookOutlined style={{ color: "#1677ff", fontSize: 18 }} />
              <div>
                <Text type="colorTextSecondary">Program</Text>
                <br />
                <Text strong>{profile.program}</Text>
              </div>
            </div>

            <div style={infoItemStyle}>
              <CrownOutlined style={{ color: "#faad14", fontSize: 18 }} />
              <div>
                <Text type="colorTextSecondary">Package</Text>
                <br />
                <Text strong>{profile.package}</Text>
              </div>
            </div>

            <div style={infoItemStyle}>
              <UserOutlined style={{ color: "#1677ff", fontSize: 18 }} />
              <div>
                <Text type="colorTextSecondary">Joined On</Text>
                <br />
                <Text strong>{profile.joinedOn}</Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* ===== EDIT PROFILE MODAL ===== */}
      <EditProfileModal
        visible={isModalVisible}
        onCancel={handleCancel}
        profileData={profile}
        onSave={handleSave}
      />
    </div>
  );
};

export default StudentProfile;
