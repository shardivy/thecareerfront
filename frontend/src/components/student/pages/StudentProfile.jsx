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

import { UserOutlined, CrownOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProfile, updateProfile } from "../../../adminSlices/profileSlice";
import { fetchStreams } from "../../../adminSlices/streamSlice";
import { fetchSubjects } from "../../../adminSlices/subjectSlice";
import { fetchHobbies } from "../../../adminSlices/hobbySlice";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const StudentProfile = () => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const [profile, setProfile] = useState(null);
  const [specializationOptions, setSpecializationOptions] = useState([]);

  const { profile: storedProfile, loading } = useSelector((state) => state.profile);
  const { streamList, loading: streamsLoading } = useSelector(
    (state) => state.streams
  );
  const { subjectList, loading: subjectsLoading } = useSelector(
    (state) => state.subjects
  );
  const { hobbyList, loading: hobbiesLoading } = useSelector(
    (state) => state.hobbies
  );


  const classOptions = [
    "8",
    "9",
    "10",
    "11",
    "12",
    "Engineering",
    "Medical",
    "Law",
    "Design",
    "Commerce",
    "Arts",
    "BBA",
    "UG",
    "Others",
  ];

  const specializationMap = {
    "11": [
      "PCM (Physics, Chemistry, Mathematics)",
      "PCB (Physics, Chemistry, Biology)",
      "PCMB",
      "Commerce",
      "Arts / Humanities"
    ],
    "12": [
      "PCM (Physics, Chemistry, Mathematics)",
      "PCB (Physics, Chemistry, Biology)",
      "PCMB",
      "Commerce",
      "Arts / Humanities"
    ],
    "Engineering": [
      "Computer Science Engineering (CSE)",
      "Information Technology (IT)",
      "Artificial Intelligence & Machine Learning (AI/ML)",
      "Data Science",
      "Electronics & Telecommunication (ENTC)",
      "Electrical Engineering",
      "Mechanical Engineering",
      "Civil Engineering"
    ],
    "Medical": [
      "MBBS",
      "BDS",
      "BAMS",
      "BHMS",
      "BPT",
      "B.Sc Nursing",
      "Pharmacy"
    ],
    "Commerce": [
      "B.Com General",
      "CA",
      "CS",
      "CMA",
      "Finance"
    ],
    "Arts": [
      "BA English",
      "BA Psychology",
      "BA Sociology",
      "BA History"
    ],
    "BBA": [
      "Finance",
      "Marketing",
      "HR",
      "Business Analytics"
    ]
  };

  // ===== Load profile on mount =====
  useEffect(() => {

    // window.location.reload();
    dispatch(getProfile());
    dispatch(fetchStreams());
    dispatch(fetchSubjects());
    dispatch(fetchHobbies());
  }, [dispatch]);

  // Show warning if profile is incomplete
  useEffect(() => {
    if (profile && profile.complete_profile === false) {
      const shown = sessionStorage.getItem("profileWarningShown");

      if (!shown) {
        message.warning(
          "Your profile is incomplete. Please update your profile to gain access to the dashboard.",
          6
        );

        sessionStorage.setItem("profileWarningShown", "true");
      }
    }
  }, [profile]);



  useEffect(() => {
    if (profile?.study_class) {
      const specs = specializationMap[profile.study_class] || [];
      setSpecializationOptions(specs);
    }
  }, [profile?.study_class]);

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

        specialization: storedProfile.specialization || "",
        stream: storedProfile.stream?.stream_name || "",
        stream_id: storedProfile.stream?.stream_id || null,
        liked_subjects: storedProfile.liked_subjects
          ? storedProfile.liked_subjects.map((sub) => sub.id)
          : [],

        disliked_subjects: storedProfile.disliked_subjects
          ? storedProfile.disliked_subjects.map((sub) => sub.id)
          : [],

        hobbies: storedProfile.hobbies
          ? storedProfile.hobbies.map((hobby) => hobby.id)
          : [],

        // Parent Mapping
        parent_name: storedProfile.parent?.parent_name || "",
        profession: storedProfile.parent?.profession || "",
        organization_name: storedProfile.parent?.organization_name || "",
        education_level: storedProfile.parent?.education_level || "",
        background: storedProfile.parent?.background || "",
        annual_income_range: storedProfile.parent?.annual_income_range || "",
        expectations_from_student:
          storedProfile.parent?.expectations_from_student || "",

        package: storedProfile.package || "",
        payments: storedProfile.payments || [],


        complete_profile: storedProfile.complete_profile || false,
      };

      setProfile(formattedProfile);

      // ✅ Store program & package in localStorage immediately
      localStorage.setItem("studentId", formattedProfile.student_id || "");
      localStorage.setItem("username", formattedProfile.name || "");
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

  // const handleSave = async () => {
  //   try {
  //     await dispatch(updateProfile(profile)).unwrap();
  //     message.success("Profile updated successfully!");

  //     // ✅ Save program and package in localStorage for Program page
  // localStorage.setItem("selectedProgram", profile.program || "");
  // localStorage.setItem("selectedPackage", profile.package || "");
  //   } catch (error) {
  //     message.error(error || "Failed to update profile");
  //   }
  // };

  const handleSave = async () => {
    try {
      const overlapping = profile.liked_subjects.filter(id =>
        profile.disliked_subjects.includes(id)
      );

      if (overlapping.length > 0) {
        message.error("A subject cannot be both liked and disliked.");
        return;
      }
      const payload = {
        study_class: profile.study_class,
        specialization: profile.specialization,
        current_academic_year: profile.current_academic_year,
        school_college: profile.school,
        city: profile.city,

        // Parent Object
        parent: {
          parent_name: profile.parent_name || "",
          profession: profile.profession || "",
          organization_name: profile.organization_name || "",
          education_level: profile.education_level || "",
          background: profile.background || "",
          annual_income_range: profile.annual_income_range || "",
          expectations_from_student:
            profile.expectations_from_student || "",
        },

        // Stream ID (convert name → id)
        stream_id:
          streamList.find((s) => s.name === profile.stream)?.id || null,

        // These are already ID arrays
        liked_subject_ids: profile.liked_subjects || [],
        disliked_subject_ids: profile.disliked_subjects || [],
        hobby_ids: profile.hobbies || [],
      };

      // ✅ 1. Update
      await dispatch(updateProfile(payload)).unwrap();

      // ✅ 2. Reload profile ONLY ONCE
      const updatedProfile = await dispatch(getProfile()).unwrap();

      // message.success("Profile updated successfully!");

      // ✅ 3. Navigate conditionally with countdown
      if (updatedProfile.complete_profile) {
        let seconds = 3;
        const key = "redirectMessage";

        message.success({
          content: `Profile updated successfully! Redirecting to dashboard in ${seconds} seconds...`,
          key,
          duration: 0,
        });

        const interval = setInterval(() => {
          seconds -= 1;

          if (seconds > 0) {
            message.success({
              content: `Profile updated successfully! Redirecting to dashboard in ${seconds} seconds...`,
              key,
              duration: 0,
            });
          } else {
            clearInterval(interval);
            message.destroy(key);
            navigate("/student/dashboard");
          }
        }, 1000);
      } else {
        message.success("Profile updated successfully!");
      }

    } catch (error) {
      console.error("Update error:", error);
      message.error(
        error?.message || "Failed to update profile"
      );
    }
  };

  // if (loading || !profile) {
  //   return (
  //     <div
  //       style={{
  //         display: "flex",
  //         justifyContent: "center",
  //         alignItems: "center",
  //         minHeight: "100vh",
  //       }}
  //     >
  //       <Spin size="large" />
  //     </div>
  //   );
  // }
  if (!profile) return null;



  return (
    <div
      style={{
        padding: screens.xs ? 12 : 24,
        position: "relative",
        minHeight: "100vh",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >

      {/* BACK ARROW */}
      {/* {profile.complete_profile && (
        <div
          onClick={() => navigate("/student/dashboard")}
          style={{
            marginBottom: 16,
            display: "inline-flex",
            // alignItems: "center",
            cursor: "pointer",
            color: token.colorPrimary,
            fontWeight: 500,
            fontSize: 16,
            marginLeft: -276,
          }}
        >
          <ArrowLeftOutlined style={{ marginRight: 8 }} />
          Back to Dashboard
        </div>
      )} */}


      {/* BACK ARROW */}
      <div
        onClick={() => navigate("/student/dashboard")}
        style={{
          marginBottom: 16,
          display: "inline-flex",
          cursor: "pointer",
          color: token.colorPrimary,
          fontWeight: 500,
          fontSize: 16,
          marginLeft: screens.xs ? 0 : -276, // adjust for responsiveness
        }}
      >
        <ArrowLeftOutlined style={{ marginRight: 8 }} />
        Back to Dashboard
      </div>

      {/* HEADER */}
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
              onChange={(value) => {
                handleChange("study_class", value);
                handleChange("specialization", undefined);
                setSpecializationOptions(specializationMap[value] || []);
              }}
            >
              {classOptions.map((cls) => (
                <Option key={cls} value={cls}>
                  {cls}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Specialization</Text>
            <Select
              value={profile.specialization}
              style={{ width: "100%" }}
              onChange={(value) => handleChange("specialization", value)}
              disabled={specializationOptions.length === 0}
            >
              {specializationOptions.map((spec) => (
                <Option key={spec} value={spec}>
                  {spec}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Stream</Text>

            <Select
              value={profile.stream}
              style={{ width: "100%" }}
              onChange={(v) => handleChange("stream", v)}
            >
              {streamList.map((stream) => (
                <Option key={stream.id} value={stream.name}>
                  {stream.name}
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


        {/* SUBJECT PREFERENCES */}
        <Divider />
        <Title level={4}>Subject Preferences</Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12}>
            <Text>
              Liked Subjects <span style={{ color: "red" }}>*</span>
            </Text>
            <Select
              mode="multiple"
              value={profile.liked_subjects || []}
              style={{ width: "100%" }}
              onChange={(v) => handleChange("liked_subjects", v)}
              loading={subjectsLoading}
              rules={[{ required: true, message: "Please select at least one liked subject" }]}
            >
              {Array.isArray(subjectList) &&
                subjectList.map((subject) => (
                  <Option
                    key={subject.id}
                    value={subject.id}
                    disabled={profile.disliked_subjects?.includes(subject.id)}
                  >
                    {subject.name}
                  </Option>
                ))}
            </Select>
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>
              Disliked Subjects <span style={{ color: "red" }}>*</span>
            </Text>
            <Select
              mode="multiple"
              value={profile.disliked_subjects || []}
              style={{ width: "100%" }}
              onChange={(v) => handleChange("disliked_subjects", v)}
              loading={subjectsLoading}
              rules={[{ required: true, message: "Please select at least one disliked subject" }]}
            >
              {Array.isArray(subjectList) &&
                subjectList.map((subject) => (
                  <Option
                    key={subject.id}
                    value={subject.id}
                    disabled={profile.liked_subjects?.includes(subject.id)}
                  >
                    {subject.name}
                  </Option>
                ))}
            </Select>
          </Col>
        </Row>

        {/* HOBBIES */}
        <Divider />
        <Title level={4}>Hobbies <span style={{ color: "red" }}>*</span></Title>



        <Select
          mode="multiple"
          value={profile.hobbies || []}
          style={{ width: "100%" }}
          onChange={(v) => handleChange("hobbies", v)}
          loading={hobbiesLoading}
          rules={[{ required: true, message: "Please select at least one hobby" }]}
        >
          {Array.isArray(hobbyList) &&
            hobbyList.map((hobby) => (
              <Option key={hobby.id} value={hobby.id}>
                {hobby.name}
              </Option>
            ))}
        </Select>

        {/* PARENT DETAILS */}
        <Divider />
        <Title level={4}>Parent Details</Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Text>Parent Name</Text>
            <Input
              value={profile.parent_name}
              onChange={(e) => handleChange("parent_name", e.target.value)}
              placeholder="Enter Parent Name"
            />
          </Col>
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
        <Button type="primary" block size="large" onClick={handleSave} loading={loading}>
          Update Profile
        </Button>
      </Card>
    </div>
  );
};

export default StudentProfile;
