import React, { useState } from "react";
import {
  Card,
  Typography,
  Input,
  Button,
  Select,
  DatePicker,
  Row,
  Col,
  Avatar,
  Tag,
  Divider,
  message,
  theme,
  Grid,
} from "antd";

import {
  UserOutlined,
  CrownOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const StudentProfile = () => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();

  const [profile, setProfile] = useState({
    name: "Shrutika Desai",
    email: "shrutika@gmail.com",
    phone: "+91 98765 43210",
    program: "Engineering",
    counselling_service: "End-to-End Counselling",
    joined_on: "2023-01-15",
    dob: "2002-03-12",
    study_class: "10th",
    current_academic_stage: "10th",
    current_academic_year: "2024-2025",
    school: "Delhi Public School",
    city: "Mumbai",
    preferred_counselling_mode: "online",
    stream: "Engineering",
    liked_subjects: ["Maths"],
    disliked_subjects: [],
    hobbies: ["Painting"],
    profession: "",
    organization_name: "",
    education_level: "",
    background: "Urban",
    annual_income_range: "",
    expectations_from_student: "",
    package: "Premium",
  });

  const handleChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    console.log("Full Profile Data:", profile);
    message.success("Profile updated successfully!");
  };

  return (
    <div
      style={{
        padding: screens.xs ? 12 : 24,
        minHeight: "100vh",
      }}
    >
      {/* ================= HEADER ================= */}
      <Card style={{ marginBottom: -1, background: token.colorPrimary }}>
        <Row
          align="middle"
          gutter={[16, 16]}
          justify={screens.xs ? "center" : "start"}
        >
          <Col>
            <Avatar
              size={screens.xs ? 60 : 80}
              icon={<UserOutlined />}
            />
          </Col>

          <Col>
            <Title level={3} style={{ margin: 0, color: "#fff" }}>
              {profile.name}
            </Title>

            <Tag color="gold" icon={<CrownOutlined />}>
              {profile.package}
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* ================= FORM SECTION ================= */}
      <Card>

        {/* PERSONAL INFO */}
        <Title level={4}>Personal Information</Title>
        <Divider />

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12}>
            <Text>Name</Text>
            <Input value={profile.name} readOnly />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Email</Text>
            <Input value={profile.email} readOnly />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Phone</Text>
            <Input value={profile.phone} readOnly />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Date of Birth</Text>
            <DatePicker
              style={{ width: "100%" }}
              value={profile.dob ? dayjs(profile.dob) : null}
              readOnly
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Program</Text>
            <Input value={profile.program} readOnly />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Counselling Service</Text>
            <Input value={profile.counselling_service} readOnly />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Joined On</Text>
            <Input value={profile.joined_on} readOnly />
          </Col>
        </Row>

        {/* ACADEMIC DETAILS */}
        <Divider />
        <Title level={4}>Academic Details</Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12}>
            <Text>Class</Text>
            <Select
              value={profile.study_class}
              style={{ width: "100%" }}
              onChange={(v) => handleChange("study_class", v)}
              mode="tags"
            >
              <Option value="8th">8th</Option>
              <Option value="9th">9th</Option>
              <Option value="10th">10th</Option>
              <Option value="11th">11th</Option>
              <Option value="12th">12th</Option>
            </Select>
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Current Academic Year</Text>
            <Input
              value={profile.current_academic_year}
              onChange={(e) =>
                handleChange("current_academic_year", e.target.value)
              }
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>School / College</Text>
            <Input
              value={profile.school}
              onChange={(e) => handleChange("school", e.target.value)}
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>City</Text>
            <Input
              value={profile.city}
              onChange={(e) => handleChange("city", e.target.value)}
            />
          </Col>
        </Row>

        {/* STREAM */}
        <Divider />
        <Title level={4}>Stream</Title>

        <Select
          value={profile.stream}
          style={{ width: "100%" }}
          onChange={(v) => handleChange("stream", v)}
        >
          <Option value="Engineering">Engineering</Option>
          <Option value="Medical">Medical</Option>
          <Option value="Design">Design</Option>
          <Option value="Commerce">Commerce</Option>
        </Select>

        {/* SUBJECT PREFERENCES */}
        <Divider />
        <Title level={4}>Subject Preferences</Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12}>
            <Text>Liked Subjects</Text>
            <Select
              mode="tags"
              value={profile.liked_subjects}
              style={{ width: "100%" }}
              onChange={(v) => handleChange("liked_subjects", v)}
            >
              <Option value="Maths">Maths</Option>
              <Option value="Physics">Physics</Option>
              <Option value="Chemistry">Chemistry</Option>
              <Option value="Biology">Biology</Option>
            </Select>
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Disliked Subjects</Text>
            <Select
              mode="tags"
              value={profile.disliked_subjects}
              style={{ width: "100%" }}
              onChange={(v) => handleChange("disliked_subjects", v)}
            >
              <Option value="Maths">Maths</Option>
              <Option value="Physics">Physics</Option>
              <Option value="Chemistry">Chemistry</Option>
              <Option value="Biology">Biology</Option>
            </Select>
          </Col>
        </Row>

        {/* HOBBIES */}
        <Divider />
        <Title level={4}>Hobbies</Title>

        <Select
          mode="tags"
          value={profile.hobbies}
          style={{ width: "100%" }}
          onChange={(v) => handleChange("hobbies", v)}
        >
          <Option value="Painting">Painting</Option>
          <Option value="Cricket">Cricket</Option>
          <Option value="Music">Music</Option>
          <Option value="Coding">Coding</Option>
          <Option value="Dancing">Dancing</Option>
        </Select>

        {/* PARENT DETAILS */}
        <Divider />
        <Title level={4}>Parent Details</Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12}>
            <Text>Profession</Text>
            <Input
              value={profile.profession}
              onChange={(e) => handleChange("profession", e.target.value)}
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Organization</Text>
            <Input
              value={profile.organization_name}
              onChange={(e) =>
                handleChange("organization_name", e.target.value)
              }
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Education Level</Text>
            <Input
              value={profile.education_level}
              onChange={(e) =>
                handleChange("education_level", e.target.value)
              }
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Background</Text>
            <Select
              value={profile.background}
              style={{ width: "100%" }}
              onChange={(v) => handleChange("background", v)}
            >
              <Option value="Urban">Urban</Option>
              <Option value="Rural">Rural</Option>
              <Option value="Semi-Urban">Semi-Urban</Option>
            </Select>
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Annual Income Range</Text>
            <Select
              value={profile.annual_income_range}
              style={{ width: "100%" }}
              onChange={(v) =>
                handleChange("annual_income_range", v)
              }
            >
              <Option value="0-2 Lakhs">0 - 2 Lakhs</Option>
              <Option value="2-5 Lakhs">2 - 5 Lakhs</Option>
              <Option value="5-10 Lakhs">5 - 10 Lakhs</Option>
              <Option value="10-20 Lakhs">10 - 20 Lakhs</Option>
              <Option value="20+ Lakhs">20+ Lakhs</Option>
            </Select>
          </Col>

          <Col xs={24}>
            <Text>Expectations From Student</Text>
            <TextArea
              rows={4}
              value={profile.expectations_from_student}
              onChange={(e) =>
                handleChange("expectations_from_student", e.target.value)
              }
            />
          </Col>
        </Row>

        <Divider />
        <Button type="primary" block size="large" onClick={handleSave}>
          Update Profile
        </Button>
      </Card>
    </div>
  );
};

export default StudentProfile;
