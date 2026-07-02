import React, { useState, useEffect } from "react";
import {
  Modal,
  Row,
  Col,
  Card,
  Typography,
  Divider,
  Input,
  message,
  Button,
  Space,
  Select,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { updateStudentProfile } from "../../../adminSlices/profileSlice";
import { fetchSubjects } from "../../../adminSlices/subjectSlice";
import { fetchHobbies } from "../../../adminSlices/hobbySlice";
import { fetchPackagesByMultiplePrograms } from "../../../adminSlices/packageSlice";


const { Title, Text } = Typography;

const StudentProfileModal = ({ open, onClose, student, loading }) => {
  const dispatch = useDispatch();

  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({});
  const [specializationOptions, setSpecializationOptions] = useState([]);
  const { subjectList } = useSelector((state) => state.subjects);
  const { hobbyList } = useSelector((state) => state.hobbies);
  const { programsData } = useSelector((state) => state.packages);


  useEffect(() => {
    if (open) {
      dispatch(fetchSubjects());
      dispatch(fetchHobbies());
    }
  }, [dispatch, open]);

  useEffect(() => {
    if (open && student?.program_packages?.length) {
      const programIds = [
        ...new Set(
          student.program_packages.map((item) => item.program_id)
        ),
      ];

      dispatch(fetchPackagesByMultiplePrograms(programIds));
    }
  }, [open, student, dispatch]);

  /* ================= SET DATA ================= */
  useEffect(() => {
    if (student) {
      const academic = student?.academic_history?.[0] || {};
      setFormData({

        // ✅ personal
        first_name: student.first_name || "",
        last_name: student.last_name || "",
        email: student.email || "",
        phone: student.phone || "",
        dob: student.dob || "",

        liked_subjects: student?.liked_subjects?.map((s) => s.id) || [],
        disliked_subjects: student?.disliked_subjects?.map((s) => s.id) || [],
        moderate_subjects: student?.moderate_subjects?.map((s) => s.id) || [],
        improvement_areas: student?.improvement_areas || "",
        hobbies: student?.hobbies?.map((h) => h.id) || [],

        study_class: student?.study_class || "",
        specialization: student?.specialization || "",
        previous_class_percentage: student?.previous_class_percentage || "",
        board_exam_year: student?.board_exam_year || "",
        school_college: student?.school_college || "",
        city: student?.city || "",
        stream: student?.stream?.stream_name || "",
        suggested_stream: student?.suggested_stream,

        coaching_entrance: academic?.coaching_entrance || "",
        current_class_percentage: academic?.current_class_percentage || "",
        board_name: academic?.board_name || "",
        special_notes: academic?.special_notes || "",

        parent_profession: student?.parent?.profession || "",
        father_background: student?.parent?.father_background || "",
        mother_background: student?.parent?.mother_background || "",
        expectations: student?.parent?.expectations_from_student || "",
      });
    }
  }, [student]);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    try {
      const payload = {
        liked_subject_ids: formData.liked_subjects,
        disliked_subject_ids: formData.disliked_subjects,
        moderate_subject_ids: formData.moderate_subjects,
        improvement_areas: formData.improvement_areas,
        hobby_ids: formData.hobbies,
        // coaching_entrance: formData.coaching_entrance,
        // current_class_percentage: formData.current_class_percentage,
        // board_name: formData.board_name,
        // special_notes: formData.special_notes,

        study_class: formData.study_class,
        specialization: formData.specialization,
        previous_class_percentage: formData.previous_class_percentage,
        board_exam_year: formData.board_exam_year,
        school_college: formData.school_college,
        city: formData.city,
        stream: formData.stream,
        suggested_stream: formData.suggested_stream,

        academic_history: [
          {
            coaching_entrance: formData.coaching_entrance,
            current_class_percentage: formData.current_class_percentage,
            board_name: formData.board_name,
            special_notes: formData.special_notes,
          },
        ],

        parent: {
          profession: formData.parent_profession,
          father_background: formData.father_background,
          mother_background: formData.mother_background,
          expectations_from_student: formData.expectations,
        },

      };

      await dispatch(
        updateStudentProfile({
          studentId: student.student_id,
          data: payload,
        })
      ).unwrap();

      message.success("Student profile updated successfully");

      setIsEdit(false);

      // ✅ CLOSE MODAL HERE
      onClose();

    } catch (err) {
      message.error(err?.message || "Update failed");
    }
  };

  useEffect(() => {
    if (open) {
      setIsEdit(false);
    }
  }, [open]);

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
  };

  useEffect(() => {
    if (formData.study_class) {
      setSpecializationOptions(
        specializationMap[formData.study_class] || []
      );
    }
  }, [formData.study_class]);

  return (
    <Modal
      title={null}
      open={open}
      centered
      onCancel={onClose}
      footer={
        !isEdit ? (
          <Button type="primary" onClick={() => setIsEdit(true)}>
            Edit
          </Button>
        ) : (
          <Space>
            <Button onClick={() => setIsEdit(false)}>
              Cancel
            </Button>
            <Button type="primary" onClick={handleSave} loading={loading}>
              Save
            </Button>
          </Space>
        )
      }
      width={900}
      confirmLoading={loading}

    >
      {/* HEADER */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          View Student Profile
        </Title>


      </div>

      <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>
        {/* ================= PERSONAL INFORMATION ================= */}
        <Card title="Personal Information" bordered={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>First Name</Text>
              <Input
                value={formData.first_name}
                disabled
                onChange={(e) =>
                  handleChange("first_name", e.target.value)
                }
              />
            </Col>

            <Col span={12}>
              <Text strong>Last Name</Text>
              <Input
                value={formData.last_name}
                disabled
                onChange={(e) =>
                  handleChange("last_name", e.target.value)
                }
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Email</Text>
              <Input
                value={formData.email}
                disabled
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Mobile Number</Text>
              <Input
                value={formData.phone}
                disabled
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Date of Birth</Text>
              <Input
                value={formData.dob}
                disabled
                onChange={(e) => handleChange("dob", e.target.value)}
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Program</Text>
              <Input
                value={
                  student?.program_packages?.length
                    ? student.program_packages.map(p => p.program_name).join(", ")
                    : "-"
                }
                disabled
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Package / Service</Text>
              <Input
                value={
                  student?.program_packages?.length
                    ? student.program_packages.map(p => p.package_name).join(", ")
                    : "-"
                }
                disabled
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Preferred Counselling Mode</Text>
              <Input
                value={student?.preferred_counselling_mode || "-"}
                disabled
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Joined On</Text>
              <Input
                value={
                  student?.created_at
                    ? new Date(student.created_at).toLocaleDateString()
                    : "-"
                }
                disabled
              />
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* ================= ACADEMIC DETAILS ================= */}
        <Card title="Academic Details" bordered={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Current Class</Text>
              <Select
                value={formData.study_class}
                disabled={!isEdit}
                style={{ width: "100%" }}
                onChange={(value) => {
                  handleChange("study_class", value);
                  handleChange("specialization", undefined); 
                }}
              >
                {classOptions.map((cls) => (
                  <Select.Option key={cls} value={cls}>
                    {cls}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col span={12}>
              <Text strong>Specialization</Text>
              <Select
                value={formData.specialization}
                disabled={!isEdit || specializationOptions.length === 0}
                style={{ width: "100%" }}
                onChange={(value) => handleChange("specialization", value)}
              >
                {specializationOptions.map((spec) => (
                  <Select.Option key={spec} value={spec}>
                    {spec}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Coaching / Entrance (if any)</Text>
              <Input
                value={
                  isEdit
                    ? formData.coaching_entrance
                    : student?.academic_history?.[0]?.coaching_entrance || "-"
                }
                disabled={!isEdit}
                onChange={(e) =>
                  handleChange("coaching_entrance", e.target.value)
                }
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Current Class Percentage</Text>
              <Input
                type="number"
                value={
                  isEdit
                    ? formData.current_class_percentage
                    : student?.academic_history?.[0]?.current_class_percentage || "-"
                }
                disabled={!isEdit}
                onChange={(e) =>
                  handleChange("current_class_percentage", e.target.value)
                }
              />
            </Col>

            <Col span={12}>
              <Text strong>Previous Class Percentage</Text>
              <Input
                value={isEdit ? formData.previous_class_percentage : student?.previous_class_percentage || "-"}
                disabled={!isEdit}
                onChange={(e) => handleChange("previous_class_percentage", e.target.value)}
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Year of giving Board</Text>
              <Input
                value={isEdit ? formData.board_exam_year : student?.board_exam_year || "-"}
                disabled={!isEdit}
                onChange={(e) => handleChange("board_exam_year", e.target.value)}
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Board Name</Text>
              <Input
                value={
                  isEdit
                    ? formData.board_name
                    : student?.academic_history?.[0]?.board_name || "-"
                }
                disabled={!isEdit}
                onChange={(e) =>
                  handleChange("board_name", e.target.value)
                }
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>School / College</Text>
              <Input
                value={isEdit ? formData.school_college : student?.school_college || "-"}
                disabled={!isEdit}
                onChange={(e) => handleChange("school_college", e.target.value)}
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>City / Area</Text>
              <Input
                value={isEdit ? formData.city : student?.city || "-"}
                disabled={!isEdit}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Current Stream </Text>
              <Input
                value={isEdit ? formData.stream : student?.stream?.stream_name || "-"}
                disabled
                onChange={(e) => handleChange("stream", e.target.value)}
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Subject / Stream (if any)</Text>

              <Input
                value={
                  isEdit
                    ? formData.suggested_stream
                    : student?.suggested_stream || "-"
                }
                disabled={!isEdit}
                onChange={(e) =>
                  handleChange("suggested_stream", e.target.value)
                }
                placeholder="Enter suggested subjects/stream"
              />
            </Col>

            {/* <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Subject / Stream (if any)</Text>
              <Input
                value={isEdit ? formData.stream : student?.stream?.stream_name || "-"}
                disabled={!isEdit}
                onChange={(e) => handleChange("stream", e.target.value)}
              />
            </Col> */}

            <Col span={24} style={{ marginTop: 15 }}>
              <Text strong>Special Notes by counsellor</Text>
              <Input.TextArea
                rows={3}
                value={
                  isEdit
                    ? formData.special_notes
                    : student?.academic_history?.[0]?.special_notes || "-"
                }
                disabled={!isEdit}
                onChange={(e) =>
                  handleChange("special_notes", e.target.value)
                }
              />
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* ================= SUBJECT PREFERENCES ================= */}
        <Card title="Subject Preferences" bordered={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Liked Subjects</Text>
              <Select
                mode="multiple"
                value={formData.liked_subjects}
                disabled={!isEdit}
                style={{ width: "100%" }}
                onChange={(v) => handleChange("liked_subjects", v)}
              >
                {subjectList?.map((sub) => (
                  <Select.Option
                    key={sub.id}
                    value={sub.id}
                    disabled={
                      formData.disliked_subjects?.includes(sub.id) ||
                      formData.moderate_subjects?.includes(sub.id)
                    }
                  >
                    {sub.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col span={12}>
              <Text strong>Disliked Subjects</Text>
              <Select
                mode="multiple"
                value={formData.disliked_subjects}
                disabled={!isEdit}
                style={{ width: "100%" }}
                onChange={(v) => handleChange("disliked_subjects", v)}
              >
                {subjectList?.map((sub) => (
                  <Select.Option
                    key={sub.id}
                    value={sub.id}
                    disabled={
                      formData.liked_subjects?.includes(sub.id) ||
                      formData.moderate_subjects?.includes(sub.id)
                    }
                  >
                    {sub.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Moderate Subjects</Text>
              <Select
                mode="multiple"
                value={formData.moderate_subjects}
                disabled={!isEdit}
                style={{ width: "100%" }}
                onChange={(v) => handleChange("moderate_subjects", v)}
              >
                {subjectList?.map((sub) => (
                  <Select.Option
                    key={sub.id}
                    value={sub.id}
                    disabled={
                      formData.liked_subjects?.includes(sub.id) ||
                      formData.disliked_subjects?.includes(sub.id)
                    }
                  >
                    {sub.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col span={24} style={{ marginTop: 15 }}>
              <Text strong>Improvement Areas</Text>
              <Input.TextArea
                rows={3}
                value={
                  isEdit
                    ? formData.improvement_areas
                    : student?.improvement_areas || "-"
                }
                disabled={!isEdit}
                onChange={(e) =>
                  handleChange("improvement_areas", e.target.value)
                }
              />
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* ================= HOBBIES ================= */}
        <Card title="Hobbies" bordered={false}>
          <Select
            mode="multiple"
            value={
              isEdit
                ? formData.hobbies
                : student?.hobbies?.map((h) => h.id)
            }
            disabled={!isEdit}
            style={{ width: "100%" }}
            onChange={(v) => handleChange("hobbies", v)}
          >
            {hobbyList?.map((hobby) => (
              <Select.Option key={hobby.id} value={hobby.id}>
                {hobby.name}
              </Select.Option>
            ))}
          </Select>
        </Card>

        <Divider />

        {/* ================= PARENT DETAILS ================= */}
        <Card title="Parent Details" bordered={false}>
          <Row gutter={16}>
            {/* <Col span={12}>
              <Text strong>Parent Name</Text>
              <Input value={student?.parent?.parent_name || "-"} disabled />
            </Col> */}

            <Col span={12}>
              <Text strong>Parent Profession</Text>
              <Input
                value={isEdit ? formData.parent_profession : student?.parent?.profession || "-"}
                disabled={!isEdit}
                onChange={(e) => handleChange("parent_profession", e.target.value)}
              />
            </Col>

            <Col span={12}>
              <Text strong>Father Background</Text>
              <Input
                value={isEdit ? formData.father_background : student?.parent?.father_background || "-"}
                disabled={!isEdit}
                onChange={(e) => handleChange("father_background", e.target.value)}
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Mother Background</Text>
              <Input
                value={isEdit ? formData.mother_background : student?.parent?.mother_background || "-"}
                disabled={!isEdit}
                onChange={(e) => handleChange("mother_background", e.target.value)}
              />
            </Col>

            <Col span={24} style={{ marginTop: 15 }}>
              <Text strong>Expectations from Student / Parent</Text>
              <Input.TextArea
                value={isEdit ? formData.expectations : student?.parent?.expectations_from_student || "-"}
                disabled={!isEdit}
                onChange={(e) => handleChange("expectations", e.target.value)}
              />
            </Col>
          </Row>
        </Card>
      </div>
    </Modal>
  );
};

export default StudentProfileModal;
