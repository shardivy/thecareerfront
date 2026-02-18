import React, { useEffect, useState } from "react";
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
  Spin,
} from "antd";

import { UserOutlined, CrownOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import { useDispatch, useSelector } from "react-redux";
import { getProfile, updateProfile } from "../../../adminSlices/profileSlice";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const StudentProfile = () => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();

  const dispatch = useDispatch();
  const { profile: storedProfile, loading } = useSelector((state) => state.profile);

  const [profile, setProfile] = useState(null);

  // ===== Load profile on mount =====
  useEffect(() => {

      // window.location.reload();
    dispatch(getProfile());
  }, [dispatch]);

  // ===== Update local state when API data is loaded =====
useEffect(() => {
  if (storedProfile) {
    const formattedProfile = {
      id: storedProfile.id,
      student_id: storedProfile.student_id,
      name: `${storedProfile.first_name || ""} ${storedProfile.last_name || ""}`,
      email: storedProfile.email || "",
      phone: storedProfile.phone || "",
      program: storedProfile.program || "",
      counselling_service: storedProfile.package || "",
      joined_on: storedProfile.created_at ? dayjs(storedProfile.created_at).format("YYYY-MM-DD") : "",
      dob: storedProfile.dob || "",

      study_class: storedProfile.study_class || "",
      current_academic_year: storedProfile.current_academic_year || "",
      school: storedProfile.school_college || "",
      city: storedProfile.city || "",
      preferred_counselling_mode: storedProfile.preferred_counselling_mode || "",

      stream: storedProfile.program || "",
      liked_subjects: storedProfile.liked_subjects || [],
      disliked_subjects: storedProfile.disliked_subjects || [],
      hobbies: storedProfile.hobbies || [],

      profession: storedProfile.profession || "",
      organization_name: storedProfile.organization_name || "",
      education_level: storedProfile.education_level || "",
      background: storedProfile.background || "",
      annual_income_range: storedProfile.annual_income_range || "",
      expectations_from_student: storedProfile.expectations_from_student || "",
      package: storedProfile.package || "",
      payments: storedProfile.payments || [],
    };

    setProfile(formattedProfile);

    // ✅ Store program & package in localStorage immediately
    localStorage.setItem("studentId", formattedProfile.student_id || "");
    localStorage.setItem("selectedProgram", formattedProfile.program || "");
    localStorage.setItem("selectedPackage", formattedProfile.package || "");
  

  }
}, [storedProfile]);

  const handleChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

const handleSave = async () => {
  try {
    await dispatch(updateProfile(profile)).unwrap();
    message.success("Profile updated successfully!");

    // ✅ Save program and package in localStorage for Program page
    localStorage.setItem("selectedProgram", profile.program || "");
    localStorage.setItem("selectedPackage", profile.package || "");
  } catch (error) {
    message.error(error || "Failed to update profile");
  }
};


  if (loading || !profile) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

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
            <Avatar size={screens.xs ? 60 : 80} icon={<UserOutlined />} />
          </Col>

          <Col>
            <Title level={3} style={{ margin: 0, color: "#fff" }}>
              {profile.name}
            </Title>

            <Tag color="gold" icon={<CrownOutlined />}>
              {profile.package || "Premium"}
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
            <Input
              value={profile.name}
              onChange={(e) => handleChange("name", e.target.value)}
              disabled
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Email</Text>
            <Input value={profile.email} disabled />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Mobile Number</Text>
            <Input
              value={profile.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              disabled
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Date of Birth</Text>
            <DatePicker
              style={{ width: "100%" }}
              value={profile.dob ? dayjs(profile.dob) : null}
              onChange={(date) =>
                handleChange("dob", date ? date.format("YYYY-MM-DD") : "")
              }
              disabled
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Program</Text>
            <Input value={profile.program} onChange={(e) => handleChange("program", e.target.value)} disabled />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Counselling Service</Text>
            <Input
              value={profile.counselling_service}
              onChange={(e) =>
                handleChange("counselling_service", e.target.value)
              }
              disabled
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Joined On</Text>
            <Input value={profile.joined_on} disabled />
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
              {["8th", "9th", "10th", "11th", "12th"].map((cls) => (
                <Option key={cls} value={cls}>
                  {cls}
                </Option>
              ))}
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
          {["Engineering", "Medical", "Design", "Commerce"].map((stream) => (
            <Option key={stream} value={stream}>
              {stream}
            </Option>
          ))}
        </Select>

        {/* SUBJECT PREFERENCES */}
        <Divider />
        <Title level={4}>Subject Preferences</Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12}>
            <Text>Liked Subjects</Text>
            <Select
              mode="tags"
              value={profile.liked_subjects || []}
              style={{ width: "100%" }}
              onChange={(v) => handleChange("liked_subjects", v)}
            >
              {["Maths", "Physics", "Chemistry", "Biology"].map((subj) => (
                <Option key={subj} value={subj}>
                  {subj}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Disliked Subjects</Text>
            <Select
              mode="tags"
              value={profile.disliked_subjects || []}
              style={{ width: "100%" }}
              onChange={(v) => handleChange("disliked_subjects", v)}
            >
              {["Maths", "Physics", "Chemistry", "Biology"].map((subj) => (
                <Option key={subj} value={subj}>
                  {subj}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* HOBBIES */}
        <Divider />
        <Title level={4}>Hobbies</Title>

        <Select
          mode="tags"
          value={profile.hobbies || []}
          style={{ width: "100%" }}
          onChange={(v) => handleChange("hobbies", v)}
        >
          {["Painting", "Cricket", "Music", "Coding", "Dancing"].map((hobby) => (
            <Option key={hobby} value={hobby}>
              {hobby}
            </Option>
          ))}
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
              {["Urban", "Rural", "Semi-Urban"].map((bg) => (
                <Option key={bg} value={bg}>
                  {bg}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Annual Income Range</Text>
            <Select
              value={profile.annual_income_range}
              style={{ width: "100%" }}
              onChange={(v) => handleChange("annual_income_range", v)}
            >
              {["0-2 Lakhs", "2-5 Lakhs", "5-10 Lakhs", "10-20 Lakhs", "20+ Lakhs"].map((range) => (
                <Option key={range} value={range}>
                  {range}
                </Option>
              ))}
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
