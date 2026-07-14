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
  Modal,
  Form,
} from "antd";

import { UserOutlined, CrownOutlined, ArrowLeftOutlined, LockOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProfile, updateProfile } from "../../../adminSlices/profileSlice";
import { fetchStreams } from "../../../adminSlices/streamSlice";
import { fetchSubjects } from "../../../adminSlices/subjectSlice";
import { fetchHobbies } from "../../../adminSlices/hobbySlice";
import { resetPassword } from "../../../adminSlices/resetPasswordSlice";

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
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const selectedPackage = localStorage.getItem("selectedPackage");

  const [passwordData, setPasswordData] = useState({
    new_password: "",
    confirm_password: "",
  });

  const { profile: storedProfile, loading } = useSelector((state) => state.profile);
  const { loading: passwordLoading } = useSelector(
    (state) => state.resetPassword
  );
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
      const academic = storedProfile.academic_history?.[0] || {};

      const formattedProfile = {
        id: storedProfile.id,
        student_id: storedProfile.student_id,
        name: `${storedProfile.first_name || ""} ${storedProfile.last_name || ""}`,
        email: storedProfile.email || "",
        phone: storedProfile.phone || "",
        // program: storedProfile.program || "",
        // counselling_service: storedProfile.package || "",
        program_packages: storedProfile.program_packages || [],
        joined_on: storedProfile.created_at ? dayjs(storedProfile.created_at).format("YYYY-MM-DD") : "",
        dob: storedProfile.dob || "",

        study_class: storedProfile.study_class || "",

        current_class_percentage: academic.current_class_percentage || "",

        previous_class_percentage: storedProfile.previous_class_percentage || "",
        board_exam_year: storedProfile.board_exam_year || "",

        board_name: academic.board_name || "",

        current_academic_year: storedProfile.current_academic_year || "",
        school: storedProfile.school_college || "",
        city: storedProfile.city || "",

        coaching_entrance: academic.coaching_entrance || "",
        special_notes: academic.special_notes || "",

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

        moderate_subjects: storedProfile.moderate_subjects
          ? storedProfile.moderate_subjects.map((sub) => sub.id)
          : [],
        improvement_areas: storedProfile.improvement_areas || "",

        hobbies: storedProfile.hobbies
          ? storedProfile.hobbies.map((hobby) => hobby.id)
          : [],

        // Parent Mapping
        parent_name: storedProfile.parent?.parent_name || "",
        profession: storedProfile.parent?.profession || "",
        organization_name: storedProfile.parent?.organization_name || "",
        education_level: storedProfile.parent?.education_level || "",
        father_background: storedProfile.parent?.father_background || "",
        mother_background: storedProfile.parent?.mother_background || "",
        location: storedProfile.parent?.location || "",
        annual_income_range: storedProfile.parent?.annual_income_range || "",
        expectations_from_student:
          storedProfile.parent?.expectations_from_student || "",

        package: storedProfile.package || "",
        payments: storedProfile.payments || [],

        suggested_stream: storedProfile.suggested_stream || "",
        complete_profile: storedProfile.complete_profile || false,
      };

      setProfile(formattedProfile);

      // ✅ Store program & package in localStorage immediately
      localStorage.setItem("studentId", formattedProfile.student_id || "");
      localStorage.setItem("username", formattedProfile.name || "");
      // localStorage.setItem("selectedProgram", formattedProfile.program || "");
      // localStorage.setItem("selectedPackage", formattedProfile.package || "");



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
      const overlapLikedDisliked = profile.liked_subjects.filter(id =>
        profile.disliked_subjects.includes(id)
      );

      const overlapLikedModerate = profile.liked_subjects.filter(id =>
        profile.moderate_subjects.includes(id)
      );

      const overlapDislikedModerate = profile.disliked_subjects.filter(id =>
        profile.moderate_subjects.includes(id)
      );

      if (
        overlapLikedDisliked.length > 0 ||
        overlapLikedModerate.length > 0 ||
        overlapDislikedModerate.length > 0
      ) {
        message.error("A subject cannot be selected in multiple categories.");
        return;
      }

      const percentage = Number(profile.previous_class_percentage);
      const year = Number(profile.board_exam_year);

      // ✅ Validate ONLY if value exists
      if (profile.previous_class_percentage) {
        if (percentage > 100 || percentage < 0) {
          message.error("Enter valid percentage (0–100)");
          return;
        }
      }

      if (profile.board_exam_year) {
        if (year < 2000 || year > new Date().getFullYear()) {
          message.error("Enter valid year");
          return;
        }
      }

      const currentPercentage = Number(profile.current_class_percentage);

      if (profile.current_class_percentage) {
        if (currentPercentage > 100 || currentPercentage < 0) {
          message.error("Enter valid current class percentage (0–100)");
          return;
        }
      }
      const payload = {
        study_class: profile.study_class,
        specialization: profile.specialization,
        current_academic_year: profile.current_academic_year,
        school_college: profile.school,
        city: profile.city,
        // current_class_percentage: profile.current_class_percentage,
        previous_class_percentage: profile.previous_class_percentage,
        board_exam_year: profile.board_exam_year,
        // board_name: profile.board_name,
        // coaching_entrance: profile.coaching_entrance,
        // special_notes: profile.special_notes,

        academic_history: [
          {
            current_class_percentage: profile.current_class_percentage,
            // previous_class_percentage: profile.previous_class_percentage,
            // board_exam_year: profile.board_exam_year,
            board_name: profile.board_name,
            coaching_entrance: profile.coaching_entrance,
            special_notes: profile.special_notes,
          },
        ],

        dob: profile.dob,

        // Parent Object
        parent: {
          parent_name: profile.parent_name || "",
          profession: profile.profession || "",
          organization_name: profile.organization_name || "",
          education_level: profile.education_level || "",
          father_background: profile.father_background || "",
          mother_background: profile.mother_background || "",
          location: profile.location || "",
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
        moderate_subject_ids: profile.moderate_subjects || [],
        improvement_areas: profile.improvement_areas,
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
      // console.error("Update error:", error);

      // ✅ If backend returns field-wise errors
      if (typeof error === "object") {
        Object.values(error).forEach((errMsg) => {
          message.error(errMsg);
        });
      } else {
        message.error(error || "Failed to update profile");
      }
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

  const validatePassword = (_, value) => {
    if (!value) return Promise.reject("Password is required");

    if (value.length < 8)
      return Promise.reject("Minimum 8 characters required");

    if (!/[a-z]/.test(value))
      return Promise.reject("At least one lowercase letter required");

    if (!/[A-Z]/.test(value))
      return Promise.reject("At least one uppercase letter required");

    if (!/\d/.test(value))
      return Promise.reject("At least one number required");

    return Promise.resolve();
  };


  const handlePasswordChange = async () => {

    if (!passwordData.new_password || !passwordData.confirm_password) {
      message.error("Please fill all password fields");
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      message.error("Passwords do not match");
      return;
    }

    try {
      await dispatch(
        resetPassword({
          email: profile.email,
          new_password: passwordData.new_password,
          confirm_password: passwordData.confirm_password,
        })
      ).unwrap();

      message.success("Password changed successfully");

      setPasswordData({
        new_password: "",
        confirm_password: "",
      });

      setIsPasswordModalOpen(false);

    } catch (err) {
      message.error(err || "Password update failed");
    }
  };


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
      <Card style={{ background: token.colorPrimary }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Row align="middle" gutter={16}>
              <Avatar size={70} icon={<UserOutlined />} />

              <div>
                <Title level={3} style={{ color: "#fff", margin: 10 }}>
                  {profile.name}
                </Title>

                 <div>
                  <div>
  {selectedPackage && (
    <Tag icon={<CrownOutlined />} color="gold">
      {selectedPackage}
    </Tag>
  )}
</div>
                </div> 

                {/* <div>
                  {profile.program_packages?.map((item, index) => (
                    <Tag key={index} icon={<CrownOutlined />} color="gold">
                      {item.package_name}
                    </Tag>
                  ))}
                </div> */}
              </div>
            </Row>
          </Col>

          <Button
            icon={<LockOutlined />}
            onClick={() => setIsPasswordModalOpen(true)}
          >
            Change Password
          </Button>
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
              disabled={!!profile.dob}   // 👈 key change
            />
          </Col>

          <Col span={24}>
            <Text >
              Programs & Counselling Services
            </Text>

            <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
              {profile.program_packages?.length > 0 ? (
                profile.program_packages.map((item, index) => (
                  <Col xs={24} sm={12} key={index}>
                    <Card
                      size="small"
                      style={{
                        borderRadius: 12,
                        background: "#fafafa",
                        height: "100%",
                      }}
                    >
                      <Text strong>
                        {index + 1}. {item.program_name}
                      </Text>

                      <br />

                      <Tag color="#1E40AF" style={{ marginTop: 8 }}>
                        {item.package_name}
                      </Tag>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col span={24}>
                  <Text type="secondary">No Program Assigned</Text>
                </Col>
              )}
            </Row>
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
            <Text>Current Class</Text>
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
            <Text>Coaching / Entrance (if any)</Text>
            <Input
              value={profile.coaching_entrance}
              onChange={(e) =>
                handleChange("coaching_entrance", e.target.value)
              }
              placeholder="e.g., JEE, NEET coaching"
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Current Class Percentage</Text>
            <Input
              type="number"
              value={profile.current_class_percentage}
              onChange={(e) =>
                handleChange("current_class_percentage", e.target.value)
              }
              placeholder="Enter current class %"
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Previous Class Percentage</Text>
            <Input
              type="number"
              value={profile.previous_class_percentage}
              onChange={(e) =>
                handleChange("previous_class_percentage", e.target.value)
              }
              placeholder="Enter previous class %"
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Year of giving board </Text>
            <Input
              type="number"
              value={profile.board_exam_year}
              onChange={(e) =>
                handleChange("board_exam_year", e.target.value)
              }
              placeholder="Enter year"
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Board Name</Text>
            <Select
              value={profile.board_name}
              style={{ width: "100%" }}
              onChange={(value) => handleChange("board_name", value)}
              placeholder="Select Board Name"
            >
              {["CBSE", "ICSE", "State Board", "IB", "IGCSE", "Other"].map((board) => (
                <Option key={board} value={board}>
                  {board}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>School / College</Text>
            <Input
              value={profile.school}
              onChange={(e) => handleChange("school", e.target.value)}
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>City / Area </Text>
            <Input
              value={profile.city}
              onChange={(e) => handleChange("city", e.target.value)}
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Current Stream</Text>

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
  <Text>Suggested Stream by Counsellor</Text>

  <Input
    value={profile.suggested_stream}
    disabled
    placeholder="Suggested by counsellor"
  />
</Col>

          <Col xs={24}>
            <Text>Special Notes by counsellor</Text>
            <TextArea
              rows={3}
              value={profile.special_notes}
              disabled
              onChange={(e) =>
                handleChange("special_notes", e.target.value)
              }
              placeholder="Add any important notes..."
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
              mode="tags"
              value={profile.liked_subjects || []}
              style={{ width: "100%" }}
              placeholder="Select or type subjects"
              onChange={(values) => {
                // remove duplicates
                handleChange("liked_subjects", [...new Set(values)]);
              }}
              tokenSeparators={[","]}
              maxTagCount="responsive"
            >
              {subjectList?.map((subject) => (
                <Option
                  key={subject.id}
                  value={subject.id} // keeps IDs
                  disabled={
                    profile.disliked_subjects?.includes(subject.id) ||
                    profile.moderate_subjects?.includes(subject.id)
                  }
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
              mode="tags"
              value={profile.disliked_subjects || []}
              style={{ width: "100%" }}
              onChange={(values) =>
                handleChange("disliked_subjects", [...new Set(values)])
              }
              tokenSeparators={[","]}
              maxTagCount="responsive"
            >
              {subjectList?.map((subject) => (
                <Option
                  key={subject.id}
                  value={subject.id}
                  disabled={
                    profile.liked_subjects?.includes(subject.id) ||
                    profile.moderate_subjects?.includes(subject.id)
                  }
                >
                  {subject.name}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Moderate Subject (if any)</Text>
            <Select
              mode="tags"
              value={profile.moderate_subjects || []}
              style={{ width: "100%" }}
              onChange={(values) =>
                handleChange("moderate_subjects", [...new Set(values)])
              }
              tokenSeparators={[","]}
              maxTagCount="responsive"
            >
              {subjectList?.map((subject) => (
                <Option
                  key={subject.id}
                  value={subject.id}
                  disabled={
                    profile.liked_subjects?.includes(subject.id) ||
                    profile.disliked_subjects?.includes(subject.id)
                  }
                >
                  {subject.name}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24}>
            <Text>Improvement Areas / Concerns</Text>
            <TextArea
              rows={3}
              value={profile.improvement_areas}
              disabled
              onChange={(e) =>
                handleChange("improvement_areas", e.target.value)
              }
              placeholder="Enter any improvement areas or concerns"
            />
          </Col>
        </Row>

        {/* HOBBIES */}
        <Divider />
        <Title level={4}>Hobbies <span style={{ color: "red" }}>*</span></Title>



        <Select
          mode="tags"
          value={profile.hobbies || []}
          style={{ width: "100%" }}
          placeholder="Select or type hobbies"
          onChange={(values) =>
            handleChange("hobbies", [...new Set(values)])
          }
          tokenSeparators={[","]}
          maxTagCount="responsive"
        >
          {hobbyList?.map((hobby) => (
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
            <Text>Parent Profession</Text>
            <Input
              value={profile.profession}
              onChange={(e) => handleChange("profession", e.target.value)}
              placeholder="Enter Parent Profession"
            />
          </Col>

          {/* <Col xs={24} sm={24} md={12}>
            <Text>Organization</Text>
            <Input
              value={profile.organization_name}
              onChange={(e) =>
                handleChange("organization_name", e.target.value)
              }
            />
          </Col> */}
          {/* 
          <Col xs={24} sm={24} md={12}>
            <Text>Education Level</Text>
            <Input
              value={profile.education_level}
              onChange={(e) =>
                handleChange("education_level", e.target.value)
              }
            />
          </Col> */}
          <Col xs={24} sm={24} md={12}>
            <Text>Father Background</Text>
            <Input
              value={profile.father_background}
              onChange={(e) =>
                handleChange("father_background", e.target.value)
              }
              placeholder="Enter father background"
            />
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Text>Mother Background</Text>
            <Input
              value={profile.mother_background}
              onChange={(e) =>
                handleChange("mother_background", e.target.value)
              }
              placeholder="Enter mother background"
            />
          </Col>



          {/* <Col xs={24} sm={24} md={12}>
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
          </Col> */}

          <Col xs={24}>
            <Text>Expectations From Student / Parent</Text>
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
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  new_password: e.target.value,
                }))
              }
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
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  confirm_password: e.target.value,
                }))
              }
            />
          </Form.Item>

          <Button type="primary" block htmlType="submit" loading={passwordLoading}>
            Update Password
          </Button>

        </Form>
      </Modal>
    </div>
  );
};

export default StudentProfile;
